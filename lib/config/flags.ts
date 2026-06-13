/**
 * Feature flags derived from environment variables.
 *
 * Golden rule: if an integration's env key is absent/empty, the feature is
 * disabled. Nothing crashes, nothing logs errors. These are evaluated at module
 * load; all NEXT_PUBLIC_* vars are inlined at build time so they work on the
 * client too.
 */

function has(key: string): boolean {
  const value = process.env[key];
  return typeof value === "string" && value.trim().length > 0;
}

function value(key: string): string {
  return (process.env[key] ?? "").trim();
}

const gaId = value("NEXT_PUBLIC_GA_MEASUREMENT_ID");
const gtmId = value("NEXT_PUBLIC_GTM_ID");
const adsClientId = value("NEXT_PUBLIC_ADSENSE_CLIENT_ID");
const formspreeId = value("NEXT_PUBLIC_FORMSPREE_ID");

export const flags = {
  /** GA4 enabled only when a measurement id is present. */
  analyticsEnabled: has("NEXT_PUBLIC_GA_MEASUREMENT_ID"),
  /** GTM enabled only when a container id is present. */
  gtmEnabled: has("NEXT_PUBLIC_GTM_ID"),
  /** Ads enabled only when the flag is true AND a client id exists. */
  adsEnabled: value("NEXT_PUBLIC_ADS_ENABLED") === "true" && adsClientId.length > 0,
  /** Sentry enabled only when a DSN is present. */
  sentryEnabled: has("NEXT_PUBLIC_SENTRY_DSN"),
  /** Contact provider: Formspree if id present, else a mailto: fallback. */
  contactProvider: (formspreeId.length > 0 ? "formspree" : "mailto") as "formspree" | "mailto",
  /** Optional server heavy-tier (opt-in upload for sources that crash the
   * browser). Off unless explicitly enabled; the server route also requires a
   * Vercel Blob token to actually run. */
  serverTierEnabled: value("NEXT_PUBLIC_SERVER_TIER_ENABLED") === "true",
  /** Future premium tier (e.g. AI Enhance, 4K server jobs). Default OFF. Gates
   * NOTHING today — core optimisation, every platform and no-watermark stay
   * free forever (G2). */
  premiumEnabled: value("NEXT_PUBLIC_PREMIUM_ENABLED") === "true",

  // Raw ids for the few components that need them.
  gaId,
  gtmId,
  adsClientId,
  formspreeId,
  gscVerification: value("NEXT_PUBLIC_GSC_VERIFICATION"),
  sentryDsn: value("NEXT_PUBLIC_SENTRY_DSN"),
} as const;

export type Flags = typeof flags;
