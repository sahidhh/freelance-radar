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
| Send flow: "opens in Gmail" | Two flows. Email keeps `mailto:`. Instagram is **copy draft → open `ig.me/m/<handle>` → paste → send**. | `ig.me/m/<handle>` is Meta's official click-to-Direct link, but **no supported way to prefill the message body exists**; the `?text=` parameter is undocumented and must not be relied on. |
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
| United States | 25,895 | | Portugal | 6,419 |
| Germany | 18,176 | | Spain | 5,144 |
| Austria | 1,273 | | Indonesia (Bali) | 1,255 |
| India | **926** | | Croatia | 778 |
| | | | Greece | **624** |

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

2. **PageSpeed enrichment.** For any lead with a website, one call to the
   PageSpeed Insights API fills `psiScore`, `psiFailingMetric`, `psiCheckedAt`.
   Free, 25,000/day, no billing account — so it can run on every lead on import
   with no quota anxiety. This also **widens the ICP**: businesses with a bad
   site are far more numerous than businesses with none, and they have already
   proven they will pay for one.

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
   - `email` empty, `instagramHandle` present → **Copy draft** → **Open DM**
     (`https://ig.me/m/<handle>`) → **Mark as Sent**

   The queue shows today's budget (e.g. "7 of 10 sent") and **blocks further
   sends at the cap**, with the cap editable in Settings. This is the one place
   the app should stop you.

5. **Discovery tab (phase 3, gated).** Google Places Text Search on
   `Discover.tsx`'s existing shape — search params → results list → *Add lead* —
   with an `placeToLeadDraft()` beside the existing `jobToLeadDraft()`. Needs a
   Vercel serverless function to hold the Places key: this app is a pure
   client-side SPA, so a key in the bundle is a public key.

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
4. Starting daily DM cap — 10 is the evidence-backed default for a new
   account; confirm the account's age and history before setting it higher.

Resolved since 2026-08-26: the prototype asset is **per-lead** (`prototypeUrl`),
not a generic template link. Resolved 2026-08-27: the target market, the
discovery source, and the primary pitch — see above.

---

## Build order

| Phase | Build | Why here |
|---|---|---|
| 0 | `instagramHandle`, `prototypeUrl`, `psi*` fields; daily-DM-budget setting | Everything else needs somewhere to land |
| 1 | Paste-and-parse bulk intake | Cheapest item in either document; ~300 leads/month is easy to source by hand and this makes it fast |
| 2 | PageSpeed Insights enrichment + auto-scoring | Free and effectively unlimited; turns an opinion pitch into evidence and widens the ICP |
| 3 | Prototype-first templates (OTA-commission variant for hospitality, PSI variant for the rest) + DM-aware send queue with hard cap | Aims squarely at the capped stage |
| 4 | Google Places discovery tab (US tourist-town lodging + hospitality first) — **after** the 20-result field test | Sole discovery source; for lodging, `websiteUri` alone qualifies the lead and often hands over the handle |
| 5 | Reply-rate tracking per pitch variant | The only metric that can multiply results |
| 6 | Everything else — SERP APIs, Meta Business Discovery, Apify | Each saves ≤2 hours/month. Last, or never. **OSM is cut, not deferred** — see market selection. |

Phases 1–3 are the minimum viable feature. Phase 4 onward is optimisation of
the abundant input.

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
