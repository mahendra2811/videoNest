import { GoogleAnalytics, GoogleTagManager } from "@next/third-parties/google";
import { flags } from "@/lib/config/flags";

/**
 * Mounts GA4 + GTM only when their env ids are present. Renders nothing
 * otherwise, so an empty .env produces zero analytics network calls.
 */
export function Analytics() {
  return (
    <>
      {flags.gtmEnabled && <GoogleTagManager gtmId={flags.gtmId} />}
      {flags.analyticsEnabled && <GoogleAnalytics gaId={flags.gaId} />}
    </>
  );
}
