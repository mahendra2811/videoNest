import { describe, expect, it } from "vitest";
import {
  daysSinceVerified,
  getLiveProfiles,
  isProfileStale,
  lastVerifiedLabel,
  parseVerified,
  staleProfiles,
} from "@/lib/config/profiles";

describe("profile freshness (A2)", () => {
  it("parses YYYY-MM verification dates", () => {
    const d = parseVerified("2026-06");
    expect(d?.getUTCFullYear()).toBe(2026);
    expect(d?.getUTCMonth()).toBe(5); // June (0-based)
  });

  it("renders a short last-verified label", () => {
    const [p] = getLiveProfiles();
    expect(lastVerifiedLabel(p)).toMatch(/^[A-Z][a-z]{2} \d{4}$/);
  });

  it("flags a profile older than 90 days as stale", () => {
    const [p] = getLiveProfiles();
    // 200 days after its verification date.
    const verified = parseVerified(p.lastVerified) ?? new Date();
    const asOf = new Date(verified.getTime() + 200 * 24 * 60 * 60 * 1000);
    expect(isProfileStale(p, asOf)).toBe(true);
    expect(daysSinceVerified(p, asOf)).toBeGreaterThan(90);
  });

  it("treats a freshly-verified profile as current", () => {
    const [p] = getLiveProfiles();
    const verified = parseVerified(p.lastVerified) ?? new Date();
    const asOf = new Date(verified.getTime() + 10 * 24 * 60 * 60 * 1000);
    expect(isProfileStale(p, asOf)).toBe(false);
  });

  it("treats a missing lastVerified as stale", () => {
    const fake = { ...getLiveProfiles()[0], lastVerified: undefined };
    expect(isProfileStale(fake)).toBe(true);
  });

  // Dev-time freshness check: log (don't fail) when any live profile is stale
  // as of today, so the warning surfaces during local/CI runs (A2).
  it("logs a warning for profiles stale as of today", () => {
    const stale = staleProfiles(new Date());
    if (stale.length > 0) {
      console.warn(
        `[VideoNest] ${stale.length} platform profile(s) overdue for re-verification ` +
          `(>90 days). Re-run measurement/MEASUREMENT.md and bump lastVerified: ` +
          stale.map((p) => `${p.id} (${p.lastVerified ?? "never"})`).join(", "),
      );
    }
    expect(Array.isArray(stale)).toBe(true);
  });
});
