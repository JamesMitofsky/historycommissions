import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

/**
 * Open Graph card renderer: JSX-ish tree → SVG (satori) → PNG (resvg + sharp).
 *
 * satori ships no fonts of its own, so the two faces used in the card are read
 * from the same vendored family the site is built from — see the `fonts` block
 * in astro.config.mjs and scripts/subset-fonts.py, which emits these .woff
 * alongside the .woff2 the browser gets. The format is the reason for the
 * split: satori reads ttf/otf/woff and not woff2.
 *
 * The sans face is the static Regular rather than the variable file the site
 * serves, because satori resolves a variable font to its default instance and
 * cannot pick a weight along the axis.
 */
const FONT_FILES = {
  sans: "src/assets/fonts/DMSans-Regular.woff",
  serif: "src/assets/fonts/LibertinusSerif-Bold.woff",
} as const;

function readFont(relativePath: string): Buffer {
  return fs.readFileSync(path.join(process.cwd(), relativePath));
}

let fontsCache: Awaited<ReturnType<typeof loadFonts>> | null = null;

async function loadFonts() {
  return [
    {
      name: "sans",
      data: readFont(FONT_FILES.sans),
      weight: 400 as const,
      style: "normal" as const,
    },
    {
      name: "serif",
      data: readFont(FONT_FILES.serif),
      weight: 700 as const,
      style: "normal" as const,
    },
  ];
}

let heroCache: string | null = null;

/** The hero, re-encoded as a JPEG data URI — satori cannot read WebP. */
async function heroDataUri(): Promise<string> {
  if (heroCache) return heroCache;
  const jpeg = await sharp(path.join(process.cwd(), "src/assets/hero.webp"))
    .jpeg({ quality: 85 })
    .toBuffer();
  heroCache = `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  return heroCache;
}

export const OG_SIZE = { width: 1200, height: 630 } as const;

export interface OgCardContent {
  kicker: string;
  title: string;
  subtitle?: string | null;
}

/**
 * satori accepts plain element objects, so the card is built as data rather than
 * JSX — this project has no JSX runtime any more.
 */
function card(content: OgCardContent, hero: string) {
  const textBlock: unknown[] = [
    {
      type: "div",
      props: {
        style: {
          color: "rgba(255,255,255,0.6)",
          fontSize: 20,
          letterSpacing: "0.18em",
          fontFamily: "sans",
          marginBottom: 14,
        },
        children: content.kicker.toUpperCase(),
      },
    },
    {
      type: "div",
      props: {
        style: {
          color: "white",
          fontSize: 64,
          fontWeight: 700,
          fontFamily: "serif",
          lineHeight: 1.15,
        },
        children: content.title,
      },
    },
  ];

  if (content.subtitle) {
    textBlock.push({
      type: "div",
      props: {
        style: {
          color: "rgba(255,255,255,0.7)",
          fontSize: 26,
          fontFamily: "sans",
          marginTop: 16,
          lineHeight: 1.4,
        },
        children: content.subtitle,
      },
    });
  }

  return {
    type: "div",
    props: {
      style: {
        width: OG_SIZE.width,
        height: OG_SIZE.height,
        display: "flex",
        position: "relative",
      },
      children: [
        {
          type: "img",
          props: {
            src: hero,
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 100%)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              padding: "48px 72px",
              display: "flex",
              flexDirection: "column",
            },
            children: textBlock,
          },
        },
      ],
    },
  };
}

export async function renderOgImage(content: OgCardContent): Promise<Buffer> {
  fontsCache ??= await loadFonts();
  const hero = await heroDataUri();

  const svg = await satori(card(content, hero) as never, {
    ...OG_SIZE,
    fonts: fontsCache,
  });

  return Buffer.from(
    new Resvg(svg, {
      fitTo: { mode: "width", value: OG_SIZE.width },
    })
      .render()
      .asPng(),
  );
}
