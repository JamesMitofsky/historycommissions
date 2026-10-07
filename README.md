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

## Editing content (Sveltia CMS)

The editor at `/admin` is [Sveltia CMS](https://github.com/sveltia/sveltia-cms), an open-source successor to Decap that reads the same `public/admin/config.yml`. It is served from this site itself (the version is pinned in `package.json` and copied in by `scripts/vendor-cms.ts` before every dev run and build), and it commits straight to this repository through the GitHub API. There is no CMS account, auth service or server in between.

Editors sign in with a **GitHub personal access token**. Create a fine-grained token at GitHub → Settings → Developer settings → Fine-grained tokens, limited to this repository with **Contents: Read and write**, and paste it on the `/admin` sign-in screen. Each editor needs a GitHub account with write access to the repo. Saves commit straight to `main`, and a CI schema check (`validate-commissions`) flags any entry that would break the build.

Every post and commission has a **Published** toggle (`isPublished`). Entries stay off the site until it is on — a missing value counts as off — but edits to an already-published entry go live as soon as they are saved.

To edit locally without deploying:

```bash
pnpm dev
```

Open [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html) in Chrome or Edge, click **Work with Local Repository**, and pick this repo's folder. Saves write directly to `content/` on disk; no proxy server and no sign-in are needed.

## Deploy

Deploys to **Netlify** via the `@astrojs/netlify` adapter. Pushes to `main` trigger a production build automatically.

## Portability

Every external dependency and how to move off it: see **[DataPortability.md](./DataPortability.md)**.

## TODOs

- [ ] Add TODO.md with commission schema details
- [ ] Markdown will be deprecated in a year or so in favor of rich text
