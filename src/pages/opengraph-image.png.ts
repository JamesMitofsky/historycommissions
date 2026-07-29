import type { APIRoute } from "astro";
import { getGeneralSettings } from "@/settings";
import { renderOgImage } from "@/lib/og-image";

export const GET: APIRoute = async () => {
  const general = getGeneralSettings();

  const png = await renderOgImage({
    kicker: general.kicker,
    title: general.siteTitle,
    subtitle: general.og.subtitle,
  });

  return new Response(new Uint8Array(png), {
    headers: { "Content-Type": "image/png" },
  });
};
