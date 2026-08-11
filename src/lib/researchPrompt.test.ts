import { describe, expect, it } from "vitest"
import { buildResearchPrompt } from "./researchPrompt"
import type { Lead } from "@/db/schema"

const baseLead: Lead = {
  id: "1",
  businessName: "Acme Plumbing Co",
  website: "https://acmeplumbing.example",
  contactName: "Jane Doe",
  email: "jane@acmeplumbing.example",
  phone: "555-1234",
  location: "Austin, TX",
  industry: "Home services",
  source: "Referral",
  sourceUrl: "https://example.com/ref",
  opportunity: "",
  problem: "",
  suggestedSolution: "",
  estimatedValueMin: null,
  estimatedValueMax: null,
  estimatedEffort: "",
  score: null,
  scoreReason: "",
  status: "NEW",
  nextAction: "Research lead",
  nextActionDate: null,
  notes: "",
  archived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("buildResearchPrompt", () => {
  it("includes every known lead context field", () => {
    const prompt = buildResearchPrompt(baseLead)
    expect(prompt).toContain("Acme Plumbing Co")
    expect(prompt).toContain("https://acmeplumbing.example")
    expect(prompt).toContain("Home services")
    expect(prompt).toContain("Austin, TX")
    expect(prompt).toContain("Jane Doe")
    expect(prompt).toContain("Referral")
    expect(prompt).toContain("https://example.com/ref")
  })

  it("asks for all 7 structured research outputs", () => {
    const prompt = buildResearchPrompt(baseLead)
    for (const heading of [
      "Opportunity",
      "Problem",
      "Suggested Solution",
      "Score",
      "Score Reason",
      "Estimated Value",
      "Estimated Effort",
    ]) {
      expect(prompt).toContain(heading)
    }
  })

  it("falls back to (unknown) for blank fields instead of leaving them empty", () => {
    const prompt = buildResearchPrompt({ ...baseLead, industry: "", location: "" })
    expect(prompt).toContain("Industry: (unknown)")
    expect(prompt).toContain("Location: (unknown)")
  })
})
