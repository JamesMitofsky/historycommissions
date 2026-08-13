import type { Attachment } from "svelte/attachments";

/**
 * Marks an image loaded so the [data-fade-img] rule in globals.css can fade it
 * in over its blur placeholder.
 *
 * Islands need this rather than the global initFadeImages() pass in
 * Layout.astro: their images are created and destroyed as state changes (a
 * search that narrows the list, say), long after that one-shot sweep has run.
 */
export const fadeImage: Attachment<HTMLImageElement> = (node) => {
  // A cached image can already be complete before the attachment runs, in which
  // case there is no listener to register and nothing to tear down.
  if (node.complete) {
    node.setAttribute("data-loaded", "");
    return;
  }

  const mark = () => node.setAttribute("data-loaded", "");
  node.addEventListener("load", mark, { once: true });
  return () => node.removeEventListener("load", mark);
};
