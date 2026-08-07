import { z } from "zod"

// --- DB row schemas (snake_case — matches Supabase response) ---

export const profileRowSchema = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  photo_url: z.string().nullable(),
  company: z.string(),
  role: z.string(),
  departure_date: z.string(),
  departure_date_precision: z.enum(["day", "month", "year"]).catch("day"),
  effective_departure_date: z.string().nullish().catch(null),
  departure_date_note: z.string().nullish().catch(null),
  seo_description: z.string().nullish().catch(null),
  stated_reason: z.string().nullable(),
  departure_context: z.string().nullable().default(null),
  status: z.enum(["draft", "published", "archived"]),
  // Evidence model (remediation brief 2026-07-22). `.catch()` defaults keep
  // rows parseable before the evidence-model migration has been applied.
  departure_type: z
    .enum(["resigned", "fired", "laid_off", "team_eliminated", "unknown"])
    .catch("unknown"),
  motive_evidence: z
    .enum(["direct", "reported", "alleged", "contextual"])
    .catch("contextual"),
  headline_counted: z.boolean().catch(false),
  motive_quote: z.string().nullish().catch(null),
  claim_status: z.enum(["uncontested", "contested", "pending"]).nullish().catch(null),
  last_reviewed_at: z.string().nullish().catch(null),
  reviewer: z.string().nullish().catch(null),
  correction_note: z.string().nullish().catch(null),
  created_at: z.string(),
  updated_at: z.string(),
})

export const profileSourceRowSchema = z.object({
  id: z.string().uuid(),
  profile_id: z.string().uuid(),
  url: z.string().url(),
  title: z.string().nullable(),
  platform: z.string().nullable(),
  source_type: z
    .enum(["first_party", "reporting", "legal_filing", "official_document", "organization", "reference"])
    .nullish()
    .catch(null),
  published_date: z.string().nullable(),
  created_at: z.string(),
})

export const concernTagRowSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  created_at: z.string(),
})

export const tickerStatsRowSchema = z.object({
  id: z.string().uuid(),
  total_count: z.number().int(),
  ninety_day_count: z.number().int(),
  seniority_breakdown: z.record(z.string(), z.number()).default({}),
  updated_at: z.string(),
})

// --- Transformed schemas (camelCase — used in components) ---

export const profileSchema = profileRowSchema.transform((row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  photoUrl: row.photo_url,
  company: row.company,
  role: row.role,
  departureDate: row.departure_date,
  departureDatePrecision: row.departure_date_precision,
  effectiveDepartureDate: row.effective_departure_date ?? null,
  departureDateNote: row.departure_date_note ?? null,
  seoDescription: row.seo_description ?? null,
  statedReason: row.stated_reason,
  departureContext: row.departure_context,
  status: row.status,
  departureType: row.departure_type,
  motiveEvidence: row.motive_evidence,
  headlineCounted: row.headline_counted,
  motiveQuote: row.motive_quote ?? null,
  claimStatus: row.claim_status ?? null,
  lastReviewedAt: row.last_reviewed_at ?? null,
  reviewer: row.reviewer ?? null,
  correctionNote: row.correction_note ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
}))

export const profileSourceSchema = profileSourceRowSchema.transform((row) => ({
  id: row.id,
  profileId: row.profile_id,
  url: row.url,
  title: row.title,
  platform: row.platform,
  sourceType: row.source_type ?? null,
  publishedDate: row.published_date,
  createdAt: row.created_at,
}))

export const concernTagSchema = concernTagRowSchema.transform((row) => ({
  id: row.id,
  name: row.name,
  slug: row.slug,
  description: row.description,
  createdAt: row.created_at,
}))

export const tickerStatsSchema = tickerStatsRowSchema.transform((row) => ({
  id: row.id,
  totalCount: row.total_count,
  ninetyDayCount: row.ninety_day_count,
  seniorityBreakdown: row.seniority_breakdown,
  updatedAt: row.updated_at,
}))

// --- Profile with concern tags (joined query result) ---

export const profileWithTagsRowSchema = profileRowSchema.extend({
  profile_concern_tags: z.array(z.object({
    concern_tags: z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    }),
  })).default([]),
})

export const profileWithTagsSchema = profileWithTagsRowSchema.transform((row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  photoUrl: row.photo_url,
  company: row.company,
  role: row.role,
  departureDate: row.departure_date,
  departureDatePrecision: row.departure_date_precision,
  effectiveDepartureDate: row.effective_departure_date ?? null,
  departureDateNote: row.departure_date_note ?? null,
  seoDescription: row.seo_description ?? null,
  statedReason: row.stated_reason,
  departureContext: row.departure_context,
  status: row.status,
  departureType: row.departure_type,
  motiveEvidence: row.motive_evidence,
  headlineCounted: row.headline_counted,
  motiveQuote: row.motive_quote ?? null,
  claimStatus: row.claim_status ?? null,
  lastReviewedAt: row.last_reviewed_at ?? null,
  reviewer: row.reviewer ?? null,
  correctionNote: row.correction_note ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  concernTags: row.profile_concern_tags.map((pct) => ({
    id: pct.concern_tags.id,
    name: pct.concern_tags.name,
    slug: pct.concern_tags.slug,
  })),
}))

// --- Profile detail (with tags + sources, for detail page) ---

export const profileDetailRowSchema = profileRowSchema.extend({
  profile_concern_tags: z.array(z.object({
    concern_tags: z.object({
      id: z.string().uuid(),
      name: z.string(),
      slug: z.string(),
    }),
  })).default([]),
  profile_sources: z.array(z.object({
    id: z.string().uuid(),
    url: z.string(),
    title: z.string().nullable(),
    platform: z.string().nullable(),
    source_type: z.string().nullish().catch(null),
    published_date: z.string().nullable(),
  })).default([]),
  publications: z.array(z.object({
    id: z.string().uuid(),
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
  })).default([]),
})

export const profileDetailSchema = profileDetailRowSchema.transform((row) => ({
  id: row.id,
  slug: row.slug,
  name: row.name,
  photoUrl: row.photo_url,
  company: row.company,
  role: row.role,
  departureDate: row.departure_date,
  departureDatePrecision: row.departure_date_precision,
  effectiveDepartureDate: row.effective_departure_date ?? null,
  departureDateNote: row.departure_date_note ?? null,
  seoDescription: row.seo_description ?? null,
  statedReason: row.stated_reason,
  departureContext: row.departure_context,
  status: row.status,
  departureType: row.departure_type,
  motiveEvidence: row.motive_evidence,
  headlineCounted: row.headline_counted,
  motiveQuote: row.motive_quote ?? null,
  claimStatus: row.claim_status ?? null,
  lastReviewedAt: row.last_reviewed_at ?? null,
  reviewer: row.reviewer ?? null,
  correctionNote: row.correction_note ?? null,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  concernTags: row.profile_concern_tags.map((pct) => ({
    id: pct.concern_tags.id,
    name: pct.concern_tags.name,
    slug: pct.concern_tags.slug,
  })),
  sources: [...row.profile_sources]
    .sort((a, b) => {
      const sourceRank = (sourceType: string | null | undefined) =>
        sourceType === "first_party" ? 0 : sourceType === "reporting" ? 1 : 2
      return sourceRank(a.source_type) - sourceRank(b.source_type)
    })
    .map((s) => ({
    id: s.id,
    url: s.url,
    title: s.title,
    platform: s.platform,
    sourceType: s.source_type ?? null,
    publishedDate: s.published_date,
    })),
  publications: row.publications.map((pub) => ({
    id: pub.id,
    title: pub.title,
    url: pub.url,
    publicationType: pub.publication_type,
    publisher: pub.publisher,
    publishedDate: pub.published_date,
    publishedDatePrecision: pub.published_date_precision,
    lastUpdatedAt: pub.last_updated_at ?? null,
    abstract: pub.abstract,
  })),
}))

export type ProfileDetail = z.output<typeof profileDetailSchema>

// --- Exported TypeScript types (camelCase) ---

export type ProfileRow = z.input<typeof profileSchema>
export type Profile = z.output<typeof profileSchema>

export type ProfileWithTags = z.output<typeof profileWithTagsSchema>

export type ProfileSourceRow = z.input<typeof profileSourceSchema>
export type ProfileSource = z.output<typeof profileSourceSchema>

export type ConcernTagRow = z.input<typeof concernTagSchema>
export type ConcernTag = z.output<typeof concernTagSchema>

export type TickerStatsRow = z.input<typeof tickerStatsSchema>
export type TickerStats = z.output<typeof tickerStatsSchema>
