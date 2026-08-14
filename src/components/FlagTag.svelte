<script lang="ts">
  import type { ResolvedCountry } from "@/lib/country";
  import Chip from "./Chip.svelte";

  interface Props {
    /**
     * Resolved on the server — see src/lib/country.ts. This component used to
     * take the raw name and work out the code and the slug itself, which meant
     * every page carrying a tag also carried the ISO register and a fuzzy
     * matcher to reach a conclusion that is fixed at build time.
     */
    country: ResolvedCountry;
    asLink?: boolean;
  }

  let { country, asLink = true }: Props = $props();
</script>

{#snippet chipContents()}
  {#if country.flag}
    <!-- Served from this origin, vendored by scripts/vendor-flags.ts. Fetching
         these from a CDN cost a DNS lookup, a connection and a TLS handshake
         against a third origin before the first one could start, and they start
         while the masthead image is still arriving. -->
    <img
      src={country.flag}
      alt=""
      width="12"
      height="12"
      loading="lazy"
      decoding="async"
      class="shrink-0 opacity-90"
    />
  {/if}
  {country.name}
{/snippet}

{#if asLink}
  <a
    href={`/countries/${country.slug}`}
    class="group inline-flex rounded-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground/50"
    aria-label={`View posts and commissions related to ${country.name}`}
  >
    <Chip interactive>{@render chipContents()}</Chip>
  </a>
{:else}
  <Chip>{@render chipContents()}</Chip>
{/if}
