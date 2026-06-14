import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/config/site";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  /** Set true on pages that should not be indexed. */
  noindex?: boolean;
  /** Tailored Open Graph card title — renders a per-page social image. */
  ogTitle?: string;
};

/** Absolute URL of the dynamic OG image for a tailored title. */
function ogImageUrl(title: string, subtitle?: string): string {
  const params = new URLSearchParams({ title });
  if (subtitle) params.set("subtitle", subtitle);
  return absoluteUrl(`/api/og?${params.toString()}`);
}

/**
 * Build per-page Metadata with canonical, OpenGraph and Twitter cards. The
 * dynamic opengraph-image route is picked up automatically by Next per route,
 * so we don't hard-code an image URL here.
 */
export function buildMetadata({
  title,
  description,
  path = "/",
  noindex = false,
  ogTitle,
}: BuildMetadataInput = {}): Metadata {
  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const desc = description ?? siteConfig.description;
  const url = absoluteUrl(path);
  // hreflang alternates — English is unprefixed (default), Hindi under /hi (D3).
  const hiPath = path === "/" ? "/hi" : `/hi${path}`;
  const languages = {
    en: url,
    hi: absoluteUrl(hiPath),
    "x-default": url,
  };
  // Tailored social card when a page supplies an ogTitle; else Next falls back
  // to the static app/opengraph-image route.
  const images = ogTitle
    ? [{ url: ogImageUrl(ogTitle, description), width: 1200, height: 630 }]
    : undefined;

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url, languages },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description: desc,
      url,
      locale: siteConfig.locale,
      ...(images ? { images } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      creator: siteConfig.twitterHandle,
      ...(images ? { images: images.map((i) => i.url) } : {}),
    },
  };
}
