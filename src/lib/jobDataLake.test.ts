import { describe, expect, it } from "vitest"
import jobdatalakeSearchResponse from "./__fixtures__/jobdatalake-search.json"
import { jobToLeadDraft, normalizeJob, postedAfterMs, type JobListing } from "./jobDataLake"

function makeJob(overrides: Partial<JobListing> = {}): JobListing {
  return {
    id: "acme-senior-engineer-abc12",
    title: "Senior Engineer",
    company: "Acme Inc.",
    location: "Remote",
    remoteType: "fully_remote",
    employmentType: "contract",
    salaryMin: 100000,
    salaryMax: 150000,
    skills: ["React", "TypeScript"],
    applyUrl: "https://example.com/apply/abc12",
    postedAt: "2026-08-20",
    ...overrides,
  }
}

describe("jobToLeadDraft", () => {
  it("maps a job into a NEW lead draft with source fields set", () => {
    const draft = jobToLeadDraft(makeJob())
    expect(draft.businessName).toBe("Acme Inc.")
    expect(draft.opportunity).toBe("Senior Engineer")
    expect(draft.source).toBe("JobDataLake")
    expect(draft.sourceUrl).toBe("https://example.com/apply/abc12")
    expect(draft.status).toBe("NEW")
    expect(draft.estimatedValueMin).toBe(100000)
    expect(draft.estimatedValueMax).toBe(150000)
    expect(draft.notes).toBe("Skills: React, TypeScript")
  })

  it("leaves notes empty when the job has no skills", () => {
    const draft = jobToLeadDraft(makeJob({ skills: [] }))
    expect(draft.notes).toBe("")
  })

  it("passes through null salary bounds untouched", () => {
    const draft = jobToLeadDraft(makeJob({ salaryMin: null, salaryMax: null }))
    expect(draft.estimatedValueMin).toBeNull()
    expect(draft.estimatedValueMax).toBeNull()
  })
})

// jobdatalake-search.json is an unedited slice of a real /v1/jobs response
// (q=react+developer against the real corrected endpoint/params) — see
// docs/freelance-radar/next-session-plan.md's "Bug: Discover page 404s" for
// why the previous hand-built fixture never caught this file's bugs.
describe("normalizeJob", () => {
  const [job] = jobdatalakeSearchResponse.jobs.map(normalizeJob)

  it("joins the locations array into a single location string", () => {
    expect(job.location).toBe("New York, NY")
  })

  it("converts the epoch-ms posted_at into an ISO string", () => {
    expect(job.postedAt).toBe(new Date(1789030630278).toISOString())
  })

  it("maps company_name to company", () => {
    expect(job.company).toBe("Citigroup")
  })

  it("maps required_skills to skills", () => {
    expect(job.skills).toEqual(["Java", "Kafka", "SQL", "Git", "Agile", "React"])
  })

  it("maps salary_min_usd/salary_max_usd to salaryMin/salaryMax", () => {
    expect(job.salaryMin).toBe(142)
    expect(job.salaryMax).toBe(213)
  })

  it("maps id/title/url off the real payload", () => {
    expect(job.id).toBe(
      "citigroup-core-java-developer-trading-securities-lending-vice-president-f4tzw"
    )
    expect(job.title).toBe("Core Java Developer")
    expect(job.applyUrl).toBe(
      "https://jobs.citi.com/job/new-york/core-java-developer-trading-securities-lending-vice-president/287/98764023840"
    )
  })
})

describe("postedAfterMs", () => {
  const now = 1_700_000_000_000

  it("converts 24h/7d/30d into posted_after millisecond timestamps", () => {
    expect(postedAfterMs("24h", now)).toBe(now - 24 * 60 * 60 * 1000)
    expect(postedAfterMs("7d", now)).toBe(now - 7 * 24 * 60 * 60 * 1000)
    expect(postedAfterMs("30d", now)).toBe(now - 30 * 24 * 60 * 60 * 1000)
  })

  it("returns null when no postedWithin filter is set", () => {
    expect(postedAfterMs("", now)).toBeNull()
    expect(postedAfterMs(undefined, now)).toBeNull()
  })
})
