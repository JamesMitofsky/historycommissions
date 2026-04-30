import { ImageResponse } from "next/og";
import path from "path";
import sharp from "sharp";
import { getPost } from "@/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

async function loadImageAsJpegDataUrl(relativePath: string): Promise<string | null> {
  try {
    const abs = path.join(process.cwd(), "public", relativePath);
    const jpeg = await sharp(abs).jpeg({ quality: 85 }).toBuffer();
    return `data:image/jpeg;base64,${jpeg.toString("base64")}`;
  } catch {
    return null;
  }
}

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let post;
  try {
    post = await getPost(slug);
  } catch {
    post = null;
  }

  const bgSrc =
    (post?.image ? await loadImageAsJpegDataUrl(post.image) : null) ??
    (await loadImageAsJpegDataUrl("/hero.webp")) ??
    "";

  const title = post?.title ?? "History Commissions";

  return new ImageResponse(
    (
      <div
        style={{
          width: 1200,
          height: 630,
          display: "flex",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <img
          src={bgSrc}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.85) 100%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            padding: "48px 72px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              color: "rgba(255,255,255,0.55)",
              fontSize: 20,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: 16,
            }}
          >
            HISTORY COMMISSIONS
          </div>
          <div
            style={{
              color: "white",
              fontSize: title.length > 60 ? 42 : 52,
              fontWeight: 700,
              fontFamily: "serif",
              lineHeight: 1.2,
              maxWidth: 1000,
            }}
          >
            {title}
          </div>
          {post?.date && (
            <div
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 22,
                fontFamily: "sans-serif",
                marginTop: 20,
              }}
            >
              {new Date(post.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </div>
          )}
        </div>
      </div>
    )
  );
}
