import Link from "next/link";
import { Wordmark } from "@/components/brand/Wordmark";
import { siteConfig } from "@/lib/config/site";

const legalLinks = [
  { href: "/download", label: "Get app" },
  { href: "/blog", label: "Blog" },
  { href: "/privacy-policy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/contact", label: "Contact" },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-border bg-surface/40">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-10 sm:px-6 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-3">
          <Wordmark />
          <p className="max-w-xs text-sm text-muted">
            Free, private, on-device video optimization. Your videos never leave your phone.
          </p>
        </div>

        <div className="flex flex-col gap-4 md:items-end">
          <nav className="flex flex-wrap gap-4">
            {legalLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm text-muted transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <p className="text-xs text-muted">
            © {year} {siteConfig.name}. Made for sharper social videos.
          </p>
        </div>
      </div>
    </footer>
  );
}
