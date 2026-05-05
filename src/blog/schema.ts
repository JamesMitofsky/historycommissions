import { z } from "zod";

export const PostFrontmatterSchema = z.object({
  title: z.string().min(1).optional(),
  date: z.union([z.string(), z.date()]).optional(),
  updated: z.union([z.string(), z.date()]).optional(),
  author: z.string().optional(),
  tags: z.array(z.string()).optional(),
  image: z.string().optional(),
  imageAttribution: z.string().optional(),
  imageAttributionUrl: z.string().optional(),
});

export const PostSchema = z.object({
  slug: z.string().min(1),
  content: z.string(),
  title: z.string().nullable(),
  date: z.union([z.string(), z.date()]).nullable(),
  updated: z.union([z.string(), z.date()]).nullable(),
  author: z.string().nullable(),
  tags: z.array(z.string()),
  image: z.string().nullable(),
  imageAttribution: z.string().nullable(),
  imageAttributionUrl: z.string().nullable(),
  blurDataURL: z.string().nullable(),
});

export type Post = z.infer<typeof PostSchema>;
export type PostFrontmatter = z.infer<typeof PostFrontmatterSchema>;
