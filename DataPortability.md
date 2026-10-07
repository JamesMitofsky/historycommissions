# Data Portability

> Drafted by AI, human validated

For a developer coming to this project cold: what external services it depends on, how much each one locks you in, and what it takes to move off each one safely.

The guiding principle: **the data is the repo.** There is no external database, no object-storage bucket, and no email vendor. Every commission, post, image, and setting is a plain file committed to Git. That single fact makes this project unusually portable — most of "getting off a vendor" is re-pointing a build command, because the content already lives with you.

## Stack at a glance

| Concern | Vendor | What speaks to it | Lock-in |
|---|---|---|---|
| Hosting + CD | **Netlify** | `@astrojs/netlify` adapter | Low |
| Content editor (CMS) | **TinaCMS** (open-source lib) | `tina/config.ts` | Low |
| CMS auth + commits | **TinaCloud** | `TINA_CLIENT_ID` / `TINA_TOKEN` | Medium |
| Content storage | **Git** (this repo) | files in `content/` + `public/` | None |

The content is not behind any API — it is Markdown and JSON in the tree. Swapping a host is mostly a config change; the data comes for free because it never left.

---

## 1. Netlify — Hosting and CD

**What it does.** Builds the site on every push to `main` (CD is Git-driven) and serves it.

**Where the coupling lives.**
- `astro.config.mjs` → the `@astrojs/netlify` adapter. It writes Netlify's own config — redirects, headers, and a function bundle under `.netlify/v1/` — at the end of the build. The adapter lives in this repo and is maintained by the Astro team, so the Netlify-shaped output is produced here rather than by a plugin running on Netlify's side.
- `netlify.toml` → build command and `publish = "dist"`. Netlify would auto-detect both; they are pinned so the build does not depend on detection.
- No secrets are required to serve the site — the content is static files in the repo. The production build needs the TinaCloud credentials only to compile the editor (§3); `pnpm build:local` builds everything without them.

**Getting off safely.**
1. Every page is prerendered, so `dist/` is a plain static site. Point any static host — Cloudflare Pages, Vercel, S3, nginx — at the repo with `pnpm build`.
2. Delete the `adapter:` line from `astro.config.mjs` (and the dependency, if you like). Nothing else in the codebase imports it.
3. Because there are no runtime env vars for the app itself, there is no "silently-broken-boot" risk here — unlike a DB-backed app. The only thing that follows the host is the pair of TinaCloud build variables (§3), which the new host needs set.

**Lock-in verdict:** Low. One adapter, removable in one line, and the content is already portable.

---

## 2. TinaCMS — Content editor

**What it does.** Provides the `/admin` editing UI. It is an **open-source library** (`tinacms`, `@tinacms/cli`) that `tinacms build` compiles into a single-page app under `public/admin/` at build time. Editor saves commit straight to `main`; an entry stays off the site until its `isPublished` toggle is on, and CI flags any save that breaks the schema.

**Where the coupling lives.**
- `tina/config.ts` defines the collections, and `tina/fields.tsx` holds the custom country, language and date pickers. Both are fully in-repo.
- `tina/tina-lock.json` is the compiled schema TinaCloud indexes. It is generated (`pnpm tina:lock`) and committed.
- Tina writes the same files Decap did — JSON for commissions and settings, Markdown with YAML frontmatter for posts — so nothing in `src/` knows which CMS produced them. Two things are Tina-specific: it reorders JSON keys into schema order on save, and it re-serialises a post's Markdown body (escaping and link style may change; the rendered HTML does not).
- The only external piece is the **backend** it authenticates against — see §3.

**Getting off safely.** Tina only reads and writes files in `content/` and `src/assets/images/`. If you drop the CMS, delete `tina/`, the Tina dependencies, and the `tinacms` parts of the `dev`/`build` scripts; the site renders exactly as before. Nothing about the site *rendering* depends on Tina.

**Lock-in verdict:** Low. The library is open source and the files it writes are plain Markdown and JSON.

---

## 3. TinaCloud — CMS auth and commits

**What it does.** This is the hosted half of the CMS:
- **Authentication.** Editors are invited from the TinaCloud dashboard and log in with a TinaCloud account — no GitHub account needed.
- **Commits.** TinaCloud's GitHub app commits editor saves to the repo on their behalf, and serves the editor its content API.

Configured through two environment variables on the build host, read in `tina/config.ts`:

```ts
clientId: process.env.TINA_CLIENT_ID,
token: process.env.TINA_TOKEN, // read-only content token
```

**Getting off safely.** This is the part that does not move for free, because it is a hosted auth + commit broker. The free tier also caps the number of editor seats, which is worth checking before inviting a large group. Options when leaving TinaCloud:
1. **Self-host the Tina backend.** Tina supports a self-hosted content API (`contentApiUrlOverride` plus an `authProvider` in `tina/config.ts`) backed by your own database adapter and auth provider. It works, but it means running a server, which this otherwise fully static site does not have today.
2. **Switch to another Git-based CMS.** Because the content is plain files, Decap/Sveltia or similar can be pointed at the same `content/` paths. The custom fields would need porting again.
3. **Drop hosted editing.** Use local mode (`pnpm dev`, then `/admin`) or plain Git for content changes. Zero auth infrastructure.

**Lock-in verdict:** Medium. TinaCloud is convenient but a separate vendor; escaping means re-choosing an auth/commit backend and re-onboarding editors, not a rewrite or a data migration.

---

## 4. Git — Content storage

**What it does.** Holds everything the site displays:
- `content/commissions/*.json` — one file per commission.
- `content/posts/*.md` — news posts.
- `content/settings/` — site-wide text.
- `src/assets/images/` — all media (committed to the repo, not an object store).

**Getting off safely.** There is nothing to get off. The data is a Git repository — clone it and it is fully in your hands. Backups are `git clone` / any Git mirror. Migrating hosts or CMS backends never touches the data, because the data is already the source of truth.

**Lock-in verdict:** None.

---

## Migration checklist (condensed)

Ordered so the site never goes dark:

1. **Back up first.** The repo *is* the backup — mirror it (`git clone --mirror`) somewhere off Netlify.
2. **Host:** point the new host at the repo, build with `pnpm build`, serve `dist/`, and drop the `adapter:` line from `astro.config.mjs`.
3. **CMS auth:** copy `TINA_CLIENT_ID` and `TINA_TOKEN` to the new host, and update the site URL in the TinaCloud project if it changed. Editors and their logins live in TinaCloud, so they do not need re-onboarding.
4. **DNS:** point the domain's records at the new host.
5. **Verify:** site renders (it is static content, so this is low-risk), `/admin` login works against the new backend, editor saves land on `main`, `validate-commissions` CI still runs on them.

**The one rule that prevents most portability pain:** the content lives in Git, not in a vendor. Keep a current mirror of the repo and no single service can strand this project — the only thing you ever re-choose is *who hosts the pages* and *who brokers editor logins*, never *where the data is*.
