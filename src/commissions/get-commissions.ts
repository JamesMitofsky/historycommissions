import fs from "fs";
import path from "path";
import { z } from "zod";
import { CommissionSchema, type Commission } from "./types";

const COMMISSIONS_DIR = path.join(process.cwd(), "content/commissions");

/** Turn a Zod failure into a message that names the file and every bad field. */
function describeError(file: string, error: z.ZodError): string {
  const issues = error.issues
    .map((i) => `${i.path.join(".") || "(root)"} — ${i.message}`)
    .join("; ");
  return `Invalid commission "${file}": ${issues}`;
}

/**
 * Load and validate a single commission file.
 * Returns `null` for drafts — work-in-progress entries are hidden from the
 * public site and skipped by the build, so an incomplete draft can never break
 * a deploy. A published (non-draft) file that fails validation throws a loud,
 * field-specific error instead of failing silently.
 */
function loadCommission(file: string): Commission | null {
  const raw = fs.readFileSync(path.join(COMMISSIONS_DIR, file), "utf8");
  const slug = file.replace(/\.json$/, "");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(`Invalid commission "${file}": not valid JSON — ${(e as Error).message}`);
  }

  if ((data as { draft?: unknown } | null)?.draft === true) return null;

  const result = CommissionSchema.safeParse({ ...(data as object), slug });
  if (!result.success) throw new Error(describeError(file, result.error));
  return result.data;
}

export const getCommissions = (): Commission[] =>
  fs
    .readdirSync(COMMISSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map(loadCommission)
    .filter((c): c is Commission => c !== null);

export const getCommission = (slug: string): Commission => {
  const commission = loadCommission(`${slug}.json`);
  if (!commission) throw new Error(`Commission "${slug}" not found or is a draft`);
  return commission;
};
