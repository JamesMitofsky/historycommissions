import { z } from "zod";

export const CommissionStatusSchema = z.enum([
  "active",
  "dormant",
  "ended",
  "unknown",
]);

export const LinkStatusSchema = z.enum([
  "working",
  "broken",
  "to_be_located",
]);

export const PublicationFormatSchema = z.enum([
  "report",
  "monograph",
  "proceedings",
  "textbook_review",
  "teaching_material",
  "other",
]);

export const CommissionSchema = z.object({
  slug: z.string().min(1),
  name: z.object({
    englishName: z.string().min(1),
    translations: z
      .array(
        z.object({
          language: z.string().min(1),
          name: z.string().min(1),
        })
      )
      .default([]),
  }),
  proposedDate: z.string().nullable().default(null),
  startDate: z.string().nullable().default(null),
  lastActiveStatusDate: z.string().nullable().default(null),
  lastActiveStatus: z.string().nullable().default(null),
  memberCountries: z.array(z.string()).default([]),
  sponsoringInstitutions: z.array(z.string()).default([]),
  keyTopics: z.array(z.string()).default([]),
  publications: z
    .array(
      z.object({
        title: z.string().min(1),
        year: z.number().int().positive().nullable().default(null),
        url: z.string().nullable().default(null),
        format: PublicationFormatSchema,
      })
    )
    .default([]),
  workingGroups: z.array(z.string()).default([]),
  status: CommissionStatusSchema.default("unknown"),
  chairs: z
    .array(
      z.object({
        name: z.string().min(1),
        country: z.string().min(1),
        affiliation: z.string().nullable().default(null),
      })
    )
    .default([]),
  url: z.string(),
  linkStatus: LinkStatusSchema.default("to_be_located"),
  lastArchivedSnapshot: z.string().nullable().default(null),
  archivableDocuments: z
    .array(
      z.object({
        title: z.string().min(1),
        url: z.string(),
      })
    )
    .default([]),
  draft: z.boolean().default(false),
});

export type Commission = z.infer<typeof CommissionSchema>;
export type CommissionStatus = z.infer<typeof CommissionStatusSchema>;
export type LinkStatus = z.infer<typeof LinkStatusSchema>;
