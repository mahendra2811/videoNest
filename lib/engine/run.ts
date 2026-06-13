import { requireProfile } from "@/lib/config/profiles";
import { canUseWebCodecs, resolveSupportedCodec } from "./capabilities";
import { encodeFfmpeg, mixAudioTrack } from "./encode.ffmpeg";
import { type EncodeResult, encodeWebCodecs } from "./encode.webcodecs";
import { buildPlan, computeSegments } from "./plan";
import { probe } from "./probe";
import {
  type EncodeOptions,
  type EncodePlan,
  EngineError,
  type EnginePath,
  INPUT_LIMITS,
  type OnProgress,
  type OptimizeResult,
  type SegmentInfo,
  type VideoMeta,
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

/** Encode one plan with the WebCodecs → OOM-retry → ffmpeg fallback chain. */
async function encodeWithFallback(
  file: File,
  meta: VideoMeta,
  plan: EncodePlan,
  onProgress: (fraction: number) => void,
  signal: AbortSignal | undefined,
  wcSupported: boolean,
): Promise<{ result: EncodeResult; plan: EncodePlan; path: EnginePath }> {
  // Sharpen (unsharp) and loudness-normalize (loudnorm) are implemented in the
  // ffmpeg filtergraph; route those opt-in jobs straight to ffmpeg. The fast
  // default path (no edits) stays on WebCodecs.
  const mustUseFfmpeg = plan.sharpen || plan.normalizeLoudness;

  if (wcSupported && !mustUseFfmpeg) {
    try {
      const result = await encodeWebCodecs(file, meta, plan, onProgress, signal);
      return { result, plan, path: "webcodecs" };
    } catch (err) {
      if (err instanceof EngineError && err.code === "CANCELLED") throw err;
      if (looksLikeOom(err)) {
        const reduced = reducePlan(plan);
        try {
          const result = await encodeWebCodecs(file, meta, reduced, onProgress, signal);
          return { result, plan: reduced, path: "webcodecs" };
        } catch (err2) {
          if (err2 instanceof EngineError && err2.code === "CANCELLED") throw err2;
        }
      }
      // fall through to ffmpeg
    }
  }

  try {
    const result = await encodeFfmpeg(file, meta, plan, onProgress, signal);
    return { result, plan, path: "ffmpeg" };
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

/**
 * Full pipeline: probe → plan → choose path → encode. Emits real progress.
 * Returns one OptimizeResult per output file: a single result normally, or one
 * per segment when the profile splits over-duration sources (e.g. WhatsApp).
 */
export async function runOptimize(
  file: File,
  profileId: string,
  onProgress: OnProgress,
  signal?: AbortSignal,
  options: EncodeOptions = {},
): Promise<OptimizeResult[]> {
  if (signal?.aborted) throw new EngineError("CANCELLED");

  if (file.size > INPUT_LIMITS.maxFileBytes) {
    throw new EngineError("TOO_LARGE", "This file is larger than the 500 MB limit.");
  }

  onProgress({ stage: "analyzing", value: 0.02, label: "Analyzing" });
  const meta = await probe(file);

  if (meta.durationSec > INPUT_LIMITS.maxDurationSec) {
    throw new EngineError("TOO_LONG", "This video is longer than the 10 minute limit.");
  }

  const profile = requireProfile(profileId);
  let basePlan = buildPlan(meta, profile, options);
  onProgress({ stage: "analyzing", value: 0.05, label: "Analyzing" });

  const wcSupported = await canUseWebCodecs(basePlan);

  // Downgrade the codec to H.264 if the preferred one (AV1/HEVC) isn't
  // encodable here (A3). Done once against the base plan.
  if (basePlan.videoCodec !== "avc") {
    const codec = await resolveSupportedCodec(basePlan);
    if (codec !== basePlan.videoCodec) basePlan = { ...basePlan, videoCodec: codec };
  }

  const splitting =
    Boolean(profile.splitOversize) && meta.durationSec > profile.maxDurationSec + 0.05;
  const windows = splitting ? computeSegments(meta.durationSec, profile.maxDurationSec) : [null];
  const total = windows.length;

  const makeResult = (
    res: EncodeResult,
    usedPlan: EncodePlan,
    path: EnginePath,
    part?: SegmentInfo,
  ): OptimizeResult => {
    const filename = part
      ? `videonest-${profile.id}-part${part.index + 1}of${part.total}.mp4`
      : `videonest-${profile.id}.mp4`;
    return {
      blob: res.blob,
      meta,
      plan: usedPlan,
      path,
      part,
      output: {
        width: res.width,
        height: res.height,
        durationSec: res.durationSec,
        sizeBytes: res.blob.size,
        filename,
      },
    };
  };

  const results: OptimizeResult[] = [];

  for (let i = 0; i < total; i++) {
    const window = windows[i];

    // Per-segment progress mapped into the [0.05, 0.95] optimizing band.
    const segmentProgress = (fraction: number) => {
      const f = Math.min(Math.max(fraction, 0), 1);
      const overall = 0.05 + ((i + f) / total) * 0.9;
      onProgress({
        stage: "optimizing",
        value: overall,
        label: total > 1 ? `Part ${i + 1} of ${total}` : "Optimizing",
      });
    };

    let plan = basePlan;
    let part: SegmentInfo | undefined;
    if (window) {
      const segDuration = window.end - window.start;
      const segPlan = buildPlan({ ...meta, durationSec: segDuration }, profile, options);
      plan = {
        ...segPlan,
        videoCodec: basePlan.videoCodec,
        fastPath: false,
        trimToSec: undefined,
        trim: { start: window.start, end: window.end },
        notes: [...segPlan.notes, `Segment ${i + 1} of ${total}`],
      };
      part = { index: i, total, startSec: window.start, endSec: window.end };
    }

    const enc = await encodeWithFallback(file, meta, plan, segmentProgress, signal, wcSupported);

    // Background-music / replace-audio second pass (B3). Single-output only —
    // we don't mix a track across auto-split WhatsApp segments.
    if (!window && enc.plan.audioMix && options.musicFile) {
      onProgress({ stage: "finishing", value: 0.96, label: "Adding audio" });
      const mixed = await mixAudioTrack(
        enc.result.blob,
        options.musicFile,
        enc.plan.audioMix,
        enc.plan,
        signal,
      );
      enc.result = { ...enc.result, blob: mixed };
    }

    results.push(makeResult(enc.result, enc.plan, enc.path, part));
  }

  onProgress({ stage: "finishing", value: 0.99, label: "Finishing" });
  return results;
}
