# Instagram Outreach Queue — Requirements (Phase Draft)

Status: **draft, not yet implemented**. Written for a future session to pick up and build phase-by-phase. Extends `docs/requirements.md`; doesn't replace anything in it.

## Goal

Make it fast to turn "small businesses found on Instagram" into pitched leads for prototype-web-design + sales-improvement outreach, without automating anything that touches Instagram or sends email unattended.

## Rejected approach, and why

> **Amended 2026-08-27.** The claim below that Meta's terms prohibit automated
> collection outright is too broad — *Meta v. Bright Data* (N.D. Cal., Jan 2024)
> held those terms bind logged-in scraping only. The bulk-email conclusion stands.
> Lead intake is no longer manual-only either: see
> [`instagram-lead-sourcing-research.md`](./instagram-lead-sourcing-research.md)
> for the sourcing options and the revised risk line (*never authenticate*).

The original ask was: scrape Instagram for small businesses, then periodically auto-send promotional email. Not building it as specified:

- **Instagram scraping** — Meta's Platform Terms and Instagram's Terms of Use prohibit automated data collection from the platform. This is the same reason `docs/requirements.md` already excludes "LinkedIn/Upwork automation, aggressive scraping" for other platforms — Instagram isn't an exception.
- **Periodic automatic bulk email** — unattended, scheduled sending of unsolicited commercial email is legally regulated (CAN-SPAM in the US, similar rules elsewhere) and is what `docs/requirements.md` already rules out ("no automatic/bulk email sending, no email tracking") for the same reason: it turns a personal outreach tool into a spam sender with no human review step.

## What this phase builds instead

Confirmed direction (2026-08-26):

- **Lead intake: manual / CSV only.** You browse Instagram yourself (or however you find businesses) and add or CSV-import them — same mechanism the app already has for any other source. No code talks to Instagram.
- **Send flow: click-through queue, still manual per message.** A queue UI lets you step through several drafted pitches in one sitting — each one still opens in Gmail and is sent by you, one click at a time. No scheduler, no unattended dispatch.

## Proposed schema changes

- `Lead.instagramHandle?: string` — optional field, populated when `source === "Instagram"`. Everything else uses existing `Lead` fields (`source`, `sourceUrl` = profile URL, `industry`, `notes`).
- No changes to `Outreach`, `Project`, or `Activity` schemas. The "prototype pitch" is a new **draft template variant**, not a new `OutreachType` — `type` stays `initial | follow_up_1 | follow_up_2` per the existing (intentionally capped) enum.

## Proposed screens / flows

1. **Instagram quick-add** — a lighter variant of the existing Add Lead form, preset with `source: "Instagram"`, surfacing `instagramHandle` up top. Same `createLead` call underneath; no new data layer.
2. **CSV import, documented workflow** — for someone who compiles a spreadsheet of IG businesses first, then imports in bulk. Reuses the existing leads CSV importer as-is; this phase would just add `instagramHandle` to the documented column set.
3. **Prototype-pitch outreach template** — a new draft variant in `outreachTemplate.ts` alongside the existing `initial` template, built around: no-website/outdated-website framing in `opportunity`/`problem`/`suggestedSolution`, a link to the prototype mockup, 2–3 sales-improvement tips, and a mandatory one-line opt-out ("reply STOP to opt out" or similar) — cheap insurance under CAN-SPAM even for low-volume personal outreach.
4. **Outreach send queue** — new screen listing leads with a pending `initial` draft (filterable by source), with Next/Previous navigation through them. Each step is still the existing single-lead action: generate draft → review → **Open Gmail** → **Mark as Sent**. A configurable "leads per session" number is a personal pacing counter shown in the UI, not a rate limiter or scheduler.

## Explicit non-goals

- No Instagram scraping, browser automation, or unofficial API use.
- No scheduled/cron/background sending of any kind.
- No email open/click tracking.
- No bulk "send all" action — every send is one explicit click on one message.

## Open questions for the next session

- Where does the "prototype web design" asset live — a pasted link (Figma/hosted preview) per lead, or a generic one attached to the template? Suggests a `prototypeUrl` field on `Lead` if per-lead.
- Are the "sales tips" a fixed library (rotate through N tips) or something you write per lead? Affects whether `outreachTemplate.ts` needs a tips-content module.
- Any preferred default for the queue's "leads per session" pacing number?

## Suggested phased build order

1. `instagramHandle` field + Instagram quick-add form variant.
2. Prototype-pitch template variant in `outreachTemplate.ts` (pure function, unit-testable like the existing templates).
3. Outreach send queue screen.
4. (Optional) CSV column doc update + a starter tips library if going the fixed-library route.
