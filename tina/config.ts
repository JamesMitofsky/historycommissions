import { defineConfig, type TinaField } from "tinacms";
import {
  CountryField,
  CountryListField,
  DateOnlyField,
  LanguageField,
} from "./fields";

/**
 * TinaCMS schema for the editor at /admin.
 *
 * Tina rewrites a whole file on save from the fields declared here, so any key
 * a content file carries that is missing below would be silently dropped the
 * first time someone saves that entry. That is why `nav` (general settings)
 * and `updated` (posts) are declared even though Decap never exposed them.
 * Tina's own indexer accepts undeclared keys without complaint, so
 * `pnpm validate:tina-schema` checks for them in CI instead.
 *
 * After changing this file, run `pnpm tina:lock` and commit
 * tina/tina-lock.json: TinaCloud reads the schema from the lock, not from here.
 *
 * Paths and formats are unchanged from Decap, so the site's loaders and the
 * Zod schemas in src/ read exactly what they did before.
 */

// Netlify sets HEAD to the branch being built; the rest are fallbacks for
// other CI and for local builds.
const branch =
  process.env.TINA_BRANCH ??
  process.env.HEAD ??
  process.env.GITHUB_HEAD_REF ??
  process.env.GITHUB_REF_NAME ??
  "main";

const STATUS_OPTIONS = [
  { label: "Active", value: "active" },
  { label: "Dormant", value: "dormant" },
  { label: "Ended", value: "ended" },
  { label: "Unknown", value: "unknown" },
];

/** Lowercase ASCII slug, as Decap produced for new entries. */
function slugify(value: unknown): string {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function requireCountries(value: string[] | undefined) {
  if (!value || value.length === 0) return "Add at least one country.";
}

const publishedField: TinaField = {
  type: "boolean",
  name: "isPublished",
  label: "Published",
  description:
    "Only published entries appear on the site. New entries start unpublished — turn this on when the entry is ready. Edits to a published entry go live as soon as you save.",
};

function dateOnly(name: string, label: string, description: string): TinaField {
  return {
    type: "string",
    name,
    label,
    description,
    ui: { component: DateOnlyField },
  };
}

export default defineConfig({
  branch,
  clientId: process.env.TINA_CLIENT_ID ?? null,
  token: process.env.TINA_TOKEN ?? null,

  build: {
    outputFolder: "admin",
    publicFolder: "public",
  },

  // Uploads land in src/assets/images so Astro optimizes them at build time
  // (astro:assets only processes images under src/). With src/assets as the
  // media "public folder", Tina writes "/images/foo.webp" into content — the
  // same path Decap wrote — and src/lib/images.ts maps it back to the asset.
  media: {
    tina: {
      publicFolder: "src/assets",
      mediaRoot: "images",
    },
  },

  schema: {
    collections: [
      {
        name: "post",
        label: "Posts",
        path: "content/posts",
        format: "md",
        ui: {
          filename: {
            // "{{year}}-{{month}}-{{day}}-{{slug}}", as Decap named them.
            slugify: (values) => {
              const date = values?.date ? new Date(values.date) : new Date();
              const day = Number.isNaN(date.getTime()) ? new Date() : date;
              return `${day.toISOString().slice(0, 10)}-${slugify(values?.title)}`;
            },
          },
        },
        defaultItem: () => ({
          isPublished: false,
          date: new Date().toISOString(),
        }),
        fields: [
          publishedField,
          {
            type: "string",
            name: "title",
            label: "Title",
            isTitle: true,
            required: true,
            description:
              "Headline shown at the top of the published post and in post listings.",
          },
          {
            type: "datetime",
            name: "date",
            label: "Publish Date",
            ui: { timeFormat: "HH:mm" },
            description:
              "When the post is published. Posts are ordered by this date, newest first.",
          },
          {
            type: "datetime",
            name: "updated",
            label: "Last Updated",
            ui: { timeFormat: "HH:mm" },
            description: "Optional. When the post was last substantively revised.",
          },
          {
            type: "string",
            name: "author",
            label: "Author",
            description:
              "Shown as a byline under the title. Leave blank to show no author.",
          },
          {
            type: "string",
            name: "tags",
            label: "Tags",
            list: true,
            ui: { component: CountryListField },
            description:
              "Pick country names from the dropdown (e.g. Poland, Germany). Each tag draws a flag and adds the country to the post's map. Typing a value not on the list is allowed but may not resolve to a flag/map.",
          },
          {
            type: "image",
            name: "image",
            label: "Image",
            description: "Featured image shown at the top of the post.",
          },
          {
            type: "string",
            name: "imageAttribution",
            label: "Image Attribution",
            description:
              "Photo credit shown in small text under the image. '(CC BY-SA 3.0)' is added automatically.",
          },
          {
            type: "string",
            name: "imageAttributionUrl",
            label: "Image Attribution URL",
            description:
              "Optional link for the photo credit (e.g. the source page). If set, the credit text becomes clickable.",
          },
          {
            type: "rich-text",
            name: "body",
            label: "Body",
            isBody: true,
            // Plain Markdown rather than Tina's default MDX parser: posts are
            // .md files rendered by Astro's Markdown pipeline, and MDX would
            // reject ordinary characters like a bare "<" or "{".
            parser: { type: "markdown" },
            overrides: {
              toolbar: [
                "heading",
                "bold",
                "italic",
                "strikethrough",
                "link",
                "quote",
                "ul",
                "ol",
                "image",
              ],
            },
            description:
              "The main article text. Use the toolbar for headings, lists, links, and quotes.",
          },
        ],
      },

      {
        name: "commission",
        label: "Commissions",
        path: "content/commissions",
        format: "json",
        ui: {
          filename: {
            slugify: (values) => slugify(values?.name?.englishName),
          },
        },
        defaultItem: () => ({
          isPublished: false,
          status: "unknown",
          linkStatus: "not_located",
        }),
        fields: [
          publishedField,
          {
            type: "object",
            name: "name",
            label: "Name",
            required: true,
            fields: [
              {
                type: "string",
                name: "englishName",
                label: "Primary Name",
                isTitle: true,
                required: true,
                description:
                  "The main name, used in the page title, listings, and search. Usually the English name.",
              },
              {
                type: "object",
                name: "translations",
                label: "Translations",
                list: true,
                description:
                  "The commission's name in other languages. Add one row per language.",
                ui: {
                  itemProps: (item) => ({
                    label: item?.name || item?.language || "New translation",
                  }),
                },
                fields: [
                  {
                    type: "string",
                    name: "language",
                    label: "Language",
                    required: true,
                    ui: { component: LanguageField },
                    description:
                      "Pick a language from the dropdown (e.g. English, German). Stored as its short code (en, de). The 'en' entry is what surfaces the English name across the site.",
                  },
                  {
                    type: "string",
                    name: "name",
                    label: "Name",
                    required: true,
                    description: "The commission's name written in the language above.",
                  },
                ],
              },
            ],
          },
          dateOnly(
            "proposedDate",
            "Proposed Date",
            "When the commission was first proposed. Shown in the details table as 'Proposed'. Use Jan 1 if only the year is known.",
          ),
          dateOnly(
            "startDate",
            "Start Date",
            "When the commission actually began. Shown as 'Founded' and used when sorting the list by date. Use Jan 1 if only the year is known.",
          ),
          dateOnly(
            "lastActiveStatusDate",
            "Last Active Status Date",
            "Most recent date its activity was confirmed. Shown as 'Last active'. Use Jan 1 if only the year is known.",
          ),
          {
            type: "string",
            name: "lastActiveStatus",
            label: "Last Active Status",
            options: STATUS_OPTIONS,
            description:
              "Last known activity, shown as plain text in the details table. Same vocabulary as the colored Status badge below, but this is a historical note recording the status as of the 'Last Active Status Date'.",
          },
          {
            type: "string",
            name: "memberCountries",
            label: "Member Countries",
            list: true,
            ui: { component: CountryListField, validate: requireCountries },
            description:
              "Pick country names from the dropdown (e.g. Poland, Germany). These draw the map, the globe arcs, and the flag tags. Picking from the list guarantees correct spelling; typing a value not on the list is allowed but may not render.",
          },
          {
            type: "string",
            name: "sponsoringInstitutions",
            label: "Sponsoring Institutions",
            list: true,
            description:
              "Organizations that established or fund the commission. Shown in the details.",
          },
          {
            type: "string",
            name: "keyTopics",
            label: "Key Topics",
            list: true,
            description:
              "Main research areas. Shown as a bulleted 'Key Topics' list on the page.",
          },
          {
            type: "object",
            name: "publications",
            label: "Publications",
            list: true,
            ui: {
              itemProps: (item) => ({ label: item?.title || "New publication" }),
            },
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true,
                description: "Title of the publication, shown in the Publications list.",
              },
              {
                type: "number",
                name: "year",
                label: "Year",
                description: "Publication year, shown next to the title.",
              },
              {
                type: "string",
                name: "url",
                label: "URL",
                description:
                  "Link to the publication. If set, the title becomes a clickable link.",
              },
              {
                type: "string",
                name: "format",
                label: "Format",
                options: [
                  { label: "Monograph", value: "monograph" },
                  { label: "Proceedings", value: "proceedings" },
                  { label: "Report", value: "report" },
                  { label: "Textbook review", value: "textbook_review" },
                  { label: "Teaching material", value: "teaching_material" },
                  { label: "Other", value: "other" },
                ],
                description:
                  "Document type. Note: this is NOT shown anywhere on the public site yet — for internal categorization only.",
              },
            ],
          },
          {
            type: "string",
            name: "workingGroups",
            label: "Working Groups",
            list: true,
            description:
              "Names of sub-committees or working groups within the commission.",
          },
          {
            type: "string",
            name: "status",
            label: "Status",
            required: true,
            options: STATUS_OPTIONS,
            description: "Current status. Sets the colored badge on the page and list.",
          },
          {
            type: "object",
            name: "chairs",
            label: "Chairs",
            list: true,
            description: "People who lead the commission. Add one row per chair.",
            ui: {
              itemProps: (item) => ({ label: item?.name || "New chair" }),
            },
            fields: [
              {
                type: "string",
                name: "name",
                label: "Name",
                required: true,
                description: "Full name of the chair.",
              },
              {
                type: "string",
                name: "country",
                label: "Country",
                required: true,
                ui: { component: CountryField },
                description:
                  "Country the chair is based in or represents. Pick from the dropdown, or type a value not on the list.",
              },
              {
                type: "string",
                name: "affiliation",
                label: "Affiliation",
                description:
                  "University or institution the chair belongs to (optional).",
              },
            ],
          },
          {
            type: "string",
            name: "url",
            label: "Commission Website",
            description:
              "The site to link to. If the live site is dead, set Link Status to 'Dead' below and we send visitors to the Wayback Machine copy automatically — no need to paste an archive URL.",
          },
          {
            type: "string",
            name: "linkStatus",
            label: "Link Status",
            options: [
              { label: "Live — link directly to the site", value: "live" },
              {
                label: "Dead — send visitors to the Wayback Machine archive",
                value: "archived",
              },
              { label: "Not located yet — no link shown", value: "not_located" },
            ],
            description:
              "Live shows a Website link. Dead builds an automatic Wayback Machine archive link from the URL above. Not located hides the link (use while still searching for the site).",
          },
          {
            type: "object",
            name: "archivableDocuments",
            label: "Archivable Documents",
            list: true,
            description:
              "Important documents worth preserving. Add one row per document.",
            ui: {
              itemProps: (item) => ({ label: item?.title || "New document" }),
            },
            fields: [
              {
                type: "string",
                name: "title",
                label: "Title",
                required: true,
                description: "Name of the document.",
              },
              {
                type: "string",
                name: "url",
                label: "URL",
                required: true,
                description: "Direct link to the document.",
              },
            ],
          },
        ],
      },

      {
        name: "generalSettings",
        label: "Site Settings",
        path: "content/settings",
        format: "json",
        match: { include: "general" },
        ui: { allowedActions: { create: false, delete: false } },
        fields: [
          {
            type: "string",
            name: "siteTitle",
            label: "Site Title",
            required: true,
            isTitle: true,
            description: "Shown in the masthead, browser tab, footer and feeds.",
          },
          {
            type: "string",
            name: "kicker",
            label: "Masthead Kicker",
            required: true,
            description: "Small uppercase line above the title (e.g. 'A digital archive').",
          },
          {
            type: "string",
            name: "description",
            label: "Meta Description",
            required: true,
            ui: { component: "textarea" },
            description: "Used for SEO and social sharing previews.",
          },
          {
            type: "object",
            name: "nav",
            label: "Navigation",
            list: true,
            fields: [
              { type: "string", name: "href", label: "Path", required: true },
              { type: "string", name: "label", label: "Label", required: true },
              {
                type: "string",
                name: "shortLabel",
                label: "Short Label",
                required: true,
                description: "Used where space is tight, e.g. on phones.",
              },
            ],
            ui: {
              itemProps: (item) => ({ label: item?.label || "New link" }),
            },
            description: "Links in the site header, in order.",
          },
          {
            type: "object",
            name: "footer",
            label: "Footer",
            fields: [
              { type: "string", name: "tagline", label: "Tagline", required: true },
              {
                type: "string",
                name: "copyrightHolder",
                label: "Copyright Holder",
                required: true,
                description: "Name after the © year.",
              },
            ],
          },
          {
            type: "object",
            name: "og",
            label: "Social Sharing Image",
            fields: [
              {
                type: "string",
                name: "subtitle",
                label: "Subtitle",
                required: true,
                description: "Caption on the link-preview image.",
              },
            ],
          },
          {
            type: "object",
            name: "feeds",
            label: "RSS Feeds",
            fields: [
              { type: "string", name: "postsTitle", label: "Posts Feed Title", required: true },
              {
                type: "string",
                name: "postsDescription",
                label: "Posts Feed Description",
                required: true,
                ui: { component: "textarea" },
              },
              {
                type: "string",
                name: "commissionsTitle",
                label: "Commissions Feed Title",
                required: true,
              },
              {
                type: "string",
                name: "commissionsDescription",
                label: "Commissions Feed Description",
                required: true,
                ui: { component: "textarea" },
              },
            ],
          },
        ],
      },

      {
        name: "aboutPage",
        label: "About Page",
        path: "content/settings",
        format: "json",
        match: { include: "about" },
        ui: { allowedActions: { create: false, delete: false } },
        // Body and contact stay Markdown strings rather than Tina rich-text:
        // inside a JSON file, rich-text is stored as Tina's own AST object, not
        // Markdown, which would change the file format the site reads (see
        // src/lib/markdown.ts). A textarea keeps the stored text byte-for-byte.
        fields: [
          {
            type: "string",
            name: "title",
            label: "Page Title",
            isTitle: true,
            required: true,
          },
          {
            type: "string",
            name: "body",
            label: "Body",
            required: true,
            ui: { component: "textarea" },
            description:
              "Main about text, in Markdown: *italic*, **bold**, [link text](https://…), blank line between paragraphs.",
          },
          {
            type: "string",
            name: "contact",
            label: "Contact / Maintainer",
            required: true,
            ui: { component: "textarea" },
            description:
              "Shown in smaller text below the body, in Markdown. Use links for names and emails.",
          },
        ],
      },
    ],
  },
});
