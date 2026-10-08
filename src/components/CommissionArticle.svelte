<script module lang="ts">
  /**
   * The title's classes, for whoever renders the `title` snippet. The page
   * renders it rather than this component because it carries the
   * `transition:name` that morphs it from the commission card, and Astro only
   * applies that directive to elements written in an .astro file — it strips
   * the scope from props before they reach a framework component.
   */
  export const COMMISSION_TITLE_CLASS =
    "text-2xl font-semibold leading-tight text-foreground font-serif";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Commission } from "@/commissions/types";
  import type { CommissionView } from "@/commissions/view";
  import type { ResolvedCountry } from "@/lib/country";
  import StatusBadge from "./StatusBadge.svelte";
  import FlagTag from "./FlagTag.svelte";
  import SectionLabel from "./SectionLabel.svelte";
  import MetaTable from "./MetaTable.svelte";

  /**
   * Everything on a commission page below the back link — drawn by both the
   * prerendered page and the CMS preview (src/cms-preview), so an editor sees
   * the page their draft will become rather than an approximation of it.
   *
   * The two parts that differ between those renderers come in as snippets:
   * the title, for the reason given above, and the map, which the page
   * hydrates as an island on `client:visible` and the preview mounts directly.
   */
  interface Props {
    commission: Commission;
    view: CommissionView;
    /** commission.memberCountries, resolved — see src/lib/country.ts. */
    memberCountries: ResolvedCountry[];
    title: Snippet;
    map?: Snippet;
    /**
     * Never rendered. Astro's type check counts the page's named-slot elements
     * as children (see @astrojs/svelte's svelte-shims.d.ts), so a component
     * that only takes named slots still has to declare some.
     */
    children?: Snippet;
  }

  let { commission: c, view, memberCountries, title, map }: Props = $props();

  const linkClass =
    "group/link text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-300 dark:decoration-sky-600";
  const externalLinkClass =
    "text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-300 dark:decoration-sky-600";
</script>

<header class="mb-8">
  <StatusBadge status={c.status} />
  <div class="flex items-start justify-between gap-4 mt-1.5">
    <div class="min-w-0">
      {@render title()}
      {#if view.alternateName}
        <p class="text-sm text-muted-foreground mt-1 leading-snug">
          {view.alternateName}
        </p>
      {/if}
    </div>
    <div class="shrink-0 pt-1">
      {#if view.siteLink}
        <a
          href={view.siteLink.href}
          target="_blank"
          rel="noopener noreferrer"
          class={linkClass}
        >
          <!-- Label and arrow abut: the &nbsp; is the only gap meant to be
               there, and any whitespace here would add a second. -->
          {view.siteLink.label}<span
            class="inline-block transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5"
            >&nbsp;↗</span
          >
        </a>
      {/if}
    </div>
  </div>
</header>

<div class="space-y-8">
  {#if memberCountries.length > 0}
    {@render map?.()}
  {/if}

  {#if view.otherNames.length > 0}
    <div>
      <SectionLabel>Other Names</SectionLabel>
      <ul class="space-y-0.5">
        {#each view.otherNames as n, i (i)}
          <li class="text-sm text-muted-foreground leading-snug">{n}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if memberCountries.length > 0}
    <div>
      <SectionLabel>Member Countries</SectionLabel>
      <div class="flex flex-wrap gap-1.5">
        {#each memberCountries as country, i (i)}
          <FlagTag {country} />
        {/each}
      </div>
    </div>
  {/if}

  <div>
    <SectionLabel>Details</SectionLabel>
    <MetaTable rows={view.details} />
  </div>

  {#if c.chairs.length > 0}
    <div>
      <SectionLabel>Chairs</SectionLabel>
      <ul class="space-y-1.5">
        {#each c.chairs as chair, i (i)}
          <!-- No whitespace between the parts: each span spaces itself with
               ml-1.5, and a text gap on top of that would double it. -->
          <li class="text-sm text-foreground">
            {chair.name}{#if chair.affiliation}<span
                class="text-muted-foreground ml-1.5">— {chair.affiliation}</span
              >{/if}<span class="text-muted-foreground ml-1.5"
              >({chair.country})</span
            >
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if c.workingGroups.length > 0}
    <div>
      <SectionLabel>Working Groups</SectionLabel>
      <ul class="list-disc list-outside pl-4 space-y-1">
        {#each c.workingGroups as wg, i (i)}
          <li class="text-sm text-foreground">{wg}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if c.keyTopics.length > 0}
    <div>
      <SectionLabel>Key Topics</SectionLabel>
      <ul class="list-disc list-outside pl-4 space-y-1">
        {#each c.keyTopics as topic, i (i)}
          <li class="text-sm text-foreground">{topic}</li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if c.publications.length > 0}
    <div>
      <SectionLabel>Publications</SectionLabel>
      <ul class="list-disc list-outside pl-4 space-y-2.5">
        {#each c.publications as pub, i (i)}
          <li class="text-sm text-foreground">
            {#if pub.url}<a
                href={pub.url}
                target="_blank"
                rel="noopener noreferrer"
                class={externalLinkClass}>{pub.title}</a
              >{:else}{pub.title}{/if}{#if pub.year}<span
                class="text-muted-foreground ml-1.5">({pub.year})</span
              >{/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}

  {#if c.archivableDocuments.length > 0}
    <div>
      <SectionLabel>Archivable Documents</SectionLabel>
      <ul class="list-disc list-outside pl-4 space-y-2">
        {#each c.archivableDocuments as doc, i (i)}
          <li class="text-sm">
            <a
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              class={externalLinkClass}
            >
              {doc.title}
            </a>
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
