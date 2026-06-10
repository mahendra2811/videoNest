import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const securityHeaders = [
  // Cross-origin isolation so SharedArrayBuffer / ffmpeg.wasm threading works.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  // `credentialless` keeps cross-origin isolation while still allowing
  // third-party subresources (analytics/ads) to load without CORP headers.
  { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
];

const baseConfig: NextConfig = {
  reactStrictMode: true,
  // Keep optional server-only deps (Sentry/OpenTelemetry) out of the webpack
  // bundle so the "Critical dependency" warning doesn't appear when Sentry is
  // disabled. They're required from node_modules at runtime only if used.
  serverExternalPackages: ["require-in-the-middle", "@opentelemetry/instrumentation"],
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

// ---------------------------------------------------------------------------
// PWA (Serwist). Disabled in dev to avoid stale-cache friction.
// ---------------------------------------------------------------------------
const withSerwist = withSerwistInit({
  swSrc: "app/sw.ts",
  swDest: "public/sw.js",
  disable: process.env.NODE_ENV === "development",
  reloadOnOnline: true,
  // Never precache the heavy ffmpeg.wasm core or source maps — they're
  // lazy-loaded only on the fallback path and would bloat the install.
  exclude: [/ffmpeg-core\.wasm$/, /ffmpeg-core\.js$/, /\.map$/, /^manifest.*\.js$/],
});

let config: NextConfig = withSerwist(baseConfig);

// ---------------------------------------------------------------------------
// Sentry — only wrap when a DSN is configured, so an empty .env builds clean.
// ---------------------------------------------------------------------------
if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
  // Lazy require so the dependency isn't pulled in when Sentry is disabled.
  const { withSentryConfig } = require("@sentry/nextjs") as any;
  config = withSentryConfig(config, {
    silent: true,
    org: process.env.SENTRY_ORG,
    project: process.env.SENTRY_PROJECT,
    widenClientFileUpload: true,
    disableLogger: true,
    automaticVercelMonitors: false,
  });
}

export default config;
