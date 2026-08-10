# Implementation Plan — Freelance Radar

Source of truth for scope: `docs/requirements.md`, `docs/design.md`, `docs/architecture.md`. This plan sequences the 10 phases from the handoff onto the concrete folder structure in `architecture.md`. See `validation-notes.md` for confirmation the handoff matches those docs.

Repo starts empty (no `package.json` yet) — Phase 1 includes scaffolding.

## Phase 1 — Application shell

- `npm create vite@latest . -- --template react-ts`
- Install Tailwind, configure `tailwind.config.ts` with `design.md` tokens (colors, radius, spacing, fonts — Inter + JetBrains Mono).
- `shadcn/ui` init; pull in only the primitives listed in `design.md` §Components (Button, Input, Select, Textarea, Table, Card — no extras).
- React Router: routes for the 8 screens under `src/pages/`.
- `App.tsx`: fixed left sidebar (256px, 6 nav items — Dashboard/Leads/Pipeline/Outreach/Projects/Settings, no avatar block), top bar (page title + "Add Lead" CTA), content max-width 1200px.
- Empty page stubs for all 8 screens so routing is provable end to end.
- Verify: `npm run build` clean, nav works, responsive at desktop/laptop/tablet widths.

## Phase 2 — Data layer

- `src/db/schema.ts` — `LeadStatus` union, `Lead`/`Outreach`/`Project`/`Activity` types per `requirements.md` field lists.
- `src/db/db.ts` — IndexedDB open/upgrade, 4 stores (`leads`, `outreach`, `projects`, `activities`), indexes per `architecture.md` (`leads.status`, `leads.score`, `outreach.leadId`, `outreach.followUpDate`, `projects.leadId`, `activities.leadId`). Schema version constant, upgrade handler stub for future migrations.
- `src/db/leads.ts`, `outreach.ts`, `projects.ts`, `activities.ts` — CRUD + minimal query helpers only (no generic repository framework). `leads.setStatus(id, status)` is the single status-change entry point; writes an `activity` row.
- `src/lib/nextAction.ts` — status → next-action label map (single source of truth, per `requirements.md` table).
- Verify: create/read/update/delete a record via a temp test page or browser console, confirm it survives refresh.

## Phase 3 — Lead management

- `Leads.tsx` — table (Company/Contact, Status chip, Score, Value, Next Action, Last Contact, Actions: Open/Edit/Archive), search box, filter pills (All/Hot/Qualified/Contacted/Follow-up/Won/Lost), sort dropdown (score/value/last contact/next action date).
- `LeadForm.tsx` — add/edit, all Lead fields grouped (Business/Contact/Source/Opportunity/Value/Score/Status/Next Action/Notes) per `design.md`. Basic validation (required: businessName; email format if present).
- `LeadDetail.tsx` — header (status chip, name, one-line opportunity, Edit/Email buttons), Next Action card, Opportunity/Problem/Suggested Solution as 3 separate blocks, Deal Metrics sidebar, Contact card. Outreach History and Activity sections stubbed until Phases 6-7.
- Delete = archive (soft) vs. hard delete — confirm destructive hard-delete with a dialog.
- Verify: full CRUD through UI, refresh persists, empty state (0 leads) and long-name/missing-field states look correct.

## Phase 4 — Dashboard

- Metrics row: Pipeline Value, New Leads, Qualified Leads, Follow-ups Due Today (numbers only, no charts).
- Today's Actions — primary section, sourced from `lead.nextActionDate` and `outreach.followUpDate`, soonest first.
- High-Score Leads — short list below Today's Actions.
- Verify: dashboard reflects live DB state, zero-leads empty state, hundreds-of-leads perf sanity check.

## Phase 5 — Pipeline

- `Pipeline.tsx` — Kanban, 10 columns matching enum exactly incl. LOST, column counts. Card: business name, score badge, next-action label.
- Click card → dropdown to change status, routes through `leads.setStatus`. No drag persistence, no Add Column button.
- Verify: status change from Kanban updates Lead Detail and Dashboard next-action consistently (shared `nextAction.ts`).

## Phase 6 — Research workflow

- Research fields on `LeadDetail`/`LeadForm`: problem, opportunity, suggestedSolution, score, scoreReason, estimatedValueMin/Max, estimatedEffort — plain textareas/inputs, no structured parser.
- `src/lib/researchPrompt.ts` — builds the structured prompt text from lead fields (template in handoff §Phase 6). "Copy Research Prompt" button on Lead Detail → clipboard.
- Verify: prompt output includes all lead context fields, copy-to-clipboard works cross-browser.

## Phase 7 — Outreach

- `src/lib/outreachTemplate.ts` — builds subject/body draft from Lead fields.
- `src/lib/mailto.ts` — builds `mailto:` URL from outreach draft.
- `Outreach.tsx` — list of drafts/sent (filterable by status), compose view (edit/copy/Open Gmail via mailto/Mark as Sent). Mark as Sent writes `outreach` record + `activity` entry, prompts for `followUpDate`.
- Outreach History list added to `LeadDetail`.
- Verify: draft generation, mailto opens default mail client, mark-sent persists and shows in history.

## Phase 8 — Follow-ups

- Dashboard: Due Today / Overdue / Upcoming grouping of outreach follow-ups.
- Actions on each: Mark Contacted, Reschedule, Mark Replied, Mark Closed — call into `outreach.ts`/`leads.setStatus` as appropriate, log activity.
- Verify: overdue items surface correctly relative to system date, actions update status app-wide.

## Phase 9 — Projects

- Lead Detail WON-state CTA → "Create Project", pre-filled (name, value, leadId).
- `Projects.tsx` list + detail: value, status, dates, paymentReceived/paymentPending, notes.
- Verify: WON lead → project creation → edit payment fields → persists.

## Phase 10 — Import/export

- `src/db/exportImport.ts` — JSON full backup (`version, exportedAt, leads, outreach, projects, activities`) and CSV (leads only) export/import.
- Import validation: reject/report malformed rows with clear per-row error messages, never partially/silently overwrite existing data (import into a staged set, confirm before merge/replace).
- `Settings.tsx` — export buttons, import file picker + validation errors, current schema version display.
- Verify: export → wipe IndexedDB → import → data restored; malformed JSON/CSV shows errors and does not corrupt existing data.

## Cross-cutting testing (run after every phase, not just at the end)

- Data: create/edit/delete lead, refresh persists, export, import, malformed import rejected cleanly.
- Workflow: New → Qualify → Research → Pitch → Contact → Follow-up → Reply → Proposal → Won → Project, end to end.
- UI: desktop, common laptop res, tablet; empty states; long business names; missing email/website; zero leads; hundreds of leads; overdue follow-ups.

## Explicitly deferred

Anything discovered mid-build that isn't required for the Definition of Done goes to `docs/freelance-radar/backlog.md`, not into the app.
