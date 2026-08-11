export type LeadStatus =
  | "NEW"
  | "QUALIFIED"
  | "RESEARCHED"
  | "PITCH_READY"
  | "CONTACTED"
  | "REPLIED"
  | "CALL"
  | "PROPOSAL"
  | "WON"
  | "LOST"

export const LEAD_STATUSES: LeadStatus[] = [
  "NEW",
  "QUALIFIED",
  "RESEARCHED",
  "PITCH_READY",
  "CONTACTED",
  "REPLIED",
  "CALL",
  "PROPOSAL",
  "WON",
  "LOST",
]

export type EstimatedEffort = "small" | "medium" | "large"

export interface Lead {
  id: string
  businessName: string
  website: string
  contactName: string
  email: string
  phone: string
  location: string
  industry: string
  source: string
  sourceUrl: string
  opportunity: string
  problem: string
  suggestedSolution: string
  estimatedValueMin: number | null
  estimatedValueMax: number | null
  estimatedEffort: EstimatedEffort | ""
  score: number | null
  scoreReason: string
  status: LeadStatus
  nextAction: string
  nextActionDate: string | null
  notes: string
  archived: boolean
  createdAt: string
  updatedAt: string
}

export type OutreachType = "initial" | "follow_up_1" | "follow_up_2"
export type OutreachStatus = "draft" | "sent" | "replied"

export interface Outreach {
  id: string
  leadId: string
  type: OutreachType
  subject: string
  body: string
  status: OutreachStatus
  sentAt: string | null
  followUpDate: string | null
  notes: string
  createdAt: string
  updatedAt: string
}

export type ProjectStatus = "active" | "completed" | "on_hold" | "cancelled"

export interface Project {
  id: string
  leadId: string
  name: string
  value: number | null
  status: ProjectStatus
  startDate: string | null
  dueDate: string | null
  paymentReceived: number
  paymentPending: number
  notes: string
  createdAt: string
  updatedAt: string
}

export type ActivityType =
  | "status_change"
  | "outreach_sent"
  | "outreach_replied"
  | "note_added"
  | "project_created"
  | "other"

export interface Activity {
  id: string
  leadId: string
  type: ActivityType
  description: string
  createdAt: string
}
