import type { BlogPostMeta } from "@/lib/blog/mdx";
import { absoluteUrl, siteConfig } from "@/lib/config/site";
import type { FaqItem } from "@/lib/content/faq";

export function blogPostingJsonLd(post: BlogPostMeta) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: { "@type": "ImageObject", url: absoluteUrl("/icon-512.png") },
    },
    mainEntityOfPage: absoluteUrl(`/blog/${post.slug}`),
  };
}

export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: siteConfig.name,
    url: siteConfig.url,
    logo: absoluteUrl("/icon-512.png"),
    email: siteConfig.contactEmail,
  };
}

export function webApplicationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: siteConfig.name,
    url: absoluteUrl("/whatsapp-status-video"),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (web browser)",
    description: siteConfig.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    browserRequirements: "Requires a modern browser with WebCodecs support.",
  };
}

export function softwareApplicationJsonLd(opts: {
  name: string;
  slug: string;
  description: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    url: absoluteUrl(`/${opts.slug}`),
    applicationCategory: "MultimediaApplication",
    operatingSystem: "Any (web browser)",
    description: opts.description,
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    browserRequirements: "Requires a modern browser with WebCodecs support.",
  };
}

export function howToJsonLd(opts: { platformLabel: string; slug: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: `How to keep your ${opts.platformLabel} video sharp`,
    description: `Prepare a video on your device so ${opts.platformLabel} stays as sharp as possible after it re-compresses your upload.`,
    totalTime: "PT1M",
    tool: [{ "@type": "HowToTool", name: "VideoNest" }],
    step: [
      {
        "@type": "HowToStep",
        name: "Open the optimizer",
        text: `Open the ${opts.platformLabel} optimizer on VideoNest.`,
        url: absoluteUrl(`/${opts.slug}`),
      },
      {
        "@type": "HowToStep",
        name: "Add your video",
        text: "Drop in your video — it's read and processed entirely on your device, nothing is uploaded.",
      },
      {
        "@type": "HowToStep",
        name: "Optimize",
        text: `Tap "Make it sharp". VideoNest fixes the shape, resolution and bitrate for ${opts.platformLabel}.`,
      },
      {
        "@type": "HowToStep",
        name: "Share",
        text: `Share or download the result and post it to ${opts.platformLabel}.`,
      },
    ],
  };
}

export function breadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function faqJsonLd(items: FaqItem[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}
