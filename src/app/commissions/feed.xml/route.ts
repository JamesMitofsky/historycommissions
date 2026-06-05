import { getCommissions } from "@/commissions/get-commissions";
import { STATUS_LABELS } from "@/commissions/status";
import { buildRss } from "@/lib/rss";
import { siteUrl } from "@/lib/site-url";
import { getGeneralSettings } from "@/settings";

export const dynamic = "force-static";

function englishName(c: { name: { englishName: string; translations: { language: string; name: string }[] } }) {
  const en = c.name.translations.find((t) => t.language === "en");
  return en?.name ?? c.name.englishName;
}

export async function GET() {
  const base = siteUrl();
  const { feeds } = getGeneralSettings();
  const commissions = getCommissions();

  const items = commissions.map((c) => {
    const link = `${base}/commissions/${c.slug}`;
    const countries = c.memberCountries.join(", ");
    const founded = c.startDate ? `Founded ${c.startDate.slice(0, 4)}.` : "";
    const status = c.lastActiveStatus
      ? `Status: ${STATUS_LABELS[c.lastActiveStatus]}.`
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
}
