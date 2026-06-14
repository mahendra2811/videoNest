import { AdSlot } from "@/components/ads/AdSlot";
import { FAQ } from "@/components/marketing/FAQ";
import { GetApp } from "@/components/marketing/GetApp";
import { Hero } from "@/components/marketing/Hero";
import { Steps } from "@/components/marketing/Steps";
import { PlatformGrid } from "@/components/platforms/PlatformGrid";
import { QuickAccess } from "@/components/platforms/QuickAccess";
import { JsonLd } from "@/components/seo/JsonLd";
import { Link } from "@/i18n/navigation";
import { FAQ_ITEMS } from "@/lib/content/faq";
import { GUIDES } from "@/lib/content/guides";
import {
  faqJsonLd,
  organizationJsonLd,
  webApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo/jsonld";

export default function HomePage() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-16 px-4 py-12 sm:px-6 sm:py-16">
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd data={webApplicationJsonLd()} />
      <JsonLd data={faqJsonLd(FAQ_ITEMS)} />

      <Hero />

      <QuickAccess />

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

      <section className="flex flex-col gap-5">
        <div className="text-center">
          <h2 className="text-xl font-bold tracking-tight sm:text-2xl">Popular guides</h2>
          <p className="mt-1.5 text-sm text-muted">
            Honest answers — each with the right optimizer built in.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {GUIDES.slice(0, 4).map((g) => (
            <Link
              key={g.slug}
              href={`/guides/${g.slug}`}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-warm transition-all hover:shadow-warm-lg"
            >
              <h3 className="font-semibold tracking-tight group-hover:text-sunset">{g.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-muted">{g.intro}</p>
            </Link>
          ))}
        </div>
        <Link href="/guides" className="text-center text-sm font-semibold text-sunset">
          All guides →
        </Link>
      </section>

      <GetApp />

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
