import { mount, unmount, type Component } from "svelte";
import type { CustomPreviewTemplateProps } from "@sveltia/cms";

/**
 * Sveltia only accepts preview templates as React components, and the site's
 * components are Svelte. This is the seam between them: a class component —
 * Sveltia exposes `createClass` and `h` as globals for exactly this, so no
 * React of our own is bundled — that renders one empty element and mounts a
 * Svelte component into it.
 *
 * The component is loaded on first use rather than bundled with the admin
 * page. It brings the map (d3) and the country resolver (the world-countries
 * dataset) with it, several hundred kB that an editor who never opens a
 * preview has no use for and that the CMS's own start-up should not wait on.
 *
 * Sveltia re-renders the template with fresh props on every keystroke. Those
 * are mapped to the Svelte component's props and written into the `$state`
 * object it was mounted with, so Svelte updates what changed in place instead
 * of the preview being torn down and rebuilt each time. The write is a patch,
 * not a replacement: the mapping builds new objects and arrays on every call,
 * and swapping in a new-but-equal country list would redraw the map for every
 * character typed into any field. Patching leaf by leaf leaves untouched parts
 * of the `$state` tree untouched, so only what reads a changed value re-runs.
 */
// `any` rather than `unknown` values: Svelte's own constraint on component
// props, and the only one an `interface Props` satisfies.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function svelteTemplate<P extends Record<string, any>>(
  load: () => Promise<{ default: Component<P> }>,
  toProps: (cms: CustomPreviewTemplateProps) => P,
  setup?: (doc: Document) => void,
): unknown {
  return createClass({
    componentDidMount(this: Bridge<P>) {
      setup?.(this.props.document);
      load().then(
        ({ default: Svelte }) => {
          if (this.unmounted) return;
          // Read at resolution rather than at mount, so edits made while the
          // module was loading are not lost.
          const props = $state(toProps(this.props));
          this.svelteProps = props;
          this.app = mount(Svelte, { target: this.root, props });
        },
        (error: unknown) => console.error("CMS preview failed to load", error),
      );
    },
    componentDidUpdate(this: Bridge<P>) {
      if (this.svelteProps) patch(this.svelteProps, toProps(this.props));
    },
    componentWillUnmount(this: Bridge<P>) {
      this.unmounted = true;
      if (this.app) void unmount(this.app);
    },
    render(this: Bridge<P>) {
      return h("div", {
        ref: (el: HTMLElement | null) => {
          if (el) this.root = el;
        },
      });
    },
  });
}

type Tree = Record<string | number, unknown>;

function isTree(value: unknown): value is Tree {
  return typeof value === "object" && value !== null;
}

/**
 * Write `next` into the `$state` proxy `target`, assigning only the leaves that
 * differ. Objects and arrays are recursed into rather than replaced, so a
 * reader of an unchanged branch is not invalidated; anything else, functions
 * included, is compared by identity.
 */
function patch(target: Tree, next: Tree) {
  for (const key of Object.keys(next)) {
    const before = target[key];
    const after = next[key];
    if (
      isTree(before) &&
      isTree(after) &&
      Array.isArray(before) === Array.isArray(after)
    ) {
      patch(before, after);
    } else if (!Object.is(before, after)) {
      target[key] = after;
    }
  }
  if (Array.isArray(target) && Array.isArray(next)) {
    if (target.length > next.length) target.length = next.length;
  } else {
    for (const key of Object.keys(target)) {
      if (!(key in next)) delete target[key];
    }
  }
}

interface Bridge<P> {
  props: CustomPreviewTemplateProps;
  root: HTMLElement;
  svelteProps?: P;
  app?: ReturnType<typeof mount>;
  unmounted?: boolean;
}
