import { getDB } from "./db"
import type { Lead, LeadStatus } from "./schema"
import { getNextActionLabel } from "@/lib/nextAction"
import { logActivity } from "./activities"

export type NewLead = Omit<
  Lead,
  "id" | "createdAt" | "updatedAt" | "archived" | "nextAction"
> &
  Partial<Pick<Lead, "archived" | "nextAction">>

export async function createLead(input: NewLead): Promise<Lead> {
  const db = await getDB()
  const now = new Date().toISOString()
  const lead: Lead = {
    ...input,
    id: crypto.randomUUID(),
    archived: input.archived ?? false,
    nextAction: input.nextAction ?? getNextActionLabel(input.status),
    createdAt: now,
    updatedAt: now,
  }
  await db.add("leads", lead)
  await logActivity(lead.id, "other", `Lead "${lead.businessName}" created`)
  return lead
}

export async function getLead(id: string): Promise<Lead | undefined> {
  const db = await getDB()
  return db.get("leads", id)
}

export async function getAllLeads(): Promise<Lead[]> {
  const db = await getDB()
  return db.getAll("leads")
}

export async function updateLead(
  id: string,
  patch: Partial<Omit<Lead, "id" | "createdAt">>
): Promise<Lead> {
  const db = await getDB()
  const existing = await db.get("leads", id)
  if (!existing) throw new Error(`Lead ${id} not found`)
  const updated: Lead = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.put("leads", updated)
  return updated
}

export async function setStatus(id: string, status: LeadStatus): Promise<Lead> {
  const db = await getDB()
  const existing = await db.get("leads", id)
  if (!existing) throw new Error(`Lead ${id} not found`)
  const previous = existing.status
  const updated: Lead = {
    ...existing,
    status,
    nextAction: getNextActionLabel(status),
    updatedAt: new Date().toISOString(),
  }
  await db.put("leads", updated)
  if (previous !== status) {
    await logActivity(id, "status_change", `Status changed from ${previous} to ${status}`)
  }
  return updated
}

export async function archiveLead(id: string): Promise<Lead> {
  return updateLead(id, { archived: true })
}

export async function unarchiveLead(id: string): Promise<Lead> {
  return updateLead(id, { archived: false })
}

export async function deleteLead(id: string): Promise<void> {
  const db = await getDB()
  await db.delete("leads", id)
}
