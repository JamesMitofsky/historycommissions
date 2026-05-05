import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getCommissions, getCommission } from "@/commissions/get-commissions";
import { FlagTag } from "@/components/FlagTag";
import type { Commission, CommissionStatus } from "@/commissions/types";

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return getCommissions().map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let c: Commission;
  try {
    c = getCommission(slug);
  } catch {
    return {};
  }
  const en = c.name.translations.find((t) => t.language === "en");
  const title = en?.name ?? c.name.primary;
  return { title };
}

// ─── Display helpers ──────────────────────────────────────────────────────────

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

function langLabel(code: string) {
  return LANG_NAMES[code] ?? code.toUpperCase();
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function CommissionPage({ params }: Props) {
  const { slug } = await params;

  let c: Commission;
  try {
    c = getCommission(slug);
  } catch {
    notFound();
  }

  const en = c.name.translations.find((t) => t.language === "en");
  const primaryName = en?.name ?? c.name.primary;
  const hasAlternate = c.name.primary !== primaryName;
  const languages = c.siteLanguages.map(langLabel).join(", ");
  const sponsors = c.sponsoringInstitutions.join(" · ") || null;

  const otherNames = c.name.translations
    .filter((t) => t.language !== "en" && t.name !== c.name.primary)
    .map((t) => t.name);

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
    <main className="max-w-2xl mx-auto px-6 py-12">
      <Link
        href="/commissions"
        className="inline-flex items-center gap-1.5 text-sm text-[var(--secondary)] hover:text-[var(--foreground)] transition-colors mb-10"
      >
        ← All commissions
      </Link>

      <header className="mb-8">
        <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${STATUS_STYLE[c.status]}`}>
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${STATUS_DOT[c.status]}`} />
          {STATUS_LABELS[c.status]}
        </span>
        <div className="flex items-start justify-between gap-4 mt-1.5">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold leading-tight text-[var(--foreground)]">
              {primaryName}
            </h1>
            {hasAlternate && (
              <p className="text-sm text-[var(--secondary)] mt-1 leading-snug">{c.name.primary}</p>
            )}
            {otherNames.map((n) => (
              <p key={n} className="text-sm text-[var(--secondary)] mt-0.5 leading-snug">{n}</p>
            ))}
          </div>
          <div className="shrink-0 pt-1">{linkEl}</div>
        </div>
      </header>

      <div className="border-t border-[var(--border)] pt-8 space-y-8">
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

        <div>
          <SectionLabel>Details</SectionLabel>
          <MetaTable rows={[
            { label: "Site languages", value: languages || null },
            { label: "Founded", value: c.foundingYear ?? null },
            { label: "Sponsors", value: sponsors },
          ]} />
        </div>

        {c.chairs.length > 0 && (
          <div>
            <SectionLabel>Chairs</SectionLabel>
            <ul className="space-y-1.5">
              {c.chairs.map((chair, i) => (
                <li key={i} className="text-sm text-[var(--foreground)]">
                  {chair.name}
                  {chair.affiliation && <span className="text-[var(--secondary)] ml-1.5">— {chair.affiliation}</span>}
                  <span className="text-[var(--secondary)] ml-1.5">({chair.country})</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {c.workingGroups.length > 0 && (
          <div>
            <SectionLabel>Working Groups</SectionLabel>
            <ul className="list-disc list-outside pl-4 space-y-1">
              {c.workingGroups.map((wg, i) => (
                <li key={i} className="text-sm text-[var(--foreground)]">{wg}</li>
              ))}
            </ul>
          </div>
        )}

        {c.keyTopics.length > 0 && (
          <div>
            <SectionLabel>Key Topics</SectionLabel>
            <ul className="list-disc list-outside pl-4 space-y-1">
              {c.keyTopics.map((topic, i) => (
                <li key={i} className="text-sm text-[var(--foreground)]">{topic}</li>
              ))}
            </ul>
          </div>
        )}

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

        {c.archivableDocuments.length > 0 && (
          <div>
            <SectionLabel>Archivable Documents</SectionLabel>
            <ul className="list-disc list-outside pl-4 space-y-2">
              {c.archivableDocuments.map((doc, i) => (
                <li key={i} className="text-sm">
                  <a href={doc.url} target="_blank" rel="noopener noreferrer"
                    className="text-sky-600 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300 transition-colors underline underline-offset-4 decoration-sky-300 dark:decoration-sky-600">
                    {doc.title}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
