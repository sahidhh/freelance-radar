# Freelance Radar

Local-first personal CRM for finding and closing freelance clients. No backend, no account, no tracking — everything lives in your browser's IndexedDB and works offline after first load.

**Live:** https://freelance-radar-five.vercel.app

```
Find leads → qualify → research → draft outreach → send manually → follow up → track replies → convert to project
```

## What it does

- **Discover** — searches keyless public job feeds (RemoteOK, Remotive, Arbeitnow) plus JobDataLake, normalises results into one shape, and turns a listing into a lead in one click.
- **Leads** — qualify with a score + reason, enrich a prospect's site with a PageSpeed Insights audit (optional API key) to find a concrete pitch.
- **Pipeline** — Kanban by status; every status maps to exactly one "next action" so the dashboard always tells you what to do next.
- **Outreach** — generates a research prompt to paste into an LLM, drafts subject/body from lead fields, opens `mailto:` — you send it. Daily DM budget pacing for Instagram outreach.
- **Projects** — track value, dates, payments once a lead converts.
- **Export / import** — JSON and CSV with schema versioning, so the data is never trapped.

Deliberately excluded (see [`docs/requirements.md`](docs/requirements.md)): auth, server DB, automated sending, LinkedIn/Upwork automation, scraping, AI agents. External services are used manually, never as runtime dependencies.

## Stack

React 19 · TypeScript · Vite · Tailwind 4 · shadcn/ui primitives · React Router · `idb` (IndexedDB) · Vitest · oxlint

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # vitest — feed normalisers assert against captured real API responses in src/lib/__fixtures__
npm run build
```

## Layout

```
src/
  db/          IndexedDB stores (leads, outreach, projects, activities) + export/import — pages never touch IDB directly
  lib/         pure logic: jobFeeds, jobDataLake, nextAction, outreachTemplate, researchPrompt, mailto, pagespeed, dmBudget
  pages/       Dashboard, Discover, Leads, LeadDetail, LeadForm, Pipeline, Outreach, Projects, Settings
  components/  StatusBadge, NextActionCard, LeadRow, KanbanColumn, ui/
docs/          requirements, architecture, design, and the research/review notes behind each phase
```

`docs/freelance-radar/` holds the phase plans and adversarial reviews that decided what got built and what got cut (e.g. the HN parser and the Instagram lead-sourcing pipeline).
