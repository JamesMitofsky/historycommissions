<script module lang="ts">
  /**
   * Classes for the two elements the page renders into this component's
   * snippets rather than letting it render them. Both carry a
   * `transition:name` (the title and image morph from the post card), and
   * Astro only applies that directive to elements written in an .astro file —
   * it strips the scope from props before they reach a framework component.
   * The CMS preview reads the same classes, so neither renderer spells them out.
   */
  export const POST_TITLE_CLASS =
    "text-2xl font-semibold leading-tight font-serif text-foreground mb-4";
  export const POST_IMAGE_FRAME_CLASS =
    "relative rounded-xs overflow-hidden bg-border h-[200px] sm:h-full";
</script>

<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ResolvedCountry } from "@/lib/country";
  import { formatPostDate } from "@/lib/format-date";
  import { PROSE_CLASS } from "@/lib/page-classes";
  import FlagTag from "./FlagTag.svelte";

  /**
   * A post page below the back link — drawn by both the prerendered page and
   * the CMS preview (src/cms-preview), so an editor sees the page their draft
   * will become rather than an approximation of it.
   *
   * What differs between the two renderers comes in as snippets: the title and
   * image frame for the reason above; the map, which the page hydrates as an
   * island and the preview mounts directly; the image itself, which the page
   * optimises through astro:assets and the preview reads from the CMS's asset
   * store; and the body, which is Astro's rendered Markdown on the page and the
   * CMS's rich-text renderer in the preview. The body lands inside the prose
   * wrapper drawn here, so both get the same typography.
   */
  interface Props {
    /** ISO timestamp. */
    date: string | null;
    author: string | null;
    /** The post's tags, resolved — see src/lib/country.ts. */
    tags: ResolvedCountry[];
    imageAttribution: string | null;
    imageAttributionUrl: string | null;
    /**
     * Whether `image` has anything to draw. The snippet's presence cannot
     * answer that: Astro hands a framework component a snippet for every slot
     * written in the page, including one behind a condition that came out false.
     */
    hasImage: boolean;
    title?: Snippet;
    map?: Snippet;
    image?: Snippet;
    children: Snippet;
  }

  let {
    date,
    author,
    tags,
    imageAttribution,
    imageAttributionUrl,
    hasImage,
    title,
    map,
    image,
    children,
  }: Props = $props();

  const showImage = $derived(hasImage && !!image);
  const hasMap = $derived(tags.length > 0 && !!map);
</script>

<header class="mb-10">
  {@render title?.()}
  <div class="flex items-center justify-between text-sm text-muted-foreground">
    {#if date}
      <time datetime={date}>{formatPostDate(date, "long")}</time>
    {/if}
    {#if author}
      <span>{author}</span>
    {/if}
  </div>
  {#if tags.length > 0}
    <div class="mt-3 flex flex-wrap gap-1.5">
      {#each tags as tag, i (i)}
        <FlagTag country={tag} />
      {/each}
    </div>
  {/if}

  {#if showImage || hasMap}
    <div class="mt-6">
      <div
        class="flex flex-col sm:flex-row gap-3 sm:items-stretch sm:min-h-[180px]"
      >
        {#if hasMap}
          <div
            class={showImage ? "order-2 sm:order-none sm:flex-[1] min-w-0" : "w-full"}
          >
            {@render map?.()}
          </div>
        {/if}
        {#if showImage}
          <div
            class={hasMap ? "order-1 sm:order-none sm:flex-[2] min-w-0" : "w-full"}
          >
            {@render image?.()}
          </div>
        {/if}
      </div>
      {#if imageAttribution}
        <p class="mt-1.5 text-xs text-muted-foreground text-right">
          {#if imageAttributionUrl}
            <a
              href={imageAttributionUrl}
              target="_blank"
              rel="noopener noreferrer"
              class="hover:underline"
            >
              {imageAttribution}
            </a>
          {:else}
            {imageAttribution}
          {/if}
          (CC BY-SA 3.0)
        </p>
      {/if}
    </div>
  {/if}

  <div class="mt-8 border-b border-border"></div>
</header>

<div class={PROSE_CLASS}>
  {@render children()}
</div>
