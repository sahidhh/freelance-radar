import type { LeadStatus } from "@/db/schema"

/**
 * Single source of truth for the default next-action label per status.
 * See requirements.md "Lead lifecycle" table.
 */
export const NEXT_ACTION_BY_STATUS: Record<LeadStatus, string> = {
  NEW: "Research lead",
  QUALIFIED: "Research lead",
  RESEARCHED: "Generate pitch",
  PITCH_READY: "Send outreach",
  CONTACTED: "Follow up",
  REPLIED: "Schedule call",
  CALL: "Send proposal",
  PROPOSAL: "Follow up",
  WON: "Create project",
  LOST: "",
}

export function getNextActionLabel(status: LeadStatus): string {
  return NEXT_ACTION_BY_STATUS[status]
}

export function isTerminalStatus(status: LeadStatus): boolean {
  return status === "LOST"
}
