"use client";

import { Heart, Home, LayoutGrid, type LucideIcon, Menu, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Link, usePathname } from "@/i18n/navigation";
import { getLiveProfiles } from "@/lib/config/profiles";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

const TOOL_SLUGS = new Set(getLiveProfiles().map((p) => `/${p.slug}`));

type Tab = { key: string; href: string; icon: LucideIcon; match: (path: string) => boolean };

export function BottomNav() {
  const t = useTranslations("Nav");
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = React.useState(false);

  // Close the sheet whenever the route changes.
  // biome-ignore lint/correctness/useExhaustiveDependencies: close on path change
  React.useEffect(() => {
    setMoreOpen(false);
  }, [pathname]);

  const tabs: Tab[] = [
    { key: "home", href: "/", icon: Home, match: (p) => p === "/" },
    {
      key: "favourites",
      href: "/favourites",
      icon: Heart,
      match: (p) => p.startsWith("/favourites"),
    },
    {
      key: "tools",
      href: "/tools",
      icon: LayoutGrid,
      match: (p) => p.startsWith("/tools") || TOOL_SLUGS.has(p),
    },
  ];

  const moreLinks = [
    { href: "/about", label: t("about") },
    { href: "/blog", label: t("blog") },
    { href: "/how-it-works", label: t("howItWorks") },
    { href: "/privacy-policy", label: t("privacy") },
    { href: "/terms", label: t("terms") },
    { href: "/contact", label: t("contact") },
  ];

  return (
    <>
      {/* Slide-up "More" sheet */}
      {moreOpen && (
        <div className="fixed inset-0 z-50 sm:hidden">
          <button
            type="button"
            aria-label="Close menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMoreOpen(false)}
          />
          <div
            className="absolute inset-x-0 bottom-0 flex flex-col gap-4 rounded-t-3xl border-border border-t bg-background p-5"
            style={{ paddingBottom: "calc(1.25rem + env(safe-area-inset-bottom))" }}
          >
            <div className="flex items-center justify-between">
              <span className="font-semibold">{t("more")}</span>
              <button type="button" onClick={() => setMoreOpen(false)} aria-label="Close">
                <X className="h-5 w-5 text-muted" />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-sm font-medium">{t("theme")}</span>
              <ThemeToggle />
            </div>
            <div className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
              <span className="text-sm font-medium">{t("language")}</span>
              <LanguageSwitcher />
            </div>

            {/* A7 — Coming soon: AI Enhance (inert) */}
            <div className="flex items-center justify-between rounded-2xl border border-dashed border-border px-4 py-3 opacity-70">
              <span className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-brand-via" />
                {t("aiEnhanceSoon")}
              </span>
              <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] text-muted">
                Soon
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {moreLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setMoreOpen(false)}
                  className="rounded-2xl border border-border px-4 py-3 text-sm font-medium"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom tab bar — mobile only */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 border-border border-t bg-background/90 backdrop-blur-md sm:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label="Primary"
      >
        <div className="mx-auto grid max-w-md grid-cols-4">
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            const Icon = tab.icon;
            return (
              <Link
                key={tab.key}
                href={tab.href}
                className="flex flex-col items-center gap-0.5 py-2.5"
                aria-current={active ? "page" : undefined}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-colors ${
                    active ? "bg-sunset text-white" : "text-muted"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span
                  className={`text-[10px] ${active ? "font-semibold text-foreground" : "text-muted"}`}
                >
                  {t(tab.key)}
                </span>
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className="flex flex-col items-center gap-0.5 py-2.5"
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
          >
            <span className="flex h-7 w-12 items-center justify-center rounded-full text-muted">
              <Menu className="h-5 w-5" />
            </span>
            <span className="text-[10px] text-muted">{t("more")}</span>
          </button>
        </div>
      </nav>
    </>
  );
}
