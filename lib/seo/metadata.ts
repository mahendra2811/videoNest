import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/config/site";

type BuildMetadataInput = {
  title?: string;
  description?: string;
  path?: string;
  /** Set true on pages that should not be indexed. */
  noindex?: boolean;
};

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
}: BuildMetadataInput = {}): Metadata {
  const fullTitle = title
    ? `${title} — ${siteConfig.name}`
    : `${siteConfig.name} — ${siteConfig.tagline}`;
  const desc = description ?? siteConfig.description;
  const url = absoluteUrl(path);

  return {
    title: fullTitle,
    description: desc,
    alternates: { canonical: url },
    robots: noindex ? { index: false, follow: false } : { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title: fullTitle,
      description: desc,
      url,
      locale: siteConfig.locale,
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      creator: siteConfig.twitterHandle,
    },
  };
}
