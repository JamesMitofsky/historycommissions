<script lang="ts">
  import { resolveCountries } from "@/lib/country";
  import { PAGE_COLUMN_CLASS } from "@/lib/page-classes";
  import PostArticle, {
    POST_IMAGE_FRAME_CLASS,
    POST_TITLE_CLASS,
  } from "@/components/PostArticle.svelte";
  import CommissionMap from "@/components/CommissionMap.svelte";
  import type { PostDraft } from "./draft";

  // The draft counterpart of src/pages/posts/[slug].astro: the same article,
  // with the parts the page slots in drawn here instead.
  interface Props {
    post: PostDraft;
    /**
     * The featured image as the CMS holds it — a blob URL, which also covers an
     * upload that has not been committed yet. The page serves the optimised
     * astro:assets build of the same file, which does not exist until a build.
     */
    imageUrl: string | null;
    /** Draws Markdown into an element and returns a cleanup; CMS.renderRichText. */
    renderBody: (target: HTMLElement, markdown: string) => () => void;
  }

  let { post, imageUrl, renderBody }: Props = $props();

  const tags = $derived(resolveCountries(post.tags));

  /**
   * An attachment rather than {@html}: the CMS's renderer is what the editor's
   * own preview uses, so it resolves images in the body to the files the CMS
   * holds and sanitises what it inserts. Re-running on every change to the
   * body is the renderer's own cost and matches what the default preview does.
   */
  function body(markdown: string) {
    return (node: HTMLElement) => renderBody(node, markdown);
  }
</script>

<main class={PAGE_COLUMN_CLASS}>
  <PostArticle
    date={post.date}
    author={post.author}
    {tags}
    imageAttribution={post.imageAttribution}
    imageAttributionUrl={post.imageAttributionUrl}
    hasImage={imageUrl !== null}
  >
    {#snippet title()}
      {#if post.title}
        <h1 class={POST_TITLE_CLASS}>{post.title}</h1>
      {/if}
    {/snippet}
    {#snippet map()}
      <CommissionMap memberCountries={tags} />
    {/snippet}
    {#snippet image()}
      <div class={POST_IMAGE_FRAME_CLASS}>
        <img
          src={imageUrl}
          alt={post.title ?? ""}
          class="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    {/snippet}
    <div {@attach body(post.body)}></div>
  </PostArticle>
</main>
