import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/Wordmark";
import { Link } from "@/i18n/navigation";
import { getLiveProfiles } from "@/lib/config/profiles";
import { siteConfig } from "@/lib/config/site";
import { GUIDES } from "@/lib/content/guides";

export async function Footer() {
  const t = await getTranslations("Nav");
  const year = new Date().getFullYear();
  const tools = getLiveProfiles();
  const guides = GUIDES.slice(0, 5);

  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 py-12 sm:px-6">
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-3 sm:col-span-1">
            <Wordmark />
            <p className="max-w-xs text-sm text-muted">
              Free, private, on-device video optimization. Your videos never leave your phone.
            </p>
          </div>

          {/* Tools — every platform page, for crawl depth + link equity */}
          <nav className="flex flex-col gap-2" aria-label={t("tools")}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("tools")}</p>
            {tools.map((p) => (
              <Link
                key={p.id}
                href={`/${p.slug}`}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {p.label}
              </Link>
            ))}
          </nav>

          {/* Learn */}
          <nav className="flex flex-col gap-2" aria-label={t("guides")}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">
              {t("guides")}
            </p>
            {guides.map((g) => (
              <Link
                key={g.slug}
                href={`/guides/${g.slug}`}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {g.title}
              </Link>
            ))}
            <Link
              href="/blog"
              className="text-sm text-muted transition-colors hover:text-foreground"
            >
              {t("blog")}
            </Link>
          </nav>

          {/* Company */}
          <nav className="flex flex-col gap-2" aria-label={t("more")}>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{t("more")}</p>
            <Link href="/how-it-works" className="text-sm text-muted hover:text-foreground">
              {t("howItWorks")}
            </Link>
            <Link href="/download" className="text-sm text-muted hover:text-foreground">
              {t("getApp")}
            </Link>
            <Link href="/about" className="text-sm text-muted hover:text-foreground">
              {t("about")}
            </Link>
            <Link href="/privacy-policy" className="text-sm text-muted hover:text-foreground">
              {t("privacy")}
            </Link>
            <Link href="/terms" className="text-sm text-muted hover:text-foreground">
              {t("terms")}
            </Link>
            <Link href="/contact" className="text-sm text-muted hover:text-foreground">
              {t("contact")}
            </Link>
          </nav>
        </div>

        <p className="border-border border-t pt-6 text-xs text-muted">
          © {year} {siteConfig.name}. Made for sharper social videos.
        </p>
      </div>
    </footer>
  );
}
