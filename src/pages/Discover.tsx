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
  JobFeedError,
  type EmploymentType,
  type JobListing,
  type RemoteType,
} from "@/lib/jobDataLake"
import { FEEDS, fetchArbeitnowPage, fetchFeed, type FeedId } from "@/lib/jobFeeds"

type SourceId = FeedId | "jobdatalake"

export default function Discover() {
  const { leads, refresh: refreshLeads } = useLeads()
  const navigate = useNavigate()
  const apiKey = getStoredApiKey()

  // Defaults to a keyless feed: JobDataLake needs a signup key to return usable
  // fields, so it is opt-in rather than the thing that greets you.
  const [sourceId, setSourceId] = useState<SourceId>("remoteok")
  const [query, setQuery] = useState("")
  const [location, setLocation] = useState("")
  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("contract")
  const [remoteType, setRemoteType] = useState<RemoteType | "">("")

  const [jobs, setJobs] = useState<JobListing[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [searched, setSearched] = useState(false)

  // Arbeitnow-only pagination: the other two feeds return their whole board
  // in one request, so this stays unused (and the button hidden) for them.
  const [arbeitnowPage, setArbeitnowPage] = useState(1)
  const [hasMoreArbeitnow, setHasMoreArbeitnow] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const isJobDataLake = sourceId === "jobdatalake"
  const sourceLabel = isJobDataLake
    ? "JobDataLake"
    : (FEEDS.find((f) => f.id === sourceId)?.source ?? "JobDataLake")

  const existingSourceUrls = useMemo(
    () => new Set(leads.map((l) => l.sourceUrl).filter(Boolean)),
    [leads]
  )

  async function handleSearch() {
    setLoading(true)
    setError(null)
    setSearched(true)
    setArbeitnowPage(1)
    setHasMoreArbeitnow(false)
    try {
      if (sourceId === "arbeitnow") {
        const { jobs: results, hasNext } = await fetchArbeitnowPage(1, { query, location })
        setJobs(results)
        setHasMoreArbeitnow(hasNext)
      } else {
        const results = isJobDataLake
          ? await searchJobs({ query, location, employmentType, remoteType }, apiKey)
          : await fetchFeed(sourceId as FeedId, { query, location })
        setJobs(results)
      }
    } catch (err) {
      setError(err instanceof JobFeedError ? err.message : "Search failed. Try again.")
      setJobs([])
    } finally {
      setLoading(false)
    }
  }

  async function handleLoadMore() {
    setLoadingMore(true)
    setError(null)
    try {
      const nextPage = arbeitnowPage + 1
      const { jobs: newJobs, hasNext } = await fetchArbeitnowPage(nextPage, { query, location })
      setJobs((prev) => [...prev, ...newJobs])
      setArbeitnowPage(nextPage)
      setHasMoreArbeitnow(hasNext)
    } catch (err) {
      setError(err instanceof JobFeedError ? err.message : "Search failed. Try again.")
    } finally {
      setLoadingMore(false)
    }
  }

  async function handleAddLead(job: JobListing) {
    setAddingId(job.id)
    try {
      const lead = await createLead(jobToLeadDraft(job, sourceLabel))
      await refreshLeads()
      navigate(`/leads/${lead.id}`)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Search for work</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 md:flex-row md:flex-wrap md:items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Source</label>
            <Select
              value={sourceId}
              // Results are cleared on a source change: leaving them up would
              // let "Add as Lead" file a RemoteOK listing under the newly
              // selected source, since the draft is attributed to `sourceId`.
              onChange={(e) => {
                setSourceId(e.target.value as SourceId)
                setJobs([])
                setSearched(false)
                setError(null)
                setArbeitnowPage(1)
                setHasMoreArbeitnow(false)
              }}
              className="w-full sm:w-40"
            >
              {FEEDS.map((feed) => (
                <option key={feed.id} value={feed.id}>
                  {feed.label}
                </option>
              ))}
              <option value="jobdatalake">JobDataLake (key)</option>
            </Select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Keyword</label>
            <Input
              placeholder="e.g. shopify developer"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full sm:w-56"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-on-surface-variant">Location</label>
            <Input
              placeholder="e.g. Remote"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full sm:w-44"
            />
          </div>
          {isJobDataLake && (
            <>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-on-surface-variant">
                  Employment type
                </label>
                <Select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value as EmploymentType | "")}
                  className="w-full sm:w-40"
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
                  className="w-full sm:w-36"
                >
                  <option value="">Any</option>
                  <option value="fully_remote">Fully remote</option>
                  <option value="hybrid">Hybrid</option>
                  <option value="on_site">On-site</option>
                </Select>
              </div>
            </>
          )}
          <Button onClick={handleSearch} disabled={loading || (isJobDataLake && !apiKey)}>
            <Search className="h-4 w-4" />
            {loading ? "Searching…" : "Search"}
          </Button>
        </CardContent>
      </Card>

      {isJobDataLake && !apiKey && (
        <div className="flex flex-wrap items-center gap-3 rounded border border-outline px-4 py-3 text-sm text-on-surface-variant">
          <span>
            JobDataLake needs a free API key — without one its listings come back with no company
            name and no apply link. The other sources need nothing.
          </span>
          <Link to="/settings" className={buttonVariants({ variant: "secondary", size: "sm" })}>
            Add key
          </Link>
        </div>
      )}

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
              <CardContent className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between md:gap-4 py-4">
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

      {sourceId === "arbeitnow" && hasMoreArbeitnow && jobs.length > 0 && (
        <div className="flex justify-center">
          <Button variant="secondary" onClick={handleLoadMore} disabled={loadingMore}>
            {loadingMore ? "Loading…" : "Load more"}
          </Button>
        </div>
      )}

      {/* Remote OK's API terms require a followed link back when their data is shown. */}
      {sourceId === "remoteok" && jobs.length > 0 && (
        <p className="text-xs text-on-surface-variant">
          Jobs from{" "}
          <a href="https://remoteok.com" target="_blank" rel="noreferrer" className="underline">
            Remote OK
          </a>
        </p>
      )}
    </div>
  )
}
