import type { MetadataRoute } from "next";
import { siteConfig } from "@/lib/config/site";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: `${siteConfig.name} — Keep your videos sharp on social`,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/",
    scope: "/",
    lang: "en",
    dir: "ltr",
    display: "standalone",
    // display_override lets installed windows use the newer window-controls
    // overlay where supported, falling back to standalone.
    display_override: ["standalone", "minimal-ui"],
    background_color: "#FFF9F5",
    theme_color: "#FF5E78",
    orientation: "portrait",
    categories: ["utilities", "photo", "video"],
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/icon-maskable-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      {
        src: "/icon-maskable-1024.png",
        sizes: "1024x1024",
        type: "image/png",
        purpose: "maskable",
      },
    ],
    screenshots: [
      {
        src: "/screenshot-narrow.png",
        sizes: "1080x1920",
        type: "image/png",
        form_factor: "narrow",
      },
      {
        src: "/screenshot-wide.png",
        sizes: "1920x1080",
        type: "image/png",
        form_factor: "wide",
      },
    ],
    shortcuts: [
      {
        name: "Optimize for WhatsApp Status",
        short_name: "WhatsApp",
        url: "/whatsapp-status-video",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Optimize for Instagram Reels",
        short_name: "Reels",
        url: "/instagram-reels-video",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
      {
        name: "Get the app",
        short_name: "Install",
        url: "/download",
        icons: [{ src: "/icon-192.png", sizes: "192x192" }],
      },
    ],
  };
}
