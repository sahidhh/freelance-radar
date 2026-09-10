import { describe, expect, it } from "vitest"
import { countInstagramSentToday, deriveChannel, localDateString } from "./outreachQueue"
import type { Lead, Outreach } from "@/db/schema"

const baseLead: Lead = {
  id: "1",
  businessName: "Acme Plumbing Co",
  website: "",
  contactName: "Jane Doe",
  email: "",
  phone: "",
  location: "",
  industry: "",
  source: "",
  sourceUrl: "",
  opportunity: "",
  problem: "",
  suggestedSolution: "",
  estimatedValueMin: null,
  estimatedValueMax: null,
  estimatedEffort: "",
  score: null,
  scoreReason: "",
  status: "PITCH_READY",
  nextAction: "",
  nextActionDate: null,
  notes: "",
  archived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

function lead(overrides: Partial<Lead>): Lead {
  return { ...baseLead, ...overrides }
}

function outreach(overrides: Partial<Outreach>): Outreach {
  return {
    id: crypto.randomUUID(),
    leadId: "1",
    type: "initial",
    subject: "",
    body: "",
    status: "sent",
    sentAt: null,
    followUpDate: null,
    notes: "",
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  }
}

describe("deriveChannel", () => {
  it("picks email when present, regardless of instagramHandle", () => {
    expect(deriveChannel({ email: "a@b.com", instagramHandle: "handle" })).toBe("email")
  })

  it("picks instagram when email is empty but a handle is present", () => {
    expect(deriveChannel({ email: "", instagramHandle: "handle" })).toBe("instagram")
  })

  it("returns null when neither is present", () => {
    expect(deriveChannel({ email: "", instagramHandle: undefined })).toBeNull()
    expect(deriveChannel({ email: "   ", instagramHandle: "  " })).toBeNull()
  })
})

describe("localDateString", () => {
  it("formats as YYYY-MM-DD", () => {
    expect(localDateString(new Date(2026, 8, 5))).toBe("2026-09-05")
  })

  it("pads single-digit month and day", () => {
    expect(localDateString(new Date(2026, 0, 3))).toBe("2026-01-03")
  })
})

describe("countInstagramSentToday", () => {
  // Built from local wall-clock Dates (not hardcoded UTC strings) so the
  // test doesn't depend on the runner's timezone.
  const todayNoon = new Date(2026, 8, 10, 12, 0, 0)
  const todayEvening = new Date(2026, 8, 10, 20, 0, 0)
  const yesterdayNoon = new Date(2026, 8, 9, 12, 0, 0)
  const today = localDateString(todayNoon)

  const igLead = lead({ id: "ig", email: "", instagramHandle: "acme" })
  const emailLead = lead({ id: "email", email: "jane@acme.example", instagramHandle: "" })
  const leadsById = new Map([
    [igLead.id, igLead],
    [emailLead.id, emailLead],
  ])

  it("counts only sent, today, instagram-channel records", () => {
    const rows = [
      outreach({ leadId: "ig", status: "sent", sentAt: todayNoon.toISOString() }),
      outreach({ leadId: "ig", status: "sent", sentAt: todayEvening.toISOString() }),
      outreach({ leadId: "email", status: "sent", sentAt: todayNoon.toISOString() }),
      outreach({ leadId: "ig", status: "draft", sentAt: null }),
      outreach({ leadId: "ig", status: "sent", sentAt: yesterdayNoon.toISOString() }),
    ]
    expect(countInstagramSentToday(rows, leadsById, today)).toBe(2)
  })

  it("returns 0 when nothing matches", () => {
    expect(countInstagramSentToday([], leadsById, today)).toBe(0)
  })

  it("skips records whose lead can't be found", () => {
    const rows = [outreach({ leadId: "missing", status: "sent", sentAt: todayNoon.toISOString() })]
    expect(countInstagramSentToday(rows, leadsById, today)).toBe(0)
  })
})
