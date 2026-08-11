import { getDB } from "./db"
import type { Project } from "./schema"
import { logActivity } from "./activities"

export type NewProject = Omit<Project, "id" | "createdAt" | "updatedAt">

export async function createProject(input: NewProject): Promise<Project> {
  const db = await getDB()
  const now = new Date().toISOString()
  const project: Project = {
    ...input,
    id: crypto.randomUUID(),
    createdAt: now,
    updatedAt: now,
  }
  await db.add("projects", project)
  await logActivity(project.leadId, "project_created", `Project "${project.name}" created`)
  return project
}

export async function getProject(id: string): Promise<Project | undefined> {
  const db = await getDB()
  return db.get("projects", id)
}

export async function getAllProjects(): Promise<Project[]> {
  const db = await getDB()
  return db.getAll("projects")
}

export async function getProjectsForLead(leadId: string): Promise<Project[]> {
  const db = await getDB()
  return db.getAllFromIndex("projects", "leadId", leadId)
}

export async function updateProject(
  id: string,
  patch: Partial<Omit<Project, "id" | "createdAt">>
): Promise<Project> {
  const db = await getDB()
  const existing = await db.get("projects", id)
  if (!existing) throw new Error(`Project ${id} not found`)
  const updated: Project = {
    ...existing,
    ...patch,
    updatedAt: new Date().toISOString(),
  }
  await db.put("projects", updated)
  return updated
}
