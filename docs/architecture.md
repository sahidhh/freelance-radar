# Freelance Radar — Architecture

## Stack

- React + TypeScript + Vite
- Tailwind CSS + shadcn/ui primitives
- IndexedDB for persistence (via `idb` or hand-rolled wrapper — no ORM)
- React Router for the 8 screens
- No backend, no server, no network dependency at runtime

## Folder structure

```
freelance-radar/
  docs/                    requirements.md, architecture.md, design.md
  src/
    main.tsx
    App.tsx                router + shell (sidebar/topbar)
    db/
      schema.ts             entity types + status enum
      db.ts                 IndexedDB open/upgrade, versioned stores
      leads.ts               CRUD + query helpers
      outreach.ts
      projects.ts
      activities.ts
      exportImport.ts        JSON + CSV export/import, schema versioning
    lib/
      researchPrompt.ts       builds "Copy Research Prompt" text from a Lead
      outreachTemplate.ts      builds draft subject/body from a Lead
      nextAction.ts            status -> next action label (single source of truth)
      mailto.ts                builds mailto: URL from outreach draft
    components/
      ui/                     shadcn primitives (button, input, select, badge, table, ...)
      StatusBadge.tsx
      NextActionCard.tsx
      LeadRow.tsx
      KanbanColumn.tsx
    pages/
      Dashboard.tsx
      Leads.tsx
      LeadDetail.tsx
      LeadForm.tsx            add/edit
      Pipeline.tsx
      Outreach.tsx
      Projects.tsx
      Settings.tsx
  index.html
  vite.config.ts
  tailwind.config.ts
```

## Data layer

Single IndexedDB database, 4 object stores: `leads`, `outreach`, `projects`, `activities`. Each keyed by `id` (uuid). Indexes: `leads.status`, `leads.score`, `outreach.leadId`, `outreach.followUpDate`, `projects.leadId`, `activities.leadId`.

All reads/writes go through `src/db/*.ts` — pages never touch IndexedDB directly. `status` is a shared TS union type in `schema.ts`, reused by StatusBadge, Kanban columns, and filter pills, so there is exactly one place stage names are defined (avoids the label-drift problem found in the Stitch design).

## Status enum (single source of truth)

```ts
type LeadStatus =
  | "NEW" | "QUALIFIED" | "RESEARCHED" | "PITCH_READY"
  | "CONTACTED" | "REPLIED" | "CALL" | "PROPOSAL"
  | "WON" | "LOST";
```

`nextAction.ts` maps each status to its default next-action label (table in requirements.md). Kanban columns, leads filters, and status badges all render off this one enum — no per-screen synonyms.

## Key flows

- **Research**: `researchPrompt.ts` serializes Lead fields into a plain-text prompt → clipboard. User pastes result back into Lead Detail's opportunity/problem/suggestedSolution fields manually (simple textareas, no structured parser needed for v1).
- **Outreach**: `outreachTemplate.ts` fills a subject/body template from Lead fields → shown in editable textarea on Outreach screen → Copy / mailto (`mailto.ts` builds the `mailto:` link, browser opens default client incl. Gmail if set) / Mark as Sent writes an `outreach` record + `activity` entry.
- **Follow-up**: Outreach records carry `followUpDate`; Dashboard queries `outreach` where `followUpDate <= today && status != replied` to build the due-today list/count.
- **Pipeline**: status changes go through one function (`leads.setStatus(id, status)`) that also writes an `activity` record — Kanban click-to-move and Lead Detail's status control both call this, no duplicate logic.
- **WON → Project**: Lead Detail's primary CTA on WON creates a `project` record pre-filled from the lead (name, value, client via leadId).
- **Export/import**: `exportImport.ts` produces/consumes the versioned JSON shape from requirements.md, plus a leads-only CSV export/import. Version field allows future migrations without breaking old exports.

## Non-goals (explicitly excluded per requirements.md)

No auth/session state, no server sync, no AI API calls, no real drag-and-drop persistence (Kanban uses click/dropdown status change), no custom user-defined pipeline stages, no tagging system, no notifications service.
