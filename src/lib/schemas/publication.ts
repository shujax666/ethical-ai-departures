import { z } from "zod"

// --- DB row schema (snake_case — matches Supabase response) ---

export const publicationRowSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  title: z.string(),
  url: z.string().nullable(),
  publication_type: z
    .enum([
      "paper",
      "white_paper",
      "report",
      "preprint",
      "essay",
      "resignation_letter",
      "legal_analysis",
      "forecast_essay",
      "testimony",
    ])
    .nullable(),
  publisher: z.string().nullable(),
  published_date: z.string().nullable(),
  published_date_precision: z.enum(["day", "month", "year"]).catch("day"),
  last_updated_at: z.string().nullish().catch(null),
  abstract: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
})

// --- Transformed schema (camelCase — used in components) ---

export const publicationSchema = publicationRowSchema.transform((row) => ({
  id: row.id,
  profileId: row.profile_id,
  title: row.title,
  url: row.url,
  publicationType: row.publication_type,
  publisher: row.publisher,
  publishedDate: row.published_date,
  publishedDatePrecision: row.published_date_precision,
  lastUpdatedAt: row.last_updated_at ?? null,
  abstract: row.abstract,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
}))

// --- Publication with joined profile info (for predictions pages) ---

export const publicationWithProfileRowSchema = publicationRowSchema.extend({
  profiles: z.object({
    name: z.string(),
    slug: z.string(),
    profile_concern_tags: z
      .array(z.object({ concern_tags: z.object({ slug: z.string() }) }))
      .default([]),
  }),
})

export const publicationWithProfileSchema = publicationWithProfileRowSchema.transform((row) => ({
  id: row.id,
  profileId: row.profile_id,
  profileName: row.profiles.name,
  profileSlug: row.profiles.slug,
  concernTagSlugs: row.profiles.profile_concern_tags.map((pct) => pct.concern_tags.slug),
  title: row.title,
  url: row.url,
  publicationType: row.publication_type,
  publisher: row.publisher,
  publishedDate: row.published_date,
  publishedDatePrecision: row.published_date_precision,
  lastUpdatedAt: row.last_updated_at ?? null,
  abstract: row.abstract,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
}))

// --- Exported types ---

export type PublicationRow = z.input<typeof publicationSchema>
export type Publication = z.output<typeof publicationSchema>

export type PublicationWithProfile = z.output<typeof publicationWithProfileSchema>
