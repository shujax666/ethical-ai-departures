import { describe, it, expect } from "vitest"
import {
  parseFiltersFromParams,
  extractFilterOptions,
  filterProfiles,
} from "./useProfileFilters"
import type { ProfileWithTags } from "@/lib/schemas/profile"

function makeProfile(overrides: Partial<ProfileWithTags> = {}): ProfileWithTags {
  return {
    id: "1",
    slug: "test-person",
    name: "Test Person",
    photoUrl: null,
    company: "OpenAI",
    role: "Engineer",
    departureDate: "2025-06-15",
    statedReason: null,
    departureContext: null,
    status: "published",
    departureType: "resigned",
    motiveEvidence: "direct",
    headlineCounted: true,
    motiveQuote: null,
    claimStatus: null,
    lastReviewedAt: null,
    reviewer: null,
    correctionNote: null,
    createdAt: "2025-06-20T00:00:00Z",
    updatedAt: "2025-06-20T00:00:00Z",
    concernTags: [],
    ...overrides,
  }
}

describe("parseFiltersFromParams", () => {
  it("parses empty params to defaults", () => {
    const params = new URLSearchParams()
    const filters = parseFiltersFromParams(params)

    expect(filters).toEqual({
      company: [],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "",
    })
  })

  it("parses multiple company values", () => {
    const params = new URLSearchParams("company=openai&company=google")
    const filters = parseFiltersFromParams(params)

    expect(filters.company).toEqual(["openai", "google"])
  })

  it("parses sort param", () => {
    const params = new URLSearchParams("sort=name")
    const filters = parseFiltersFromParams(params)

    expect(filters.sort).toBe("name")
  })

  it("defaults invalid sort to date", () => {
    const params = new URLSearchParams("sort=invalid")
    const filters = parseFiltersFromParams(params)

    expect(filters.sort).toBe("date")
  })

  it("parses view=table param", () => {
    const params = new URLSearchParams("view=table")
    const filters = parseFiltersFromParams(params)

    expect(filters.view).toBe("table")
  })

  it("defaults view to card", () => {
    const params = new URLSearchParams()
    const filters = parseFiltersFromParams(params)

    expect(filters.view).toBe("card")
  })
})

describe("extractFilterOptions", () => {
  it("extracts company options with counts", () => {
    const profiles = [
      makeProfile({ company: "OpenAI" }),
      makeProfile({ company: "OpenAI", slug: "p2" }),
      makeProfile({ company: "Google", slug: "p3" }),
    ]

    const { companies } = extractFilterOptions(profiles)

    expect(companies).toHaveLength(2)
    expect(companies[0]).toEqual({
      value: "openai",
      label: "OpenAI",
      count: 2,
    })
    expect(companies[1]).toEqual({
      value: "google",
      label: "Google",
      count: 1,
    })
  })

  it("extracts year options from departure dates", () => {
    const profiles = [
      makeProfile({ departureDate: "2025-06-15" }),
      makeProfile({ departureDate: "2026-01-10", slug: "p2" }),
    ]

    const { years } = extractFilterOptions(profiles)

    expect(years).toHaveLength(2)
    expect(years[0].value).toBe("2026")
    expect(years[1].value).toBe("2025")
  })

  it("extracts concern tag options", () => {
    const profiles = [
      makeProfile({
        concernTags: [
          { id: "1", name: "Safety", slug: "safety" },
        ],
      }),
      makeProfile({
        slug: "p2",
        concernTags: [
          { id: "1", name: "Safety", slug: "safety" },
          { id: "2", name: "Ethics", slug: "ethics" },
        ],
      }),
    ]

    const { concerns } = extractFilterOptions(profiles)

    expect(concerns).toHaveLength(2)
    expect(concerns[0]).toEqual({ value: "safety", label: "Safety", count: 2 })
    expect(concerns[1]).toEqual({ value: "ethics", label: "Ethics", count: 1 })
  })
})

describe("filterProfiles", () => {
  const profiles = [
    makeProfile({
      slug: "a",
      name: "Alice",
      company: "OpenAI",
      departureDate: "2025-06-15",
      concernTags: [{ id: "1", name: "Safety", slug: "safety" }],
    }),
    makeProfile({
      slug: "b",
      name: "Bob",
      company: "Google",
      departureDate: "2026-01-10",
      concernTags: [{ id: "2", name: "Ethics", slug: "ethics" }],
    }),
    makeProfile({
      slug: "c",
      name: "Carol",
      company: "OpenAI",
      departureDate: "2025-03-01",
      concernTags: [],
    }),
  ]

  it("returns all profiles with no filters", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "",
    })

    expect(result).toHaveLength(3)
  })

  it("matches accented names with an ASCII search", () => {
    const result = filterProfiles(
      [makeProfile({ name: "René Mayrhofer", slug: "rene-mayrhofer" })],
      {
        company: [],
        year: [],
        concern: [],
        sort: "date",
        view: "card",
        q: "Rene",
      }
    )

    expect(result.map((profile) => profile.slug)).toEqual(["rene-mayrhofer"])
  })

  it("filters by company", () => {
    const result = filterProfiles(profiles, {
      company: ["openai"],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "",
    })

    expect(result).toHaveLength(2)
    expect(result.every((p) => p.company === "OpenAI")).toBe(true)
  })

  it("filters by year", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: ["2025"],
      concern: [],
      sort: "date",
      view: "card",
      q: "",
    })

    expect(result).toHaveLength(2)
  })

  it("filters by concern tag", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: [],
      concern: ["safety"],
      sort: "date",
      view: "card",
      q: "",
    })

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe("a")
  })

  it("combines multiple filters with AND logic", () => {
    const result = filterProfiles(profiles, {
      company: ["openai"],
      year: ["2025"],
      concern: [],
      sort: "date",
      view: "card",
      q: "",
    })

    expect(result).toHaveLength(2)
  })

  it("sorts by date descending by default", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "",
    })

    expect(result[0].slug).toBe("b") // 2026
    expect(result[1].slug).toBe("a") // 2025-06
    expect(result[2].slug).toBe("c") // 2025-03
  })

  it("sorts by name ascending", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: [],
      concern: [],
      sort: "name",
      view: "card",
      q: "",
    })

    expect(result[0].name).toBe("Alice")
    expect(result[1].name).toBe("Bob")
    expect(result[2].name).toBe("Carol")
  })

  it("filters by search term matching name", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "alice",
    })

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe("Alice")
  })

  it("filters by search term matching company", () => {
    const result = filterProfiles(profiles, {
      company: [],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "google",
    })

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe("b")
  })

  it("combines search with filters", () => {
    const result = filterProfiles(profiles, {
      company: ["openai"],
      year: [],
      concern: [],
      sort: "date",
      view: "card",
      q: "carol",
    })

    expect(result).toHaveLength(1)
    expect(result[0].slug).toBe("c")
  })
})
