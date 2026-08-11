import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, User, ArrowRight, CheckCheck, CalendarClock, XCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { useLeads, useOutreach } from "@/lib/hooks"
import { markFollowedUp, markReplied, rescheduleFollowUp } from "@/db/outreach"
import { setStatus } from "@/db/leads"
import { formatDate, formatMoney, todayISODate } from "@/lib/format"
import type { Lead } from "@/db/schema"

interface ActionItem {
  key: string
  kind: "lead" | "follow_up"
  date: string
  title: string
  description: string
  leadId: string
  outreachId?: string
}

export default function Dashboard() {
  const { leads, refresh: refreshLeads } = useLeads()
  const { outreach, refresh: refreshOutreach } = useOutreach()
  const navigate = useNavigate()
  const today = todayISODate()

  function refreshAll() {
    refreshLeads()
    refreshOutreach()
  }

  const activeLeads = useMemo(() => leads.filter((l) => !l.archived), [leads])

  const pipelineValue = useMemo(
    () =>
      activeLeads
        .filter((l) => l.status !== "WON" && l.status !== "LOST")
        .reduce((sum, l) => sum + (l.estimatedValueMax ?? l.estimatedValueMin ?? 0), 0),
    [activeLeads]
  )

  const newCount = activeLeads.filter((l) => l.status === "NEW").length
  const qualifiedCount = activeLeads.filter((l) => l.status === "QUALIFIED").length

  const leadsById = useMemo(() => new Map(activeLeads.map((l) => [l.id, l])), [activeLeads])

  const dueTodayOutreach = outreach.filter((o) => {
    if (!o.followUpDate || o.followUpDate > today || o.status === "replied") return false
    const lead = leadsById.get(o.leadId)
    return lead && lead.status !== "WON" && lead.status !== "LOST"
  })

  const actionItems = useMemo<ActionItem[]>(() => {
    const items: ActionItem[] = []
    for (const lead of activeLeads) {
      if (lead.nextActionDate && lead.status !== "WON" && lead.status !== "LOST") {
        items.push({
          key: `lead-${lead.id}`,
          kind: "lead",
          date: lead.nextActionDate,
          title: lead.businessName,
          description: lead.nextAction || "Next action",
          leadId: lead.id,
        })
      }
    }
    for (const o of outreach) {
      if (o.followUpDate && o.status !== "replied") {
        const lead = leadsById.get(o.leadId)
        if (!lead || lead.status === "WON" || lead.status === "LOST") continue
        items.push({
          key: `outreach-${o.id}`,
          kind: "follow_up",
          date: o.followUpDate,
          title: lead.businessName,
          description: `Follow up (${o.type.replace(/_/g, " ")})`,
          leadId: lead.id,
          outreachId: o.id,
        })
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [activeLeads, outreach, leadsById])

  const overdue = actionItems.filter((i) => i.date < today)
  const dueToday = actionItems.filter((i) => i.date === today)
  const upcoming = actionItems.filter((i) => i.date > today)

  const highScoreLeads = useMemo(
    () =>
      activeLeads
        .filter((l) => (l.score ?? 0) >= 70)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5),
    [activeLeads]
  )

  return (
    <div className="flex flex-col gap-6 sm:gap-8">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <MetricCard label="Pipeline Value" value={formatMoney(pipelineValue)} />
        <MetricCard label="New Leads" value={String(newCount)} />
        <MetricCard label="Qualified Leads" value={String(qualifiedCount)} />
        <MetricCard label="Follow-ups Due Today" value={String(dueTodayOutreach.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          {actionItems.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Nothing scheduled. Add next-action dates to leads and follow-ups to see them here.
            </p>
          )}
          <ActionGroup
            label="Overdue"
            items={overdue}
            leadsById={leadsById}
            navigate={navigate}
            refresh={refreshAll}
            emphasize
          />
          <ActionGroup
            label="Due Today"
            items={dueToday}
            leadsById={leadsById}
            navigate={navigate}
            refresh={refreshAll}
          />
          <ActionGroup
            label="Upcoming"
            items={upcoming}
            leadsById={leadsById}
            navigate={navigate}
            refresh={refreshAll}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>High-Score Leads</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {highScoreLeads.length === 0 && (
            <p className="text-sm text-on-surface-variant">No leads scored 70+ yet.</p>
          )}
          {highScoreLeads.map((lead) => (
            <button
              key={lead.id}
              onClick={() => navigate(`/leads/${lead.id}`)}
              className="flex items-center justify-between rounded border border-outline-variant px-4 py-2 text-left hover:bg-surface-low"
            >
              <span className="text-sm font-medium text-on-surface">{lead.businessName}</span>
              <span className="font-mono text-sm text-primary">{lead.score}</span>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

function ActionGroup({
  label,
  items,
  leadsById,
  navigate,
  refresh,
  emphasize,
}: {
  label: string
  items: ActionItem[]
  leadsById: Map<string, Lead>
  navigate: ReturnType<typeof useNavigate>
  refresh: () => void
  emphasize?: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col gap-2">
      <h4
        className={`text-xs font-semibold uppercase tracking-wide ${emphasize ? "text-error" : "text-on-surface-variant"}`}
      >
        {label} ({items.length})
      </h4>
      {items.map((item) => (
        <ActionRow
          key={item.key}
          item={item}
          lead={leadsById.get(item.leadId)}
          navigate={navigate}
          refresh={refresh}
        />
      ))}
    </div>
  )
}

function ActionRow({
  item,
  lead,
  navigate,
  refresh,
}: {
  item: ActionItem
  lead: Lead | undefined
  navigate: ReturnType<typeof useNavigate>
  refresh: () => void
}) {
  const [rescheduling, setRescheduling] = useState(false)
  const [newDate, setNewDate] = useState(item.date)
  const today = todayISODate()
  const overdue = item.date < today
  const Icon = item.kind === "follow_up" ? Mail : User

  async function handleMarkContacted() {
    if (!item.outreachId) return
    await markFollowedUp(item.outreachId)
    refresh()
  }

  async function handleMarkReplied() {
    if (!item.outreachId || !lead) return
    await markReplied(item.outreachId)
    if (lead.status === "CONTACTED") await setStatus(lead.id, "REPLIED")
    refresh()
  }

  async function handleMarkClosed() {
    await setStatus(item.leadId, "LOST")
    refresh()
  }

  async function handleReschedule() {
    if (!item.outreachId) return
    await rescheduleFollowUp(item.outreachId, newDate)
    setRescheduling(false)
    refresh()
  }

  return (
    <div className="flex flex-col gap-3 rounded border border-outline-variant px-3 py-3 sm:px-4">
      <div className="flex items-start gap-3 sm:items-center sm:gap-4">
        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-on-surface-variant sm:mt-0" />
        <div className="min-w-0 flex-1">
          <div className="mb-1 flex flex-wrap items-center gap-2">
            <span className="shrink-0 rounded bg-surface-low px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
              {item.kind === "follow_up" ? "Follow-up" : "Lead"}
            </span>
            <span
              className={`shrink-0 font-mono text-xs ${overdue ? "text-error" : "text-on-surface-variant"}`}
            >
              {formatDate(item.date)}
            </span>
          </div>
          <div className="truncate text-sm font-medium text-on-surface">{item.title}</div>
          <div className="truncate text-xs text-on-surface-variant">{item.description}</div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 sm:pl-8">
        <Button size="sm" variant="secondary" onClick={() => navigate(`/leads/${item.leadId}`)}>
          Open
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
        {item.kind === "follow_up" && (
          <>
            <Button size="sm" variant="secondary" onClick={handleMarkContacted}>
              Mark Contacted
            </Button>
            <Button size="sm" variant="secondary" onClick={() => setRescheduling((v) => !v)}>
              <CalendarClock className="h-3.5 w-3.5" />
              Reschedule
            </Button>
            <Button size="sm" variant="secondary" onClick={handleMarkReplied}>
              <CheckCheck className="h-3.5 w-3.5" />
              Mark Replied
            </Button>
            <Button size="sm" variant="destructive" onClick={handleMarkClosed}>
              <XCircle className="h-3.5 w-3.5" />
              Mark Closed
            </Button>
          </>
        )}
      </div>
      {rescheduling && (
        <div className="flex flex-wrap items-center gap-2 sm:pl-8">
          <Input
            type="date"
            value={newDate}
            onChange={(e) => setNewDate(e.target.value)}
            className="w-full sm:w-44"
          />
          <Button size="sm" onClick={handleReschedule}>
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setRescheduling(false)}>
            Cancel
          </Button>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="p-5">
      <div className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-on-surface">{value}</div>
    </Card>
  )
}
