<script lang="ts">
  import { Popover } from "bits-ui";
  import { SvelteSet } from "svelte/reactivity";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ArrowUpDown from "@lucide/svelte/icons/arrow-up-down";
  import type { Commission, CommissionStatus } from "@/commissions/types";
  import type { ResolvedCountry } from "@/lib/country";
  import { STATUS_LABELS, STATUS_ORDER } from "@/commissions/status";
  import { cn } from "@/lib/utils";
  import FlagTag from "./FlagTag.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import CommissionMap from "./CommissionMap.svelte";
  import FilterPopover from "./FilterPopover.svelte";
  import SearchInput from "./ui/SearchInput.svelte";
  import { buttonVariants } from "./ui/button-variants";
  import PopoverContent from "./ui/PopoverContent.svelte";

  interface Props {
    commissions: Commission[];
    /**
     * Country name as written in content -> its flag, slug and map id, resolved
     * on the server. See src/lib/country.ts.
     *
     * A lookup rather than resolved values on each commission, because the same
     * countries recur across the list and an island's props are serialized into
     * the page: keying by name sends each country once instead of once per card
     * it appears on. `memberCountries` stays a list of names, which is what the
     * filters compare against.
     */
    countries: Record<string, ResolvedCountry>;
    /** False when arriving via a view transition — the morph already covered it. */
    animate?: boolean;
  }

  let { commissions, countries, animate = true }: Props = $props();

  type SortMode = "recency-asc" | "recency-desc" | "activity";

  const SORT_LABELS: Record<SortMode, string> = {
    "recency-asc": "Oldest first",
    "recency-desc": "Newest first",
    activity: "By status",
  };

  const SORT_MODES: SortMode[] = ["activity", "recency-asc", "recency-desc"];

  function englishName(c: Commission): string {
    const en = c.name.translations.find((t) => t.language === "en");
    return en?.name ?? c.name.englishName;
  }

  function parseYear(date: string | null | undefined): number {
    if (!date) return Infinity;
    return parseInt(date.split(/[.-]/)[0], 10) || Infinity;
  }

  // SvelteSet rather than a plain Set: mutating a plain Set in place is
  // invisible to the reactivity graph, and rebuilding one on every toggle just
  // to trigger an update would be noise.
  const statusFilter = new SvelteSet<string>();
  const countryFilter = new SvelteSet<string>();
  let search = $state("");
  let filterMode = $state<"exclusive" | "inclusive">("exclusive");
  let sortMode = $state<SortMode>("activity");
  let sortOpen = $state(false);

  function toggle(set: SvelteSet<string>, value: string) {
    if (set.has(value)) set.delete(value);
    else set.add(value);
  }

  const statusOptions = $derived(
    Array.from(new Set(commissions.map((c) => c.status)))
      .sort()
      .map((v) => ({
        value: v,
        display: STATUS_LABELS[v as CommissionStatus] ?? v,
      })),
  );

  const countryOptions = $derived(
    Array.from(new Set(commissions.flatMap((c) => c.memberCountries)))
      .sort()
      .map((v) => ({ value: v, display: v })),
  );

  const filtered = $derived(
    commissions
      .filter((c) => {
        if (statusFilter.size > 0 && !statusFilter.has(c.status)) return false;
        if (countryFilter.size > 0) {
          const match =
            filterMode === "exclusive"
              ? [...countryFilter].every((co) => c.memberCountries.includes(co))
              : c.memberCountries.some((co) => countryFilter.has(co));
          if (!match) return false;
        }
        if (search) {
          const s = search.toLowerCase();
          if (
            !englishName(c).toLowerCase().includes(s) &&
            !c.name.englishName.toLowerCase().includes(s)
          )
            return false;
        }
        return true;
      })
      .sort((a, b) => {
        if (sortMode === "activity") {
          const diff = STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
          if (diff !== 0) return diff;
          return parseYear(a.startDate) - parseYear(b.startDate);
        }
        const diff = parseYear(a.startDate) - parseYear(b.startDate);
        return sortMode === "recency-asc" ? diff : -diff;
      }),
  );

  const activeCount = $derived(statusFilter.size + countryFilter.size);
  const hasAnyFilter = $derived(activeCount > 0 || !!search);

  function clearAll() {
    statusFilter.clear();
    countryFilter.clear();
    search = "";
  }
</script>

{#snippet metaTable(rows: { label: string; value: string | null }[])}
  {@const visible = rows.filter((r) => r.value !== null && r.value !== "")}
  {#if visible.length > 0}
    <table class="text-sm w-full border-collapse">
      <tbody>
        {#each visible as { label, value } (label)}
          <tr class="align-top">
            <td
              class="pr-5 py-0.5 text-muted-foreground whitespace-nowrap w-px"
            >
              {label}
            </td>
            <td class="py-0.5 text-foreground">{value}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
{/snippet}

<div>
  <!-- Filter bar -->
  <div class="flex flex-wrap items-center gap-2 mb-6">
    <!-- The only control in the bar that grows: the pills and the sort trigger
         are sized by their content, so the search takes whatever the row has
         left. `basis-56` keeps it from collapsing to nothing when the filters
         wrap onto its line. -->
    <SearchInput
      placeholder="Search commissions…"
      aria-label="Search commissions"
      bind:value={search}
      class="flex-1 basis-56"
    />

    <FilterPopover
      label="Status"
      options={statusOptions}
      selected={statusFilter}
      onToggle={(v) => toggle(statusFilter, v)}
      onClear={() => statusFilter.clear()}
    />
    <FilterPopover
      label="Countries"
      options={countryOptions}
      selected={countryFilter}
      onToggle={(v) => toggle(countryFilter, v)}
      onClear={() => countryFilter.clear()}
    />

    {#if activeCount > 0}
      <div
        class="flex items-center rounded-xs border text-xs h-8 overflow-hidden"
      >
        <button
          onclick={() => (filterMode = "exclusive")}
          class={[
            "px-2.5 h-full transition-colors",
            filterMode === "exclusive"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          ]}
        >
          Match only
        </button>
        <button
          onclick={() => (filterMode = "inclusive")}
          class={[
            "px-2.5 h-full transition-colors",
            filterMode === "inclusive"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          ]}
        >
          Match any
        </button>
      </div>
    {/if}

    {#if hasAnyFilter}
      <button
        onclick={clearAll}
        class={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-muted-foreground hover:text-foreground h-8 rounded-xs",
        )}
      >
        Clear all
      </button>
    {/if}

    <Popover.Root bind:open={sortOpen}>
      <Popover.Trigger
        class={cn(
          buttonVariants({ variant: "ghost", size: "sm" }),
          "text-xs text-muted-foreground h-8 gap-1.5 ml-auto rounded-xs",
        )}
        aria-expanded={sortOpen}
        aria-label="Sort commissions"
      >
        <ArrowUpDown class="size-3" />
        <ChevronDown
          class={[
            "size-3 opacity-50 transition-transform duration-200",
            sortOpen && "rotate-180",
          ]}
        />
      </Popover.Trigger>
      <PopoverContent class="w-44 p-1" align="end">
        {#each SORT_MODES as mode (mode)}
          <button
            onclick={() => {
              sortMode = mode;
              sortOpen = false;
            }}
            class={[
              "flex items-center gap-2 w-full rounded-xs px-2 py-1.5 text-xs text-left transition-colors hover:bg-accent",
              sortMode === mode ? "text-foreground" : "text-muted-foreground",
            ]}
          >
            <Check
              class={[
                "size-3 shrink-0",
                sortMode === mode ? "opacity-100" : "opacity-0",
              ]}
            />
            {SORT_LABELS[mode]}
          </button>
        {/each}
      </PopoverContent>
    </Popover.Root>
  </div>

  {#if filtered.length === 0}
    <p class="text-sm text-muted-foreground py-8">
      No commissions match the selected filters.
    </p>
  {:else}
    <div>
      {#each filtered as c, i (c.slug)}
        <article
          class={[
            // The top border is a separator between cards, so the first card
            // does not need one — it would read as a rule under the filter bar.
            "border-t border-border py-7 first:border-t-0",
            animate &&
              "animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both",
          ]}
          style={animate ? `animation-delay: ${100 + i * 40}ms` : undefined}
        >
          <!-- The country tags are links, so they cannot sit inside the card's
               own link. Rather than trailing the whole row — where the tall map
               pushed them well clear of the text they belong to — they live in
               the left column beside it, and the map is a second, decorative
               link. The group is named so it does not collide with the
               unnamed group each FlagTag uses for its own hover state. -->
          <div
            class="group/card flex flex-col sm:flex-row items-start gap-4 sm:gap-6"
          >
            <!-- One rhythm for the whole column: title, countries, status and
                 details are all separated by the same step, across the link
                 boundaries as well as within them.

                 The countries sit directly under the title, which splits the
                 card's link in two: the tags are links themselves, so they
                 cannot be nested inside the card's link. The lower half repeats
                 the same destination, so it is hidden from assistive tech and
                 taken out of the tab order — the title above already carries
                 it. -->
            <div class="flex-1 min-w-0 space-y-2">
              <a
                href={`/commissions/${c.slug}`}
                class="block transition-opacity duration-150 group-hover/card:opacity-75"
              >
                <h2
                  class="text-[1.05rem] font-semibold leading-snug text-foreground font-serif"
                  style={`view-transition-name: commission-title-${c.slug}`}
                >
                  {englishName(c)}
                </h2>
              </a>

              {#if c.memberCountries.length > 0}
                <div class="flex flex-wrap gap-1.5">
                  {#each c.memberCountries as country (country)}
                    <FlagTag country={countries[country]} />
                  {/each}
                </div>
              {/if}

              <a
                href={`/commissions/${c.slug}`}
                aria-hidden="true"
                tabindex="-1"
                class="block space-y-2 transition-opacity duration-150 group-hover/card:opacity-75"
              >
                <StatusBadge status={c.status} />
                <div>
                  {@render metaTable([
                    { label: "Proposed", value: c.proposedDate ?? null },
                    {
                      label: "Founded",
                      value: c.startDate ? c.startDate.slice(0, 4) : null,
                    },
                    {
                      label: "Last active",
                      value: c.lastActiveStatusDate
                        ? c.lastActiveStatusDate.slice(0, 4)
                        : null,
                    },
                  ])}
                </div>
              </a>
            </div>

            {#if c.memberCountries.length > 0}
              <a
                href={`/commissions/${c.slug}`}
                aria-hidden="true"
                tabindex="-1"
                class="block w-full sm:w-48 shrink-0 transition-opacity duration-150 group-hover/card:opacity-75"
                style={`view-transition-name: commission-map-${c.slug}`}
              >
                <CommissionMap
                  memberCountries={c.memberCountries.map((n) => countries[n])}
                  aspectRatio={0.6}
                />
              </a>
            {/if}
          </div>
        </article>
      {/each}
    </div>
  {/if}
</div>
