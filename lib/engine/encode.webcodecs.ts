import { registerAacEncoder } from "@mediabunny/aac-encoder";
import {
  ALL_FORMATS,
  BlobSource,
  BufferTarget,
  type Conversion,
  Conversion as ConversionClass,
  canEncodeAudio,
  Input,
  Mp4OutputFormat,
  Output,
  type VideoSample,
} from "mediabunny";
import { type EncodePlan, EngineError, type VideoMeta } from "./types";

export type EncodeResult = {
  blob: Blob;
  width: number;
  height: number;
  durationSec: number;
};

let aacRegistered = false;
async function ensureAacEncoder(): Promise<void> {
  if (aacRegistered) return;
  try {
    const native = await canEncodeAudio("aac");
    if (!native) registerAacEncoder();
  } catch {
    try {
      registerAacEncoder();
    } catch {
      // If even the fallback fails to register, audio transcode may fail later
      // and we'll fall through to the ffmpeg path.
    }
  }
  aacRegistered = true;
}

/**
 * Build a blurred-pad compositor as a Mediabunny `process` callback. Draws a
 * blurred, scaled "cover" background, then the sharp source "contained" on top
 * (never upscaled beyond native), onto a fixed target canvas.
 */
function makeBlurPadProcess(outW: number, outH: number) {
  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;

  return (sample: VideoSample): OffscreenCanvas => {
    if (!canvas || !ctx) {
      canvas = new OffscreenCanvas(outW, outH);
      ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
    }
    const sw = sample.displayWidth;
    const sh = sample.displayHeight;

    ctx.clearRect(0, 0, outW, outH);

    // Blurred background — scaled to cover the whole frame.
    const cover = Math.max(outW / sw, outH / sh);
    const bw = sw * cover;
    const bh = sh * cover;
    ctx.filter = "blur(24px) brightness(0.82)";
    sample.draw(ctx, (outW - bw) / 2, (outH - bh) / 2, bw, bh);
    ctx.filter = "none";

    // Sharp foreground — contained, never upscaled past native.
    const fit = Math.min(outW / sw, outH / sh, 1);
    const fw = sw * fit;
    const fh = sh * fit;
    sample.draw(ctx, (outW - fw) / 2, (outH - fh) / 2, fw, fh);

    return canvas;
  };
}

/**
 * Plain scale-to-fill compositor. Used for HDR sources on the non-pad path:
 * drawing an HDR VideoFrame onto a 2D (SDR) canvas makes the browser tone-map it
 * to SDR, which is far better than a naive 10-bit→8-bit conversion.
 */
function makeScaleProcess(outW: number, outH: number) {
  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;

  return (sample: VideoSample): OffscreenCanvas => {
    if (!canvas || !ctx) {
      canvas = new OffscreenCanvas(outW, outH);
      ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
    }
    sample.draw(ctx, 0, 0, outW, outH);
    return canvas;
  };
}

/**
 * Primary encoder: demux + decode + (scale/pad) + encode H.264 + mux to a
 * faststart MP4, all on-device via Mediabunny + WebCodecs.
 */
export async function encodeWebCodecs(
  file: File,
  meta: VideoMeta,
  plan: EncodePlan,
  onProgress: (fraction: number) => void,
  signal?: AbortSignal,
): Promise<EncodeResult> {
  if (signal?.aborted) throw new EngineError("CANCELLED");
  await ensureAacEncoder();

  const input = new Input({ formats: ALL_FORMATS, source: new BlobSource(file) });
  const output = new Output({
    format: new Mp4OutputFormat({ fastStart: "in-memory" }),
    target: new BufferTarget(),
  });

  let outW = meta.width || plan.targetWidth;
  let outH = meta.height || plan.targetHeight;

  let video: any;

  if (plan.fastPath) {
    // Remux / minimal re-encode: copy the compatible H.264 track when possible.
    video = { forceTranscode: false };
  } else if (plan.blurPad) {
    outW = plan.targetWidth;
    outH = plan.targetHeight;
    video = {
      codec: "avc",
      bitrate: plan.videoBitrate,
      keyFrameInterval: plan.keyFrameIntervalSec,
      forceTranscode: true,
      processedWidth: outW,
      processedHeight: outH,
      process: makeBlurPadProcess(outW, outH),
    };
    video.frameRate = plan.fps; // force constant frame rate (platforms expect CFR)
  } else {
    outW = plan.targetWidth;
    outH = plan.targetHeight;
    video = {
      codec: "avc",
      bitrate: plan.videoBitrate,
      keyFrameInterval: plan.keyFrameIntervalSec,
      forceTranscode: true,
      // Bake source rotation into pixels rather than emitting a rotation flag —
      // social platforms don't reliably honor rotation metadata on re-encode.
      allowRotationMetadata: false,
    };
    if (meta.isHdr) {
      // Tone-map HDR → SDR by compositing through a 2D canvas.
      video.process = makeScaleProcess(outW, outH);
      video.processedWidth = outW;
      video.processedHeight = outH;
    } else {
      video.width = outW;
      video.height = outH;
      video.fit = "fill";
    }
    video.frameRate = plan.fps; // force constant frame rate (platforms expect CFR)
  }

  const audio: any = plan.audio
    ? {
        codec: "aac",
        bitrate: plan.audio.bitrate,
        sampleRate: plan.audio.sampleRate,
        ...(plan.fastPath ? {} : { forceTranscode: true }),
      }
    : { discard: true };

  const opts: any = { input, output, video, audio };
  if (plan.trim) opts.trim = { start: plan.trim.start, end: plan.trim.end };
  else if (plan.trimToSec) opts.trim = { start: 0, end: plan.trimToSec };

  let conversion: Conversion;
  try {
    conversion = await ConversionClass.init(opts);
  } catch (err) {
    safeDispose(input);
    throw new EngineError("ENCODE_FAILED", "Could not initialize the encoder.", { cause: err });
  }

  if (!conversion.isValid) {
    safeDispose(input);
    throw new EngineError(
      "UNSUPPORTED_CODEC",
      "This file can't be converted with the fast engine.",
    );
  }

  conversion.onProgress = (p: number) => {
    onProgress(typeof p === "number" ? p : 0);
  };

  const onAbort = () => {
    try {
      conversion.cancel();
    } catch {
      // ignore
    }
  };
  signal?.addEventListener("abort", onAbort, { once: true });

  try {
    await conversion.execute();
  } catch (err) {
    if (signal?.aborted) throw new EngineError("CANCELLED");
    throw new EngineError("ENCODE_FAILED", "Encoding failed.", { cause: err });
  } finally {
    signal?.removeEventListener("abort", onAbort);
  }

  if (signal?.aborted) throw new EngineError("CANCELLED");

  const buffer = output.target.buffer;
  safeDispose(input);
  if (!buffer || buffer.byteLength === 0) {
    throw new EngineError("ENCODE_FAILED", "The encoder produced an empty file.");
  }

  const durationSec = plan.trim
    ? plan.trim.end - plan.trim.start
    : (plan.trimToSec ?? meta.durationSec);

  return {
    blob: new Blob([buffer], { type: "video/mp4" }),
    width: outW,
    height: outH,
    durationSec,
  };
}

function safeDispose(input: Input): void {
  try {
    input.dispose?.();
  } catch {
    // ignore
  }
}
