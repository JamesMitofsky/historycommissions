import { ImageResponse } from "next/og";
import fs from "fs";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "History Commissions — A digital archive of joint historians' commissions";

export default function Image() {
  const heroData = fs.readFileSync(path.join(process.cwd(), "public/hero.webp"));
  const heroBg = `data:image/webp;base64,${heroData.toString("base64")}`;

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: "flex", position: "relative" }}>
        {/* Background image */}
        <img
          src={heroBg}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }}
        />
        {/* Gradient overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.75) 100%)",
          }}
        />
        {/* Text */}
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
              color: "rgba(255,255,255,0.6)",
              fontSize: 20,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              fontFamily: "sans-serif",
              marginBottom: 14,
            }}
          >
            A DIGITAL ARCHIVE
          </div>
          <div
            style={{
              color: "white",
              fontSize: 64,
              fontWeight: 700,
              fontFamily: "serif",
              lineHeight: 1.15,
            }}
          >
            History Commissions
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.7)",
              fontSize: 26,
              fontFamily: "sans-serif",
              marginTop: 16,
              lineHeight: 1.4,
            }}
          >
            Joint historians&apos; commissions and dialogues from around the world
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
