/**
 * Format a post date deterministically.
 *
 * Post dates are stored as UTC midnight ISO strings (see get-posts.ts). Without a
 * pinned timeZone, toLocaleDateString uses the runtime's local zone, so the server
 * (UTC) and the browser (local) render different text — a hydration mismatch that
 * forces React to re-render the subtree, replaying entry animations and remounting
 * images. Pinning UTC keeps server and client identical.
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
