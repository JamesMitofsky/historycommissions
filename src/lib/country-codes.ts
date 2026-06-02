import countries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import Fuse from "fuse.js";

countries.registerLocale(en);

const ENTRIES = Object.entries(countries.getNames("en")).map(([code, name]) => ({ code, name }));

const fuse = new Fuse(ENTRIES, {
  keys: ["name"],
  threshold: 0.2,
  ignoreLocation: true,
  minMatchCharLength: 3,
  includeScore: true,
});

const SPECIAL_ALPHA2: Record<string, string> = {
  Europe: "eu",
};

const MANUAL_ALIASES: Record<string, string> = {
  "north macedonia": "mk",
  "n. macedonia": "mk",
  "south korea": "kr",
  "north korea": "kp",
  "czech republic": "cz",
  "czechia": "cz",
  "russia": "ru",
  "usa": "us",
  "uk": "gb",
};

const MAX_FUZZY_SCORE = 0.12;
const MAX_LENGTH_DELTA = 2;

export function countryCodeForTag(tag: string): string | null {
  if (SPECIAL_ALPHA2[tag]) return SPECIAL_ALPHA2[tag];

  const normalized = tag.trim().toLowerCase();
  if (MANUAL_ALIASES[normalized]) return MANUAL_ALIASES[normalized];

  const exact = countries.getAlpha2Code(tag, "en");
  if (exact) return exact.toLowerCase();

  if (tag.trim().length < 4) return null;

  const results = fuse.search(tag);
  const best = results[0];
  if (!best || best.score == null) return null;
  if (best.score > MAX_FUZZY_SCORE) return null;
  if (Math.abs(best.item.name.length - tag.length) > MAX_LENGTH_DELTA) return null;

  return best.item.code.toLowerCase();
}

export function numericIdForTag(tag: string): number | null {
  const alpha2 = countryCodeForTag(tag);
  if (!alpha2 || alpha2 === "eu") return null;
  const numeric = countries.alpha2ToNumeric(alpha2.toUpperCase());
  return numeric != null ? parseInt(numeric, 10) : null;
}
