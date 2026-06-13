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

/** Enable the browser's best 2D resampler on a context. */
function setHq(ctx: OffscreenCanvasRenderingContext2D): void {
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
}

/** Map our codec choice to a Mediabunny video codec id. */
function mediabunnyCodec(codec: "avc" | "av1" | "hevc"): "avc" | "av1" | "hevc" {
  return codec;
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
      setHq(ctx);
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
 * Plain scale compositor with a high-quality, stepped-halving downscaler (A4):
 * for large downscale ratios we repeatedly halve through a scratch canvas,
 * which approximates Lanczos far better than a single bilinear draw and reduces
 * aliasing. Also used for HDR sources (drawing onto a 2D/SDR canvas tone-maps).
 */
function makeScaleProcess(outW: number, outH: number) {
  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;
  let scratch: OffscreenCanvas | null = null;
  let sctx: OffscreenCanvasRenderingContext2D | null = null;

  return (sample: VideoSample): OffscreenCanvas => {
    if (!canvas || !ctx) {
      canvas = new OffscreenCanvas(outW, outH);
      ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
      setHq(ctx);
    }
    const sw = sample.displayWidth;
    const sh = sample.displayHeight;

    if (sw >= outW * 2 || sh >= outH * 2) {
      // Stepped halving: first draw into a scratch at the largest needed size.
      let curW = Math.max(outW, Math.round(sw / 2));
      let curH = Math.max(outH, Math.round(sh / 2));
      if (!scratch || !sctx || scratch.width < curW || scratch.height < curH) {
        scratch = new OffscreenCanvas(curW, curH);
        sctx = scratch.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
        setHq(sctx);
      }
      sctx.clearRect(0, 0, scratch.width, scratch.height);
      sample.draw(sctx, 0, 0, curW, curH);
      while (curW > outW * 2 || curH > outH * 2) {
        const nextW = Math.max(outW, Math.round(curW / 2));
        const nextH = Math.max(outH, Math.round(curH / 2));
        sctx.drawImage(scratch, 0, 0, curW, curH, 0, 0, nextW, nextH);
        curW = nextW;
        curH = nextH;
      }
      ctx.drawImage(scratch, 0, 0, curW, curH, 0, 0, outW, outH);
    } else {
      sample.draw(ctx, 0, 0, outW, outH);
    }
    return canvas;
  };
}

/**
 * Crop-to-fill compositor (editor "Fill" / manual crop, B1). Scales the source
 * (optionally a normalized crop region) to cover the target box and centers it;
 * the canvas clips the overflow.
 */
function makeFillProcess(
  outW: number,
  outH: number,
  cropRect?: { x: number; y: number; width: number; height: number },
) {
  let canvas: OffscreenCanvas | null = null;
  let ctx: OffscreenCanvasRenderingContext2D | null = null;

  return (sample: VideoSample): OffscreenCanvas => {
    if (!canvas || !ctx) {
      canvas = new OffscreenCanvas(outW, outH);
      ctx = canvas.getContext("2d", { alpha: false }) as OffscreenCanvasRenderingContext2D;
      setHq(ctx);
    }
    const sw = sample.displayWidth;
    const sh = sample.displayHeight;
    const rx = cropRect ? cropRect.x * sw : 0;
    const ry = cropRect ? cropRect.y * sh : 0;
    const rw = cropRect ? cropRect.width * sw : sw;
    const rh = cropRect ? cropRect.height * sh : sh;

    ctx.clearRect(0, 0, outW, outH);
    const cover = Math.max(outW / rw, outH / rh);
    // Draw the full frame scaled by `cover`, positioned so the crop region's
    // centre lands at the canvas centre.
    const dw = sw * cover;
    const dh = sh * cover;
    const dx = outW / 2 - (rx + rw / 2) * cover;
    const dy = outH / 2 - (ry + rh / 2) * cover;
    sample.draw(ctx, dx, dy, dw, dh);
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

  const codec = mediabunnyCodec(plan.videoCodec);

  if (plan.fastPath) {
    // Remux / minimal re-encode: copy the compatible H.264 track when possible.
    video = { forceTranscode: false };
  } else if (plan.blurPad) {
    outW = plan.targetWidth;
    outH = plan.targetHeight;
    video = {
      codec,
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
      codec,
      bitrate: plan.videoBitrate,
      keyFrameInterval: plan.keyFrameIntervalSec,
      forceTranscode: true,
      // Bake source rotation into pixels rather than emitting a rotation flag —
      // social platforms don't reliably honor rotation metadata on re-encode.
      allowRotationMetadata: false,
    };
    if (plan.aspectMode === "fill" || plan.cropRect) {
      // Crop-to-fill / manual reframe (B1).
      video.process = makeFillProcess(outW, outH, plan.cropRect);
      video.processedWidth = outW;
      video.processedHeight = outH;
    } else if (plan.hqDownscale || meta.isHdr) {
      // High-quality stepped downscale (A4) and/or HDR→SDR tone-map.
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
