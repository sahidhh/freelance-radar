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
