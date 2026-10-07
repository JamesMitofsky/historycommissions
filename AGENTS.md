# This is NOT the Astro you know

The site runs **Astro 7** with **Svelte 5** islands. Both are newer than most model training data — APIs, conventions, and file structure may all differ from what you remember, and confident recall is the failure mode here. Check before writing code, not after:

- **Svelte** — use the `svelte` MCP server (`list-sections`, then `get-documentation`), and run `svelte-autofixer` on every component you touch. Runes (`$state`, `$derived`, `$effect`, `$props`) only; no stores-by-default, no `export let`.
- **Astro** — the installed version's types under `node_modules/astro/` are the source of truth, then <https://docs.astro.build>. Heed deprecation notices.

Verify against the installed version rather than the latest release notes: this repo may sit ahead of or behind either.

# CMS

The CMS is **Sveltia CMS** (a Decap successor), configured in `public/admin/config.yml` with custom widgets in `public/admin/*-widget.js`. The pinned package's types under `node_modules/@sveltia/cms/types/` are the source of truth; the docs site (sveltiacms.app, `llms.txt`) may be ahead of the pinned version.

- `public/admin/sveltia-cms.js`, `chunks/` and `vendor/` are copied in by `scripts/vendor-cms.ts` (runs before `dev` and `build`) and are gitignored.
- The admin page itself is `src/pages/admin/index.astro`, an Astro page so its preview code goes through the site's build.
- When upgrading `@sveltia/cms`, re-run `pnpm vendor:cms`: it fails if the Immutable.js import map in `src/pages/admin/index.astro` no longer matches the URL Sveltia imports.
- The posts and commissions previews (`src/cms-preview/`) mount the site's own `PostArticle` and `CommissionArticle` components with the site's stylesheet and fonts. A change to how those pages look belongs in those components (or `src/lib/page-classes.ts`), so the page and the preview cannot drift apart. Elements carrying `transition:name` stay in the `.astro` page and are passed in as slots, because Astro strips transition scopes from framework-component props.
