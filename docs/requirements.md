# Freelance Radar — Requirements

Personal, single-user, local-first tool. Goal: minimize time managing the tool, maximize time finding/contacting clients.

## Constraints

- No auth, no multi-user, no roles, no billing, no SaaS.
- No backend, no server DB (Postgres/Supabase), no Gmail OAuth.
- No automatic/bulk email sending, no email tracking.
- No LinkedIn/Upwork automation, no aggressive scraping, no browser automation.
- No complex AI agent system, no unnecessary analytics, no mobile app.
- Local-first: works offline after load. External services (Claude/ChatGPT, Gmail, freelance sites) used manually only, never app dependencies.

## Workflow

```
Find leads → qualify → research → generate outreach → manually send → follow up → track replies → convert to project
```

## Entities

### Lead
```
id, businessName, website, contactName, email, phone, location, industry, source, sourceUrl,
opportunity, problem, suggestedSolution,
estimatedValueMin, estimatedValueMax, estimatedEffort,
score, scoreReason,
status, nextAction, nextActionDate,
notes, createdAt, updatedAt
```

### Outreach
```
id, leadId, type, subject, body, status, sentAt, followUpDate, notes
```
`type`: initial | follow_up_1 | follow_up_2 (extendable).

### Project
```
id, leadId, name, value, status, startDate, dueDate, paymentReceived, paymentPending, notes, createdAt, updatedAt
```

### Activity
```
id, leadId, type, description, createdAt
```
Auto-logged system events (status change, outreach sent, note added). Distinct from free-text notes.

## Lead lifecycle (status enum — fixed, no custom stages)

```
NEW → QUALIFIED → RESEARCHED → PITCH_READY → CONTACTED → REPLIED → CALL → PROPOSAL → WON | LOST
```

Every lead always has a clear next action:

| Status | Next action |
|---|---|
| NEW | Research lead |
| QUALIFIED | Research lead |
| RESEARCHED | Generate pitch |
| PITCH_READY | Send outreach |
| CONTACTED | Follow up |
| REPLIED | Schedule call |
| CALL | Send proposal |
| PROPOSAL | Follow up |
| WON | Create project |
| LOST | (terminal) |

## Screens (8)

1. Dashboard
2. Leads
3. Lead Detail
4. Pipeline
5. Outreach
6. Projects
7. Add/Edit Lead
8. Settings

## Screen requirements

**Dashboard** — answers "what should I work on right now". Sections: New leads count, Qualified leads count, Follow-ups due today (count + list), Pipeline value, Today's Actions (primary section), High-score/important leads. No decorative charts.

**Leads** — search, filter (All/Hot/Qualified/Contacted/Follow-up/Won/Lost), sort, add/edit/open/change-status/archive-or-delete.

**Lead Detail** — business, website, contact, source, opportunity, problem, suggested solution (3 distinct fields, not one blob), estimated value, estimated effort, score + reason, research notes, outreach history, activity feed, next action. Primary CTA changes with status. "Copy Research Prompt" action.

**Pipeline** — Kanban or list, all 10 statuses as columns including LOST. No custom/user-added columns. Status change via click/dropdown, not required to be drag-and-drop.

**Outreach** — generate draft from lead data, user reviews. Actions: Edit, Copy, Open Gmail (mailto, no OAuth), Mark as Sent. No auto-send, no bulk send. Tracks initial/follow-up-1/follow-up-2.

**Projects** — created only after lead reaches WON. Fields per Project entity above. No full project management (no tasks/milestones).

**Add/Edit Lead** — form covering all Lead fields.

**Settings** — JSON export/import, CSV export/import (leads), versioned export format:
```json
{ "version": 1, "exportedAt": "...", "leads": [], "outreach": [], "projects": [], "activities": [] }
```

## Research workflow

No AI API integration. "Copy Research Prompt" builds a structured prompt from lead fields, user pastes into Claude/ChatGPT manually, pastes result back into lead's research fields.

## Persistence

IndexedDB only. Data survives refresh. Works with no server. JSON export/import + CSV export/import for leads, versioned schema.

## Validation decisions (from Stitch design review)

**KEEP**: minimal flat visual style, Dashboard "Today's Actions" as primary section, Lead Detail single prominent Next Action card, Leads search+table, Pipeline as click-to-move Kanban (no drag persistence), mailto-based Gmail button.

**CHANGE**: unify all status labels to the fixed enum above everywhere (chips, Kanban columns, filters — never invent synonyms like "Negotiating"/"Cold"); split Opportunity prose into 3 labeled fields (opportunity/problem/suggestedSolution); split Notes into Research Notes (free text) + Activity (auto-logged); Leads filters must include Qualified/Contacted/Won/Lost, not just Hot/Follow Up; Leads list needs sort + per-row edit/archive actions; Dashboard needs explicit New/Qualified counts + follow-ups-due-today count.

**REMOVE**: "Probability to Close" field (not in data model, redundant with score), tags/chips system on Lead Detail, notification bell icon, Kanban "Add Column" button (contradicts fixed lifecycle), user avatar/account block (no auth/multi-user).

**ADD**: Outreach screen, Projects screen, Add/Edit Lead screen, Settings screen, "Copy Research Prompt" button, score/scoreReason display (drives "Hot" filter), Outreach history list on Lead Detail, LOST column/status everywhere, follow-ups-due-today widget on Dashboard.

## Implementation defaults (resolved ambiguities)

These are fixed so an autonomous implementation pass never has to stop and ask. If a future human wants different behavior, change here first, then code.

- **`score`**: integer 0-100, entered manually (no auto-calc). "Hot" filter and Dashboard "High-Score Leads" = `score >= 70`, sorted desc, top 5 shown on Dashboard.
- **`estimatedEffort`**: enum `'small' | 'medium' | 'large'` (no hour/day estimates — keep it a quick judgment call).
- **`outreach.status`**: enum `'draft' | 'sent' | 'replied'`.
- **`outreach.type`**: enum `'initial' | 'follow_up_1' | 'follow_up_2'` (already specified above; restated for completeness).
- **`project.status`**: enum `'active' | 'completed' | 'on_hold' | 'cancelled'`.
- **`activity.type`**: enum `'status_change' | 'outreach_sent' | 'outreach_replied' | 'note_added' | 'project_created' | 'other'`.
- **IDs**: `crypto.randomUUID()` (native, no dependency).
- **Dates/times**: stored as ISO 8601 strings everywhere (`createdAt`, `updatedAt`, `sentAt`, `followUpDate`, `startDate`, `dueDate`). Displayed via `Intl.DateTimeFormat`, no date library dependency.
- **Delete vs. archive**: Leads support both. "Archive" (soft — sets `status` unchanged but hides from default Leads list view via an `archived: boolean` field, recoverable) is the default row action. Hard "Delete" (permanent, irreversible) is available from Lead Detail only, behind a confirmation dialog. Outreach/Project/Activity records are never independently deleted (they follow their parent lead's archive state, or are simply immutable history).
- **`lastContact`** (Leads table column, derived not stored): most recent `outreach.sentAt` among that lead's outreach records with `status != 'draft'`; blank if none.
- **CSV columns (leads export/import, exact order)**: `id,businessName,website,contactName,email,phone,location,industry,source,sourceUrl,opportunity,problem,suggestedSolution,estimatedValueMin,estimatedValueMax,estimatedEffort,score,scoreReason,status,nextAction,nextActionDate,notes,createdAt,updatedAt`. Header row required. On import: `id` optional (generate if blank/missing), `status` must be a valid enum value or the row is rejected with a row-numbered error, numeric fields must parse as numbers or the row is rejected, unknown extra columns are ignored, required minimum per row is `businessName`.
- **Testing approach**: no browser/E2E testing in the autonomous pass (no guaranteed visual/browser tool). Use Vitest for pure-logic unit tests only — `nextAction.ts`, `researchPrompt.ts`, `outreachTemplate.ts`, `mailto.ts`, and the CSV parse/validate functions in `exportImport.ts`. These have no IndexedDB dependency, so no test-only polyfill packages are needed. Correctness of IndexedDB CRUD and UI is instead verified by `tsc --noEmit` + `npm run build` passing and by code matching the documented shape — do not add Playwright/Cypress/jsdom-DB polyfills to reach for browser-level testing.
- **When blocked or genuinely ambiguous during autonomous implementation**: never stop and wait. Make the most conservative choice consistent with this file and `design.md`, log it in `docs/freelance-radar/blockers.md` (one line: what was ambiguous, what was chosen, why), and continue.

## Amendment 2026-08-26: Discover (JobDataLake integration)

Explicit, human-approved exception to the "External services used manually only, never app dependencies" constraint above, scoped narrowly:

- New **Discover** screen searches the JobDataLake job-data API (contract/freelance-shaped listings, defaulting to `employment_type=contract`) directly from the browser, using a user-supplied API key stored in `localStorage` only.
- "Add as Lead" on a result creates a `NEW` lead prefilled from the listing (`source: "JobDataLake"`, `sourceUrl` = apply link). This is the only network dependency in the app; everything else remains fully offline/IndexedDB-only.
- No server-side proxy, no bundled/shared API key, no automatic background fetching — the user must supply their own key and trigger each search manually, keeping it consistent with the spirit of "manual use of external services" even though the call itself is now automated plumbing rather than copy/paste.
- Out of scope for this change: LinkedIn/Upwork scraping (still explicitly excluded — likely ToS violations), automatic lead ingestion, or any lead source other than the one API the user opted into.
