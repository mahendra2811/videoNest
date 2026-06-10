import { AdSlot } from "@/components/ads/AdSlot";
import { FAQ } from "@/components/marketing/FAQ";
import { Hero } from "@/components/marketing/Hero";
import { Steps } from "@/components/marketing/Steps";
import { PlatformGrid } from "@/components/platforms/PlatformGrid";
import { JsonLd } from "@/components/seo/JsonLd";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { faqJsonLd, organizationJsonLd, webApplicationJsonLd } from "@/lib/seo/jsonld";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />

      <Hero />

      <section className="flex flex-col gap-5">
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Choose your platform</h2>
          <p className="mt-1.5 text-sm text-muted">
            Pick where you're posting — each format is tuned to its own specs.
          </p>
        </div>
        <PlatformGrid />
      </section>

      <section className="flex flex-col gap-5">
        <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">How it works</h2>
        <Steps />
      </section>

      <AdSlot />

      <section className="flex flex-col gap-5">
        <h2 className="text-center text-xl font-bold tracking-tight sm:text-2xl">
          Frequently asked
        </h2>
        <div className="mx-auto w-full max-w-2xl">
          <FAQ items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}
