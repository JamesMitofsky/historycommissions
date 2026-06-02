export function xmlEscape(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export interface RssItem {
  title: string;
  link: string;
  guid: string;
  pubDate?: string | null;
  description?: string;
  categories?: string[];
}

export interface RssChannel {
  title: string;
  link: string;
  description: string;
  selfUrl: string;
  language?: string;
  items: RssItem[];
}

export function buildRss({
  title,
  link,
  description,
  selfUrl,
  language = "en-us",
  items,
}: RssChannel): string {
  const lastBuild = new Date().toUTCString();

  const itemXml = items
    .map((item) => {
      const parts: string[] = [
        `<title>${xmlEscape(item.title)}</title>`,
        `<link>${xmlEscape(item.link)}</link>`,
        `<guid isPermaLink="true">${xmlEscape(item.guid)}</guid>`,
      ];
      if (item.pubDate) {
        const date = new Date(item.pubDate);
        if (!isNaN(date.getTime())) {
          parts.push(`<pubDate>${date.toUTCString()}</pubDate>`);
        }
      }
      if (item.description) {
        parts.push(`<description><![CDATA[${item.description}]]></description>`);
      }
      if (item.categories) {
        for (const cat of item.categories) {
          parts.push(`<category>${xmlEscape(cat)}</category>`);
        }
      }
      return `    <item>\n      ${parts.join("\n      ")}\n    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${xmlEscape(title)}</title>
    <link>${xmlEscape(link)}</link>
    <description>${xmlEscape(description)}</description>
    <language>${xmlEscape(language)}</language>
    <lastBuildDate>${lastBuild}</lastBuildDate>
    <atom:link href="${xmlEscape(selfUrl)}" rel="self" type="application/rss+xml" />
${itemXml}
  </channel>
</rss>
`;
}
