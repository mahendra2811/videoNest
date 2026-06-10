import { absoluteUrl, siteConfig } from "@/lib/config/site";
import type { FaqItem } from "@/lib/content/faq";

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
