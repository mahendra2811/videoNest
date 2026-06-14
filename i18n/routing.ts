import { defineRouting } from "next-intl/routing";

/**
 * Locale routing for VideoNest. English is the default and unprefixed (`/`);
 * every other locale is served under its prefix (`/hi`, `/es`, …). Adding a
 * language = add it here + a `messages/<locale>.json` catalog (+ optional
 * translated blog posts under `content/blog/<locale>/`) — no route refactor.
 */
export const routing = defineRouting({
  locales: ["en", "hi", "es", "pt", "id", "fr", "bn"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Human-readable language names for the switcher (native script). */
export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
  es: "Español",
  pt: "Português",
  id: "Bahasa Indonesia",
  fr: "Français",
  bn: "বাংলা",
};

/** Text direction per locale. RTL locales (added later) set "rtl". */
export const localeDir: Record<Locale, "ltr" | "rtl"> = {
  en: "ltr",
  hi: "ltr",
  es: "ltr",
  pt: "ltr",
  id: "ltr",
  fr: "ltr",
  bn: "ltr",
};
