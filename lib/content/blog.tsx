import type { ReactNode } from "react";
import type { FaqItem } from "./faq";

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
  /** Optional FAQ accordion rendered under the post (also emitted as JSON-LD). */
  faqs?: FaqItem[];
};

const UPLOAD_FAQ: FaqItem = {
  question: "Does VideoNest upload my video?",
  answer:
    "No. Everything runs inside your browser, on your device — there's no upload, no account, and nothing for us to see or store.",
};

const FREE_FAQ: FaqItem = {
  question: "Is VideoNest free?",
  answer: "Yes — completely free, no sign-up and no watermark.",
};

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
          Pre-process your video into exactly the shape WhatsApp wants <em>before</em> you upload —
          a 9:16 frame up to 1080×1920 (never upscaled), H.264 in an MP4 with faststart, and a
          high-quality bitrate that still fits comfortably under the size cap. That's exactly what
          VideoNest does, on your device, with nothing uploaded.
        </p>
        <h2>Two quick wins</h2>
        <ul>
          <li>
            Post from the <strong>WhatsApp mobile app</strong>, not WhatsApp Web — the web version
            compresses harder.
          </li>
          <li>Turn on HD in WhatsApp's media settings where available.</li>
        </ul>
      </>
    ),
    faqs: [
      {
        question: "Will the optimized video look exactly like the original?",
        answer:
          "No — WhatsApp always re-compresses Status videos, so some change is unavoidable. A clean, correctly-sized source means its pass does the least possible extra damage.",
      },
      UPLOAD_FAQ,
      FREE_FAQ,
    ],
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
          Instagram, like every platform, re-encodes your Reel on upload. You can't change that —
          but you can hand it a source clean enough that the result still looks great.
        </p>
        <h2>Target these specs</h2>
        <ul>
          <li>
            <strong>Aspect ratio:</strong> 9:16 vertical. Anything else gets cropped or letterboxed.
          </li>
          <li>
            <strong>Resolution:</strong> 1080×1920 — higher is wasted, Instagram downscales to
            ~1080p.
          </li>
          <li>
            <strong>Frame rate:</strong> 30fps is the safe, universal choice.
          </li>
          <li>
            <strong>Codec:</strong> H.264 in an MP4 with AAC audio — the most compatible combo.
          </li>
        </ul>
        <h2>Horizontal footage?</h2>
        <p>
          Don't stretch it. Place it on a blurred, scaled copy of itself as a 9:16 background — it
          fills the frame without distortion. VideoNest does this automatically when your source
          isn't already vertical.
        </p>
      </>
    ),
    faqs: [
      {
        question: "What bitrate should an Instagram Reel be?",
        answer:
          "Higher than you'd use for WhatsApp — Instagram isn't squeezing under a tiny size cap, so a generous H.264 bitrate gives its encoder more detail to preserve. VideoNest picks a quality-first bitrate for you.",
      },
      UPLOAD_FAQ,
      FREE_FAQ,
    ],
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
            A <strong>high bitrate</strong> H.264 source — give the encoder plenty of detail.
          </li>
          <li>Up to 60 seconds of runtime.</li>
        </ul>
        <h2>Higher bitrate in, sharper Short out</h2>
        <p>
          Unlike WhatsApp, YouTube isn't trying to squeeze your file under a tiny size cap, so a
          generous, quality-first bitrate gives its encoder more to work with. VideoNest's YouTube
          Shorts profile uses exactly that strategy — on your device, no upload.
        </p>
      </>
    ),
    faqs: [UPLOAD_FAQ, FREE_FAQ],
  },
  {
    slug: "why-instagram-reels-blurry",
    title: "Why are my Instagram Reels blurry after uploading?",
    description:
      "Blurry Reels almost always come from Instagram's upload re-encode. Here's why, and how to prevent it.",
    date: "2026-04-12",
    author: "VideoNest",
    readingMinutes: 4,
    excerpt:
      "Instagram re-encodes and downscales Reels on upload. A clean 9:16 1080p source keeps yours sharp.",
    Body: () => (
      <>
        <p>
          A Reel that looked crisp in your camera roll can turn soft the moment it's posted. The
          culprit is Instagram's upload pipeline, not your phone.
        </p>
        <h2>What Instagram does on upload</h2>
        <p>
          Instagram re-encodes every Reel to its own streaming formats and resolution ladder. If
          your source is the wrong aspect ratio, very large, or oddly encoded, Instagram's pass has
          to work harder and detail gets lost.
        </p>
        <h2>How to keep Reels sharp</h2>
        <ul>
          <li>Export 9:16 at 1080×1920 — don't go bigger.</li>
          <li>Use H.264 + AAC in an MP4.</li>
          <li>Upload over Wi-Fi; Instagram drops quality on weak connections.</li>
          <li>Avoid re-sharing an already-compressed Reel — each pass compounds.</li>
        </ul>
        <p>
          VideoNest prepares exactly this file on your device, so Instagram starts from the cleanest
          possible source.
        </p>
      </>
    ),
    faqs: [
      {
        question: "Does uploading over mobile data make Reels blurrier?",
        answer:
          "It can. Instagram may upload a lower-quality version on weak connections and backfill later, or not at all. Uploading on Wi-Fi gives the best result.",
      },
      UPLOAD_FAQ,
    ],
  },
  {
    slug: "why-facebook-videos-blurry",
    title: "Why does Facebook make my videos blurry?",
    description:
      "Facebook aggressively re-compresses uploads. Learn what it does and how to upload a sharper video.",
    date: "2026-04-20",
    author: "VideoNest",
    readingMinutes: 4,
    excerpt:
      "Facebook re-compresses feed and Story videos hard. A correctly-sized H.264 source keeps yours crisp.",
    Body: () => (
      <>
        <p>
          Facebook is one of the more aggressive re-compressors. Feed videos and Stories both get
          re-encoded, and the result can look noticeably softer than what you uploaded.
        </p>
        <h2>Why it happens</h2>
        <p>
          Facebook normalizes every upload to its own formats and bitrates so it can stream to
          billions of devices. Large or non-standard files take the biggest quality hit.
        </p>
        <h2>Upload a sharper video</h2>
        <ul>
          <li>Feed/landscape: 1080p 16:9, H.264, high bitrate.</li>
          <li>Stories/Reels: 1080×1920 9:16.</li>
          <li>Keep audio AAC; keep the file an MP4 with faststart.</li>
        </ul>
        <p>
          VideoNest's Facebook Video and Facebook Story profiles build exactly these files — on your
          device, nothing uploaded.
        </p>
      </>
    ),
    faqs: [
      {
        question: "Is Facebook or WhatsApp worse for video quality?",
        answer:
          "WhatsApp Status has the tightest size cap (~16 MB), so it compresses small clips hard. Facebook allows larger files but still re-encodes everything. Either way, a clean source helps.",
      },
      UPLOAD_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "why-youtube-videos-blurry-after-upload",
    title: "Why does my YouTube video look blurry after upload?",
    description:
      "New uploads often look soft for a while, and a weak source stays soft. Here's what's going on.",
    date: "2026-04-28",
    author: "VideoNest",
    readingMinutes: 4,
    excerpt:
      "YouTube processes uploads in stages and re-encodes to its own codecs. A clean 1080p source looks best.",
    Body: () => (
      <>
        <p>
          Two things make a fresh YouTube upload look blurry: processing time, and a weak source.
        </p>
        <h2>Processing happens in stages</h2>
        <p>
          Right after upload, YouTube serves a lower-resolution version while it finishes encoding
          the higher ones. Give it a few minutes (longer for 4K) and the sharper renditions appear.
        </p>
        <h2>But the source still matters</h2>
        <p>
          YouTube re-encodes every upload to its own codecs (H.264, VP9, AV1). The cleaner and
          higher-bitrate your source, the more detail survives that pass. Hand it a correctly-sized
          1080p (or higher) H.264 file rather than something already compressed.
        </p>
        <p>VideoNest prepares that clean source on your device before you upload.</p>
      </>
    ),
    faqs: [
      {
        question: "How long until my YouTube video is full quality?",
        answer:
          "Usually a few minutes for 1080p; higher resolutions like 4K can take longer to finish processing. The lower-res version shown immediately after upload is temporary.",
      },
      UPLOAD_FAQ,
    ],
  },
  {
    slug: "stop-videos-getting-blurry-social-media",
    title: "How to stop your videos getting blurry on social media",
    description:
      "A practical, platform-by-platform guide to uploading videos that stay sharp on WhatsApp, Instagram, YouTube and Facebook.",
    date: "2026-05-05",
    author: "VideoNest",
    readingMinutes: 6,
    excerpt:
      "Every platform re-compresses uploads. These habits keep your videos sharp across all of them.",
    Body: () => (
      <>
        <p>
          Every social platform re-compresses what you upload — that's unavoidable. But you can
          control the source you give them, and that's most of the battle.
        </p>
        <h2>The universal rules</h2>
        <ul>
          <li>
            <strong>Match the aspect ratio:</strong> 9:16 for Status/Reels/Shorts/Stories, 16:9 for
            standard YouTube/Facebook video.
          </li>
          <li>
            <strong>Don't over-size:</strong> 1080p is the sweet spot; bigger just gets downscaled.
          </li>
          <li>
            <strong>Use H.264 + AAC in an MP4:</strong> the format every platform expects.
          </li>
          <li>
            <strong>Upload on Wi-Fi</strong> and from the native mobile app where possible.
          </li>
          <li>
            <strong>Never re-share an already-compressed clip</strong> — each pass compounds the
            damage.
          </li>
        </ul>
        <h2>Let the tool handle it</h2>
        <p>
          VideoNest applies the right rules per platform automatically, entirely on your device.
          Pick your destination, drop in the clip, and you get a correctly-prepared file in seconds.
        </p>
      </>
    ),
    faqs: [
      {
        question: "Can you ever fully prevent compression?",
        answer:
          "No — platforms always re-encode uploads, and we never claim otherwise. The goal is to feed them an optimal source so the result stays as sharp as possible.",
      },
      UPLOAD_FAQ,
      FREE_FAQ,
    ],
  },
  {
    slug: "whatsapp-status-video-length-size-limits",
    title: "WhatsApp Status video length & size limits (and how to fit them)",
    description:
      "Status caps clips at 30 seconds and re-compresses under ~16 MB. Here's how to fit longer videos.",
    date: "2026-05-12",
    author: "VideoNest",
    readingMinutes: 4,
    excerpt:
      "WhatsApp Status allows 30s per clip. Longer videos can be split into sequential 30s parts.",
    Body: () => (
      <>
        <p>
          WhatsApp Status has two limits that trip people up: a <strong>30-second</strong> length
          cap per clip, and heavy compression to keep files small (around 16 MB).
        </p>
        <h2>Fitting a longer video</h2>
        <p>
          You don't have to choose one 30-second chunk and lose the rest. VideoNest automatically
          splits a longer clip into sequential 30-second parts — post them back to back and your
          full video plays in order on your Status.
        </p>
        <h2>Fitting the size</h2>
        <p>
          For the quality cap, the answer is a correctly-sized 9:16 1080p H.264 file with a bitrate
          tuned to land under WhatsApp's ceiling. VideoNest does this automatically so WhatsApp's
          own pass does minimal extra damage.
        </p>
      </>
    ),
    faqs: [
      {
        question: "How long can a WhatsApp Status video be?",
        answer:
          "Each Status clip is capped at 30 seconds. VideoNest splits longer videos into multiple 30-second parts you can post in sequence.",
      },
      {
        question: "What's the WhatsApp Status file size limit?",
        answer:
          "WhatsApp re-compresses Status uploads to keep them small (roughly 16 MB). VideoNest targets a bitrate that fits comfortably under that while keeping quality high.",
      },
      UPLOAD_FAQ,
    ],
  },
  {
    slug: "best-resolution-aspect-ratio-social-video",
    title: "The best resolution & aspect ratio for every social platform",
    description:
      "A quick reference for the resolution, aspect ratio and frame rate that look best on each platform.",
    date: "2026-05-18",
    author: "VideoNest",
    readingMinutes: 5,
    excerpt: "A cheat-sheet of the ideal resolution and aspect ratio for each social video format.",
    Body: () => (
      <>
        <p>
          Use the right shape and size for each destination and you're most of the way to a sharp
          post.
        </p>
        <h2>Vertical (9:16) — 1080×1920</h2>
        <ul>
          <li>WhatsApp Status (≤30s per clip)</li>
          <li>Instagram Reels &amp; Stories</li>
          <li>YouTube Shorts</li>
          <li>Facebook Stories &amp; Reels</li>
        </ul>
        <h2>Landscape (16:9) — 1920×1080</h2>
        <ul>
          <li>Standard YouTube videos</li>
          <li>Facebook feed videos</li>
        </ul>
        <h2>Frame rate &amp; codec</h2>
        <p>
          Stick to 30fps unless you specifically need 60 (fast motion / gaming), and always export
          H.264 video with AAC audio in an MP4. Going above 1080p rarely helps — most platforms
          downscale toward 1080p anyway.
        </p>
        <p>VideoNest applies the correct preset for whichever platform you choose.</p>
      </>
    ),
    faqs: [
      {
        question: "Is 4K worth uploading?",
        answer:
          "For short-form (Status/Reels/Shorts) it's usually wasted — platforms downscale to ~1080p. For standard YouTube it can help, but a clean 1080p source already looks great and processes faster.",
      },
      FREE_FAQ,
    ],
  },
  {
    slug: "fix-blurry-instagram-story-video",
    title: "How to fix blurry Instagram Story videos",
    description:
      "Blurry Stories come from wrong sizing and Instagram's upload re-encode. Here's the fix.",
    date: "2026-05-24",
    author: "VideoNest",
    readingMinutes: 3,
    excerpt:
      "Export a clean 9:16 1080×1920 file and upload on Wi-Fi to keep Instagram Stories crisp.",
    Body: () => (
      <>
        <p>
          Instagram Stories are 9:16, and anything that doesn't match gets cropped, scaled, or
          softened on upload.
        </p>
        <h2>The fix</h2>
        <ul>
          <li>Export exactly 1080×1920 (9:16).</li>
          <li>Keep it H.264 + AAC in an MP4.</li>
          <li>Upload on a strong Wi-Fi connection.</li>
          <li>Don't screenshot or re-record — start from the original.</li>
        </ul>
        <p>
          VideoNest's Instagram Story profile produces this file on your device in seconds, so the
          version Instagram re-encodes is already correctly sized.
        </p>
      </>
    ),
    faqs: [UPLOAD_FAQ, FREE_FAQ],
  },
  {
    slug: "compress-video-for-social-without-losing-quality",
    title: "How to compress video for social media without losing quality (in your browser)",
    description:
      "Compress and prepare video for social platforms entirely in your browser — no upload, no app.",
    date: "2026-06-01",
    author: "VideoNest",
    readingMinutes: 5,
    excerpt:
      "You can prepare a perfectly-sized social video right in your browser, on your device, for free.",
    Body: () => (
      <>
        <p>
          "Compress without losing quality" isn't quite possible — any compression discards some
          data. But you <em>can</em> compress smartly so the loss is invisible and the platform's
          own re-encode does minimal extra damage.
        </p>
        <h2>Do it in the browser</h2>
        <p>
          Modern browsers can encode video on-device using WebCodecs (with an ffmpeg.wasm fallback).
          That means no upload, no install, and your footage never leaves your device. VideoNest
          uses exactly this — a Web Worker runs the whole encode locally.
        </p>
        <h2>What "smart" compression looks like</h2>
        <ul>
          <li>Downscale only to the platform's target (e.g. 1080×1920) — never upscale.</li>
          <li>Cap frame rate at 30fps unless you need more.</li>
          <li>Pick a high, constrained bitrate that fits the platform's limits.</li>
          <li>Use a 2-second keyframe interval and faststart MP4 for smooth playback.</li>
        </ul>
        <p>Pick your platform on VideoNest and it applies all of this automatically.</p>
      </>
    ),
    faqs: [
      {
        question: "Is browser-based video encoding really private?",
        answer:
          "Yes. VideoNest processes everything locally in your browser via a Web Worker. No file is uploaded to any server — there's nothing for us to see.",
      },
      {
        question: "Do I need to install anything?",
        answer: "No. It's a web app — open it, drop in a video, and optimize. No app, no account.",
      },
      FREE_FAQ,
    ],
  },
  {
    slug: "facebook-story-reels-video-specs",
    title: "Facebook Story & Reels video specs that stay sharp",
    description:
      "The aspect ratio, resolution and format that keep Facebook Stories and Reels crisp.",
    date: "2026-06-08",
    author: "VideoNest",
    readingMinutes: 3,
    excerpt: "Facebook Stories and Reels are 9:16. Export 1080×1920 H.264 to keep them sharp.",
    Body: () => (
      <>
        <p>
          Facebook Stories and Reels share the vertical 9:16 format with Instagram, and Facebook
          re-compresses them on upload just as hard.
        </p>
        <h2>Target specs</h2>
        <ul>
          <li>9:16 aspect ratio, 1080×1920 resolution.</li>
          <li>H.264 video, AAC audio, MP4 container with faststart.</li>
          <li>30fps; up to 60 seconds for a Story.</li>
        </ul>
        <p>
          VideoNest's Facebook Story profile builds this file on your device. For landscape feed
          posts, use the Facebook Video profile (16:9, 1080p) instead.
        </p>
      </>
    ),
    faqs: [UPLOAD_FAQ, FREE_FAQ],
  },
];

export function getPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

/** Posts sorted newest-first for the index. */
export function getPostsSorted(): BlogPost[] {
  return [...BLOG_POSTS].sort((a, b) => (a.date < b.date ? 1 : -1));
}
