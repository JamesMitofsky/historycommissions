import type { APIRoute } from "astro";
import { getCommissions } from "@/commissions/get-commissions";
import { STATUS_LABELS } from "@/commissions/status";
import { buildRss } from "@/lib/rss";
import { getGeneralSettings } from "@/settings";

function englishName(c: {
  name: { englishName: string; translations: { language: string; name: string }[] };
}) {
  const en = c.name.translations.find((t) => t.language === "en");
  return en?.name ?? c.name.englishName;
}

export const GET: APIRoute = async ({ site }) => {
  const base = site!.href.replace(/\/$/, "");
  const { feeds } = getGeneralSettings();
  const commissions = getCommissions();

  const items = commissions.map((c) => {
    const link = `${base}/commissions/${c.slug}`;
    const countries = c.memberCountries.join(", ");
    const founded = c.startDate ? `Founded ${c.startDate.slice(0, 4)}.` : "";
    const status = c.lastActiveStatus
      ? `Status: ${STATUS_LABELS[c.lastActiveStatus]}.`
      : "";
    return {
      title: englishName(c),
      link,
      guid: link,
      pubDate: c.startDate,
      description: [countries, founded, status].filter(Boolean).join(" "),
      categories: c.memberCountries,
    };
  });

  const xml = buildRss({
    title: feeds.commissionsTitle,
    link: `${base}/commissions`,
    description: feeds.commissionsDescription,
    selfUrl: `${base}/commissions/feed.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
};
