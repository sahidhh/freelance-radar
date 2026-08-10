import { describe, expect, it } from "vitest"
import {
  CSV_COLUMNS,
  EXPORT_VERSION,
  csvEscape,
  leadsToCsv,
  parseCsv,
  parseLeadsCsv,
  validateExportPayload,
} from "./exportImport"
import type { Lead } from "./schema"

const baseLead: Lead = {
  id: "1",
  businessName: "Acme, Inc.",
  website: "https://acme.example",
  contactName: "Jane \"JD\" Doe",
  email: "jane@acme.example",
  phone: "",
  location: "Line1\nLine2",
  industry: "",
  source: "",
  sourceUrl: "",
  opportunity: "",
  problem: "",
  suggestedSolution: "",
  estimatedValueMin: 1000,
  estimatedValueMax: 2000,
  estimatedEffort: "small",
  score: 80,
  scoreReason: "",
  status: "NEW",
  nextAction: "Research lead",
  nextActionDate: null,
  notes: "",
  archived: false,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
}

describe("csvEscape / parseCsv round-trip", () => {
  it("round-trips fields containing commas, quotes, and newlines", () => {
    const csv = leadsToCsv([baseLead])
    const rows = parseCsv(csv)
    expect(rows[0]).toEqual([...CSV_COLUMNS])
    const businessNameIdx = CSV_COLUMNS.indexOf("businessName")
    const contactNameIdx = CSV_COLUMNS.indexOf("contactName")
    const locationIdx = CSV_COLUMNS.indexOf("location")
    expect(rows[1][businessNameIdx]).toBe("Acme, Inc.")
    expect(rows[1][contactNameIdx]).toBe('Jane "JD" Doe')
    expect(rows[1][locationIdx]).toBe("Line1\nLine2")
  })

  it("escapes only when needed", () => {
    expect(csvEscape("plain")).toBe("plain")
    expect(csvEscape("a,b")).toBe('"a,b"')
  })
})

describe("parseLeadsCsv", () => {
  it("parses a valid CSV into leads with no errors", () => {
    const csv = leadsToCsv([baseLead])
    const { leads, errors } = parseLeadsCsv(csv)
    expect(errors).toEqual([])
    expect(leads).toHaveLength(1)
    expect(leads[0].businessName).toBe("Acme, Inc.")
    expect(leads[0].estimatedValueMin).toBe(1000)
    expect(leads[0].score).toBe(80)
  })

  it("generates an id when the id column is blank", () => {
    const csv = "businessName,id\nNo Id Co,\n"
    const { leads, errors } = parseLeadsCsv(csv)
    expect(errors).toEqual([])
    expect(leads[0].id).toBeTruthy()
  })

  it("rejects a row missing businessName with a row-numbered error", () => {
    const csv = "businessName,website\n,https://example.com\n"
    const { leads, errors } = parseLeadsCsv(csv)
    expect(leads).toHaveLength(0)
    expect(errors).toEqual(["Row 2: businessName is required."])
  })

  it("rejects a row with an invalid status enum value", () => {
    const csv = "businessName,status\nAcme,Negotiating\n"
    const { errors } = parseLeadsCsv(csv)
    expect(errors).toEqual(['Row 2: invalid status "Negotiating".'])
  })

  it("rejects a row with a non-numeric score", () => {
    const csv = "businessName,score\nAcme,not-a-number\n"
    const { errors } = parseLeadsCsv(csv)
    expect(errors).toEqual(['Row 2: score "not-a-number" is not a number.'])
  })

  it("rejects a row with an invalid estimatedEffort value", () => {
    const csv = "businessName,estimatedEffort\nAcme,huge\n"
    const { errors } = parseLeadsCsv(csv)
    expect(errors).toEqual(['Row 2: invalid estimatedEffort "huge".'])
  })

  it("ignores unknown extra columns", () => {
    const csv = "businessName,notARealColumn\nAcme,whatever\n"
    const { leads, errors } = parseLeadsCsv(csv)
    expect(errors).toEqual([])
    expect(leads[0].businessName).toBe("Acme")
  })

  it("rejects the file outright when the businessName header column is missing", () => {
    const csv = "website,email\nhttps://a.com,a@a.com\n"
    const { leads, errors } = parseLeadsCsv(csv)
    expect(leads).toHaveLength(0)
    expect(errors[0]).toMatch(/businessName/)
  })

  it("reports an error for an empty file", () => {
    const { errors } = parseLeadsCsv("")
    expect(errors).toEqual(["CSV file is empty."])
  })

  it("collects multiple row errors across a multi-row file", () => {
    const csv = "businessName,status\nGood Co,NEW\n,QUALIFIED\nBad Co,NotAStatus\n"
    const { leads, errors } = parseLeadsCsv(csv)
    expect(leads).toHaveLength(1)
    expect(errors).toHaveLength(2)
    expect(errors[0]).toContain("Row 3")
    expect(errors[1]).toContain("Row 4")
  })
})

describe("validateExportPayload", () => {
  const validPayload = {
    version: EXPORT_VERSION,
    exportedAt: "2026-01-01T00:00:00.000Z",
    leads: [{ id: "1", businessName: "Acme" }],
    outreach: [],
    projects: [],
    activities: [],
  }

  it("accepts a well-formed payload", () => {
    const result = validateExportPayload(validPayload)
    expect("payload" in result).toBe(true)
  })

  it("rejects non-object input", () => {
    const result = validateExportPayload("not an object")
    expect("error" in result).toBe(true)
  })

  it("rejects a mismatched version", () => {
    const result = validateExportPayload({ ...validPayload, version: 99 })
    expect("error" in result && result.error).toMatch(/version/)
  })

  it("rejects a payload missing the leads array", () => {
    const { leads: _leads, ...rest } = validPayload
    const result = validateExportPayload(rest)
    expect("error" in result && result.error).toMatch(/leads/)
  })

  it("rejects malformed JSON structurally (leads entries missing required fields)", () => {
    const result = validateExportPayload({ ...validPayload, leads: [{ foo: "bar" }] })
    expect("error" in result && result.error).toMatch(/leads\[0\]/)
  })
})
