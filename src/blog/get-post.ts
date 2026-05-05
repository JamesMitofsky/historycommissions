import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { PostFrontmatterSchema, PostSchema, type Post } from "./types";
import { getBlurDataURL } from "./get-blur-data-url";

const POSTS_DIR = path.join(process.cwd(), "content/posts");

export const getPost = async (slug: string): Promise<Post> => {
  const filePath = path.join(POSTS_DIR, `${slug}.md`);
  const raw = fs.readFileSync(filePath, "utf8");
  const { content, data } = matter(raw);
  const frontmatter = PostFrontmatterSchema.parse(data);
  const image: string | null = frontmatter.image ?? null;
  return PostSchema.parse({
    slug,
    content,
    title: frontmatter.title ?? null,
    date: frontmatter.date ? new Date(frontmatter.date).toISOString() : null,
    updated: frontmatter.updated ? new Date(frontmatter.updated).toISOString() : null,
    author: frontmatter.author ?? null,
    tags: frontmatter.tags ?? [],
    image,
    imageAttribution: frontmatter.imageAttribution ?? null,
    imageAttributionUrl: frontmatter.imageAttributionUrl ?? null,
    blurDataURL: await getBlurDataURL(image),
  });
};

export const getPostSlugs = (): string[] => {
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => f.replace(/\.md$/, ""));
};
