/**
 * Class lists for the page chrome that more than one renderer draws.
 *
 * The site draws these from Astro components (Layout, PageContainer, Prose);
 * the CMS preview (src/cms-preview) draws a draft with the same look and cannot
 * run Astro components, which only render on the server. Spelling the classes
 * out in both places would let the preview drift from the site the first time
 * one of them changed, so both read them from here.
 *
 * Tailwind scans this file like any other source, so the utilities named here
 * are generated whether or not a page happens to spell them out too.
 */

/** <html> in Layout.astro. The 20px root is what every rem on the site scales from. */
export const DOCUMENT_CLASS = "h-full antialiased text-[20px]";

/** <body> in Layout.astro. */
export const BODY_CLASS =
  "min-h-full flex flex-col font-sans text-base leading-[1.65] antialiased";

/** The content column — see PageContainer.astro for why it owns the top gap. */
export const PAGE_COLUMN_CLASS = "max-w-2xl mx-auto px-6 pt-12 pb-14";

/** Typography for rendered Markdown — see Prose.astro. */
export const PROSE_CLASS =
  "prose prose-neutral max-w-none dark:prose-invert prose-a:text-sky-600 hover:prose-a:text-sky-700 prose-a:decoration-sky-300 prose-a:underline-offset-4 prose-a:transition-colors dark:prose-a:text-sky-400 dark:hover:prose-a:text-sky-300 dark:prose-a:decoration-sky-600";
