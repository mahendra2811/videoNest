import { flags } from "@/lib/config/flags";

/**
 * Future premium tier scaffold (G2). Today this gates NOTHING — every current
 * feature (core optimisation, all platforms, no watermark) is free forever. The
 * flag + helper exist only so a *future* premium feature (e.g. AI Enhance, 4K
 * server jobs) can be added without re-architecting. There is no paywall UI.
 */
export type PremiumFeature = "ai-enhance" | "server-4k";

/**
 * Whether a given (future) feature requires premium. Returns false for every
 * feature that exists today — nothing is paywalled. A feature only becomes
 * premium-gated when it's both listed here AND the premium flag is on.
 */
export function isPremiumFeature(_feature: PremiumFeature): boolean {
  // No current feature is premium. When a real premium feature ships, gate it
  // here behind `flags.premiumEnabled`.
  void flags.premiumEnabled;
  return false;
}
