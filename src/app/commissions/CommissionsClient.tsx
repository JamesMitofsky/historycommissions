"use client";

import { useState, useRef, useEffect } from "react";
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
  return en?.name ?? c.name.primary;
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
  const hasAlternate = c.name.primary !== primaryName;
  const languages = c.siteLanguages.map(langLabel).join(", ");
  const sponsors = c.sponsoringInstitutions.join(" · ") || null;

  const linkEl = c.linkStatus === "working" ? (
    <a href={c.url} target="_blank" rel="noopener noreferrer"
      className="group/link text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-300 dark:decoration-sky-600">
      Website<span className="inline-block transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">&nbsp;↗</span>
    </a>
  ) : c.lastArchivedSnapshot ? (
    <a href={c.lastArchivedSnapshot} target="_blank" rel="noopener noreferrer"
      className="group/link text-sm font-medium text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-300 dark:decoration-sky-600">
      Archive<span className="inline-block transition-transform group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5">&nbsp;↗</span>
    </a>
  ) : null;

  return (
    <article className="py-8 border-t border-[var(--border)]">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="min-w-0">
          <StatusBadge status={c.status} />
          <h2 className="mt-1.5 text-[1.05rem] font-semibold leading-snug text-[var(--foreground)]">
            {primaryName}
          </h2>
          {hasAlternate && (
            <p className="text-sm text-[var(--secondary)] mt-0.5 leading-snug">{c.name.primary}</p>
          )}
        </div>
        <div className="shrink-0 pt-0.5">{linkEl}</div>
      </div>

      <div className="space-y-5">
        {/* Member countries */}
        {c.memberCountries.length > 0 && (
          <div>
            <SectionLabel>Member Countries</SectionLabel>
            <div className="flex flex-wrap gap-1.5">
              {c.memberCountries.map((country) => (
                <FlagTag key={country} tag={country} />
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div>
          <SectionLabel>Details</SectionLabel>
          <MetaTable rows={[
            { label: "Site languages", value: languages || null },
            { label: "Founded", value: c.foundingYear ?? null },
            { label: "Sponsors", value: sponsors },
          ]} />
        </div>

        {/* Publications */}
        {c.publications.length > 0 && (
          <div>
            <SectionLabel>Publications</SectionLabel>
            <ul className="list-disc list-outside pl-4 space-y-2.5">
              {c.publications.map((pub, i) => (
                <li key={i} className="text-sm text-[var(--foreground)]">
                  {pub.url ? (
                    <a href={pub.url} target="_blank" rel="noopener noreferrer"
                      className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-300 dark:decoration-sky-600">
                      {pub.title}
                    </a>
                  ) : pub.title}
                  {pub.year && <span className="text-[var(--secondary)] ml-1.5">({pub.year})</span>}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </article>
  );
}

// ─── Filter dropdown ──────────────────────────────────────────────────────────

interface DropdownProps {
  label: string;
  options: { value: string; display: string }[];
  selected: Set<string>;
  onToggle: (value: string) => void;
  onClear: () => void;
}

function FilterDropdown({ label, options, selected, onToggle, onClear }: DropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const count = selected.size;

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
        className={`inline-flex items-center gap-2 text-sm px-3 py-1.5 rounded-lg border transition-colors ${
          count > 0
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
          {count > 0 && (
            <div className="px-3 pt-1 pb-2 border-b border-[var(--border)]">
              <button onClick={() => { onClear(); }} className="text-xs text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors">
                Clear
              </button>
            </div>
          )}
          {options.map(({ value, display }) => (
            <label key={value} className="flex items-center gap-2.5 px-3 py-1.5 cursor-pointer hover:bg-[var(--border)] transition-colors">
              <input
                type="checkbox"
                checked={selected.has(value)}
                onChange={() => onToggle(value)}
                className="accent-[var(--foreground)]"
              />
              <span className="text-sm text-[var(--foreground)]">{display}</span>
            </label>
          ))}
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
};

function toggle(set: Set<string>, value: string): Set<string> {
  const next = new Set(set);
  next.has(value) ? next.delete(value) : next.add(value);
  return next;
}

export function CommissionsClient({ commissions }: { commissions: Commission[] }) {
  const [filters, setFilters] = useState<Filters>({
    status: new Set(),
    languages: new Set(),
    countries: new Set(),
  });

  const statusOptions = Array.from(new Set(commissions.map((c) => c.status)))
    .sort()
    .map((v) => ({ value: v, display: STATUS_LABELS[v as CommissionStatus] ?? v }));

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
    return true;
  });

  const activeCount = filters.status.size + filters.languages.size + filters.countries.size;

  function clearAll() {
    setFilters({ status: new Set(), languages: new Set(), countries: new Set() });
  }

  return (
    <div>
      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
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
        {activeCount > 0 && (
          <button onClick={clearAll} className="text-xs text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors ml-1">
            Clear all
          </button>
        )}
      </div>

      <p className="text-xs text-[var(--secondary)] mb-8">
        {filtered.length} of {commissions.length} commissions
      </p>

      {filtered.length === 0 ? (
        <p className="text-sm text-[var(--secondary)] py-8">No commissions match the selected filters.</p>
      ) : (
        <div>
          {(["active", "dormant", "concluded", "unknown"] as CommissionStatus[]).map((status) => {
            const group = filtered.filter((c) => c.status === status);
            if (group.length === 0) return null;
            return (
              <section key={status} className="mb-10">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-[var(--secondary)] opacity-60 mb-0">
                  {STATUS_LABELS[status]}
                </h2>
                {group.map((c, i) => <CommissionCard key={i} c={c} />)}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
