import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HeroVisual } from "./HeroVisual";
import { TrustNote } from "./TrustNote";

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-5 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-sunset" />
        Free · Private · On-device
      </span>

      <HeroVisual />

      <h1 className="max-w-2xl text-balance text-2xl font-bold leading-tight tracking-tight sm:text-3xl md:text-4xl">
        Social media blurs your videos.{" "}
        <span className="text-sunset">VideoNest keeps them sharp.</span>
      </h1>
      <p className="max-w-lg text-balance text-sm text-muted sm:text-base">
        WhatsApp, Instagram, YouTube and Facebook all re-compress what you upload. Optimize your
        video here first — right on your device — so it stays crisp after they squeeze it.
      </p>

      <div className="flex w-full flex-col gap-2.5 sm:w-auto sm:flex-row">
        <Button asChild size="md">
          <Link href="/whatsapp-status-video">Optimize your video</Link>
        </Button>
        <Button asChild size="md" variant="secondary">
          <Link href="/how-it-works">How it works</Link>
        </Button>
      </div>

      <TrustNote />
    </section>
  );
}
