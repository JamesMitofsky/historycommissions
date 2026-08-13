import countries from "world-countries";

/**
 * Resolves a country name as written in content to its ISO codes.
 *
 * Build-time only. Islands receive the resolved values as plain data — see
 * src/lib/country.ts — so nothing here is bundled for the browser and the size
 * of the dataset is not a consideration.
 *
 * This used to run against i18n-iso-countries, which indexes the ISO register's
 * *official* names: "Moldova, Republic of", "Korea, Republic of", "Russian
 * Federation". Content is written in common names, so nothing matched directly
 * and the gap was papered over with a hand-maintained alias table and a Fuse
 * fuzzy pass guarded by two magic numbers — a maximum score and a maximum length
 * difference. It failed the way that design fails: silently, and only for names
 * nobody had thought to alias. "Moldova" scored well and was thrown out for
 * being 13 characters shorter than "Moldova, Republic of", so it rendered
 * without a flag and nobody noticed.
 *
 * world-countries indexes the common name, the official name, the native forms
 * and the alternative spellings, which between them cover every country named in
 * this content by exact lookup. No fuzzy matching, no aliases, and a name that
 * does not resolve is a name that genuinely is not there.
 */

/**
 * Names that are not countries but are meaningful tags. "Europe" takes the EU
 * flag and has no single geometry to highlight on a map.
 */
const SPECIAL_ALPHA2: Record<string, string> = {
  europe: "eu",
};

/**
 * Every name any country is known by, lowercased, pointing at that country.
 *
 * Built once at module load. Insertion order decides ties, and common names go
 * in first on purpose: a handful of countries list another country's name among
 * their alternative spellings, and the common name is the one content means.
 */
const BY_NAME = new Map<string, (typeof countries)[number]>();

function index(name: string | undefined, country: (typeof countries)[number]) {
  const key = name?.trim().toLowerCase();
  if (key && !BY_NAME.has(key)) BY_NAME.set(key, country);
}

for (const country of countries) index(country.name.common, country);
for (const country of countries) {
  index(country.name.official, country);
  for (const alt of country.altSpellings) index(alt, country);
  for (const native of Object.values(country.name.native ?? {})) {
    index(native.common, country);
    index(native.official, country);
  }
}

function lookup(tag: string) {
  return BY_NAME.get(tag.trim().toLowerCase()) ?? null;
}

/** ISO 3166-1 alpha-2, lowercased — the key the flag files are named by. */
export function countryCodeForTag(tag: string): string | null {
  const special = SPECIAL_ALPHA2[tag.trim().toLowerCase()];
  if (special) return special;

  return lookup(tag)?.cca2.toLowerCase() ?? null;
}

/** ISO 3166-1 numeric — the key the world topology's geometries carry. */
export function numericIdForTag(tag: string): number | null {
  const country = lookup(tag);
  if (!country) return null;
  const numeric = parseInt(country.ccn3, 10);
  return Number.isNaN(numeric) ? null : numeric;
}

/**
 * Every common name in the dataset, for the CMS picklist.
 *
 * Exported from here rather than assembled in the generator script so the names
 * an editor can choose are, by construction, names this module resolves.
 */
export function allCountryNames(): string[] {
  return countries.map((country) => country.name.common);
}
