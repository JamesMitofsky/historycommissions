/**
 * Flatten Markdown into a plain-text summary for meta descriptions and feed
 * items: drop headings, unwrap links and images to their text, strip inline
 * emphasis markers, and collapse whitespace.
 *
 * Shared so a post's meta description and its feed entry can never drift.
 */
export function excerpt(markdown: string, maxLength: number): string {
  return markdown
    .replace(/^#+\s.+$/gm, "")
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[*_`~]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxLength);
}
