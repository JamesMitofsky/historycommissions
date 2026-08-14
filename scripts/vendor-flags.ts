/**
 * Vendor the flag SVGs the site actually uses into public/flags/.
 *
 *     pnpm vendor:flags
 *
 * FlagTag used to build a URL on react-circle-flags.pages.dev and let the
 * browser fetch each flag from there. Ten of those went out on the posts index
 * alone, at High priority, in the window where the masthead image was still
 * arriving — and the first of them could not start until a DNS lookup, a TCP
 * connection and a TLS handshake had completed against an origin the site
 * otherwise has nothing to do with. Same-origin they are already-warm
 * connections, cached under the site's own headers, and present offline.
 *
 * The set is derived from content rather than fixed: every country named by a
 * post tag or a commission's memberCountries, resolved through the same
 * country-code matching the site uses everywhere else. Re-run it after adding a
 * country that has not been mentioned before — the check in src/lib/country.ts
 * will point at a missing file rather than fail quietly.
 *
 * Artwork comes from HatScripts/circle-flags (MIT), by way of the same CDN this
 * replaces; the licence travels with it in public/flags/LICENSE.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { countryCodeForTag } from "../src/lib/country-codes";

const SOURCE = "https://react-circle-flags.pages.dev";
const OUT_DIR = path.resolve("public/flags");
const CONTENT = path.resolve("content");

const LICENSE = `Flag artwork from HatScripts/circle-flags, MIT licensed.
https://github.com/HatScripts/circle-flags

Vendored by scripts/vendor-flags.ts. Do not edit these files by hand.
`;

/** Every country name the content names, in either shape it can appear in. */
async function collectCountryNames(): Promise<string[]> {
  const names = new Set<string>();

  const commissionsDir = path.join(CONTENT, "commissions");
  for (const file of await fs.readdir(commissionsDir)) {
    if (!file.endsWith(".json")) continue;
    const raw = await fs.readFile(path.join(commissionsDir, file), "utf8");
    for (const country of JSON.parse(raw).memberCountries ?? []) {
      names.add(country);
    }
  }

  // Post tags live in YAML frontmatter, and this reads them without pulling in
  // a parser: the block is fenced by --- and the tags are a plain list. A
  // malformed file simply contributes nothing, which is the right failure here —
  // this script's job is to fetch artwork, not to validate content.
  const postsDir = path.join(CONTENT, "posts");
  for (const file of await fs.readdir(postsDir)) {
    if (!file.endsWith(".md")) continue;
    const raw = await fs.readFile(path.join(postsDir, file), "utf8");
    const frontmatter = raw.split("---")[1];
    if (!frontmatter) continue;
    const tagBlock = frontmatter.match(/^tags:\s*\n((?:\s*-\s*.+\n)+)/m);
    if (!tagBlock) continue;
    for (const line of tagBlock[1].split("\n")) {
      const tag = line.replace(/^\s*-\s*/, "").trim().replace(/^["']|["']$/g, "");
      if (tag) names.add(tag);
    }
  }

  return [...names].sort();
}

async function main() {
  const names = await collectCountryNames();

  const codes = new Map<string, string[]>();
  const unresolved: string[] = [];
  for (const name of names) {
    const code = countryCodeForTag(name);
    if (!code) {
      unresolved.push(name);
      continue;
    }
    codes.set(code, [...(codes.get(code) ?? []), name]);
  }

  await fs.mkdir(OUT_DIR, { recursive: true });
  await fs.writeFile(path.join(OUT_DIR, "LICENSE"), LICENSE);

  let fetched = 0;
  for (const [code, forNames] of [...codes].sort()) {
    const dest = path.join(OUT_DIR, `${code}.svg`);
    const response = await fetch(`${SOURCE}/${code}.svg`);
    if (!response.ok) {
      console.error(`  ${code}: ${response.status} ${response.statusText}`);
      continue;
    }
    await fs.writeFile(dest, await response.text());
    fetched++;
    console.log(`  ${code}.svg  ${forNames.join(", ")}`);
  }

  console.log(`\n${fetched} flags vendored to public/flags/`);

  // Not an error. A tag like "Europe" or a body with no ISO country behind it is
  // legitimate content, and FlagTag renders it as a plain chip — but an
  // unresolved name that *should* have matched is worth seeing.
  if (unresolved.length) {
    console.log(`\nNo country code (rendered without a flag):`);
    for (const name of unresolved) console.log(`  ${name}`);
  }
}

main();
