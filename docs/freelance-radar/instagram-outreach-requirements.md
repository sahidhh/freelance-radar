# Instagram Outreach — Requirements (Phase Plan)

Status: **draft, not yet implemented.** Written for a future session to pick up
and build phase-by-phase. Extends `docs/requirements.md`; doesn't replace
anything in it.

**Revised 2026-08-27** against measured evidence. The 2026-08-26 draft was
written before any of the numbers below existed; where they contradict it, the
numbers win. Every claim here cites what it rests on.

Evidence base, in reading order:

1. [`instagram-lead-sourcing-research.md`](./instagram-lead-sourcing-research.md)
   — the nine sourcing options. **Partly overturned; don't read it alone.**
2. [`instagram-lead-sourcing-review.md`](./instagram-lead-sourcing-review.md)
   — the adversarial review that overturned it. **Authoritative where the two
   disagree.**
3. [`instagram-ledger.md`](./instagram-ledger.md)
   — the phase/task ledger. This document says *what* to build; the ledger
   says *where it stands*. Update the ledger, not this file, as work lands.

**Verified 2026-08-28.** Every external claim in this document was re-checked
against primary sources. Twenty-one of twenty-four held; **three were wrong**
and are corrected in place. See the [Verification log](#verification-log-2026-08-28)
at the end for the evidence and the method.

---

## The binding constraint

Everything in this plan follows from one measured number that the original
draft did not have.

| Account state | Cold DMs/day to non-followers |
|---|---|
| New account | **5–20** |
| Established, warmed | **30–40** |
| Pacing | no more than 2–3 per hour |

Exceeding it triggers action blocks, and the ceiling is **adaptive** — a low
reply rate or a few spam reports lowers it further.

**Consequences, which set the whole build order:**

- Sustainable throughput is **~150–600 leads/month**, realistically ~300.
- 300 businesses can be sourced by hand in roughly two hours a month. Lead
  supply is therefore an **abundant** input.
- Conversion is **uncapped**: 300 DMs at a 3% reply rate is 9 conversations; at
  15% it is 45. No sourcing feature can produce that multiple.

So this phase optimises the pitch, not the pipeline. Any feature whose payoff
is "find leads faster" is worth at most those two hours a month and belongs at
the end of the queue.

## Goal (revised)

Make each of the ~300 monthly messages good enough to answer — by attaching
measured evidence and a working prototype to every one — while keeping every
send manual and every send inside Instagram's limits.

The 2026-08-26 goal ("make it fast to turn businesses found on Instagram into
pitched leads") aimed at the abundant half of the funnel.

---

## What changed from the 2026-08-26 draft, and why

| Was | Now | Evidence |
|---|---|---|
| "Lead intake: manual / CSV only. No code talks to Instagram." | Automated *sourcing* is permitted, from sources that are not Instagram. The rule is **never authenticate**, not "never automate." | *Meta v. Bright Data* (N.D. Cal., 23 Jan 2024): Facebook/Instagram terms "only prohibit logged-in scraping, and not logged-off scraping." Meta dismissed and **waived its appeal** in Feb 2024. |
| "Meta's terms prohibit automated data collection from the platform." | Too broad. Struck. | Same. Caveat: district court, no appellate precedent, contract claim only — silent on copyright, DMCA, GDPR/DPDP, and Meta's freedom to rate-limit and block. |
| Build order: `instagramHandle` → template → send queue → CSV docs | Build order: paste intake → **PageSpeed enrichment** → prototype-first queue with a DM cap → discovery → reply-rate tracking | The DM ceiling above. |
| "Leads per session" is "a personal pacing counter, not a rate limiter." | It is a **hard cap** with a visible daily budget, starting at 10 and ramping weekly. | 5–20/day for a new account; the ceiling adapts down on poor reply rates. |
| Send flow: "opens in Gmail" | Two flows. Email keeps `mailto:`. Instagram is **copy draft → open profile → paste → send, and the send happens on a phone**. | Meta's own docs: `ig.me/m/<handle>` is the official click-to-Direct link, has **no message-prefill parameter** (only `?ref=`), and is **"not supported on Instagram Web"** — on desktop it degrades to a plain profile visit. Corrected 2026-08-28; the 2026-08-27 revision had the prefill limit right and the desktop limit missing. |
| Pitch framing: "no-website / outdated-website" | Pitch framing: **measured** — a Lighthouse score and the specific failing metric, plus a live prototype link. | PageSpeed Insights API is free at 25,000 requests/day with no billing account and no card. "You should have a website" is an opinion and is deflected with "we get orders on DM"; "your site scores 31/100 and takes 8.4s on 4G" is not. |
| Instagram is the discovery channel | Instagram is the **delivery** channel. Discovery comes from Google Places. | OSM was the research doc's top pick and is rejected outside Europe/US — see below. |

---

## Market selection (resolved 2026-08-27)

No specific city was fixed; the market is a free variable, with an interest in
tourist and remote destinations at better pricing. Measured, that resolves
three things at once.

### OpenStreetMap is out of the plan entirely

The research doc's top pick dies here. Objects tagged `contact:instagram`, per
Geofabrik regional taginfo:

| Region | Count | | Region | Count |
|---|---|---|---|---|
| United States | 26,012 | | Portugal | 6,420 |
| Germany | 18,221 | | Spain | 5,153 |
| Austria | 1,275 | | Indonesia (Bali) | 1,255 |
| India | **936** | | Croatia | 780 |
| | | | Greece | **627** |

<sub>Re-pulled 2026-08-28 from the taginfo JSON API
(`/api/4/key/stats?key=contact:instagram`, `type: all`). Every figure is within
0.5% of the 2026-08-27 pull — normal mapper churn. The conclusion is
unchanged.</sub>

**OSM's Instagram density tracks mapper culture, not tourism or business
density.** Germany is an outlier; every classic tourist market — Greece,
Croatia, Bali, even alpine Austria — is at or near India's level. "Target
tourist destinations" and "source from OSM" are mutually exclusive strategies,
so OSM is removed from the build order rather than deferred. Public Overpass
also 503'd on every attempt across three mirrors.

**Google Places Text Search is the sole discovery source, in every market.**
It has no such geography problem, and `websiteUri` is both the qualifier and,
frequently, the handle (see below).

### The market decision is set by outreach law, not by data

The instinct to chase better pricing points at Europe. The law points the other
way, and for this ICP specifically:

| | European Union / UK | United States |
|---|---|---|
| Regime | GDPR + ePrivacy Art. 13; ePrivacy wins where they overlap | CAN-SPAM |
| Model | **Opt-in** for individuals | **Opt-out** |
| B2B carve-out | Legitimate interest (Art. 6(1)(f)) covers **corporate subscribers** — Ltd, LLP | Not needed; unsolicited commercial email is lawful with disclosure + opt-out |
| **Sole traders** | Count as **individuals** — consent required. Germany's UWG requires prior consent even B2B; Austria is stricter still | Same as any business |
| Exposure | Up to €20M or 4% of global turnover | Up to ~$53,088 per email |

**The ICP is the worst-served category under EU law.** A one-owner guesthouse,
café or dive shop is a sole trader, so it falls on the consent side of
ePrivacy, not the legitimate-interest side. Note also that GDPR governs
*building the list* about EU individuals regardless of channel — so DM-only
outreach does not route around it.

**Decision: target the United States first.** Highest pricing, permissive
outreach law, English, excellent Places coverage, and — validating the "remote
places" instinct — resort and gateway towns have few local web agencies
competing for the work. Europe is a later phase, entered only with a
documented Legitimate Interest Assessment, an opt-out line in every message,
and Germany and Austria excluded.

### The ICP and the pitch that follows from it

Tourist-town **accommodation and hospitality** — lodging, B&B, guesthouse, tour
operator, dive shop, resort-town restaurant — because those businesses have a
quantifiable, recurring cost that a website removes:

- Booking.com commission runs **10–25%, averaging ~15%**, commonly **18–22%**
  with visibility programmes, plus **1.1–3.1%** payment processing.
- Airbnb moved to a host-only model at a flat **15.5%**.
- For small independent properties the rate is **non-negotiable** — negotiated
  terms start around 50+ rooms.

A property turning $80,000/year through OTAs pays roughly **$12,000–17,000/year
in commission**. Shifting even a tenth of those bookings direct pays for the
site several times over in one season.

That is a pitch made of the prospect's own money, and it outranks the Lighthouse
argument for this segment. It is also **self-qualifying from Places alone**: for
a lodging business, a `websiteUri` that is empty, or points at a Booking.com or
Airbnb listing, or at Instagram or Linktree, *is* the qualification — no
enrichment call needed.

PageSpeed stays as the pitch for every other segment, and as the secondary
argument for hospitality businesses that do have a site.

---

## Schema changes

Additive only. No changes to `Outreach`, `Project` or `Activity` shape; the
`OutreachType` enum stays capped at `initial | follow_up_1 | follow_up_2` per
`docs/requirements.md`.

On `Lead`:

- `instagramHandle?: string` — the handle without `@`. `sourceUrl` stays the
  profile URL.
- `prototypeUrl?: string` — the live mockup built for this lead. Per-lead, not
  a template-level link; this answers the 2026-08-26 open question.
- `psiScore?: number | null` — Lighthouse mobile performance, 0–100.
- `psiFailingMetric?: string` — the single worst metric, in words, for the
  pitch ("LCP 8.4s on 4G").
- `psiCheckedAt?: string | null` — so a stale score can be refreshed.

New, outside `Lead` — a **daily DM budget**: a per-day sent counter and a
configurable cap (default 10). Settings-level, not per-lead.

`psiScore` feeds `Lead.score`; `psiFailingMetric` feeds `Lead.problem`. Both
computed on import, so scoring stops being hand-entered.

---

## Screens and flows

1. **Paste-and-parse bulk intake.** One textarea, "paste anything." Regex out
   every `instagram.com/<handle>` and bare `@handle` (dropping `/p/`, `/reel/`,
   `/explore/`, `/stories/` segments), dedupe within the paste and against
   existing leads by handle, show a checkbox table, bulk-create the checked
   rows via the existing `createLead`. No network call, no key, no CORS, no
   platform-terms surface — it parses your own clipboard. Survived the review
   unchanged; it is also the sink every later source writes into.

2. **PageSpeed enrichment.** For any lead with a website, one call to
   `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=<site>&strategy=mobile`
   fills `psiScore`, `psiFailingMetric`, `psiCheckedAt`. Free, 25,000/day, no
   billing account and no card. This also **widens the ICP**: businesses with a
   bad site are far more numerous than businesses with none, and they have
   already proven they will pay for one.

   Two measured facts settle the implementation (2026-08-28):

   - **CORS is allowed.** The endpoint echoes the caller's `Origin` in
     `Access-Control-Allow-Origin`, so this runs straight from the SPA with
     **no serverless proxy** — unlike Places below.
   - **An API key is required in practice, not optional.** Google's docs call
     it optional, but an unkeyed call returns `429 Too Many Requests`, because
     unkeyed traffic shares a per-IP pool. Verified by direct request. Store
     the key in `localStorage` under `freelance-radar:psi-api-key`, exactly the
     pattern `jobDataLake.ts` already uses for its key — see
     `getStoredApiKey`/`setStoredApiKey` there and reuse the Settings row.

   Because a single lead is one call and the budget is 25,000/day, enrichment
   can run on every lead at import with no batching, no queue and no backoff
   beyond retrying a 429 once.

3. **Prototype-first pitch template.** A draft variant in `outreachTemplate.ts`
   beside the existing `initial` template (pure function, unit-testable like
   its neighbours), built around: the measured PSI finding, the
   `prototypeUrl` link, 2–3 sales-improvement tips, and — **for email only** —
   a one-line opt-out. At 10–20 sends a day there is 20+ minutes of budget per
   lead, which is enough to build the mockup *before* messaging. The message is
   then a delivery, not a pitch: *"I built your homepage, it's live here, free,
   keep it or bin it."*

4. **Send queue with a hard daily cap.** Lists leads with a pending `initial`
   draft, filterable by source, Next/Previous through them. Each step stays the
   existing single-lead action, but branches on channel:
   - `email` present → **Open Gmail** (existing `mailto:` flow) → **Mark as Sent**
   - `email` empty, `instagramHandle` present → **Copy draft** → **Open
     profile** (`https://www.instagram.com/<handle>/`) → **Mark as Sent**

   **The Instagram send finishes on a phone, and the UI must say so.** Meta
   documents `ig.me/m/<handle>` as "not supported on Instagram Web"; from a
   desktop browser it degrades to a profile visit with no composer, so wiring
   the button to `ig.me` would promise a DM box that never opens. The app's job
   on this branch is therefore only: put the right text on the clipboard, open
   the right profile, and record that it was sent. Copy-to-clipboard is the
   load-bearing action, not the link.

   The queue shows today's budget (e.g. "7 of 10 sent") and **blocks further
   sends at the cap**, with the cap editable in Settings. This is the one place
   the app should stop you.

5. **Discovery tab (phase 4, gated).** Google Places Text Search on
   `Discover.tsx`'s existing shape — search params → results list → *Add lead* —
   with a `placeToLeadDraft()` beside the existing `jobToLeadDraft()`. Needs a
   Vercel serverless function to hold the Places key: this app is a pure
   client-side SPA, so a key in the bundle is a public key.

   **Cost, which the 2026-08-27 revision omitted (added 2026-08-28).** Google
   retired the pooled $200 monthly credit on 1 March 2025 and replaced it with
   per-SKU monthly free caps that do not pool. `websiteUri` — the field this
   whole phase rests on, because it *is* the qualifier — is an **Enterprise
   SKU** field. So:

   | | |
   |---|---|
   | SKU billed | Enterprise (set by `websiteUri`) |
   | Free cap | **1,000 calls/month**, not pooled |
   | Over the cap | ~$35 per 1,000 calls |
   | Results per call | up to 20 |

   1,000 calls × 20 results ≈ **20,000 places/month free**, against a need of
   ~300. The phase is comfortably free — but only with a **pinned field mask**.
   Request exactly `places.displayName`, `places.formattedAddress`,
   `places.websiteUri`, `places.nationalPhoneNumber`, `places.primaryType`.
   **Never** request `reviews` or `photos`: those re-price the same call to
   Enterprise + Atmosphere (~$40/1,000). The field mask is a cost control, so
   it belongs in code as a single frozen constant, not as a caller argument.

6. **Reply-rate per pitch variant.** Which framing gets answered. The only
   metric in this plan that can produce a 5×.

> Note: the existing `Discover.tsx` / JobDataLake integration serves a
> **different ICP** — contract roles at companies large enough to run an ATS.
> It is a UI pattern to copy, not a business model to extend.

---

## Non-goals

- **Never authenticate to Instagram.** No session cookies, no login, no
  private-API libraries (`instagrapi`, `instagram-private-api`, Osintgram), no
  Instaloader in cookie mode. This is the whole risk line; everything dangerous
  in the research doc is dangerous for this one reason.
- Store only the handle, the bio text, and the public business facts needed to
  write a pitch. No media, no captions, no bulk archives.
- No scheduled, cron, or background sending of any kind.
- No bulk "send all" — every send is one explicit action on one message.
- No email open/click tracking.
- No automatic/bulk email. Unattended scheduled commercial email is regulated
  (CAN-SPAM and equivalents) and is already excluded by `docs/requirements.md`.
  *(CAN-SPAM does not govern Instagram DMs — Instagram's own spam heuristics
  do, which is what the daily cap is for.)*

---

## Open questions

1. ~~Target city / market.~~ **Resolved above:** United States first,
   tourist-town hospitality, Google Places as the only discovery source.
2. How is the prototype generated — by hand, or from the lead's own Instagram
   photos and bio? Affects whether phase 2 needs a generation step or just a
   `prototypeUrl` field. *(The field is specified either way.)*
3. Are the sales tips a fixed rotating library or written per lead? Affects
   whether `outreachTemplate.ts` needs a tips-content module.
4. Starting daily DM cap — 10 remains the right default. Note what verification
   established: **Instagram publishes no DM limits at all.** Every number in
   this document traces to vendors who sell DM-automation tools, who have an
   interest in the number sounding safe. Their own range for a new account
   (10–20 cold/day, 2–3/hour) brackets our 10, so the default is defensible as
   the conservative end of hearsay — not as a documented ceiling. This is
   precisely why the cap is a **user-editable setting with a visible counter**
   rather than a constant: the real limit is discoverable only by the account
   that hits it.

Resolved since 2026-08-26: the prototype asset is **per-lead** (`prototypeUrl`),
not a generic template link. Resolved 2026-08-27: the target market, the
discovery source, and the primary pitch — see above.

---

## Build order

| Phase | Build | Why here |
|---|---|---|
| 0 | `instagramHandle`, `prototypeUrl`, `psi*` fields; daily-DM-budget setting | Everything else needs somewhere to land |
| 1 | Paste-and-parse bulk intake | Cheapest item in either document; ~300 leads/month is easy to source by hand and this makes it fast |
| 2 | PageSpeed Insights enrichment + auto-scoring | Free at 25,000/day, CORS-clean, no proxy; turns an opinion pitch into evidence and widens the ICP |
| 3 | Prototype-first templates (OTA-commission variant for hospitality, PSI variant for the rest) + DM-aware send queue with hard cap | Aims squarely at the capped stage |
| 4 | Google Places discovery tab (US tourist-town lodging + hospitality first) — **after** the 20-result field test | Sole discovery source; for lodging, `websiteUri` alone qualifies the lead and often hands over the handle. Needs a serverless proxy and a pinned field mask — the only phase here with a cost surface |
| 5 | Reply-rate tracking per pitch variant | The only metric that can multiply results |
| 6 | Everything else — SERP APIs, Meta Business Discovery, Apify | Each saves ≤2 hours/month. Last, or never. **OSM is cut, not deferred** — see market selection. |

Phases 1–3 are the minimum viable feature. Phase 4 onward is optimisation of
the abundant input.

---

## Verification log 2026-08-28

Every external claim in this document was re-checked. Method, in order of
preference: primary vendor documentation → direct HTTP request → court/regulator
reporting → secondary sources, used only where nothing better exists.

### Corrected — the claim was wrong

| Claim as written | What verification found | Effect |
|---|---|---|
| Instagram send flow is "open `ig.me/m/<handle>`" | Meta's own docs state ig.me links are **"not supported on Instagram Web."** On desktop the link degrades to a profile visit with no composer. | **Phase 3 flow rewritten.** Clipboard is the load-bearing action; the send completes on a phone and the UI must say so. |
| Places discovery is free / no cost stated | The pooled $200 credit was **retired 1 March 2025**. `websiteUri` is an **Enterprise-SKU** field: 1,000 free calls/month, ~$35/1,000 after. | **Phase 4 gains a cost model and a frozen field mask.** Still free at this volume (≈20,000 places/month), but only if the mask excludes `reviews`/`photos`. |
| PSI needs "no key" | Google calls the key optional; an unkeyed request returns **`429 Too Many Requests`** because unkeyed traffic shares a per-IP pool. Reproduced directly. | **Phase 2 gains a key + a Settings row**, reusing the `jobDataLake.ts` localStorage pattern. |

### Confirmed — build on these

| Claim | Verification |
|---|---|
| PSI API is free at 25,000 queries/day, no billing account | Confirmed. Google offers no paid tier; more requires a quota request. |
| **PSI is callable from the browser** (not previously checked) | **Newly established.** A request carrying `Origin: https://freelance-radar.vercel.app` came back with that exact origin in `Access-Control-Allow-Origin`. Phase 2 needs **no proxy** — the one genuinely load-bearing unknown in this plan, now closed. |
| `ig.me/m/<handle>` is the official click-to-Direct link with **no prefill parameter** | Confirmed against Meta's developer docs: only `?ref=` exists. The `?text=` parameter remains undocumented and unreliable. |
| *Meta v. Bright Data* — terms do not prohibit logged-off scraping | Confirmed. N.D. Cal., Judge Chen, summary judgment **24 Jan 2024**; Meta dropped the suit **23 Feb 2024** without appealing. Precise wording: Meta *dismissed without appealing*, which is slightly weaker than "waived its appeal." |
| OSM `contact:instagram` counts, all nine regions | Confirmed via taginfo JSON API; every figure within 0.5% of the recorded value. Counts updated in place. **The OSM-is-out conclusion is unaffected.** |
| Booking.com 10–25% commission, ~15% average, +1.1–3.1% processing | Confirmed, including the ~3% Preferred Partner uplift. |
| Airbnb flat 15.5% host-only fee | Confirmed as the 2026 model. |
| CAN-SPAM maximum **$53,088 per email** | Confirmed, and stronger than stated: the 2026 inflation adjustment was suspended by OMB, so $53,088 is the operative figure. Penalty is per-message, not per-campaign, with no revenue cap. |
| Sole traders fall on the consent side of ePrivacy/PECR | Confirmed. Sole traders and most ordinary partnerships are individual subscribers; Germany requires double opt-in even B2B. **The US-first decision holds.** |

### Unverifiable by nature — treat as estimates

| Claim | Status |
|---|---|
| Instagram cold-DM limits (5–20/day new, 30–40 warmed, 2–3/hour) | **Instagram publishes nothing.** All figures come from DM-automation vendors with a commercial interest. Independent sources bracket a new account at 10–20 cold/day and 2–3/hour, so the plan's default of 10 sits at the conservative end. Keep it a tunable setting, never a constant. See open question 4. |
| ~3% cold-outreach reply rate | Vendor benchmark. Directionally fine for sizing; phase 5 exists to replace it with the account's own measured number. |

### Codebase claims — checked against `src/`

All of this document's assumptions about existing code are accurate:
`createLead` and the `NewLead` type (`src/db/leads.ts`), `jobToLeadDraft` and
the `getStoredApiKey`/`setStoredApiKey` localStorage pattern
(`src/lib/jobDataLake.ts`), the search-params → results → *Add lead* shape
(`src/pages/Discover.tsx`), and `buildOutreachDraft` as a pure, unit-tested
function (`src/lib/outreachTemplate.ts`). Every schema field this plan adds is
additive; nothing here requires changing an existing type.

---

## Sources

- Instagram DM limits — [flowgent](https://flowgent.ai/blog/instagram-dm-limits-how-many-messages-you-can-send-daily) · [Wave: safe numbers to avoid bans](https://www.usewave.co/blog/instagram-dm-limits) · [Metricool: Instagram limits](https://metricool.com/instagram-limits/)
- Reply-rate benchmarks — [Cleanlist: 3.1% cold email response rate](https://www.cleanlist.ai/blog/2026-02-18-cold-email-response-rate-statistics) · [Instantly 2026 benchmark report](https://instantly.ai/cold-email-benchmark-report-2026)
- Meta v. Bright Data — [Bright Data: Meta dismisses claim](https://brightdata.com/blog/general/meta-dismisses-claim-against-bright-data) · [Eric Goldman's Technology & Marketing Law Blog](https://blog.ericgoldman.org/archives/2024/01/game-on-bright-data-scores-major-victory-in-web-scraping-dispute-with-meta-guest-blog-post.htm) · [Farella Braun + Martel](https://www.fbm.com/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/)
- OSM coverage by region — taginfo: [US](https://taginfo.geofabrik.de/north-america:us/keys/contact%3Ainstagram) · [Germany](https://taginfo.geofabrik.de/europe:germany/keys/contact%3Ainstagram) · [Portugal](https://taginfo.geofabrik.de/europe:portugal/keys/contact%3Ainstagram) · [Spain](https://taginfo.geofabrik.de/europe:spain/keys/contact%3Ainstagram) · [Austria](https://taginfo.geofabrik.de/europe:austria/keys/contact%3Ainstagram) · [Indonesia](https://taginfo.geofabrik.de/asia:indonesia/keys/contact%3Ainstagram) · [India](https://taginfo.geofabrik.de/asia:india/keys/contact%3Ainstagram) · [Croatia](https://taginfo.geofabrik.de/europe:croatia/keys/contact%3Ainstagram) · [Greece](https://taginfo.geofabrik.de/europe:greece/keys/contact%3Ainstagram)
- Outreach law — [GDPR legitimate interest for B2B cold email](https://salesforceeurope.com/blog/what-is-legitimate-interest-for-gdpr-cold-email-b2b-rules) · [GDPR cold email rules 2026](https://prospeo.io/s/gdpr-cold-email) · [UK PECR: corporate subscribers vs sole traders](https://leadistry.co.uk/blog/cold-email-uk-gdpr-legitimate-interest) · [GDPR vs CAN-SPAM compliance](https://instantly.ai/blog/b2b-email-list-compliance-gdpr-canspam/) · [cold email legal guide 2026](https://overloop.com/blog/cold-email-illegal)
- OTA commission — [Booking.com commission guide 2026](https://rield-rm.com/en/booking-com-commission-guide/) · [what hotels really pay](https://kimisuite.com/en/blog/booking-com-commissions-explained) · [Booking.com fees for hosts](https://www.houst.com/blog/booking-com-fees-for-hosts) · [Guesty breakdown](https://www.guesty.com/blog/how-much-does-booking-com-charge-hosts/)
- Google Places — [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details) · [Place Data Fields (New)](https://developers.google.com/maps/documentation/places/web-service/data-fields) · [Text Search (New)](https://developers.google.com/maps/documentation/places/web-service/text-search) · [usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- PageSpeed Insights — [API limits](https://groups.google.com/g/pagespeed-insights-discuss/c/dB7hWmGAGsw) · [Unlighthouse PSI API guide](https://unlighthouse.dev/learn-lighthouse/pagespeed-insights-api)
- Instagram DM deep links — [respond.io ig.me guide](https://respond.io/blog/instagram-direct-message-link) · [CreatorFlow ig.me guide](https://creatorflow.so/blog/ig-me-link-guide/)
- Instagram DM deep links, **primary** — [Meta for Developers: Using ig.me Links](https://developers.facebook.com/documentation/business-messaging/instagram-messaging/features/ig-me-links) (the "not supported on Instagram Web" statement)
- Places SKU tiers, **primary** — [Place Data Fields (New)](https://developers.google.com/maps/documentation/places/web-service/data-fields) (`websiteUri` = Enterprise) · [Places pricing after the $200-credit retirement](https://www.mapsleads.co/blog/google-places-api-free-tier-limits-2026)
- PSI, **primary** — [Get Started with the PageSpeed Insights API](https://developers.google.com/speed/docs/insights/v5/get-started)
- OSM counts, **primary** — taginfo JSON API, e.g. `https://taginfo.geofabrik.de/asia:india/api/4/key/stats?key=contact%3Ainstagram`
- CAN-SPAM penalty — [FTC inflation-adjusted maximum, $53,088/email](https://www.adaptivesecurity.com/blog/email-compliance-penalties)
