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
  {
    slug: "whatsapp-status-not-full-screen",
    profileId: "whatsapp-status",
    title: "Why isn't my WhatsApp Status full screen?",
    metaTitle: "WhatsApp Status not full screen? Fix the black bars",
    metaDescription:
      "Black bars on your WhatsApp Status mean the video isn't 9:16. Here's how to make it full-screen vertical without stretching.",
    intro:
      "Black bars appear when your clip isn't 9:16. WhatsApp shows the whole frame and pads the rest. To fill the screen, the video has to be vertical — by cropping or padding.",
    sections: [
      {
        heading: "Why the bars appear",
        body: [
          "A landscape (16:9) or square clip can't fill a 9:16 screen, so WhatsApp letterboxes it with black bars.",
          "Stretching to fit would distort faces — which is why no good tool does it.",
        ],
      },
      {
        heading: "Make it full screen",
        body: [
          "Fill (crop) the video to 9:16 to fill the screen, or Fit it over a blurred background so nothing is cut off.",
          "VideoNest's editor previews both choices before you export.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I make my WhatsApp Status fill the screen?",
        answer:
          "Make the video 9:16 — crop it to fill, or pad it with a blurred background. VideoNest's Edit step previews both.",
      },
    ],
  },
  {
    slug: "whatsapp-status-hd-upload",
    profileId: "whatsapp-status",
    title: "How to upload WhatsApp Status in HD",
    metaTitle: "Upload WhatsApp Status in HD (and keep it sharp)",
    metaDescription:
      "Turn on WhatsApp's HD upload and prepare your clip first so your Status stays as sharp as possible after compression.",
    intro:
      "WhatsApp has an HD upload setting that compresses less aggressively. Combined with a clean, correctly-sized source, it's the sharpest your Status can look.",
    sections: [
      {
        heading: "Turn on HD upload",
        body: [
          "In WhatsApp: Settings → Storage and data → Media upload quality → HD. This applies to Status and chats.",
          "HD still re-compresses — it just starts from a higher ceiling.",
        ],
      },
      {
        heading: "Pair it with a clean source",
        body: [
          "Run your clip through VideoNest first so it's 9:16, 1080p-or-below and bitrate-budgeted — then post with HD on.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does WhatsApp HD upload stop compression?",
        answer:
          "No — it compresses less, but still re-encodes. Giving it a clean source first keeps the result sharpest.",
      },
    ],
  },
  {
    slug: "whatsapp-status-longer-than-30-seconds",
    profileId: "whatsapp-status",
    title: "Posting a WhatsApp Status longer than 30 seconds",
    metaTitle: "WhatsApp Status longer than 30 seconds — how to post it",
    metaDescription:
      "WhatsApp limits each Status clip to ~30 seconds. Here's how to post a longer video by splitting it into parts.",
    intro:
      "WhatsApp caps each Status clip at about 30 seconds. To post a longer video, it has to be split into sequential parts that each fit.",
    sections: [
      {
        heading: "The 30-second cap",
        body: [
          "Anything longer is trimmed or rejected. The clean way to keep the whole video is to split it.",
          "VideoNest auto-splits an over-length clip into parts, each optimized and named in order.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I post a 1-minute video to WhatsApp Status?",
        answer:
          "Not as one clip — WhatsApp caps each at ~30s. VideoNest splits it into sequential parts that each fit and stay sharp.",
      },
    ],
  },
  {
    slug: "compress-video-for-whatsapp-without-app",
    profileId: "whatsapp-status",
    title: "Compress a video for WhatsApp without installing an app",
    metaTitle: "Compress video for WhatsApp — no app, no upload",
    metaDescription:
      "Prepare a video for WhatsApp right in your browser — no app to install, nothing uploaded, free. Here's how.",
    intro:
      "You don't need to install anything or upload your video to prepare it for WhatsApp. VideoNest runs in your browser, on your device.",
    sections: [
      {
        heading: "Browser-based, on-device",
        body: [
          "VideoNest uses your browser's built-in video engine — no install, no account, no upload. Your file never leaves your phone.",
          "It sizes the clip to WhatsApp's limits so the result stays sharp.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is there a way to compress video for WhatsApp without an app?",
        answer:
          "Yes — VideoNest does it in your browser on your device, with no install and no upload.",
      },
    ],
  },
  {
    slug: "instagram-reels-video-size-limit",
    profileId: "instagram-reels",
    title: "Instagram Reels video size & length limit",
    metaTitle: "Instagram Reels size limit — length, resolution, file size",
    metaDescription:
      "What are the Instagram Reels limits for length, resolution and file size? Here's what to upload so your Reel stays sharp.",
    intro:
      "Reels support up to 90 seconds, prefer 1080×1920, and re-compress on upload. Hand Instagram a clean 1080p file and it stays sharp.",
    sections: [
      {
        heading: "The limits",
        body: [
          "Length up to 90 seconds; aspect 9:16; resolution 1080×1920 is the sweet spot.",
          "Above 1080p, Instagram downscales with its own scaler — better to do it yourself.",
        ],
      },
    ],
    faqs: [
      {
        question: "What size should an Instagram Reel be?",
        answer:
          "1080×1920, 9:16, up to 90 seconds, MP4/H.264 at a generous bitrate. VideoNest prepares exactly this.",
      },
    ],
  },
  {
    slug: "best-format-for-instagram-reels",
    profileId: "instagram-reels",
    title: "The best file format for Instagram Reels",
    metaTitle: "Best format for Instagram Reels (MP4 / H.264)",
    metaDescription:
      "MP4 with H.264 video and AAC audio is the most compatible, sharpest-surviving format for Instagram Reels. Here's why.",
    intro:
      "MP4 with H.264 video and AAC audio is the safest, most compatible container for Reels — and what survives Instagram's re-encode best.",
    sections: [
      {
        heading: "Why MP4 / H.264",
        body: [
          "It's the format Instagram expects, so its re-encode does less work and looks cleaner.",
          "Exotic codecs force a harder conversion and can fail outright.",
        ],
      },
    ],
    faqs: [
      {
        question: "What format should I export Reels in?",
        answer: "MP4 (H.264 video, AAC audio). VideoNest always outputs this.",
      },
    ],
  },
  {
    slug: "instagram-story-blurry-fix",
    profileId: "instagram-story",
    title: "Why is my Instagram Story blurry?",
    metaTitle: "Instagram Story blurry? Here's the fix",
    metaDescription:
      "Instagram Stories re-compress uploads and downscale large files. Here's why your Story looks blurry and how to fix it.",
    intro:
      "Stories re-encode every upload and downscale anything large. A clean 1080×1920 source keeps yours sharp.",
    sections: [
      {
        heading: "The cause & fix",
        body: [
          "Uploading from the web, or a 4K/oddly-shaped file, makes Instagram's re-encode work harder.",
          "Upload a 1080×1920 9:16 file from the app. VideoNest prepares it on your device.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I stop my Instagram Story from being blurry?",
        answer:
          "Upload a clean 1080×1920 9:16 file from the Instagram app, not the web. VideoNest prepares it for you.",
      },
    ],
  },
  {
    slug: "youtube-shorts-blurry-after-upload",
    profileId: "youtube-shorts",
    title: "YouTube Shorts blurry after upload?",
    metaTitle: "YouTube Shorts blurry after upload — how to fix it",
    metaDescription:
      "Shorts can look soft right after upload while YouTube finishes processing — and a weak source doesn't help. Here's what to do.",
    intro:
      "Two things cause soft Shorts: YouTube is still processing higher-quality versions (wait a bit), and your source was too low-bitrate. Fix the second.",
    sections: [
      {
        heading: "Give it time, then give it bits",
        body: [
          "Right after upload, YouTube serves a low-res version while it processes — it sharpens within minutes.",
          "Beyond that, upload a high-resolution, high-bitrate source. VideoNest's Shorts profile keeps resolution high on purpose.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why is my Short blurry right after posting?",
        answer:
          "YouTube serves a low-res version while processing; it sharpens within minutes. A higher-bitrate source helps the final result.",
      },
    ],
  },
  {
    slug: "youtube-best-upload-settings",
    profileId: "youtube-long",
    title: "Best YouTube upload settings for quality",
    metaTitle: "Best YouTube upload settings (resolution, bitrate, codec)",
    metaDescription:
      "YouTube rewards high-resolution, high-bitrate sources. Here are the best upload settings to keep your video sharp.",
    intro:
      "YouTube's encoder rewards a generous source. Upload high resolution, a high bitrate, your native frame rate, and a clean codec.",
    sections: [
      {
        heading: "Recommended",
        body: [
          "Resolution: 1080p, 1440p or 4K. Bitrate: generous. Frame rate: native. Codec: H.264, or AV1/HEVC if available.",
          "VideoNest's YouTube profiles let you pick the quality and codec, passing resolution through instead of shrinking it.",
        ],
      },
    ],
    faqs: [
      {
        question: "Does a higher bitrate help on YouTube?",
        answer:
          "Yes — YouTube's re-encode preserves more when the source bitrate is higher. VideoNest over-provisions for YouTube on purpose.",
      },
    ],
  },
  {
    slug: "youtube-1080p-vs-4k-upload",
    profileId: "youtube-long",
    title: "YouTube: should I upload 1080p or 4K?",
    metaTitle: "1080p vs 4K on YouTube — which looks better?",
    metaDescription:
      "Uploading 4K to YouTube can look noticeably sharper than 1080p even on 1080p screens. Here's why, and when to use each.",
    intro:
      "On YouTube, a 4K upload often looks sharper than 1080p even when watched at 1080p — because YouTube gives 4K a higher bitrate ceiling.",
    sections: [
      {
        heading: "Why 4K can win",
        body: [
          "YouTube assigns more bits to higher-resolution uploads, so a 4K source viewed at 1080p keeps more detail.",
          "If your footage is genuinely 4K, upload 4K. Don't upscale 1080p to fake it — that adds no real detail.",
        ],
      },
    ],
    faqs: [
      {
        question: "Is it worth uploading 4K to YouTube?",
        answer:
          "If your source is 4K, yes — YouTube gives it a higher bitrate, so it looks sharper even at 1080p. VideoNest keeps your resolution high for YouTube.",
      },
    ],
  },
  {
    slug: "make-video-vertical-for-youtube-shorts",
    profileId: "youtube-shorts",
    title: "Turn a landscape video into a YouTube Short",
    metaTitle: "Make a landscape video vertical for YouTube Shorts",
    metaDescription:
      "Shorts are 9:16 vertical. Here's how to turn a landscape clip into a Short by cropping or padding it.",
    intro:
      "YouTube Shorts are 9:16. A landscape clip needs to become vertical — by cropping to fill or padding with a blurred background.",
    sections: [
      {
        heading: "Two ways to go vertical",
        body: [
          "Fill: crop the sides so the subject fills a 9:16 frame. Fit: pad with a blurred background to keep the whole frame.",
          "VideoNest's editor previews both and keeps the bitrate high for YouTube.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I post a landscape video as a Short?",
        answer:
          "It needs to be 9:16 to show full-screen. Crop it to fill or pad it — VideoNest's Edit step does both.",
      },
    ],
  },
  {
    slug: "facebook-video-blurry-fix",
    profileId: "facebook-video",
    title: "Why is my Facebook video blurry?",
    metaTitle: "Facebook video blurry? How to fix upload quality",
    metaDescription:
      "Facebook re-compresses feed video and downscales large files. Here's why yours looks blurry and how to fix it.",
    intro:
      "Facebook re-encodes feed uploads and downscales big files. A clean 1080p source, posted from the app, keeps it sharp.",
    sections: [
      {
        heading: "Cause & fix",
        body: [
          "Web uploads and oversized files force a harder re-encode. Post from the Facebook app with a 1080p source.",
          "VideoNest's Facebook profiles prepare the right shape and bitrate on your device.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I improve Facebook video quality?",
        answer:
          "Upload a clean 1080p file from the Facebook app. VideoNest prepares it so Facebook's re-encode does the least damage.",
      },
    ],
  },
  {
    slug: "best-video-size-for-facebook-feed",
    profileId: "facebook-video",
    title: "Best video size for the Facebook feed",
    metaTitle: "Best video size & resolution for Facebook feed",
    metaDescription:
      "What resolution and aspect ratio work best for Facebook feed video? Here's what to upload for the sharpest result.",
    intro:
      "Facebook feed video works best at 16:9, 1080p, with a generous H.264 bitrate. Bigger gets downscaled.",
    sections: [
      {
        heading: "Recommended",
        body: [
          "Aspect 16:9, resolution 1080p, MP4/H.264. Square (1:1) also performs well in-feed.",
          "VideoNest's Facebook Video profile targets exactly this.",
        ],
      },
    ],
    faqs: [
      {
        question: "What resolution is best for Facebook feed video?",
        answer: "1080p at 16:9. Larger gets downscaled by Facebook anyway.",
      },
    ],
  },
  {
    slug: "why-social-media-compresses-video",
    profileId: "whatsapp-status",
    title: "Why does social media compress your videos?",
    metaTitle: "Why social media compresses video (and what to do)",
    metaDescription:
      "Every platform re-compresses uploaded video to save bandwidth and storage. Here's why — and how to minimise the damage.",
    intro:
      "WhatsApp, Instagram, YouTube and Facebook all re-encode your uploads to control bandwidth and storage. You can't stop it — but you can minimise the damage.",
    sections: [
      {
        heading: "It's about bandwidth",
        body: [
          "Platforms serve billions of plays, so they shrink every upload to a predictable size and codec.",
          "A file that already matches their target needs less re-compression — so it stays sharper.",
        ],
      },
      {
        heading: "What you can do",
        body: [
          "Hand the platform a correctly-shaped, sensibly-bitrated file. That's exactly what VideoNest prepares, on your device.",
        ],
      },
    ],
    faqs: [
      {
        question: "Can I stop social media from compressing my video?",
        answer:
          "No — and any tool that claims 'lossless' is misleading. You can only give the platform a clean source so its compression does less damage.",
      },
    ],
  },
  {
    slug: "reduce-video-file-size-for-social",
    profileId: "whatsapp-status",
    title: "Reduce a video's file size for social media",
    metaTitle: "Reduce video file size for social (without ruining it)",
    metaDescription:
      "Need a smaller video for WhatsApp, Instagram or email? Here's how to reduce file size while keeping it as sharp as possible.",
    intro:
      "To shrink a video sensibly, lower the resolution to what the platform actually shows and pick a bitrate that fits — not a blunt quality slider.",
    sections: [
      {
        heading: "Shrink the right way",
        body: [
          "Downscale to 1080p-or-below with a good resampler, and budget the bitrate to your size target.",
          "VideoNest does this automatically for each platform, on your device.",
        ],
      },
    ],
    faqs: [
      {
        question: "How do I make a video smaller for WhatsApp?",
        answer:
          "Downscale to 1080p and budget the bitrate under WhatsApp's ~16 MB cap. VideoNest handles it.",
      },
    ],
  },
  {
    slug: "convert-mov-to-mp4-for-social",
    profileId: "whatsapp-status",
    title: "Convert MOV to MP4 for social media",
    metaTitle: "Convert MOV to MP4 for WhatsApp, Instagram & more",
    metaDescription:
      "iPhone MOV files don't always upload cleanly. Here's how to convert MOV to MP4 (H.264) for social, on your device.",
    intro:
      "iPhone records MOV (often HEVC). Social platforms prefer MP4/H.264 — converting first avoids failed uploads and extra re-compression.",
    sections: [
      {
        heading: "MOV → MP4, on-device",
        body: [
          "VideoNest re-encodes to MP4/H.264 in your browser — no upload — and tone-maps HDR/10-bit iPhone footage to SDR so colours look right.",
        ],
      },
    ],
    faqs: [
      {
        question: "Why won't my iPhone MOV upload properly?",
        answer:
          "MOV/HEVC isn't always accepted and forces a harder re-encode. Convert to MP4/H.264 first — VideoNest does it on your device.",
      },
    ],
  },
  {
    slug: "instagram-reels-4k-vs-1080p",
    profileId: "instagram-reels",
    title: "Instagram Reels: 4K or 1080p?",
    metaTitle: "Should you upload 4K or 1080p Reels?",
    metaDescription:
      "Instagram caps Reels around 1080p and downscales 4K with a weak scaler. Here's why 1080p (done right) often looks better.",
    intro:
      "Unlike YouTube, Instagram caps Reels near 1080p and downscales 4K with its own fast scaler — which can look worse than a clean 1080p upload.",
    sections: [
      {
        heading: "Why 1080p wins here",
        body: [
          "Instagram's internal downscaler adds shimmer; doing the downscale yourself with a good resampler is cleaner.",
          "VideoNest downscales 4K to a crisp 1080×1920 with a high-quality resampler for Instagram.",
        ],
      },
    ],
    faqs: [
      {
        question: "Should I upload 4K Reels to Instagram?",
        answer:
          "Usually no — Instagram downscales it anyway. A clean 1080×1920 upload often looks better. VideoNest prepares that.",
      },
    ],
  },
  {
    slug: "whatsapp-status-quality-settings",
    profileId: "whatsapp-status",
    title: "Best WhatsApp Status quality settings",
    metaTitle: "Best WhatsApp Status quality settings for sharp video",
    metaDescription:
      "The resolution, aspect, bitrate and upload settings that keep a WhatsApp Status as sharp as possible after compression.",
    intro:
      "There's no in-app quality slider for Status beyond HD upload — the real control is the file you give WhatsApp. Here are the settings that matter.",
    sections: [
      {
        heading: "The settings that matter",
        body: [
          "9:16 vertical, 1080p or below, a bitrate that fits under ~16 MB, MP4/H.264, and HD upload enabled.",
          "VideoNest sets all of these for you, on your device.",
        ],
      },
    ],
    faqs: [
      {
        question: "What's the best quality setting for WhatsApp Status?",
        answer:
          "Enable HD upload and post a clean 9:16 1080p file under the size cap. VideoNest prepares the file; you flip on HD.",
      },
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return GUIDES.find((g) => g.slug === slug);
}
