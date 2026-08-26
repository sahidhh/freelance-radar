import { describe, expect, it } from "vitest"
import { jobToLeadDraft, type JobDataLakeJob } from "./jobDataLake"

function makeJob(overrides: Partial<JobDataLakeJob> = {}): JobDataLakeJob {
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
