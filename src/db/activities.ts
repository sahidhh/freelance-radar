import { getDB } from "./db"
import type { Activity, ActivityType } from "./schema"

export async function logActivity(
  leadId: string,
  type: ActivityType,
  description: string
): Promise<Activity> {
  const db = await getDB()
  const activity: Activity = {
    id: crypto.randomUUID(),
    leadId,
    type,
    description,
    createdAt: new Date().toISOString(),
  }
  await db.add("activities", activity)
  return activity
}

export async function getActivitiesForLead(leadId: string): Promise<Activity[]> {
  const db = await getDB()
  const activities = await db.getAllFromIndex("activities", "leadId", leadId)
  return activities.sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}

export async function getAllActivities(): Promise<Activity[]> {
  const db = await getDB()
  return db.getAll("activities")
}
