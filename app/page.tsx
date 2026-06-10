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
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-20 px-4 py-14 sm:px-6 sm:py-20">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={webApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />

      <Hero />

      <section className="flex flex-col gap-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Choose a platform</h2>
          <p className="mt-2 text-muted">
            Pick where you're posting — each one is tuned to that platform's specs.
          </p>
        </div>
        <PlatformGrid />
      </section>

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">How it works</h2>
        <Steps />
      </section>

      <AdSlot />

      <section className="flex flex-col gap-6">
        <h2 className="text-center text-2xl font-bold tracking-tight sm:text-3xl">
          Frequently asked
        </h2>
        <div className="mx-auto w-full max-w-2xl">
          <FAQ items={FAQ_ITEMS} />
        </div>
      </section>
    </div>
  );
}
