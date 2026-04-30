import fs from "fs";
import path from "path";
import type { Commission } from "./types";

const COMMISSIONS_DIR = path.join(process.cwd(), "content/commissions");

export const getCommissions = (): Commission[] => {
  return fs
    .readdirSync(COMMISSIONS_DIR)
    .filter((f) => f.endsWith(".json"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(COMMISSIONS_DIR, f), "utf8");
      return JSON.parse(raw) as Commission;
    });
};
