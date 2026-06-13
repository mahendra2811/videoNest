import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import type { EncodeResult } from "./encode.webcodecs";
import { type EncodePlan, EngineError, type VideoMeta } from "./types";

// Self-hosted single-threaded core (no SharedArrayBuffer required).
const CORE_URL = "/ffmpeg/ffmpeg-core.js";
const WASM_URL = "/ffmpeg/ffmpeg-core.wasm";

let ffmpeg: FFmpeg | null = null;
let loadPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(): Promise<FFmpeg> {
  if (ffmpeg) return ffmpeg;
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    const instance = new FFmpeg();
    try {
      await instance.load({ coreURL: CORE_URL, wasmURL: WASM_URL });
    } catch (err) {
      loadPromise = null;
      throw new EngineError("UNSUPPORTED_BROWSER", "Could not load the fallback encoder.", {
        cause: err,
      });
    }
    ffmpeg = instance;
    return instance;
  })();

  return loadPromise;
}

function inputExtension(meta: VideoMeta, name: string): string {
  const fromName = name.split(".").pop()?.toLowerCase();
  if (fromName && /^[a-z0-9]{2,4}$/.test(fromName)) return fromName;
  const c = meta.container.toLowerCase();
  if (c.includes("mp4") || c.includes("mov") || c.includes("isobmff")) return "mp4";
  if (c.includes("webm") || c.includes("matroska")) return "webm";
  return "bin";
}

/** Light, fixed unsharp mask (A5). Mirrors the spec's recommended strength. */
const UNSHARP = "unsharp=5:5:0.4:5:5:0.0";

/** Build the -vf filtergraph for the plan (Lanczos downscale, fit/fill, sharpen). */
function buildVideoFilter(plan: EncodePlan): string {
  let graph: string;
  if (plan.blurPad) {
    // Fit: sharp source contained over a blurred cover copy.
    const w = plan.targetWidth;
    const h = plan.targetHeight;
    graph = [
      "split=2[bg][fg]",
      `[bg]scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,crop=${w}:${h},boxblur=20:3,eq=brightness=-0.06[bgb]`,
      `[fg]scale=${w}:${h}:force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos[fgs]`,
      "[bgb][fgs]overlay=(W-w)/2:(H-h)/2:format=auto,setsar=1",
    ].join(";");
  } else if (plan.aspectMode === "fill" || plan.cropRect) {
    // Fill: crop-to-fill the target box (optionally a chosen region), Lanczos.
    const w = plan.targetWidth;
    const h = plan.targetHeight;
    if (plan.cropRect) {
      const { x, y, width, height } = plan.cropRect;
      graph =
        `crop=iw*${width}:ih*${height}:iw*${x}:ih*${y},` + `scale=${w}:${h}:flags=lanczos,setsar=1`;
    } else {
      graph =
        `scale=${w}:${h}:force_original_aspect_ratio=increase:flags=lanczos,` +
        `crop=${w}:${h},setsar=1`;
    }
  } else {
    // Downscale-only, even dimensions, never upscale, Lanczos resampler (A4).
    graph = `scale=w='min(${plan.targetWidth},iw)':h='min(${plan.targetHeight},ih)':force_original_aspect_ratio=decrease:force_divisible_by=2:flags=lanczos,setsar=1`;
  }
  if (plan.sharpen) graph += `,${UNSHARP}`;
  return graph;
}

/**
 * Fallback encoder using ffmpeg.wasm. Implements the same plan as the WebCodecs
 * path (scale/pad, x264 High yuv420p, 2s GOP, AAC, faststart). Lazy-loaded.
 */
export async function encodeFfmpeg(
  file: File,
  meta: VideoMeta,
  plan: EncodePlan,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<EncodeResult> {
  if (signal?.aborted) throw new EngineError("CANCELLED");

  const instance = await getFFmpeg();
  if (signal?.aborted) throw new EngineError("CANCELLED");

  const inExt = inputExtension(meta, file.name);
  const inName = `input.${inExt}`;
  const outName = "output.mp4";

  const progressHandler = ({ progress }: { progress: number }) => {
    if (Number.isFinite(progress)) {
      onProgress(Math.min(Math.max(progress, 0), 1));
    }
  };
  instance.on("progress", progressHandler);

  const onAbort = () => {
    try {
      instance.terminate();
    } catch {
      // ignore
    }
    // A terminated instance can't be reused.
    ffmpeg = null;
    loadPromise = null;
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    await instance.writeFile(inName, await fetchFile(file));

    const gop = Math.max(2, Math.round(plan.keyFrameIntervalSec * plan.fps));
    const args: string[] = [];
    // Trim window (segment) takes precedence over a simple head trim. `-ss`
    // before `-i` seeks fast; `-t` bounds the segment length.
    if (plan.trim) {
      args.push("-ss", String(plan.trim.start));
      args.push("-t", String(plan.trim.end - plan.trim.start));
    } else if (plan.trimToSec) {
      args.push("-t", String(plan.trimToSec));
    }
    args.push("-i", inName);
    args.push("-vf", buildVideoFilter(plan));
    args.push("-r", String(plan.fps));
    args.push("-c:v", "libx264", "-profile:v", "high", "-pix_fmt", "yuv420p");
    args.push("-preset", "veryfast", "-crf", "20");
    args.push("-maxrate", String(plan.videoBitrate));
    args.push("-bufsize", String(plan.videoBitrate * 2));
    args.push("-g", String(gop), "-keyint_min", String(gop), "-sc_threshold", "0");
    if (plan.audio) {
      // Loudness-normalize only when the user opted in (A6). Platforms normalize
      // on their side, so it stays off by default.
      if (plan.normalizeLoudness) {
        args.push("-af", "loudnorm=I=-14:TP=-1.5:LRA=11");
      }
      args.push("-c:a", "aac", "-b:a", `${Math.round(plan.audio.bitrate / 1000)}k`);
      args.push("-ar", String(plan.audio.sampleRate));
    } else {
      args.push("-an");
    }
    args.push("-movflags", "+faststart");
    args.push("-y", outName);

    const code = await instance.exec(args);
    if (signal?.aborted) throw new EngineError("CANCELLED");
    if (code !== 0) {
      throw new EngineError("ENCODE_FAILED", "The fallback encoder failed on this file.");
    }

    const data = await instance.readFile(outName);
    const bytes = data instanceof Uint8Array ? data : new TextEncoder().encode(String(data));
    // Copy into a fresh ArrayBuffer-backed view (readFile may return a
    // SharedArrayBuffer-backed Uint8Array, which Blob's types reject).
    const copy = new Uint8Array(bytes.byteLength);
    copy.set(bytes);
    const blob = new Blob([copy], { type: "video/mp4" });

    // Cleanup virtual FS (best effort).
    try {
      await instance.deleteFile(inName);
      await instance.deleteFile(outName);
    } catch {
      // ignore
    }

    return {
      blob,
      width: plan.targetWidth,
      height: plan.targetHeight,
      durationSec: plan.trim
        ? plan.trim.end - plan.trim.start
        : (plan.trimToSec ?? meta.durationSec),
    };
  } catch (err) {
    if (err instanceof EngineError) throw err;
    if (signal?.aborted) throw new EngineError("CANCELLED");
    throw new EngineError("ENCODE_FAILED", "Fallback encoding failed.", { cause: err });
  } finally {
    instance.off?.("progress", progressHandler);
    signal?.removeEventListener("abort", onAbort);
  }
}
