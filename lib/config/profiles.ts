import type { PlatformProfile } from "@/lib/engine/types";

/**
 * The single source of truth for platform output profiles. Both the home grid
 * and the encode engine read from this registry, so adding a platform later is
 * additive — flip `status: 'soon'` to `'live'` and wire a share adapter.
 *
 * WhatsApp Status is the only live profile in v1 (see spec §3). The encode
 * profile is encoded here as data.
 */
export const PLATFORM_PROFILES: PlatformProfile[] = [
  {
    id: "whatsapp-status",
    label: "WhatsApp Status",
    status: "live",
    icon: "MessageCircle",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 30,
    fpsCap: 30,
    sizeCapMB: 15,
    bitrateStrategy: "constrained",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint:
      "Tap Share to WhatsApp, then choose My Status. Quality is the same as downloading — we already optimized it.",
    blurb: "Stay sharp after WhatsApp's squeeze.",
  },
  // -------------------------------------------------------------------------
  // "Coming soon" placeholders — scaffolded so the engine + UI are already
  // profile-driven. Do NOT build these in v1 (see spec §17).
  // -------------------------------------------------------------------------
  {
    id: "instagram-reels",
    label: "Instagram Reels",
    status: "soon",
    icon: "Camera",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 90,
    fpsCap: 30,
    sizeCapMB: 100,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Coming soon.",
    blurb: "Vertical reels, ready to post.",
  },
  {
    id: "instagram-story",
    label: "Instagram Story",
    status: "soon",
    icon: "Camera",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 30,
    sizeCapMB: 100,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Coming soon.",
    blurb: "Crisp 9:16 stories.",
  },
  {
    id: "youtube-shorts",
    label: "YouTube Shorts",
    status: "soon",
    icon: "Clapperboard",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 60,
    sizeCapMB: 256,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 192 },
    shareHint: "Coming soon.",
    blurb: "Short-form, high bitrate.",
  },
  {
    id: "youtube-long",
    label: "YouTube",
    status: "soon",
    icon: "Clapperboard",
    aspect: "16:9",
    maxWidth: 1920,
    maxHeight: 1080,
    maxDurationSec: 60 * 60,
    fpsCap: 60,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 256 },
    shareHint: "Coming soon.",
    blurb: "Landscape, high-bitrate uploads.",
  },
  {
    id: "facebook-video",
    label: "Facebook Video",
    status: "soon",
    icon: "ThumbsUp",
    aspect: "16:9",
    maxWidth: 1920,
    maxHeight: 1080,
    maxDurationSec: 60 * 20,
    fpsCap: 30,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 192 },
    shareHint: "Coming soon.",
    blurb: "Landscape video for the feed.",
  },
  {
    id: "facebook-story",
    label: "Facebook Story",
    status: "soon",
    icon: "ThumbsUp",
    aspect: "9:16",
    maxWidth: 1080,
    maxHeight: 1920,
    maxDurationSec: 60,
    fpsCap: 30,
    sizeCapMB: 100,
    bitrateStrategy: "overprovision",
    audio: { codec: "aac", bitrateKbps: 128 },
    shareHint: "Coming soon.",
    blurb: "Vertical stories for Facebook.",
  },
];

/** The default (and only live) profile in v1. */
export const DEFAULT_PROFILE_ID = "whatsapp-status";

export function getProfile(id: string): PlatformProfile | undefined {
  return PLATFORM_PROFILES.find((p) => p.id === id);
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
