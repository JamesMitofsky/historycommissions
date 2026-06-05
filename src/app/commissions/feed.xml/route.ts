import { getCommissions } from "@/commissions/get-commissions";
import { buildRss } from "@/lib/rss";
import { siteUrl } from "@/lib/site-url";

export const dynamic = "force-static";

function englishName(c: { name: { englishName: string; translations: { language: string; name: string }[] } }) {
  const en = c.name.translations.find((t) => t.language === "en");
  return en?.name ?? c.name.englishName;
}

export async function GET() {
  const base = siteUrl();
  const commissions = getCommissions();

  const items = commissions.map((c) => {
    const link = `${base}/commissions/${c.slug}`;
    const countries = c.memberCountries.join(", ");
    const founded = c.startDate ? `Founded ${c.startDate.slice(0, 4)}.` : "";
    const status = c.lastActiveStatus
      ? `Status: ${c.lastActiveStatus}.`
      : "";
    const description = [countries, founded, status].filter(Boolean).join(" ");
    return {
      title: englishName(c),
      link,
      guid: link,
      pubDate: c.startDate ?? null,
      description,
      categories: c.memberCountries,
    };
  });

  const xml = buildRss({
    title: "History Commissions — Bilateral Commissions",
    link: `${base}/commissions`,
    description:
      "Bilateral joint historians' commissions catalogued by History Commissions.",
    selfUrl: `${base}/commissions/feed.xml`,
    items,
  });

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
