"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import type { Commission, CommissionStatus } from "@/commissions/types";
import { FlagTag } from "@/components/FlagTag";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  concluded: "Concluded",
  unknown: "Status unknown",
};

const STATUS_DOT: Record<CommissionStatus, string> = {
  active: "bg-emerald-500",
  dormant: "bg-amber-400",
  concluded: "bg-red-500",
  unknown: "bg-red-400",
};

const STATUS_TEXT: Record<CommissionStatus, string> = {
  active: "text-emerald-700 dark:text-emerald-400",
  dormant: "text-amber-700 dark:text-amber-400",
  concluded: "text-red-700 dark:text-red-400",
  unknown: "text-red-700 dark:text-red-400",
};

const LANG_NAMES: Record<string, string> = {
  de: "German", ru: "Russian", en: "English", fr: "French",
  uk: "Ukrainian", pl: "Polish", cs: "Czech", sk: "Slovak",
  bg: "Bulgarian", hu: "Hungarian", sl: "Slovenian", it: "Italian",
  ja: "Japanese", ko: "Korean", zh: "Chinese", be: "Belarusian",
  eu: "European", mk: "Macedonian", ge: "Georgian", lt: "Lithuanian",
  ee: "Estonian", fi: "Finnish", he: "Hebrew", ar: "Arabic",
};

function langLabel(code: string): string {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

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

function CommissionCard({ c, index }: { c: Commission; index: number }) {
  const primaryName = englishName(c);

  return (
    <article
      style={{ animationDelay: `${100 + index * 40}ms` }}
      className="py-7 border-t border-border animate-in fade-in slide-in-from-bottom-1 duration-400 fill-mode-both"
    >
      <div className="mb-3">
        <StatusBadge status={c.status} />
        <Link href={`/commissions/${c.slug}`}>
          <h2 className="mt-1.5 text-[1.05rem] font-semibold leading-snug text-foreground hover:text-foreground/70 transition-colors">
            {primaryName}
          </h2>
        </Link>
      </div>

      <div className="space-y-4">
        {c.memberCountries.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {c.memberCountries.map((country) => (
              <FlagTag key={country} tag={country} />
            ))}
          </div>
        )}

        <MetaTable rows={[
          { label: "Proposed", value: c.proposedDate ?? null },
          { label: "Founded", value: c.startDate ? c.startDate.slice(0, 4) : null },
          { label: "Last active", value: c.lastActiveStatusDate ? c.lastActiveStatusDate.slice(0, 4) : null },
        ]} />
      </div>
    </article>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────

type Filters = {
  status: Set<string>;
  languages: Set<string>;
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

export function CommissionsClient({ commissions }: { commissions: Commission[] }) {
  const [filters, setFilters] = useState<Filters>({
    status: new Set(),
    languages: new Set(),
    countries: new Set(),
    search: "",
  });
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const statusOptions = useMemo(() =>
    Array.from(new Set(commissions.map((c) => c.status)))
      .sort()
      .map((v) => ({ value: v, display: STATUS_LABELS[v as CommissionStatus] ?? v })),
    [commissions]
  );

  const languageOptions = useMemo(() =>
    Array.from(new Set(commissions.flatMap((c) => c.siteLanguages)))
      .sort((a, b) => langLabel(a).localeCompare(langLabel(b)))
      .map((v) => ({ value: v, display: langLabel(v) })),
    [commissions]
  );

  const countryOptions = useMemo(() =>
    Array.from(new Set(commissions.flatMap((c) => c.memberCountries)))
      .sort()
      .map((v) => ({ value: v, display: v })),
    [commissions]
  );

  const filtered = commissions.filter((c) => {
    if (filters.status.size > 0 && !filters.status.has(c.status)) return false;
    if (filters.languages.size > 0 && !c.siteLanguages.some((l) => filters.languages.has(l))) return false;
    if (filters.countries.size > 0 && !c.memberCountries.some((co) => filters.countries.has(co))) return false;
    if (filters.search) {
      const s = filters.search.toLowerCase();
      if (!englishName(c).toLowerCase().includes(s) && !c.name.englishName.toLowerCase().includes(s)) return false;
    }
    return true;
  }).sort((a, b) => {
    const diff = parseYear(a.startDate) - parseYear(b.startDate);
    return sortDir === "asc" ? diff : -diff;
  });

  const activeCount = filters.status.size + filters.languages.size + filters.countries.size;
  const hasAnyFilter = activeCount > 0 || !!filters.search;

  function clearAll() {
    setFilters({ status: new Set(), languages: new Set(), countries: new Set(), search: "" });
  }

  return (
    <div>
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
          label="Languages"
          options={languageOptions}
          selected={filters.languages}
          onToggle={(v) => setFilters((f) => ({ ...f, languages: toggle(f.languages, v) }))}
          onClear={() => setFilters((f) => ({ ...f, languages: new Set() }))}
        />
        <FilterPopover
          label="Countries"
          options={countryOptions}
          selected={filters.countries}
          onToggle={(v) => setFilters((f) => ({ ...f, countries: toggle(f.countries, v) }))}
          onClear={() => setFilters((f) => ({ ...f, countries: new Set() }))}
        />
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
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
          className="text-xs text-muted-foreground h-8 gap-1.5"
        >
          <ArrowUpDown className="size-3" />
          {sortDir === "asc" ? "Oldest first" : "Most recent first"}
        </Button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8">No commissions match the selected filters.</p>
      ) : (
        <div>
          {filtered.map((c, i) => <CommissionCard key={c.slug} c={c} index={i} />)}
        </div>
      )}
    </div>
  );
}
