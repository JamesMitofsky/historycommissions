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

## Editing content (TinaCMS)

Editors log in at `/admin` through **TinaCloud**. Invite them from the TinaCloud dashboard (app.tina.io); they do not need a GitHub account. Saves commit straight to `main`, and CI (`.github/workflows/validate.yml`) flags any entry that would break the build.

Every post and commission has a **Published** toggle (`isPublished`). Entries stay off the site until it is on — a missing value counts as off — but edits to an already-published entry go live as soon as they are saved.

The editor is defined in `tina/config.ts`. Tina rewrites a whole file from that schema when an editor saves, so **a key that exists in content but not in the schema is deleted on save**. `pnpm validate:tina-schema` catches that in CI. After changing the schema, run `pnpm tina:lock` and commit `tina/tina-lock.json`, because TinaCloud reads the schema from the lock file.

To edit locally without deploying:

```bash
pnpm dev
```

Open [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html). In local mode there is no login, and saves write directly to `content/` on disk.

## Deploy

Deploys to **Netlify** via the `@astrojs/netlify` adapter. Pushes to `main` trigger a production build automatically.

`pnpm build` runs `tinacms build` before `astro build`, so Netlify needs the TinaCloud project's `TINA_CLIENT_ID` and `TINA_TOKEN` (a read-only content token) set as environment variables. CI builds without them using `pnpm build:local`.

## Portability

Every external dependency and how to move off it: see **[DataPortability.md](./DataPortability.md)**.

## TODOs

- [ ] Add TODO.md with commission schema details
- [ ] Markdown will be deprecated in a year or so in favor of rich text
