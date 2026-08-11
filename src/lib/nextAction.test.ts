import { describe, expect, it } from "vitest"
import { getNextActionLabel, isTerminalStatus } from "./nextAction"
import { LEAD_STATUSES } from "@/db/schema"

const EXPECTED: Record<string, string> = {
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

describe("getNextActionLabel", () => {
  it("maps every status to the exact label from requirements.md", () => {
    for (const status of LEAD_STATUSES) {
      expect(getNextActionLabel(status)).toBe(EXPECTED[status])
    }
  })

  it("covers every status in the fixed enum, nothing missing or extra", () => {
    expect(LEAD_STATUSES.sort()).toEqual(Object.keys(EXPECTED).sort())
  })
})

describe("isTerminalStatus", () => {
  it("is true only for LOST", () => {
    for (const status of LEAD_STATUSES) {
      expect(isTerminalStatus(status)).toBe(status === "LOST")
    }
  })
})
