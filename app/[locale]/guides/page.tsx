import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { GUIDES } from "@/lib/content/guides";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildMetadata({
  title: "Guides",
  description:
    "Practical, honest guides for keeping your videos sharp on WhatsApp, Instagram, YouTube and Facebook.",
  path: "/guides",
});

export default async function GuidesIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Guides</h1>
        <p className="text-muted">Quick answers, each with the right optimizer built in.</p>
      </header>

      <div className="flex flex-col gap-4">
        {GUIDES.map((guide) => (
          <Link
            key={guide.slug}
            href={`/guides/${guide.slug}`}
            className="group flex flex-col gap-1.5 rounded-3xl border border-border bg-surface p-6 shadow-warm transition-all hover:shadow-warm-lg"
          >
            <h2 className="text-xl font-bold tracking-tight group-hover:text-sunset">
              {guide.title}
            </h2>
            <p className="text-sm text-muted">{guide.intro}</p>
            <span className="mt-1 text-sm font-semibold text-sunset">Read more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
