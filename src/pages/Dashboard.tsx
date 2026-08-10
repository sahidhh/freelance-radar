import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { Mail, User, ArrowRight } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { useLeads, useOutreach } from "@/lib/hooks"
import { formatDate, formatMoney, todayISODate } from "@/lib/format"

interface ActionItem {
  key: string
  kind: "lead" | "follow_up"
  date: string
  title: string
  description: string
  leadId: string
}

export default function Dashboard() {
  const { leads } = useLeads()
  const { outreach } = useOutreach()
  const navigate = useNavigate()
  const today = todayISODate()

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
  const dueTodayOutreach = outreach.filter(
    (o) => o.followUpDate && o.followUpDate <= today && o.status !== "replied"
  )

  const leadsById = useMemo(() => new Map(activeLeads.map((l) => [l.id, l])), [activeLeads])

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
        if (!lead) continue
        items.push({
          key: `outreach-${o.id}`,
          kind: "follow_up",
          date: o.followUpDate,
          title: lead.businessName,
          description: `Follow up (${o.type.replace(/_/g, " ")})`,
          leadId: lead.id,
        })
      }
    }
    return items.sort((a, b) => a.date.localeCompare(b.date))
  }, [activeLeads, outreach, leadsById])

  const highScoreLeads = useMemo(
    () =>
      activeLeads
        .filter((l) => (l.score ?? 0) >= 70)
        .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
        .slice(0, 5),
    [activeLeads]
  )

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-4 gap-4">
        <MetricCard label="Pipeline Value" value={formatMoney(pipelineValue)} />
        <MetricCard label="New Leads" value={String(newCount)} />
        <MetricCard label="Qualified Leads" value={String(qualifiedCount)} />
        <MetricCard label="Follow-ups Due Today" value={String(dueTodayOutreach.length)} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Today's Actions</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {actionItems.length === 0 && (
            <p className="text-sm text-on-surface-variant">
              Nothing scheduled. Add next-action dates to leads and follow-ups to see them here.
            </p>
          )}
          {actionItems.map((item) => {
            const overdue = item.date < today
            const Icon = item.kind === "follow_up" ? Mail : User
            return (
              <div
                key={item.key}
                className="flex items-center gap-4 rounded border border-outline-variant px-4 py-3"
              >
                <Icon className="h-4 w-4 shrink-0 text-on-surface-variant" />
                <span className="shrink-0 rounded bg-surface-low px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                  {item.kind === "follow_up" ? "Follow-up" : "Lead"}
                </span>
                <span
                  className={`shrink-0 font-mono text-xs ${overdue ? "text-error" : "text-on-surface-variant"}`}
                >
                  {formatDate(item.date)}
                  {overdue ? " (overdue)" : ""}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-on-surface">{item.title}</div>
                  <div className="truncate text-xs text-on-surface-variant">{item.description}</div>
                </div>
                <Button size="sm" variant="secondary" onClick={() => navigate(`/leads/${item.leadId}`)}>
                  Open
                  <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              </div>
            )
          })}
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
