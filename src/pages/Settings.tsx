import { useRef, useState } from "react"
import { Download, Upload } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  EXPORT_VERSION,
  exportAllData,
  importAllData,
  importLeadsCsv,
  leadsToCsv,
  parseLeadsCsv,
  validateExportPayload,
  type ExportPayload,
} from "@/db/exportImport"
import { getAllLeads } from "@/db/leads"
import type { Lead } from "@/db/schema"

function downloadFile(filename: string, content: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function timestamp(): string {
  return new Date().toISOString().slice(0, 10)
}

interface JsonImportState {
  payload: ExportPayload
}

interface CsvImportState {
  leads: Lead[]
}

export default function Settings() {
  const jsonInputRef = useRef<HTMLInputElement>(null)
  const csvInputRef = useRef<HTMLInputElement>(null)

  const [jsonErrors, setJsonErrors] = useState<string[]>([])
  const [jsonPending, setJsonPending] = useState<JsonImportState | null>(null)
  const [jsonSuccess, setJsonSuccess] = useState(false)

  const [csvErrors, setCsvErrors] = useState<string[]>([])
  const [csvPending, setCsvPending] = useState<CsvImportState | null>(null)
  const [csvSuccess, setCsvSuccess] = useState(false)

  async function handleExportJson() {
    const payload = await exportAllData()
    downloadFile(
      `freelance-radar-export-${timestamp()}.json`,
      JSON.stringify(payload, null, 2),
      "application/json"
    )
  }

  async function handleExportCsv() {
    const leads = await getAllLeads()
    downloadFile(`freelance-radar-leads-${timestamp()}.csv`, leadsToCsv(leads), "text/csv")
  }

  async function handleJsonFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setJsonSuccess(false)
    setJsonPending(null)
    setJsonErrors([])

    let data: unknown
    try {
      data = JSON.parse(await file.text())
    } catch {
      setJsonErrors(["File is not valid JSON."])
      return
    }

    const result = validateExportPayload(data)
    if ("error" in result) {
      setJsonErrors([result.error])
      return
    }
    setJsonPending({ payload: result.payload })
  }

  async function confirmJsonImport() {
    if (!jsonPending) return
    await importAllData(jsonPending.payload)
    setJsonPending(null)
    setJsonSuccess(true)
  }

  async function handleCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return
    setCsvSuccess(false)
    setCsvPending(null)
    setCsvErrors([])

    const text = await file.text()
    const { leads, errors } = parseLeadsCsv(text)
    if (errors.length > 0) {
      setCsvErrors(errors)
      return
    }
    setCsvPending({ leads })
  }

  async function confirmCsvImport() {
    if (!csvPending) return
    await importLeadsCsv(csvPending.leads)
    setCsvPending(null)
    setCsvSuccess(true)
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Export</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-on-surface-variant">
            Schema version: <span className="font-mono">{EXPORT_VERSION}</span>
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={handleExportJson}>
              <Download className="h-4 w-4" />
              Export JSON (all data)
            </Button>
            <Button variant="secondary" onClick={handleExportCsv}>
              <Download className="h-4 w-4" />
              Export CSV (leads)
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import JSON (all data)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-on-surface-variant">
            Restores a full backup. This replaces all existing leads, outreach, projects, and
            activities — you'll be asked to confirm before anything changes.
          </p>
          <div>
            <Button variant="secondary" onClick={() => jsonInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Choose JSON file
            </Button>
            <input
              ref={jsonInputRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={handleJsonFileChange}
            />
          </div>
          {jsonErrors.length > 0 && (
            <div className="rounded border border-error px-3 py-2 text-sm text-error">
              {jsonErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
          {jsonPending && (
            <div className="flex items-center justify-between rounded border border-outline-variant px-3 py-2 text-sm">
              <span>
                Replace existing data with {jsonPending.payload.leads.length} leads,{" "}
                {jsonPending.payload.outreach.length} outreach, {jsonPending.payload.projects.length}{" "}
                projects, {jsonPending.payload.activities.length} activities from the file?
              </span>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmJsonImport}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setJsonPending(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {jsonSuccess && <p className="text-sm text-success">Import complete.</p>}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Import CSV (leads)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm text-on-surface-variant">
            Adds or updates leads by id, matching the export column order. Existing outreach,
            projects, and activities are untouched. If any row is invalid, nothing is imported.
          </p>
          <div>
            <Button variant="secondary" onClick={() => csvInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              Choose CSV file
            </Button>
            <input
              ref={csvInputRef}
              type="file"
              accept="text/csv"
              className="hidden"
              onChange={handleCsvFileChange}
            />
          </div>
          {csvErrors.length > 0 && (
            <div className="rounded border border-error px-3 py-2 text-sm text-error">
              {csvErrors.map((err, i) => (
                <div key={i}>{err}</div>
              ))}
            </div>
          )}
          {csvPending && (
            <div className="flex items-center justify-between rounded border border-outline-variant px-3 py-2 text-sm">
              <span>Import {csvPending.leads.length} lead(s) from the file?</span>
              <div className="flex gap-2">
                <Button size="sm" onClick={confirmCsvImport}>
                  Confirm
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setCsvPending(null)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {csvSuccess && <p className="text-sm text-success">Import complete.</p>}
        </CardContent>
      </Card>
    </div>
  )
}
