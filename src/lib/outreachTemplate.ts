import type { Lead, Outreach, OutreachType } from "@/db/schema"

interface Draft {
  subject: string
  body: string
}

function firstName(contactName: string): string {
  const trimmed = contactName.trim()
  if (!trimmed) return "there"
  return trimmed.split(/\s+/)[0]
}

function buildInitial(lead: Lead): Draft {
  const solution = lead.suggestedSolution.trim()
  const problem = lead.problem.trim()
  return {
    subject: `Quick idea for ${lead.businessName}`,
    body: `Hi ${firstName(lead.contactName)},

I came across ${lead.businessName}${lead.industry ? ` (${lead.industry})` : ""} and noticed ${
      problem || "an opportunity that might be worth a quick look"
    }.

${solution || "I'd love to share a quick idea for how I could help."}

Would you be open to a short call this week to discuss?

Best,`,
  }
}

function buildFollowUp(lead: Lead, label: string): Draft {
  return {
    subject: `Following up: ${lead.businessName}`,
    body: `Hi ${firstName(lead.contactName)},

Just following up on my previous note (${label}) — wanted to check if you had a chance to consider it.

Happy to answer any questions or find a time to chat.

Best,`,
  }
}

/** Builds a subject/body draft from lead fields for the given outreach type. */
export function buildOutreachDraft(lead: Lead, type: OutreachType): Draft {
  switch (type) {
    case "initial":
      return buildInitial(lead)
    case "follow_up_1":
      return buildFollowUp(lead, "initial email")
    case "follow_up_2":
      return buildFollowUp(lead, "follow-up email")
  }
}

/**
 * Determines the next outreach type to draft for a lead based on which
 * types have already been sent. Caps at follow_up_2 (the enum's last stage).
 */
export function nextOutreachType(existingOutreach: Outreach[]): OutreachType {
  const sentTypes = new Set(existingOutreach.filter((o) => o.status !== "draft").map((o) => o.type))
  if (!sentTypes.has("initial")) return "initial"
  if (!sentTypes.has("follow_up_1")) return "follow_up_1"
  return "follow_up_2"
}
