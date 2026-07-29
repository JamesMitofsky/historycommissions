import { getCollection, getEntry, type CollectionEntry } from "astro:content";
import type { Post } from "./schema";

/** Frontmatter dates may be YAML dates or strings; normalise both to ISO. */
function toIso(value: string | Date | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

export function toPost(entry: CollectionEntry<"posts">): Post {
  const { data } = entry;
  return {
    slug: entry.id,
    content: entry.body ?? "",
    title: data.title ?? null,
    date: toIso(data.date),
    updated: toIso(data.updated),
    author: data.author ?? null,
    tags: data.tags,
    image: data.image ?? null,
    imageAttribution: data.imageAttribution ?? null,
    imageAttributionUrl: data.imageAttributionUrl ?? null,
  };
}

/**
 * Newest first. Post filenames are date-prefixed (YYYY-MM-DD-slug), so a plain
 * descending sort on the id is chronological — and it matches the previous
 * `readdirSync().sort().reverse()` ordering exactly, including for same-day
 * posts, since both compare raw code units rather than locale collation rules.
 */
function byIdDescending<T extends { id: string }>(a: T, b: T): number {
  return a.id < b.id ? 1 : a.id > b.id ? -1 : 0;
}

export async function getPostEntries(): Promise<CollectionEntry<"posts">[]> {
  const entries = await getCollection("posts");
  return entries.sort(byIdDescending);
}

export async function getPosts(): Promise<Post[]> {
  return (await getPostEntries()).map(toPost);
}

export async function getPostEntry(
  slug: string,
): Promise<CollectionEntry<"posts"> | undefined> {
  return getEntry("posts", slug);
}
