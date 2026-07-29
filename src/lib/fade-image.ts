import type { Action } from "svelte/action";

/**
 * Marks an image loaded so the [data-fade-img] rule in globals.css can fade it
 * in over its blur placeholder.
 *
 * Islands need this action rather than the global initFadeImages() pass in
 * Layout.astro: their images are created and destroyed as state changes (a
 * search that narrows the list, say), long after that one-shot sweep has run.
 */
export const fadeImage: Action<HTMLImageElement> = (node) => {
  const mark = () => node.setAttribute("data-loaded", "");

  // A cached image can already be complete before the listener attaches.
  if (node.complete) {
    mark();
  } else {
    node.addEventListener("load", mark, { once: true });
  }

  return {
    destroy() {
      node.removeEventListener("load", mark);
    },
  };
};
