# Execution Plan — Agents & Models per Phase

This project is small (single dev, ~10 phases, one repo, no backend). Default to doing each phase inline in the main thread — spawning subagents for a codebase this size mostly adds coordination overhead, not speed. Use the exceptions below where they genuinely help.

## General rules

- **Model**: Sonnet 5 for all implementation work — it's the right size for CRUD screens, forms, IndexedDB wrappers, Tailwind/shadcn UI. Reserve Opus 5 for the one genuinely tricky design decision (see Phase 2) if Sonnet's first pass needs a second opinion.
- **Agents**: don't spawn per phase by default. This is sequential, dependent work (Phase 3 needs Phase 2's data layer, etc.) — parallelizing across agents would just create merge conflicts on shared files (`schema.ts`, `nextAction.ts`).
- **Review**: run the `code-review` skill (medium effort) after each phase, not just at the end — catches drift from the docs early, cheaper than a big review at the end.
- **Visual check**: use the `run` skill to launch the dev server + `claude-in-chrome` to actually look at each screen, per the handoff's "visually inspect" step. Required for Phases 1, 3, 4, 5, 7, 9 (anything with new UI).

## Phase-by-phase

| Phase | Who does it | Model | Notes |
|---|---|---|---|
| 1. App shell | Main thread | Sonnet 5 | Scaffolding + config, mechanical. Visual check after (`run` skill + browser). |
| 2. Data layer | Main thread | Sonnet 5, escalate to Opus 5 only if the IndexedDB upgrade/versioning design feels ambiguous | Small surface area but everything downstream depends on `schema.ts` getting the types right once — worth a slower first pass. |
| 3. Lead management | Main thread | Sonnet 5 | Largest phase (list+form+detail). If it starts feeling too large for one pass, split into list/detail sub-steps sequentially, still main thread — not parallel agents (they'd both touch `LeadDetail.tsx`/`db/leads.ts`). |
| 4. Dashboard | Main thread | Sonnet 5 | Read-only aggregation over Phase 2/3 data, low risk. |
| 5. Pipeline | Main thread | Sonnet 5 | Reuses `nextAction.ts` and `leads.setStatus` — no new data logic, just a new view. |
| 6. Research workflow | Main thread | Sonnet 5 | Pure string templating (`researchPrompt.ts`) + form fields. |
| 7. Outreach | Main thread | Sonnet 5 | `mailto.ts` + templating, same shape as Phase 6. |
| 8. Follow-ups | Main thread | Sonnet 5 | Dashboard queries, no new entities. |
| 9. Projects | Main thread | Sonnet 5 | Small CRUD module, mirrors Phase 3 patterns. |
| 10. Import/export | Main thread | Sonnet 5 | Validation logic is the only fiddly part — write the malformed-input test cases first. |

## Where a subagent earns its keep

- **`code-review` skill** (not a general agent, but worth calling out): after Phases 2, 3, 7, 10 specifically — these are the ones with the most "silently corrupt data" risk (status transitions, mailto encoding, import validation).
- **`Explore` agent**: only if a later phase needs to locate something across a codebase that's grown large enough that grep-by-hand is slow (unlikely before Phase 8+ given the flat structure in `architecture.md`).
- **`cavecrew-builder`**: fine for true 1-2 file mechanical fixes found during review (e.g., a typo'd status label) — not for phase implementation itself.
- **Do not** use `general-purpose` or parallel agents to "speed up" multiple phases at once — the phases are sequentially dependent (shared schema, shared `nextAction.ts`), so parallel writers would conflict.

## Cadence

Per the handoff's development loop: inspect → plan (done) → implement one phase → build → test → visually inspect → fix → continue. After each phase: `npm run build`, run the cross-cutting checks from `implementation-plan.md`, then move on. Don't batch multiple phases into one uncommitted pass.
