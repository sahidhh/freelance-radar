import { useEffect, useMemo, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useLeads, useProjects } from "@/lib/hooks"
import { createProject, updateProject } from "@/db/projects"
import { formatDate, formatMoney } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { Project, ProjectStatus } from "@/db/schema"

const PROJECT_STATUSES: ProjectStatus[] = ["active", "completed", "on_hold", "cancelled"]

function todayDate(): string {
  return new Date().toISOString().slice(0, 10)
}

export default function Projects() {
  const { leads } = useLeads()
  const { projects, refresh } = useProjects()
  const [searchParams, setSearchParams] = useSearchParams()
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const leadsById = useMemo(() => new Map(leads.map((l) => [l.id, l])), [leads])
  const createForLeadId = searchParams.get("createFor")
  const createForLead = createForLeadId ? leadsById.get(createForLeadId) : undefined
  const existingProjectForLead = createForLeadId
    ? projects.find((p) => p.leadId === createForLeadId)
    : undefined

  useEffect(() => {
    if (existingProjectForLead) {
      setSelectedId(existingProjectForLead.id)
      setSearchParams({}, { replace: true })
    }
  }, [existingProjectForLead, setSearchParams])

  const selected = projects.find((p) => p.id === selectedId) ?? null

  const showCreateForm = Boolean(createForLead) && !existingProjectForLead

  return (
    <div className="grid grid-cols-3 gap-6">
      <div className="col-span-1 flex flex-col gap-2">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-on-surface-variant">
          Projects
        </h3>
        {projects.length === 0 && (
          <p className="text-sm text-on-surface-variant">
            No projects yet. Mark a lead WON and use "Create Project" on Lead Detail.
          </p>
        )}
        <div className="rounded-lg border border-outline-variant bg-surface-lowest">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {projects.map((p) => (
                <TableRow
                  key={p.id}
                  className={cn("cursor-pointer", selected?.id === p.id && "bg-surface-low")}
                  onClick={() => {
                    setSelectedId(p.id)
                    setSearchParams({}, { replace: true })
                  }}
                >
                  <TableCell>
                    <div className="font-medium">{p.name}</div>
                    <div className="text-xs text-on-surface-variant">
                      {leadsById.get(p.leadId)?.businessName ?? "—"}
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">{p.status.replace(/_/g, " ")}</TableCell>
                  <TableCell className="font-mono">{formatMoney(p.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      <div className="col-span-2">
        {showCreateForm && createForLead && (
          <CreateProjectForm
            lead={createForLead}
            onCreated={(project) => {
              refresh()
              setSelectedId(project.id)
              setSearchParams({}, { replace: true })
            }}
          />
        )}
        {!showCreateForm && selected && (
          <ProjectDetail
            project={selected}
            clientName={leadsById.get(selected.leadId)?.businessName}
            onSaved={refresh}
          />
        )}
        {!showCreateForm && !selected && (
          <Card>
            <CardContent>
              <p className="text-sm text-on-surface-variant">Select a project to view details.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function CreateProjectForm({
  lead,
  onCreated,
}: {
  lead: { id: string; businessName: string; estimatedValueMin: number | null; estimatedValueMax: number | null }
  onCreated: (project: Project) => void
}) {
  const [name, setName] = useState(lead.businessName)
  const [value, setValue] = useState(
    String(lead.estimatedValueMax ?? lead.estimatedValueMin ?? "")
  )
  const [startDate, setStartDate] = useState(todayDate())

  async function handleCreate() {
    const created = await createProject({
      leadId: lead.id,
      name: name.trim() || lead.businessName,
      value: value.trim() === "" ? null : Number(value),
      status: "active",
      startDate: startDate || null,
      dueDate: null,
      paymentReceived: 0,
      paymentPending: value.trim() === "" ? 0 : Number(value),
      notes: "",
    })
    onCreated(created)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Project for {lead.businessName}</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-on-surface-variant">Project name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-on-surface-variant">Value ($)</span>
          <Input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-on-surface-variant">Start date</span>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </label>
        <div>
          <Button onClick={handleCreate}>Create Project</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function ProjectDetail({
  project,
  clientName,
  onSaved,
}: {
  project: Project
  clientName: string | undefined
  onSaved: () => void
}) {
  const [name, setName] = useState(project.name)
  const [value, setValue] = useState(project.value?.toString() ?? "")
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [startDate, setStartDate] = useState(project.startDate?.slice(0, 10) ?? "")
  const [dueDate, setDueDate] = useState(project.dueDate?.slice(0, 10) ?? "")
  const [paymentReceived, setPaymentReceived] = useState(String(project.paymentReceived))
  const [paymentPending, setPaymentPending] = useState(String(project.paymentPending))
  const [notes, setNotes] = useState(project.notes)

  useEffect(() => {
    setName(project.name)
    setValue(project.value?.toString() ?? "")
    setStatus(project.status)
    setStartDate(project.startDate?.slice(0, 10) ?? "")
    setDueDate(project.dueDate?.slice(0, 10) ?? "")
    setPaymentReceived(String(project.paymentReceived))
    setPaymentPending(String(project.paymentPending))
    setNotes(project.notes)
  }, [project.id])

  async function handleSave() {
    await updateProject(project.id, {
      name: name.trim() || project.name,
      value: value.trim() === "" ? null : Number(value),
      status,
      startDate: startDate || null,
      dueDate: dueDate || null,
      paymentReceived: Number(paymentReceived) || 0,
      paymentPending: Number(paymentPending) || 0,
      notes,
    })
    onSaved()
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{project.name}</CardTitle>
        <span className="text-sm text-on-surface-variant">{clientName ?? "Unknown client"}</span>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-on-surface-variant">Project name</span>
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-on-surface-variant">Value ($)</span>
            <Input type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-on-surface-variant">Status</span>
            <Select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}>
              {PROJECT_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-on-surface-variant">Start date</span>
            <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-on-surface-variant">Due date</span>
            <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </label>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-on-surface-variant">Payment received ($)</span>
            <Input
              type="number"
              min="0"
              value={paymentReceived}
              onChange={(e) => setPaymentReceived(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="font-medium text-on-surface-variant">Payment pending ($)</span>
            <Input
              type="number"
              min="0"
              value={paymentPending}
              onChange={(e) => setPaymentPending(e.target.value)}
            />
          </label>
        </div>
        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium text-on-surface-variant">Notes</span>
          <Textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </label>
        <p className="text-xs text-on-surface-variant">
          Created {formatDate(project.createdAt)} · Last updated {formatDate(project.updatedAt)}
        </p>
        <div>
          <Button onClick={handleSave}>Save changes</Button>
        </div>
      </CardContent>
    </Card>
  )
}
