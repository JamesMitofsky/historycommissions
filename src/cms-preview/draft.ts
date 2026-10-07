import type { Commission } from "@/commissions/types";
import {
  CommissionStatusSchema,
  LinkStatusSchema,
  PublicationFormatSchema,
} from "@/commissions/schema";

/**
 * Turn the CMS's in-progress draft into the shapes the site's components take.
 *
 * The site parses stored files with the schemas in src/commissions/schema.ts
 * and src/blog/schema.ts, and those are deliberately strict: a translation with
 * no name fails the build. A draft is mid-edit by definition — a list row was
 * just added and is still empty, a required field has not been reached yet —
 * so parsing it with the same schema would blank the whole preview at exactly
 * the moments an editor is looking at it. These functions fill the same
 * defaults the schemas do, and drop the rows the schemas would reject, so the
 * preview shows what is there so far.
 *
 * The return types are the site's own, so a field added to a schema is a type
 * error here until the preview learns about it too.
 */

type Data = Record<string, unknown>;

function record(value: unknown): Data {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Data)
    : {};
}

function list(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

/**
 * Empty fields come through as "", null or undefined depending on whether the
 * editor has touched them; the site's files omit them instead
 * (`omit_empty_optional_fields` in public/admin/config.yml), so all three mean
 * the same thing here: absent.
 */
function text(value: unknown): string | null {
  if (typeof value === "number") return String(value);
  if (typeof value !== "string") return null;
  return value.trim() === "" ? null : value;
}

function texts(value: unknown): string[] {
  return list(value)
    .map(text)
    .filter((v): v is string => v !== null);
}

function oneOf<T extends string>(
  schema: { safeParse(v: unknown): { success: true; data: T } | { success: false } },
  value: unknown,
): T | null {
  const result = schema.safeParse(value);
  return result.success ? result.data : null;
}

export function toCommission(data: unknown): Commission {
  const d = record(data);
  const name = record(d.name);

  return {
    // Not shown on the page, and a new entry does not have one until saved.
    slug: "",
    isPublished: d.isPublished === true,
    name: {
      englishName: text(name.englishName) ?? "",
      translations: list(name.translations).flatMap((t) => {
        const row = record(t);
        const language = text(row.language);
        const translated = text(row.name);
        return language && translated ? [{ language, name: translated }] : [];
      }),
    },
    proposedDate: text(d.proposedDate),
    startDate: text(d.startDate),
    lastActiveStatusDate: text(d.lastActiveStatusDate),
    lastActiveStatus: oneOf(CommissionStatusSchema, d.lastActiveStatus),
    memberCountries: texts(d.memberCountries),
    sponsoringInstitutions: texts(d.sponsoringInstitutions),
    keyTopics: texts(d.keyTopics),
    publications: list(d.publications).flatMap((p) => {
      const row = record(p);
      const title = text(row.title);
      if (!title) return [];
      const year = Number(row.year);
      return [
        {
          title,
          year: Number.isInteger(year) && year > 0 ? year : null,
          url: text(row.url),
          format: oneOf(PublicationFormatSchema, row.format) ?? "other",
        },
      ];
    }),
    workingGroups: texts(d.workingGroups),
    status: oneOf(CommissionStatusSchema, d.status) ?? "unknown",
    chairs: list(d.chairs).flatMap((c) => {
      const row = record(c);
      const chairName = text(row.name);
      const country = text(row.country);
      return chairName && country
        ? [{ name: chairName, country, affiliation: text(row.affiliation) }]
        : [];
    }),
    url: text(d.url) ?? "",
    linkStatus: oneOf(LinkStatusSchema, d.linkStatus) ?? "not_located",
    archivableDocuments: list(d.archivableDocuments).flatMap((doc) => {
      const row = record(doc);
      const title = text(row.title);
      const url = text(row.url);
      return title && url ? [{ title, url }] : [];
    }),
  };
}

/** The post fields PostArticle draws, normalised the way src/blog/get-posts.ts does. */
export interface PostDraft {
  title: string | null;
  date: string | null;
  author: string | null;
  tags: string[];
  image: string | null;
  imageAttribution: string | null;
  imageAttributionUrl: string | null;
  body: string;
}

export function toPostDraft(data: unknown): PostDraft {
  const d = record(data);

  // Same normalisation as toIso() in src/blog/get-posts.ts: whatever the
  // datetime widget holds becomes an ISO string, or nothing if it is not a date.
  let date: string | null = null;
  if (typeof d.date === "string" || d.date instanceof Date) {
    const parsed = new Date(d.date);
    if (!Number.isNaN(parsed.getTime())) date = parsed.toISOString();
  }

  return {
    title: text(d.title),
    date,
    author: text(d.author),
    tags: texts(d.tags),
    image: text(d.image),
    imageAttribution: text(d.imageAttribution),
    imageAttributionUrl: text(d.imageAttributionUrl),
    body: typeof d.body === "string" ? d.body : "",
  };
}
