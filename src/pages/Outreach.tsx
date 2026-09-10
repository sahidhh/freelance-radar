import { useEffect, useMemo, useRef, useState } from "react"
import { useSearchParams } from "react-router-dom"
import {
  ClipboardCopy,
  ExternalLink,
  Mail,
  Send,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  SkipForward,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { useLeads, useOutreach } from "@/lib/hooks"
import { createOutreach, getOutreachForLead, markReplied, markSent, updateOutreach } from "@/db/outreach"
import { setStatus } from "@/db/leads"
import { buildOutreachDraft, nextOutreachType } from "@/lib/outreachTemplate"
import { buildMailto } from "@/lib/mailto"
import { deriveChannel, countInstagramSentToday } from "@/lib/outreachQueue"
import { getDmDailyBudget } from "@/lib/dmBudget"
import { formatDate } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Lead, Outreach as OutreachRecord, OutreachStatus } from "@/db/schema"

type FilterId = "all" | "draft" | "sent" | "replied"
type Mode = "browse" | "queue"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "draft", label: "Draft" },
  { id: "sent", label: "Sent" },
  { id: "replied", label: "Replied" },
]

const MODES: { id: Mode; label: string }[] = [
  { id: "browse", label: "Browse" },
  { id: "queue", label: "Queue" },
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
  const [mode, setMode] = useState<Mode>("browse")
  const [filter, setFilter] = useState<FilterId>("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [queueSourceFilter, setQueueSourceFilter] = useState<string>("")
  const [queueIndex, setQueueIndex] = useState(0)
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
        setMode("browse")
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
        setMode("browse")
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

  const browseSelected = outreach.find((o) => o.id === selectedId) ?? filtered[0] ?? null
  const browseSelectedLead = browseSelected ? leadsById.get(browseSelected.leadId) : undefined

  // The send queue: pending initial drafts only, joined to their lead,
  // oldest first (FIFO). Filterable by lead.source, stepped through with
  // Next/Previous rather than list-click, per the requirements doc.
  const queueItems = useMemo(() => {
    return outreach
      .filter((o) => o.status === "draft" && o.type === "initial")
      .map((o) => {
        const lead = leadsById.get(o.leadId)
        return lead ? { outreach: o, lead } : null
      })
      .filter((item): item is { outreach: OutreachRecord; lead: Lead } => item !== null)
      .sort((a, b) => a.outreach.createdAt.localeCompare(b.outreach.createdAt))
  }, [outreach, leadsById])

  const queueSources = useMemo(() => {
    const set = new Set<string>()
    queueItems.forEach((item) => {
      if (item.lead.source.trim()) set.add(item.lead.source.trim())
    })
    return Array.from(set).sort()
  }, [queueItems])

  const filteredQueueItems = useMemo(
    () => (queueSourceFilter ? queueItems.filter((item) => item.lead.source === queueSourceFilter) : queueItems),
    [queueItems, queueSourceFilter]
  )

  // Reset to the front of the queue when the source filter changes...
  useEffect(() => {
    setQueueIndex(0)
  }, [queueSourceFilter])

  // ...and clamp (rather than reset) when the list itself shrinks, e.g.
  // after a send — this is what makes the next item appear automatically
  // without a separate "advance" action.
  useEffect(() => {
    setQueueIndex((i) => (filteredQueueItems.length === 0 ? 0 : Math.min(i, filteredQueueItems.length - 1)))
  }, [filteredQueueItems.length])

  const currentQueueItem = filteredQueueItems[queueIndex] ?? null

  const active =
    mode === "queue"
      ? currentQueueItem
        ? { outreach: currentQueueItem.outreach, lead: currentQueueItem.lead }
        : null
      : browseSelected && browseSelectedLead
        ? { outreach: browseSelected, lead: browseSelectedLead }
        : null

  const channel = mode === "queue" && active ? deriveChannel(active.lead) : null

  // Recomputed from `outreach` state, which `refresh()` updates after every
  // send — no page reload needed to see the budget move.
  const instagramSentToday = useMemo(() => countInstagramSentToday(outreach, leadsById), [outreach, leadsById])
  const dmDailyBudget = getDmDailyBudget()
  const instagramBudgetUsedUp = instagramSentToday >= dmDailyBudget

  useEffect(() => {
    if (active) {
      setSubject(active.outreach.subject)
      setBody(active.outreach.body)
      setShowFollowUp(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.outreach.id])

  async function handleSaveDraft() {
    if (!active) return
    await updateOutreach(active.outreach.id, { subject, body })
    refresh()
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleCopyBodyOnly() {
    await navigator.clipboard.writeText(body)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleConfirmSent() {
    if (!active) return
    await updateOutreach(active.outreach.id, { subject, body })
    await markSent(active.outreach.id, followUpDate || null)
    if (active.outreach.type === "initial" && active.lead.status === "PITCH_READY") {
      await setStatus(active.lead.id, "CONTACTED")
    }
    setShowFollowUp(false)
    refresh()
  }

  async function handleMarkReplied() {
    if (!active) return
    await markReplied(active.outreach.id)
    if (active.lead.status === "CONTACTED") {
      await setStatus(active.lead.id, "REPLIED")
    }
    refresh()
  }

  function handleQueuePrev() {
    setQueueIndex((i) => Math.max(i - 1, 0))
  }

  function handleQueueNext() {
    setQueueIndex((i) => Math.min(i + 1, Math.max(filteredQueueItems.length - 1, 0)))
  }

  const mailtoHref =
    active && (mode === "browse" || channel === "email") ? buildMailto(active.lead.email, subject, body) : undefined

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap gap-2">
        {MODES.map((m) => (
          <button
            key={m.id}
            onClick={() => setMode(m.id)}
            className={cn(
              "rounded px-3 py-1.5 text-sm font-medium border border-outline-variant text-on-surface-variant hover:bg-surface-low",
              mode === m.id && "border-primary bg-primary text-on-primary hover:bg-primary"
            )}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "browse" ? (
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
                      browseSelected?.id === o.id && "border-primary"
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
            {!active ? (
              <Card>
                <CardContent>
                  <p className="text-sm text-on-surface-variant">Select an outreach item to view it.</p>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex flex-col gap-4">
                <CardHeader>
                  <CardTitle>
                    {active.lead.businessName} — {active.outreach.type.replace(/_/g, " ")}
                  </CardTitle>
                  <StatusPill status={active.outreach.status} />
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-on-surface-variant">Subject</span>
                    <Input
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      disabled={active.outreach.status !== "draft"}
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-on-surface-variant">Body</span>
                    <Textarea
                      rows={12}
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      disabled={active.outreach.status !== "draft"}
                    />
                  </label>

                  {active.outreach.sentAt && (
                    <p className="text-xs text-on-surface-variant">Sent {formatDate(active.outreach.sentAt)}</p>
                  )}
                  {active.outreach.followUpDate && (
                    <p className="text-xs text-on-surface-variant">
                      Follow-up scheduled {formatDate(active.outreach.followUpDate)}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-2">
                    {active.outreach.status === "draft" && (
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
                    {active.outreach.status === "draft" && !showFollowUp && (
                      <Button onClick={() => setShowFollowUp(true)}>
                        <Send className="h-4 w-4" />
                        Mark as Sent
                      </Button>
                    )}
                    {active.outreach.status === "sent" && (
                      <Button onClick={handleMarkReplied}>
                        <CheckCheck className="h-4 w-4" />
                        Mark Replied
                      </Button>
                    )}
                  </div>

                  {showFollowUp && (
                    <FollowUpConfirm
                      followUpDate={followUpDate}
                      setFollowUpDate={setFollowUpDate}
                      onConfirm={handleConfirmSent}
                      onCancel={() => setShowFollowUp(false)}
                    />
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      ) : (
        <div className="flex max-w-2xl flex-col gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-on-surface-variant">Source</span>
              <Select
                value={queueSourceFilter}
                onChange={(e) => setQueueSourceFilter(e.target.value)}
                className="w-48"
              >
                <option value="">All sources</option>
                {queueSources.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </Select>
            </label>
            <div className="ml-auto flex items-center gap-2">
              <Button
                variant="secondary"
                size="icon"
                onClick={handleQueuePrev}
                disabled={filteredQueueItems.length === 0 || queueIndex === 0}
                aria-label="Previous"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="whitespace-nowrap text-sm text-on-surface-variant">
                {filteredQueueItems.length === 0 ? "0 of 0" : `${queueIndex + 1} of ${filteredQueueItems.length}`}
              </span>
              <Button
                variant="secondary"
                size="icon"
                onClick={handleQueueNext}
                disabled={filteredQueueItems.length === 0 || queueIndex >= filteredQueueItems.length - 1}
                aria-label="Next"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <p className="text-sm text-on-surface-variant">
            Instagram: {instagramSentToday} of {dmDailyBudget} sent today.
            {instagramBudgetUsedUp && " Today's Instagram budget is used up."}
          </p>

          {!active ? (
            <Card>
              <CardContent>
                <p className="text-sm text-on-surface-variant">
                  {queueItems.length === 0
                    ? "Queue is empty. No pending initial drafts."
                    : "No queued drafts match this source filter."}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex flex-col gap-4">
              <CardHeader>
                <CardTitle>{active.lead.businessName}</CardTitle>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-surface-low px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                    {channel ?? "no channel"}
                  </span>
                  {active.lead.source && (
                    <span className="text-xs text-on-surface-variant">{active.lead.source}</span>
                  )}
                </div>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                {channel === null && (
                  <div className="flex flex-col gap-3">
                    <p className="text-sm text-on-surface-variant">
                      No email or Instagram handle on this lead — can't send from here.
                    </p>
                    <Button variant="secondary" onClick={handleQueueNext} className="w-fit">
                      <SkipForward className="h-4 w-4" />
                      Skip
                    </Button>
                  </div>
                )}

                {channel === "email" && (
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-on-surface-variant">Subject</span>
                    <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
                  </label>
                )}

                {channel !== null && (
                  <label className="flex flex-col gap-1.5 text-sm">
                    <span className="font-medium text-on-surface-variant">Body</span>
                    <Textarea rows={12} value={body} onChange={(e) => setBody(e.target.value)} />
                  </label>
                )}

                {channel === "instagram" && (
                  <p className="rounded border border-outline-variant bg-surface-low px-3 py-2 text-xs text-on-surface-variant">
                    Copy the draft, open the profile, send from your phone — Instagram DMs don't work
                    from this browser tab.
                  </p>
                )}

                {channel !== null && (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="secondary" onClick={handleSaveDraft}>
                      Save Draft
                    </Button>

                    {channel === "email" && (
                      <>
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
                      </>
                    )}

                    {channel === "instagram" && (
                      <>
                        <Button variant="secondary" onClick={handleCopyBodyOnly}>
                          <ClipboardCopy className="h-4 w-4" />
                          {copied ? "Copied!" : "Copy draft"}
                        </Button>
                        <a
                          href={`https://www.instagram.com/${active.lead.instagramHandle}/`}
                          target="_blank"
                          rel="noreferrer"
                          className={buttonVariants({ variant: "secondary" })}
                        >
                          <ExternalLink className="h-4 w-4" />
                          Open profile
                        </a>
                      </>
                    )}

                    {!showFollowUp &&
                      (channel === "instagram" && instagramBudgetUsedUp ? (
                        <p className="text-sm text-on-surface-variant">
                          Today's Instagram budget is used up ({instagramSentToday}/{dmDailyBudget}).
                        </p>
                      ) : (
                        <Button onClick={() => setShowFollowUp(true)}>
                          <Send className="h-4 w-4" />
                          Mark as Sent
                        </Button>
                      ))}
                  </div>
                )}

                {showFollowUp && (
                  <FollowUpConfirm
                    followUpDate={followUpDate}
                    setFollowUpDate={setFollowUpDate}
                    onConfirm={handleConfirmSent}
                    onCancel={() => setShowFollowUp(false)}
                  />
                )}
              </CardContent>
            </Card>
          )}
        </div>
      )}
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

function FollowUpConfirm({
  followUpDate,
  setFollowUpDate,
  onConfirm,
  onCancel,
}: {
  followUpDate: string
  setFollowUpDate: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="flex flex-col gap-3 rounded border border-outline-variant p-3 sm:flex-row sm:items-center">
      <label className="flex flex-1 flex-col gap-1.5 text-sm">
        <span className="font-medium text-on-surface-variant">Follow-up date</span>
        <Input type="date" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
      </label>
      <div className="flex gap-2">
        <Button onClick={onConfirm} className="flex-1 sm:flex-none">
          Confirm Sent
        </Button>
        <Button variant="ghost" onClick={onCancel} className="flex-1 sm:flex-none">
          Cancel
        </Button>
      </div>
    </div>
  )
}
