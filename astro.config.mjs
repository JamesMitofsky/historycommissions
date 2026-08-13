// @ts-check
import { defineConfig, fontProviders } from "astro/config";
import netlify from "@astrojs/netlify";
import svelte from "@astrojs/svelte";
import tailwindcss from "@tailwindcss/vite";

// Netlify exposes the deploy URL as URL; SITE_URL overrides it locally.
const site =
  process.env.SITE_URL ?? process.env.URL ?? "http://localhost:4321";

export default defineConfig({
  site,

  // Every page here is prerendered, so the adapter is not what makes the site
  // render — it is what makes Netlify's own primitives available to it:
  // redirects and headers are emitted through the Netlify Frameworks API
  // (`.netlify/v1/`) instead of having to be hand-maintained in netlify.toml,
  // and `astro dev` can emulate the platform. `netlify.toml` still points the
  // deploy at `dist/`, which is where the static output lands either way.
  adapter: netlify({
    // The site's images are local assets, and the build already optimizes them
    // with sharp — including the blur placeholders FadeImage inlines, which are
    // generated from the same pipeline. Routing them through the Netlify Image
    // CDN instead would move that work to request time and split image handling
    // across two systems for no gain on a fully static build.
    imageCDN: false,
  }),

  integrations: [svelte()],

  vite: {
    // The release minifier collapses a vendor-prefixed property and its
    // standard twin into one declaration and keeps only the last in source
    // order, which silently strips `-webkit-backdrop-filter` from Tailwind's
    // `backdrop-blur-*` utilities — invisible in dev, which does not minify.
    // Declaring the floor makes it keep both pairs. The floor is Tailwind v4's
    // own baseline, so nothing here asks the minifier to downlevel syntax the
    // framework already assumes — and Safari only shipped unprefixed
    // `backdrop-filter` in 18, so a 16.4 floor is what keeps the prefix alive.
    build: {
      cssTarget: ["chrome111", "firefox128", "safari16.4"],
    },
    plugins: [tailwindcss()],
  },

  // Self-hosted and subset at build time, each exposed as the CSS variable the
  // Tailwind theme reads — no runtime request to a font vendor.
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
