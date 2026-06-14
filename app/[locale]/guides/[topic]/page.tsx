import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { Prose } from "@/components/marketing/Prose";
import { JsonLd } from "@/components/seo/JsonLd";
import { ToolScreen } from "@/components/tool/ToolScreen";
import { Card } from "@/components/ui/card";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { requireProfile } from "@/lib/config/profiles";
import { GUIDES, getGuide } from "@/lib/content/guides";
import { breadcrumbJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Params = { locale: string; topic: string };

export function generateStaticParams() {
  return routing.locales.flatMap((locale) => GUIDES.map((g) => ({ locale, topic: g.slug })));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { topic } = await params;
  const guide = getGuide(topic);
  if (!guide) return buildMetadata({ title: "Not found", noindex: true });
  return buildMetadata({
    title: guide.metaTitle,
    description: guide.metaDescription,
    path: `/guides/${guide.slug}`,
    ogTitle: guide.title,
  });
}

export default async function GuidePage({ params }: { params: Promise<Params> }) {
  const { locale, topic } = await params;
  setRequestLocale(locale);
  const guide = getGuide(topic);
  if (!guide) notFound();
  const profile = requireProfile(guide.profileId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-12 sm:px-6">
      <JsonLd data={faqJsonLd(guide.faqs)} />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Guides", path: "/guides" },
          { name: guide.title, path: `/guides/${guide.slug}` },
        ])}
      />

      <header className="flex flex-col gap-3">
        <Link href="/guides" className="text-sm font-medium text-muted hover:text-foreground">
          ← All guides
        </Link>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {guide.title}
        </h1>
        <p className="text-muted">{guide.intro}</p>
      </header>

      {/* The tool, right here — useful, not a doorway page. */}
      <Card className="p-4 sm:p-6">
        <p className="mb-4 text-center text-sm font-medium text-muted">
          Optimize for <span className="text-sunset">{profile.label}</span>
        </p>
        <ToolScreen profileId={profile.id} />
      </Card>

      <Prose>
        {guide.sections.map((section) => (
          <section key={section.heading}>
            <h2>{section.heading}</h2>
            {section.body.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </section>
        ))}
      </Prose>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold tracking-tight">Frequently asked</h2>
        <div className="flex flex-col gap-3">
          {guide.faqs.map((f) => (
            <div key={f.question} className="rounded-2xl border border-border p-4">
              <p className="font-medium">{f.question}</p>
              <p className="mt-1 text-sm text-muted">{f.answer}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
