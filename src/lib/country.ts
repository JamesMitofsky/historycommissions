import { countryCodeForTag, numericIdForTag } from "./country-codes";
import { countrySlug } from "./country-slug";

/**
 * A country name from content, with everything the UI needs to draw it already
 * worked out.
 *
 * The point of the type is where the work happens. Turning "North Macedonia"
 * into a flag URL and a topojson id means an ISO register, its English name
 * table and a fuzzy matcher — around 46kB of JavaScript. FlagTag and
 * CommissionMap used to do it in the browser, which put that bundle on the
 * critical path of every page with a tag on it, and did it again on every
 * client-side navigation, to arrive at answers that cannot change between builds.
 *
 * Resolving on the server and handing islands plain data is the ordinary Astro
 * shape for this, the same one the image pipeline already follows: the heavy
 * dependency stays in the build, and what crosses into the client is a string
 * and a number.
 */
export interface ResolvedCountry {
  /** As authored in the content, and what the chip displays. */
  name: string;
  /** Target of the country page link: /countries/<slug>. */
  slug: string;
  /**
   * Path to the vendored flag, or null for a name with no country behind it —
   * "Europe" resolves, an unrecognised name does not, and both render as a chip
   * without artwork rather than as an error.
   */
  flag: string | null;
  /**
   * ISO 3166-1 numeric, which is what the world topology keys its geometries by.
   * Null where there is no single country to highlight.
   */
  numericId: number | null;
}

export function resolveCountry(name: string): ResolvedCountry {
  const code = countryCodeForTag(name);
  return {
    name,
    slug: countrySlug(name),
    // Vendored by scripts/vendor-flags.ts, which derives its list from the same
    // content and the same matcher — so a code that resolves here has a file
    // there, unless a country was added without re-running it.
    flag: code ? `/flags/${code}.svg` : null,
    numericId: numericIdForTag(name),
  };
}

export function resolveCountries(names: string[]): ResolvedCountry[] {
  return names.map(resolveCountry);
}
