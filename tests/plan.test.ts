import { describe, expect, it } from "vitest";
import { getProfile } from "@/lib/config/profiles";
import { buildPlan } from "@/lib/engine/plan";
import type { VideoMeta } from "@/lib/engine/types";

const whatsapp = getProfile("whatsapp-status");
if (!whatsapp) throw new Error("whatsapp-status profile missing");

function meta(overrides: Partial<VideoMeta> = {}): VideoMeta {
  return {
    container: "mp4",
    vcodec: "h264",
    width: 1080,
    height: 1920,
    fps: 30,
    durationSec: 20,
    bitrate: 5_000_000,
    pixfmt: "yuv420p",
    hasAudio: true,
    rotation: 0,
    isHdr: false,
    sizeBytes: 10 * 1024 * 1024,
    ...overrides,
  };
}

describe("buildPlan — WhatsApp Status profile", () => {
  it("vertical already-optimal → fast path, no pad, no downscale", () => {
    const plan = buildPlan(meta(), whatsapp);
    expect(plan.fastPath).toBe(true);
    expect(plan.blurPad).toBe(false);
    expect(plan.targetWidth).toBe(1080);
    expect(plan.targetHeight).toBe(1920);
    expect(plan.trimToSec).toBeUndefined();
    expect(plan.fps).toBe(30);
  });

  it("horizontal source → blurred pad to 9:16 at 1080×1920", () => {
    const plan = buildPlan(meta({ width: 1920, height: 1080, fps: 30 }), whatsapp);
    expect(plan.blurPad).toBe(true);
    expect(plan.targetWidth).toBe(1080);
    expect(plan.targetHeight).toBe(1920);
    expect(plan.fastPath).toBe(false);
    expect(plan.notes.join(" ")).toMatch(/blurred background/i);
  });

  it("oversized 4K vertical → downscaled to fit 1080×1920, even dims", () => {
    const plan = buildPlan(
      meta({ width: 2160, height: 3840, sizeBytes: 200 * 1024 * 1024 }),
      whatsapp,
    );
    expect(plan.blurPad).toBe(false);
    expect(plan.targetWidth).toBe(1080);
    expect(plan.targetHeight).toBe(1920);
    expect(plan.targetWidth % 2).toBe(0);
    expect(plan.targetHeight % 2).toBe(0);
    expect(plan.fastPath).toBe(false);
  });

  it("over-30s → trims to 30s and notes it", () => {
    const plan = buildPlan(meta({ durationSec: 65 }), whatsapp);
    expect(plan.trimToSec).toBe(30);
    expect(plan.effectiveDurationSec).toBe(30);
    expect(plan.fastPath).toBe(false);
    expect(plan.notes.join(" ")).toMatch(/trimmed/i);
  });

  it("low-res vertical → no upscale (keeps source dims)", () => {
    const plan = buildPlan(meta({ width: 540, height: 960 }), whatsapp);
    expect(plan.targetWidth).toBe(540);
    expect(plan.targetHeight).toBe(960);
    expect(plan.blurPad).toBe(false);
  });

  it("caps frame rate at 30fps for high-fps sources", () => {
    const plan = buildPlan(meta({ fps: 60 }), whatsapp);
    expect(plan.fps).toBe(30);
    expect(plan.notes.join(" ")).toMatch(/30fps/i);
    expect(plan.fastPath).toBe(false);
  });

  it("leaves lower frame rates alone", () => {
    const plan = buildPlan(meta({ fps: 24 }), whatsapp);
    expect(plan.fps).toBe(24);
  });

  it("keeps a constrained 30s clip's video bitrate under the size budget", () => {
    const plan = buildPlan(meta({ durationSec: 30, width: 1920, height: 1080 }), whatsapp);
    // 15 MB over 30s ≈ 4 Mbps total; video must be below that.
    expect(plan.videoBitrate).toBeLessThan(4_200_000);
    expect(plan.videoBitrate).toBeGreaterThan(800_000);
  });

  it("uses a 2-second GOP and AAC audio when audio is present", () => {
    const plan = buildPlan(meta(), whatsapp);
    expect(plan.keyFrameIntervalSec).toBe(2);
    expect(plan.audio).toEqual({ codec: "aac", bitrate: 128_000, sampleRate: 48_000 });
  });

  it("drops audio plan when the source has none", () => {
    const plan = buildPlan(meta({ hasAudio: false }), whatsapp);
    expect(plan.audio).toBeNull();
  });

  it("non-H.264 vertical source is not a fast path", () => {
    const plan = buildPlan(meta({ vcodec: "vp9", container: "webm" }), whatsapp);
    expect(plan.fastPath).toBe(false);
  });

  it("oversized file but otherwise optimal → re-encode (not fast path)", () => {
    const plan = buildPlan(meta({ sizeBytes: 40 * 1024 * 1024 }), whatsapp);
    expect(plan.fastPath).toBe(false);
  });

  it("HDR source is never fast-pathed (must tone-map to SDR)", () => {
    const plan = buildPlan(meta({ isHdr: true }), whatsapp);
    expect(plan.fastPath).toBe(false);
  });
});

const igReels = getProfile("instagram-reels");
const ytLong = getProfile("youtube-long");
if (!igReels) throw new Error("instagram-reels profile missing");
if (!ytLong) throw new Error("youtube-long profile missing");

describe("buildPlan — 16:9 profile (YouTube)", () => {
  it("4K landscape → downscaled to 1440p box (passthrough up to 1440p), no pad", () => {
    const plan = buildPlan(meta({ width: 3840, height: 2160, durationSec: 120, fps: 30 }), ytLong);
    expect(plan.blurPad).toBe(false);
    expect(plan.targetWidth).toBe(2560);
    expect(plan.targetHeight).toBe(1440);
    expect(plan.targetWidth % 2).toBe(0);
    expect(plan.targetHeight % 2).toBe(0);
  });

  it("1080p landscape → kept (not upscaled to 1440p)", () => {
    const plan = buildPlan(meta({ width: 1920, height: 1080, durationSec: 120, fps: 30 }), ytLong);
    expect(plan.blurPad).toBe(false);
    expect(plan.targetWidth).toBe(1920);
    expect(plan.targetHeight).toBe(1080);
  });

  it("vertical source → blurred pad to 16:9 (1440p box)", () => {
    const plan = buildPlan(meta({ width: 1080, height: 1920, durationSec: 120 }), ytLong);
    expect(plan.blurPad).toBe(true);
    expect(plan.targetWidth).toBe(2560);
    expect(plan.targetHeight).toBe(1440);
  });

  it("16:9 source already optimal → fast path", () => {
    const plan = buildPlan(
      meta({ width: 1920, height: 1080, durationSec: 120, sizeBytes: 50 * 1024 * 1024 }),
      ytLong,
    );
    expect(plan.fastPath).toBe(true);
    expect(plan.blurPad).toBe(false);
  });
});

describe("buildPlan — overprovision bitrate strategy", () => {
  const ytShorts = getProfile("youtube-shorts");
  if (!ytShorts) throw new Error("youtube-shorts profile missing");

  it("uses a high quality-first bitrate (≈ perPixel) within the clamp range", () => {
    // 1080×1920·30 × 0.16 ≈ 9.95 Mbps for Instagram Reels.
    const plan = buildPlan(meta({ width: 1080, height: 1920, durationSec: 30 }), igReels);
    expect(plan.videoBitrate).toBeGreaterThanOrEqual(8_000_000);
    expect(plan.videoBitrate).toBeLessThanOrEqual(12_000_000);
  });

  it("clamps to the profile bitrate ceiling for very high pixel rates", () => {
    // 1080×1920·60 × 0.20 ≈ 24.9 Mbps → clamped to the 20 Mbps default ceiling.
    const plan = buildPlan(meta({ width: 1080, height: 1920, fps: 60, durationSec: 30 }), ytShorts);
    expect(plan.videoBitrate).toBe(20_000_000);
  });

  it("respects a stated size cap when it binds (constrained budget)", () => {
    // Force a tight budget: a small synthetic cap profile via Instagram Story
    // with a long effective duration is capped to maxDuration, so instead
    // verify the cap math directly on a binding case.
    const tight = { ...igReels, sizeCapMB: 20, maxDurationSec: 30 };
    const plan = buildPlan(meta({ width: 1080, height: 1920, durationSec: 30 }), tight);
    const budgetBitrate = (20 * 1024 * 1024 * 8 * 0.92) / 30;
    expect(plan.videoBitrate).toBeLessThanOrEqual(Math.round(budgetBitrate));
  });
});

const ytShorts = getProfile("youtube-shorts");
if (!ytShorts) throw new Error("youtube-shorts profile missing");

describe("buildPlan — options defaults (no edits)", () => {
  it("defaults: no sharpen, no loudness, avc, fit, no crop/trim", () => {
    const plan = buildPlan(meta(), whatsapp);
    expect(plan.sharpen).toBe(false);
    expect(plan.normalizeLoudness).toBe(false);
    expect(plan.videoCodec).toBe("avc");
    expect(plan.aspectMode).toBe("fit");
    expect(plan.cropRect).toBeUndefined();
    expect(plan.trim).toBeUndefined();
  });
});

describe("buildPlan — A5 sharpen toggle", () => {
  it("off by default", () => {
    expect(buildPlan(meta(), whatsapp).sharpen).toBe(false);
  });
  it("on when requested → flagged and not fast-pathed", () => {
    const plan = buildPlan(meta(), whatsapp, { sharpen: true });
    expect(plan.sharpen).toBe(true);
    expect(plan.fastPath).toBe(false);
  });
});

describe("buildPlan — A6 loudness normalize toggle", () => {
  it("off by default", () => {
    expect(buildPlan(meta(), whatsapp).normalizeLoudness).toBe(false);
  });
  it("on when requested → flagged and not fast-pathed", () => {
    const plan = buildPlan(meta(), whatsapp, { normalizeLoudness: true });
    expect(plan.normalizeLoudness).toBe(true);
    expect(plan.fastPath).toBe(false);
  });
  it("YouTube long-form audio is high-bitrate (≥256k)", () => {
    const plan = buildPlan(meta({ width: 1920, height: 1080, durationSec: 120 }), ytLong);
    expect(plan.audio?.bitrate).toBeGreaterThanOrEqual(256_000);
  });
  it("WhatsApp keeps 128k audio", () => {
    expect(buildPlan(meta(), whatsapp).audio?.bitrate).toBe(128_000);
  });
});

describe("buildPlan — B1 aspect mode (fit / fill)", () => {
  it("off-aspect + fit → blur-pad (default)", () => {
    const plan = buildPlan(meta({ width: 1920, height: 1080 }), whatsapp, { aspectMode: "fit" });
    expect(plan.blurPad).toBe(true);
  });
  it("off-aspect + fill → crop-to-fill, no pad, not fast-pathed", () => {
    const plan = buildPlan(meta({ width: 1920, height: 1080 }), whatsapp, { aspectMode: "fill" });
    expect(plan.blurPad).toBe(false);
    expect(plan.fastPath).toBe(false);
    expect(plan.notes.join(" ")).toMatch(/fill/i);
  });
  it("fill never upscales the cropped region (target ≤ source-derived box)", () => {
    // 1920×1080 → 9:16: cover>1, so the box is shrunk to avoid upscaling.
    const plan = buildPlan(meta({ width: 1920, height: 1080 }), whatsapp, { aspectMode: "fill" });
    expect(plan.targetWidth).toBeLessThanOrEqual(1080);
    expect(plan.targetWidth % 2).toBe(0);
    expect(plan.targetHeight % 2).toBe(0);
  });
  it("a crop rect forces re-encode and carries through", () => {
    const cropRect = { x: 0.1, y: 0.1, width: 0.8, height: 0.8 };
    const plan = buildPlan(meta(), whatsapp, { cropRect });
    expect(plan.cropRect).toEqual(cropRect);
    expect(plan.fastPath).toBe(false);
  });
});

describe("buildPlan — A4 1080 cap + high-quality downscale", () => {
  it("IG Reels 4K → exactly 1080-class, hqDownscale on", () => {
    const plan = buildPlan(meta({ width: 2160, height: 3840 }), igReels);
    expect(plan.targetWidth).toBe(1080);
    expect(plan.targetHeight).toBe(1920);
    expect(plan.hqDownscale).toBe(true);
  });
  it("WhatsApp 4K → 1080-class, hqDownscale on", () => {
    const plan = buildPlan(
      meta({ width: 2160, height: 3840, sizeBytes: 200 * 1024 * 1024 }),
      whatsapp,
    );
    expect(plan.targetWidth).toBe(1080);
    expect(plan.hqDownscale).toBe(true);
  });
  it("YouTube never uses the constrained hqDownscale path (passthrough instead)", () => {
    const plan = buildPlan(meta({ width: 3840, height: 2160, durationSec: 120 }), ytLong);
    expect(plan.hqDownscale).toBe(false);
  });
});

describe("buildPlan — A3 YouTube quality selector + codec", () => {
  it("4K source + 1080p selection → capped to 1080-class", () => {
    const plan = buildPlan(meta({ width: 3840, height: 2160, durationSec: 120 }), ytLong, {
      youtubeQuality: "1080p",
    });
    expect(Math.max(plan.targetWidth, plan.targetHeight)).toBeLessThanOrEqual(1080);
  });
  it("4K source + 1440p selection → up to 1440-class", () => {
    const plan = buildPlan(meta({ width: 3840, height: 2160, durationSec: 120 }), ytLong, {
      youtubeQuality: "1440p",
    });
    expect(Math.max(plan.targetWidth, plan.targetHeight)).toBeLessThanOrEqual(1440);
    expect(Math.max(plan.targetWidth, plan.targetHeight)).toBeGreaterThan(1080);
  });
  it("YouTube allows AV1 when requested", () => {
    const plan = buildPlan(meta({ width: 1920, height: 1080, durationSec: 120 }), ytLong, {
      videoCodec: "av1",
    });
    expect(plan.videoCodec).toBe("av1");
  });
  it("non-YouTube ignores a codec request (stays avc)", () => {
    const plan = buildPlan(meta(), whatsapp, { videoCodec: "av1" });
    expect(plan.videoCodec).toBe("avc");
  });
});

describe("buildPlan — A1 measuredOutput preference", () => {
  const measured = {
    ...whatsapp,
    measuredOutput: {
      width: 720,
      height: 1280,
      fps: 30,
      vBitrate: 2_000_000,
      vCodec: "h264",
    },
  };
  it("targets measured resolution and ~7% under measured bitrate", () => {
    const plan = buildPlan(meta({ width: 1080, height: 1920 }), measured);
    expect(plan.targetWidth).toBe(720);
    expect(plan.targetHeight).toBe(1280);
    expect(plan.videoBitrate).toBe(Math.round(2_000_000 * 0.93));
    expect(plan.fastPath).toBe(false);
  });
});

describe("buildPlan — editor trim", () => {
  it("a user trim window sets effective duration and disables fast path", () => {
    const plan = buildPlan(meta({ durationSec: 25 }), whatsapp, { trim: { start: 5, end: 15 } });
    expect(plan.trim).toEqual({ start: 5, end: 15 });
    expect(plan.effectiveDurationSec).toBe(10);
    expect(plan.fastPath).toBe(false);
  });
});

import { computeSegments } from "@/lib/engine/plan";

describe("computeSegments", () => {
  it("returns one full window when within the cap", () => {
    expect(computeSegments(25, 30)).toEqual([{ start: 0, end: 25 }]);
  });

  it("splits a 70s clip into 30/30/10 windows", () => {
    expect(computeSegments(70, 30)).toEqual([
      { start: 0, end: 30 },
      { start: 30, end: 60 },
      { start: 60, end: 70 },
    ]);
  });

  it("splits an exact multiple cleanly", () => {
    expect(computeSegments(60, 30)).toEqual([
      { start: 0, end: 30 },
      { start: 30, end: 60 },
    ]);
  });

  it("handles a value just over the cap (tolerance)", () => {
    expect(computeSegments(30.02, 30)).toEqual([{ start: 0, end: 30.02 }]);
  });

  it("guards invalid input", () => {
    expect(computeSegments(0, 30)).toEqual([{ start: 0, end: 0 }]);
  });
});
