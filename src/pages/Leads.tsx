import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { FolderOpen, Pencil, Archive, ArchiveRestore } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { StatusBadge } from "@/components/StatusBadge"
import { useLeads, useOutreach } from "@/lib/hooks"
import { archiveLead, unarchiveLead } from "@/db/leads"
import { getLastContact } from "@/db/outreach"
import { formatDate, formatValueRange, todayISODate } from "@/lib/format"
import { cn } from "@/lib/utils"

type FilterId = "all" | "hot" | "qualified" | "contacted" | "follow_up" | "won" | "lost"

const FILTERS: { id: FilterId; label: string }[] = [
  { id: "all", label: "All" },
  { id: "hot", label: "Hot" },
  { id: "qualified", label: "Qualified" },
  { id: "contacted", label: "Contacted" },
  { id: "follow_up", label: "Follow-up" },
  { id: "won", label: "Won" },
  { id: "lost", label: "Lost" },
]

type SortId = "score" | "value" | "last_contact" | "next_action_date"

export default function Leads() {
  const { leads, refresh } = useLeads()
  const { outreach } = useOutreach()
  const navigate = useNavigate()
  const [filter, setFilter] = useState<FilterId>("all")
  const [search, setSearch] = useState("")
  const [sort, setSort] = useState<SortId>("score")
  const [showArchived, setShowArchived] = useState(false)

  const today = todayISODate()

  const outreachByLead = useMemo(() => {
    const map = new Map<string, typeof outreach>()
    for (const o of outreach) {
      const list = map.get(o.leadId) ?? []
      list.push(o)
      map.set(o.leadId, list)
    }
    return map
  }, [outreach])

  const leadHasDueFollowUp = (leadId: string) =>
    (outreachByLead.get(leadId) ?? []).some(
      (o) => o.followUpDate && o.followUpDate <= today && o.status !== "replied"
    )

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return leads
      .filter((l) => (showArchived ? l.archived : !l.archived))
      .filter((l) => {
        switch (filter) {
          case "hot":
            return (l.score ?? 0) >= 70
          case "qualified":
            return l.status === "QUALIFIED"
          case "contacted":
            return l.status === "CONTACTED"
          case "follow_up":
            return leadHasDueFollowUp(l.id)
          case "won":
            return l.status === "WON"
          case "lost":
            return l.status === "LOST"
          default:
            return true
        }
      })
      .filter((l) => {
        if (!q) return true
        return (
          l.businessName.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q)
        )
      })
  }, [leads, filter, search, showArchived, outreachByLead, today])

  const sorted = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      switch (sort) {
        case "value":
          return (b.estimatedValueMax ?? 0) - (a.estimatedValueMax ?? 0)
        case "last_contact": {
          const av = getLastContact(outreachByLead.get(a.id) ?? []) ?? ""
          const bv = getLastContact(outreachByLead.get(b.id) ?? []) ?? ""
          return bv.localeCompare(av)
        }
        case "next_action_date": {
          const av = a.nextActionDate ?? "9999-99-99"
          const bv = b.nextActionDate ?? "9999-99-99"
          return av.localeCompare(bv)
        }
        default:
          return (b.score ?? 0) - (a.score ?? 0)
      }
    })
    return list
  }, [filtered, sort, outreachByLead])

  async function handleArchive(id: string, archived: boolean) {
    if (archived) await unarchiveLead(id)
    else await archiveLead(id)
    refresh()
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
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
        <Input
          placeholder="Search leads…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64"
        />
      </div>

      <div className="flex items-center justify-between gap-4">
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          <input
            type="checkbox"
            checked={showArchived}
            onChange={(e) => setShowArchived(e.target.checked)}
          />
          Show archived
        </label>
        <label className="flex items-center gap-2 text-sm text-on-surface-variant">
          Sort by
          <Select value={sort} onChange={(e) => setSort(e.target.value as SortId)} className="w-44">
            <option value="score">Score</option>
            <option value="value">Value</option>
            <option value="last_contact">Last contact</option>
            <option value="next_action_date">Next action date</option>
          </Select>
        </label>
      </div>

      <div className="rounded-lg border border-outline-variant bg-surface-lowest">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Company / Contact</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Score</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Next Action</TableHead>
              <TableHead>Last Contact</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-on-surface-variant">
                  No leads match this view.
                </TableCell>
              </TableRow>
            )}
            {sorted.map((lead) => (
              <TableRow key={lead.id}>
                <TableCell>
                  <button
                    className="text-left font-medium text-on-surface hover:text-primary"
                    onClick={() => navigate(`/leads/${lead.id}`)}
                  >
                    {lead.businessName}
                  </button>
                  {lead.contactName && (
                    <div className="text-xs text-on-surface-variant">{lead.contactName}</div>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={lead.status} />
                </TableCell>
                <TableCell className="font-mono">{lead.score ?? "—"}</TableCell>
                <TableCell className="font-mono">
                  {formatValueRange(lead.estimatedValueMin, lead.estimatedValueMax)}
                </TableCell>
                <TableCell>{lead.nextAction || "—"}</TableCell>
                <TableCell className="font-mono">
                  {formatDate(getLastContact(outreachByLead.get(lead.id) ?? []))}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Open"
                      onClick={() => navigate(`/leads/${lead.id}`)}
                    >
                      <FolderOpen className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Edit"
                      onClick={() => navigate(`/leads/${lead.id}/edit`)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title={lead.archived ? "Restore" : "Archive"}
                      onClick={() => handleArchive(lead.id, lead.archived)}
                    >
                      {lead.archived ? (
                        <ArchiveRestore className="h-4 w-4" />
                      ) : (
                        <Archive className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
