import { useCallback, useEffect, useState } from "react"
import { getAllLeads, getLead } from "@/db/leads"
import { getAllOutreach, getOutreachForLead } from "@/db/outreach"
import { getAllProjects } from "@/db/projects"
import { getActivitiesForLead } from "@/db/activities"
import type { Activity, Lead, Outreach, Project } from "@/db/schema"

function useCollection<T>(fetcher: () => Promise<T[]>, deps: unknown[] = []) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    setLoading(true)
    return fetcher()
      .then(setItems)
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    refresh()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return { items, loading, refresh }
}

export function useLeads() {
  const { items, loading, refresh } = useCollection<Lead>(getAllLeads)
  return { leads: items, loading, refresh }
}

export function useOutreach() {
  const { items, loading, refresh } = useCollection<Outreach>(getAllOutreach)
  return { outreach: items, loading, refresh }
}

export function useProjects() {
  const { items, loading, refresh } = useCollection<Project>(getAllProjects)
  return { projects: items, loading, refresh }
}

export function useLead(id: string | undefined) {
  const [lead, setLead] = useState<Lead | undefined>(undefined)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(() => {
    if (!id) {
      setLead(undefined)
      setLoading(false)
      return Promise.resolve()
    }
    setLoading(true)
    return getLead(id)
      .then(setLead)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => {
    refresh()
  }, [refresh])

  return { lead, loading, refresh }
}

export function useOutreachForLead(leadId: string | undefined) {
  const { items, loading, refresh } = useCollection<Outreach>(
    () => (leadId ? getOutreachForLead(leadId) : Promise.resolve([])),
    [leadId]
  )
  return { outreach: items, loading, refresh }
}

export function useActivitiesForLead(leadId: string | undefined) {
  const { items, loading, refresh } = useCollection<Activity>(
    () => (leadId ? getActivitiesForLead(leadId) : Promise.resolve([])),
    [leadId]
  )
  return { activities: items, loading, refresh }
}
