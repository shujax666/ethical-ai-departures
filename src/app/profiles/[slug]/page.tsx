import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { getProfileBySlug } from "@/lib/queries/profiles"
import {
  profileTitle,
  EVIDENCE_LABELS,
  DEPARTURE_TYPE_LABELS,
} from "@/lib/evidence"
import { getPredictions } from "@/lib/queries/predictions"
import { Avatar } from "@/components/custom/Avatar"
import { SourceTooltip } from "@/components/custom/SourceTooltip"
import { ShareButtons } from "@/components/custom/ShareButtons"
import { PredictionStatusBadge } from "@/components/custom/PredictionStatusBadge"

// ISR: 5-minute revalidation
export const revalidate = 300

interface ProfileDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: ProfileDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const profile = await getProfileBySlug(slug)

  if (!profile) {
    return { title: "Profile Not Found · Ethical AI Departures" }
  }

  const year = new Date(profile.departureDate + "T00:00:00").getFullYear()
  const primaryConcern = profile.concernTags[0]?.name ?? "safety concerns"

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethicalaidepartures.fyi").trim()
  const ogParams = new URLSearchParams({
    type: "profile",
    name: profile.name,
    company: profile.company,
    quote: profile.statedReason?.slice(0, 120) ?? "",
  })

  const evidenceClause =
    profile.motiveEvidence === "direct" || profile.motiveEvidence === "reported"
      ? `linked to ${primaryConcern.toLowerCase()}`
      : profile.motiveEvidence === "alleged"
        ? `with an unresolved allegation concerning ${primaryConcern.toLowerCase()}`
        : "documented for context"

  return {
    title: profileTitle(profile.name, profile.company, year),
    description: profile.seoDescription ?? `${profile.name} departed ${profile.company} in ${year}, ${evidenceClause}. Sourced account with evidence labels, linked statements, and papers.`,
    alternates: {
      canonical: `${siteUrl}/profiles/${profile.slug}`,
    },
    openGraph: {
      images: [`${siteUrl}/api/og?${ogParams}`],
    },
    twitter: {
      card: "summary_large_image",
      images: [`${siteUrl}/api/og?${ogParams}`],
    },
  }
}

export default async function ProfileDetailPage({
  params,
}: ProfileDetailPageProps) {
  const { slug } = await params
  const profile = await getProfileBySlug(slug)
  const predictions = profile
    ? await getPredictions().then((preds) =>
        preds.filter((p) => p.profileSlug === slug)
      ).catch(() => [])
    : []

  if (!profile) {
    notFound()
  }

  const year = new Date(profile.departureDate + "T00:00:00").getFullYear()

  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Avatar name={profile.name} photoUrl={profile.photoUrl} size={64} />
        <div className="min-w-0">
          <h1 className="font-serif text-3xl font-semibold text-text-primary">
            {profile.name}
          </h1>
          <p className="mt-1 break-words text-lg text-text-secondary">
            {profile.role} · {profile.company} · {year}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-border-light bg-surface-secondary px-2.5 py-0.5 text-xs font-medium text-text-secondary">
              {DEPARTURE_TYPE_LABELS[profile.departureType]}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                profile.motiveEvidence === "direct" || profile.motiveEvidence === "reported"
                  ? "bg-accent-amber/10 text-accent-amber"
                  : profile.motiveEvidence === "alleged"
                    ? "bg-accent-red/10 text-accent-red"
                    : "bg-surface-secondary text-text-secondary"
              }`}
            >
              {EVIDENCE_LABELS[profile.motiveEvidence]}
            </span>
            {profile.motiveEvidence === "alleged" && profile.claimStatus && (
              <span className="text-xs text-text-secondary">
                Claim status: {profile.claimStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stated Reason */}
      {profile.statedReason && (
        <blockquote className="mt-8 border-l-[3px] border-accent-amber pl-4 text-lg italic text-text-secondary">
          {profile.statedReason}
        </blockquote>
      )}

      {profile.departureDateNote && (
        <p className="mt-3 text-sm text-text-secondary">
          {profile.departureDateNote}
        </p>
      )}

      {profile.motiveQuote && (
        <figure className="mt-6 rounded-lg border border-border-light bg-surface-card px-5 py-4">
          <blockquote className="font-serif text-lg text-text-primary">
            &ldquo;{profile.motiveQuote}&rdquo;
          </blockquote>
          <figcaption className="mt-2 text-sm text-text-secondary">
            First-party departure statement
          </figcaption>
        </figure>
      )}

      {/* Editorial Context */}
      {profile.departureContext && (
        <p className="mt-6 text-base leading-relaxed text-text-secondary">
          {profile.departureContext}
        </p>
      )}

      {/* Correction history */}
      {profile.correctionNote && (
        <p className="mt-4 rounded-md border border-border-light bg-surface-secondary px-4 py-3 text-sm leading-relaxed text-text-secondary">
          <span className="font-medium text-text-primary">Correction: </span>
          {profile.correctionNote}
        </p>
      )}

      {/* Concern Tags */}
      {profile.concernTags.length > 0 && (
        <div className="mt-6 flex flex-wrap gap-2">
          {profile.concernTags.map((tag) => (
            <Link
              key={tag.id}
              href={`/?concern=${tag.slug}`}
              className="rounded-full bg-accent-amber/10 px-3 py-1 text-sm font-medium text-accent-amber hover:bg-accent-amber/20"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Sources */}
      {profile.sources.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Sources
          </h2>
          <ul className="mt-4 space-y-3">
            {profile.sources.map((source) => (
              <li key={source.id}>
                <SourceTooltip url={source.url}>
                  <span className="text-accent-info underline hover:text-accent-info/80">
                    {source.title ?? source.url}
                    <span className="ml-1 text-xs text-text-secondary" aria-hidden="true">
                      ⤴
                    </span>
                  </span>
                </SourceTooltip>
                {source.platform && (
                  <span className="ml-2 text-xs text-text-secondary">
                    {source.platform}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Key Publications */}
      {profile.publications.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Key Publications
          </h2>
          <ul className="mt-4 space-y-4">
            {profile.publications.map((pub) => (
              <li key={pub.id} className="rounded-lg border border-border-light bg-surface-card px-5 py-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    {pub.url ? (
                      <a
                        href={pub.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-medium text-accent-info hover:underline"
                      >
                        {pub.title}
                        <span className="ml-1 text-xs" aria-hidden="true">
                          ⤴
                        </span>
                      </a>
                    ) : (
                      <span className="font-medium text-text-primary">
                        {pub.title}
                      </span>
                    )}
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 text-sm text-text-secondary">
                      {pub.publisher && <span>{pub.publisher}</span>}
                      {pub.publisher && pub.publishedDate && (
                        <span aria-hidden="true">&middot;</span>
                      )}
                      {pub.publishedDate && (
                        <time>
                          {new Date(pub.publishedDate + "T00:00:00").toLocaleDateString(
                            undefined,
                            { year: "numeric", month: "short" }
                          )}
                        </time>
                      )}
                      {pub.publicationType && (
                        <>
                          <span aria-hidden="true">&middot;</span>
                          <span className="rounded-full bg-surface-secondary px-2 py-0.5 text-xs">
                            {pub.publicationType.replace("_", " ")}
                          </span>
                        </>
                      )}
                    </div>
                    {pub.abstract && (
                      <p className="mt-2 text-sm text-text-secondary">
                        {pub.abstract}
                      </p>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Predictions */}
      {predictions.length > 0 && (
        <section className="mt-10">
          <h2 className="font-serif text-xl font-semibold text-text-primary">
            Predictions
          </h2>
          <p className="mt-1 text-sm text-text-secondary">
            {predictions.filter((p) => p.status === "confirmed").length} of{" "}
            {predictions.length} confirmed
          </p>
          <ul className="mt-4 space-y-3">
            {predictions.map((pred) => (
              <li
                key={pred.id}
                className="rounded-lg border border-border-light bg-surface-card px-5 py-4"
              >
                <div className="flex items-start gap-2">
                  <PredictionStatusBadge status={pred.status} />
                  <div className="min-w-0 flex-1">
                    <p className="font-medium text-text-primary text-sm leading-snug">
                      {pred.title}
                    </p>
                    {pred.sourceQuote && (
                      <p className="mt-1.5 text-sm italic text-text-secondary line-clamp-2">
                        &ldquo;{pred.sourceQuote}&rdquo;
                      </p>
                    )}
                    {pred.resolutionRationale && pred.status !== "open" && (
                      <div className="mt-2 rounded-md bg-surface-secondary/50 px-3 py-2">
                        <p className="text-xs text-text-secondary">
                          {pred.resolutionRationale}
                        </p>
                        {pred.resolutionEvidenceUrl && (
                          <a
                            href={pred.resolutionEvidenceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-accent-red/80 hover:text-accent-red hover:underline"
                          >
                            View evidence ⤴
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Share */}
      <div className="mt-8">
        <ShareButtons
          url={`${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethicalaidepartures.fyi").trim()}/profiles/${profile.slug}`}
          twitterText={`${profile.name} — departure from ${profile.company}. Read the sourced, evidence-labeled account on @WarningCollect:`}
        />
      </div>

      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.name,
            jobTitle: profile.role,
            worksFor: {
              "@type": "Organization",
              name: profile.company,
            },
            url: `${(process.env.NEXT_PUBLIC_SITE_URL ?? "https://ethicalaidepartures.fyi").trim()}/profiles/${profile.slug}`,
          }),
        }}
      />

      {/* Back link */}
      <div className="mt-12 border-t border-border-light pt-6">
        <Link
          href="/"
          className="text-sm text-text-secondary hover:text-text-primary"
        >
          ← Back to all profiles
        </Link>
      </div>
    </main>
  )
}
