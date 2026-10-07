# This is NOT the Astro you know

The site runs **Astro 7** with **Svelte 5** islands. Both are newer than most model training data — APIs, conventions, and file structure may all differ from what you remember, and confident recall is the failure mode here. Check before writing code, not after:

- **Svelte** — use the `svelte` MCP server (`list-sections`, then `get-documentation`), and run `svelte-autofixer` on every component you touch. Runes (`$state`, `$derived`, `$effect`, `$props`) only; no stores-by-default, no `export let`.
- **Astro** — the installed version's types under `node_modules/astro/` are the source of truth, then <https://docs.astro.build>. Heed deprecation notices.

Verify against the installed version rather than the latest release notes: this repo may sit ahead of or behind either.

# TinaCMS

The CMS is TinaCMS, configured in `tina/config.ts` (a React app built by the Tina CLI, type-checked separately via `tina/tsconfig.json`). Its types under `node_modules/tinacms` and `@tinacms/schema-tools` are the source of truth.

- Any key added to content must also be declared in `tina/config.ts`, or Tina deletes it the next time an editor saves that file. `pnpm validate:tina-schema` checks this.
- After changing the schema, run `pnpm tina:lock` and commit `tina/tina-lock.json`.
- `pnpm dev` (`tinacms dev -c "astro dev"`) does not work from an agent shell: Astro detects the agent and backgrounds itself, the child exits, and Tina shuts down with it. Run `pnpm exec tinacms dev` and `pnpm exec astro dev` as separate processes instead.
