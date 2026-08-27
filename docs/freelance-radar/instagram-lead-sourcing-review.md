# Adversarial Review of the Instagram Lead-Sourcing Research

Companion to `instagram-lead-sourcing-research.md`, written to attack it.
Reviewed 2026-08-27. Three of its claims do not survive, including the
headline recommendation.

---

## Verdict summary

| # | Claim in the research doc | Verdict |
|---|---|---|
| 1 | OSM/Overpass is "the standout" first build | **Rejected** outside Europe/US — India has 926 tagged objects nationwide |
| 2 | Overpass is keyless + CORS, so no backend needed | **Undermined** — public instances 503'd on every attempt |
| 3 | "A large fraction" of `contact:instagram` objects have no website | **Weakened** — up to 82% have one, and ~37% are chain outlets |
| 4 | Meta v. Bright Data narrows the ToS question to logged-in scraping | **Upheld, and understated** |
| 5 | Google Custom Search JSON API is closed to new customers | **Upheld** |
| 6 | Places is a complement; `websiteUri` ≈ Pro tier, 5k free/mo | **Wrong** — Enterprise SKU, 1,000 free/mo |
| 7 | Business Discovery is the sanctioned enrichment path | **Upheld**, but weaker than presented |
| 8 | *(new idea, tested and killed)* Meta Ad Library as an intent source | **Rejected** outside EU/UK |
| — | **The premise: that lead sourcing is the bottleneck** | **Rejected** — see [the real bottleneck](#the-claim-that-actually-matters-is-the-premise) |

---

## 1. OSM coverage — rejected outside Europe and the US

I flagged this as "gated on a yield test" and then ranked it first anyway.
The test now exists. Geofabrik runs per-region taginfo instances, so the
country-level answer is directly measurable:

| Region | Objects with `contact:instagram` |
|---|---|
| Germany | **18,176** |
| United States | **25,895** |
| **India** | **926** |

India has **163,127** objects tagged `shop` in OSM — so the shops are mapped,
they just aren't tagged with Instagram handles. The tagging rate is **0.57%**,
against roughly 20× the absolute count in a country with 6% of the population.

926 nationwide, before filtering to one city, before filtering to businesses
with no website, before filtering out chains, is not a pipeline. If your
target market is India, **Option 1 is dead** and I should have said so instead
of ranking it first on the strength of a global tag count that Europe
dominates. If your market is Germany, the US, or western Europe generally, it
survives and the original reasoning holds.

*This is the one question that changes the whole plan — tell me your target
city and everything below re-sorts.*

## 2. "Keyless and CORS-enabled, works from the SPA as-is" — undermined

Operationally weaker than I implied. Across this session: five attempts,
three mirrors (`overpass-api.de`, `overpass.kumi.systems`,
`overpass.private.coffee`), two independent network paths — **every one
returned HTTP 503 or timed out.** That is Overpass's normal load-shedding
behaviour, not an outage.

CORS support is real, but it doesn't matter much if the endpoint refuses one
request in three. A user-facing search box built directly on public Overpass
will visibly fail in front of you, which means you need caching and a
retry/fallback layer — i.e. a backend — and the "no serverless function
needed" advantage I sold it on largely evaporates.

## 3. "A large fraction have no website" — weakened, and the ICP is polluted

Two problems with my own numbers.

**The arithmetic doesn't support the claim.** Of 288,496 objects with
`contact:instagram`: 109,189 also have `website` and 128,445 have
`contact:website`. I presented the 109k as if it were the whole website
population. If those two sets are largely disjoint, up to **237,634 — 82% —
have a website**, leaving ~50k globally without one, not "a large fraction."
The truth is somewhere between, and I didn't measure the overlap before
writing the sentence.

**Worse, the population skews to chains.** `brand` co-occurs 106,960 times and
`brand:wikidata` 97,115 times — roughly **37% of the Instagram-tagged
population is branded chain outlets** (largely from OSM's Name Suggestion
Index), each inheriting a corporate Instagram handle. Those are the exact
opposite of the ICP: a Starbucks franchise does not need you to build it a
website. Any real query needs `[!brand]`, which cuts the usable pool again.

## 4. Meta v. Bright Data — upheld, and I understated it

The correction holds and is stronger than I wrote. After losing summary
judgment on 23 Jan 2024, **Meta filed a notice of dismissal about a month
later and thereby waived its right to appeal** — it did not take the loss to
the Ninth Circuit.

The honest caveats, which I should have included: it is a **district-court**
decision, and because Meta dismissed rather than appealed there is no
appellate precedent — it is persuasive, not binding. It resolved a *breach of
contract* question only; it says nothing about copyright, DMCA, GDPR/DPDP, or
Meta's unrestricted freedom to rate-limit and IP-block you. The operating rule
("never authenticate") stands unchanged.

## 5. Google Custom Search — upheld

From Google's own documentation, verbatim: *"The Custom Search JSON API is
closed to new customers."* Existing customers are cut off 1 January 2027. No
retraction needed.

## 6. Google Places field tiers — I got this wrong

The research doc says `websiteUri` sits in the Pro tier at ~5,000 free calls a
month. Google's Place Details documentation puts **`websiteUri`,
`nationalPhoneNumber`, `internationalPhoneNumber`, `rating` and the opening-hours
fields in the Enterprise SKU** — which carries **1,000 free calls/month**, not
5,000. Pro carries `displayName`; Essentials carries `formattedAddress` and
`types`. The field mask you send decides the SKU.

The correction cuts the free allowance by 5×. It does **not** kill the option —
see below, where it turns out to be the better answer anyway.

## 7. Business Discovery — upheld, weaker than presented

Everything I said is accurate, but the framing was generous. It cannot search;
it only works against professional accounts; it needs your own professional
account, a linked Facebook Page, an app, and app review. I sourced the "60+
day" review figure from a vendor blog, not from Meta. Treat it as an unknown
wait, and treat the whole option as a nice-to-have that must never be on the
critical path.

## 8. Meta Ad Library — a better idea I tested and killed

Before writing this review I thought I had a stronger intent signal: businesses
*already spending money on ads* have budget and marketing intent, which beats
"has no website" by a mile, and Meta's Ad Library API is free and official.

It doesn't work outside Europe. The Ad Library API serves **all** ad types only
when `ad_reached_countries` is an EU member state or the UK — a consequence of
the DSA ad-repository obligation. Everywhere else it returns **political and
social-issue ads only**, which is useless for finding cafés. Killed for
non-EU/UK markets; genuinely strong inside them.

---

## The claim that actually matters is the premise

Every option in the research doc — mine and yours — answers "how do I get more
Instagram handles." That question is worth much less than it looks, because of
a number neither document contained:

**Instagram's cold-DM ceiling.**

| Account state | Cold DMs/day to non-followers |
|---|---|
| New account | **5–20** |
| Established, warmed | **30–40** |
| Pacing | no more than 2–3/hour |

Exceeding it triggers action blocks, and the limits are *adaptive* — a low
reply rate and a few spam reports drop your ceiling further.

So your maximum sustainable throughput is roughly **150–600 leads a month**,
realistically ~300. You can find 300 businesses by hand, on your phone, in
about two hours a month.

**Which means every sourcing option in this list — OSM, SERP, Apify, Business
Discovery, all of it — is competing to save you ~2 hours a month.** That is the
entire prize. Meanwhile the conversion side is unbounded: at a 3% reply rate,
300 DMs gets you 9 conversations; at 15%, it gets you 45. Nothing on the
sourcing side can produce a 5× like that, because the input is already
abundant and the output is hard-capped.

I built a research document that optimises the abundant input. That's the
biggest thing wrong with it.

(For calibration: cold *email* averages ~3.1% reply in 2026, top performers
8–12%. The widely quoted 50–60% Instagram DM reply rates come from DM-tool
vendors and describe *warm* audiences — followers who already engage — not
cold outreach. DMs do beat email, but not by that margin, and not cold.)

---

## The better plan

Same effort, aimed at the half of the funnel that isn't capped.

### A. Replace OSM with Google Places Text Search (New) — the sourcing fix

This is the option my own SKU error made look worse than it is, and it is
strictly better than OSM for anywhere OSM is thin:

- **Coverage where OSM has none.** Google Maps' India coverage is excellent;
  OSM's Instagram tagging there is 926 objects. This is the difference between
  a dead feature and a working one.
- **1,000 free Enterprise-mask calls/month — and your DM ceiling is ~300/month.**
  The quota I mis-stated is still 3× more than you can physically use.
- **`websiteUri` is the qualifier, and its *value* is a second one.** Empty →
  no website. But when a small business fills its Google profile's website
  field with `instagram.com/<handle>`, `linktr.ee/…` or a Facebook page — which
  is extremely common — you get *both* the disqualification of a real website
  **and the Instagram handle you wanted, from an official API, in one call.*
  That is the thing the entire research doc was trying to reach by four
  indirect routes.
- Official, paid-tier, terms-clean. No scraping question at all.

**Test it before building** (this is the OSM mistake, not repeated): one Text
Search call for your city, `X-Goog-FieldMask` including `places.websiteUri`,
and count how many of 20 results have an empty or social-link website. That
number decides the feature.

### B. Google PageSpeed Insights API — the conversion fix, and the best free thing here

**25,000 requests/day, free, no billing account, no credit card.** Returns full
Lighthouse data for any public URL.

This changes what you're selling. Right now the pitch to a no-website business
is an opinion — "you should have a website" — which is trivially deflected
("we're fine, we get orders on DM"). But for every lead that *does* have a
site, PSI hands you a fact:

> "Your site scores 31/100 on mobile and takes 8.4 seconds to load on 4G.
> Most people leave before it renders. Here's what it should look like: <link>"

That is specific, verifiable, uncomfortable, and impossible to answer with
"we're fine." It also **widens your ICP** — businesses with a bad website are
far more numerous than businesses with none, and they've already proven they'll
pay for one. And it's a scoring input the CRM can compute automatically:
`Lead.score` from the Lighthouse performance number, `Lead.problem` written
from the actual failing metrics.

If you build one thing from either document, build this.

### C. Prototype-first, not pitch-first

Your own requirements draft already gestures at this with `prototypeUrl`. Make
it the centre rather than an attachment. At 10–20 DMs/day you have **20+
minutes of budget per lead** — enough to generate a real single-page mockup
from their own Instagram photos and bio and host it, before you ever message
them.

The message then isn't a pitch, it's a delivery: *"I built your homepage. It's
live here, free, keep it or bin it."* Nobody deflects that with "we're fine,"
and it survives the DM medium, where long persuasive text dies.

### D. Point the CRM at the capped stage

Follow-through: the app currently counts leads. Leads are the abundant
resource. It should count and enforce the scarce one —

- a **daily DM budget** with a hard visible cap (start at 10, ramp weekly),
- pipeline stages that are **prototype built → sent → link opened → replied**,
- reply-rate per pitch variant, so you can tell which framing works,
- and per-lead PSI score + the failing metric, computed on import.

That's a different build order from either document's, and it's aimed at the
half of the funnel that can actually move.

---

## Revised build order

| Phase | Build | Why |
|---|---|---|
| 0 | Paste-and-parse bulk intake (survives review unchanged) | Cheapest thing here; ~300 leads/month is easy to source by hand and this makes it fast |
| 1 | **PageSpeed Insights enrichment** on every lead with a website | Free, unlimited in practice, turns opinion into evidence, auto-scores leads |
| 2 | Prototype-first outreach: `prototypeUrl`, copy-draft + `ig.me` queue, daily DM cap | Aims at the capped stage |
| 3 | **Google Places Text Search** discovery tab — *after* the 20-result field test | Replaces OSM; works where OSM doesn't; often hands you the handle |
| 4 | Reply-rate tracking per pitch variant | The only metric that can 5× |
| 5 | Everything else (SERP, Business Discovery, Apify, OSM if you're in Europe) | Saves ≤2 hours/month; do it last or never |

Note also that the existing `Discover.tsx` / JobDataLake integration serves a
*different* ICP — contract roles at companies large enough to run an ATS — so
it's a UI pattern to copy, not a business model to extend.

---

## Sources

- OSM regional coverage — [taginfo India `contact:instagram`](https://taginfo.geofabrik.de/asia:india/keys/contact%3Ainstagram) · [taginfo Germany](https://taginfo.geofabrik.de/europe:germany/keys/contact%3Ainstagram) · [taginfo US](https://taginfo.geofabrik.de/north-america:us/keys/contact%3Ainstagram) · [global taginfo](https://taginfo.openstreetmap.org/keys/contact%3Ainstagram)
- Meta v. Bright Data dismissal — [Bright Data: Meta dismisses claim](https://brightdata.com/blog/general/meta-dismisses-claim-against-bright-data) · [Eric Goldman's Technology & Marketing Law Blog](https://blog.ericgoldman.org/archives/2024/01/game-on-bright-data-scores-major-victory-in-web-scraping-dispute-with-meta-guest-blog-post.htm) · [Farella Braun + Martel](https://www.fbm.com/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/)
- Places field tiers — [Place Details (New)](https://developers.google.com/maps/documentation/places/web-service/place-details) · [Place Data Fields (New)](https://developers.google.com/maps/documentation/places/web-service/data-fields) · [Places usage and billing](https://developers.google.com/maps/documentation/places/web-service/usage-and-billing)
- PageSpeed Insights quota — [PSI API limits thread](https://groups.google.com/g/pagespeed-insights-discuss/c/dB7hWmGAGsw) · [Unlighthouse PSI API guide](https://unlighthouse.dev/learn-lighthouse/pagespeed-insights-api)
- Meta Ad Library scope — [Ad Library API limitations](https://adlibrary.com/posts/meta-ad-library-api-limitations) · [Ad Library free API 2026](https://adlibrary.com/posts/meta-ad-library-free-api-2026)
- Instagram DM limits — [Instagram DM limits 2026](https://flowgent.ai/blog/instagram-dm-limits-how-many-messages-you-can-send-daily) · [safe numbers to avoid bans](https://www.usewave.co/blog/instagram-dm-limits) · [Metricool: Instagram limits](https://metricool.com/instagram-limits/)
- Reply-rate benchmarks — [Cleanlist: 3.1% cold email response rate](https://www.cleanlist.ai/blog/2026-02-18-cold-email-response-rate-statistics) · [Instantly 2026 benchmark report](https://instantly.ai/cold-email-benchmark-report-2026) · [cold DM benchmarks *(vendor-sourced, warm audiences)*](https://xautodm.com/blog/cold-dm-benchmarks-reply-rates-that-are-actually-good-2026)
- Google Custom Search closure — [Custom Search JSON API overview](https://developers.google.com/custom-search/v1/overview)
