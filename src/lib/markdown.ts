import { markdownToHtml } from "satteri";

/**
 * Render a Markdown string that did not come from a .md file — the About page
 * body and contact block, which Decap stores as fields inside a JSON settings
 * file rather than as content files.
 *
 * satteri is the same engine Astro's own Markdown pipeline uses, so these
 * fields render identically to posts (GFM and smart punctuation included)
 * rather than diverging the way a second parser would.
 */
export function renderMarkdown(source: string): string {
  return markdownToHtml(source).html;
}
