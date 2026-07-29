import type { CommissionStatus } from "./schema";

// Single source of truth for how commission statuses are labeled, colored, and
// ordered across the whole site. Edit here, not in individual pages.
//
// `unknown` is grouped with `dormant` (shares its color and sits next to it in
// the sort order). The two non-active groups use agnostic colors so the three
// groups stay visually distinct without implying good/bad: active = emerald,
// dormant + unknown = orange, ended = sky.

export const STATUS_LABELS: Record<CommissionStatus, string> = {
  active: "Active",
  dormant: "Dormant",
  ended: "Ended",
  unknown: "Unknown",
};

export const STATUS_DOT: Record<CommissionStatus, string> = {
  active: "bg-emerald-500",
  dormant: "bg-orange-500",
  ended: "bg-sky-500",
  unknown: "bg-orange-500",
};

export const STATUS_TEXT: Record<CommissionStatus, string> = {
  active: "text-emerald-700 dark:text-emerald-400",
  dormant: "text-orange-700 dark:text-orange-400",
  ended: "text-sky-700 dark:text-sky-400",
  unknown: "text-orange-700 dark:text-orange-400",
};

// Sort weight when grouping "by status"; keeps unknown adjacent to dormant.
export const STATUS_ORDER: Record<CommissionStatus, number> = {
  active: 0,
  dormant: 1,
  unknown: 2,
  ended: 3,
};
