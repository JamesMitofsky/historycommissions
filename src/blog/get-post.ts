import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Post } from "./types";
import { getBlurDataURL } from "./get-blur-data-url";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export const getPost = async (slug: string): Promise<Post> => {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(raw);
  const image: string | null = data.image ?? null;
  return {
    slug,
    content,
    title: data.title ?? null,
    date: data.date ? new Date(data.date).toISOString() : null,
    updated: data.updated ? new Date(data.updated).toISOString() : null,
    author: data.author ?? null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    image,
    imageAttribution: data.imageAttribution ?? null,
    imageAttributionUrl: data.imageAttributionUrl ?? null,
    blurDataURL: await getBlurDataURL(image),
  };
};

export const getPostSlugs = (): string[] => {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
};
