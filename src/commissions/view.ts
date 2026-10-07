import type { Commission } from "./schema";
import { STATUS_LABELS } from "./status";

/**
 * What the commission page shows, worked out from the stored entry.
 *
 * Kept apart from the markup because two renderers need it: the prerendered
 * page and the CMS preview (src/cms-preview), which draws the same components
 * from an unsaved draft. Deriving these in the page's frontmatter meant the
 * preview would have had to re-implement every rule here — which name leads,
 * when the link goes to the Wayback Machine — and drift from them unnoticed.
 */
export interface CommissionView {
  /** The `en` translation where there is one, else the stored englishName. */
  primaryName: string;
  /** englishName, shown under the title when it differs from primaryName. */
  alternateName: string | null;
  /** Every other translation, minus any that just repeat englishName. */
  otherNames: string[];
  siteLink: { href: string; label: string } | null;
  details: { label: string; value: string | null }[];
}

export function describeCommission(c: Commission): CommissionView {
  const en = c.name.translations.find((t) => t.language === "en");
  const primaryName = en?.name ?? c.name.englishName;

  return {
    primaryName,
    alternateName:
      c.name.englishName !== primaryName ? c.name.englishName : null,
    otherNames: c.name.translations
      .filter((t) => t.language !== "en" && t.name !== c.name.englishName)
      .map((t) => t.name),
    siteLink:
      c.linkStatus === "live" && c.url
        ? { href: c.url, label: "Website" }
        : c.linkStatus === "archived" && c.url
          ? {
              href: `https://web.archive.org/web/${c.url}`,
              label: "Archived copy",
            }
          : null,
    details: [
      { label: "Proposed", value: c.proposedDate?.slice(0, 4) ?? null },
      { label: "Founded", value: c.startDate?.slice(0, 4) ?? null },
      {
        label: "Last active",
        value: c.lastActiveStatusDate?.slice(0, 4) ?? null,
      },
      {
        label: "Last status",
        value: c.lastActiveStatus ? STATUS_LABELS[c.lastActiveStatus] : null,
      },
      {
        label: "Sponsors",
        value: c.sponsoringInstitutions.join(" · ") || null,
      },
    ],
  };
}
