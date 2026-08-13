import type { APIRoute, GetStaticPaths } from "astro";
import { getPostEntries, toPost } from "@/blog";
import { getGeneralSettings } from "@/settings";
import { renderOgImage } from "@/lib/og-image";

export const getStaticPaths = (async () => {
  const entries = await getPostEntries();
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { post: toPost(entry) },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { post } = props as { post: ReturnType<typeof toPost> };
  const general = getGeneralSettings();

  const png = await renderOgImage({
    kicker: general.kicker,
    title: post.title ?? general.siteTitle,
    subtitle: null,
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
