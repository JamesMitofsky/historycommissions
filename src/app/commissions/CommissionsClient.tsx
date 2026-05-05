"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import type { Commission, CommissionStatus } from "@/commissions/types";
import { FlagTag } from "@/components/FlagTag";

// ─── Labels / mappings ────────────────────────────────────────────────────────

const STATUS_LABELS: Record<CommissionStatus, string> = {
  active: "Active",
  dormant: "Dormant",
  concluded: "Concluded",
  unknown: "Status unknown",
};

const STATUS_STYLE: Record<CommissionStatus, string> = {
  active: "text-emerald-700 dark:text-emerald-500",
  dormant: "text-amber-700 dark:text-amber-500",
  concluded: "text-[var(--secondary)]",
  unknown: "text-[var(--secondary)]",
};

const STATUS_DOT: Record<CommissionStatus, string> = {
  active: "bg-emerald-500",
  dormant: "bg-amber-400",
  concluded: "bg-neutral-400",
  unknown: "bg-neutral-300",
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
    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--secondary)] opacity-60 mb-2">
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
            <td className="pr-5 py-0.5 text-[var(--secondary)] whitespace-nowrap w-28 opacity-70">{label}</td>
            <td className="py-0.5 text-[var(--foreground)]">{value}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function StatusBadge({ status }: { status: CommissionStatus }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_STYLE[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[status]}`} />
      {STATUS_LABELS[status]}
    </span>
  );
}

// ─── Commission card ──────────────────────────────────────────────────────────

function CommissionCard({ c }: { c: Commission }) {
  const primaryName = englishName(c);

  return (
    <article className="py-8 border-t border-[var(--border)]">
      <div className="mb-4">
        <StatusBadge status={c.status} />
        <Link href={`/commissions/${c.slug}`}>
          <h2 className="mt-1.5 text-[1.05rem] font-semibold leading-snug text-[var(--foreground)] hover:underline underline-offset-2">
            {primaryName}
          </h2>
        </Link>
      </div>

      <div className="space-y-5">
        {/* Member countries */}
        {c.memberCountries.length > 0 && (
          <div>
            <div className="flex flex-wrap gap-1.5">
              {c.memberCountries.map((country) => (
                <FlagTag key={country} tag={country} />
              ))}
            </div>
          </div>
        )}

        <div>
          <MetaTable rows={[
            { label: "Proposed", value: c.proposedDate ?? null },
            { label: "Founded", value: c.startDate ? c.startDate.slice(0, 4) : null },
            { label: "Last active", value: c.lastActiveStatusDate ? c.lastActiveStatusDate.slice(0, 4) : null },
          ]} />
        </div>

      </div>
    </article>
  );
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  options: { value: string; display: string; textColor?: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}

function FilterDropdown({ label, options, selected, onToggle, onClear }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const count = selected.size;

  const filtered = options.filter(({ display }) =>
    display.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${count > 0
            ? "border-[var(--foreground)] text-[var(--foreground)]"
            : "border-[var(--border)] text-[var(--secondary)] hover:text-[var(--foreground)] hover:border-[var(--secondary)]"
          }`}
      >
        {label}
        {count > 0 && (
          <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-[var(--foreground)] text-[var(--background)] text-[10px] font-semibold leading-none">
            {count}
          </span>
        )}
        <svg className={`w-3 h-3 transition-transform ${open ? "rotate-180" : ""}`} viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M2 4l4 4 4-4" />
        </svg>
      </button>

      {open && (
        <div className="absolute top-full mt-1 left-0 z-20 min-w-44 rounded-lg border border-[var(--border)] bg-[var(--background)] shadow-sm py-1">
          <div className="px-3 py-2 border-b border-[var(--border)]">
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="w-full text-sm px-2 py-1 rounded border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--secondary)] focus:outline-none focus:border-[var(--foreground)]"
            />
          </div>
          {filtered.length === 0 ? (
            <div className="px-3 py-2 text-xs text-[var(--secondary)]">No matches</div>
          ) : (
            filtered.map(({ value, display, textColor }) => (
              <label key={value} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-[var(--border)] transition-colors">
                <input
                  type="checkbox"
                  checked={selected.has(value)}
                  onChange={() => onToggle(value)}
                  className="accent-[var(--foreground)]"
                />
                <span className={`text-sm ${textColor ?? "text-[var(--foreground)]"}`}>{display}</span>
              </label>
            ))
          )}
          {count > 0 && (
            <div className="px-3 py-1.5 border-t border-[var(--border)]">
              <button onClick={() => { onClear(); setSearch(""); }} className="text-xs text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                Clear
              </button>
            </div>
          )}
        </div>
      )}
    </div>
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

  const statusOptions = Array.from(new Set(commissions.map((c) => c.status)))
    .sort()
    .map((v) => ({
      value: v,
      display: STATUS_LABELS[v as CommissionStatus] ?? v,
      textColor: STATUS_STYLE[v as CommissionStatus],
    }));

  const languageOptions = Array.from(
    new Set(commissions.flatMap((c) => c.siteLanguages))
  )
    .sort((a, b) => langLabel(a).localeCompare(langLabel(b)))
    .map((v) => ({ value: v, display: langLabel(v) }));

  const countryOptions = Array.from(
    new Set(commissions.flatMap((c) => c.memberCountries))
  )
    .sort()
    .map((v) => ({ value: v, display: v }));

  const filtered = commissions.filter((c) => {
    if (filters.status.size > 0 && !filters.status.has(c.status)) return false;
    if (filters.languages.size > 0 && !c.siteLanguages.some((l) => filters.languages.has(l))) return false;
    if (filters.countries.size > 0 && !c.memberCountries.some((co) => filters.countries.has(co))) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesName = englishName(c).toLowerCase().includes(searchLower) || c.name.englishName.toLowerCase().includes(searchLower);
      if (!matchesName) return false;
    }
    return true;
  }).sort((a, b) => {
    const diff = parseYear(a.startDate) - parseYear(b.startDate);
    return sortDir === "asc" ? diff : -diff;
  });

  const activeCount = filters.status.size + filters.languages.size + filters.countries.size;

  function clearAll() {
    setFilters({ status: new Set(), languages: new Set(), countries: new Set(), search: "" });
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-8">
        <input
          type="text"
          placeholder="Search commissions..."
          value={filters.search}
          onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
          className="text-sm px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--background)] text-[var(--foreground)] placeholder-[var(--secondary)] focus:outline-none focus:border-[var(--foreground)]"
        />
        <FilterDropdown
          label="Status"
          options={statusOptions}
          selected={filters.status}
          onToggle={(v) => setFilters((f) => ({ ...f, status: toggle(f.status, v) }))}
          onClear={() => setFilters((f) => ({ ...f, status: new Set() }))}
        />
        <FilterDropdown
          label="Languages"
          options={languageOptions}
          selected={filters.languages}
          onToggle={(v) => setFilters((f) => ({ ...f, languages: toggle(f.languages, v) }))}
          onClear={() => setFilters((f) => ({ ...f, languages: new Set() }))}
        />
        <FilterDropdown
          label="Countries"
          options={countryOptions}
          selected={filters.countries}
          onToggle={(v) => setFilters((f) => ({ ...f, countries: toggle(f.countries, v) }))}
          onClear={() => setFilters((f) => ({ ...f, countries: new Set() }))}
        />
        {(activeCount > 0 || filters.search) && (
          <button onClick={clearAll} className="text-xs text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors ml-1">
            Clear all
          </button>
        )}
      </div>

      <div className="flex items-center justify-between mb-8">
        <p className="text-xs text-[var(--secondary)]">
          {filtered.length} of {commissions.length} commissions
        </p>
        <button
          onClick={() => setSortDir((d) => d === "asc" ? "desc" : "asc")}
          className="text-xs text-[var(--secondary)] hover:text-[var(--foreground)] bg-[var(--border)] hover:bg-[var(--border)] px-2 py-1 rounded-md transition-colors"
        >
          {sortDir === "asc" ? "Oldest first ↑" : "Most recent first ↓"}
        </button>
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--secondary)] py-8">No commissions match the selected filters.</p>
      ) : (
        <div>
          {filtered.map((c, i) => <CommissionCard key={i} c={c} />)}
        </div>
      )}
    </div>
  );
}
