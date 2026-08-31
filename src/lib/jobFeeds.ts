import type { JobListing } from "./jobDataLake"
import { JobFeedError } from "./jobDataLake"

// Keyless, no-signup job feeds. All three were verified browser-callable on
// 2026-08-31 (`access-control-allow-origin: *`), so the SPA calls them directly
// with no proxy. Each returns its whole board in one request; the keyword box
// filters client-side because only Remotive supports a server-side search.
export type FeedId = "remoteok" | "remotive" | "arbeitnow"

export interface Feed {
  id: FeedId
  label: string
  /** Written to `Lead.source`, so leads stay attributable per board. */
  source: string
  url: string
}

export const FEEDS: Feed[] = [
  { id: "remoteok", label: "RemoteOK", source: "RemoteOK", url: "https://remoteok.com/api" },
  {
    id: "remotive",
    label: "Remotive",
    source: "Remotive",
    url: "https://remotive.com/api/remote-jobs",
  },
  {
    id: "arbeitnow",
    label: "Arbeitnow",
    source: "Arbeitnow",
    url: "https://www.arbeitnow.com/api/job-board-api",
  },
]

function str(v: unknown): string {
  return v == null ? "" : String(v)
}

// RemoteOK serves text that was UTF-8-encoded twice on their side, so "Québec"
// arrives as "QuÃ©bec" and lands in an outreach message that way. Re-decoding
// the characters as the bytes they really are repairs it. Both guards keep
// correctly-encoded text untouched: the first skips anything with no mojibake
// marker, the second bails on any character outside the Latin-1 range (which
// `Uint8Array.from` would truncate).
const MOJIBAKE = /[\u00C3\u00C2][\u0080-\u00BF]/
function fixMojibake(value: string): string {
  if (!MOJIBAKE.test(value) || [...value].some((c) => c.charCodeAt(0) > 0xff)) return value
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(
      Uint8Array.from(value, (c) => c.charCodeAt(0))
    )
  } catch {
    return value
  }
}

// RemoteOK's salary_min/salary_max are unusable: of 101 live rows on 2026-08-31
// only 4 carried one, and those were "30-36" (an hourly rate) and three copies
// of "10000-750000" (a placeholder). Dropping them beats importing a lead with
// a fabricated value range.
export function normalizeRemoteOK(payload: unknown): JobListing[] {
  if (!Array.isArray(payload)) return []
  return payload
    // Element 0 of this feed is not a job — it is a {last_updated, legal} notice.
    .filter((raw): raw is Record<string, unknown> => !!raw && typeof raw === "object" && "position" in raw)
    .map((raw) => ({
      id: str(raw.id ?? raw.slug),
      title: fixMojibake(str(raw.position)),
      company: fixMojibake(str(raw.company)) || "Unknown company",
      location: fixMojibake(str(raw.location).replace(/,\s*$/, "")),
      remoteType: "fully_remote",
      employmentType: "",
      salaryMin: null,
      salaryMax: null,
      skills: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
      applyUrl: str(raw.apply_url ?? raw.url),
      postedAt: raw.date ? str(raw.date) : null,
    }))
}

export function normalizeRemotive(payload: unknown): JobListing[] {
  const jobs = (payload as { jobs?: unknown })?.jobs
  if (!Array.isArray(jobs)) return []
  return (jobs as Record<string, unknown>[]).map((raw) => ({
    id: str(raw.id),
    title: str(raw.title),
    company: str(raw.company_name) || "Unknown company",
    location: str(raw.candidate_required_location),
    remoteType: "fully_remote",
    employmentType: str(raw.job_type),
    // `salary` is free text ("$14/hour", "", "80k-100k USD"), not a range.
    salaryMin: null,
    salaryMax: null,
    skills: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    applyUrl: str(raw.url),
    postedAt: raw.publication_date ? str(raw.publication_date) : null,
  }))
}

export function normalizeArbeitnow(payload: unknown): JobListing[] {
  const data = (payload as { data?: unknown })?.data
  if (!Array.isArray(data)) return []
  return (data as Record<string, unknown>[]).map((raw) => ({
    id: str(raw.slug),
    title: str(raw.title),
    company: str(raw.company_name) || "Unknown company",
    location: str(raw.location),
    remoteType: raw.remote === true ? "fully_remote" : "on_site",
    employmentType: Array.isArray(raw.job_types) ? str(raw.job_types[0]) : "",
    salaryMin: null,
    salaryMax: null,
    skills: Array.isArray(raw.tags) ? (raw.tags as string[]) : [],
    applyUrl: str(raw.url),
    // Unix seconds, unlike the ISO strings the other two feeds send.
    postedAt: typeof raw.created_at === "number" ? new Date(raw.created_at * 1000).toISOString() : null,
  }))
}

const NORMALIZERS: Record<FeedId, (payload: unknown) => JobListing[]> = {
  remoteok: normalizeRemoteOK,
  remotive: normalizeRemotive,
  arbeitnow: normalizeArbeitnow,
}

/** Case-insensitive match over the fields a keyword search would plausibly hit. */
export function matchesQuery(job: JobListing, query: string): boolean {
  const q = query.trim().toLowerCase()
  if (!q) return true
  const haystack = [job.title, job.company, job.location, ...job.skills].join(" ").toLowerCase()
  return q.split(/\s+/).every((word) => haystack.includes(word))
}

export async function fetchFeed(
  id: FeedId,
  filters: { query?: string; location?: string } = {}
): Promise<JobListing[]> {
  const feed = FEEDS.find((f) => f.id === id)
  if (!feed) throw new JobFeedError(`Unknown feed "${id}".`)

  let res: Response
  try {
    res = await fetch(feed.url)
  } catch (err) {
    throw new JobFeedError(`Could not reach ${feed.label}. Check your connection.`, { cause: err })
  }
  if (!res.ok) throw new JobFeedError(`${feed.label} request failed (HTTP ${res.status}).`)

  const jobs = NORMALIZERS[id](await res.json())
  const terms = [filters.query, filters.location].filter(Boolean).join(" ")
  return jobs.filter((job) => matchesQuery(job, terms))
}
