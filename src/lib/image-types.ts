/**
 * A build-time-optimized image flattened into plain data.
 *
 * Islands cannot import astro:assets (it is server-only), so pages resolve
 * images and hand the result across the island boundary as serialisable props.
 * This type lives apart from images.ts so importing it never pulls sharp or the
 * astro:assets virtual module into a client bundle.
 */
export interface ResolvedImage {
  src: string;
  srcset: string;
  sizes?: string;
  width: number;
  height: number;
  blurDataURL: string | null;
  /** SVGs bypass raster optimization and render at their intrinsic size. */
  isVector: boolean;
}
