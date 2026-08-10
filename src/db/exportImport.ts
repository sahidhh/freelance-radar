import type { Activity, EstimatedEffort, Lead, LeadStatus, Outreach, Project } from "./schema"
import { LEAD_STATUSES } from "./schema"
import { getDB } from "./db"

export const EXPORT_VERSION = 1

export interface ExportPayload {
  version: number
  exportedAt: string
  leads: Lead[]
  outreach: Outreach[]
  projects: Project[]
  activities: Activity[]
}

export const CSV_COLUMNS = [
  "id",
  "businessName",
  "website",
  "contactName",
  "email",
  "phone",
  "location",
  "industry",
  "source",
  "sourceUrl",
  "opportunity",
  "problem",
  "suggestedSolution",
  "estimatedValueMin",
  "estimatedValueMax",
  "estimatedEffort",
  "score",
  "scoreReason",
  "status",
  "nextAction",
  "nextActionDate",
  "notes",
  "createdAt",
  "updatedAt",
] as const

// ---------- generic CSV parse/serialize (RFC 4180-ish: quotes, commas, newlines, "" escapes) ----------

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ""
  let inQuotes = false
  let i = 0

  while (i < text.length) {
    const char = text[i]

    if (inQuotes) {
      if (char === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i += 2
          continue
        }
        inQuotes = false
        i += 1
        continue
      }
      field += char
      i += 1
      continue
    }

    if (char === '"') {
      inQuotes = true
      i += 1
      continue
    }
    if (char === ",") {
      row.push(field)
      field = ""
      i += 1
      continue
    }
    if (char === "\r") {
      i += 1
      continue
    }
    if (char === "\n") {
      row.push(field)
      rows.push(row)
      row = []
      field = ""
      i += 1
      continue
    }
    field += char
    i += 1
  }

  // flush trailing field/row (file may or may not end with a newline)
  if (field.length > 0 || row.length > 0) {
    row.push(field)
    rows.push(row)
  }

  return rows.filter((r) => !(r.length === 1 && r[0] === ""))
}

// ---------- leads <-> CSV ----------

export function leadsToCsv(leads: Lead[]): string {
  const lines = [CSV_COLUMNS.join(",")]
  for (const lead of leads) {
    const row = CSV_COLUMNS.map((col) => {
      const value = lead[col]
      return csvEscape(value === null || value === undefined ? "" : String(value))
    })
    lines.push(row.join(","))
  }
  return lines.join("\r\n")
}

const EFFORT_VALUES: EstimatedEffort[] = ["small", "medium", "large"]

export interface CsvImportResult {
  leads: Lead[]
  errors: string[]
}

/**
 * Parses and validates a leads CSV. Returns every row-numbered error found;
 * callers should treat any errors as a reason to reject the whole import
 * rather than partially applying valid rows, per requirements.md.
 */
export function parseLeadsCsv(text: string): CsvImportResult {
  const rows = parseCsv(text.trim())
  if (rows.length === 0) {
    return { leads: [], errors: ["CSV file is empty."] }
  }

  const header = rows[0].map((h) => h.trim())
  const colIndex: Partial<Record<(typeof CSV_COLUMNS)[number], number>> = {}
  for (const col of CSV_COLUMNS) {
    const idx = header.indexOf(col)
    if (idx !== -1) colIndex[col] = idx
  }

  if (colIndex.businessName === undefined) {
    return { leads: [], errors: ['CSV header is missing required column "businessName".'] }
  }

  const leads: Lead[] = []
  const errors: string[] = []
  const now = new Date().toISOString()

  for (let i = 1; i < rows.length; i++) {
    const rowNumber = i + 1 // 1-indexed including header row, matches what a spreadsheet user sees
    const cols = rows[i]
    const get = (name: (typeof CSV_COLUMNS)[number]): string => {
      const idx = colIndex[name]
      return idx === undefined ? "" : (cols[idx] ?? "").trim()
    }

    const businessName = get("businessName")
    if (!businessName) {
      errors.push(`Row ${rowNumber}: businessName is required.`)
      continue
    }

    const statusRaw = get("status") || "NEW"
    if (!LEAD_STATUSES.includes(statusRaw as LeadStatus)) {
      errors.push(`Row ${rowNumber}: invalid status "${statusRaw}".`)
      continue
    }

    const effortRaw = get("estimatedEffort")
    if (effortRaw && !EFFORT_VALUES.includes(effortRaw as EstimatedEffort)) {
      errors.push(`Row ${rowNumber}: invalid estimatedEffort "${effortRaw}".`)
      continue
    }

    const numericFields: { name: (typeof CSV_COLUMNS)[number]; raw: string }[] = [
      { name: "estimatedValueMin", raw: get("estimatedValueMin") },
      { name: "estimatedValueMax", raw: get("estimatedValueMax") },
      { name: "score", raw: get("score") },
    ]
    const numbers: Record<string, number | null> = {}
    let numericError = false
    for (const { name, raw } of numericFields) {
      if (raw === "") {
        numbers[name] = null
        continue
      }
      const n = Number(raw)
      if (Number.isNaN(n)) {
        errors.push(`Row ${rowNumber}: ${name} "${raw}" is not a number.`)
        numericError = true
        break
      }
      numbers[name] = n
    }
    if (numericError) continue

    const id = get("id") || crypto.randomUUID()
    leads.push({
      id,
      businessName,
      website: get("website"),
      contactName: get("contactName"),
      email: get("email"),
      phone: get("phone"),
      location: get("location"),
      industry: get("industry"),
      source: get("source"),
      sourceUrl: get("sourceUrl"),
      opportunity: get("opportunity"),
      problem: get("problem"),
      suggestedSolution: get("suggestedSolution"),
      estimatedValueMin: numbers.estimatedValueMin,
      estimatedValueMax: numbers.estimatedValueMax,
      estimatedEffort: (effortRaw as EstimatedEffort) || "",
      score: numbers.score,
      scoreReason: get("scoreReason"),
      status: statusRaw as LeadStatus,
      nextAction: get("nextAction"),
      nextActionDate: get("nextActionDate") || null,
      notes: get("notes"),
      archived: false,
      createdAt: get("createdAt") || now,
      updatedAt: get("updatedAt") || now,
    })
  }

  return { leads, errors }
}

// ---------- JSON export/import ----------

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string"
}

/** Structural validation only (no IndexedDB access) so it's unit-testable in isolation. */
export function validateExportPayload(data: unknown): { payload: ExportPayload } | { error: string } {
  if (typeof data !== "object" || data === null) {
    return { error: "File does not contain a JSON object." }
  }
  const obj = data as Record<string, unknown>

  if (typeof obj.version !== "number") {
    return { error: 'Missing or invalid "version" field.' }
  }
  if (obj.version !== EXPORT_VERSION) {
    return { error: `Unsupported export version ${obj.version}. Expected ${EXPORT_VERSION}.` }
  }
  if (!isNonEmptyString(obj.exportedAt)) {
    return { error: 'Missing or invalid "exportedAt" field.' }
  }
  for (const key of ["leads", "outreach", "projects", "activities"] as const) {
    if (!Array.isArray(obj[key])) {
      return { error: `Missing or invalid "${key}" array.` }
    }
  }
  for (const [i, lead] of (obj.leads as unknown[]).entries()) {
    if (
      typeof lead !== "object" ||
      lead === null ||
      !isNonEmptyString((lead as Record<string, unknown>).id) ||
      !isNonEmptyString((lead as Record<string, unknown>).businessName)
    ) {
      return { error: `leads[${i}] is missing required fields (id, businessName).` }
    }
  }

  return { payload: obj as unknown as ExportPayload }
}

export async function exportAllData(): Promise<ExportPayload> {
  const db = await getDB()
  const [leads, outreach, projects, activities] = await Promise.all([
    db.getAll("leads"),
    db.getAll("outreach"),
    db.getAll("projects"),
    db.getAll("activities"),
  ])
  return {
    version: EXPORT_VERSION,
    exportedAt: new Date().toISOString(),
    leads,
    outreach,
    projects,
    activities,
  }
}

/** Replaces all four stores' contents with the given payload in one transaction. */
export async function importAllData(payload: ExportPayload): Promise<void> {
  const db = await getDB()
  const tx = db.transaction(["leads", "outreach", "projects", "activities"], "readwrite")
  await Promise.all([
    tx.objectStore("leads").clear(),
    tx.objectStore("outreach").clear(),
    tx.objectStore("projects").clear(),
    tx.objectStore("activities").clear(),
  ])
  for (const lead of payload.leads) await tx.objectStore("leads").put(lead)
  for (const o of payload.outreach) await tx.objectStore("outreach").put(o)
  for (const p of payload.projects) await tx.objectStore("projects").put(p)
  for (const a of payload.activities) await tx.objectStore("activities").put(a)
  await tx.done
}

/** Upserts leads by id (add or overwrite), leaving outreach/projects/activities untouched. */
export async function importLeadsCsv(leads: Lead[]): Promise<void> {
  const db = await getDB()
  const tx = db.transaction("leads", "readwrite")
  for (const lead of leads) await tx.store.put(lead)
  await tx.done
}
