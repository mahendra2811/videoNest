import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { routing } from "@/i18n/routing";

/** Frontmatter + body for a blog post. */
export type BlogPostMeta = {
  slug: string;
  title: string;
  description: string;
  /** ISO date (absolute). */
  date: string;
  author: string;
  readingMinutes: number;
  excerpt: string;
};

export type LoadedBlogPost = BlogPostMeta & { content: string };

const BLOG_DIR = path.join(process.cwd(), "content", "blog");

function dirFor(locale: string): string {
  return path.join(BLOG_DIR, locale);
}

function readMeta(locale: string, slug: string): LoadedBlogPost | null {
  const file = path.join(dirFor(locale), `${slug}.mdx`);
  let raw: string;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  return {
    slug,
    title: String(data.title ?? slug),
    description: String(data.description ?? ""),
    date: String(data.date ?? ""),
    author: String(data.author ?? "VideoNest"),
    readingMinutes: Number(data.readingMinutes ?? 4),
    excerpt: String(data.excerpt ?? data.description ?? ""),
    content,
  };
}

/** All English slugs — the canonical set of posts (every post exists in English). */
export function getAllSlugs(): string[] {
  try {
    return readdirSync(dirFor(routing.defaultLocale))
      .filter((f) => f.endsWith(".mdx"))
      .map((f) => f.replace(/\.mdx$/, ""));
  } catch {
    return [];
  }
}

/** Load one post for a locale, falling back to English when not translated. */
export function getPost(locale: string, slug: string): LoadedBlogPost | null {
  return readMeta(locale, slug) ?? readMeta(routing.defaultLocale, slug);
}

/** All posts for a locale (English fallback), newest first. */
export function getAllPosts(locale: string): LoadedBlogPost[] {
  return getAllSlugs()
    .map((slug) => getPost(locale, slug))
    .filter((p): p is LoadedBlogPost => Boolean(p))
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}
