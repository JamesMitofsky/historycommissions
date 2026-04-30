import fs from "fs";
import path from "path";
import sharp from "sharp";

export async function getBlurDataURL(imageSrc: string | null): Promise<string | null> {
  if (!imageSrc) return null;
  const filePath = path.join(process.cwd(), "public", imageSrc);
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
