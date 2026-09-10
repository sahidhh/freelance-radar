import { useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Mail, Pencil, Trash2, CheckCircle2, ClipboardCopy } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { StatusBadge } from "@/components/StatusBadge"
import { useActivitiesForLead, useLead, useOutreachForLead } from "@/lib/hooks"
import { deleteLead, setStatus } from "@/db/leads"
import { formatDate, formatValueRange } from "@/lib/format"
import { getNextActionLabel, isTerminalStatus } from "@/lib/nextAction"
import { buildResearchPrompt } from "@/lib/researchPrompt"
import type { LeadStatus } from "@/db/schema"

function primaryAction(
  status: LeadStatus,
  id: string
): { label: string; onClick: (nav: ReturnType<typeof useNavigate>, refresh: () => void) => void } | null {
  switch (status) {
    case "NEW":
    case "QUALIFIED":
      return { label: "Research Lead", onClick: (nav) => nav(`/leads/${id}/edit`) }
    case "RESEARCHED":
    case "PITCH_READY":
    case "CONTACTED":
    case "PROPOSAL":
      return { label: getNextActionLabel(status), onClick: (nav) => nav(`/outreach?leadId=${id}`) }
    case "REPLIED":
      return {
        label: "Schedule Call",
        onClick: async (_nav, refresh) => {
          await setStatus(id, "CALL")
          refresh()
        },
      }
    case "CALL":
      return {
        label: "Send Proposal",
        onClick: async (_nav, refresh) => {
          await setStatus(id, "PROPOSAL")
          refresh()
        },
      }
    case "WON":
      return { label: "Create Project", onClick: (nav) => nav(`/projects?createFor=${id}`) }
    default:
      return null
  }
}

export default function LeadDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { lead, refresh } = useLead(id)
  const { outreach } = useOutreachForLead(id)
  const { activities } = useActivitiesForLead(id)
  const [copied, setCopied] = useState(false)

  if (!lead) return <div>Loading…</div>

  const action = primaryAction(lead.status, lead.id)

  async function handleCopyPrompt() {
    if (!lead) return
    await navigator.clipboard.writeText(buildResearchPrompt(lead))
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleDelete() {
    if (!lead) return
    if (window.confirm(`Permanently delete "${lead.businessName}"? This cannot be undone.`)) {
      await deleteLead(lead.id)
      navigate("/leads")
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:justify-between">
        <div className="flex min-w-0 flex-col gap-2">
          <StatusBadge status={lead.status} />
          <h2 className="text-2xl font-semibold text-on-surface sm:text-3xl">
            {lead.businessName}
          </h2>
          {lead.opportunity && (
            <p className="max-w-2xl text-sm text-on-surface-variant">{lead.opportunity}</p>
          )}
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-2 sm:w-auto">
          <Button
            variant="secondary"
            onClick={() => navigate(`/leads/${lead.id}/edit`)}
            className="flex-1 sm:flex-none"
          >
            <Pencil className="h-4 w-4" />
            Edit Details
          </Button>
          {lead.email && (
            <a
              href={`mailto:${lead.email}`}
              className={buttonVariants({ variant: "secondary", className: "flex-1 sm:flex-none" })}
            >
              <Mail className="h-4 w-4" />
              Email Client
            </a>
          )}
        </div>
      </div>

      {!isTerminalStatus(lead.status) && (
        <Card className="border-primary bg-primary-container text-on-primary">
          <CardContent className="flex flex-col items-start gap-4 p-0 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide opacity-80">
                Next Action
              </div>
              <div className="text-lg font-semibold">{lead.nextAction || "—"}</div>
              <div className="text-sm opacity-80">Due {formatDate(lead.nextActionDate)}</div>
            </div>
            {action && (
              <Button
                variant="secondary"
                onClick={() => action.onClick(navigate, refresh)}
                className="w-full sm:w-auto"
              >
                <CheckCircle2 className="h-4 w-4" />
                {action.label}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-medium text-on-surface">Research</h3>
            <Button variant="secondary" size="sm" onClick={handleCopyPrompt}>
              <ClipboardCopy className="h-3.5 w-3.5" />
              {copied ? "Copied!" : "Copy Research Prompt"}
            </Button>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Opportunity</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-on-surface">{lead.opportunity || "Not yet researched."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Problem</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-on-surface">{lead.problem || "Not yet researched."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Suggested Solution</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-on-surface">
                {lead.suggestedSolution || "Not yet researched."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Research Notes</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-on-surface">
                {lead.notes || "No notes yet."}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Outreach History</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {outreach.length === 0 && (
                <p className="text-sm text-on-surface-variant">No outreach sent yet.</p>
              )}
              {outreach.map((o) => (
                <div
                  key={o.id}
                  className="flex flex-col gap-1.5 rounded border border-outline-variant px-3 py-2 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <div className="min-w-0">
                    <span className="font-medium">{o.type.replace(/_/g, " ")}</span>
                    <span className="ml-2 text-on-surface-variant">{o.subject}</span>
                  </div>
                  <div className="flex shrink-0 items-center gap-3 font-mono text-xs text-on-surface-variant">
                    <span>{o.status}</span>
                    <span>{formatDate(o.sentAt)}</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {activities.length === 0 && (
                <p className="text-sm text-on-surface-variant">No activity yet.</p>
              )}
              {activities.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-col gap-0.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                >
                  <span className="text-on-surface">{a.description}</span>
                  <span className="shrink-0 font-mono text-xs text-on-surface-variant">
                    {formatDate(a.createdAt)}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Deal Metrics</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Estimated value</span>
                <span className="font-mono">
                  {formatValueRange(lead.estimatedValueMin, lead.estimatedValueMax)}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Estimated effort</span>
                <span>{lead.estimatedEffort || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-on-surface-variant">Score</span>
                <span className="font-mono">{lead.score ?? "—"}</span>
              </div>
              {lead.scoreReason && (
                <p className="text-xs text-on-surface-variant">{lead.scoreReason}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Contact</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2 text-sm">
              <div>
                <span className="text-on-surface-variant">Name: </span>
                {lead.contactName || "—"}
              </div>
              <div>
                <span className="text-on-surface-variant">Email: </span>
                {lead.email || "—"}
              </div>
              <div>
                <span className="text-on-surface-variant">Phone: </span>
                {lead.phone || "—"}
              </div>
              <div>
                <span className="text-on-surface-variant">Location: </span>
                {lead.location || "—"}
              </div>
              <div>
                <span className="text-on-surface-variant">Website: </span>
                {lead.website ? (
                  <a
                    href={lead.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary hover:underline"
                  >
                    {lead.website}
                  </a>
                ) : (
                  "—"
                )}
              </div>
              <div>
                <span className="text-on-surface-variant">Source: </span>
                {lead.source || "—"}
              </div>
            </CardContent>
          </Card>

          <Button variant="destructive" onClick={handleDelete}>
            <Trash2 className="h-4 w-4" />
            Delete Lead
          </Button>
        </div>
      </div>
    </div>
  )
}
