import type { Metadata } from "next";
import { AdSlot } from "@/components/ads/AdSlot";
import { FAQ } from "@/components/marketing/FAQ";
import { Steps } from "@/components/marketing/Steps";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolScreen } from "@/components/tool/ToolScreen";
import { Card } from "@/components/ui/card";
import { requireProfile } from "@/lib/config/profiles";
import { getPlatformContent } from "@/lib/content/platforms";
import { faqJsonLd, webApplicationJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

/** Per-route metadata for a platform's tool page. */
export function buildToolMetadata(profileId: string): Metadata {
  const profile = requireProfile(profileId);
  const content = getPlatformContent(profileId);
  return buildMetadata({
    title: content.metaTitle,
    description: content.metaDescription,
    path: `/${profile.slug}`,
  });
}

/** Shared tool page rendered by every platform route. */
export function ToolPage({ profileId }: { profileId: string }) {
  const profile = requireProfile(profileId);
  const content = getPlatformContent(profileId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-12 px-4 py-12 sm:px-6">
      <JsonLd data={webApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(content.faqs)} />

      <header className="flex flex-col items-center gap-3 text-center">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Optimize for <span className="text-sunset">{content.highlight}</span>
        </h1>
        <p className="max-w-md text-muted">{content.sub}</p>
      </header>

      <Card className="p-5 sm:p-7">
        <ToolScreen profileId={profile.id} />
      </Card>

      <p className="text-center text-sm text-muted">{content.promise}</p>

      <AdSlot />

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-tight">How it works</h2>
        <Steps />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-xl font-bold tracking-tight">Questions</h2>
        <FAQ items={content.faqs} />
      </section>
    </div>
  );
}
