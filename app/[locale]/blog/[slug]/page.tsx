import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { FAQ } from "@/components/marketing/FAQ";
import { Prose } from "@/components/marketing/Prose";
import { JsonLd } from "@/components/seo/JsonLd";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { BLOG_POSTS, getPost } from "@/lib/content/blog";
import { blogPostingJsonLd, faqJsonLd } from "@/lib/seo/jsonld";
import { buildMetadata } from "@/lib/seo/metadata";

type Params = { slug: string };

export function generateStaticParams(): Params[] {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<Params> }): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return buildMetadata({ title: "Not found", noindex: true });
  return buildMetadata({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
  });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export default async function BlogPostPage({ params }: { params: Promise<Params> }) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { Body } = post;

  return (
    <article className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-4 py-14 sm:px-6">
      <JsonLd data={blogPostingJsonLd(post)} />
      {post.faqs && post.faqs.length > 0 && <JsonLd data={faqJsonLd(post.faqs)} />}

      <header className="flex flex-col gap-3">
        <Link href="/blog" className="text-sm font-medium text-muted hover:text-foreground">
          ← All posts
        </Link>
        <h1 className="text-3xl font-bold leading-tight tracking-tight sm:text-4xl">
          {post.title}
        </h1>
        <div className="flex items-center gap-2 text-sm text-muted">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <span aria-hidden>·</span>
          <span>{post.readingMinutes} min read</span>
        </div>
      </header>

      <Prose>
        <Body />
      </Prose>

      {post.faqs && post.faqs.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold tracking-tight">Frequently asked</h2>
          <FAQ items={post.faqs} />
        </section>
      )}

      <div className="flex flex-col items-center gap-3 rounded-3xl border border-border bg-surface p-6 text-center">
        <p className="font-semibold">Ready to try it?</p>
        <p className="text-sm text-muted">Optimize a video on your device — free, no upload.</p>
        <Button asChild size="lg">
          <Link href="/whatsapp-status-video">Optimize a video</Link>
        </Button>
      </div>
    </article>
  );
}
