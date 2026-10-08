/**
 * Copy the pinned Sveltia CMS build into public/admin/ so /admin is served
 * entirely from this site.
 *
 *     pnpm vendor:cms
 *
 * Runs before `dev` and `build`. The version is pinned in package.json and
 * the lockfile, so an upgrade is a reviewed dependency bump rather than
 * whatever a CDN happens to serve that day, and the editor keeps working even
 * if that CDN does not.
 *
 * chunks/ goes along with the main bundle: Sveltia lazy-loads React from
 * there for custom widgets (public/admin/country-widget.js and
 * language-widget.js), looking next to its own script first and only falling
 * back to a CDN when the file is missing.
 *
 * Immutable.js goes along too. Sveltia imports it from a hardcoded unpkg URL
 * whenever a custom widget renders, so without a local copy the country and
 * language pickers would depend on unpkg being reachable. The import map in
 * src/pages/admin/index.astro redirects that exact URL to the copy made here;
 * this script fails if a Sveltia upgrade starts asking for a different URL,
 * rather than letting the editor quietly go back to the CDN.
 *
 * The copies are build output and gitignored.
 */
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

// The package's exports map does not expose package.json, so locate it from
// the resolved entry point instead.
const require = createRequire(import.meta.url);
let pkgDir = path.dirname(require.resolve("@sveltia/cms"));
while (!fs.existsSync(path.join(pkgDir, "package.json"))) {
  pkgDir = path.dirname(pkgDir);
}
const distDir = path.join(pkgDir, "dist");
const outDir = path.resolve("public/admin");

function copy(rel: string) {
  const from = path.join(distDir, rel);
  const to = path.join(outDir, rel);
  fs.mkdirSync(path.dirname(to), { recursive: true });
  fs.copyFileSync(from, to);
}

copy("sveltia-cms.js");
const chunks = fs
  .readdirSync(path.join(distDir, "chunks"))
  .filter((f) => f.endsWith(".js"));
for (const chunk of chunks) copy(path.join("chunks", chunk));

const pkg = JSON.parse(
  fs.readFileSync(path.join(pkgDir, "package.json"), "utf8"),
) as { version: string; dependencies: Record<string, string> };

// Sveltia builds the URL as unpkg.com/immutable@<declared range minus its
// leading ^ or ~>, so that is the key the import map has to carry.
const immutableVersion = pkg.dependencies.immutable.replace(/^\D/, "");
const immutableUrl = `https://unpkg.com/immutable@${immutableVersion}/dist/immutable.es.js`;
const adminPage = fs.readFileSync(
  path.resolve("src/pages/admin/index.astro"),
  "utf8",
);
if (!adminPage.includes(`"${immutableUrl}"`)) {
  console.error(
    `src/pages/admin/index.astro's import map does not map ${immutableUrl}.\n` +
      `Sveltia ${pkg.version} imports Immutable.js from that URL; update the import map key.`,
  );
  process.exit(1);
}
const immutableEntry = createRequire(path.join(pkgDir, "package.json")).resolve(
  "immutable",
);
fs.mkdirSync(path.join(outDir, "vendor"), { recursive: true });
fs.copyFileSync(
  path.join(path.dirname(immutableEntry), "immutable.es.js"),
  path.join(outDir, "vendor/immutable.es.js"),
);

console.log(
  `Vendored Sveltia CMS ${pkg.version} (+${chunks.length} chunk) and Immutable.js into ${outDir}`,
);
