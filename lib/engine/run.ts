import { requireProfile } from "@/lib/config/profiles";
import { canUseWebCodecs } from "./capabilities";
import { encodeFfmpeg } from "./encode.ffmpeg";
import { type EncodeResult, encodeWebCodecs } from "./encode.webcodecs";
import { buildPlan } from "./plan";
import { probe } from "./probe";
import {
  type EncodePlan,
  EngineError,
  type EnginePath,
  INPUT_LIMITS,
  type OnProgress,
  type OptimizeResult,
} from "./types";

function roundEven(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

/** Reduce a plan for an OOM retry: smaller frame + lower bitrate. */
function reducePlan(plan: EncodePlan): EncodePlan {
  const f = 0.7;
  return {
    ...plan,
    targetWidth: roundEven(plan.targetWidth * f),
    targetHeight: roundEven(plan.targetHeight * f),
    videoBitrate: Math.round(plan.videoBitrate * 0.6),
    fastPath: false,
    notes: [...plan.notes, "Retried at a lower resolution"],
  };
}

function looksLikeOom(err: unknown): boolean {
  const msg = err instanceof Error ? `${err.message} ${err.cause ?? ""}` : String(err);
  return /memory|allocat|oom|out of memory|rangeerror/i.test(msg);
}

/**
 * Full pipeline: probe → plan → choose path → encode. Emits real progress.
 * Tries WebCodecs first, retries once smaller on OOM, then falls back to
 * ffmpeg.wasm. Throws a typed EngineError on failure.
 */
export async function runOptimize(
  file: File,
  profileId: string,
  onProgress: OnProgress,
  signal?: AbortSignal,
): Promise<OptimizeResult> {
  if (signal?.aborted) throw new EngineError("CANCELLED");

  // Hard input guards (also enforced at selection).
  if (file.size > INPUT_LIMITS.maxFileBytes) {
    throw new EngineError("TOO_LARGE", "This file is larger than the 500 MB limit.");
  }

  onProgress({ stage: "analyzing", value: 0.02, label: "Analyzing your video" });
  const meta = await probe(file);

  if (meta.durationSec > INPUT_LIMITS.maxDurationSec) {
    throw new EngineError("TOO_LONG", "This video is longer than the 10 minute limit.");
  }

  const profile = requireProfile(profileId);
  const plan = buildPlan(meta, profile);
  onProgress({ stage: "analyzing", value: 0.05, label: "Planning the optimization" });

  const encodeProgress = (fraction: number) =>
    onProgress({
      stage: "optimizing",
      value: 0.05 + Math.min(Math.max(fraction, 0), 1) * 0.9,
      label: "Optimizing on your device",
    });

  const finalize = (res: EncodeResult, usedPlan: EncodePlan, path: EnginePath): OptimizeResult => {
    onProgress({ stage: "finishing", value: 0.99, label: "Finishing up" });
    return {
      blob: res.blob,
      meta,
      plan: usedPlan,
      path,
      output: {
        width: res.width,
        height: res.height,
        durationSec: res.durationSec,
        sizeBytes: res.blob.size,
        filename: "videonest-whatsapp-status.mp4",
      },
    };
  };

  const wcSupported = await canUseWebCodecs(plan);

  if (wcSupported) {
    try {
      const res = await encodeWebCodecs(file, meta, plan, encodeProgress, signal);
      return finalize(res, plan, "webcodecs");
    } catch (err) {
      if (err instanceof EngineError && err.code === "CANCELLED") throw err;

      // OOM → one automatic retry at a lower resolution.
      if (looksLikeOom(err)) {
        const reduced = reducePlan(plan);
        try {
          const res = await encodeWebCodecs(file, meta, reduced, encodeProgress, signal);
          return finalize(res, reduced, "webcodecs");
        } catch (err2) {
          if (err2 instanceof EngineError && err2.code === "CANCELLED") throw err2;
          // fall through to ffmpeg
        }
      }
      // Any other WebCodecs failure → try the ffmpeg fallback below.
    }
  }

  // ffmpeg.wasm fallback (also the path when WebCodecs is unsupported).
  try {
    const res = await encodeFfmpeg(file, meta, plan, encodeProgress, signal);
    return finalize(res, plan, "ffmpeg");
  } catch (err) {
    if (err instanceof EngineError) throw err;
    if (!wcSupported) {
      throw new EngineError("UNSUPPORTED_BROWSER", "Your browser can't process video here.", {
        cause: err,
      });
    }
    throw new EngineError("ENCODE_FAILED", "We couldn't process this video.", { cause: err });
  }
}
