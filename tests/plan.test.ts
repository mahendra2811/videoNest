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
});

const igReels = getProfile("instagram-reels");
const ytLong = getProfile("youtube-long");
if (!igReels) throw new Error("instagram-reels profile missing");
if (!ytLong) throw new Error("youtube-long profile missing");

describe("buildPlan — 16:9 profile (YouTube)", () => {
  it("4K landscape → downscaled to 1920×1080, no pad", () => {
    const plan = buildPlan(meta({ width: 3840, height: 2160, durationSec: 120, fps: 30 }), ytLong);
    expect(plan.blurPad).toBe(false);
    expect(plan.targetWidth).toBe(1920);
    expect(plan.targetHeight).toBe(1080);
    expect(plan.targetWidth % 2).toBe(0);
    expect(plan.targetHeight % 2).toBe(0);
  });

  it("vertical source → blurred pad to 16:9 (1920×1080)", () => {
    const plan = buildPlan(meta({ width: 1080, height: 1920, durationSec: 120 }), ytLong);
    expect(plan.blurPad).toBe(true);
    expect(plan.targetWidth).toBe(1920);
    expect(plan.targetHeight).toBe(1080);
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
  it("uses a high quality-first bitrate within the clamp range", () => {
    const plan = buildPlan(meta({ width: 1080, height: 1920, durationSec: 30 }), igReels);
    expect(plan.videoBitrate).toBeGreaterThanOrEqual(4_000_000);
    expect(plan.videoBitrate).toBeLessThanOrEqual(20_000_000);
  });

  it("respects the platform size cap for long clips", () => {
    // 100 MB over 90s ≈ 9.3 Mbps total; video must stay under that budget.
    const plan = buildPlan(meta({ width: 1920, height: 1080, durationSec: 90 }), igReels);
    const budgetBitrate = (100 * 1024 * 1024 * 8) / 90;
    expect(plan.videoBitrate).toBeLessThan(budgetBitrate);
  });
});
