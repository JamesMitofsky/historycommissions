import fs from "fs";
import path from "path";
import matter from "gray-matter";
import type { Post } from "./types";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export const getPosts = (): Post[] => {
  const files = fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .sort()
    .reverse();

  return files.map((filename) => {
    const slug = filename.replace(/\.md$/, "");
    const raw = fs.readFileSync(path.join(POSTS_DIR, filename), "utf8");
    const { content, data } = matter(raw);
    return {
      slug,
      content,
      title: data.title ?? null,
      date: data.date ? new Date(data.date).toISOString() : null,
      updated: data.updated ? new Date(data.updated).toISOString() : null,
      author: data.author ?? null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      image: data.image ?? null,
    };
  });
};
