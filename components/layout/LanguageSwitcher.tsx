"use client";

import { Languages } from "lucide-react";
import { useLocale } from "next-intl";
import * as React from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type Locale, localeNames, routing } from "@/i18n/routing";

/** Compact language switcher. Persists the choice via the locale-prefixed URL. */
export function LanguageSwitcher() {
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Change language"
        aria-expanded={open}
        className="flex items-center gap-1.5 rounded-2xl px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
      >
        <Languages className="h-4 w-4" />
        <span className="hidden sm:inline">{localeNames[locale]}</span>
      </button>
      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            className="fixed inset-0 z-40 cursor-default"
            onClick={() => setOpen(false)}
          />
          <ul className="absolute end-0 z-50 mt-1 min-w-[8rem] overflow-hidden rounded-2xl border border-border bg-surface py-1 shadow-warm">
            {routing.locales.map((l) => (
              <li key={l}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    router.replace(pathname, { locale: l });
                  }}
                  className={`block w-full px-4 py-2 text-start text-sm transition-colors hover:bg-surface-2 ${
                    l === locale ? "font-semibold text-brand-via" : "text-foreground"
                  }`}
                >
                  {localeNames[l]}
                </button>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
