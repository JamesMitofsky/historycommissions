<script lang="ts">
  import Fuse from "fuse.js";
  import type { ResolvedImage } from "@/lib/image-types";
  import type { ResolvedCountry } from "@/lib/country";
  import { formatPostDate } from "@/lib/format-date";
  import { fadeImage } from "@/lib/fade-image";
  import FlagTag from "./FlagTag.svelte";
  import SearchInput from "./ui/SearchInput.svelte";

  /**
   * Deliberately not `Post`. Anything an island declares as a prop is written
   * into the HTML twice — once as the markup Astro renders on the server, and
   * again as the JSON blob the island rehydrates from — so a prop that is not
   * read here is pure weight on the document.
   *
   * Handing over whole `Post` records did exactly that: every field of every
   * post travelled, `content` among them, which is the full Markdown body. It
   * put the posts index at 221kB of HTML to show around thirty headlines. This
   * shape is the four fields the template actually renders plus one for search.
   */
  export interface PostListItem {
    slug: string;
    title: string | null;
    date: string | null;
    /** The post's country tags, resolved on the server — see src/lib/country.ts. */
    countries: ResolvedCountry[];
    /**
     * Flattened body text, truncated — the corpus for the lowest-weighted search
     * key and nothing else, so it is never displayed and never needs to be
     * complete. See the note in src/pages/index.astro on where the cut falls.
     */
    searchText: string;
    image: ResolvedImage | null;
  }

  interface Props {
    items: PostListItem[];
    /** False when arriving via a view transition — the morph already covered it. */
    animate?: boolean;
  }

  let { items, animate = true }: Props = $props();

  let query = $state("");

  const fuse = $derived(
    new Fuse(items, {
      keys: [
        { name: "title", weight: 1.0 },
        // Nested path into the resolved objects, so searching still matches on
        // the country name and not on a slug or a flag path.
        { name: "countries.name", weight: 0.7 },
        { name: "searchText", weight: 0.15 },
      ],
      threshold: 0.35,
      ignoreLocation: true,
      minMatchCharLength: 3,
      includeScore: true,
    }),
  );

  const results = $derived.by(() => {
    if (!query.trim()) return items;
    return fuse
      .search(query)
      .sort((a, b) => {
        const scoreDiff = (a.score ?? 0) - (b.score ?? 0);
        if (Math.abs(scoreDiff) > 0.05) return scoreDiff;
        // Near-identical relevance falls back to newest first.
        return (b.item.date ?? "").localeCompare(a.item.date ?? "");
      })
      .map((r) => r.item);
  });
</script>

<div>
  <div
    class={[
      "mb-5",
      animate &&
        "animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both",
    ]}
    style={animate ? "animation-delay: 60ms" : undefined}
  >
    <!-- Same field as the commissions filter bar, so the two lists search the
         same way, except that this one is the only control in its row and so
         takes the full column width. -->
    <SearchInput
      placeholder="Search posts…"
      aria-label="Search posts"
      bind:value={query}
    />
  </div>

  {#if results.length === 0}
    <p class="text-sm text-muted-foreground py-8">
      No posts match &ldquo;{query}&rdquo;.
    </p>
  {:else}
    <ul class="divide-y divide-border/40">
      {#each results as { slug, title, date, countries, image }, i (slug)}
        {@const formattedDate = date ? formatPostDate(date) : null}
        <li
          class={[
            // `first:pt-2` because the row's own top padding is the other half
            // of the gap under the search field — trimming only the margin
            // above still left the first post sitting well clear of it, while
            // every later row needs the full `py-5` to separate it from the one
            // before.
            "group py-5 first:pt-2 flex flex-col sm:flex-row items-start gap-4 sm:gap-6",
            animate &&
              "animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both",
          ]}
          style={animate ? `animation-delay: ${100 + i * 60}ms` : undefined}
        >
          <div class="flex-1 min-w-0">
            <a
              href={`/posts/${slug}`}
              class="block transition-opacity duration-150 group-hover:opacity-75"
            >
              {#if formattedDate}
                <time class="text-xs text-muted-foreground tabular-nums">
                  {formattedDate}
                </time>
              {/if}
              <h2
                class="mt-0.5 text-base font-semibold leading-snug text-foreground font-serif"
                style={`view-transition-name: post-title-${slug}`}
              >
                {title ?? slug}
              </h2>
            </a>
            {#if countries.length > 0}
              <div class="mt-2 flex flex-wrap gap-1.5">
                {#each countries as country (country.name)}
                  <FlagTag {country} />
                {/each}
              </div>
            {/if}
          </div>

          {#if image}
            <a
              href={`/posts/${slug}`}
              aria-hidden="true"
              tabindex="-1"
              class="block w-full sm:w-64 shrink-0 transition-opacity duration-150 group-hover:opacity-75"
            >
              <div
                class="relative w-full h-48 sm:h-[160px] overflow-hidden bg-muted"
                style={`view-transition-name: post-image-${slug}`}
              >
                {#if image.blurDataURL}
                  <span
                    aria-hidden="true"
                    class="pointer-events-none absolute inset-0 bg-cover bg-center"
                    style={`background-image:url("${image.blurDataURL}")`}
                  ></span>
                {/if}
                <img
                  src={image.src}
                  srcset={image.srcset || undefined}
                  sizes={image.sizes}
                  alt=""
                  width={image.width}
                  height={image.height}
                  loading="lazy"
                  decoding="async"
                  data-fade-img
                  {@attach fadeImage}
                  class="absolute inset-0 h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105 motion-reduce:transition-none"
                />
              </div>
            </a>
          {/if}
        </li>
      {/each}
    </ul>
  {/if}
</div>
