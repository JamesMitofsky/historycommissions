/**
 * Validates every commission JSON, unpublished ones included, against the Zod
 * schema — the same contract the site build enforces. Run in CI (and locally)
 * so a CMS edit that would break the build is named loudly, field by field.
 *
 *   pnpm validate:commissions
 */
import fs from "fs";
import path from "path";
import { CommissionSchema, LEGACY_STATUSES } from "../src/commissions/schema";

const COMMISSIONS_DIR = path.join(process.cwd(), "content/commissions");

const files = fs.readdirSync(COMMISSIONS_DIR).filter((f) => f.endsWith(".json"));

let failures = 0;

for (const file of files) {
  const raw = fs.readFileSync(path.join(COMMISSIONS_DIR, file), "utf8");
  const slug = file.replace(/\.json$/, "");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    failures++;
    console.error(`✗ ${file}\n    not valid JSON — ${(e as Error).message}`);
    continue;
  }

  // Legacy values still parse (see LEGACY_STATUSES), so they cannot break the
  // build, but name them so the file is re-saved with the current value.
  for (const field of ["status", "lastActiveStatus"] as const) {
    const value = (data as Record<string, unknown>)[field];
    if (typeof value === "string" && Object.hasOwn(LEGACY_STATUSES, value)) {
      console.warn(
        `! ${file}\n    ${field} — "${value}" is a retired value, read as "${LEGACY_STATUSES[value]}". Re-save it with the current value.`,
      );
    }
  }

  const result = CommissionSchema.safeParse({ ...(data as object), slug });
  if (!result.success) {
    failures++;
    const lines = result.error.issues
      .map((i) => `    ${i.path.join(".") || "(root)"} — ${i.message}`)
      .join("\n");
    console.error(`✗ ${file}\n${lines}`);
  }
}

const total = files.length;
if (failures > 0) {
  console.error(`\n${failures} of ${total} commission(s) failed validation.`);
  process.exit(1);
}

console.log(`✓ All ${total} commissions are valid.`);
