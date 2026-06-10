/**
 * Typed site config built from environment variables, with safe defaults.
 * Every value has a sensible fallback so the app runs with an empty .env.
 */

function env(key: string, fallback = ""): string {
  const value = process.env[key];
  return value && value.trim().length > 0 ? value.trim() : fallback;
}

const rawUrl = env("NEXT_PUBLIC_SITE_URL", "https://videonest.app");
// Normalize: no trailing slash.
const siteUrl = rawUrl.replace(/\/+$/, "");

export const siteConfig = {
  name: env("NEXT_PUBLIC_SITE_NAME", "VideoNest"),
  url: siteUrl,
  contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL", "hello@videonest.app"),
  description:
    "Post videos to WhatsApp Status and keep them sharp. VideoNest prepares your video on your device so it stays crisp after WhatsApp compresses it. Free, private, no upload.",
  tagline: "Post videos to WhatsApp Status — and keep them sharp.",
  twitterHandle: "@videonest",
  locale: "en_US",
} as const;

export type SiteConfig = typeof siteConfig;

/** Absolute URL helper for canonical / OG tags. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${clean}`;
}
