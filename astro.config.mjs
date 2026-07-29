// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Netlify exposes the deploy URL as URL; SITE_URL overrides it locally.
const site =
  process.env.SITE_URL ?? process.env.URL ?? "http://localhost:4321";

export default defineConfig({
  site,
  integrations: [svelte()],

  vite: {
    plugins: [tailwindcss()],
  },

  // Replaces next/font/google. Astro self-hosts and subsets these at build time
  // and exposes each as the CSS variable the Tailwind theme already reads.
  fonts: [
    {
      provider: fontProviders.google(),
      name: "DM Sans",
      cssVariable: "--font-sans",
      weights: ["400 700"],
      display: "swap",
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Playfair Display",
      cssVariable: "--font-playfair",
      weights: ["400 900"],
      display: "swap",
      fallbacks: ["Georgia", "serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Source Serif 4",
      cssVariable: "--font-source-serif-4",
      weights: ["400 700"],
      display: "swap",
      fallbacks: ["Georgia", "serif"],
    },
    {
      provider: fontProviders.google(),
      name: "Geist Mono",
      cssVariable: "--font-geist-mono",
      weights: ["400 600"],
      display: "swap",
      fallbacks: ["ui-monospace", "monospace"],
    },
  ],
});
