# Freelance Radar — Design

Adapted from Stitch "Zenith Focus" design system (validated). Flat, minimal, monochrome + single indigo accent. No shadows, no gradients, no decorative charts.

## Design tokens

```yaml
colors:
  background: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3ff'
  surface-container-highest: '#dce2f7'
  on-surface: '#141b2b'
  on-surface-variant: '#464555'
  outline-variant: '#c7c4d8'
  primary: '#3525cd'
  on-primary: '#ffffff'
  primary-container: '#4f46e5'
  error: '#ba1a1a'

typography:
  fontFamily: Inter (UI), JetBrains Mono (ids/metadata/dates)
  display: 48px/1.1 600, headline-lg: 30px/40 600, headline-md: 24px/32 500
  body-lg: 18px/32, body-md: 16px/28, body-sm: 14px/24
  label-md: 12px/16 600 uppercase tracking

radius: sm 2px / DEFAULT 4px / md 6px / lg 8px / full pill (buttons stay rectangular, not pill)
spacing: 8px grid, container-padding 40px, gutter 24px, section-gap 64px
elevation: none — borders only (1px #F3F4F6-equivalent), no box-shadow, no blur
```

## Global layout

- Fixed left sidebar (256px, `w-64`), 6 nav items: Dashboard, Leads, Pipeline, Outreach, Projects, Settings. No user avatar/account block (no auth).
- Top bar: page title + single primary "Add Lead" CTA.
- Content max-width 1200px, centered, 40px page margins.

## Status vocabulary (use everywhere, no synonyms)

`NEW · QUALIFIED · RESEARCHED · PITCH_READY · CONTACTED · REPLIED · CALL · PROPOSAL · WON · LOST`

Rendered as a small uppercase label-md chip, neutral background, colored dot: gray dot for early stages, primary/indigo dot for active (CONTACTED→PROPOSAL), green for WON, red for LOST.

## Screen specs

### Dashboard
- Metrics row (numbers only, no charts): Pipeline Value, New Leads, Qualified Leads, Follow-ups Due Today.
- "Today's Actions" — primary section, same visual treatment as Stitch's "Focus Flow": each row = icon + type chip + timestamp (mono font) + title + short description + 1-2 buttons. Sourced from lead.nextActionDate and outreach.followUpDate, sorted soonest first.
- "High-Score Leads" — short list (score + businessName + link), below Today's Actions.

### Leads
- Filter pills: All, Hot, Qualified, Contacted, Follow-up, Won, Lost.
- Search input (top right, as in Stitch).
- Sort control (dropdown: score, value, last contact, next action date).
- Table columns: Company/Contact, Status (chip, spec vocabulary), Score, Value (mono), Next Action, Last Contact, Actions (Open · Edit · Archive — three explicit icons, not one ambiguous verb).

### Lead Detail
- Header: status chip (spec vocabulary) + business name (display size) + one-line opportunity summary + Edit Details / Email Client buttons.
- Next Action card: only colored-background element on the page (primary-container bg), matches Stitch's high-prominence pattern exactly — title, due date, Mark Complete.
- "Copy Research Prompt" button next to section header.
- Opportunity / Problem / Suggested Solution — 3 separate labeled blocks (not one paragraph).
- Deal Metrics sidebar: Estimated Value, Estimated Effort, Score + Score Reason (no "Probability to Close").
- Contact card: name, email, phone, location, website — unchanged from Stitch.
- No tags/chips block.
- Outreach History — new section, chronological list of outreach records (type, sentAt, status).
- Activity — new section, auto-logged system events, separate from Research Notes (free text).

### Pipeline
- Kanban, 10 columns matching status enum exactly (incl. LOST as a real column).
- Card: business name, score (mono badge), next-action label. No "Add Column" button.
- Status change: click card → dropdown/menu to set status (no drag persistence). Column counts stay.
- Remove notification bell.

### Outreach (new)
- List of outreach drafts/sent items, filterable by status (draft/sent/replied).
- Compose view: subject + body (editable, pre-filled from template), buttons: Edit (inline), Copy, Open Gmail (mailto), Mark as Sent.
- Follow-up scheduling: set followUpDate, shows on Dashboard when due.

### Projects (new)
- Simple list/table: name, client (lead), value, status, start/due date, payment received/pending.
- Created from Lead Detail's WON-state CTA, pre-filled.
- Detail view: same fields, editable, notes.

### Add/Edit Lead (new)
- Single form, all Lead fields grouped: Business (name/website/industry/location), Contact (name/email/phone), Source (source/sourceUrl), Opportunity (opportunity/problem/suggestedSolution — only on edit, optional on add), Value (min/max/effort), Score (+reason), Status, Next Action (+date), Notes.

### Settings (new)
- Export: JSON (all data), CSV (leads).
- Import: JSON (all data, versioned), CSV (leads).
- Shows current schema version.
- Nothing else (no account/profile settings — no auth).

## Components to build (shadcn-based)

Button (primary/secondary/ghost per Stitch spec), Input, Select, Textarea, Table, StatusBadge, Card (flat, 1px border, 8px radius), NextActionCard, KanbanColumn, KanbanCard, FilterPillGroup.

## Explicitly not building

Drag-and-drop reordering, tag/chip management, notification system, user profile/avatar, custom pipeline stage editor, charts/graphs.
