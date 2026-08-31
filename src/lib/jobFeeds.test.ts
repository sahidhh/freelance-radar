import { describe, expect, it } from "vitest"
import arbeitnowResponse from "./__fixtures__/arbeitnow.json"
import remoteokResponse from "./__fixtures__/remoteok.json"
import remotiveResponse from "./__fixtures__/remotive.json"
import { matchesQuery, normalizeArbeitnow, normalizeRemoteOK, normalizeRemotive } from "./jobFeeds"
import { jobToLeadDraft } from "./jobDataLake"

// Every fixture here is an unedited slice of a real response captured on
// 2026-08-31 — never a hand-written object. The repo's only previous external
// API integration shipped broken precisely because its tests asserted against
// an invented shape (see docs/freelance-radar/audit-2026-08-28.md).

describe("normalizeRemoteOK", () => {
  const jobs = normalizeRemoteOK(remoteokResponse)

  it("skips the legal/last_updated notice RemoteOK returns as element 0", () => {
    expect(remoteokResponse).toHaveLength(4)
    expect(remoteokResponse[0]).not.toHaveProperty("position")
    expect(jobs).toHaveLength(3)
  })

  it("maps position/company/apply_url off the real payload", () => {
    expect(jobs[0].title).toBe("MOT Tester")
    expect(jobs[0].company).toBe("Mr Clutch Autocentres")
    expect(jobs[0].applyUrl).toBe(
      "https://remoteOK.com/remote-jobs/remote-mot-tester-mr-clutch-autocentres-1137218"
    )
    expect(jobs[0].postedAt).toBe("2026-08-30T03:32:53+00:00")
    expect(jobs[0].skills).toContain("testing")
  })

  it("trims the trailing comma RemoteOK leaves on city-only locations", () => {
    expect(jobs[0].location).toBe("Oxford")
  })

  // The live feed's only salaried rows were "30-36" (an hourly rate) and three
  // copies of "10000-750000", so the field is dropped rather than imported as a
  // value range that would be wrong on the lead.
  it("drops RemoteOK salary bounds", () => {
    expect(jobs[1].salaryMin).toBeNull()
    expect(jobs[1].salaryMax).toBeNull()
  })

  // Row 3 of the fixture is a real listing whose text RemoteOK double-encoded:
  // the city arrives as U+00C3 U+00A9 where it should be a single U+00E9, and
  // would otherwise be pasted into an outreach message that way.
  it("repairs double-encoded text without touching clean rows", () => {
    expect(remoteokResponse[3].location).toContain("Maca\u00C3\u00A9")
    expect(jobs[2].location).toBe("Maca\u00E9")
    expect(jobs[2].title).toBe("HIGIENIZADOR DE CARROS MACA\u00C9 RJ")
    expect(jobs[0].title).toBe("MOT Tester")
  })
})

describe("normalizeRemotive", () => {
  const jobs = normalizeRemotive(remotiveResponse)

  it("reads jobs out of the wrapper object, not the root", () => {
    expect(jobs).toHaveLength(2)
    expect(jobs[0].title).toBe("Senior React Full-stack Developer")
    expect(jobs[0].company).toBe("Lemon.io")
  })

  it("maps candidate_required_location and job_type", () => {
    expect(jobs[0].location).toBe("LATAM, Europe, USA, Canada, APAC")
    expect(jobs[0].employmentType).toBe("full_time")
    expect(jobs[0].postedAt).toBe("2026-08-27T14:36:09")
  })
})

describe("normalizeArbeitnow", () => {
  const jobs = normalizeArbeitnow(arbeitnowResponse)

  it("maps slug/company_name/url off the real payload", () => {
    expect(jobs).toHaveLength(2)
    expect(jobs[0].company).toBe("mirakl")
    expect(jobs[0].location).toBe("München, Bavaria")
    expect(jobs[0].applyUrl).toMatch(/^https:\/\/www\.arbeitnow\.com\/jobs\//)
  })

  it("converts created_at from unix seconds to ISO", () => {
    expect(jobs[0].postedAt).toBe(new Date(1788144930 * 1000).toISOString())
  })

  it("takes the first job_types entry and falls back to empty", () => {
    expect(jobs[0].employmentType).toBe("")
    expect(jobs[1].employmentType).toBe("Student")
  })

  it("reports non-remote listings as on_site", () => {
    expect(jobs[0].remoteType).toBe("on_site")
  })
})

describe("normalizers on unexpected payloads", () => {
  it("return an empty list rather than throwing", () => {
    expect(normalizeRemoteOK({})).toEqual([])
    expect(normalizeRemotive([])).toEqual([])
    expect(normalizeArbeitnow(null)).toEqual([])
  })
})

describe("matchesQuery", () => {
  const [job] = normalizeRemotive(remotiveResponse)

  it("matches on title, company and tags, case-insensitively", () => {
    expect(matchesQuery(job, "react")).toBe(true)
    expect(matchesQuery(job, "LEMON")).toBe(true)
    expect(matchesQuery(job, "shopify")).toBe(true)
  })

  it("requires every word to match", () => {
    expect(matchesQuery(job, "senior react")).toBe(true)
    expect(matchesQuery(job, "senior plumber")).toBe(false)
  })

  it("matches everything on an empty query", () => {
    expect(matchesQuery(job, "  ")).toBe(true)
  })
})

describe("jobToLeadDraft with a feed source", () => {
  it("attributes the lead to the feed it came from", () => {
    const [job] = normalizeRemoteOK(remoteokResponse)
    const draft = jobToLeadDraft(job, "RemoteOK")
    expect(draft.source).toBe("RemoteOK")
    expect(draft.businessName).toBe("Mr Clutch Autocentres")
    expect(draft.sourceUrl).toBe(job.applyUrl)
    expect(draft.status).toBe("NEW")
  })

  it("still defaults to JobDataLake when no source is given", () => {
    const [job] = normalizeRemoteOK(remoteokResponse)
    expect(jobToLeadDraft(job).source).toBe("JobDataLake")
  })
})
