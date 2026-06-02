import { getPosts } from "@/blog";
import { buildRss } from "@/lib/rss";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

export async function GET() {
  const base = siteUrl();
  const posts = await getPosts();

  const items = posts.map((post) => {
    const link = `${base}/posts/${post.slug}`;
    const description = post.content
      .replace(/^#+\s.+$/gm, "")
      .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
      .replace(/[*_`~]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 400);
    const pubDate =
      post.date instanceof Date
        ? post.date.toISOString()
        : post.date ?? null;
    return {
      title: post.title ?? post.slug,
      link,
      guid: link,
      pubDate,
      description,
      categories: post.tags,
    };
  });

  const xml = buildRss({
    title: "History Commissions",
    link: base,
    description:
      "A digital archive of joint historians' commissions and dialogues over history.",
    selfUrl: `${base}/feed.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
