import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";
import astro from "eslint-plugin-astro";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteConfig from "./svelte.config.js";

export default defineConfig([
  globalIgnores(["dist/**", ".astro/**", "node_modules/**", "public/admin/**"]),

  js.configs.recommended,
  ...ts.configs.recommended,
  ...astro.configs.recommended,
  ...svelte.configs.recommended,

  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
  },

  // Svelte files need the TS parser for <script lang="ts"> and a pointer back to
  // svelte.config.js so the plugin resolves the same preprocessor the build uses.
  {
    files: ["**/*.svelte", "**/*.svelte.ts"],
    languageOptions: {
      parserOptions: {
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
]);
