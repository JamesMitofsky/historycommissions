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

Editors sign in with a GitHub personal access token (see [Getting a CMS sign-in token](#getting-a-cms-sign-in-token)). Saves commit straight to `main`, and a CI schema check (`validate-commissions`) flags any entry that would break the build.

Every post and commission has a **Published** toggle (`isPublished`). Entries stay off the site until it is on — a missing value counts as off — but edits to an already-published entry go live as soon as they are saved.

To edit locally without deploying:

```bash
pnpm dev
```

Open [http://localhost:4321/admin/index.html](http://localhost:4321/admin/index.html) in Chrome or Edge, click **Work with Local Repository**, and pick this repo's folder. Saves write directly to `content/` on disk; no proxy server and no sign-in are needed.

## Getting a CMS sign-in token

The `/admin` sign-in screen asks for a **GitHub personal access token**. There is no password or OAuth button: the token is the login, and every save is committed to this repo as the token's owner. You need a GitHub account with write access to `JamesMitofsky/historycommissions`.

Which kind of token depends on whether you own the repo:

- **Repo owner** — create a [fine-grained token](https://github.com/settings/personal-access-tokens/new) (GitHub → profile picture → Settings → Developer settings → Personal access tokens → Fine-grained tokens → Generate new token):
  - **Resource owner:** `JamesMitofsky`
  - **Repository access:** Only select repositories → `historycommissions`
  - **Permissions:** Repository permissions → **Contents: Read and write** (Metadata: Read-only is added automatically)
- **Collaborator** (added under the repo's Settings → Collaborators) — fine-grained tokens can't write to another user's repository, so create a [classic token](https://github.com/settings/tokens/new?scopes=public_repo&description=History%20Commissions%20CMS) instead (Developer settings → Personal access tokens → Tokens (classic) → Generate new token (classic)) with only the **`public_repo`** scope. That link pre-ticks it. Note that a classic token can write to *every* public repo you have access to, so treat it like a password.

Then:

1. Pick an expiration. When it lapses, sign-in fails and you generate a new token the same way.
2. Click **Generate token** and copy it right away. GitHub shows it only once.
3. Open `/admin` on the live site, paste the token, and sign in. Sveltia keeps it in that browser, so you only paste it again on a new browser or after it expires.

To cut off access, delete the token on the same GitHub page.

## Deploy

Deploys to **Netlify** via the `@astrojs/netlify` adapter. Pushes to `main` trigger a production build automatically.

## Portability

Every external dependency and how to move off it: see **[DataPortability.md](./DataPortability.md)**.

## TODOs

- [ ] Add TODO.md with commission schema details
- [ ] Markdown will be deprecated in a year or so in favor of rich text
