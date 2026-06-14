import { Link } from "@/i18n/navigation";
import { GUIDES } from "@/lib/content/guides";

/** Cross-links from a tool page to the guides for that platform (internal linking / SEO). */
export function RelatedGuides({ profileId }: { profileId: string }) {
  const related = GUIDES.filter((g) => g.profileId === profileId).slice(0, 4);
  // Fall back to a few general guides so every tool page links out.
  const guides = related.length > 0 ? related : GUIDES.slice(0, 3);
  if (guides.length === 0) return null;

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-center font-semibold text-muted text-sm">Related guides</h2>
      <div className="flex flex-col gap-2">
        {guides.map((g) => (
          <Link
            key={g.slug}
            href={`/guides/${g.slug}`}
            className="rounded-2xl border border-border bg-surface px-4 py-3 text-sm font-medium transition-colors hover:border-brand-via"
          >
            {g.title}
          </Link>
        ))}
      </div>
    </section>
  );
}
