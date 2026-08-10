# Autonomous Implementation Prompt — Freelance Radar

Paste this as the task prompt for the long-running web agent (repo: `sahidhh/freelance-radar`, branch `master`).

---

You are implementing **Freelance Radar**, a local-first personal freelance-lead CRM, end to end, with no human available to answer questions until you are completely finished. You must not stop, pause, or wait for input at any point before the work is done. If something is ambiguous, resolve it yourself using the rule below and keep going.

## Read first, in order

1. `docs/requirements.md` — entities, status enum, screens, constraints, and a §Implementation defaults section that pre-resolves the ambiguities you'd otherwise have to ask about (score ranges, enums, ID/date format, CSV columns, delete-vs-archive, testing approach, what to do when blocked).
2. `docs/design.md` — visual spec, design tokens, per-screen layout, what NOT to build.
3. `docs/architecture.md` — stack, folder structure, data layer shape, key flows.
4. `docs/freelance-radar/validation-notes.md` — confirms the above three are consistent (they are; don't re-litigate them).
5. `docs/freelance-radar/implementation-plan.md` — the phase-by-phase build plan you will execute. This is your primary task list.

## Non-negotiable constraints

No backend, no Postgres/Supabase, no auth/accounts/OAuth, no Gmail API, no AI API calls, no Redis/Docker/queues/cron services, no scraping infrastructure, no automatic email sending, no analytics platforms. Stack is React + TypeScript + Vite + Tailwind + shadcn/ui + IndexedDB only, per `docs/architecture.md`. If any planned feature seems to require one of the forbidden items, find a simpler local-only implementation instead — do not add the dependency and do not stop to ask.

## How to operate

- Execute `docs/freelance-radar/implementation-plan.md` phase by phase, in order (Phase 1 → Phase 10). Each phase's scope, files, and verification steps are specified there.
- **Commit after every phase** (`feat(phaseN): <summary>`), not in one giant commit at the end. This gives you resumable checkpoints.
- **Verify before advancing**: `npx tsc --noEmit` and `npm run build` must pass after every phase. Run/add the Vitest unit tests specified in `requirements.md` §Testing approach for the pure-logic modules (`nextAction.ts`, `researchPrompt.ts`, `outreachTemplate.ts`, `mailto.ts`, CSV parse/validate). If a browser or screenshot tool is available to you, use it to visually check each new screen against `design.md`; if not, do a careful code-review pass instead — read the JSX back against the screen spec field-by-field. Either way, note in the final report which mode you used.
- **Never stop to ask a question.** If something is genuinely undecided in the docs, make the most conservative choice consistent with `requirements.md`/`design.md`, write one line to `docs/freelance-radar/blockers.md` explaining the call, and continue immediately.
- **Do not expand scope.** If you notice a feature idea that isn't required for the Definition of Done below, write one line to `docs/freelance-radar/backlog.md` and move on — do not build it.
- **No new runtime dependencies** beyond what's listed in `implementation-plan.md` §Autonomous operation rules (React Router, Tailwind, shadcn/ui components, `lucide-react` for icons, optionally `idb`, and `vitest` as a dev dependency). Nothing else — no date libraries, no state managers, no chart libraries, no CSS-in-JS.
- Prefer the smallest implementation that satisfies the spec. This is a personal single-user tool, not a SaaS product — no enterprise abstractions, no speculative extensibility, no config for things that never change.

## Definition of done

You are finished when this workflow works end to end with zero manual IndexedDB/data edits:

```
Add a lead → see it on Dashboard → research it (record problem/opportunity/solution/score/estimated value)
→ generate outreach → copy/open Gmail → mark outreach as sent → see follow-up on Dashboard
→ follow up → mark lead as replied → move through proposal → mark WON → create project
→ track project value/payment → export all data
```

Plus every item in `implementation-plan.md`'s cross-cutting testing section, and CSV/JSON import correctly rejects malformed data without corrupting existing data.

## When Phase 10 is complete

Write `docs/freelance-radar/completion-report.md`: Implemented / Changed files / Validation performed (state which verification mode — browser or code-review — you used) / Known limitations / Remaining backlog (link `backlog.md`) / How to run. Commit and push everything. That report is the signal that you're done — after pushing it, stop.

## Model/effort note

You are running as Sonnet, high reasoning effort. Favor careful, correct, spec-literal implementation over speed — re-read the relevant doc section before each phase rather than working from memory of it.
