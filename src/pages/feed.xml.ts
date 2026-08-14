import type { APIRoute } from "astro";
import { getPosts } from "@/blog";
import { buildRss } from "@/lib/rss";
import { excerpt } from "@/lib/excerpt";
import { getGeneralSettings } from "@/settings";

export const GET: APIRoute = async ({ site }) => {
  const base = site!.href.replace(/\/$/, "");
  const { feeds } = getGeneralSettings();
  const posts = await getPosts();

  const items = posts.map((post) => {
    const link = `${base}/posts/${post.slug}`;
    return {
      title: post.title ?? post.slug,
      link,
      guid: link,
      pubDate: post.date,
      description: excerpt(post.content, 400),
      categories: post.tags,
    };
  });

  const xml = buildRss({
    title: feeds.postsTitle,
    link: base,
    description: feeds.postsDescription,
    selfUrl: `${base}/feed.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
