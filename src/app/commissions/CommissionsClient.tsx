"use client";

import { useState } from "react";
import type { Commission, CommissionStatus } from "@/commissions/types";

const STATUS_LABELS: Record<CommissionStatus, string> = {
  active: "Active",
  dormant: "Dormant",
  concluded: "Concluded",
  unknown: "Unknown",
};

const STATUS_DOT: Record<CommissionStatus, string> = {
  active: "bg-emerald-500",
  dormant: "bg-amber-400",
  concluded: "bg-neutral-400",
  unknown: "bg-neutral-300",
};

function englishName(c: Commission): string {
  const en = c.name.translations.find((t) => t.language === "en");
  return en?.name ?? c.name.primary;
}

function CommissionCard({ c }: { c: Commission }) {
  const primaryName = englishName(c);
  const hasAlternate = c.name.primary !== primaryName;

  return (
    <article className="py-8 border-t border-[var(--border)]">
      <div className="flex items-start justify-between gap-6">
        {/* Main content */}
        <div className="min-w-0 flex-1 space-y-3">
          {/* Name */}
          <div className="flex items-start gap-2.5">
            <span
              className={`mt-[7px] shrink-0 w-1.5 h-1.5 rounded-full ${STATUS_DOT[c.status]}`}
              title={STATUS_LABELS[c.status]}
            />
            <div>
              <h2 className="text-[1.05rem] font-semibold leading-snug text-[var(--foreground)]">
                {primaryName}
              </h2>
              {hasAlternate && (
                <p className="text-sm text-[var(--secondary)] mt-0.5 leading-snug">
                  {c.name.primary}
                </p>
              )}
            </div>
          </div>

          {/* Meta */}
          <dl className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-[var(--secondary)] pl-4">
            <div className="flex items-center gap-1.5">
              <dt className="opacity-60 text-xs uppercase tracking-wide font-medium">Countries</dt>
              <dd>{c.memberCountries.join(", ")}</dd>
            </div>
            {c.foundingYear && (
              <div className="flex items-center gap-1.5">
                <dt className="opacity-60 text-xs uppercase tracking-wide font-medium">Est.</dt>
                <dd>{c.foundingYear}</dd>
              </div>
            )}
            <div className="flex items-center gap-1.5">
              <dt className="opacity-60 text-xs uppercase tracking-wide font-medium">Status</dt>
              <dd>{STATUS_LABELS[c.status]}</dd>
            </div>
          </dl>

          {/* Key topics */}
          {c.keyTopics.length > 0 && (
            <div className="pl-4 flex flex-wrap gap-1.5">
              {c.keyTopics.map((topic) => (
                <span
                  key={topic}
                  className="text-xs px-2 py-0.5 rounded-full bg-[var(--border)] text-[var(--secondary)]"
                >
                  {topic}
                </span>
              ))}
            </div>
          )}

          {/* Publications */}
          {c.publications.length > 0 && (
            <div className="pl-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--secondary)] opacity-60 mb-1.5">
                Publications
              </p>
              <ul className="space-y-1">
                {c.publications.map((pub, i) => (
                  <li key={i} className="text-sm text-[var(--foreground)]">
                    {pub.url ? (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-60 transition-opacity underline underline-offset-4 decoration-[var(--border)]"
                      >
                        {pub.title}
                      </a>
                    ) : (
                      pub.title
                    )}
                    {pub.year && (
                      <span className="text-[var(--secondary)] ml-1.5">({pub.year})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Chairs */}
          {c.chairs.length > 0 && (
            <div className="pl-4">
              <p className="text-xs font-medium uppercase tracking-wide text-[var(--secondary)] opacity-60 mb-1.5">
                Chairs
              </p>
              <ul className="space-y-0.5">
                {c.chairs.map((chair) => (
                  <li key={chair.name} className="text-sm text-[var(--foreground)]">
                    {chair.name}
                    {chair.affiliation && (
                      <span className="text-[var(--secondary)]"> — {chair.affiliation}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Link */}
        <div className="shrink-0 pt-0.5">
          {c.linkStatus === "working" ? (
            <a
              href={c.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors underline underline-offset-4 decoration-[var(--border)]"
            >
              Website&nbsp;↗
            </a>
          ) : c.lastArchivedSnapshot ? (
            <a
              href={c.lastArchivedSnapshot}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors underline underline-offset-4 decoration-[var(--border)]"
            >
              Archive&nbsp;↗
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}

const ALL_STATUSES: CommissionStatus[] = ["active", "dormant", "concluded", "unknown"];

export function CommissionsClient({ commissions }: { commissions: Commission[] }) {
  const [statusFilter, setStatusFilter] = useState<CommissionStatus | "all">("all");

  const filtered =
    statusFilter === "all"
      ? commissions
      : commissions.filter((c) => c.status === statusFilter);

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-10">
        <button
          onClick={() => setStatusFilter("all")}
          className={`text-sm px-3 py-1 rounded-full border transition-colors ${
            statusFilter === "all"
              ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
              : "border-[var(--border)] text-[var(--secondary)] hover:text-[var(--foreground)] hover:border-[var(--secondary)]"
          }`}
        >
          All ({commissions.length})
        </button>
        {ALL_STATUSES.map((status) => {
          const count = commissions.filter((c) => c.status === status).length;
          if (count === 0) return null;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`text-sm px-3 py-1 rounded-full border transition-colors ${
                statusFilter === status
                  ? "bg-[var(--foreground)] text-[var(--background)] border-[var(--foreground)]"
                  : "border-[var(--border)] text-[var(--secondary)] hover:text-[var(--foreground)] hover:border-[var(--secondary)]"
              }`}
            >
              {STATUS_LABELS[status]} ({count})
            </button>
          );
        })}
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <p className="text-[var(--secondary)] text-sm py-8">No commissions match this filter.</p>
      ) : (
        <div>
          {filtered.map((c, i) => (
            <CommissionCard key={i} c={c} />
          ))}
        </div>
      )}
    </div>
  );
}
