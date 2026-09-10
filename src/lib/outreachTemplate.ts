import type { Lead, Outreach, OutreachType } from "@/db/schema"

interface Draft {
  subject: string
  body: string
}

type OutreachChannel = "email" | "instagram"

/** Small fixed rotating library, used when a lead has no per-lead tips
 * (`suggestedSolution` / `notes`). Deliberately generic — small-business,
 * website-conversion tips that read fine on any lead. */
const TIPS_LIBRARY: string[] = [
  "Add a clear \"Book Now\" or \"Contact\" button above the fold — visitors shouldn't have to scroll to act.",
  "Show real photos instead of stock images; they build trust faster than any copy.",
  "Put a phone number and email in the header so people don't have to hunt for a way to reach you.",
  "Add a couple of guest/customer reviews near the top — social proof shortens the decision.",
  "Make sure the site loads fast and looks right on a phone; most visitors are on mobile.",
  "List your prices or a starting rate — hidden pricing quietly pushes people away.",
]

/** Deterministic per-lead pick so the same lead always gets the same tips. */
function hashString(value: string): number {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

/** Picks 2-3 sales-improvement tips: per-lead ones from `suggestedSolution`/
 * `notes` when either is non-empty, else a deterministic slice of the fixed
 * library. */
function pickTips(lead: Lead): string[] {
  const perLead = [lead.suggestedSolution, lead.notes].map((s) => s.trim()).filter(Boolean)
  if (perLead.length > 0) return perLead.slice(0, 3)
  const start = hashString(lead.id) % TIPS_LIBRARY.length
  const picked: string[] = []
  for (let i = 0; i < 3; i++) {
    picked.push(TIPS_LIBRARY[(start + i) % TIPS_LIBRARY.length])
  }
  return picked
}

const OPT_OUT_LINE = "If this isn't useful, just reply \"no thanks\" and I won't follow up again."

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

/** No-website variant: the OTA-commission pitch. `website` blank is itself
 * the hospitality/OTA qualifier (per the requirements doc). */
function buildOtaCommissionFinding(): string {
  return `Properties booking through Booking.com or Airbnb typically hand over 15-22%+ in commission on every stay. On $80k/year through OTAs, that's roughly $12k-17k/year — money that a direct-booking site keeps in your pocket instead.`
}

/** Has-website variant: the PSI pitch, real score when available, a mild
 * generic framing when `psiScore` hasn't been checked yet (never fabricate
 * a number). */
function buildPsiFinding(lead: Lead): string {
  if (typeof lead.psiScore === "number") {
    const metric = lead.psiFailingMetric?.trim()
    return `I ran your site through Google's PageSpeed test — it scores ${lead.psiScore}/100 on mobile${
      metric ? `, mainly dragged down by ${metric}` : ""
    }. Slow, clunky pages lose visitors before they ever see what you offer.`
  }
  return `Sites that feel slow or hard to use on a phone quietly lose visitors before they ever see what you offer — worth a quick look at how yours performs on mobile.`
}

function buildPrototypeFirst(lead: Lead, channel: OutreachChannel = "email"): Draft {
  const hasWebsite = lead.website.trim().length > 0
  const finding = hasWebsite ? buildPsiFinding(lead) : buildOtaCommissionFinding()
  const tips = pickTips(lead)
  const prototypeLine = lead.prototypeUrl?.trim()
    ? `So I went ahead and built you a homepage mockup — it's live here, free to look at: ${lead.prototypeUrl.trim()}. Keep it, tweak it, or bin it, no strings attached.`
    : `I'd love to put together a quick homepage mockup for you, free, no strings attached.`
  const tipsBlock = tips.map((tip) => `- ${tip}`).join("\n")

  const bodyParts = [
    `Hi ${firstName(lead.contactName)},`,
    `I came across ${lead.businessName}${lead.industry ? ` (${lead.industry})` : ""}. ${finding}`,
    prototypeLine,
    `A few other quick wins while I was looking:\n${tipsBlock}`,
    `Would you be open to a short call this week to discuss?`,
  ]
  if (channel === "email") {
    bodyParts.push(OPT_OUT_LINE)
  }
  bodyParts.push(`Best,`)

  return {
    subject: `A free homepage mockup for ${lead.businessName}`,
    body: bodyParts.join("\n\n"),
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

/**
 * Builds a subject/body draft from lead fields for the given outreach type.
 * `channel` defaults to "email" since callers that don't yet know the send
 * channel (the send-queue phase decides that) should keep getting the
 * opt-out line. For `initial`, leads with a built prototype (`prototypeUrl`
 * set) get the prototype-first pitch; leads without one keep the original
 * generic template unchanged.
 */
export function buildOutreachDraft(lead: Lead, type: OutreachType, channel: OutreachChannel = "email"): Draft {
  switch (type) {
    case "initial":
      return lead.prototypeUrl?.trim() ? buildPrototypeFirst(lead, channel) : buildInitial(lead)
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
