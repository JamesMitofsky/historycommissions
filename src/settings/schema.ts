import { z } from "astro/zod";

export const NavLinkSchema = z.object({
  href: z.string().min(1),
  label: z.string().min(1),
  shortLabel: z.string().min(1),
});

export const GeneralSettingsSchema = z.object({
  siteTitle: z.string().min(1),
  kicker: z.string().min(1),
  description: z.string().min(1),
  nav: z.array(NavLinkSchema).min(1),
  footer: z.object({
    tagline: z.string().min(1),
    copyrightHolder: z.string().min(1),
  }),
  og: z.object({
    subtitle: z.string().min(1),
  }),
  feeds: z.object({
    postsTitle: z.string().min(1),
    postsDescription: z.string().min(1),
    commissionsTitle: z.string().min(1),
    commissionsDescription: z.string().min(1),
  }),
});

export const AboutSettingsSchema = z.object({
  title: z.string().min(1),
  body: z.string().min(1),
  contact: z.string().min(1),
});

export type NavLink = z.infer<typeof NavLinkSchema>;
export type GeneralSettings = z.infer<typeof GeneralSettingsSchema>;
export type AboutSettings = z.infer<typeof AboutSettingsSchema>;
