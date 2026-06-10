import type { PlatformProfile } from "@/lib/engine/types";

/**
 * The single source of truth for platform output profiles. Both the home grid
 * and the encode engine read from this registry, so each platform is fully
 * data-driven — its tool route (`slug`), encode parameters, and share copy all
 * live here.
 *
 * WhatsApp Status uses the constrained (hard size-cap) strategy; the others use
 * `overprovision` (high quality, capped by the platform's own size limit when
 * one is stated). All processing stays 100% on-device.
 */
export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: "whatsapp-status",
    label: "WhatsApp Status",
    status: "live",
    slug: "whatsapp-status-video",
    icon: "MessageCircle",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 30,
    fpsCap: 30,
    sizeCapMB: 15,
    bitrateStrategy: "constrained",
    splitOversize: true,
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint:
      "Tap Share to WhatsApp, then choose My Status. Quality is the same as downloading — we already optimized it.",
    blurb: "Stay sharp after WhatsApp's squeeze.",
  },
  {
    id: "instagram-reels",
    label: "Instagram Reels",
    status: "live",
    slug: "instagram-reels-video",
    icon: "Camera",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 90,
    fpsCap: 30,
    sizeCapMB: 100,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Tap Share, then post the saved video as a Reel from the Instagram app.",
    blurb: "Vertical reels, ready to post.",
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    status: "live",
    slug: "instagram-story-video",
    icon: "Camera",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 30,
    sizeCapMB: 100,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Tap Share, then add the saved video to your Story from the Instagram app.",
    blurb: "Crisp 9:16 stories.",
  },
  {
    id: "youtube-shorts",
    label: "YouTube Shorts",
    status: "live",
    slug: "youtube-shorts-video",
    icon: "Clapperboard",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 60,
    sizeCapMB: 256,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 192 },
    shareHint: "Download, then upload it as a Short from the YouTube app.",
    blurb: "Short-form, high bitrate.",
  },
  {
    id: "youtube-long",
    label: "YouTube",
    status: "live",
    slug: "youtube-video",
    icon: "Clapperboard",
    aspect: "16:9",
    maxWidth: 1920,
    maxHeight: 1080,
    maxDurationSec: 60 * 10,
    fpsCap: 60,
    sizeCapMB: 0,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 256 },
    shareHint: "Download, then upload it to YouTube from your computer or the app.",
    blurb: "Landscape, high-bitrate uploads.",
  },
  {
    id: "facebook-video",
    label: "Facebook Video",
    status: "live",
    slug: "facebook-video",
    icon: "ThumbsUp",
    aspect: "16:9",
    maxWidth: 1920,
    maxHeight: 1080,
    maxDurationSec: 60 * 10,
    fpsCap: 30,
    sizeCapMB: 0,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 192 },
    shareHint: "Download, then post it to your feed from the Facebook app.",
    blurb: "Landscape video for the feed.",
  },
  {
    id: "facebook-story",
    label: "Facebook Story",
    status: "live",
    slug: "facebook-story-video",
    icon: "ThumbsUp",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 30,
    sizeCapMB: 100,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Tap Share, then add the saved video to your Story from the Facebook app.",
    blurb: "Vertical stories for Facebook.",
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
