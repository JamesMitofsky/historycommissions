"use client";

import { useState, useMemo, useEffect } from "react";
import { ViewTransition } from "react";
import Link from "next/link";
import type { Commission, CommissionStatus } from "@/commissions/types";
import { FlagTag } from "@/components/FlagTag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { CommissionGlobe } from "@/components/CommissionGlobe";
import { CommissionMap } from "@/components/CommissionMap";
import { navigatingViaViewTransition, setNavigatingViaViewTransition } from "@/lib/navigation-state";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Check, ChevronDown, ArrowUpDown } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Labels / mappings ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CommissionStatus, string> = {
  active: "Active",
  dormant: "Dormant",
  ended: "Ended",
  unknown: "Status unknown",
};

// Non-active groups use agnostic colors (no good/bad connotation).
// `unknown` is grouped with `dormant` (shares its color).
const STATUS_DOT: Record<CommissionStatus, string> = {
  active: "bg-emerald-500",
  dormant: "bg-sky-500",
  ended: "bg-zinc-400",
  unknown: "bg-sky-500",
};

const STATUS_TEXT: Record<CommissionStatus, string> = {
  active: "text-emerald-700 dark:text-emerald-400",
  dormant: "text-sky-700 dark:text-sky-400",
  ended: "text-zinc-600 dark:text-zinc-400",
  unknown: "text-sky-700 dark:text-sky-400",
};

function englishName(c: Commission): string {
  const en = c.name.translations.find((t) => t.language === "en");
  return en?.name ?? c.name.englishName;
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60 mb-2">
      {children}
    </p>
  );
}

function MetaTable({ rows }: { rows: { label: string; value: React.ReactNode }[] }) {
  const visible = rows.filter((r) => r.value !== null && r.value !== undefined && r.value !== "");
  if (visible.length === 0) return null;
  return (
    <table className="text-sm w-full border-collapse">
      <tbody>
        {visible.map(({ label, value }) => (
          <tr key={label} className="align-top">
            <td className="pr-5 py-0.5 text-muted-foreground whitespace-nowrap w-28">{label}</td>
            <td className="py-0.5 text-foreground">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium", STATUS_TEXT[status])}>
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", STATUS_DOT[status])} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Filter Popover ───────────────────────────────────────────────────────────

interface FilterPopoverProps {
  label: string;
  options: { value: string; display: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}

function FilterPopover({ label, options, selected, onToggle, onClear }: FilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const count = selected.size;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            "gap-1.5 font-normal",
            count > 0 && "border-foreground/50"
          )}
          aria-expanded={open}
        >
          {label}
          {count > 0 && (
            <Badge variant="secondary" className="h-4 min-w-4 px-1 text-[10px] font-semibold rounded-full">
              {count}
            </Badge>
          )}
          <ChevronDown className={cn("size-3 opacity-50 transition-transform duration-200", open && "rotate-180")} />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 p-0" align="start">
        <Command>
          <CommandInput placeholder={`Search ${label.toLowerCase()}…`} />
          <CommandList>
            <CommandEmpty>No matches</CommandEmpty>
            <CommandGroup>
              {options.map(({ value, display }) => (
                <CommandItem
                  key={value}
                  value={display}
                  onSelect={() => onToggle(value)}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      selected.has(value) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {display}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
          {count > 0 && (
            <div className="border-t px-2 py-1.5">
              <button
                onClick={() => { onClear(); }}
                className="w-full text-left text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                Clear {label.toLowerCase()}
              </button>
            </div>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  );
}

// ─── Commission card ──────────────────────────────────────────────────────────

function CommissionCard({ c, index, animate }: { c: Commission; index: number; animate: boolean }) {
  const primaryName = englishName(c);

  return (
    <article
      className={cn(
        "border-t border-border py-7",
        animate && "animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both"
      )}
      style={animate ? { animationDelay: `${100 + index * 40}ms` } : undefined}
    >
      <Link
        href={`/commissions/${c.slug}`}
        transitionTypes={["nav-forward"]}
        onClick={() => { setNavigatingViaViewTransition(true); }}
        className="group flex flex-col sm:flex-row items-start gap-4 sm:gap-6 transition-opacity duration-150 hover:opacity-75"
      >
        <div className="flex-1 min-w-0">
          <StatusBadge status={c.status} />
          <ViewTransition name={`commission-title-${c.slug}`}>
            <h2 className="mt-1.5 text-[1.05rem] font-semibold leading-snug text-foreground font-playfair">
              {primaryName}
            </h2>
          </ViewTransition>
          <div className="mt-3">
            <MetaTable rows={[
              { label: "Proposed", value: c.proposedDate ?? null },
              { label: "Founded", value: c.startDate ? c.startDate.slice(0, 4) : null },
              { label: "Last active", value: c.lastActiveStatusDate ? c.lastActiveStatusDate.slice(0, 4) : null },
            ]} />
          </div>
        </div>
        {c.memberCountries.length > 0 && (
          <ViewTransition name={`commission-map-${c.slug}`}>
            <div className="w-full sm:w-48 shrink-0">
              <CommissionMap memberCountries={c.memberCountries} aspectRatio={0.6} />
            </div>
          </ViewTransition>
        )}
      </Link>
      {c.memberCountries.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {c.memberCountries.map((country) => (
            <FlagTag key={country} tag={country} />
          ))}
        </div>
      )}
    </article>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Filters = {
  status: Set<string>;
  countries: Set<string>;
  search: string;
};

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

function parseYear(date: string | null | undefined): number {
  if (!date) return Infinity;
  return parseInt(date.split(/[.\-]/)[0], 10) || Infinity;
}

type SortMode = "recency-asc" | "recency-desc" | "activity";

const SORT_LABELS: Record<SortMode, string> = {
  "recency-asc": "Oldest first",
  "recency-desc": "Newest first",
  activity: "By status",
};

const ACTIVITY_ORDER: Record<CommissionStatus, number> = {
  active: 0,
  dormant: 1,
  unknown: 2,
  ended: 3,
};

type FilterMode = "exclusive" | "inclusive";

export function CommissionsClient({ commissions }: { commissions: Commission[] }) {
  const [filters, setFilters] = useState<Filters>({
    status: new Set(),
    countries: new Set(),
    search: "",
  });
  const [filterMode, setFilterMode] = useState<FilterMode>("exclusive");
  const [sortMode, setSortMode] = useState<SortMode>("activity");
  const [sortOpen, setSortOpen] = useState(false);
  const [animate] = useState(!navigatingViaViewTransition);
  useEffect(() => { setNavigatingViaViewTransition(false); }, []);

  const statusOptions = useMemo(() =>
    Array.from(new Set(commissions.map((c) => c.status)))
      .sort()
      .map((v) => ({ value: v, display: STATUS_LABELS[v as CommissionStatus] ?? v })),
    [commissions]
  );

  const countryOptions = useMemo(() =>
    Array.from(new Set(commissions.flatMap((c) => c.memberCountries)))
      .sort()
      .map((v) => ({ value: v, display: v })),
    [commissions]
  );

  const filtered = useMemo(() =>
    commissions.filter((c) => {
      if (filters.status.size > 0 && !filters.status.has(c.status)) return false;
      if (filters.countries.size > 0) {
        const match = filterMode === "exclusive"
          ? [...filters.countries].every((co) => c.memberCountries.includes(co))
          : c.memberCountries.some((co) => filters.countries.has(co));
        if (!match) return false;
      }
      if (filters.search) {
        const s = filters.search.toLowerCase();
        if (!englishName(c).toLowerCase().includes(s) && !c.name.englishName.toLowerCase().includes(s)) return false;
      }
      return true;
    }).sort((a, b) => {
      if (sortMode === "activity") {
        const diff = ACTIVITY_ORDER[a.status] - ACTIVITY_ORDER[b.status];
        if (diff !== 0) return diff;
        return parseYear(a.startDate) - parseYear(b.startDate);
      }
      const diff = parseYear(a.startDate) - parseYear(b.startDate);
      return sortMode === "recency-asc" ? diff : -diff;
    }),
    [commissions, filters, filterMode, sortMode]
  );

  const activeCount = filters.status.size + filters.countries.size;
  const hasAnyFilter = activeCount > 0 || !!filters.search;

  function clearAll() {
    setFilters({ status: new Set(), countries: new Set(), search: "" });
  }

  return (
    <div>
      <div className="mb-10">
        <h1
          style={{ animationDelay: animate ? "60ms" : undefined }}
          className={cn(
            "text-2xl font-semibold text-foreground font-playfair",
            animate && "animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
          )}
        >
          Bilateral Commissions
        </h1>
        <p
          style={{ animationDelay: animate ? "140ms" : undefined }}
          className={cn(
            "mt-1 text-sm text-muted-foreground",
            animate && "animate-in fade-in slide-in-from-bottom-2 duration-400 fill-mode-both"
          )}
        >
          {commissions.length}{" "}bilateral historians&apos; commissions
        </p>
      </div>
      <div className="mb-6">
        <CommissionGlobe
          commissions={commissions}
          visibleSlugs={hasAnyFilter ? new Set(filtered.map((c) => c.slug)) : undefined}
          onCountryClick={(country) =>
            setFilters((f) => ({ ...f, countries: new Set([country]) }))
          }
        />
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-6">
        <Input
          type="text"
          placeholder="Search commissions…"
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="h-8 w-52 text-sm"
        />
        <FilterPopover
          label="Status"
          options={statusOptions}
          selected={filters.status}
          onToggle={(v) => setFilters((f) => ({ ...f, status: toggle(f.status, v) }))}
          onClear={() => setFilters((f) => ({ ...f, status: new Set() }))}
        />
        <FilterPopover
          label="Countries"
          options={countryOptions}
          selected={filters.countries}
          onToggle={(v) => setFilters((f) => ({ ...f, countries: toggle(f.countries, v) }))}
          onClear={() => setFilters((f) => ({ ...f, countries: new Set() }))}
        />
        {activeCount > 0 && (
          <div className="flex items-center rounded-md border text-xs h-8 overflow-hidden">
            <button
              onClick={() => setFilterMode("exclusive")}
              className={cn(
                "px-2.5 h-full transition-colors",
                filterMode === "exclusive"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Match only
            </button>
            <button
              onClick={() => setFilterMode("inclusive")}
              className={cn(
                "px-2.5 h-full transition-colors",
                filterMode === "inclusive"
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              Match any
            </button>
          </div>
        )}
        {hasAnyFilter && (
          <Button variant="ghost" size="sm" onClick={clearAll} className="text-muted-foreground hover:text-foreground h-8">
            Clear all
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between mb-6">
        <p className="text-xs text-muted-foreground">
          {filtered.length} of {commissions.length} commissions
        </p>
        <Popover open={sortOpen} onOpenChange={setSortOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-8 gap-1.5"
              aria-expanded={sortOpen}
            >
              <ArrowUpDown className="size-3" />
              {SORT_LABELS[sortMode]}
              <ChevronDown className={cn("size-3 opacity-50 transition-transform duration-200", sortOpen && "rotate-180")} />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-1" align="end">
            {(["activity", "recency-asc", "recency-desc"] as SortMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => { setSortMode(mode); setSortOpen(false); }}
                className={cn(
                  "flex items-center gap-2 w-full rounded px-2 py-1.5 text-xs text-left transition-colors hover:bg-accent",
                  sortMode === mode ? "text-foreground" : "text-muted-foreground"
                )}
              >
                <Check className={cn("size-3 shrink-0", sortMode === mode ? "opacity-100" : "opacity-0")} />
                {SORT_LABELS[mode]}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No commissions match the selected filters.</p>
      ) : (
        <div>
          {filtered.map((c, i) => <CommissionCard key={c.slug} c={c} index={i} animate={animate} />)}
        </div>
      )}
    </div>
  );
}
