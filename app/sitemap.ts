import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/config/site";

const routes = [
  { path: "/", priority: 1, changeFrequency: "weekly" as const },
  { path: "/whatsapp-status-video", priority: 0.9, changeFrequency: "weekly" as const },
  { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const },
  { path: "/about", priority: 0.5, changeFrequency: "monthly" as const },
  { path: "/privacy-policy", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/terms", priority: 0.3, changeFrequency: "yearly" as const },
  { path: "/contact", priority: 0.4, changeFrequency: "yearly" as const },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: absoluteUrl(route.path),
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
