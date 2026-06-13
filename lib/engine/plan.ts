import type {
  EncodeOptions,
  EncodePlan,
  PlatformProfile,
  VideoCodecChoice,
  VideoMeta,
} from "./types";

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

/** Quality-ceiling long edge (px) for the YouTube quality selector. */
const YT_QUALITY_LONG_EDGE: Record<NonNullable<EncodeOptions["youtubeQuality"]>, number> = {
  "1080p": 1080,
  "1440p": 1440,
  "4K": 2160,
};

/** Resolve the output codec from the profile's allow-list + the user's choice. */
function resolveCodec(profile: PlatformProfile, options: EncodeOptions): VideoCodecChoice {
  const allowed = profile.codecOptions ?? ["avc"];
  const requested = options.videoCodec ?? allowed[0] ?? "avc";
  return allowed.includes(requested) ? requested : "avc";
}

/**
 * buildPlan — the decision tree from spec §3. Pure and deterministic so it can
 * be unit-tested without a browser. Produces concrete output parameters from
 * the probed metadata, the platform profile, and the per-run user options.
 */
export function buildPlan(
  meta: VideoMeta,
  profile: PlatformProfile,
  options: EncodeOptions = {},
): EncodePlan {
  const notes: string[] = [];
  const measured = profile.measuredOutput;

  // --- Effective box / fps cap ---------------------------------------------
  // Start from the profile box, then narrow it for: a real measured output
  // (A1), and the YouTube quality selector (A3). Always downscale-only.
  let boxW = profile.maxWidth;
  let boxH = profile.maxHeight;
  let fpsCap = profile.fpsCap;

  if (measured) {
    boxW = Math.min(boxW, measured.width);
    boxH = Math.min(boxH, measured.height);
    fpsCap = Math.min(fpsCap, Math.round(measured.fps));
    notes.push(`Tuned to measured ${measured.width}×${measured.height} @${measured.vCodec}`);
  }

  if (profile.brand === "youtube" && options.youtubeQuality) {
    const cap = YT_QUALITY_LONG_EDGE[options.youtubeQuality];
    const longEdge = Math.max(boxW, boxH);
    if (cap < longEdge) {
      const factor = cap / longEdge;
      boxW = Math.round(boxW * factor);
      boxH = Math.round(boxH * factor);
      notes.push(`Capped to ${options.youtubeQuality}`);
    }
  }

  // --- Duration / trim ------------------------------------------------------
  const hasDuration = Number.isFinite(meta.durationSec) && meta.durationSec > 0;
  const userTrim =
    options.trim && options.trim.end - options.trim.start > 0.05 ? options.trim : undefined;
  const overDuration = !userTrim && hasDuration && meta.durationSec > profile.maxDurationSec + 0.05;
  const userTrimLen = userTrim ? userTrim.end - userTrim.start : 0;
  const effectiveDurationSec = userTrim
    ? Math.min(userTrimLen, profile.maxDurationSec)
    : overDuration
      ? profile.maxDurationSec
      : hasDuration
        ? meta.durationSec
        : profile.maxDurationSec;
  const trimToSec = overDuration ? profile.maxDurationSec : undefined;
  if (overDuration) {
    notes.push(`Trimmed to the first ${profile.maxDurationSec}s`);
  } else if (userTrim) {
    notes.push("Trimmed to your selection");
  }

  // --- Frame rate -----------------------------------------------------------
  const srcFps = Number.isFinite(meta.fps) && meta.fps > 0 ? meta.fps : 0;
  const fps = srcFps > 0 ? Math.min(Math.round(srcFps), fpsCap) : fpsCap;
  const capFps = srcFps > fpsCap + 0.5;
  if (capFps) notes.push(`Capped to ${fpsCap}fps`);

  // --- Resolution / aspect --------------------------------------------------
  const srcW = meta.width > 0 ? meta.width : boxW;
  const srcH = meta.height > 0 ? meta.height : boxH;
  const srcAspect = srcW / srcH;

  const targetRatio = ASPECT_RATIOS[profile.aspect];
  const needsAspect = targetRatio !== null;
  const matchesAspect =
    targetRatio === null || Math.abs(srcAspect - targetRatio) <= ASPECT_TOLERANCE;

  // Manual aspect handling (editor B1): "fit" = blur-pad, "fill" = crop-to-fill.
  // Default to "fit" (blur-pad) for off-aspect sources.
  const aspectMode: "fit" | "fill" = options.aspectMode ?? "fit";
  const cropRect = options.cropRect;

  let targetWidth: number;
  let targetHeight: number;
  let blurPad = false;

  if (!needsAspect || matchesAspect) {
    // Downscale-only to fit within the box; never upscale.
    const scale = Math.min(boxW / srcW, boxH / srcH, 1);
    targetWidth = roundEven(srcW * scale);
    targetHeight = roundEven(srcH * scale);
    if (scale < 1) notes.push(`Downscaled to ${targetWidth}×${targetHeight}`);
  } else if (aspectMode === "fill") {
    // Crop-to-fill the target aspect. Shrink the box so the cropped region is
    // never upscaled (cover scale ≤ 1).
    const cover = Math.max(boxW / srcW, boxH / srcH);
    const bw = cover > 1 ? boxW / cover : boxW;
    const bh = cover > 1 ? boxH / cover : boxH;
    targetWidth = roundEven(bw);
    targetHeight = roundEven(bh);
    notes.push(`Cropped to fill ${profile.aspect}`);
  } else {
    // Pad to the target aspect using a blurred, scaled copy as background.
    blurPad = true;
    targetWidth = roundEven(boxW);
    targetHeight = roundEven(boxH);
    notes.push(`Padded to ${profile.aspect} with a blurred background`);
  }

  // High-quality (Lanczos / stepped-halving) downscale for the platforms whose
  // own internal downscaler is poor (A4). Only meaningful on the plain-scale
  // path when we are actually downscaling.
  const wantsHq =
    profile.brand === "whatsapp" || profile.brand === "instagram" || profile.brand === "facebook";
  const isDownscaling = targetWidth < srcW || targetHeight < srcH;
  const hqDownscale = wantsHq && !blurPad && isDownscaling;

  // --- Bitrate / size budget ------------------------------------------------
  const sizeCapMB = profile.sizeCapMB ?? (profile.bitrateStrategy === "constrained" ? 15 : 0);
  const sizeCapBytes = sizeCapMB > 0 ? sizeCapMB * 1024 * 1024 : 0;
  const audioBitrate = meta.hasAudio ? profile.audio.bitrateKbps * 1000 : 0;

  let videoBitrate: number;
  if (measured) {
    // Aim just under the platform's real measured bitrate (~7% under) so its
    // re-encode is as close to passthrough as possible.
    videoBitrate = Math.round(measured.vBitrate * 0.93);
    if (profile.bitrateStrategy === "constrained" && sizeCapBytes > 0) {
      const budget = (sizeCapBytes * 8 * 0.92) / effectiveDurationSec - audioBitrate;
      if (budget > 800_000) videoBitrate = Math.min(videoBitrate, Math.round(budget));
    }
  } else if (profile.bitrateStrategy === "constrained" && sizeCapBytes > 0) {
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
    const perPixel = profile.bitratePerPixel ?? 0.13;
    const ceiling = profile.maxBitrate ?? 20_000_000;
    let raw = targetWidth * targetHeight * fps * perPixel;
    raw = Math.min(Math.max(raw, 4_000_000), ceiling);
    if (sizeCapBytes > 0) {
      const budget = (sizeCapBytes * 8 * 0.92) / effectiveDurationSec - audioBitrate;
      if (budget > 800_000) raw = Math.min(raw, budget);
    }
    videoBitrate = raw;
  }
  videoBitrate = Math.round(videoBitrate);

  // --- Codec / sharpen / loudness (user options) ---------------------------
  const videoCodec = resolveCodec(profile, options);
  const sharpen = options.sharpen === true;
  const normalizeLoudness = options.normalizeLoudness === true;

  // --- Already-optimal fast path -------------------------------------------
  // Any active edit (sharpen, loudness, fill-crop, reframe, codec switch,
  // measured tuning, user trim) means we must re-encode, never remux.
  const fitsBox = srcW <= boxW && srcH <= boxH;
  const fpsOk = srcFps === 0 || srcFps <= fpsCap + 0.5;
  const sizeOk = sizeCapBytes === 0 || (meta.sizeBytes > 0 && meta.sizeBytes < sizeCapBytes);
  const aspectOk = !needsAspect || matchesAspect;
  const noEdits =
    !sharpen &&
    !normalizeLoudness &&
    !cropRect &&
    !userTrim &&
    !measured &&
    aspectMode !== "fill" &&
    videoCodec === "avc";
  const fastPath =
    noEdits &&
    isH264(meta.vcodec) &&
    isYuv420(meta.pixfmt) &&
    !meta.isHdr && // HDR must be tone-mapped to SDR, never remuxed
    fitsBox &&
    fpsOk &&
    aspectOk &&
    !overDuration &&
    sizeOk;
  if (fastPath) notes.push("Source already optimal — minimal re-encode");

  // --- Audio ----------------------------------------------------------------
  const audioKbps = measured?.aBitrate
    ? Math.round(measured.aBitrate / 1000)
    : profile.audio.bitrateKbps;
  const audio = meta.hasAudio
    ? { codec: "aac" as const, bitrate: audioKbps * 1000, sampleRate: 48_000 }
    : null;

  const keyFrameIntervalSec = profile.gopSec ?? 2;

  return {
    targetWidth,
    targetHeight,
    blurPad,
    aspectMode,
    cropRect,
    hqDownscale,
    videoCodec,
    sharpen,
    normalizeLoudness,
    fps,
    trimToSec,
    trim: userTrim,
    fastPath,
    videoBitrate,
    audio,
    keyFrameIntervalSec,
    effectiveDurationSec,
    sizeCapBytes,
    notes,
  };
}
