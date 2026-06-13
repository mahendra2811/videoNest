import type { Metadata } from "next";
import { FAQ } from "@/components/marketing/FAQ";
import { Prose } from "@/components/marketing/Prose";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { faqJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "How it works",
  description:
    "Why WhatsApp Status videos look blurry, and how VideoNest prepares a clean H.264 file on your device so they stay as sharp as possible.",
  path: "/how-it-works",
});

export default function HowItWorksPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />

      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Why Status videos go blurry — and how we fix it
        </h1>
        <p className="text-muted">
          A quick, honest explanation of what WhatsApp does to your videos and what VideoNest does
          about it.
        </p>
      </header>

      <Prose>
        <h2>Why WhatsApp makes your videos blurry</h2>
        <p>
          When you post a video to WhatsApp Status, WhatsApp doesn't send your file as-is. It{" "}
          <strong>re-encodes</strong> every upload: it caps the file size (around 16 MB), downscales
          large videos toward roughly 720p, and applies its own compression so the clip is small
          enough to send quickly on any connection.
        </p>
        <p>
          If the file you hand WhatsApp isn't already prepared for that pass, the compression has to
          work harder — and the result looks soft, blocky or washed out. That's the blur you've
          probably seen.
        </p>

        <h2>What VideoNest does</h2>
        <p>
          VideoNest re-encodes your video into the cleanest possible file for WhatsApp Status before
          you upload it:
        </p>
        <ul>
          <li>
            <strong>Correct dimensions:</strong> a 9:16 vertical frame at up to 1080×1920, never
            upscaled. Horizontal or off-ratio videos are padded with a soft, blurred background
            instead of being stretched.
          </li>
          <li>
            <strong>The right codec:</strong> H.264 (High profile, yuv420p) in an MP4 with
            faststart, which is exactly what WhatsApp expects — so its pass does the least extra
            damage.
          </li>
          <li>
            <strong>A sensible size:</strong> a high-quality, constrained bitrate that keeps a short
            clip comfortably under WhatsApp's limit, so it isn't crushed on upload.
          </li>
          <li>
            <strong>Smooth playback:</strong> capped at 30fps with a 2-second keyframe interval for
            reliable seeking.
          </li>
        </ul>
        <p>
          We're honest about the limits: WhatsApp <strong>always</strong> re-compresses Status
          uploads, and we can't prevent that. What we can do is give it an optimal starting point so
          your video stays as sharp as possible afterwards.
        </p>

        <h2>Why on-device matters</h2>
        <p>
          Everything happens inside your browser, on your device, using modern web video APIs
          (WebCodecs, with an ffmpeg.wasm fallback). Your video is <strong>never uploaded</strong>{" "}
          to a server — which means it's private by default and there's nothing to wait on. No
          account, no queue, no data leaving your phone.
        </p>

        <h2>Tips for the sharpest result</h2>
        <ul>
          <li>
            Upload from the <strong>WhatsApp mobile app</strong>, not WhatsApp Web — the web version
            compresses harder.
          </li>
          <li>
            Turn on <strong>HD</strong> in WhatsApp's media-upload settings where available.
          </li>
          <li>
            Status caps clips at 30 seconds — longer videos are split into sequential 30s parts you
            can post in order.
          </li>
        </ul>
      </Prose>

      <div className="flex flex-col gap-6 rounded-3xl border border-border bg-surface p-6">
        <h2 className="text-xl font-bold tracking-tight">Common questions</h2>
        <FAQ items={FAQ_ITEMS} />
      </div>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/whatsapp-status-video">Optimize a video</Link>
        </Button>
      </div>
    </article>
  );
}
