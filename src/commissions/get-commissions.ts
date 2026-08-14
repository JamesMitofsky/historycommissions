import fs from "fs";
import path from "path";
import { z } from "astro/zod";
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
 * Load and validate a single commission file. A file that fails validation
 * throws a loud, field-specific error instead of failing silently, so a broken
 * CMS edit can never reach a deploy unnoticed.
 */
function loadCommission(file: string): Commission {
  const raw = fs.readFileSync(path.join(COMMISSIONS_DIR, file), "utf8");
  const slug = file.replace(/\.json$/, "");

  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch (e) {
    throw new Error(
      `Invalid commission "${file}": not valid JSON — ${(e as Error).message}`,
      { cause: e },
    );
  }

  const result = CommissionSchema.safeParse({ ...(data as object), slug });
  if (!result.success) throw new Error(describeError(file, result.error));
  return result.data;
}

export const getCommissions = (): Commission[] =>
  fs
    .readdirSync(COMMISSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map(loadCommission);
