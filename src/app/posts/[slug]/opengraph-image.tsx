import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";
import { getPost } from "@/blog";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

function loadImageAsDataUrl(relativePath: string): string | null {
  try {
    const abs = path.join(process.cwd(), "public", relativePath);
    const data = fs.readFileSync(abs);
    const ext = path.extname(relativePath).slice(1).toLowerCase();
    const mime =
      ext === "jpg" || ext === "jpeg"
        ? "image/jpeg"
        : ext === "png"
          ? "image/png"
          : "image/webp";
    return `data:${mime};base64,${data.toString("base64")}`;
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
    post = getPost(slug);
  } catch {
    post = null;
  }

  const bgSrc =
    (post?.image ? loadImageAsDataUrl(post.image) : null) ??
    (() => {
      const heroData = fs.readFileSync(
        path.join(process.cwd(), "public/hero.webp")
      );
      return `data:image/webp;base64,${heroData.toString("base64")}`;
    })();

  const title = post?.title ?? "History Commissions";

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative" }}>
        <img
          src={bgSrc}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
          }}
        />
        <div
          style={{
            position: "absolute",
            inset: 0,
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
    ),
    { width: 1200, height: 630 }
  );
}
