import { describe, expect, it } from "vitest"
import { buildOutreachDraft, nextOutreachType } from "./outreachTemplate"
import type { Lead, Outreach } from "@/db/schema"

const baseLead: Lead = {
  id: "1",
  businessName: "Acme Plumbing Co",
  website: "",
  contactName: "Jane Doe",
  email: "jane@acme.example",
  phone: "",
  location: "",
  industry: "Home services",
  source: "",
  sourceUrl: "",
  opportunity: "",
  problem: "slow online booking",
  suggestedSolution: "a booking widget",
  estimatedValueMin: null,
  estimatedValueMax: null,
  estimatedEffort: "",
  score: null,
  scoreReason: "",
  status: "PITCH_READY",
  nextAction: "Send outreach",
  nextActionDate: null,
  notes: "",
  archived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function outreach(overrides: Partial<Outreach>): Outreach {
  return {
    id: crypto.randomUUID(),
    leadId: "1",
    type: "initial",
    subject: "",
    body: "",
    status: "sent",
    sentAt: "2026-01-01T00:00:00.000Z",
    followUpDate: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("buildOutreachDraft", () => {
  it("includes the business name and contact first name for initial outreach", () => {
    const draft = buildOutreachDraft(baseLead, "initial")
    expect(draft.subject).toContain("Acme Plumbing Co")
    expect(draft.body).toContain("Jane")
    expect(draft.body).toContain("slow online booking")
    expect(draft.body).toContain("a booking widget")
  })

  it("falls back to a generic greeting when contactName is blank", () => {
    const draft = buildOutreachDraft({ ...baseLead, contactName: "" }, "initial")
    expect(draft.body).toContain("Hi there,")
  })

  it("produces distinct content for follow_up_1 and follow_up_2", () => {
    const f1 = buildOutreachDraft(baseLead, "follow_up_1")
    const f2 = buildOutreachDraft(baseLead, "follow_up_2")
    expect(f1.body).not.toBe(f2.body)
  })
})

describe("buildOutreachDraft — prototype-first pitch", () => {
  const prototypeLead: Lead = {
    ...baseLead,
    prototypeUrl: "https://example.com/mockups/acme",
  }

  it("uses the old generic template unchanged when prototypeUrl is not set", () => {
    const draft = buildOutreachDraft(baseLead, "initial")
    expect(draft.subject).toBe("Quick idea for Acme Plumbing Co")
    expect(draft.body).not.toContain("mockup")
  })

  it("gives a no-website lead the OTA-commission framing", () => {
    const draft = buildOutreachDraft({ ...prototypeLead, website: "" }, "initial")
    expect(draft.body).toMatch(/commission/i)
    expect(draft.body).toMatch(/Booking\.com|Airbnb/)
  })

  it("gives a website+psiScore lead the PSI framing referencing the actual score", () => {
    const draft = buildOutreachDraft(
      { ...prototypeLead, website: "https://acme.example", psiScore: 31, psiFailingMetric: "LCP 8.4s on 4G" },
      "initial"
    )
    expect(draft.body).toContain("31/100")
    expect(draft.body).toContain("LCP 8.4s on 4G")
  })

  it("falls back to a generic performance framing when psiScore hasn't been checked yet", () => {
    const draft = buildOutreachDraft(
      { ...prototypeLead, website: "https://acme.example", psiScore: null },
      "initial"
    )
    expect(draft.body).not.toMatch(/undefined/i)
    expect(draft.body).not.toMatch(/\bnull\b/i)
    expect(draft.body).toMatch(/slow|phone|performs/i)
  })

  it("includes the prototypeUrl link in the body when set", () => {
    const draft = buildOutreachDraft(prototypeLead, "initial")
    expect(draft.body).toContain("https://example.com/mockups/acme")
  })

  it("appends the opt-out line for channel=email", () => {
    const draft = buildOutreachDraft(prototypeLead, "initial", "email")
    expect(draft.body).toMatch(/no thanks/i)
  })

  it("omits the opt-out line for channel=instagram", () => {
    const draft = buildOutreachDraft(prototypeLead, "initial", "instagram")
    expect(draft.body).not.toMatch(/no thanks/i)
  })

  it("uses per-lead tips from suggestedSolution/notes when non-empty", () => {
    const draft = buildOutreachDraft(
      { ...prototypeLead, suggestedSolution: "a booking widget", notes: "" },
      "initial"
    )
    expect(draft.body).toContain("a booking widget")
  })

  it("falls back to the fixed tips library when suggestedSolution and notes are both empty", () => {
    const draft = buildOutreachDraft({ ...prototypeLead, suggestedSolution: "", notes: "" }, "initial")
    expect(draft.body).toMatch(/Book Now|stock images|header|reviews|mobile|starting rate/)
  })
})

describe("nextOutreachType", () => {
  it("returns initial when nothing has been sent", () => {
    expect(nextOutreachType([])).toBe("initial")
  })

  it("ignores draft-status records when deciding what's been sent", () => {
    expect(nextOutreachType([outreach({ type: "initial", status: "draft" })])).toBe("initial")
  })

  it("returns follow_up_1 once initial is sent", () => {
    expect(nextOutreachType([outreach({ type: "initial", status: "sent" })])).toBe("follow_up_1")
  })

  it("returns follow_up_2 once follow_up_1 is sent", () => {
    expect(
      nextOutreachType([
        outreach({ type: "initial", status: "sent" }),
        outreach({ type: "follow_up_1", status: "sent" }),
      ])
    ).toBe("follow_up_2")
  })

  it("caps at follow_up_2 once all types are sent", () => {
    expect(
      nextOutreachType([
        outreach({ type: "initial", status: "sent" }),
        outreach({ type: "follow_up_1", status: "sent" }),
        outreach({ type: "follow_up_2", status: "sent" }),
      ])
    ).toBe("follow_up_2")
  })
})
