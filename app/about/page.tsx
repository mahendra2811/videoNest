import type { Metadata } from "next";
import Link from "next/link";
import { Prose } from "@/components/marketing/Prose";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config/site";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "About",
  description:
    "VideoNest is a free, privacy-first toolkit that helps your videos survive social platform compression — starting with WhatsApp Status.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          About <span className="text-sunset">{siteConfig.name}</span>
        </h1>
      </header>

      <Prose>
        <p>
          {siteConfig.name} is a free, privacy-first toolkit that helps your videos survive the
          compression social platforms apply when you post. We're starting with the one that bites
          people most: WhatsApp Status.
        </p>
        <p>
          The idea is simple. Every platform re-encodes what you upload, and a file that isn't
          prepared for that pass ends up blurry. So we prepare it — re-encoding your video into the
          cleanest possible format for the destination, entirely on your device, so it stays as
          sharp as it can after the platform does its thing.
        </p>
        <p>
          We built it for people who are tired of posting a crisp clip only to watch it turn to mush
          in Status. No accounts, no uploads, no cost — your video never leaves your phone, and it
          never will.
        </p>

        <h2>What's next</h2>
        <p>
          WhatsApp Status is live today. Instagram Reels and Stories, YouTube Shorts and Facebook
          are on the roadmap — each tuned to its own requirements. The architecture is built to add
          them one at a time, without compromising the privacy-first, on-device promise.
        </p>
      </Prose>

      <div className="flex justify-center">
        <Button asChild size="lg">
          <Link href="/whatsapp-status-video">Try it now</Link>
        </Button>
      </div>
    </article>
  );
}
