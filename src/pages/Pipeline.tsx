import { useMemo } from "react"
import { useNavigate } from "react-router-dom"
import { LEAD_STATUSES, type Lead, type LeadStatus } from "@/db/schema"
import { useLeads } from "@/lib/hooks"
import { setStatus } from "@/db/leads"
import { Select } from "@/components/ui/select"

export default function Pipeline() {
  const { leads, refresh } = useLeads()
  const navigate = useNavigate()

  const active = useMemo(() => leads.filter((l) => !l.archived), [leads])

  const byStatus = useMemo(() => {
    const map = new Map<LeadStatus, Lead[]>()
    for (const status of LEAD_STATUSES) map.set(status, [])
    for (const lead of active) map.get(lead.status)?.push(lead)
    return map
  }, [active])

  async function handleStatusChange(id: string, status: LeadStatus) {
    await setStatus(id, status)
    refresh()
  }

  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
      {LEAD_STATUSES.map((status) => {
        const columnLeads = byStatus.get(status) ?? []
        return (
          <div
            key={status}
            className="flex w-[85vw] shrink-0 snap-start flex-col gap-3 sm:w-64"
          >
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-semibold uppercase tracking-wide text-on-surface-variant">
                {status.replace(/_/g, " ")}
              </span>
              <span className="font-mono text-xs text-on-surface-variant">{columnLeads.length}</span>
            </div>
            <div className="flex flex-col gap-2">
              {columnLeads.map((lead) => (
                <div
                  key={lead.id}
                  className="flex flex-col gap-2 rounded border border-outline-variant bg-surface-lowest p-3"
                >
                  <button
                    className="text-left text-sm font-medium text-on-surface hover:text-primary"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    {lead.businessName}
                  </button>
                  <div className="flex items-center justify-between">
                    <span className="rounded bg-surface-low px-1.5 py-0.5 font-mono text-xs text-on-surface-variant">
                      {lead.score ?? "—"}
                    </span>
                    <span className="text-xs text-on-surface-variant">{lead.nextAction || "—"}</span>
                  </div>
                  <Select
                    value={lead.status}
                    onChange={(e) => handleStatusChange(lead.id, e.target.value as LeadStatus)}
                    className="h-7 text-xs"
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </Select>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
