import type { FaqItem } from "./faq";

/**
 * Programmatic SEO "intent" guides. Each is a real, useful landing page that
 * targets a long-tail keyword AND embeds the right optimizer inline — not a thin
 * doorway page. Add an entry here and it gets a route, metadata, JSON-LD and a
 * sitemap entry automatically. Honest copy only (no "lossless").
 */
export type Guide = {
  slug: string;
  /** Which platform optimizer to embed + preselect. */
  profileId: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  /** Lead paragraph under the H1. */
  intro: string;
  sections: { heading: string; body: string[] }[];
  faqs: FaqItem[];
};

export const GUIDES: Guide[] = [
  {
    slug: "whatsapp-status-video-size-limit",
    profileId: "whatsapp-status",
    title: "WhatsApp Status video size & length limit",
    metaTitle: "WhatsApp Status video size limit — and how to stay under it",
    metaDescription:
      "WhatsApp Status caps video size (~16 MB) and length (30s) and re-compresses everything. Here's the limit and how to prepare a clip that stays sharp.",
    intro:
      "WhatsApp Status enforces a size cap (around 16 MB), a 30-second length per clip, and re-encodes every upload. If your file is bigger or oddly shaped, the result looks soft. Here's how to land just under the limit.",
    sections: [
      {
        heading: "The limits, in short",
        body: [
          "Length: about 30 seconds per Status clip — longer videos are split or trimmed.",
          "Size: roughly 16 MB after WhatsApp's own re-encode; large files get downscaled toward ~720p.",
          "Shape: 9:16 vertical fills the screen; other shapes get letterboxed or cropped by WhatsApp.",
        ],
      },
      {
        heading: "How to stay sharp under the cap",
        body: [
          "Hand WhatsApp a file that's already 9:16, 1080p-or-below, and bitrate-budgeted to fit under the size cap — so its re-encode has almost nothing to fix.",
          "VideoNest does this on your device: it picks a constrained bitrate under the cap, downscales with a high-quality resampler, and auto-splits clips over 30s into parts.",
        ],
      },
    ],
    faqs: [
      {
        question: "What is the WhatsApp Status video size limit?",
        answer:
          "After WhatsApp re-encodes it, a Status clip is around 16 MB and downscaled toward 720p. Giving WhatsApp a clean ~16 MB 1080p file keeps it as sharp as possible.",
      },
      {
        question: "How long can a WhatsApp Status video be?",
        answer:
          "About 30 seconds per clip. VideoNest can split a longer video into sequential parts that each fit.",
      },
    ],
  },
  {
    slug: "why-are-my-instagram-reels-blurry",
    profileId: "instagram-reels",
    title: "Why are my Instagram Reels blurry?",
    metaTitle: "Why are my Instagram Reels blurry? How to fix it",
    metaDescription:
      "Instagram re-compresses Reels and downscales anything above 1080p with a weak scaler. Here's why they look blurry and how to upload a sharp Reel.",
    intro:
      "Instagram re-encodes every Reel and downscales sources above 1080p with its own fast (not-great) scaler. The fix is to hand it exactly 1080×1920 at a sensible bitrate.",
    sections: [
      {
        heading: "Why it happens",
        body: [
          "Uploading 4K means Instagram downscales it for you with a scaler that adds shimmer and softness.",
          "An over-sized or oddly-shaped file forces a harder re-encode, which looks worse.",
        ],
      },
      {
        heading: "The fix",
        body: [
          "Downscale to 1080×1920 yourself with a good resampler and a generous H.264 bitrate, then post from the Instagram app.",
          "VideoNest's Instagram Reels profile does exactly this on your device.",
        ],
      },
    ],
    faqs: [
      {
        question: "What resolution should I upload Reels in?",
        answer:
          "1080×1920 (9:16). Higher gets downscaled by Instagram anyway — doing it yourself with a good resampler looks cleaner.",
      },
    ],
  },
  {
    slug: "best-resolution-for-youtube-shorts",
    profileId: "youtube-shorts",
    title: "Best resolution & bitrate for YouTube Shorts",
    metaTitle: "Best resolution for YouTube Shorts (keep them sharp)",
    metaDescription:
      "YouTube rewards a high-resolution, high-bitrate source. Here's the best resolution and bitrate to upload sharp YouTube Shorts.",
    intro:
      "Unlike WhatsApp, YouTube's encoder rewards a bigger, higher-bitrate source — the more clean signal you give it, the better its re-encode looks.",
    sections: [
      {
        heading: "Aim high",
        body: [
          "Keep resolution high: 1080p, 1440p, even 4K sources are fine — YouTube uses the extra detail.",
          "Use a generous bitrate so YouTube's VP9/AV1 ladder has more to preserve. Keep your native frame rate.",
        ],
      },
      {
        heading: "Don't pre-shrink",
        body: [
          "Shrinking a YouTube upload throws away detail YouTube could have kept. VideoNest's Shorts profile passes resolution through (up to 1440p in-browser) and uses a higher bitrate on purpose.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I upload 4K to YouTube Shorts?",
        answer:
          "Yes if your source is 4K — YouTube rewards higher-resolution, higher-bitrate sources. VideoNest keeps resolution high for YouTube instead of shrinking it.",
      },
    ],
  },
  {
    slug: "compress-video-for-instagram-story",
    profileId: "instagram-story",
    title: "How to prepare a video for Instagram Story",
    metaTitle: "Prepare a video for Instagram Story without it looking soft",
    metaDescription:
      "Instagram Stories re-compress uploads. Here's how to prepare a 9:16 1080p video so your Story stays sharp.",
    intro:
      "Instagram Stories re-encode uploads and cap toward 1080p. Hand Instagram a clean 1080×1920 file so its pass does the least damage.",
    sections: [
      {
        heading: "What to upload",
        body: [
          "9:16, 1080×1920, a generous H.264 bitrate, standard MP4.",
          "Avoid baked-in letterbox bars — full-frame vertical looks best.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does VideoNest upload my Story video?",
        answer:
          "No. Everything runs on your device — there's no upload, no account, and nothing stored.",
      },
    ],
  },
  {
    slug: "fit-or-fill-vertical-video",
    profileId: "whatsapp-status",
    title: "Fit or fill: making a landscape video vertical",
    metaTitle: "Fit vs fill — turn a landscape video into 9:16 vertical",
    metaDescription:
      "Got a landscape clip for a vertical Status or Reel? Here's the difference between fit (blurred bars) and fill (crop), and how to choose.",
    intro:
      "When your video isn't 9:16, you have two honest choices: fit it with a blurred background, or fill the frame by cropping. Here's how to pick.",
    sections: [
      {
        heading: "Fit (blur-pad)",
        body: [
          "Keeps the whole frame, placing it over a blurred, zoomed copy of itself. Nothing is cut off. Best when the framing matters.",
        ],
      },
      {
        heading: "Fill (crop)",
        body: [
          "Crops the sides (or top/bottom) so the video fills the screen with no bars. Best when the subject is centred.",
          "VideoNest's editor previews both so you can choose before exporting.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I make a landscape video fit a vertical Status?",
        answer:
          "Use Fit to keep the whole frame with a blurred background, or Fill to crop it to full-screen 9:16. VideoNest's Edit step previews both.",
      },
    ],
  },
  {
    slug: "facebook-story-video-quality",
    profileId: "facebook-story",
    title: "Posting a sharp Facebook Story video",
    metaTitle: "Facebook Story video quality — keep it sharp",
    metaDescription:
      "Facebook Stories re-compress uploads. Here's how to prepare a 9:16 1080p file so your Facebook Story stays sharp.",
    intro:
      "Facebook re-encodes Story uploads like every platform. A correctly-shaped, sensibly-bitrated 1080×1920 MP4 means its pass has little to fix.",
    sections: [
      {
        heading: "What works",
        body: [
          "9:16, 1080×1920, generous H.264 bitrate, standard MP4. Post from the Facebook app, not the web.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why does my Facebook Story look low quality?",
        answer:
          "Facebook re-compresses uploads and downscales large files. Preparing a clean 1080p 9:16 file first keeps it as sharp as possible.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
