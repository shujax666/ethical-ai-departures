import { createClient } from "@/lib/supabase/server"
import { profileWithTagsSchema, profileDetailSchema } from "@/lib/schemas/profile"

/** Fetch all published profiles with concern tags, ordered by most recent departure */
export async function getPublishedProfiles() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      profile_concern_tags(
        concern_tags(id, name, slug)
      )
    `)
    .eq("status", "published")
    .order("departure_date", { ascending: false })

  if (error) throw error
  return data.map((row) => profileWithTagsSchema.parse(row))
}

/** Fetch a single profile by slug with concern tags and sources. Returns null if not found. */
export async function getProfileBySlug(slug: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select(`
      *,
      profile_concern_tags(
        concern_tags(id, name, slug)
      ),
      profile_sources(id, url, title, platform, source_type, published_date),
      publications(id, title, url, publication_type, publisher, published_date, published_date_precision, last_updated_at, abstract)
    `)
    .eq("slug", slug)
    .eq("status", "published")
    .single()

  if (error) {
    if (error.code === "PGRST116") return null
    throw error
  }
  return profileDetailSchema.parse(data)
}
