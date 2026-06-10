import Link from "next/link";
import { Button } from "@/components/ui/button";
import { TrustNote } from "./TrustNote";

export function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 text-center">
      <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted">
        <span className="h-1.5 w-1.5 rounded-full bg-sunset" />
        Free · Private · On-device
      </span>
      <h1 className="max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl md:text-6xl">
        Post videos to WhatsApp Status — and keep them <span className="text-sunset">sharp</span>.
      </h1>
      <p className="max-w-xl text-balance text-base text-muted sm:text-lg">
        WhatsApp squeezes every Status video. VideoNest prepares yours so it stays crisp after the
        squeeze. Free, private, and it never leaves your phone.
      </p>
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/whatsapp-status-video">Optimize a video</Link>
        </Button>
        <Button asChild size="lg" variant="secondary">
          <Link href="/how-it-works">How it works</Link>
        </Button>
      </div>
      <TrustNote />
    </section>
  );
}
