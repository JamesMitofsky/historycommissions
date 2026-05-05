import fs from "fs";
import path from "path";
import { CommissionSchema, type Commission } from "./types";

const COMMISSIONS_DIR = path.join(process.cwd(), "content/commissions");

export const getCommissions = (): Commission[] => {
  return fs
    .readdirSync(COMMISSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(COMMISSIONS_DIR, f), "utf8");
      const slug = f.replace(/\.json$/, "");
      const data = JSON.parse(raw);
      return CommissionSchema.parse({ ...data, slug });
    });
};

export const getCommission = (slug: string): Commission => {
  const filePath = path.join(COMMISSIONS_DIR, `${slug}.json`);
  const raw = fs.readFileSync(filePath, "utf8");
  const data = JSON.parse(raw);
  return CommissionSchema.parse({ ...data, slug });
};
