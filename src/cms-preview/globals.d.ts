/**
 * Globals the Sveltia bundle defines before src/cms-preview runs. `createClass`
 * and `h` are React's, exposed for no-build customisations like the widgets in
 * public/admin/ — typed loosely here because nothing in this repo depends on
 * React's own types.
 */
declare const CMS: typeof import("@sveltia/cms").default;
declare const createClass: (spec: Record<string, unknown>) => unknown;
declare const h: (type: string, props: Record<string, unknown> | null) => unknown;
