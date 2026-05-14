import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import Fuse from "fuse.js";

countries.registerLocale(en);

const ENTRIES = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));


const fuse = new Fuse(ENTRIES, {
  keys: ["name"],
  threshold: 0.4,
  ignoreLocation: true,
  minMatchCharLength: 2,
});

const SPECIAL_ALPHA2: Record<string, string> = {
  Europe: "eu",
};

export function countryCodeForTag(tag: string): string | null {
  if (SPECIAL_ALPHA2[tag]) return SPECIAL_ALPHA2[tag];
  const exact = countries.getAlpha2Code(tag, "en");
  if (exact) return exact.toLowerCase();
  const results = fuse.search(tag);
  return results[0]?.item.code.toLowerCase() ?? null;
}

export function numericIdForTag(tag: string): number | null {
  const alpha2 = countryCodeForTag(tag);
  if (!alpha2 || alpha2 === "eu") return null;
  const numeric = countries.alpha2ToNumeric(alpha2.toUpperCase());
  return numeric != null ? parseInt(numeric, 10) : null;
}
