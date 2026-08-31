# Instagram Outreach — Phase & Task Ledger

The running state of the build specified in
[`instagram-outreach-requirements.md`](./instagram-outreach-requirements.md).

**That document says what to build and why. This one says where it stands.**
When work lands, update this file — not the spec. When the spec is wrong,
correct the spec and note it in Decisions below.

Related: [`audit-2026-08-28.md`](./audit-2026-08-28.md) — the repo-wide audit of
false claims and assumption-based code. **Phase A below is its fix plan.**

Last updated: **2026-08-31** · Spec verified: **2026-08-28** · Code written: **phase B**

> **Scope note.** This ledger started as the Instagram plan's tracker. It is now
> the tracker for lead generation in this repo generally, because the audit
> found the already-shipped lead source broken and the weekend goal needs a
> route that is not Instagram. Instagram phases 0–6 are unchanged below.

## Status key

`todo` · `wip` · `done` · `blocked` (needs an answer or an input) · `paused` (deliberately set aside, resumable) · `cut` (decided against, kept for the record)

---

## Phase summary

| # | Phase | Status | Gate to enter | Cost surface |
|---|---|---|---|---|
| — | Repo hygiene | `todo` | none | none |
| **A** | **Discover / JobDataLake repair** (audit fix plan) | `paused` | — | free |
| — | Audit doc fixes (A6–A8, A10, A11) | `done` | — | none |
| **B** | **Free keyless job feeds** | `done` | — | free, no signup |
| **C** | **Gig sources** (Freelancer.com, Jobicy) | `todo` | none | free, no signup |
| 0 | Schema + DM budget setting | `todo` | Phase −1 merged | none |
| 1 | Paste-and-parse bulk intake | `todo` | Phase 0 | none |
| 2 | PageSpeed enrichment + auto-scoring | `blocked` | Phase 0; **needs a Google API key** | free, 25k/day |
| 3 | Prototype-first templates + capped send queue | `blocked` | Phase 1 + 2; **needs Q2/Q3 answered** | none |
| 4 | Google Places discovery | `todo` | **20-lead field test of phases 1–3 first** | 1k calls/mo free — but **requires a billing card on file** |
| 5 | Reply-rate tracking per pitch variant | `todo` | Phase 3 has shipped real sends | none |
| 6 | SERP APIs, Meta Business Discovery, Apify | `todo` | never, realistically | varies |
| — | OpenStreetMap sourcing | `cut` | — | — |

Phases 1–3 are the minimum viable feature. Everything from 4 on optimises the
input the spec measured as **abundant** — worth ~2 hours a month, no more.

**Phase B comes first.** It produces leads within hours, needs no key, no
signup and no card, and does not wait on anything. The Instagram plan is a 3–6
week machine by comparison. Phase 4 is the only item anywhere here that needs a
card, so it sits last regardless of its position in the original spec.

**Phase A is paused (2026-08-28, user decision).** Its blocker was a
JobDataLake key, and the feature is not worth the signup while phase B covers
the same need for free. **Note what pausing does not do: Discover remains
broken and still 404s.** That is tolerable on a single-user tool, but "paused"
must not later be misread as "fixed". A1 alone is a one-line fix if the 404
becomes annoying — it will not make the feature *useful* without a key, which is
why the whole phase is parked rather than half-done.

---

## Phase −1 — Repo hygiene

Not in the spec; these are open loops that make every later phase more
expensive the longer they sit.

| # | Task | Status | Notes |
|---|---|---|---|
| H1 | Merge `claude/mobile-ui-overhaul-g7iffk` | `todo` | 1 commit, 9 files, no PR. Touches `Leads`/`Outreach`/`Settings`/`LeadForm`/`App` — the exact files phases 0–3 edit. **Do this before phase 0**; the conflict cost only grows. |
| H2 | Merge this research/spec branch | `todo` | `claude/instagram-outreach-research-vxvtlj`, docs only, zero merge risk |
| H3 | Fast-forward local `master` | `todo` | Local `master` sits at `1f9c763`, far behind `origin/master` |
| H4 | `npm install`, confirm `build` + `test` green | `done` | Done 2026-08-28. `npx tsc -b` exits 0; **37 tests across 6 files pass** — that is the real baseline to protect (the completion report's "34 across 5" is stale, see audit A9) |

---

## Phase A — Discover repair

The fix plan from [`audit-2026-08-28.md`](./audit-2026-08-28.md). The repo
already ships a lead source; it has never worked, because it calls an endpoint
that does not exist. Repairing it is a smaller job than any new feature here and
is the fastest route to real leads in this repo.

| # | Task | Status | Notes |
|---|---|---|---|
| A1 | Endpoint `/v1/jobs/search` → `/v1/jobs` | `todo` | **1 line.** Current path 404s with `{"error":"job not found"}` — the router reads `search` as a job handle |
| A2 | `query` → `q`; drop `posted_within`; add `posted_after` (unix ts) | `todo` | `posted_within` is not a real parameter and is silently ignored today |
| A3 | `locations.join(", ")`; `posted_at` epoch ms → ISO | `todo` | Real fields are `locations` (array) and an epoch-millisecond integer |
| A4 | **Get the free key, capture one authenticated response, commit as a fixture** | `blocked` | **Needs the user.** Free, 1,000 credits, signup only — no card. **This is the gate**: keyless responses omit `company_name` and `url`, so leads come out with no company and no link |
| A5 | Rewrite `jobDataLake.test.ts` to run `normalizeJob()` over that fixture | `todo` | Today's 3 tests never call `normalizeJob` — they check a hand-written fixture, which is why A1–A3 shipped |
| A6 | Fix the Discover empty-state copy | `done` | 2026-08-31. Now an inline notice (not a full-page block) stating the key buys *usable fields*, not access |
| A7 | Scope the completion report; correct the stale test count | `done` | 2026-08-31. Header note scopes it to phases 1–10 as of 2026-08-10 and points at the audit; current count stated as 54/7 |
| A8 | Mark the `blockers.md` CORS entry resolved | `done` | 2026-08-31. Both Discover entries in `blockers.md` now carry their measured outcome |
| A9 | Note the Places billing-card requirement wherever phase 4 is called free | `todo` | Also fixed in the summary table above |
| A10 | Drop or annotate the Discover-caching backlog item | `done` | 2026-08-31. Dropped in `backlog.md`; the pagination and CORS-proxy items were corrected in the same pass |
| A11 | Note in `requirements.md` that a keyless tier exists | `done` | 2026-08-31. Amendment 2026-08-31 states it: the keyless tier answers but omits `company_name` and `url` |

**Done when:** a Discover search returns rows whose leads carry a real company
name, a working apply link, a real location and a real date — and reverting
A1–A3 turns the test suite red.

---

## Phase B — Free keyless job feeds

Quality over quantity, no signup, no key, no card. All four verified
browser-callable on 2026-08-28 — the CORS header is quoted because that is the
only thing that decides whether this SPA can call them without a proxy.

| Source | CORS header | Volume | Quality |
|---|---|---|---|
| RemoteOK | `*` | 101/request, whole board | Medium |
| Remotive | `*` | ~19/request | Medium |
| Arbeitnow | `*` | 175/page | Medium |
| ~~HN "Freelancer? Seeking freelancer?"~~ | echoes `Origin` | **0.3 hiring posts/mo (measured)** | `cut` — see B4 |

| # | Task | Status | Notes |
|---|---|---|---|
| B1 | `src/lib/jobFeeds.ts` — one normaliser per source into the existing job shape | `done` | 2026-08-31. Three normalisers + `fetchFeed` + client-side `matchesQuery` (only Remotive supports a server-side search, so one filter path covers all three) |
| B2 | Source dropdown on `Discover.tsx` | `done` | 2026-08-31. Defaults to RemoteOK; JobDataLake is now one option among four and its key gate is an inline notice, not a full-page block |
| B3 | Reuse `jobToLeadDraft` for all sources | `done` | 2026-08-31. `jobToLeadDraft(job, source = "JobDataLake")` — one optional arg, no second draft function |
| B4 | ~~HN thread parser~~ | `cut` | **Measured 2026-08-31: 2 hiring posts across all 7 months of 2026** (177 comments, 165 of them `SEEKING WORK`). See the HN detail below |
| B5 | One test per normaliser over a committed real response | `done` | 2026-08-31. `src/lib/__fixtures__/{remoteok,remotive,arbeitnow}.json` are unedited slices of live responses; suite is **54 tests across 7 files**, up from 37/6 |

**Why this exists:** it removes the single-vendor dependency the audit exposed,
costs nothing, needs no signup, and keeps working if JobDataLake's free tier
changes. **With phase A paused, this is the lead source — not a backup.**
**Shipped 2026-08-31** (B1–B3, B5). Discover now returns real listings with no
key, from three boards.

**End-to-end verified 2026-08-31, in a real browser against the live feeds** —
not a test-suite claim. This closes the gap audit item A6 named, where the only
verification record predated the feature it was read as covering.

| Check | Result |
|---|---|
| RemoteOK search | 100 listings, legal notice row excluded |
| Remotive search, keyword `react` | filtered set, all react-tagged |
| Arbeitnow search | renders, `on_site` and `job_types[0]` correct |
| *Add as Lead* | lead written with `source: "RemoteOK"`, real apply URL, `estimatedValueMin: null` — read back out of IndexedDB |
| Duplicate guard | that listing shows *Already added* on the next search |
| RemoteOK attribution | "Jobs from Remote OK" renders below their results |
| JobDataLake with no key | inline notice, *Search* disabled, extra filters shown |
| `npm run build` | clean, 340 kB / 103 kB gzipped |

**Two defects the unit tests could not have caught, both found in that pass and
fixed:**

1. **Results survived a source change**, so *Add as Lead* on a leftover RemoteOK
   row filed it under the newly selected source. Changing source now clears the
   result list. A lead mis-attributed at creation is not recoverable from the
   data — nothing else records which board it came from.
2. **RemoteOK double-encodes its text**: `Macaé` arrives as `MacaÃ©`, and would
   have been pasted into an outreach message that way. `fixMojibake()` re-decodes
   it, guarded so correctly-encoded rows (`Macau`, `München`) are untouched. The
   defect is in RemoteOK's own payload, not in our decoding — confirmed against
   the raw bytes.

**HN detail — the estimate was wrong by ~30×.** Every 2026 thread was counted
via the Algolia comment API on 2026-08-31:

| Thread | Comments | `SEEKING FREELANCER` | `SEEKING WORK` |
|---|---|---|---|
| Jan `46467231` | 29 | 0 | 25 |
| Feb `46857644` | 33 | 1 | 24 |
| Mar `47219697` | 25 | 0 | 23 |
| Apr `47602028` | 18 | 0 | 15 |
| May `47976154` | 19 | 0 | 18 |
| Jun `48358236` | 33 | 1 | 28 |
| Jul `48749020` | 20 | 0 | 19 |
| Aug `49157021` | 15 | **0** | 15 |

**2 hiring posts in 7 months.** The remaining 23 comments were read
individually — none was a disguised hiring post; they are meta-discussion,
replies, and one `SEEKING FREELANCE WORK`. The thread has inverted: it is
freelancers advertising to each other, so its readers are competitors, not
clients. B4 is `cut`, not deferred — a parser costing a day of work to surface
0.3 leads a month is not a trade worth making at any price.

---

## Getting a gig this weekend — no code

Recorded because it is the actual goal, and because **no phase in this ledger
can deliver it.** The Instagram plan is a 3–6 week machine: days of coding, then
10 DMs/day at ~3% reply, then call → proposal → invoice. Phases A and B produce
leads in hours, but a lead is not a signed gig.

The weekend route is manual and starts now:

| # | Action | Status |
|---|---|---|
| W1 | ~~Apply in the live HN thread (id `49157021`)~~ | `cut` — measured 2026-08-31: 15 comments, all `SEEKING WORK`. Posting there advertises to competitors |
| W2 | Upwork / Contra / r/forhire — direct applications | `todo` |
| W3 | Sign up for the free JobDataLake key | `todo` | Doubles as A4's unblock — 10 minutes, no card |

Building lead-generation software is not the path to a gig this weekend. W1–W3
are. Phase A is worth doing *after*, because it makes the following weeks
cheaper — not this one.

---

## Phase C — Gig sources

**Why this exists:** phase B shipped three job boards, and the user's first real
use of them found what the boards actually contain. Measured 2026-08-31 on live
responses:

| Source | Rows/request | Freelance, contract or part-time | Verdict |
|---|---|---|---|
| **RemoteOK** (the default) | 100 | **0** | Full-time board. No `contract` tag exists on any row |
| Remotive | 19 | 7 | The **entire** free API is 19 rows — `total-job-count: 19`. `?search=` is ignored |
| Arbeitnow | 175 | 6 | German full-time; 46 "Full Time" vs 3 "Contract", 3 "Part time" |

**13 gig-shaped rows out of 294, and the default source contributes none of
them.** Phase B solved "no lead source at all". It did not solve "leads I can
actually bid on", because every source it added is an employment board. Gig
marketplaces are a different kind of site and none of them were tested.

### Candidates, all probed live on 2026-08-31

CORS is quoted first because it is still the only thing that decides whether
this SPA can call a source without a proxy — and the no-proxy rule has not
changed.

| Candidate | CORS | Result |
|---|---|---|
| **Freelancer.com** `/api/projects/0.1/projects/active/` | `*` | **200, no auth, no key.** 100 projects/request, *all* of them gigs |
| **Jobicy** `/api/v2/remote-jobs?tag=freelance` | `*` | **200.** 45 rows, 11 explicitly Part-Time/Contract, rest titled "Freelance …" |
| Himalayas `/jobs/api` | **none** | 200 but unusable — would need the proxy this app does not have |
| WorkingNomads `/api/exposed_jobs/` | **none** | Same |
| Codeur.com `/projects.rss` | **none** | Same (and French-market) |
| Reddit `r/forhire/new.json` | — | **403 from here.** May work from a browser origin; unverified, so not planned |
| WeWorkRemotely contract RSS | — | 403 |
| freelancermap RSS · PeoplePerHour RSS | — | 404, both |
| RemoteOK `?tags=contract` | — | 302 to HTML. No server-side filter exists |

### Freelancer.com is the one that changes the answer

Verified against a live response, not documentation:

- **Every row is a gig**, not a job — 83 fixed-price, 17 hourly out of 100.
- **Server-side search works**: `?query=react` returns 20 matching projects, so
  the keyword box stops being a client-side filter over whatever the board
  happened to send.
- **Real budgets**: `budget.minimum`/`maximum` plus a currency, e.g. `250-750
  USD`, `2-8 USD` hourly. This is the first source in the repo that can populate
  `estimatedValueMin`/`Max` with a number that means something.
- **`jobs[]` carries real skills** (`React.js`, `Node.js`, `Website Design`).
- **`bid_stats.bid_count` says how crowded a project already is** — one sample
  had 55 bids. That is a qualifier no other source offers.
- Project URL is `https://www.freelancer.com/projects/{seo_url}` — confirmed 200.

**Say the downside plainly:** it is a bid marketplace. 55 bids on one project is
a race to the bottom, and the currency mix skews low (32 of 100 INR, 39 USD).
The volume is real; the win rate will not be. It suits "find something to bid on
this week", not "find a client worth keeping".

| # | Task | Status | Notes |
|---|---|---|---|
| C0 | **Read Freelancer.com's API terms before writing any code** | `todo` | **The gate.** The endpoint answers with no key and no auth, which is not the same as being licensed for this use. If the terms forbid it, phase C is Jobicy only and the rest of this table is cut |
| C1 | `freelancerProjects.ts` — normalise a project into a lead draft | `todo` | Not into `JobListing`: a project has a budget range, a bid count and no company, so forcing it through the job shape loses all three |
| C2 | Currency rule: map `estimatedValue` **only when the budget is USD** | `todo` | `Lead` has no currency field, and mixing INR 37,500 with USD 250 makes the Pipeline total meaningless. Always write `Budget: 37500-75000 INR` into `notes` regardless |
| C3 | Bid count and submit date into `notes`, newest first | `todo` | A project with 55 bids is already lost. Surfacing it is what makes the list triageable |
| C4 | Source dropdown entry; pass the keyword to `query=` server-side | `todo` | First source with a real search — do not filter it client-side like the boards |
| C5 | Jobicy as a second entry, pinned to `?tag=freelance` | `todo` | Structured `jobType`, keyless, CORS `*`. Smaller job than C1 |
| C6 | Make a gig source the default; demote RemoteOK | `todo` | Shipping a default that measured 0/100 on the thing the user wants is the actual defect here |
| C7 | Tests per normaliser over committed real responses | `todo` | Same rule as A5/B5. **No hand-written fixtures** |

**Done when:** the default Discover search returns projects with a real budget
and a bid count, and adding one produces a lead whose estimated value is either
a real USD number or empty — never a number in a currency nobody recorded.

### What no source fixes

Phase C buys a bigger pile of things to bid on. It does not change the win rate,
and on a bid marketplace the win rate is the whole problem — 55 competitors is
the norm, not the outlier. The lever that pays is upstream of every source in
this ledger: **being the only bidder**, which is what the Instagram/Places plan
was always about and what phase 5's reply-rate tracking exists to measure. Build
phase C because it makes the tool honest about what it is for; do not expect it
to produce a client.

---

## Phase 0 — Schema and settings

Additive only. No existing type changes shape, so nothing here can break the
37 passing tests. Verified: `db.ts` pins `DB_VERSION = 1` and only creates
stores when absent — IndexedDB holds plain objects with no enforced schema, so
new optional fields read `undefined` on existing records. **No migration
needed.**

| # | Task | Status | Notes |
|---|---|---|---|
| 0.1 | `Lead.instagramHandle?: string` | `todo` | Handle without `@`. `sourceUrl` stays the profile URL |
| 0.2 | `Lead.prototypeUrl?: string` | `todo` | Per-lead, not template-level |
| 0.3 | `Lead.psiScore?: number \| null` | `todo` | Lighthouse mobile performance, 0–100 |
| 0.4 | `Lead.psiFailingMetric?: string` | `todo` | Worst metric in words, e.g. `"LCP 8.4s on 4G"` |
| 0.5 | `Lead.psiCheckedAt?: string \| null` | `todo` | So a stale score can be refreshed |
| 0.6 | Daily DM budget: per-day sent counter + configurable cap | `todo` | Settings-level, not per-lead. Default **10**. See Q4 — this is a setting precisely because the real limit is unpublished |
| 0.7 | Extend export/import round-trip for the new fields | `todo` | `exportImport.ts` + its tests. Easy to forget; JSON restore silently drops unknown fields |

**Done when:** a lead with every new field set survives export → wipe → import,
and `npm test` is still green.

---

## Phase 1 — Paste-and-parse bulk intake

Cheapest item in either document, and the sink every later source writes into.
No network, no key, no CORS, no platform-terms surface — it parses your own
clipboard.

| # | Task | Status | Notes |
|---|---|---|---|
| 1.1 | Handle-extraction parser | `todo` | Pure function, own test file — matches the `nextAction.ts`/`mailto.ts` precedent |
| 1.2 | Drop non-profile path segments | `todo` | `/p/`, `/reel/`, `/explore/`, `/stories/`. **The test that matters** |
| 1.3 | Match bare `@handle` as well as full URLs | `todo` | |
| 1.4 | Dedupe within the paste | `todo` | |
| 1.5 | Dedupe against existing leads by handle | `todo` | Mirrors `Discover.tsx`'s `existingSourceUrls` set |
| 1.6 | Checkbox table UI + bulk create via `createLead` | `todo` | Reuse existing `ui/table` + `ui/button`; no new primitives |

**Done when:** a realistic messy paste (profile links, post links, bare handles,
duplicates, junk) yields exactly the right lead set, proven by unit test.

---

## Phase 2 — PageSpeed enrichment

Turns the pitch from an opinion into a measurement, and widens the ICP from
"no website" to "bad website" — a far larger population that has already proven
it will pay for a site.

| # | Task | Status | Notes |
|---|---|---|---|
| 2.0 | **Obtain a Google PSI API key** | `blocked` | **Needs the user.** Free, no billing account, no card. Everything below waits on it |
| 2.1 | `psi.ts` — fetch + normalise to score & worst metric | `todo` | Pure-ish module beside `jobDataLake.ts`; normaliser is unit-testable against a captured response |
| 2.2 | Key storage + Settings row | `todo` | `localStorage`, key `freelance-radar:psi-api-key`. **Reuse the `getStoredApiKey`/`setStoredApiKey` shape** from `jobDataLake.ts` rather than inventing a second pattern |
| 2.3 | Retry once on `429` | `todo` | Verified failure mode for unkeyed/over-quota calls |
| 2.4 | Feed `psiScore` → `Lead.score`, `psiFailingMetric` → `Lead.problem` | `todo` | Ends hand-entered scoring |
| 2.5 | Run on import for any lead with a website | `todo` | 1 call per lead against 25,000/day — no batching, no queue, no backoff needed |

**Verified, so do not re-litigate:** CORS is allowed (the endpoint echoes
`Origin`), so **no serverless proxy**. The key is required in practice despite
the docs calling it optional.

**Done when:** a real business URL yields a plausible score and a metric string
good enough to paste into a message unedited.

---

## Phase 3 — Prototype-first pitch + capped send queue

The phase that aims at the capped stage of the funnel. At 10–20 sends a day
there is 20+ minutes of budget per lead — enough to build the mockup *before*
messaging, so the message is a delivery, not a pitch.

| # | Task | Status | Notes |
|---|---|---|---|
| 3.0 | Answer Q2 (how prototypes get made) and Q3 (tips: library or per-lead) | `blocked` | **Needs the user.** Q3 decides whether a tips-content module exists at all |
| 3.1 | OTA-commission template variant (hospitality) | `todo` | Built from the prospect's own money: ~15% of their OTA revenue |
| 3.2 | PSI template variant (every other segment) | `todo` | Measured score + worst metric + prototype link |
| 3.3 | One-line opt-out — **email only** | `todo` | CAN-SPAM. Not needed for DMs |
| 3.4 | Send queue: pending-`initial` list, source filter, next/prev | `todo` | |
| 3.5 | Channel branch: email → Gmail; handle → copy + open profile | `todo` | **Open the profile, not `ig.me`** — see the correction below |
| 3.6 | Daily budget display ("7 of 10 sent") | `todo` | |
| 3.7 | **Hard block at the cap** | `todo` | The one place in this app that should stop you |
| 3.8 | UI states the send finishes on a phone | `todo` | Honesty about the desktop limitation, not a footnote |

**Done when:** the cap actually refuses an eleventh send, and the clipboard
carries a message worth answering.

---

## Phase 4 — Google Places discovery

**Gated: do not start before 20 leads have gone through phases 1–3 by hand.**
The spec's whole argument is that sourcing is the abundant input; building this
early optimises the half of the funnel that is not the constraint.

| # | Task | Status | Notes |
|---|---|---|---|
| 4.0 | Field test: 20 leads sourced and sent by hand | `todo` | **The gate.** Also produces the first real reply-rate number |
| 4.1 | Vercel serverless function holding the Places key | `todo` | A key in a client bundle is a public key. `vercel.json` already exists |
| 4.2 | Freeze the field mask as one constant | `todo` | `displayName`, `formattedAddress`, `websiteUri`, `nationalPhoneNumber`, `primaryType`. **Never `reviews`/`photos`** — they re-price the call to ~$40/1,000 |
| 4.3 | `placeToLeadDraft()` beside `jobToLeadDraft()` | `todo` | |
| 4.4 | Qualifier: empty `websiteUri`, or one pointing at Booking/Airbnb/Instagram/Linktree | `todo` | For lodging this *is* the qualification — no enrichment call needed |
| 4.5 | Discovery UI on `Discover.tsx`'s existing shape | `todo` | Pattern to copy, not a page to extend — different ICP |

**Cost:** Enterprise SKU (set by `websiteUri`), 1,000 free calls/month, ~$35/1,000
after. At 20 results per call that is ~20,000 places/month free against a need of
~300. Free in practice, but **only with the pinned mask**.

---

## Phase 5 — Reply-rate per pitch variant

The only metric in this plan that can produce a 5×. Everything upstream is
capped; conversion is not.

| # | Task | Status | Notes |
|---|---|---|---|
| 5.1 | Tag each outreach with its pitch variant | `todo` | |
| 5.2 | Reply rate by variant on the Dashboard | `todo` | Numbers only — `design.md` excludes charts |
| 5.3 | Replace the vendor 3% benchmark with the account's own number | `todo` | The point of the whole phase |

---

## Blocking questions

Ordered by what they hold up. Q1 is settled; the rest need the user.

| # | Question | Blocks | Default if unanswered |
|---|---|---|---|
| Q1 | ~~Target market~~ | — | **Resolved 2026-08-27:** US first, tourist-town hospitality, Places as sole discovery source |
| Q2 | How is the prototype generated — by hand, or from the lead's own photos/bio? | 3.1, 3.2 | Build by hand; `prototypeUrl` is specified either way, so phase 3 can ship without answering |
| Q3 | Sales tips — fixed rotating library, or written per lead? | 3.1, 3.2 | Per lead. A library is a content project pretending to be a code task |
| Q4 | Starting daily DM cap | 0.6 | **10.** Instagram publishes no limits; vendor sources bracket a new account at 10–20 cold/day |
| Q5 | Google PSI API key | All of phase 2 | None — genuinely blocking |
| ~~Q6~~ | ~~JobDataLake free API key~~ | — | **Withdrawn 2026-08-28.** Phase A is paused, so nothing waits on this |

---

## Decisions and corrections

Append-only. Newest first.

- **2026-08-31 — the phase B feeds are employment boards, not gig boards.**
  Measured: 13 freelance/contract/part-time rows out of 294 across the three,
  and RemoteOK — the default — contributes **0 of 100**. Remotive's entire free
  API is 19 rows. Phase C is the fix, and Freelancer.com's public project API is
  its centre: keyless, CORS `*`, 100 gigs per request with real budgets and bid
  counts. Gated on reading their API terms first (C0).

- **2026-08-31 — phase B verified end to end in a browser, two defects fixed.**
  Source changes now clear the result list (a stale row would have been filed
  under the wrong source), and RemoteOK's double-encoded text is repaired before
  it reaches a lead. Neither was reachable from the normaliser tests: one is
  component state, the other only appears in rows the fixture did not carry.
  Full check table in phase B above.
- **2026-08-31 — phase B shipped; HN cut on measurement.** RemoteOK, Remotive
  and Arbeitnow are live in Discover with no key, no signup and no card, tested
  against committed real responses (53 tests, 7 files). The HN thread was cut
  instead: counting every 2026 thread found **2 hiring posts in 7 months**
  against the plan's "5–10 a month". The thread is now freelancers pitching
  freelancers. W1 goes with it.
- **2026-08-31 — RemoteOK salary fields are not imported.** Of 101 live rows,
  4 carried a salary: one `30-36` (hourly) and three `10000-750000`
  (placeholder). Remotive's `salary` is free text (`"$14/hour"`). Both map to
  `null` rather than writing a fabricated value range onto a lead.
- **2026-08-31 — `JobDataLakeJob`/`JobDataLakeError` renamed to
  `JobListing`/`JobFeedError`.** Four sources now share the shape; the vendor
  name on the type was about to become a lie. `jobToLeadDraft` takes an optional
  `source` so leads stay attributable to the board they came from.

- **2026-08-28 — Phase A paused; phase B promoted to primary.** The JobDataLake
  repair is parked rather than half-finished: its gate was a signup key, and the
  free keyless feeds in phase B cover the same need with no key, no signup and
  no card. Q6 withdrawn. Consequence carried forward deliberately: **Discover
  still 404s and will keep 404ing.**
- **2026-08-28 — Discover has never worked.** `searchJobs()` calls
  `/v1/jobs/search`, which 404s; the real endpoint is `/v1/jobs`. Not caught
  because the repo's only verification pass (2026-08-10) predates the feature
  (2026-08-26) by 16 days, and because the feature's three tests never call the
  function that touches the API. Full evidence in
  [`audit-2026-08-28.md`](./audit-2026-08-28.md). Became phase A.
- **2026-08-28 — no hand-written fixtures for external APIs, ever again.** The
  root cause of the above: `jobDataLake.test.ts` asserts against an invented
  object, so three green tests could not fail for any of the reasons the
  integration was broken. Every external-API normaliser from here on is tested
  against a committed real response (A5, B5, 2.1).
- **2026-08-28 — lead generation is no longer Instagram-only.** Phases A and B
  produce leads in hours and cost nothing; the Instagram plan is a 3–6 week
  machine. Both now precede phase 0. The Instagram phases are unchanged, just
  no longer first.
- **2026-08-28 — Places phase 4 needs a billing card.** Free on usage at this
  volume, but Google Maps Platform will not issue a key without a card on file.
  It is the only item in this ledger with that requirement, which is enough on
  its own to keep it last.
- **2026-08-28 — `ig.me` does not work on desktop.** Meta's own docs say ig.me
  links are "not supported on Instagram Web"; on desktop the link degrades to a
  profile visit with no composer. Phase 3 now opens the profile, treats
  copy-to-clipboard as the load-bearing action, and states in the UI that the
  send finishes on a phone. *(Wiring 3.5 to `ig.me` would have promised a DM box
  that never opens.)*
- **2026-08-28 — Places has a cost surface the spec never stated.** Google
  retired the pooled $200 credit on 1 March 2025. `websiteUri` is an
  Enterprise-SKU field: 1,000 free calls/month, ~$35/1,000 after. Still free at
  this volume, but the field mask is now a frozen constant (task 4.2) because it
  is a cost control, not a preference.
- **2026-08-28 — PSI needs a key.** Google documents it as optional; an unkeyed
  request returns `429`, since unkeyed traffic shares a per-IP pool. Phase 2
  gains tasks 2.0 and 2.2 and is blocked until the key exists.
- **2026-08-28 — PSI is browser-callable.** The endpoint echoes the caller's
  `Origin` in `Access-Control-Allow-Origin`. Phase 2 needs no proxy. This was
  the one genuinely load-bearing unknown in the plan; it is now closed.
- **2026-08-28 — OSM counts re-measured, conclusion unchanged.** All nine
  regional figures confirmed within 0.5% via the taginfo JSON API. OSM stays
  `cut`, not deferred.
- **2026-08-27 — Instagram is the delivery channel, not the discovery channel.**
  The binding constraint is 5–20 cold DMs/day, so sustainable throughput is
  ~300 leads/month, which is roughly two hours of manual sourcing. Every
  "find leads faster" feature is therefore worth at most those two hours and
  sits at the end of the queue.
- **2026-08-27 — United States first.** Sole traders — this exact ICP — fall on
  the consent side of ePrivacy, so EU outreach needs consent the plan cannot
  obtain. Confirmed 2026-08-28, including Germany's B2B double-opt-in rule.
