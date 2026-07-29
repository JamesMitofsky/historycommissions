<script lang="ts">
  import Fuse from "fuse.js";
  import Info from "@lucide/svelte/icons/info";
  import { LinkPreview } from "bits-ui";
  import type { Post } from "@/blog/schema";
  import type { ResolvedImage } from "@/lib/image-types";
  import { formatPostDate } from "@/lib/format-date";
  import { fadeImage } from "@/lib/fade-image";
  import FlagTag from "./FlagTag.svelte";
  import Input from "./ui/Input.svelte";
  import HoverCardContent from "./ui/HoverCardContent.svelte";

  export interface PostListItem {
    post: Post;
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
        { name: "post.title", weight: 1.0 },
        { name: "post.tags", weight: 0.7 },
        { name: "post.content", weight: 0.15 },
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
        return (b.item.post.date ?? "").localeCompare(a.item.post.date ?? "");
      })
      .map((r) => r.item);
  });
</script>

<div>
  <div
    class="flex items-center gap-1.5 mb-6 {animate
      ? 'animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both'
      : ''}"
    style={animate ? "animation-delay: 60ms" : undefined}
  >
    <!-- Same input as the commissions filter bar, so the two lists search the
         same way. -->
    <Input
      type="text"
      placeholder="Search posts…"
      bind:value={query}
      class="h-8 w-56 sm:w-72 text-sm rounded-xs"
    />

    <LinkPreview.Root openDelay={100} closeDelay={100}>
      <LinkPreview.Trigger
        type="button"
        aria-label="About this search"
        class="inline-flex items-center justify-center rounded-xs text-muted-foreground hover:text-foreground size-3 self-start transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50"
      >
        <Info class="size-3" aria-hidden="true" />
      </LinkPreview.Trigger>
      <HoverCardContent
        side="right"
        align="start"
        sideOffset={4}
        class="w-72 text-sm leading-relaxed"
      >
        <p class="font-semibold text-foreground mb-1">Fuzzy search</p>
        <p class="text-muted-foreground">
          Matches on post titles, country tags, and content — typos and partial
          words are forgiven. Title matches rank above tag matches, which rank
          above body matches.
        </p>
      </HoverCardContent>
    </LinkPreview.Root>
  </div>

  {#if results.length === 0}
    <p class="text-sm text-muted-foreground py-8">
      No posts match &ldquo;{query}&rdquo;.
    </p>
  {:else}
    <ul class="divide-y divide-border/40">
      {#each results as { post, image }, i (post.slug)}
        {@const formattedDate = post.date ? formatPostDate(post.date) : null}
        <li
          class="group py-5 flex flex-col sm:flex-row items-start gap-4 sm:gap-6 {animate
            ? 'animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both'
            : ''}"
          style={animate ? `animation-delay: ${100 + i * 60}ms` : undefined}
        >
          <div class="flex-1 min-w-0">
            <a
              href={`/posts/${post.slug}`}
              class="block transition-opacity duration-150 group-hover:opacity-75"
            >
              {#if formattedDate}
                <time class="text-xs text-muted-foreground tabular-nums">
                  {formattedDate}
                </time>
              {/if}
              <h2
                class="mt-0.5 text-base font-semibold leading-snug text-foreground font-playfair"
                style={`view-transition-name: post-title-${post.slug}`}
              >
                {post.title ?? post.slug}
              </h2>
            </a>
            {#if post.tags.length > 0}
              <div class="mt-2 flex flex-wrap gap-1.5">
                {#each post.tags as tag (tag)}
                  <FlagTag {tag} />
                {/each}
              </div>
            {/if}
          </div>

          {#if image}
            <a
              href={`/posts/${post.slug}`}
              aria-hidden="true"
              tabindex="-1"
              class="block w-full sm:w-64 shrink-0 transition-opacity duration-150 group-hover:opacity-75"
            >
              <div
                class="relative w-full h-48 sm:h-[160px] overflow-hidden bg-muted"
                style={`view-transition-name: post-image-${post.slug}`}
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
                  use:fadeImage
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
