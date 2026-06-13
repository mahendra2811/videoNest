import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { FavouritesScreen } from "@/components/platforms/FavouritesScreen";
import { routing } from "@/i18n/routing";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildMetadata({
  title: "Favourites",
  description: "Your favourited and recently-used VideoNest optimizers.",
  path: "/favourites",
  noindex: true,
});

export default async function FavouritesPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 px-4 py-10 sm:px-6">
      <header className="text-center">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Favourites</h1>
        <p className="mt-1.5 text-sm text-muted">Your favourited and recently-used tools.</p>
      </header>
      <FavouritesScreen />
    </div>
  );
}
