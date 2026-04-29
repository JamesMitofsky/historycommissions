import fs from "fs";
import path from "path";
import type { Commission } from "./types";

export const getCommissions = (): Commission[] => {
  const filePath = path.join(process.cwd(), "content/commissions-list.json");
  const raw = fs.readFileSync(filePath, "utf8");
  return JSON.parse(raw) as Commission[];
};
