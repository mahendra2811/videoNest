import type { PlatformProfile } from "@/lib/engine/types";

/**
 * The single source of truth for platform output profiles. Both the home grid
 * and the encode engine read from this registry, so each platform is fully
 * data-driven — its tool route (`slug`), encode parameters, and share copy all
 * live here.
 *
 * WhatsApp Status uses the constrained (hard size-cap) strategy; the others use
 * `overprovision` — a quality-first bitrate (the platform re-encodes anyway, so
 * we hand it clean, generously-bitrated input), capped by any stated size limit.
 *
 * `lastVerified` / `sourceUrl` / `confidence` exist so specs don't silently
 * drift — re-verify periodically against the source.
 */
export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: "whatsapp-status",
    label: "WhatsApp Status",
    status: "live",
    slug: "whatsapp-status-video",
    brand: "whatsapp",
    format: "Status",
    icon: "MessageCircle",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 30,
    fpsCap: 30,
    sizeCapMB: 16,
    bitrateStrategy: "constrained",
    splitOversize: true,
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint:
      "Tap Share to WhatsApp, then choose My Status. Quality is the same as downloading — we already optimized it.",
    blurb: "Stay sharp after WhatsApp's squeeze.",
    lastVerified: "2026-06",
    sourceUrl: "https://faq.whatsapp.com/454876960047011",
    confidence: "medium",
  },
  {
    id: "instagram-reels",
    label: "Instagram Reels",
    status: "live",
    slug: "instagram-reels-video",
    brand: "instagram",
    format: "Reels",
    icon: "Camera",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 90,
    fpsCap: 30,
    sizeCapMB: 250,
    bitrateStrategy: "overprovision",
    bitratePerPixel: 0.16, // ~10 Mbps @1080×1920·30
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Tap Share, then post the saved video as a Reel from the Instagram app.",
    blurb: "Vertical reels, ready to post.",
    lastVerified: "2026-06",
    sourceUrl: "https://help.instagram.com/1038071743007909",
    confidence: "medium",
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    status: "live",
    slug: "instagram-story-video",
    brand: "instagram",
    format: "Story",
    icon: "Camera",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 30,
    sizeCapMB: 250,
    bitrateStrategy: "overprovision",
    bitratePerPixel: 0.16,
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Tap Share, then add the saved video to your Story from the Instagram app.",
    blurb: "Crisp 9:16 stories.",
    lastVerified: "2026-06",
    sourceUrl: "https://help.instagram.com/1257341144298972",
    confidence: "medium",
  },
  {
    id: "youtube-shorts",
    label: "YouTube Shorts",
    status: "live",
    slug: "youtube-shorts-video",
    brand: "youtube",
    format: "Shorts",
    icon: "Clapperboard",
    aspect: "9:16",
    // Allow up to 1440p passthrough — YouTube's transcode rewards >1080p
    // sources (better VP9/AV1 ladder). Downscale-only, so smaller sources are
    // untouched and nothing is upscaled.
    maxWidth: 1440,
    maxHeight: 2560,
    maxDurationSec: 180, // 3 min since Oct 15 2024
    fpsCap: 60,
    sizeCapMB: 0,
    bitrateStrategy: "overprovision",
    bitratePerPixel: 0.2, // YouTube rewards a high-bitrate source
    gopSec: 1,
    audio: { codec: "aac", bitrateKbps: 256 },
    shareHint: "Download, then upload it as a Short from the YouTube app.",
    blurb: "Short-form, high bitrate.",
    lastVerified: "2026-06",
    sourceUrl: "https://support.google.com/youtube/answer/15424877",
    confidence: "high",
  },
  {
    id: "youtube-long",
    label: "YouTube",
    status: "live",
    slug: "youtube-video",
    brand: "youtube",
    format: "Long",
    icon: "Clapperboard",
    aspect: "16:9",
    // Allow up to 1440p passthrough (downscale-only); YouTube's re-encode
    // rewards >1080p sources. 4K sources land at 1440p to stay browser-feasible.
    maxWidth: 2560,
    maxHeight: 1440,
    maxDurationSec: 60 * 10,
    fpsCap: 60,
    sizeCapMB: 0,
    bitrateStrategy: "overprovision",
    bitratePerPixel: 0.22, // ~13 Mbps @1080p·30; YouTube bitrates are floors
    maxBitrate: 30_000_000,
    gopSec: 1,
    audio: { codec: "aac", bitrateKbps: 384 },
    shareHint: "Download, then upload it to YouTube from your computer or the app.",
    blurb: "Landscape, high-bitrate uploads.",
    lastVerified: "2026-06",
    sourceUrl: "https://support.google.com/youtube/answer/1722171",
    confidence: "high",
  },
  {
    id: "facebook-video",
    label: "Facebook Video",
    status: "live",
    slug: "facebook-video",
    brand: "facebook",
    format: "Video",
    icon: "ThumbsUp",
    aspect: "16:9",
    maxWidth: 1920,
    maxHeight: 1080,
    maxDurationSec: 60 * 10,
    fpsCap: 30,
    sizeCapMB: 0,
    bitrateStrategy: "overprovision",
    bitratePerPixel: 0.18,
    audio: { codec: "aac", bitrateKbps: 192 },
    shareHint: "Download, then post it to your feed from the Facebook app.",
    blurb: "Landscape video for the feed.",
    lastVerified: "2026-06",
    sourceUrl: "https://www.facebook.com/business/help/980593475366490",
    confidence: "medium",
  },
  {
    id: "facebook-story",
    label: "Facebook Story",
    status: "live",
    slug: "facebook-story-video",
    brand: "facebook",
    format: "Story",
    icon: "ThumbsUp",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 30,
    sizeCapMB: 250,
    bitrateStrategy: "overprovision",
    bitratePerPixel: 0.16,
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Tap Share, then add the saved video to your Story from the Facebook app.",
    blurb: "Vertical stories for Facebook.",
    lastVerified: "2026-06",
    sourceUrl: "https://www.facebook.com/business/help/980593475366490",
    confidence: "low",
  },
];

/** The default profile (WhatsApp Status). */
export const DEFAULT_PROFILE_ID = "whatsapp-status";

export function getProfile(id: string): PlatformProfile | undefined {
  return PLATFORM_PROFILES.find((p) => p.id === id);
}

export function getProfileBySlug(slug: string): PlatformProfile | undefined {
  return PLATFORM_PROFILES.find((p) => p.slug === slug);
}

export function getLiveProfiles(): PlatformProfile[] {
  return PLATFORM_PROFILES.filter((p) => p.status === "live");
}

/** Throwing accessor for engine code that requires a valid profile. */
export function requireProfile(id: string): PlatformProfile {
  const profile = getProfile(id);
  if (!profile) throw new Error(`Unknown platform profile: ${id}`);
  return profile;
}
