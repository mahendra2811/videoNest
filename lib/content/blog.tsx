import type { ReactNode } from "react";

export type BlogPost = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (absolute). */
  date: string;
  author: string;
  readingMinutes: number;
  excerpt: string;
  Body: () => ReactNode;
};

/**
 * File-based blog registry. Posts are plain TSX (no markdown dependency) and
 * render inside the shared <Prose> wrapper, so styling matches the rest of the
 * site. Keep copy honest — every platform re-encodes uploads; never "lossless".
 */
export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-whatsapp-status-videos-blurry",
    title: "Why are my WhatsApp Status videos blurry?",
    description:
      "WhatsApp re-compresses every Status upload. Here's exactly why your videos look soft — and how to keep them sharp.",
    date: "2026-05-20",
    author: "VideoNest",
    readingMinutes: 4,
    excerpt:
      "WhatsApp re-encodes every Status upload, caps the size, and downscales. Here's what's happening and how to fight back.",
    Body: () => (
      <>
        <p>
          You record a crisp clip, post it to your WhatsApp Status, and it comes out soft and
          blocky. You're not imagining it — and it isn't your camera. It's what WhatsApp does to
          every Status upload.
        </p>
        <h2>WhatsApp re-encodes everything</h2>
        <p>
          When you add a video to Status, WhatsApp doesn't store your original file. It{" "}
          <strong>re-encodes</strong> it so the clip is small enough to send quickly on any
          connection. That pass caps the file size (around 16 MB), downscales large videos toward
          roughly 720p, and applies fairly aggressive compression.
        </p>
        <p>
          If the file you hand WhatsApp is large, oddly sized, or in a format it doesn't like, the
          compressor has to work much harder — and that's when you get mush.
        </p>
        <h2>The fix: give WhatsApp a clean starting point</h2>
        <p>
          The trick is to pre-process your video into exactly the shape WhatsApp wants{" "}
          <em>before</em> you upload, so its own pass does the least possible extra damage:
        </p>
        <ul>
          <li>A 9:16 vertical frame at up to 1080×1920 (never upscaled).</li>
          <li>H.264 video in an MP4 with the moov atom at the front (faststart).</li>
          <li>
            A high-quality bitrate that still keeps a 30s clip comfortably under the size cap.
          </li>
        </ul>
        <p>
          That's exactly what VideoNest does — entirely on your device, with nothing uploaded. We're
          honest about the limit: WhatsApp will still re-compress your video. You can't stop that.
          But a clean, correctly-sized source keeps it as sharp as possible afterwards.
        </p>
        <h2>Two quick wins</h2>
        <ul>
          <li>
            Post from the <strong>WhatsApp mobile app</strong>, not WhatsApp Web — the web version
            compresses harder.
          </li>
          <li>Turn on HD in WhatsApp's media settings where it's available.</li>
        </ul>
      </>
    ),
  },
  {
    slug: "best-video-settings-instagram-reels",
    title: "The best video settings for Instagram Reels",
    description:
      "The resolution, aspect ratio, and bitrate that survive Instagram's compression — and how to export them.",
    date: "2026-05-28",
    author: "VideoNest",
    readingMinutes: 5,
    excerpt:
      "Instagram re-encodes Reels on upload. These export settings give it the cleanest possible source.",
    Body: () => (
      <>
        <p>
          Instagram, like every platform, re-encodes your Reel when you upload it. You can't change
          that — but you can hand it a source clean enough that the result still looks great.
        </p>
        <h2>Target these specs</h2>
        <ul>
          <li>
            <strong>Aspect ratio:</strong> 9:16 vertical. Anything else gets cropped or letterboxed.
          </li>
          <li>
            <strong>Resolution:</strong> 1080×1920. Higher than that is wasted — Instagram
            downscales to roughly 1080p anyway.
          </li>
          <li>
            <strong>Frame rate:</strong> 30fps is the safe, universal choice.
          </li>
          <li>
            <strong>Codec:</strong> H.264 in an MP4 with AAC audio — the most compatible combo.
          </li>
        </ul>
        <h2>What about horizontal footage?</h2>
        <p>
          If your clip is horizontal, don't stretch it. The cleanest approach is to place it on a
          blurred, scaled copy of itself as a 9:16 background — it fills the frame without
          distortion. VideoNest does this automatically when your source isn't already vertical.
        </p>
        <h2>Export it the easy way</h2>
        <p>
          Rather than fiddling with export presets, drop your clip into the VideoNest Instagram
          Reels tool. It produces a correctly-sized 1080×1920 H.264 file on your device — no upload,
          no account — so Instagram's pass starts from the best possible source.
        </p>
      </>
    ),
  },
  {
    slug: "keep-youtube-shorts-sharp",
    title: "How to keep YouTube Shorts sharp",
    description:
      "YouTube re-encodes uploads to its own formats. A clean, high-bitrate vertical source keeps your Short crisp.",
    date: "2026-06-05",
    author: "VideoNest",
    readingMinutes: 4,
    excerpt:
      "YouTube re-encodes Shorts on upload. Here's how to give it a source that stays sharp.",
    Body: () => (
      <>
        <p>
          YouTube Shorts can look fantastic — but only if you upload a clean source. YouTube
          re-encodes every upload into its own delivery formats, so a weak source compounds into a
          soft Short.
        </p>
        <h2>What YouTube wants from a Short</h2>
        <ul>
          <li>
            <strong>9:16 vertical</strong>, up to 1080×1920.
          </li>
          <li>
            A <strong>high bitrate</strong> H.264 source — give the encoder plenty of detail to work
            from.
          </li>
          <li>Up to 60 seconds of runtime.</li>
        </ul>
        <h2>Higher bitrate in, sharper Short out</h2>
        <p>
          Unlike WhatsApp, YouTube isn't trying to squeeze your file under a tiny size cap, so
          there's no benefit to a heavily-compressed upload. The opposite is true: a generous,
          quality-first bitrate gives YouTube's encoder more to preserve. VideoNest's YouTube Shorts
          profile uses exactly that strategy.
        </p>
        <p>
          As always, it runs entirely on your device — your footage never leaves your phone or
          computer.
        </p>
      </>
    ),
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Posts sorted newest-first for the index. */
export function getPostsSorted(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
