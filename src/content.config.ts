import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { PostFrontmatterSchema } from "@/blog/schema";

/**
 * Posts are the only collection: they are the one content type that needs
 * Astro's Markdown pipeline (`render()`).
 *
 * Commissions and settings stay on their own fs loaders in `src/commissions`
 * and `src/settings` because `scripts/validate-commissions.ts` runs them
 * outside Astro, under plain tsx, in CI.
 *
 * `base` points at the repo-root `content/` directory rather than `src/`, so the
 * paths Decap CMS writes to (see public/admin/config.yml) stay unchanged.
 */
const posts = defineCollection({
  loader: glob({ pattern: "**/[^_]*.md", base: "./content/posts" }),
  schema: PostFrontmatterSchema,
});

export const collections = { posts };
