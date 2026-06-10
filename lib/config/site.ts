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
  contactEmail: env("NEXT_PUBLIC_CONTACT_EMAIL", "mahendrapuniya92@gmail.com"),
  description:
    "Social media blurs your videos. VideoNest optimizes them on your device for WhatsApp, Instagram, YouTube and Facebook so they stay sharp after the platform compresses them. Free, private, no upload.",
  tagline: "Stop social media from blurring your videos",
  twitterHandle: "@videonest",
  locale: "en_US",
} as const;

export type SiteConfig = typeof siteConfig;

/** Absolute URL helper for canonical / OG tags. */
export function absoluteUrl(path = "/"): string {
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${siteConfig.url}${clean}`;
}
