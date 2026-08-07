import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import {
  headlineCount,
  contextualCount,
  allegedCount,
  type MotiveEvidence,
} from "@/lib/evidence"

const tickerRowSchema = z.object({
  departure_date: z.string(),
  departure_date_precision: z.enum(["day", "month", "year"]).catch("day"),
  motive_evidence: z
    .enum(["direct", "reported", "alleged", "contextual"])
    .catch("contextual"),
  headline_counted: z.boolean().catch(false),
})

export interface TickerStats {
  /** All published records — departures and removals documented, any evidence tier. */
  documentedCount: number
  /** Evidence-linked (direct/reported) records only — the primary tally. */
  totalCount: number
  ninetyDayCount: number
  contextualCount: number
  allegedCount: number
}

/**
 * Derive ticker stats from the canonical profiles selector (remediation brief
 * §2.3): the headline number counts only evidence-linked (direct/reported)
 * records; contextual and alleged records are reported separately. Replaces
 * the manually maintained ticker_stats row so every surface shares one source
 * of truth.
 */
export async function getTickerStats(): Promise<TickerStats> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("profiles")
    .select("departure_date, departure_date_precision, motive_evidence, headline_counted")
    .eq("status", "published")

  if (error) throw error

  const rows = (data ?? []).map((r) => {
    const parsed = tickerRowSchema.parse(r)
    return {
      departureDate: parsed.departure_date,
      motiveEvidence: parsed.motive_evidence as MotiveEvidence,
      headlineCounted: parsed.headline_counted,
    }
  })

  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)

  return {
    documentedCount: rows.length,
    totalCount: headlineCount(rows),
    ninetyDayCount: headlineCount(
      rows.filter((r) => r.departureDate >= ninetyDaysAgo)
    ),
    contextualCount: contextualCount(rows),
    allegedCount: allegedCount(rows),
  }
}
