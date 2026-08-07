import { describe, it, expect, vi, afterEach, beforeEach } from "vitest"
import { render, screen, cleanup } from "@testing-library/react"

const mockProfile = {
  id: "b0000000-0000-4000-8000-000000000001",
  slug: "elena-rodriguez",
  name: "Elena Rodriguez",
  photoUrl: null,
  company: "OpenAI",
  role: "Safety Lead",
  departureDate: "2025-11-15",
  statedReason: "Safety concerns deprioritized.",
  status: "published" as const,
  createdAt: "2025-11-20T00:00:00Z",
  updatedAt: "2025-11-20T00:00:00Z",
  concernTags: [
    { id: "c0000000-0000-4000-8000-000000000001", name: "Safety Deprioritization", slug: "safety-deprioritization" },
  ],
  sources: [
    {
      id: "d0000000-0000-4000-8000-000000000001",
      url: "https://example.com/article",
      title: "Why I Left OpenAI",
      platform: "Blog",
      publishedDate: "2025-11-16",
    },
  ],
  publications: [],
}

const mockGetProfileBySlug = vi.fn()
const mockNotFound = vi.fn()

vi.mock("@/lib/queries/profiles", () => ({
  getProfileBySlug: (...args: unknown[]) => mockGetProfileBySlug(...args),
}))

vi.mock("next/navigation", () => ({
  notFound: (...args: unknown[]) => {
    mockNotFound(...args)
    throw new Error("NEXT_NOT_FOUND")
  },
}))

vi.mock("@/components/custom/Avatar", () => ({
  Avatar: ({ name }: { name: string }) => (
    <div data-testid="avatar">{name}</div>
  ),
}))

vi.mock("@/components/custom/SourceTooltip", () => ({
  SourceTooltip: ({ url, children }: { url: string; children: React.ReactNode }) => (
    <a href={url} target="_blank" rel="noopener noreferrer">{children}</a>
  ),
}))

vi.mock("@/components/custom/ShareButtons", () => ({
  ShareButtons: ({ url }: { url: string }) => (
    <div data-testid="share-buttons" data-url={url} />
  ),
}))

import ProfileDetailPage, { generateMetadata } from "./page"

beforeEach(() => {
  mockGetProfileBySlug.mockResolvedValue(mockProfile)
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe("ProfileDetailPage", () => {
  const params = Promise.resolve({ slug: "elena-rodriguez" })

  it("renders profile name and role", async () => {
    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(
      screen.getByRole("heading", { name: "Elena Rodriguez" })
    ).toBeInTheDocument()
    expect(
      screen.getByText(/Safety Lead · OpenAI · 2025/)
    ).toBeInTheDocument()
  })

  it("renders stated reason as blockquote", async () => {
    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(
      screen.getByText("Safety concerns deprioritized.")
    ).toBeInTheDocument()
  })

  it("renders a public date note and first-party motive quote", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce({
      ...mockProfile,
      departureDateNote: "Resigned in June 2026; the exact day is not publicly documented.",
      motiveQuote: "I couldn't stay in good conscience, so I left.",
    })

    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(screen.getByText(/exact day is not publicly documented/)).toBeInTheDocument()
    expect(screen.getByText(/I couldn't stay in good conscience/)).toBeInTheDocument()
    expect(screen.getByText("First-party departure statement")).toBeInTheDocument()
  })

  it("renders concern tags as links", async () => {
    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    const tagLink = screen.getByRole("link", { name: "Safety Deprioritization" })
    expect(tagLink).toHaveAttribute("href", "/?concern=safety-deprioritization")
  })

  it("renders sources section with links", async () => {
    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(
      screen.getByRole("heading", { name: "Sources" })
    ).toBeInTheDocument()
    const sourceLink = screen.getByRole("link", { name: /Why I Left OpenAI/ })
    expect(sourceLink).toHaveAttribute("href", "https://example.com/article")
    expect(sourceLink).toHaveAttribute("target", "_blank")
  })

  it("renders source platform badge", async () => {
    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(screen.getByText("Blog")).toBeInTheDocument()
  })

  it("renders back link to profiles", async () => {
    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    const backLink = screen.getByRole("link", { name: /Back to all profiles/ })
    expect(backLink).toHaveAttribute("href", "/")
  })

  it("renders JSON-LD structured data", async () => {
    const jsx = await ProfileDetailPage({ params })
    const { container } = render(jsx)

    const script = container.querySelector('script[type="application/ld+json"]')
    expect(script).not.toBeNull()
    const jsonLd = JSON.parse(script!.textContent!)
    expect(jsonLd["@type"]).toBe("Person")
    expect(jsonLd.name).toBe("Elena Rodriguez")
    expect(jsonLd.worksFor.name).toBe("OpenAI")
  })

  it("calls notFound when profile does not exist", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce(null)

    await expect(ProfileDetailPage({ params })).rejects.toThrow("NEXT_NOT_FOUND")
    expect(mockNotFound).toHaveBeenCalled()
  })

  it("hides stated reason when null", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce({
      ...mockProfile,
      statedReason: null,
    })

    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(
      screen.queryByText("Safety concerns deprioritized.")
    ).not.toBeInTheDocument()
  })

  it("hides sources section when empty", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce({
      ...mockProfile,
      sources: [],
    })

    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(screen.queryByRole("heading", { name: "Sources" })).not.toBeInTheDocument()
  })

  it("hides concern tags when empty", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce({
      ...mockProfile,
      concernTags: [],
    })

    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    expect(
      screen.queryByRole("link", { name: "Safety Deprioritization" })
    ).not.toBeInTheDocument()
  })

  it("falls back to URL when source has no title", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce({
      ...mockProfile,
      sources: [
        { id: "d1", url: "https://example.com/raw", title: null, platform: null, publishedDate: null },
      ],
    })

    const jsx = await ProfileDetailPage({ params })
    render(jsx)

    const link = screen.getByRole("link", { name: /example\.com\/raw/ })
    expect(link).toHaveAttribute("href", "https://example.com/raw")
  })
})

describe("generateMetadata", () => {
  const params = Promise.resolve({ slug: "elena-rodriguez" })

  it("returns profile metadata", async () => {
    const metadata = await generateMetadata({ params })

    expect(metadata.title).toContain("Elena Rodriguez")
    expect(metadata.title).toContain("OpenAI")
    expect(metadata.description).toContain("Elena Rodriguez")
    expect(metadata.description).toContain("2025")
    expect(metadata.alternates?.canonical).toContain("/profiles/elena-rodriguez")
  })

  it("uses an editorial SEO description when supplied", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce({
      ...mockProfile,
      seoDescription: "Custom editorial description.",
    })

    const metadata = await generateMetadata({ params })

    expect(metadata.description).toBe("Custom editorial description.")
  })

  it("returns not found metadata when profile missing", async () => {
    mockGetProfileBySlug.mockResolvedValueOnce(null)

    const metadata = await generateMetadata({ params })

    expect(metadata.title).toContain("Not Found")
  })
})
