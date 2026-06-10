import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { FAQ } from "@/components/marketing/FAQ";
import { Steps } from "@/components/marketing/Steps";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolScreen } from "@/components/tool/ToolScreen";
import { Card } from "@/components/ui/card";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { faqJsonLd, webApplicationJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

export const metadata: Metadata = buildMetadata({
  title: "WhatsApp Status video optimizer",
  description:
    "Optimize any video for WhatsApp Status so it stays sharp after WhatsApp compresses it. Free, private, and 100% on your device — no upload.",
  path: "/whatsapp-status-video",
});

export default function WhatsAppStatusPage() {
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-4 py-12 sm:px-6">
      <JsonLd data={webApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />

      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Optimize for <span className="text-sunset">WhatsApp Status</span>
        </h1>
        <p className="max-w-md text-muted">
          Drop in a video and we'll prepare it on your device so it stays as sharp as possible after
          WhatsApp's compression.
        </p>
      </header>

      <Card className="p-5 sm:p-7">
        <ToolScreen />
      </Card>

      <p className="text-center text-sm text-muted">
        WhatsApp re-compresses every Status video. We can't stop that — we prepare yours so it stays
        as sharp as possible.
      </p>

      <AdSlot />

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-tight">How it works</h2>
        <Steps />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-tight">Questions</h2>
        <FAQ items={FAQ_ITEMS} />
      </section>
    </div>
  );
}
