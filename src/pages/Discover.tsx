import { useMemo, useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { ExternalLink, Plus, Search } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select } from "@/components/ui/select"
import { useLeads } from "@/lib/hooks"
import { createLead } from "@/db/leads"
import { formatValueRange } from "@/lib/format"
import {
  getStoredApiKey,
  jobToLeadDraft,
  searchJobs,
  JobDataLakeError,
  type EmploymentType,
  type JobDataLakeJob,
  type RemoteType,
} from "@/lib/jobDataLake"

export default function Discover() {
  const { leads, refresh: refreshLeads } = useLeads()
  const navigate = useNavigate()
  const apiKey = getStoredApiKey()

  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("contract")
  const [remoteType, setRemoteType] = useState<RemoteType | "">("")

  const [jobs, setJobs] = useState<JobDataLakeJob[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  const existingSourceUrls = useMemo(
    () => new Set(leads.map((l) => l.sourceUrl).filter(Boolean)),
    [leads]
  )

  async function handleSearch() {
    setLoading(true)
    setError(null)
    setSearched(true)
    try {
      const results = await searchJobs({ query, location, employmentType, remoteType }, apiKey)
      setJobs(results)
    } catch (err) {
      setError(err instanceof JobDataLakeError ? err.message : "Search failed. Try again.")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  async function handleAddLead(job: JobDataLakeJob) {
    setAddingId(job.id)
    try {
      const lead = await createLead(jobToLeadDraft(job))
      await refreshLeads()
      navigate(`/leads/${lead.id}`)
    } finally {
      setAddingId(null)
    }
  }

  if (!apiKey) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
          <p className="text-sm text-on-surface-variant">
            Discover pulls contract/freelance-shaped listings from the JobDataLake API. Add your
            API key in Settings to start searching.
          </p>
          <Link to="/settings" className={buttonVariants()}>
            Go to Settings
          </Link>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Search for work</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Keyword</label>
            <Input
              placeholder="e.g. shopify developer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Location</label>
            <Input
              placeholder="e.g. Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Employment type</label>
            <Select
              value={employmentType}
              onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
              className="w-40"
            >
              <option value="">Any</option>
              <option value="contract">Contract</option>
              <option value="part_time">Part-time</option>
              <option value="full_time">Full-time</option>
              <option value="internship">Internship</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Remote</label>
            <Select
              value={remoteType}
              onChange={(e) => setRemoteType(e.target.value as RemoteType | "")}
              className="w-36"
            >
              <option value="">Any</option>
              <option value="fully_remote">Fully remote</option>
              <option value="hybrid">Hybrid</option>
              <option value="on_site">On-site</option>
            </Select>
          </div>
          <Button onClick={handleSearch} disabled={loading}>
            <Search className="h-4 w-4" />
            {loading ? "Searching…" : "Search"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded border border-error px-4 py-3 text-sm text-error">{error}</div>
      )}

      {searched && !loading && !error && jobs.length === 0 && (
        <p className="text-sm text-on-surface-variant">No matching listings found.</p>
      )}

      <div className="flex flex-col gap-3">
        {jobs.map((job) => {
          const alreadyAdded = job.applyUrl !== "" && existingSourceUrls.has(job.applyUrl)
          return (
            <Card key={job.id}>
              <CardContent className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-on-surface">{job.title}</span>
                    <span className="text-sm text-on-surface-variant">at {job.company}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                    {job.location && <span>{job.location}</span>}
                    {job.remoteType && <span>{job.remoteType.replace(/_/g, " ")}</span>}
                    {job.employmentType && <span>{job.employmentType.replace(/_/g, " ")}</span>}
                    {(job.salaryMin || job.salaryMax) && (
                      <span className="font-mono">
                        {formatValueRange(job.salaryMin, job.salaryMax)}
                      </span>
                    )}
                  </div>
                  {job.skills.length > 0 && (
                    <div className="mt-1 truncate text-xs text-on-surface-variant">
                      {job.skills.join(", ")}
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {job.applyUrl && (
                    <a
                      href={job.applyUrl}
                      target="_blank"
                      rel="noreferrer"
                      title="Open listing"
                      className={buttonVariants({ variant: "ghost", size: "icon" })}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                  <Button
                    variant="secondary"
                    size="sm"
                    disabled={alreadyAdded || addingId === job.id}
                    onClick={() => handleAddLead(job)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    {alreadyAdded ? "Already added" : addingId === job.id ? "Adding…" : "Add as Lead"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
