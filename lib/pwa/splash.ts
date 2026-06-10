/**
 * iOS PWA splash-screen ("apple-touch-startup-image") targets.
 *
 * Each entry: logical CSS width/height + devicePixelRatio (used to build the
 * media query) and the physical image size (width*ratio × height*ratio) that
 * the generator rasterizes. Portrait only — the app is mobile-first vertical.
 *
 * KEEP IN SYNC with the SPLASH_TARGETS array in scripts/generate-icons.mjs.
 */
export type SplashTarget = {
  /** Logical (CSS) width in px. */
  w: number;
  /** Logical (CSS) height in px. */
  h: number;
  /** Device pixel ratio. */
  r: number;
  /** Output file name in /public. */
  file: string;
};

export const SPLASH_TARGETS: SplashTarget[] = [
  { w: 375, h: 667, r: 2, file: "splash-750x1334.png" }, // iPhone SE / 8
  { w: 414, h: 896, r: 2, file: "splash-828x1792.png" }, // iPhone 11 / XR
  { w: 375, h: 812, r: 3, file: "splash-1125x2436.png" }, // iPhone 13 mini / X
  { w: 390, h: 844, r: 3, file: "splash-1170x2532.png" }, // iPhone 12/13/14
  { w: 393, h: 852, r: 3, file: "splash-1179x2556.png" }, // iPhone 14/15 Pro
  { w: 430, h: 932, r: 3, file: "splash-1290x2796.png" }, // iPhone 14 Pro Max / 15 Plus
  { w: 820, h: 1180, r: 2, file: "splash-1640x2360.png" }, // iPad Air / 10.9"
  { w: 834, h: 1194, r: 2, file: "splash-1668x2388.png" }, // iPad Pro 11"
];

/** Build the media query for an apple-touch-startup-image link. */
export function splashMedia(t: SplashTarget): string {
  return `(device-width: ${t.w}px) and (device-height: ${t.h}px) and (-webkit-device-pixel-ratio: ${t.r}) and (orientation: portrait)`;
}
