import { describe, expect, it } from "vitest";
import { getLiveProfiles } from "@/lib/config/profiles";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { getPlatformContent } from "@/lib/content/platforms";
import { forbiddenInCopy, strings } from "@/lib/strings";

/** Recursively collect every string value in a nested object/array. */
function collectStrings(value: unknown, out: string[] = []): string[] {
  if (typeof value === "string") out.push(value);
  else if (Array.isArray(value)) for (const v of value) collectStrings(v, out);
  else if (value && typeof value === "object")
    for (const v of Object.values(value)) collectStrings(v, out);
  return out;
}

describe("honest copy audit (C1)", () => {
  const corpus: string[] = [
    ...collectStrings(strings),
    ...collectStrings(FAQ_ITEMS),
    ...getLiveProfiles().flatMap((p) => collectStrings(getPlatformContent(p.id))),
  ];

  it("collected a non-trivial amount of user-facing copy", () => {
    expect(corpus.length).toBeGreaterThan(20);
  });

  for (const phrase of forbiddenInCopy) {
    it(`never uses the banned phrase "${phrase}"`, () => {
      const offenders = corpus.filter((s) => s.toLowerCase().includes(phrase));
      expect(offenders).toEqual([]);
    });
  }
});
