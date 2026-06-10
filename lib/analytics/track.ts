import { flags } from "@/lib/config/flags";

/** Key analytics events used across the app. */
export type AnalyticsEvent =
  | "file_selected"
  | "optimize_started"
  | "optimize_succeeded"
  | "optimize_failed"
  | "shared"
  | "downloaded"
  | "platform_soon_clicked";

type Params = Record<string, string | number | boolean | undefined>;

/**
 * Fire a GA4 event. No-op when analytics are disabled or gtag isn't present,
 * so call sites never need to guard.
 */
export function track(event: AnalyticsEvent, params: Params = {}): void {
  if (!flags.analyticsEnabled) return;
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag !== "function") return;
  try {
    w.gtag("event", event, params);
  } catch {
    // Never let analytics break the app.
  }
}
