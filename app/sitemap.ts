import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { getAllSlugs } from "@/lib/blog/mdx";
import { getLiveProfiles } from "@/lib/config/profiles";
import { absoluteUrl } from "@/lib/config/site";

/** Absolute URL for a path in a given locale (English is unprefixed). */
function localeUrl(path: string, locale: string): string {
  if (locale === routing.defaultLocale) return absoluteUrl(path);
  return absoluteUrl(path === "/" ? `/${locale}` : `/${locale}${path}`);
}

/** hreflang alternates map for a path, across all locales. */
function languageAlternates(path: string): Record<string, string> {
  const languages: Record<string, string> = {};
  for (const locale of routing.locales) languages[locale] = localeUrl(path, locale);
  return languages;
}

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" as const },
  { path: "/download", priority: 0.6, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Every live platform's tool page, derived from the profile registry.
  const platformRoutes = getLiveProfiles().map((p) => ({
    path: `/${p.slug}`,
    priority: 0.9,
    changeFrequency: "weekly" as const,
  }));

  const blogRoutes = getAllSlugs().map((slug) => ({
    path: `/blog/${slug}`,
    priority: 0.5,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...platformRoutes, ...blogRoutes].map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
    alternates: { languages: languageAlternates(route.path) },
  }));
}
