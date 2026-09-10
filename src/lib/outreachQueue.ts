import type { Lead, Outreach } from "@/db/schema"

export type OutreachChannel = "email" | "instagram" | null

/**
 * Derives a lead's send channel from its CURRENT contact fields. Channel is
 * never persisted on `Outreach` (the schema stays additive-only, see
 * docs/freelance-radar/instagram-outreach-requirements.md) — email wins when
 * present, else Instagram when a handle is present, else no channel is
 * available and the item can't be sent from here at all.
 */
export function deriveChannel(lead: Pick<Lead, "email" | "instagramHandle">): OutreachChannel {
  if (lead.email.trim()) return "email"
  if (lead.instagramHandle?.trim()) return "instagram"
  return null
}

/** YYYY-MM-DD in the *local* timezone (unlike `toISOString().slice(0, 10)`,
 * which is UTC and can read as the wrong day near local midnight). */
export function localDateString(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

/**
 * Counts how many Instagram sends happened on `today` (local date), for the
 * daily-cap check. This is a deliberate approximation: it ties the count to
 * each lead's CURRENT `email`/`instagramHandle` fields rather than whatever
 * channel was actually used at send time, since channel isn't stored on
 * `Outreach`. In practice a lead's contact fields don't change after it's
 * been sent to, so joining `sentAt` to the live lead is a reasonable stand-in
 * for a true historical channel.
 */
export function countInstagramSentToday(
  outreach: Outreach[],
  leadsById: Map<string, Lead>,
  today: string = localDateString()
): number {
  return outreach.filter((o) => {
    if (!o.sentAt) return false
    if (localDateString(new Date(o.sentAt)) !== today) return false
    const lead = leadsById.get(o.leadId)
    return !!lead && deriveChannel(lead) === "instagram"
  }).length
}
