import { z } from "astro/zod";

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  updated: z.union([z.string(), z.date()]).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).default([]),
  image: z.string().optional(),
  imageAttribution: z.string().optional(),
  imageAttributionUrl: z.string().optional(),
});

export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;

/**
 * What pages, the feed, and the search island consume: frontmatter flattened
 * onto the collection entry id, dates normalised to ISO strings, and the raw
 * Markdown body attached for fuzzy search and feed descriptions.
 *
 * `image` stays a path string here (e.g. "/images/foo.webp"). Resolving it to an
 * optimized asset is the page layer's job — see src/lib/images.ts — because
 * astro:assets is server-only and islands can only receive plain data.
 */
export interface Post {
  slug: string;
  content: string;
  title: string | null;
  date: string | null;
  updated: string | null;
  author: string | null;
  tags: string[];
  image: string | null;
  imageAttribution: string | null;
  imageAttributionUrl: string | null;
}
