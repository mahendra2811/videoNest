import { getTranslations } from "next-intl/server";
import { Wordmark } from "@/components/brand/Wordmark";
import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "./ThemeToggle";

export async function Header() {
  const t = await getTranslations("Nav");
  const navLinks = [
    { href: "/guides", label: t("guides") },
    { href: "/blog", label: t("blog") },
    { href: "/download", label: t("getApp") },
    { href: "/about", label: t("about") },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-4 sm:px-6">
        <Link href="/" aria-label="VideoNest home" className="rounded-2xl">
          <Wordmark />
        </Link>

        <nav className="flex items-center gap-1 sm:gap-2">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="hidden rounded-2xl px-3 py-2 text-sm font-medium text-muted transition-colors hover:text-foreground sm:inline-block"
            >
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher />
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
