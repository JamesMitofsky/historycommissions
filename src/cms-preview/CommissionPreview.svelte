<script lang="ts">
  import type { Commission } from "@/commissions/types";
  import { describeCommission } from "@/commissions/view";
  import { resolveCountries } from "@/lib/country";
  import { PAGE_COLUMN_CLASS } from "@/lib/page-classes";
  import CommissionArticle, {
    COMMISSION_TITLE_CLASS,
  } from "@/components/CommissionArticle.svelte";
  import CommissionMap from "@/components/CommissionMap.svelte";

  // The draft counterpart of src/pages/commissions/[slug].astro: the same
  // article, with the title and map the page slots in drawn here instead.
  let { commission }: { commission: Commission } = $props();

  const view = $derived(describeCommission(commission));
  const memberCountries = $derived(resolveCountries(commission.memberCountries));
</script>

<main class={PAGE_COLUMN_CLASS}>
  <CommissionArticle {commission} {view} {memberCountries}>
    {#snippet title()}
      <h1 class={COMMISSION_TITLE_CLASS}>{view.primaryName}</h1>
    {/snippet}
    {#snippet map()}
      <CommissionMap {memberCountries} aspectRatio={6 / 19} />
    {/snippet}
  </CommissionArticle>
</main>
