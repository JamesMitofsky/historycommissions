/**
 * Validates every published commission JSON against the Zod schema — the same
 * contract the site build enforces. Run in CI (and locally) so a CMS edit that
 * would break the build is caught loudly on the PR, before it reaches production.
 *
 *   pnpm validate:commissions
 */
import fs from "fs";
import path from "path";
import { CommissionSchema } from "../src/commissions/schema";

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

  const result = CommissionSchema.safeParse({ ...(data as object), slug });
  if (!result.success) {
    failures++;
    const lines = result.error.issues
      .map((i) => `    ${i.path.join(".") || "(root)"} — ${i.message}`)
      .join("\n");
    console.error(`✗ ${file}\n${lines}`);
  }
}

const published = files.length;
if (failures > 0) {
  console.error(
    `\n${failures} of ${published} published commission(s) failed validation.`
  );
  process.exit(1);
}

console.log(`✓ All ${published} published commissions are valid.`);
