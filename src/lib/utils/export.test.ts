import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import type { ProfileWithTags } from "@/lib/schemas/profile"
import type { FilterState } from "@/hooks/useProfileFilters"
import {
  profilesToCsv,
  profilesToJson,
  buildExportFilename,
  downloadFile,
} from "./export"

const mockProfiles: ProfileWithTags[] = [
  {
    id: "b0000000-0000-4000-8000-000000000001",
    slug: "elena-rodriguez",
    name: "Elena Rodriguez",
    photoUrl: null,
    company: "OpenAI",
    role: "Safety Lead",
    departureDate: "2025-11-15",
    statedReason: "Safety concerns deprioritized.",
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
    createdAt: "2025-11-20T00:00:00Z",
    updatedAt: "2025-11-20T00:00:00Z",
    concernTags: [
      { id: "c1", name: "Safety Deprioritization", slug: "safety-deprioritization" },
    ],
  },
  {
    id: "b0000000-0000-4000-8000-000000000002",
    slug: "james-chen",
    name: 'James "Jim" Chen',
    photoUrl: null,
    company: "Anthropic",
    role: "Engineer",
    departureDate: "2025-06-01",
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
    createdAt: "2025-06-05T00:00:00Z",
    updatedAt: "2025-06-05T00:00:00Z",
    concernTags: [],
  },
]

const defaultFilters: FilterState = {
  company: [],
  year: [],
  concern: [],
  sort: "date",
  view: "card",
  q: "",
}

describe("profilesToCsv", () => {
  it("produces CSV with headers and data rows", () => {
    const csv = profilesToCsv(mockProfiles)
    const lines = csv.split("\n")

    expect(lines[0]).toBe(
      "Name,Company,Role,Departure Date,Departure Date Precision,Effective Departure Date,Departure Date Note,Stated Reason,Concern Tags,Permalink,Departure Type,Evidence,Claim Status,Headline Counted"
    )
    expect(lines).toHaveLength(3) // header + 2 rows
  })

  it("includes concern tags semicolon-separated", () => {
    const csv = profilesToCsv(mockProfiles)
    expect(csv).toContain("Safety Deprioritization")
  })

  it("escapes fields with commas or quotes", () => {
    const csv = profilesToCsv(mockProfiles)
    // James "Jim" Chen should be escaped
    expect(csv).toContain('"James ""Jim"" Chen"')
  })

  it("handles null stated reason as empty", () => {
    const csv = profilesToCsv(mockProfiles)
    const lines = csv.split("\n")
    const jamesRow = lines[2]
    // The stated_reason field should be empty
    expect(jamesRow).toContain(",,")
  })

  it("includes permalink column", () => {
    const csv = profilesToCsv(mockProfiles)
    expect(csv).toContain("/profiles/elena-rodriguez")
  })
})

describe("profilesToJson", () => {
  it("produces valid JSON", () => {
    const json = profilesToJson(mockProfiles)
    const parsed = JSON.parse(json)
    expect(parsed).toHaveLength(2)
  })

  it("includes profile fields", () => {
    const json = profilesToJson(mockProfiles)
    const parsed = JSON.parse(json)
    expect(parsed[0].name).toBe("Elena Rodriguez")
    expect(parsed[0].company).toBe("OpenAI")
    expect(parsed[0].role).toBe("Safety Lead")
    expect(parsed[0].departureDate).toBe("2025-11-15")
  })

  it("includes concern tags as string array", () => {
    const json = profilesToJson(mockProfiles)
    const parsed = JSON.parse(json)
    expect(parsed[0].concernTags).toEqual(["Safety Deprioritization"])
  })

  it("includes permalink", () => {
    const json = profilesToJson(mockProfiles)
    const parsed = JSON.parse(json)
    expect(parsed[0].permalink).toContain("/profiles/elena-rodriguez")
  })
})

describe("buildExportFilename", () => {
  it("returns base name with no filters", () => {
    expect(buildExportFilename(defaultFilters, "csv")).toBe("ethical-ai-departures.csv")
  })

  it("includes single company filter", () => {
    const filters = { ...defaultFilters, company: ["OpenAI"] }
    expect(buildExportFilename(filters, "csv")).toBe("ethical-ai-departures-openai.csv")
  })

  it("includes single year filter", () => {
    const filters = { ...defaultFilters, year: ["2025"] }
    expect(buildExportFilename(filters, "json")).toBe("ethical-ai-departures-2025.json")
  })

  it("includes combined filters", () => {
    const filters = { ...defaultFilters, company: ["OpenAI"], year: ["2025"] }
    expect(buildExportFilename(filters, "csv")).toBe("ethical-ai-departures-openai-2025.csv")
  })

  it("skips multi-value filters", () => {
    const filters = { ...defaultFilters, company: ["OpenAI", "Anthropic"] }
    expect(buildExportFilename(filters, "csv")).toBe("ethical-ai-departures.csv")
  })
})

describe("downloadFile", () => {
  let mockCreateObjectURL: ReturnType<typeof vi.fn>
  let mockRevokeObjectURL: ReturnType<typeof vi.fn>

  beforeEach(() => {
    mockCreateObjectURL = vi.fn().mockReturnValue("blob:test")
    mockRevokeObjectURL = vi.fn()
    vi.stubGlobal("URL", {
      createObjectURL: mockCreateObjectURL,
      revokeObjectURL: mockRevokeObjectURL,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it("creates and clicks a download link", () => {
    const clickSpy = vi.fn()
    const appendSpy = vi.spyOn(document.body, "appendChild").mockImplementation((node) => {
      if (node instanceof HTMLAnchorElement) {
        vi.spyOn(node, "click").mockImplementation(clickSpy)
      }
      return node
    })
    const removeSpy = vi.spyOn(document.body, "removeChild").mockImplementation((node) => node)

    downloadFile("test data", "test.csv", "text/csv")

    expect(mockCreateObjectURL).toHaveBeenCalled()
    expect(appendSpy).toHaveBeenCalled()
    expect(clickSpy).toHaveBeenCalled()
    expect(removeSpy).toHaveBeenCalled()
    expect(mockRevokeObjectURL).toHaveBeenCalledWith("blob:test")

    appendSpy.mockRestore()
    removeSpy.mockRestore()
  })
})
