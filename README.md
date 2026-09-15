# History Commissions Archive

A digital archive of bilateral **historical commissions** — the joint expert bodies countries set up to reconcile contested history (textbooks, war memory, disputed events).

Built with Astro and Svelte. All content lives as plain files in this repo, so Git *is* the database.

- **Commissions** — one JSON file per commission in `content/commissions/`, rendered as a browsable, searchable list plus per-country pages and an interactive globe/map.
- **Posts** — Markdown news entries in `content/posts/`.
- **Feeds** — RSS at `/feed.xml` and `/commissions/feed.xml`.

## Getting started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:4321](http://localhost:4321).

## Editing content (Decap CMS)

Editors log in at `/admin` with email/password via **Netlify Identity** — no GitHub account needed. Saves commit straight to `main`, and a CI schema check (`validate-commissions`) flags any entry that would break the build.

Every post and commission has a **Published** toggle (`isPublished`). Entries stay off the site until it is on — a missing value counts as off — but edits to an already-published entry go live as soon as they are saved.

To edit locally without deploying, run the Decap proxy alongside the dev server:

```bash
# Terminal 1
npx decap-server

# Terminal 2
pnpm dev
```

Open [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html), click **Use Local Backend**, and edit without auth. Changes write directly to `content/` on disk.

## Deploy

Deploys to **Netlify** via the `@astrojs/netlify` adapter. Pushes to `main` trigger a production build automatically.

## Portability

Every external dependency and how to move off it: see **[DataPortability.md](./DataPortability.md)**.

## TODOs

- [ ] Add commissions collection back to Decap CMS
- [ ] Add TODO.md with commission schema details
- [ ] Markdown will be deprecated in a year or so in favor of rich text
