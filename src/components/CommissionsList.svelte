<script lang="ts">
  import { Popover } from "bits-ui";
  import { SvelteSet } from "svelte/reactivity";
  import Check from "@lucide/svelte/icons/check";
  import ChevronDown from "@lucide/svelte/icons/chevron-down";
  import ArrowUpDown from "@lucide/svelte/icons/arrow-up-down";
  import type { Commission, CommissionStatus } from "@/commissions/types";
  import { STATUS_LABELS, STATUS_ORDER } from "@/commissions/status";
  import { cn } from "@/lib/utils";
  import FlagTag from "./FlagTag.svelte";
  import StatusBadge from "./StatusBadge.svelte";
  import CommissionMap from "./CommissionMap.svelte";
  import FilterPopover from "./FilterPopover.svelte";
  import Input from "./ui/Input.svelte";
  import { buttonVariants } from "./ui/button-variants";
  import PopoverContent from "./ui/PopoverContent.svelte";

  interface Props {
    commissions: Commission[];
    /** False when arriving via a view transition — the morph already covered it. */
    animate?: boolean;
  }

  let { commissions, animate = true }: Props = $props();

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
              class="pr-5 py-0.5 text-muted-foreground whitespace-nowrap w-28"
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
  <div class="mb-10">
    <h1
      style={animate ? "animation-delay: 60ms" : undefined}
      class={cn(
        "text-2xl font-semibold text-foreground font-playfair",
        animate &&
          "animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both",
      )}
    >
      Bilateral Commissions
    </h1>
  </div>

  <!-- Filter bar -->
  <div class="flex flex-wrap items-center gap-2 mt-4 mb-6">
    <Input
      type="text"
      placeholder="Search commissions…"
      bind:value={search}
      class="h-8 w-52 text-sm rounded-xs"
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

    <span class="text-xs text-muted-foreground tabular-nums">
      {filtered.length}/{commissions.length}
    </span>

    {#if activeCount > 0}
      <div
        class="flex items-center rounded-xs border text-xs h-8 overflow-hidden"
      >
        <button
          onclick={() => (filterMode = "exclusive")}
          class={cn(
            "px-2.5 h-full transition-colors",
            filterMode === "exclusive"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          Match only
        </button>
        <button
          onclick={() => (filterMode = "inclusive")}
          class={cn(
            "px-2.5 h-full transition-colors",
            filterMode === "inclusive"
              ? "bg-foreground text-background"
              : "text-muted-foreground hover:text-foreground",
          )}
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
          class={cn(
            "size-3 opacity-50 transition-transform duration-200",
            sortOpen && "rotate-180",
          )}
        />
      </Popover.Trigger>
      <PopoverContent class="w-44 p-1" align="end">
        {#each SORT_MODES as mode (mode)}
          <button
            onclick={() => {
              sortMode = mode;
              sortOpen = false;
            }}
            class={cn(
              "flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs text-left transition-colors hover:bg-accent",
              sortMode === mode ? "text-foreground" : "text-muted-foreground",
            )}
          >
            <Check
              class={cn(
                "size-3 shrink-0",
                sortMode === mode ? "opacity-100" : "opacity-0",
              )}
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
          class={cn(
            "border-t border-border py-7",
            animate &&
              "animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both",
          )}
          style={animate ? `animation-delay: ${100 + i * 40}ms` : undefined}
        >
          <a
            href={`/commissions/${c.slug}`}
            class="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition-opacity duration-150 hover:opacity-75"
          >
            <div class="flex-1 min-w-0">
              <StatusBadge status={c.status} />
              <h2
                class="mt-1.5 text-[1.05rem] font-semibold leading-snug text-foreground font-playfair"
                style={`view-transition-name: commission-title-${c.slug}`}
              >
                {englishName(c)}
              </h2>
              <div class="mt-3">
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
            </div>

            {#if c.memberCountries.length > 0}
              <div
                class="w-full sm:w-48 shrink-0"
                style={`view-transition-name: commission-map-${c.slug}`}
              >
                <CommissionMap
                  memberCountries={c.memberCountries}
                  aspectRatio={0.6}
                />
              </div>
            {/if}
          </a>

          {#if c.memberCountries.length > 0}
            <div class="mt-3 flex flex-wrap gap-1.5">
              {#each c.memberCountries as country (country)}
                <FlagTag tag={country} />
              {/each}
            </div>
          {/if}
        </article>
      {/each}
    </div>
  {/if}
</div>
