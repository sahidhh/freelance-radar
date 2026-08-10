import { openDB, type DBSchema, type IDBPDatabase } from "idb"
import type { Activity, Lead, Outreach, Project } from "./schema"

const DB_NAME = "freelance-radar"
export const DB_VERSION = 1

interface FreelanceRadarDB extends DBSchema {
  leads: {
    key: string
    value: Lead
    indexes: { status: string; score: number }
  }
  outreach: {
    key: string
    value: Outreach
    indexes: { leadId: string; followUpDate: string }
  }
  projects: {
    key: string
    value: Project
    indexes: { leadId: string }
  }
  activities: {
    key: string
    value: Activity
    indexes: { leadId: string }
  }
}

let dbPromise: Promise<IDBPDatabase<FreelanceRadarDB>> | null = null

export function getDB(): Promise<IDBPDatabase<FreelanceRadarDB>> {
  if (!dbPromise) {
    dbPromise = openDB<FreelanceRadarDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("leads")) {
          const leads = db.createObjectStore("leads", { keyPath: "id" })
          leads.createIndex("status", "status")
          leads.createIndex("score", "score")
        }
        if (!db.objectStoreNames.contains("outreach")) {
          const outreach = db.createObjectStore("outreach", { keyPath: "id" })
          outreach.createIndex("leadId", "leadId")
          outreach.createIndex("followUpDate", "followUpDate")
        }
        if (!db.objectStoreNames.contains("projects")) {
          const projects = db.createObjectStore("projects", { keyPath: "id" })
          projects.createIndex("leadId", "leadId")
        }
        if (!db.objectStoreNames.contains("activities")) {
          const activities = db.createObjectStore("activities", { keyPath: "id" })
          activities.createIndex("leadId", "leadId")
        }
      },
    })
  }
  return dbPromise
}
