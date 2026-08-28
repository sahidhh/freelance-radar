# Instagram Outreach — Phase & Task Ledger

The running state of the build specified in
[`instagram-outreach-requirements.md`](./instagram-outreach-requirements.md).

**That document says what to build and why. This one says where it stands.**
When work lands, update this file — not the spec. When the spec is wrong,
correct the spec and note it in Decisions below.

Last updated: **2026-08-28** · Spec verified: **2026-08-28** · Code written: **none yet**

## Status key

`todo` · `wip` · `done` · `blocked` (needs an answer or an input) · `cut` (decided against, kept for the record)

---

## Phase summary

| # | Phase | Status | Gate to enter | Cost surface |
|---|---|---|---|---|
| — | Repo hygiene | `todo` | none | none |
| 0 | Schema + DM budget setting | `todo` | Phase −1 merged | none |
| 1 | Paste-and-parse bulk intake | `todo` | Phase 0 | none |
| 2 | PageSpeed enrichment + auto-scoring | `blocked` | Phase 0; **needs a Google API key** | free, 25k/day |
| 3 | Prototype-first templates + capped send queue | `blocked` | Phase 1 + 2; **needs Q2/Q3 answered** | none |
| 4 | Google Places discovery | `todo` | **20-lead field test of phases 1–3 first** | Enterprise SKU, 1k calls/mo free |
| 5 | Reply-rate tracking per pitch variant | `todo` | Phase 3 has shipped real sends | none |
| 6 | SERP APIs, Meta Business Discovery, Apify | `todo` | never, realistically | varies |
| — | OpenStreetMap sourcing | `cut` | — | — |

Phases 1–3 are the minimum viable feature. Everything from 4 on optimises the
input the spec measured as **abundant** — worth ~2 hours a month, no more.

---

## Phase −1 — Repo hygiene

Not in the spec; these are open loops that make every later phase more
expensive the longer they sit.

| # | Task | Status | Notes |
|---|---|---|---|
| H1 | Merge `claude/mobile-ui-overhaul-g7iffk` | `todo` | 1 commit, 9 files, no PR. Touches `Leads`/`Outreach`/`Settings`/`LeadForm`/`App` — the exact files phases 0–3 edit. **Do this before phase 0**; the conflict cost only grows. |
| H2 | Merge this research/spec branch | `todo` | `claude/instagram-outreach-research-vxvtlj`, docs only, zero merge risk |
| H3 | Fast-forward local `master` | `todo` | Local `master` sits at `1f9c763`, far behind `origin/master` |
| H4 | `npm install`, confirm `build` + `test` green | `todo` | `node_modules` absent; 34 tests are the pre-existing baseline to protect |

---

## Phase 0 — Schema and settings

Additive only. No existing type changes shape, so nothing here can break the
34 passing tests.

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

---

## Decisions and corrections

Append-only. Newest first.

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
