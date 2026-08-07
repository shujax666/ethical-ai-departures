"use client"

import { useCallback, useMemo } from "react"
import { useSearchParams, useRouter, usePathname } from "next/navigation"
import type { ProfileWithTags } from "@/lib/schemas/profile"

export type ViewMode = "card" | "table"

export interface FilterState {
  company: string[]
  year: string[]
  concern: string[]
  sort: "date" | "name"
  view: ViewMode
  q: string
}

export function parseFiltersFromParams(params: URLSearchParams): FilterState {
  return {
    company: params.getAll("company"),
    year: params.getAll("year"),
    concern: params.getAll("concern"),
    sort: params.get("sort") === "name" ? "name" : "date",
    view: params.get("view") === "table" ? "table" : "card",
    q: params.get("q") ?? "",
  }
}

function buildSearchParams(filters: FilterState): URLSearchParams {
  const params = new URLSearchParams()
  if (filters.q) params.set("q", filters.q)
  for (const c of filters.company) params.append("company", c)
  for (const y of filters.year) params.append("year", y)
  for (const t of filters.concern) params.append("concern", t)
  if (filters.sort !== "date") params.set("sort", filters.sort)
  if (filters.view !== "card") params.set("view", filters.view)
  return params
}

export interface FilterOption {
  value: string
  label: string
  count: number
}

/** Normalize accents so searches for "Rene" also match "René". */
export function normalizeSearchText(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
}

export function extractFilterOptions(profiles: ProfileWithTags[]) {
  const companyMap = new Map<string, number>()
  const yearMap = new Map<string, number>()
  const concernMap = new Map<string, { name: string; count: number }>()

  for (const p of profiles) {
    companyMap.set(p.company, (companyMap.get(p.company) ?? 0) + 1)

    const year = p.departureDate.slice(0, 4)
    yearMap.set(year, (yearMap.get(year) ?? 0) + 1)

    for (const tag of p.concernTags) {
      const existing = concernMap.get(tag.slug)
      if (existing) {
        existing.count++
      } else {
        concernMap.set(tag.slug, { name: tag.name, count: 1 })
      }
    }
  }

  const companies: FilterOption[] = Array.from(companyMap.entries())
    .map(([value, count]) => ({ value: value.toLowerCase(), label: value, count }))
    .sort((a, b) => b.count - a.count)

  const years: FilterOption[] = Array.from(yearMap.entries())
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.value.localeCompare(a.value))

  const concerns: FilterOption[] = Array.from(concernMap.entries())
    .map(([slug, { name, count }]) => ({ value: slug, label: name, count }))
    .sort((a, b) => b.count - a.count)

  return { companies, years, concerns }
}

export function filterProfiles(
  profiles: ProfileWithTags[],
  filters: FilterState
): ProfileWithTags[] {
  let result = profiles

  // Text search
  if (filters.q) {
    const terms = normalizeSearchText(filters.q).split(/\s+/).filter(Boolean)
    result = result.filter((p) => {
      const searchable = [
        p.name,
        p.company,
        p.role,
        p.statedReason ?? "",
        ...p.concernTags.map((t) => t.name),
      ]
        .join(" ")
      const normalizedSearchable = normalizeSearchText(searchable)
      return terms.every((term) => normalizedSearchable.includes(term))
    })
  }

  if (filters.company.length > 0) {
    const set = new Set(filters.company)
    result = result.filter((p) => set.has(p.company.toLowerCase()))
  }

  if (filters.year.length > 0) {
    const set = new Set(filters.year)
    result = result.filter((p) => set.has(p.departureDate.slice(0, 4)))
  }

  if (filters.concern.length > 0) {
    const set = new Set(filters.concern)
    result = result.filter((p) =>
      p.concernTags.some((tag) => set.has(tag.slug))
    )
  }

  // Sort
  result = [...result].sort((a, b) => {
    if (filters.sort === "name") return a.name.localeCompare(b.name)
    return b.departureDate.localeCompare(a.departureDate)
  })

  return result
}

export function useProfileFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const filters = useMemo(
    () => parseFiltersFromParams(searchParams),
    [searchParams]
  )

  const setFilters = useCallback(
    (next: FilterState) => {
      const params = buildSearchParams(next)
      const qs = params.toString()
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false })
    },
    [router, pathname]
  )

  const toggleFilter = useCallback(
    (key: "company" | "year" | "concern", value: string) => {
      const current = filters[key]
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value]
      setFilters({ ...filters, [key]: next })
    },
    [filters, setFilters]
  )

  const setSort = useCallback(
    (sort: "date" | "name") => {
      setFilters({ ...filters, sort })
    },
    [filters, setFilters]
  )

  const setView = useCallback(
    (view: ViewMode) => {
      setFilters({ ...filters, view })
    },
    [filters, setFilters]
  )

  const setSearch = useCallback(
    (q: string) => {
      setFilters({ ...filters, q })
    },
    [filters, setFilters]
  )

  const clearAll = useCallback(() => {
    setFilters({ company: [], year: [], concern: [], sort: "date", view: filters.view, q: "" })
  }, [setFilters, filters.view])

  const hasActiveFilters =
    filters.company.length > 0 ||
    filters.year.length > 0 ||
    filters.concern.length > 0

  return { filters, toggleFilter, setSort, setView, setSearch, clearAll, hasActiveFilters }
}
