import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { PlatformGrid } from "@/components/platforms/PlatformGrid";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildMetadata({
  title: "All tools",
  description:
    "Every VideoNest optimizer — WhatsApp Status, Instagram Reels & Story, YouTube & Shorts, Facebook Video & Story.",
  path: "/tools",
});

export default async function ToolsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">All optimizers</h1>
        <p className="mt-1.5 text-sm text-muted">Pick where you're posting — tuned per platform.</p>
      </header>
      <PlatformGrid />
    </div>
  );
}
