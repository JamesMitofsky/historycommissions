/**
 * Fails if any content file carries a key that tina/config.ts does not declare.
 *
 * TinaCMS rewrites a whole file from its schema on save, so an undeclared key
 * is not merely ignored — it is deleted the first time an editor saves that
 * entry, with no warning in the UI. Tina's own indexer does not catch this
 * either: it accepts files with unknown keys and wrong types without complaint.
 * This check closes that gap, alongside validate-commissions (the Zod contract
 * the site build enforces).
 *
 * Reads the schema from tina/tina-lock.json, the committed snapshot TinaCloud
 * itself uses, so it runs without a Tina build. CI separately confirms the lock
 * is current with tina/config.ts.
 *
 *   pnpm validate:tina-schema
 */
import fs from "fs";
import path from "path";
import { parse as parseYaml } from "yaml";

interface TinaField {
  name: string;
  type: string;
  list?: boolean;
  isBody?: boolean;
  fields?: TinaField[];
}

interface TinaCollection {
  name: string;
  path: string;
  format?: string;
  match?: { include?: string; exclude?: string };
  fields: TinaField[];
}

const ROOT = process.cwd();
const lock = JSON.parse(
  fs.readFileSync(path.join(ROOT, "tina/tina-lock.json"), "utf8"),
) as { schema: { collections: TinaCollection[] } };

/** The files a collection owns, mirroring Tina's path/match/format rules. */
function filesFor(collection: TinaCollection): string[] {
  const dir = path.join(ROOT, collection.path);
  const ext = `.${collection.format ?? "md"}`;
  const include = collection.match?.include;
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(ext))
    .filter((f) => !include || f.slice(0, -ext.length) === include)
    .map((f) => path.join(dir, f));
}

function readData(file: string, format: string): Record<string, unknown> {
  const raw = fs.readFileSync(file, "utf8");
  if (format === "json") return JSON.parse(raw);
  const match = /^---\r?\n([\s\S]*?)\r?\n---/.exec(raw);
  return match ? (parseYaml(match[1]) ?? {}) : {};
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Collect "a.b[].c"-style paths of keys the schema does not declare. */
function undeclared(
  data: Record<string, unknown>,
  fields: TinaField[],
  prefix = "",
): string[] {
  const byName = new Map(fields.map((f) => [f.name, f]));
  const found: string[] = [];
  for (const [key, value] of Object.entries(data)) {
    const field = byName.get(key);
    const at = prefix ? `${prefix}.${key}` : key;
    if (!field || field.isBody) {
      found.push(at);
      continue;
    }
    if (field.type !== "object" || !field.fields) continue;
    const items = field.list && Array.isArray(value) ? value : [value];
    const itemPath = field.list ? `${at}[]` : at;
    for (const item of items) {
      if (isPlainObject(item)) {
        found.push(...undeclared(item, field.fields, itemPath));
      }
    }
  }
  return [...new Set(found)];
}

let failures = 0;
let total = 0;

for (const collection of lock.schema.collections) {
  const format = collection.format ?? "md";
  for (const file of filesFor(collection)) {
    total++;
    const rel = path.relative(ROOT, file);
    let data: Record<string, unknown>;
    try {
      data = readData(file, format);
    } catch (e) {
      failures++;
      console.error(`✗ ${rel}\n    could not be parsed — ${(e as Error).message}`);
      continue;
    }
    const keys = undeclared(data, collection.fields);
    if (keys.length > 0) {
      failures++;
      const lines = keys.map((k) => `    ${k}`).join("\n");
      console.error(
        `✗ ${rel} (collection "${collection.name}")\n` +
          `  not declared in tina/config.ts, so Tina would delete on save:\n${lines}`,
      );
    }
  }
}

if (failures > 0) {
  console.error(`\n${failures} of ${total} content file(s) have keys Tina does not know about.`);
  process.exit(1);
}

console.log(`✓ All ${total} content files fit the Tina schema.`);
