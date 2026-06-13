import { defineRouting } from "next-intl/routing";

/**
 * Locale routing for VideoNest. English is the default and unprefixed (`/`),
 * Hindi is served under `/hi`. Adding a language = add it here + a message
 * catalog (+ translated blog posts) — no route refactor (D3).
 */
export const routing = defineRouting({
  locales: ["en", "hi"],
  defaultLocale: "en",
  localePrefix: "as-needed",
});

export type Locale = (typeof routing.locales)[number];

/** Human-readable language names for the switcher. */
export const localeNames: Record<Locale, string> = {
  en: "English",
  hi: "हिन्दी",
};
