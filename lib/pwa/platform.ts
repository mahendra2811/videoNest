/** Client-only platform detection for install/notification UX. */

export type Platform = "android" | "ios" | "macos" | "windows" | "desktop";

export function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const platform = (navigator as unknown as { platform?: string }).platform ?? "";
  const touch = navigator.maxTouchPoints ?? 0;

  if (/android/i.test(ua)) return "android";
  // iPadOS 13+ reports as Mac with touch points.
  if (/iphone|ipad|ipod/i.test(ua) || (platform === "MacIntel" && touch > 1)) return "ios";
  if (/macintosh|mac os x/i.test(ua)) return "macos";
  if (/windows/i.test(ua)) return "windows";
  return "desktop";
}

/** True when running as an installed PWA (standalone display). */
export function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mql = typeof matchMedia === "function" && matchMedia("(display-mode: standalone)").matches;
  const iosStandalone = (navigator as unknown as { standalone?: boolean }).standalone === true;
  return Boolean(mql || iosStandalone);
}

/** Safari is the only browser on iOS that can install, and on macOS it adds to Dock. */
export function isSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  return /^((?!chrome|android|crios|fxios|edg).)*safari/i.test(ua);
}
