import { getProfile } from "@/lib/config/profiles";
import type { FaqItem } from "./faq";

/** All user-facing copy for a platform's tool page. Honest by design — never
 * claims "lossless" or "no quality loss"; every destination re-encodes. */
export type PlatformContent = {
  /** Gradient-highlighted phrase in the H1 (after "Optimize for"). */
  highlight: string;
  /** Header subheadline. */
  sub: string;
  /** Honest note shown under the tool and inside the preview. */
  promise: string;
  /** SEO metadata. */
  metaTitle: string;
  metaDescription: string;
  /** Share button label + share-sheet text. */
  shareButtonLabel: string;
  shareText: string;
  /** Device-aware "best way to post" copy. */
  share: { mobileShare: string; mobileDownload: string; desktop: string };
  faqs: FaqItem[];
};

const PRIVACY_FAQ: FaqItem = {
  question: "Do you upload my video?",
  answer:
    "Never. Everything happens inside your browser, on your device. Your video is never sent to a server — no upload, no account, nothing for us to see or store.",
};

const FREE_FAQ: FaqItem = {
  question: "Is it free?",
  answer:
    "Yes, completely free. No sign-up, no watermark, no limits on how many videos you optimize.",
};

const PLATFORMS: Record<string, PlatformContent> = {
  "whatsapp-status": {
    highlight: "WhatsApp Status",
    sub: "Drop in a video and we'll prepare it on your device so it stays as sharp as possible after WhatsApp's compression.",
    promise:
      "WhatsApp re-compresses every Status video. We can't stop that — we prepare yours so it stays as sharp as possible.",
    metaTitle: "WhatsApp Status video optimizer",
    metaDescription:
      "Optimize any video for WhatsApp Status so it stays sharp after WhatsApp compresses it. Free, private, and 100% on your device — no upload.",
    shareButtonLabel: "Share to WhatsApp",
    shareText: "Optimized for WhatsApp Status",
    share: {
      mobileShare:
        "Tap Share to WhatsApp, then choose My Status. Quality is the same as downloading — we already optimized it.",
      mobileDownload: "Tap Download, then post it from the WhatsApp app.",
      desktop:
        "Download, then post from your phone's WhatsApp app (not WhatsApp Web — it compresses harder).",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "No — and we won't pretend otherwise. WhatsApp always re-compresses Status videos. VideoNest prepares a clean, correctly-sized 9:16 file so WhatsApp's pass does the least possible extra damage.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },

  "instagram-reels": {
    highlight: "Instagram Reels",
    sub: "Prepare a clean 9:16 file on your device so your Reel stays crisp after Instagram re-encodes it.",
    promise:
      "Instagram re-compresses uploads. We hand it a correctly-sized 1080×1920 file so your Reel keeps as much detail as possible.",
    metaTitle: "Instagram Reels video optimizer",
    metaDescription:
      "Optimize any video for Instagram Reels — 9:16, correctly sized, on your device. Free and private, with no upload.",
    shareButtonLabel: "Share",
    shareText: "Optimized for Instagram Reels",
    share: {
      mobileShare: "Tap Share, then post the saved video as a Reel from the Instagram app.",
      mobileDownload: "Tap Download, then post it as a Reel from the Instagram app.",
      desktop: "Download, then upload it as a Reel from the Instagram mobile app.",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "Instagram re-encodes every upload, so some change is unavoidable. We give it a clean, correctly-sized 9:16 file so your Reel stays as sharp as possible afterwards.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },

  "instagram-story": {
    highlight: "Instagram Story",
    sub: "Get a crisp 9:16 file, prepared on your device, that survives Instagram's Story compression.",
    promise:
      "Instagram re-compresses Stories. We prepare a correctly-sized 1080×1920 file so yours stays as sharp as possible.",
    metaTitle: "Instagram Story video optimizer",
    metaDescription:
      "Optimize any video for Instagram Stories — vertical, correctly sized, processed on your device. Free, private, no upload.",
    shareButtonLabel: "Share",
    shareText: "Optimized for Instagram Story",
    share: {
      mobileShare: "Tap Share, then add the saved video to your Story from the Instagram app.",
      mobileDownload: "Tap Download, then add it to your Story from the Instagram app.",
      desktop: "Download, then add it to your Story from the Instagram mobile app.",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "Instagram re-encodes Stories on upload. VideoNest prepares a clean 9:16 file so the result stays as crisp as possible.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },

  "youtube-shorts": {
    highlight: "YouTube Shorts",
    sub: "Prepare a high-bitrate 9:16 file on your device so your Short looks its sharpest after YouTube processes it.",
    promise:
      "YouTube re-encodes every upload. We hand it a clean, correctly-sized vertical file so your Short looks as sharp as possible.",
    metaTitle: "YouTube Shorts video optimizer",
    metaDescription:
      "Optimize any video for YouTube Shorts — 9:16, high bitrate, processed on your device. Free, private, no upload.",
    shareButtonLabel: "Share",
    shareText: "Optimized for YouTube Shorts",
    share: {
      mobileShare: "Tap Share or Download, then upload it as a Short from the YouTube app.",
      mobileDownload: "Tap Download, then upload it as a Short from the YouTube app.",
      desktop: "Download, then upload it as a Short from YouTube on desktop or the app.",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "YouTube re-encodes uploads to its own formats. A clean, high-bitrate source gives it the best starting point, so your Short stays sharp.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },

  "youtube-long": {
    highlight: "YouTube",
    sub: "Prepare a clean 16:9 H.264 file on your device that meets YouTube's upload specs.",
    promise:
      "YouTube re-encodes every upload. We give it a clean, correctly-sized 1080p file so your video looks its sharpest after processing.",
    metaTitle: "YouTube video optimizer",
    metaDescription:
      "Optimize any video for YouTube — 16:9, high bitrate H.264, processed on your device. Free, private, no upload.",
    shareButtonLabel: "Share",
    shareText: "Optimized for YouTube",
    share: {
      mobileShare: "Tap Share or Download, then upload it from the YouTube app.",
      mobileDownload: "Tap Download, then upload it from the YouTube app.",
      desktop: "Download, then upload it to YouTube Studio from your computer.",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "YouTube re-encodes everything you upload. Handing it a clean, correctly-sized 1080p H.264 file helps it preserve as much quality as possible.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },

  "facebook-video": {
    highlight: "Facebook",
    sub: "Prepare a clean 16:9 file on your device so your Facebook video stays sharp after upload.",
    promise:
      "Facebook re-compresses uploads. We prepare a correctly-sized 1080p file so your video keeps as much detail as possible.",
    metaTitle: "Facebook video optimizer",
    metaDescription:
      "Optimize any video for Facebook — 16:9, correctly sized, processed on your device. Free, private, no upload.",
    shareButtonLabel: "Share",
    shareText: "Optimized for Facebook",
    share: {
      mobileShare: "Tap Share, then post the saved video from the Facebook app.",
      mobileDownload: "Tap Download, then post it from the Facebook app.",
      desktop: "Download, then post it to your feed from Facebook.",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "Facebook re-encodes uploads. VideoNest gives it a clean, correctly-sized file so your video stays as sharp as possible.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },

  "facebook-story": {
    highlight: "Facebook Story",
    sub: "Get a crisp 9:16 file, prepared on your device, that survives Facebook's Story compression.",
    promise:
      "Facebook re-compresses Stories. We prepare a correctly-sized 1080×1920 file so yours stays as sharp as possible.",
    metaTitle: "Facebook Story video optimizer",
    metaDescription:
      "Optimize any video for Facebook Stories — vertical, correctly sized, processed on your device. Free, private, no upload.",
    shareButtonLabel: "Share",
    shareText: "Optimized for Facebook Story",
    share: {
      mobileShare: "Tap Share, then add the saved video to your Story from the Facebook app.",
      mobileDownload: "Tap Download, then add it to your Story from the Facebook app.",
      desktop: "Download, then add it to your Story from the Facebook mobile app.",
    },
    faqs: [
      {
        question: "Will it look exactly like the original?",
        answer:
          "Facebook re-encodes Stories on upload. A clean 9:16 source keeps the result as crisp as possible.",
      },
      PRIVACY_FAQ,
      FREE_FAQ,
    ],
  },
};

/** Get a platform's tool-page copy, with a safe generic fallback. */
export function getPlatformContent(profileId: string): PlatformContent {
  const found = PLATFORMS[profileId];
  if (found) return found;
  const label = getProfile(profileId)?.label ?? "your platform";
  return {
    highlight: label,
    sub: `Prepare a clean, correctly-sized file on your device for ${label}.`,
    promise: `${label} re-encodes uploads. We prepare an optimal file so yours stays as sharp as possible.`,
    metaTitle: `${label} video optimizer`,
    metaDescription: `Optimize any video for ${label}, processed entirely on your device. Free, private, no upload.`,
    shareButtonLabel: "Share",
    shareText: `Optimized for ${label}`,
    share: {
      mobileShare: "Tap Share to send the saved video to the app.",
      mobileDownload: "Tap Download, then post it from the app.",
      desktop: "Download, then post it from the app.",
    },
    faqs: [PRIVACY_FAQ, FREE_FAQ],
  };
}
