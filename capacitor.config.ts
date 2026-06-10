import type { CapacitorConfig } from "@capacitor/cli";

/**
 * Capacitor wrapper config. VideoNest has server routes (the optional heavy
 * tier), so it can't be a pure static export — instead the native shell loads
 * the deployed site in a WebView. The on-device encode engine (WebCodecs /
 * ffmpeg.wasm) runs inside that WebView just like the browser.
 *
 * Set CAP_SERVER_URL (or rely on NEXT_PUBLIC_SITE_URL) to your deployed origin
 * before `cap sync`. Native projects are created with `pnpm cap:add:android` /
 * `pnpm cap:add:ios` and require Android Studio / Xcode to build.
 */
const serverUrl = process.env.CAP_SERVER_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

const config: CapacitorConfig = {
  appId: "com.videonest.app",
  appName: "VideoNest",
  // Fallback bundle dir. Ignored at runtime when `server.url` is set, but
  // Capacitor still requires it to exist.
  webDir: "public",
  backgroundColor: "#FFF9F5",
  ...(serverUrl ? { server: { url: serverUrl, cleartext: false } } : {}),
};

export default config;
