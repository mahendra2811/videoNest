import type { MetadataRoute } from "next";
import { getLiveProfiles } from "@/lib/config/profiles";
import { absoluteUrl } from "@/lib/config/site";
import { BLOG_POSTS } from "@/lib/content/blog";

const staticRoutes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/blog", priority: 0.6, changeFrequency: "weekly" as const },
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

  const blogRoutes = BLOG_POSTS.map((p) => ({
    path: `/blog/${p.slug}`,
    priority: 0.5,
    changeFrequency: "monthly" as const,
  }));

  return [...staticRoutes, ...platformRoutes, ...blogRoutes].map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
