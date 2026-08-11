import { useEffect, useState, type FormEvent } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { createLead, getLead, setStatus, updateLead } from "@/db/leads"
import { LEAD_STATUSES, type EstimatedEffort, type Lead, type LeadStatus } from "@/db/schema"
import { getNextActionLabel } from "@/lib/nextAction"

interface FormState {
  businessName: string
  website: string
  industry: string
  location: string
  contactName: string
  email: string
  phone: string
  source: string
  sourceUrl: string
  opportunity: string
  problem: string
  suggestedSolution: string
  estimatedValueMin: string
  estimatedValueMax: string
  estimatedEffort: EstimatedEffort | ""
  score: string
  scoreReason: string
  status: LeadStatus
  nextActionDate: string
  notes: string
}

const EMPTY_FORM: FormState = {
  businessName: "",
  website: "",
  industry: "",
  location: "",
  contactName: "",
  email: "",
  phone: "",
  source: "",
  sourceUrl: "",
  opportunity: "",
  problem: "",
  suggestedSolution: "",
  estimatedValueMin: "",
  estimatedValueMax: "",
  estimatedEffort: "",
  score: "",
  scoreReason: "",
  status: "NEW",
  nextActionDate: "",
  notes: "",
}

function leadToForm(lead: Lead): FormState {
  return {
    businessName: lead.businessName,
    website: lead.website,
    industry: lead.industry,
    location: lead.location,
    contactName: lead.contactName,
    email: lead.email,
    phone: lead.phone,
    source: lead.source,
    sourceUrl: lead.sourceUrl,
    opportunity: lead.opportunity,
    problem: lead.problem,
    suggestedSolution: lead.suggestedSolution,
    estimatedValueMin: lead.estimatedValueMin?.toString() ?? "",
    estimatedValueMax: lead.estimatedValueMax?.toString() ?? "",
    estimatedEffort: lead.estimatedEffort,
    score: lead.score?.toString() ?? "",
    scoreReason: lead.scoreReason,
    status: lead.status,
    nextActionDate: lead.nextActionDate?.slice(0, 10) ?? "",
    notes: lead.notes,
  }
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null
  const n = Number(value)
  return Number.isNaN(n) ? null : n
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm">
      <span className="font-medium text-on-surface-variant">{label}</span>
      {children}
    </label>
  )
}

export default function LeadForm() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(EMPTY_FORM)
  const [originalStatus, setOriginalStatus] = useState<LeadStatus>("NEW")
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(isEdit)

  useEffect(() => {
    if (!id) return
    getLead(id).then((lead) => {
      if (lead) {
        setForm(leadToForm(lead))
        setOriginalStatus(lead.status)
      }
      setLoading(false)
    })
  }, [id])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }))
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)

    if (!form.businessName.trim()) {
      setError("Business name is required.")
      return
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setError("Email address is not valid.")
      return
    }

    const payload = {
      businessName: form.businessName.trim(),
      website: form.website.trim(),
      contactName: form.contactName.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      location: form.location.trim(),
      industry: form.industry.trim(),
      source: form.source.trim(),
      sourceUrl: form.sourceUrl.trim(),
      opportunity: form.opportunity.trim(),
      problem: form.problem.trim(),
      suggestedSolution: form.suggestedSolution.trim(),
      estimatedValueMin: toNumberOrNull(form.estimatedValueMin),
      estimatedValueMax: toNumberOrNull(form.estimatedValueMax),
      estimatedEffort: form.estimatedEffort,
      score: toNumberOrNull(form.score),
      scoreReason: form.scoreReason.trim(),
      status: form.status,
      nextActionDate: form.nextActionDate ? form.nextActionDate : null,
      notes: form.notes,
    }

    if (isEdit && id) {
      if (form.status !== originalStatus) {
        await setStatus(id, form.status)
      }
      const updated = await updateLead(id, payload)
      navigate(`/leads/${updated.id}`)
    } else {
      const created = await createLead(payload)
      navigate(`/leads/${created.id}`)
    }
  }

  if (loading) return <div>Loading…</div>

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 pb-16">
      {error && (
        <div className="rounded border border-error bg-surface-lowest px-4 py-3 text-sm text-error">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Business</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Business name *">
            <Input
              value={form.businessName}
              onChange={(e) => set("businessName", e.target.value)}
              required
            />
          </Field>
          <Field label="Website">
            <Input value={form.website} onChange={(e) => set("website", e.target.value)} />
          </Field>
          <Field label="Industry">
            <Input value={form.industry} onChange={(e) => set("industry", e.target.value)} />
          </Field>
          <Field label="Location">
            <Input value={form.location} onChange={(e) => set("location", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Contact name">
            <Input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
            />
          </Field>
          <Field label="Phone">
            <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Source">
            <Input
              value={form.source}
              onChange={(e) => set("source", e.target.value)}
              placeholder="e.g. Upwork, referral, cold outreach"
            />
          </Field>
          <Field label="Source URL">
            <Input value={form.sourceUrl} onChange={(e) => set("sourceUrl", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      {isEdit && (
        <Card>
          <CardHeader>
            <CardTitle>Opportunity</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Field label="Opportunity">
              <Textarea
                rows={2}
                value={form.opportunity}
                onChange={(e) => set("opportunity", e.target.value)}
              />
            </Field>
            <Field label="Problem">
              <Textarea
                rows={2}
                value={form.problem}
                onChange={(e) => set("problem", e.target.value)}
              />
            </Field>
            <Field label="Suggested solution">
              <Textarea
                rows={2}
                value={form.suggestedSolution}
                onChange={(e) => set("suggestedSolution", e.target.value)}
              />
            </Field>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Value</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Field label="Estimated value min ($)">
            <Input
              type="number"
              min="0"
              value={form.estimatedValueMin}
              onChange={(e) => set("estimatedValueMin", e.target.value)}
            />
          </Field>
          <Field label="Estimated value max ($)">
            <Input
              type="number"
              min="0"
              value={form.estimatedValueMax}
              onChange={(e) => set("estimatedValueMax", e.target.value)}
            />
          </Field>
          <Field label="Estimated effort">
            <Select
              value={form.estimatedEffort}
              onChange={(e) => set("estimatedEffort", e.target.value as EstimatedEffort | "")}
            >
              <option value="">—</option>
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </Select>
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Score</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
          <Field label="Score (0-100)">
            <Input
              type="number"
              min="0"
              max="100"
              value={form.score}
              onChange={(e) => set("score", e.target.value)}
            />
          </Field>
          <Field label="Score reason">
            <Input value={form.scoreReason} onChange={(e) => set("scoreReason", e.target.value)} />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Status &amp; next action</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-3 gap-4">
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) => set("status", e.target.value as LeadStatus)}
            >
              {LEAD_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, " ")}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Next action">
            <Input value={getNextActionLabel(form.status) || "—"} disabled readOnly />
          </Field>
          <Field label="Next action date">
            <Input
              type="date"
              value={form.nextActionDate}
              onChange={(e) => set("nextActionDate", e.target.value)}
            />
          </Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button type="submit">{isEdit ? "Save changes" : "Add lead"}</Button>
      </div>
    </form>
  )
}
