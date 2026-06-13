import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";
import { getAllPosts } from "@/lib/blog/mdx";
import { buildMetadata } from "@/lib/seo/metadata";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = buildMetadata({
  title: "Blog",
  description:
    "Guides on keeping your videos sharp after WhatsApp, Instagram, YouTube and Facebook compress them.",
  path: "/blog",
});

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogIndexPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const posts = getAllPosts(locale);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The VideoNest blog</h1>
        <p className="text-muted">
          Honest, practical guides on surviving social platform compression.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/blog/${post.slug}`}
            className="group flex flex-col gap-2 rounded-3xl border border-border bg-surface p-6 shadow-warm transition-all hover:shadow-warm-lg"
          >
            <div className="flex items-center gap-2 text-xs text-muted">
              <time dateTime={post.date}>{formatDate(post.date)}</time>
              <span aria-hidden>·</span>
              <span>{post.readingMinutes} min read</span>
            </div>
            <h2 className="text-xl font-bold tracking-tight group-hover:text-sunset">
              {post.title}
            </h2>
            <p className="text-sm text-muted">{post.excerpt}</p>
            <span className="mt-1 text-sm font-semibold text-sunset">Read more →</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
