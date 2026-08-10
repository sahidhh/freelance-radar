import { getDB } from "./db"
import type { Outreach, OutreachStatus } from "./schema"
import { logActivity } from "./activities"

export type NewOutreach = Omit<Outreach, "id" | "createdAt" | "updatedAt" | "status" | "sentAt"> &
  Partial<Pick<Outreach, "status" | "sentAt">>

export async function createOutreach(input: NewOutreach): Promise<Outreach> {
  const db = await getDB()
  const now = new Date().toISOString()
  const outreach: Outreach = {
    ...input,
    id: crypto.randomUUID(),
    status: input.status ?? "draft",
    sentAt: input.sentAt ?? null,
    createdAt: now,
    updatedAt: now,
  }
  await db.add("outreach", outreach)
  return outreach
}

export async function getOutreach(id: string): Promise<Outreach | undefined> {
  const db = await getDB()
  return db.get("outreach", id)
}

export async function getAllOutreach(): Promise<Outreach[]> {
  const db = await getDB()
  return db.getAll("outreach")
}

export async function getOutreachForLead(leadId: string): Promise<Outreach[]> {
  const db = await getDB()
  const rows = await db.getAllFromIndex("outreach", "leadId", leadId)
  return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function updateOutreach(
  id: string,
  patch: Partial<Omit<Outreach, "id" | "createdAt">>
): Promise<Outreach> {
  const db = await getDB()
  const existing = await db.get("outreach", id)
  if (!existing) throw new Error(`Outreach ${id} not found`)
  const updated: Outreach = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.put("outreach", updated)
  return updated
}

export async function markSent(id: string, followUpDate: string | null): Promise<Outreach> {
  const db = await getDB()
  const existing = await db.get("outreach", id)
  if (!existing) throw new Error(`Outreach ${id} not found`)
  const updated = await updateOutreach(id, {
    status: "sent",
    sentAt: new Date().toISOString(),
    followUpDate,
  })
  await logActivity(
    existing.leadId,
    "outreach_sent",
    `Outreach (${existing.type.replace("_", " ")}) marked as sent`
  )
  return updated
}

export async function markReplied(id: string): Promise<Outreach> {
  const db = await getDB()
  const existing = await db.get("outreach", id)
  if (!existing) throw new Error(`Outreach ${id} not found`)
  const updated = await updateOutreach(id, { status: "replied" })
  await logActivity(existing.leadId, "outreach_replied", `Outreach marked as replied`)
  return updated
}

export async function setOutreachStatus(id: string, status: OutreachStatus): Promise<Outreach> {
  return updateOutreach(id, { status })
}

/** Most recent sentAt among a lead's non-draft outreach records; undefined if none. */
export function getLastContact(outreachForLead: Outreach[]): string | undefined {
  const sent = outreachForLead
    .filter((o) => o.status !== "draft" && o.sentAt)
    .map((o) => o.sentAt as string)
    .sort()
  return sent.length ? sent[sent.length - 1] : undefined
}

/** Outreach records with a followUpDate on/before `today` that haven't been replied to. */
export async function getDueFollowUps(today: string = new Date().toISOString().slice(0, 10)): Promise<Outreach[]> {
  const db = await getDB()
  const all = await db.getAll("outreach")
  return all
    .filter((o) => o.followUpDate && o.followUpDate <= today && o.status !== "replied")
    .sort((a, b) => (a.followUpDate ?? "").localeCompare(b.followUpDate ?? ""))
}
