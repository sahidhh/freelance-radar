import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ClipboardCopy, Mail, Send, CheckCheck } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useLeads, useOutreach } from "@/lib/hooks"
import { createOutreach, getOutreachForLead, markReplied, markSent, updateOutreach } from "@/db/outreach"
import { setStatus } from "@/db/leads"
import { buildOutreachDraft, nextOutreachType } from "@/lib/outreachTemplate"
import { buildMailto } from "@/lib/mailto"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { OutreachStatus } from "@/db/schema"

type FilterId = "all" | "draft" | "sent" | "replied"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "replied", label: "Replied" },
]

function defaultFollowUpDate(): string {
  const d = new Date()
  d.setDate(d.getDate() + 3)
  return d.toISOString().slice(0, 10)
}

export default function Outreach() {
  const { leads } = useLeads()
  const { outreach, refresh } = useOutreach()
  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState<FilterId>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")
  const [copied, setCopied] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(false)
  const [followUpDate, setFollowUpDate] = useState(defaultFollowUpDate())

  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])

  const requestedLeadId = searchParams.get("leadId")
  const handledLeadIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!requestedLeadId) return
    if (handledLeadIdRef.current === requestedLeadId) return
    const lead = leadsById.get(requestedLeadId)
    if (!lead) return
    handledLeadIdRef.current = requestedLeadId

    // Fetch straight from IndexedDB rather than trusting the outreach hook's
    // state, which can still be an empty first-render fetch mid-flight —
    // that race previously produced duplicate drafts.
    getOutreachForLead(requestedLeadId).then((forLead) => {
      const type = nextOutreachType(forLead)
      const existingDraft = forLead.find((o) => o.status === "draft" && o.type === type)

      if (existingDraft) {
        setSelectedId(existingDraft.id)
        setSearchParams({}, { replace: true })
        return
      }

      const draft = buildOutreachDraft(lead, type)
      return createOutreach({
        leadId: lead.id,
        type,
        subject: draft.subject,
        body: draft.body,
        followUpDate: null,
        notes: "",
      }).then((created) => {
        refresh()
        setSelectedId(created.id)
        setSearchParams({}, { replace: true })
      })
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestedLeadId, leadsById])

  const filtered = useMemo(() => {
    const list = filter === "all" ? outreach : outreach.filter((o) => o.status === filter)
    return [...list].sort((a, b) => b.createdAt.localeCompare(a.createdAt))
  }, [outreach, filter])

  const selected = outreach.find((o) => o.id === selectedId) ?? filtered[0] ?? null
  const selectedLead = selected ? leadsById.get(selected.leadId) : undefined

  useEffect(() => {
    if (selected) {
      setSubject(selected.subject)
      setBody(selected.body)
      setShowFollowUp(false)
    }
  }, [selected?.id])

  async function handleSaveDraft() {
    if (!selected) return
    await updateOutreach(selected.id, { subject, body })
    refresh()
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleConfirmSent() {
    if (!selected || !selectedLead) return
    await updateOutreach(selected.id, { subject, body })
    await markSent(selected.id, followUpDate || null)
    if (selected.type === "initial" && selectedLead.status === "PITCH_READY") {
      await setStatus(selectedLead.id, "CONTACTED")
    }
    setShowFollowUp(false)
    refresh()
  }

  async function handleMarkReplied() {
    if (!selected || !selectedLead) return
    await markReplied(selected.id)
    if (selectedLead.status === "CONTACTED") {
      await setStatus(selectedLead.id, "REPLIED")
    }
    refresh()
  }

  const mailtoHref =
    selected && selectedLead
      ? buildMailto(selectedLead.email, subject, body)
      : undefined

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
      <div className="flex flex-col gap-4 lg:col-span-1">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "rounded px-3 py-1.5 text-sm font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-low",
                filter === f.id && "border-primary bg-primary text-on-primary hover:bg-primary"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2">
          {filtered.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              No outreach yet. Generate a pitch from a Lead Detail page to get started.
            </p>
          )}
          {filtered.map((o) => {
            const lead = leadsById.get(o.leadId)
            return (
              <button
                key={o.id}
                onClick={() => setSelectedId(o.id)}
                className={cn(
                  "flex flex-col gap-1 rounded border border-outline-variant bg-surface-lowest px-3 py-2 text-left hover:bg-surface-low",
                  selected?.id === o.id && "border-primary"
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium text-on-surface">
                    {lead?.businessName ?? "Unknown lead"}
                  </span>
                  <StatusPill status={o.status} />
                </div>
                <div className="truncate text-xs text-on-surface-variant">{o.subject}</div>
                <div className="font-mono text-xs text-on-surface-variant">
                  {o.type.replace(/_/g, " ")}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      <div className="lg:col-span-2">
        {!selected || !selectedLead ? (
          <Card>
            <CardContent>
              <p className="text-sm text-on-surface-variant">Select an outreach item to view it.</p>
            </CardContent>
          </Card>
        ) : (
          <Card className="flex flex-col gap-4">
            <CardHeader>
              <CardTitle>
                {selectedLead.businessName} — {selected.type.replace(/_/g, " ")}
              </CardTitle>
              <StatusPill status={selected.status} />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-on-surface-variant">Subject</span>
                <Input
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={selected.status !== "draft"}
                />
              </label>
              <label className="flex flex-col gap-1.5 text-sm">
                <span className="font-medium text-on-surface-variant">Body</span>
                <Textarea
                  rows={12}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  disabled={selected.status !== "draft"}
                />
              </label>

              {selected.sentAt && (
                <p className="text-xs text-on-surface-variant">Sent {formatDate(selected.sentAt)}</p>
              )}
              {selected.followUpDate && (
                <p className="text-xs text-on-surface-variant">
                  Follow-up scheduled {formatDate(selected.followUpDate)}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2">
                {selected.status === "draft" && (
                  <Button variant="secondary" onClick={handleSaveDraft}>
                    Save Draft
                  </Button>
                )}
                <Button variant="secondary" onClick={handleCopy}>
                  <ClipboardCopy className="h-4 w-4" />
                  {copied ? "Copied!" : "Copy"}
                </Button>
                {mailtoHref && (
                  <a href={mailtoHref} className={buttonVariants({ variant: "secondary" })}>
                    <Mail className="h-4 w-4" />
                    Open Gmail
                  </a>
                )}
                {selected.status === "draft" && !showFollowUp && (
                  <Button onClick={() => setShowFollowUp(true)}>
                    <Send className="h-4 w-4" />
                    Mark as Sent
                  </Button>
                )}
                {selected.status === "sent" && (
                  <Button onClick={handleMarkReplied}>
                    <CheckCheck className="h-4 w-4" />
                    Mark Replied
                  </Button>
                )}
              </div>

              {showFollowUp && (
                <div className="flex flex-col gap-3 rounded border border-outline-variant p-3 sm:flex-row sm:items-center">
                  <label className="flex flex-1 flex-col gap-1.5 text-sm">
                    <span className="font-medium text-on-surface-variant">Follow-up date</span>
                    <Input
                      type="date"
                      value={followUpDate}
                      onChange={(e) => setFollowUpDate(e.target.value)}
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button onClick={handleConfirmSent} className="flex-1 sm:flex-none">
                      Confirm Sent
                    </Button>
                    <Button
                      variant="ghost"
                      onClick={() => setShowFollowUp(false)}
                      className="flex-1 sm:flex-none"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function StatusPill({ status }: { status: OutreachStatus }) {
  return (
    <span className="rounded bg-surface-low px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
      {status}
    </span>
  )
}
