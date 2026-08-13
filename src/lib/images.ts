import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { getImage } from "astro:assets";
import type { ImageMetadata } from "astro";
import type { ResolvedImage } from "./image-types";

/**
 * Post images live in src/assets so astro:assets can optimize them, but Decap
 * CMS writes public-style paths into frontmatter ("/images/foo.webp" — see
 * media_folder/public_folder in public/admin/config.yml). This eagerly globs the
 * asset directory so a frontmatter path can be mapped back to the real module.
 *
 * Eager is deliberate: these all resolve at build time and the metadata objects
 * are tiny, so there is nothing to gain from lazy chunks.
 */
const IMAGE_MODULES = import.meta.glob<{ default: ImageMetadata }>(
  "/src/assets/images/*.{webp,png,jpg,jpeg,avif,gif,svg}",
  { eager: true },
);

const ASSETS_DIR = "src/assets";
const IMAGES_DIR = `${ASSETS_DIR}/images`;

function basename(imagePath: string): string {
  return imagePath.split("/").pop() ?? imagePath;
}

/** Map a frontmatter image path to its optimizable asset, or null if missing. */
export function resolveImage(
  imagePath: string | null | undefined,
): ImageMetadata | null {
  if (!imagePath) return null;
  const mod = IMAGE_MODULES[`/${IMAGES_DIR}/${basename(imagePath)}`];
  return mod?.default ?? null;
}

/** SVGs are vector already — they bypass raster optimization entirely. */
export function isVector(imagePath: string | null | undefined): boolean {
  return !!imagePath && imagePath.toLowerCase().endsWith(".svg");
}

/**
 * Optimize a frontmatter image and flatten it to plain data an island can take
 * as a prop. Returns null when the path resolves to nothing, so callers can
 * treat a missing image the same way they treat an absent one.
 */
export async function resolvePostImage(
  imagePath: string | null | undefined,
  { widths, sizes }: { widths: number[]; sizes: string },
): Promise<ResolvedImage | null> {
  const asset = resolveImage(imagePath);
  if (!asset) return null;

  const blurDataURL = await getBlurDataURL(imagePath);

  if (asset.format === "svg") {
    return {
      src: asset.src,
      srcset: "",
      width: asset.width,
      height: asset.height,
      blurDataURL,
      isVector: true,
    };
  }

  // Never ask for a width larger than the source; Astro does not upscale, and
  // requesting one would emit a duplicate srcset candidate.
  const capped = [...new Set(widths.filter((w) => w <= asset.width))];
  if (capped.length === 0) capped.push(asset.width);

  // `width` caps the fallback `src`. Without it Astro emits the image at its
  // intrinsic size, which for these sources is a multi-megabyte re-encode that
  // no srcset-aware browser would ever request.
  const largest = Math.max(...capped);
  const optimized = await getImage({
    src: asset,
    width: largest,
    widths: capped,
    sizes,
  });

  const scale = largest / asset.width;

  return {
    src: optimized.src,
    srcset: optimized.srcSet.attribute,
    sizes,
    width: largest,
    height: Math.round(asset.height * scale),
    blurDataURL,
    isVector: false,
  };
}

/**
 * An 8px-wide blurred base64 preview, rendered as an opaque layer underneath the
 * real image so the swap has no transparent dip. Build-time only (sharp is a
 * native node module) — never call this from an island.
 *
 * Accepts either a frontmatter path ("/images/foo.webp") or a path relative to
 * src/assets ("hero.webp"); both resolve under src/assets.
 */
export async function getBlurDataURL(
  imagePath: string | null | undefined,
): Promise<string | null> {
  if (!imagePath) return null;
  const filePath = path.join(
    process.cwd(),
    ASSETS_DIR,
    imagePath.replace(/^\//, ""),
  );
  if (!fs.existsSync(filePath)) return null;
  try {
    const { data, info } = await sharp(filePath)
      .resize(8)
      .blur()
      .toBuffer({ resolveWithObject: true });
    const mime = info.format === "svg" ? "image/svg+xml" : `image/${info.format}`;
    return `data:${mime};base64,${data.toString("base64")}`;
  } catch {
    return null;
  }
}
