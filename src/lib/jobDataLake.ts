import type { NewLead } from "@/db/leads"

const JOBDATALAKE_BASE_URL = "https://api.jobdatalake.com/v1"
const API_KEY_STORAGE_KEY = "freelance-radar:jobdatalake-api-key"

export type RemoteType = "fully_remote" | "hybrid" | "on_site"
export type EmploymentType = "full_time" | "part_time" | "contract" | "internship"

export interface JobSearchParams {
  query?: string
  location?: string
  remoteType?: RemoteType | ""
  employmentType?: EmploymentType | ""
  postedWithin?: "24h" | "7d" | "30d" | ""
  perPage?: number
}

export interface JobListing {
  id: string
  title: string
  company: string
  location: string
  remoteType: string
  employmentType: string
  salaryMin: number | null
  salaryMax: number | null
  skills: string[]
  applyUrl: string
  postedAt: string | null
}

export class JobFeedError extends Error {}

export function getStoredApiKey(): string {
  return localStorage.getItem(API_KEY_STORAGE_KEY) ?? ""
}

export function setStoredApiKey(key: string): void {
  if (key) localStorage.setItem(API_KEY_STORAGE_KEY, key)
  else localStorage.removeItem(API_KEY_STORAGE_KEY)
}

function numOrNull(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v
  return typeof n === "number" && Number.isFinite(n) ? n : null
}

// JobDataLake's REST schema isn't publicly documented without a signed-up key
// (only the MCP tool wrapper is), so field names are matched defensively
// against every reasonable variant rather than a single assumed shape. The
// `locations` array and epoch-ms `posted_at` below are confirmed real
// (see src/lib/__fixtures__/jobdatalake-search.json); the other fallbacks
// stay defensive since the rest of the schema is still unverified.
export function normalizeJob(raw: Record<string, unknown>): JobListing {
  return {
    id: String(raw.job_handle ?? raw.id ?? crypto.randomUUID()),
    title: String(raw.title ?? "Untitled role"),
    company: String(raw.company ?? raw.company_name ?? "Unknown company"),
    location: Array.isArray(raw.locations)
      ? (raw.locations as string[]).join(", ")
      : String(raw.location ?? ""),
    remoteType: String(raw.remote_type ?? ""),
    employmentType: String(raw.employment_type ?? ""),
    salaryMin: numOrNull(raw.salary_min_usd ?? raw.salary_min),
    salaryMax: numOrNull(raw.salary_max_usd ?? raw.salary_max),
    skills: Array.isArray(raw.skills)
      ? (raw.skills as string[])
      : Array.isArray(raw.required_skills)
        ? (raw.required_skills as string[])
        : [],
    applyUrl: String(raw.apply_url ?? raw.url ?? raw.apply_link ?? ""),
    postedAt:
      typeof raw.posted_at === "number"
        ? new Date(raw.posted_at).toISOString()
        : raw.posted_at
          ? String(raw.posted_at)
          : null,
  }
}

const POSTED_WITHIN_MS: Record<"24h" | "7d" | "30d", number> = {
  "24h": 24 * 60 * 60 * 1000,
  "7d": 7 * 24 * 60 * 60 * 1000,
  "30d": 30 * 24 * 60 * 60 * 1000,
}

// JobDataLake has no "posted_within" param; the real filter is
// "posted_after", a Unix timestamp in MILLISECONDS. This converts the
// public postedWithin shorthand into that timestamp, computed against `now`
// (defaulting to the real clock, overridable for tests).
export function postedAfterMs(
  postedWithin: JobSearchParams["postedWithin"],
  now: number = Date.now()
): number | null {
  if (!postedWithin) return null
  return now - POSTED_WITHIN_MS[postedWithin]
}

export async function searchJobs(params: JobSearchParams, apiKey: string): Promise<JobListing[]> {
  if (!apiKey) {
    throw new JobFeedError("No JobDataLake API key set. Add one in Settings.")
  }

  const qs = new URLSearchParams()
  qs.set("q", params.query?.trim() || "*")
  if (params.location) qs.set("location", params.location)
  if (params.remoteType) qs.set("remote_type", params.remoteType)
  if (params.employmentType) qs.set("employment_type", params.employmentType)
  const postedAfter = postedAfterMs(params.postedWithin)
  if (postedAfter !== null) qs.set("posted_after", String(postedAfter))
  qs.set("per_page", String(params.perPage ?? 20))

  let res: Response
  try {
    res = await fetch(`${JOBDATALAKE_BASE_URL}/jobs?${qs.toString()}`, {
      headers: { "X-API-Key": apiKey },
    })
  } catch (err) {
    throw new JobFeedError(
      "Network request to JobDataLake failed. This may be a CORS restriction on their API — check the browser console for details.",
      { cause: err }
    )
  }

  if (res.status === 401 || res.status === 403) {
    throw new JobFeedError("JobDataLake rejected the API key. Check the key in Settings.")
  }
  if (res.status === 429) {
    throw new JobFeedError("JobDataLake rate limit reached. Try again later.")
  }
  if (!res.ok) {
    throw new JobFeedError(`JobDataLake request failed (HTTP ${res.status}).`)
  }

  const data = await res.json()
  const rawJobs: Record<string, unknown>[] = Array.isArray(data)
    ? data
    : ((data.jobs ?? data.data ?? data.results ?? []) as Record<string, unknown>[])

  return rawJobs.map(normalizeJob)
}

export function jobToLeadDraft(job: JobListing, source = "JobDataLake"): NewLead {
  return {
    businessName: job.company,
    website: "",
    contactName: "",
    email: "",
    phone: "",
    location: job.location,
    industry: "",
    source,
    sourceUrl: job.applyUrl,
    opportunity: job.title,
    problem: "",
    suggestedSolution: "",
    estimatedValueMin: job.salaryMin,
    estimatedValueMax: job.salaryMax,
    estimatedEffort: "",
    score: null,
    scoreReason: "",
    status: "NEW",
    nextActionDate: null,
    notes: job.skills.length > 0 ? `Skills: ${job.skills.join(", ")}` : "",
  }
}
