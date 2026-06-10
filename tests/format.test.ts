import { describe, expect, it } from "vitest";
import { formatBytes, formatDuration, formatResolution } from "@/lib/utils/format";

describe("formatBytes", () => {
  it("formats common sizes", () => {
    expect(formatBytes(0)).toBe("0 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(1536 * 1024)).toBe("1.5 MB");
  });
  it("handles invalid input", () => {
    expect(formatBytes(-5)).toBe("0 B");
    expect(formatBytes(Number.NaN)).toBe("0 B");
  });
});

describe("formatDuration", () => {
  it("formats mm:ss", () => {
    expect(formatDuration(0)).toBe("0:00");
    expect(formatDuration(95)).toBe("1:35");
    expect(formatDuration(9)).toBe("0:09");
  });
});

describe("formatResolution", () => {
  it("renders width × height", () => {
    expect(formatResolution(1080, 1920)).toBe("1080 × 1920");
  });
});
