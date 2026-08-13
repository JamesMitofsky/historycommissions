<script lang="ts">
  import { countryCodeForTag } from "@/lib/country-codes";
  import { countrySlug } from "@/lib/country-slug";
  import Chip from "./Chip.svelte";

  interface Props {
    tag: string;
    asLink?: boolean;
  }

  let { tag, asLink = true }: Props = $props();

  const code = $derived(countryCodeForTag(tag));

  // The flag artwork is fetched straight from the CDN by country code — the
  // whole of the dependency this replaced was a URL built from that code.
  const flagSrc = $derived(
    code ? `https://react-circle-flags.pages.dev/${code}.svg` : null,
  );
</script>

{#snippet chipContents()}
  {#if flagSrc}
    <img
      src={flagSrc}
      alt=""
      width="12"
      height="12"
      loading="lazy"
      decoding="async"
      class="shrink-0 opacity-90"
    />
  {/if}
  {tag}
{/snippet}

{#if asLink}
  <a
    href={`/countries/${countrySlug(tag)}`}
    class="group inline-flex rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50"
    aria-label={`View posts and commissions related to ${tag}`}
  >
    <Chip interactive>{@render chipContents()}</Chip>
  </a>
{:else}
  <Chip>{@render chipContents()}</Chip>
{/if}
