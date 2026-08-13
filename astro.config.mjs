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

  // `<ClientRouter />` already switches prefetching on, but only for links that
  // opt in with `data-astro-prefetch`. Every internal link here goes to another
  // prerendered page of the same small site, so there is nothing worth making
  // opt-in — `prefetchAll` covers the nav, the post cards and the commission
  // cards alike.
  //
  // `viewport` rather than `load`. Both queue through `requestIdleCallback`, so
  // neither competes with first paint directly, but `load` queues *every* link
  // on the page — and the posts index alone carries around thirty cards, each
  // linking to a post and to one country page per tag. That measured as ~35
  // documents fetched in the second after load, a few hundred kB spent on a
  // small screen showing four of those links, and on a metered connection spent
  // for real.
  //
  // `viewport` keeps the win where it was earned — a link the visitor can see is
  // a link they might follow, and it is still prefetched well before any pointer
  // reaches it — while the long tail below the fold waits until scrolled to.
  // Astro's prefetch honours Save-Data and slow connections under either.
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },

  // Country pages take their slug from the name as written in content, so the
  // three posts tagged "N. Macedonia" built a second country page next to the
  // one the commissions' "North Macedonia" built, and the country's content sat
  // split across both. The tags are normalised now; this keeps the URL the
  // abbreviated spelling produced from going dark.
  //
  // Emitted through the Netlify adapter's Frameworks API output rather than
  // netlify.toml — same reason the adapter is here at all.
  redirects: {
    "/countries/n-macedonia": "/countries/north-macedonia",
  },

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

  // Both families are vendored under src/assets/fonts and read from disk, so a
  // build makes no request to Google or Fontsource and cannot be broken by
  // either being unreachable or by an upstream version changing under it.
  //
  // The files named here are already subset and compressed. Astro's font
  // pipeline does not transcode: it hashes whatever the provider hands it and
  // writes the @font-face rules, which was invisible while a remote provider was
  // serving pre-subset woff2 and became very visible when pointing this at the
  // .ttf originals published 1.13MB of unsubset TrueType. scripts/subset-fonts.py
  // does that work now, and the .ttf sources beside these are its inputs.
  //
  // Not in public/: Astro copies that directory verbatim, which would publish
  // the sources alongside the output. Inputs belong in src/.
  //
  // Both are OFL, and the licence travels with the font — OFL-DMSans.txt and
  // OFL-LibertinusSerif.txt sit beside the files they cover.
  fonts: [
    {
      provider: fontProviders.local(),
      name: "DM Sans",
      cssVariable: "--font-sans",
      options: {
        variants: [
          {
            // One variable file covers the whole range the UI asks for: 400
            // body text, 500 for `font-medium`, 600 for `font-semibold`, 700
            // for `font-bold`. Four static weights would be four files.
            src: ["./src/assets/fonts/DMSans-Variable.woff2"],
            weight: "400 700",
            style: "normal",
          },
        ],
      },
      display: "swap",
      fallbacks: ["system-ui", "sans-serif"],
    },
    {
      provider: fontProviders.local(),
      name: "Libertinus Serif",
      cssVariable: "--font-serif",
      // A static face, because Libertinus Serif has no variable build — and one
      // rather than two, because every serif heading on the site is
      // `font-semibold`. A Bold was vendored alongside it for a single element,
      // the masthead title, which now sets at 600 like the rest; that made the
      // second face 50kB downloaded on every page for three words.
      //
      // LibertinusSerif-Bold.woff is still generated by scripts/subset-fonts.py
      // and still used — but only by the OG card renderer, which runs at build
      // time and never puts the file in front of a browser.
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/LibertinusSerif-SemiBold.woff2"],
            weight: 600,
            style: "normal",
          },
        ],
      },
      display: "swap",
      fallbacks: ["Georgia", "serif"],
    },
  ],
});
