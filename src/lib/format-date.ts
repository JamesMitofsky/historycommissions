/**
 * Format a post date deterministically.
 *
 * Post dates are stored as UTC midnight ISO strings (see get-posts.ts). Without a
 * pinned timeZone, toLocaleDateString uses the runtime's local zone, so the build
 * (UTC) and the browser (local) produce different text. In a hydrated island that
 * mismatch makes the client discard the prerendered markup and rebuild the
 * subtree, replaying entry animations and remounting images. Pinning UTC keeps
 * the two identical.
 */
export function formatPostDate(
  date: string | Date,
  month: "short" | "long" = "short",
): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month,
    day: "numeric",
    timeZone: "UTC",
  });
}
