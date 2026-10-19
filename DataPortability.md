# Data Portability

> Drafted by AI, human validated

For a developer coming to this project cold: what external services it depends on, how much each one locks you in, and what it takes to move off each one safely.

The guiding principle: **the data is the repo.** There is no external database, no object-storage bucket, and no email vendor. Every commission, post, image, and setting is a plain file committed to Git. That single fact makes this project unusually portable — most of "getting off a vendor" is re-pointing a build command, because the content already lives with you.

## Stack at a glance

| Concern | Vendor | What speaks to it | Lock-in |
|---|---|---|---|
| Hosting + CD | **Vercel** | `@astrojs/vercel` adapter | Low |
| Content editor (CMS) | **Sveltia CMS** (self-hosted lib) | `public/admin/config.yml` | None (lib) |
| CMS auth + commits | **GitHub** (personal access tokens) | `github` backend | Low |
| Content storage | **Git** (this repo) | files in `content/` + `public/` | None |

The content is not behind any API — it is Markdown and JSON in the tree. Swapping a host is mostly a config change; the data comes for free because it never left.

---

## 1. Vercel — Hosting and CD

**What it does.** Builds the site on every push (CD is Git-driven): `main` goes to production, every other branch to a preview URL. It serves the result.

**Where the coupling lives.**
- `astro.config.mjs` → the `@astrojs/vercel` adapter. At the end of the build it writes the site in Vercel's Build Output API format under `.vercel/output/`: the static files plus a `config.json` holding the redirects and cache headers. The adapter lives in this repo and is maintained by the Astro team, so the Vercel-shaped output is produced here rather than by Vercel guessing at it.
- `astro.config.mjs` → `site` is read from `VERCEL_PROJECT_PRODUCTION_URL`, so canonical URLs, OG cards and RSS links point at the production domain on every deploy. `SITE_URL` overrides it on any host.
- `vercel.json` → framework and build command. Vercel would auto-detect both; they are pinned so the build does not depend on detection or on dashboard settings.
- `package.json` → `engines.node` and `packageManager` pin the toolchain. Vercel honours the pnpm pin only when the project has `ENABLE_EXPERIMENTAL_COREPACK=1` set; that variable is the one piece of build config that lives in the dashboard.
- No secrets are required to build or serve the site — the content is static files in the repo, and CMS sign-in (§3) happens in the editor's browser, not on the host.

**Getting off safely.**
1. Every page is prerendered, so `dist/` is a plain static site. Point any static host — Cloudflare Pages, Netlify, S3, nginx — at the repo with `pnpm build`.
2. Swap the `adapter:` in `astro.config.mjs` for the new host's, or delete it (and the dependency). Nothing else in the codebase imports it. Without an adapter, the one entry in `redirects` becomes a meta-refresh page instead of an HTTP redirect, and `site` needs `SITE_URL` set, since `VERCEL_PROJECT_PRODUCTION_URL` will not exist.
3. Delete `vercel.json`.
4. Because there are no runtime env vars for the app itself, there is no "silently-broken-boot" risk here — unlike a DB-backed app. Nothing about the CMS follows the host either: `/admin` is just static files in `dist/`.

**Lock-in verdict:** Low. One adapter, removable in one line, and the content is already portable.

---

## 2. Sveltia CMS — Content editor

**What it does.** Provides the `/admin` editing UI. It is a **self-hosted JavaScript library** — an open-source (MIT) successor to Decap CMS that reads Decap's config format — so there is no CMS SaaS to leave. Editor saves commit straight to `main`; an entry stays off the site until its `isPublished` toggle is on, and the `validate-commissions` CI check flags any that break the schema.

**Where the coupling lives.**
- `public/admin/config.yml` defines the collections, and `public/admin/*-widget.js` holds the custom country and language pickers. `src/cms-preview/` registers preview templates that render drafts with the site's own components. Fully in-repo.
- The library itself is pinned in `package.json` and copied into `public/admin/` by `scripts/vendor-cms.ts`, together with the React chunk the custom widgets need and Immutable.js (redirected from unpkg by an import map in `src/pages/admin/index.astro`). The editor does not depend on a CDN to load or to run its custom widgets.
- What it still fetches from public CDNs at runtime is cosmetic or optional: its UI fonts and icon font (jsDelivr), syntax-highlighting grammars, an update check, and a GitHub status check. If those are unreachable the editor still works; icons fall back to their text names.
- Sveltia keeps keys it does not have fields for (e.g. `nav` in `content/settings/general.json`) when it saves, and it writes the same Markdown/JSON files Decap did.

**Getting off safely.** Sveltia only reads and writes files in `content/` and `src/assets/images/`. Because the config is Decap's format, switching back to Decap — or dropping the CMS and editing files via Git — is a change to `src/pages/admin/index.astro` (and dropping or porting `src/cms-preview/`, which uses one Sveltia-only call, `renderRichText`), not to the content. Nothing about the site *rendering* depends on the CMS; it is purely an authoring convenience.

**Lock-in verdict:** None (it is a library, and the files it writes are yours).

---

## 3. GitHub — CMS auth and commits

**What it does.** The CMS uses the `github` backend: the editor's browser talks to the GitHub API directly, authenticated with that editor's own personal access token, and commits as them. There is no auth broker, OAuth app or server in between.

Configured in `public/admin/config.yml`:

```yaml
backend:
  name: github
  repo: JamesMitofsky/historycommissions
  branch: main
  auth_methods: [token]
```

OAuth sign-in is deliberately off: without a self-hosted OAuth endpoint (`base_url`), Sveltia would route it through Netlify's OAuth service, adding a vendor the site otherwise does not use. If token sign-in becomes a burden, the [Sveltia CMS Authenticator](https://github.com/sveltia/sveltia-cms-auth) is a small open-source OAuth handler you can deploy anywhere and point `base_url` at.

**Getting off safely.** GitHub is already where the repo lives, so this adds no new vendor. Moving the repo elsewhere means changing `backend.name` to `gitlab` or `gitea` (both supported) and issuing editors tokens there. Local editing ("Work with Local Repository" on `localhost`) needs no backend at all.

**Lock-in verdict:** Low. The only dependency is the Git host you already use.

---

## 4. Git — Content storage

**What it does.** Holds everything the site displays:
- `content/commissions/*.json` — one file per commission.
- `content/posts/*.md` — news posts.
- `content/settings/` — site-wide text.
- `public/images/` — all media (committed to the repo, not an object store).

**Getting off safely.** There is nothing to get off. The data is a Git repository — clone it and it is fully in your hands. Backups are `git clone` / any Git mirror. Migrating hosts or CMS backends never touches the data, because the data is already the source of truth.

**Lock-in verdict:** None.

---

## Migration checklist (condensed)

Ordered so the site never goes dark:

1. **Back up first.** The repo *is* the backup — mirror it (`git clone --mirror`) somewhere off Vercel.
2. **Host:** point the new host at the repo, build with `pnpm build`, serve `dist/`, swap or drop the `adapter:` line in `astro.config.mjs`, and set `SITE_URL`.
3. **CMS auth:** nothing to move for a host change — editors sign in to GitHub from their browser. Only a move *off GitHub* touches the CMS: change `backend` in `public/admin/config.yml` and issue editors tokens on the new Git host.
4. **DNS:** point the domain's records at the new host.
5. **Verify:** site renders (it is static content, so this is low-risk), `/admin` sign-in works, editor saves land on `main`, `validate-commissions` CI still runs on them.

**The one rule that prevents most portability pain:** the content lives in Git, not in a vendor. Keep a current mirror of the repo and no single service can strand this project — the only thing you ever re-choose is *who hosts the pages* and *which Git host editors sign in to*, never *where the data is*.
