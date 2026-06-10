import type { EncodePlan, PlatformProfile, VideoMeta } from "./types";

/** Target aspect ratios as width/height. */
const ASPECT_RATIOS: Record<PlatformProfile["aspect"], number | null> = {
  "9:16": 9 / 16,
  "16:9": 16 / 9,
  source: null,
};

/** Tolerance for "already the right aspect ratio" (absolute on w/h ratio). */
const ASPECT_TOLERANCE = 0.02;

/**
 * Split a duration into sequential windows of at most `maxSec` each. Pure and
 * unit-tested. A final remainder shorter than `maxSec` becomes its own segment.
 * Returns a single full-length window when the source already fits.
 */
export function computeSegments(
  durationSec: number,
  maxSec: number,
): { start: number; end: number }[] {
  if (!Number.isFinite(durationSec) || durationSec <= 0 || maxSec <= 0) {
    return [{ start: 0, end: Math.max(durationSec, 0) }];
  }
  if (durationSec <= maxSec + 0.05) {
    return [{ start: 0, end: durationSec }];
  }
  const count = Math.ceil(durationSec / maxSec);
  const segments: { start: number; end: number }[] = [];
  for (let i = 0; i < count; i++) {
    const start = i * maxSec;
    const end = Math.min((i + 1) * maxSec, durationSec);
    if (end - start > 0.1) segments.push({ start, end });
  }
  return segments;
}

/** H.264 / yuv420p requires even dimensions. */
function roundEven(n: number): number {
  return Math.max(2, Math.round(n / 2) * 2);
}

function isH264(codec: string): boolean {
  return /^(h\.?264|avc|avc1)/i.test(codec.trim());
}

function isYuv420(pixfmt: string): boolean {
  // Treat unknown pixel format as acceptable — most consumer video is 4:2:0.
  if (!pixfmt) return true;
  return /(yuv)?420|nv12/i.test(pixfmt);
}

/**
 * buildPlan — the decision tree from spec §3. Pure and deterministic so it can
 * be unit-tested without a browser. Produces concrete output parameters from
 * the probed metadata and the platform profile.
 */
export function buildPlan(meta: VideoMeta, profile: PlatformProfile): EncodePlan {
  const notes: string[] = [];

  // --- Duration / trim ------------------------------------------------------
  const hasDuration = Number.isFinite(meta.durationSec) && meta.durationSec > 0;
  const overDuration = hasDuration && meta.durationSec > profile.maxDurationSec + 0.05;
  const effectiveDurationSec = overDuration
    ? profile.maxDurationSec
    : hasDuration
      ? meta.durationSec
      : profile.maxDurationSec;
  const trimToSec = overDuration ? profile.maxDurationSec : undefined;
  if (overDuration) {
    notes.push(`Trimmed to the first ${profile.maxDurationSec}s`);
  }

  // --- Frame rate -----------------------------------------------------------
  const srcFps = Number.isFinite(meta.fps) && meta.fps > 0 ? meta.fps : 0;
  const fps = srcFps > 0 ? Math.min(Math.round(srcFps), profile.fpsCap) : profile.fpsCap;
  const capFps = srcFps > profile.fpsCap + 0.5;
  if (capFps) notes.push(`Capped to ${profile.fpsCap}fps`);

  // --- Resolution / aspect --------------------------------------------------
  const srcW = meta.width > 0 ? meta.width : profile.maxWidth;
  const srcH = meta.height > 0 ? meta.height : profile.maxHeight;
  const srcAspect = srcW / srcH;

  const targetRatio = ASPECT_RATIOS[profile.aspect];
  const needsAspect = targetRatio !== null;
  const matchesAspect =
    targetRatio === null || Math.abs(srcAspect - targetRatio) <= ASPECT_TOLERANCE;

  let targetWidth: number;
  let targetHeight: number;
  let blurPad = false;

  if (!needsAspect || matchesAspect) {
    // Downscale-only to fit within the profile box; never upscale.
    const scale = Math.min(profile.maxWidth / srcW, profile.maxHeight / srcH, 1);
    targetWidth = roundEven(srcW * scale);
    targetHeight = roundEven(srcH * scale);
    if (scale < 1) notes.push(`Downscaled to ${targetWidth}×${targetHeight}`);
  } else {
    // Pad to the target aspect using a blurred, scaled copy as background.
    blurPad = true;
    targetWidth = roundEven(profile.maxWidth);
    targetHeight = roundEven(profile.maxHeight);
    notes.push(`Padded to ${profile.aspect} with a blurred background`);
  }

  // --- Bitrate / size budget ------------------------------------------------
  const sizeCapMB = profile.sizeCapMB ?? (profile.bitrateStrategy === "constrained" ? 15 : 0);
  const sizeCapBytes = sizeCapMB > 0 ? sizeCapMB * 1024 * 1024 : 0;
  const audioBitrate = meta.hasAudio ? profile.audio.bitrateKbps * 1000 : 0;

  let videoBitrate: number;
  if (profile.bitrateStrategy === "constrained" && sizeCapBytes > 0) {
    // Constrained VBR: fill the size budget, capped at a near-visually-lossless
    // ceiling so short clips don't bloat. Safety margin covers container +
    // VBR overshoot so we stay comfortably under the cap.
    const safety = 0.92;
    const totalBudget = (sizeCapBytes * 8 * safety) / effectiveDurationSec;
    const videoBudget = Math.max(totalBudget - audioBitrate, 800_000);
    const ceiling = 10_000_000; // ~10 Mbps ≈ visually lossless at 1080p
    videoBitrate = Math.min(videoBudget, ceiling);
  } else {
    // Overprovision: aim for a high, quality-first target scaled by pixel rate,
    // then clamp to a sane range. If the platform states a size cap, never
    // exceed the budget it implies for this (possibly trimmed) duration.
    const perPixel = 0.1;
    let raw = targetWidth * targetHeight * fps * perPixel;
    raw = Math.min(Math.max(raw, 4_000_000), 20_000_000);
    if (sizeCapBytes > 0) {
      const budget = (sizeCapBytes * 8 * 0.92) / effectiveDurationSec - audioBitrate;
      if (budget > 800_000) raw = Math.min(raw, budget);
    }
    videoBitrate = raw;
  }
  videoBitrate = Math.round(videoBitrate);

  // --- Already-optimal fast path -------------------------------------------
  const fitsBox = srcW <= profile.maxWidth && srcH <= profile.maxHeight;
  const fpsOk = srcFps === 0 || srcFps <= profile.fpsCap + 0.5;
  const sizeOk = sizeCapBytes === 0 || (meta.sizeBytes > 0 && meta.sizeBytes < sizeCapBytes);
  const aspectOk = !needsAspect || matchesAspect;
  const fastPath =
    isH264(meta.vcodec) &&
    isYuv420(meta.pixfmt) &&
    fitsBox &&
    fpsOk &&
    aspectOk &&
    !overDuration &&
    sizeOk;
  if (fastPath) notes.push("Source already optimal — minimal re-encode");

  // --- Audio ----------------------------------------------------------------
  const audio = meta.hasAudio
    ? { codec: "aac" as const, bitrate: profile.audio.bitrateKbps * 1000, sampleRate: 48_000 }
    : null;

  return {
    targetWidth,
    targetHeight,
    blurPad,
    fps,
    trimToSec,
    fastPath,
    videoBitrate,
    audio,
    keyFrameIntervalSec: 2,
    effectiveDurationSec,
    sizeCapBytes,
    notes,
  };
}
