/**
 * Centralized, honest user-facing copy (C1) — the single place the prime
 * directive is enforced: we **minimise** the platform's recompression damage;
 * we never claim "lossless", "no quality loss", or that we "restore" footage.
 *
 * This is also the seed for localization (D3): these keys map 1:1 to per-locale
 * message catalogs. `forbiddenInCopy` powers the copy-audit test so a banned
 * phrase can never ship.
 */

/** Phrases that must never appear in user-facing copy (case-insensitive). */
export const forbiddenInCopy = [
  "lossless",
  "no quality loss",
  "zero quality loss",
  "without losing quality",
  "restore quality",
  "restores quality",
] as const;

export const strings = {
  brand: {
    name: "VideoNest",
    tagline: "Stay sharp after the upload.",
  },
  // The honest promise, reused across hero / tool / FAQ / meta.
  promise: {
    short: "Best possible quality after the platform compresses it.",
    long: "Every platform re-compresses what you upload — we can't stop that. VideoNest prepares your video so the platform's own compression does the least possible damage, keeping it as sharp as possible.",
    privacy: "100% on your device — your video never leaves it.",
    free: "Free, no watermark, no account.",
  },
  tool: {
    dropPrompt: "Drop your video in and we'll make it look its best after you post.",
    optimize: "Make it sharp",
    optimizeEdited: "Apply & make it sharp",
    reading: "Reading your video…",
    edit: "Edit video",
    editsAdded: "Edits added",
    chooseAnother: "Choose another",
    ready: "Your video is ready ✨",
    statsNote: "We prepare your video so the platform's own compression does the least damage.",
  },
  share: {
    mobile: "Tap Share, then post the saved video from the app.",
    mobileStatus: "Tap Share to your app, then choose your Status / Story.",
    desktop: "Download it, then post from the mobile app (the web uploader compresses harder).",
    whatsappHd: "Tip: turn on WhatsApp's HD upload (Settings → Storage and data → Media quality).",
  },
} as const;

export type Strings = typeof strings;
