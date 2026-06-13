import type { Metadata } from "next";
import { GetApp } from "@/components/marketing/GetApp";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Get the app",
  description:
    "Install VideoNest on Android, iPhone, iPad, Mac, Windows and Linux. Works offline, launches full-screen, and keeps your videos on your device.",
  path: "/download",
});

export default function DownloadPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-10 px-4 py-12 sm:px-6 sm:py-16">
      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Get <span className="text-sunset">VideoNest</span> on your device
        </h1>
        <p className="max-w-md text-sm text-muted sm:text-base">
          VideoNest is an installable app — no app store needed. Add it to your home screen or
          desktop and it runs like any other app, fully on your device.
        </p>
      </header>

      <GetApp />

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-bold tracking-tight">Why install?</h2>
        <ul className="flex list-disc flex-col gap-2 pl-5 text-sm text-muted">
          <li>One tap from your home screen — no browser tabs to dig through.</li>
          <li>Runs full-screen with the app splash, like a native app.</li>
          <li>Works offline; the on-device video engine doesn't need a connection.</li>
          <li>100% private — your videos are processed locally and never uploaded.</li>
          <li>Get a notification when your optimized video is ready.</li>
        </ul>
      </section>

      <div className="flex justify-center">
        <Button asChild size="lg" variant="secondary">
          <Link href="/whatsapp-status-video">Or optimize a video now</Link>
        </Button>
      </div>
    </div>
  );
}
