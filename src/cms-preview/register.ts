/**
 * Make the CMS preview draw a draft the way the site will.
 *
 * Loaded by src/pages/admin/index.astro after the Sveltia bundle, so `CMS` is
 * already defined; Sveltia accepts registrations after it has started and
 * re-renders any open preview.
 *
 * Three things go into the preview frame, each taken from the site rather than
 * imitated:
 *
 * - The stylesheet. `?inline` runs globals.css through the same Vite and
 *   Tailwind pipeline as the site's own pages, and Tailwind scans the same
 *   sources, so the frame gets the same utilities, theme and typography the
 *   pages are styled with. (`?url` would have been the obvious import, but
 *   Astro's build does not emit the file it points to.)
 * - The fonts. Astro's <Font> writes the @font-face rules and the
 *   --font-sans / --font-serif variables; the admin page renders them into a
 *   <template>, and they are copied into each preview document from there.
 * - The markup. The templates mount the page bodies the site renders —
 *   CommissionArticle and PostArticle — with the draft as their data. They
 *   load on first use; see svelte-template.svelte.ts.
 */
import type { CustomPreviewTemplateProps } from "@sveltia/cms";
import siteCss from "@/styles/globals.css?inline";
import { BODY_CLASS, DOCUMENT_CLASS } from "@/lib/page-classes";
import { toCommission, toPostDraft } from "./draft";
import { svelteTemplate } from "./svelte-template.svelte";

const FONTS_ID = "site-fonts";

/**
 * Dress a preview document as a page of the site: the root and body classes
 * from Layout.astro (the root's 20px is what every rem scales from) and the
 * font faces.
 *
 * The faces are inserted as a <style> rather than registered as a preview
 * stylesheet because registered CSS is served from a blob: URL, and the
 * root-relative font URLs Astro writes ("/_astro/fonts/…") cannot resolve
 * against one. Inside the document they resolve against its <base>, which
 * Sveltia sets to this site's origin.
 */
function dressDocument(doc: Document) {
  doc.documentElement.className = DOCUMENT_CLASS;
  doc.body.className = BODY_CLASS;
  if (doc.getElementById(FONTS_ID)) return;
  const fonts = document.querySelector<HTMLTemplateElement>("#preview-fonts");
  if (!fonts) return;
  const style = doc.createElement("style");
  style.id = FONTS_ID;
  style.textContent = Array.from(
    fonts.content.querySelectorAll("style"),
    (s) => s.textContent,
  ).join("\n");
  doc.head.append(style);
}

/**
 * Where the preview can load an image field's file from. A file uploaded in
 * this session and not yet saved is held in the draft as the blob: URL itself;
 * a saved one is held as its public path ("/images/…"), which only exists on
 * the site once a build has run, so it is looked up in the CMS's asset store.
 */
function imageUrl(
  value: string | null,
  cms: CustomPreviewTemplateProps,
): string | null {
  if (!value) return null;
  if (/^(blob|data|https?):/.test(value)) return value;
  return cms.getAsset(value)?.url ?? null;
}

function data(cms: CustomPreviewTemplateProps): unknown {
  return cms.entry.get("data")?.toJS();
}

/**
 * One function for the life of the page: a new one per keystroke would count as
 * a changed prop and re-render the post body for edits to any other field.
 */
const renderBody = (target: HTMLElement, markdown: string) =>
  CMS.renderRichText(target, markdown);

CMS.registerPreviewStyle(siteCss, { raw: true });

// Names are the collection names in public/admin/config.yml.
CMS.registerPreviewTemplate(
  "commissions",
  svelteTemplate(
    () => import("./CommissionPreview.svelte"),
    (cms) => ({ commission: toCommission(data(cms)) }),
    dressDocument,
  ),
);

CMS.registerPreviewTemplate(
  "posts",
  svelteTemplate(
    () => import("./PostPreview.svelte"),
    (cms) => {
      const post = toPostDraft(data(cms));
      return {
        post,
        imageUrl: imageUrl(post.image, cms),
        renderBody,
      };
    },
    dressDocument,
  ),
);
