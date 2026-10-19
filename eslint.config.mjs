import { defineConfig, globalIgnores } from "eslint/config";
import js from "@eslint/js";
import ts from "typescript-eslint";
import astro from "eslint-plugin-astro";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import svelteConfig from "./svelte.config.js";

export default defineConfig([
  // Build output and vendored files. `.vercel/**` is the adapter's Build Output
  // API tree — a full copy of the built site, generated, minified, and not ours
  // to lint; without it a `pnpm lint` run after any `pnpm build` drowns in
  // errors from bundled code and the real findings scroll off the top.
  globalIgnores([
    "dist/**",
    ".astro/**",
    ".vercel/**",
    "node_modules/**",
    "public/admin/**",
  ]),

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
