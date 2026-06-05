import fs from "fs";
import path from "path";
import {
  AboutSettingsSchema,
  GeneralSettingsSchema,
  type AboutSettings,
  type GeneralSettings,
} from "./schema";

const SETTINGS_DIR = path.join(process.cwd(), "content/settings");

const readJson = (file: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(SETTINGS_DIR, file), "utf8"));

export const getGeneralSettings = (): GeneralSettings =>
  GeneralSettingsSchema.parse(readJson("general.json"));

export const getAboutSettings = (): AboutSettings =>
  AboutSettingsSchema.parse(readJson("about.json"));
