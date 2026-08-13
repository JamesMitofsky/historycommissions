# Data Portability

> Drafted by AI, human validated

For a developer coming to this project cold: what external services it depends on, how much each one locks you in, and what it takes to move off each one safely.

The guiding principle: **the data is the repo.** There is no external database, no object-storage bucket, and no email vendor. Every commission, post, image, and setting is a plain file committed to Git. That single fact makes this project unusually portable — most of "getting off a vendor" is re-pointing a build command, because the content already lives with you.

## Stack at a glance

| Concern | Vendor | What speaks to it | Lock-in |
|---|---|---|---|
| Hosting + CD | **Netlify** | `@astrojs/netlify` adapter | Low |
| Content editor (CMS) | **Decap CMS** (self-hosted lib) | `public/admin/config.yml` | None (lib) |
| CMS auth + commits | **Netlify Identity + Git Gateway** | `git-gateway` backend | Medium |
| Content storage | **Git** (this repo) | files in `content/` + `public/` | None |

The content is not behind any API — it is Markdown and JSON in the tree. Swapping a host is mostly a config change; the data comes for free because it never left.

---

## 1. Netlify — Hosting and CD

**What it does.** Builds the site on every push to `main` (CD is Git-driven) and serves it.

**Where the coupling lives.**
- `astro.config.mjs` → the `@astrojs/netlify` adapter. It writes Netlify's own config — redirects, headers, and a function bundle under `.netlify/v1/` — at the end of the build. The adapter lives in this repo and is maintained by the Astro team, so the Netlify-shaped output is produced here rather than by a plugin running on Netlify's side.
- `netlify.toml` → build command and `publish = "dist"`. Netlify would auto-detect both; they are pinned so the build does not depend on detection.
- No secrets are required to build or serve the site itself — the content is static files in the repo. (The CMS auth in §3 is the exception.)

**Getting off safely.**
1. Every page is prerendered, so `dist/` is a plain static site. Point any static host — Cloudflare Pages, Vercel, S3, nginx — at the repo with `pnpm build`.
2. Delete the `adapter:` line from `astro.config.mjs` (and the dependency, if you like). Nothing else in the codebase imports it.
3. Because there are no runtime env vars for the app itself, there is no "silently-broken-boot" risk here — unlike a DB-backed app. The only thing that follows the host is the CMS auth (§3).

**Lock-in verdict:** Low. One adapter, removable in one line, and the content is already portable.

---

## 2. Decap CMS — Content editor

**What it does.** Provides the `/admin` editing UI. It is a **self-hosted JavaScript library** served from `public/admin/` — there is no CMS SaaS to leave. Editor saves become pull requests (`publish_mode: editorial_workflow`), gated by the `validate-commissions` CI check.

**Where the coupling lives.**
- `public/admin/config.yml` defines the collections. Fully in-repo.
- The only external piece is the **backend** it authenticates against — see §3.

**Getting off safely.** Decap only reads/writes files in `content/` and `public/`. If you drop the CMS entirely, editors edit those files directly (via Git or the local backend — see the README). Nothing about the site *rendering* depends on Decap; it is purely an authoring convenience.

**Lock-in verdict:** None (it is a library, and the files it writes are yours).

---

## 3. Netlify Identity + Git Gateway — CMS auth and commits

**What it does.** This is the real Netlify coupling. Decap's production backend is `git-gateway`:
- **Netlify Identity** authenticates editors (email/password, no GitHub account needed).
- **Git Gateway** lets those authenticated editors commit to the repo *without* direct Git credentials.

Configured in `public/admin/config.yml`:

```yaml
backend:
  name: git-gateway
  branch: main
```

**Getting off safely.** This is the part that does not move for free, because it is a Netlify-hosted auth + commit broker. Options when leaving Netlify:
1. **Switch Decap to a direct Git backend.** Change `backend.name` to `github` (or `gitlab`/`gitea`) in `config.yml`. Editors then log in with a Git provider account and Decap commits via that provider's API + OAuth. No Netlify needed — at the cost of every editor having a provider account.
2. **Drop hosted editing.** Use only the local backend (`local_backend: true`, already enabled) or plain Git for content changes. Zero auth infrastructure.

**Lock-in verdict:** Medium. Netlify Identity/Git Gateway is convenient but Netlify-specific; escaping means re-choosing an auth backend for Decap (a `config.yml` change plus re-onboarding editors), not a rewrite.

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

1. **Back up first.** The repo *is* the backup — mirror it (`git clone --mirror`) somewhere off Netlify.
2. **Host:** point the new host at the repo, build with `pnpm build`, serve `dist/`, and drop the `adapter:` line from `astro.config.mjs`.
3. **CMS auth:** switch Decap's `backend` in `public/admin/config.yml` off `git-gateway` (to `github`/`gitlab`/etc.) or fall back to the local backend, and re-onboard editors.
4. **DNS:** point the domain's records at the new host.
5. **Verify:** site renders (it is static content, so this is low-risk), `/admin` login works against the new backend, editorial-workflow PRs still open, `validate-commissions` CI still guards them.

**The one rule that prevents most portability pain:** the content lives in Git, not in a vendor. Keep a current mirror of the repo and no single service can strand this project — the only thing you ever re-choose is *who hosts the pages* and *who brokers editor logins*, never *where the data is*.
