# Backlog

Ideas discovered during implementation that are out of scope for the current Definition of Done. One line each: what it is, why it was deferred. Do not implement anything here without explicit human approval.

- Outreach beyond `follow_up_2`: the `OutreachType` enum is capped at initial/follow_up_1/follow_up_2 per requirements.md; `nextOutreachType` currently caps at follow_up_2 for a 4th+ contact. A real "extendable" enum change needs a requirements.md update first.
- Drag-and-drop reordering on the Pipeline Kanban — explicitly excluded by design.md ("Explicitly not building"), noting here only because it's the obvious next UX step if ever revisited.
- CSV export/import for outreach/projects/activities (currently JSON-only for those; CSV is leads-only per requirements.md).
- Calendar integration for the REPLIED -> "Schedule Call" action — currently a one-click status advance with no date/calendar attached, consistent with "no browser automation / no complex integrations," but a manual "call date" field could be a nice addition.
- Bulk actions on the Leads table (multi-select archive/status-change) — not requested, and design.md's row actions are explicitly single-row (Open/Edit/Archive).
