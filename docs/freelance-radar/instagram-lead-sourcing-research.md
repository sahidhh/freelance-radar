# Instagram Lead Sourcing — Options Research

Status: **research only, no code written.** Companion to
`instagram-outreach-requirements.md`, which assumed lead intake would be
100% manual. This document revisits that assumption and lays out the
sourcing options that are actually available, ranked by risk.

Researched 2026-08-27.

---

## TL;DR

1. **Stop trying to query Instagram.** Instagram is a terrible database and a
   hostile one. Query the places that *already record a business's Instagram
   handle* — OpenStreetMap, link-in-bio pages, and Google's index of public
   profile pages — and you get the same handles with none of the exposure.
2. **The single best free source is OpenStreetMap via Overpass.** It is
   keyless, CORS-enabled, free, and it can express our exact ICP in one query:
   *"businesses in this city that have an Instagram handle and no website."*
   ~288k objects worldwide carry `contact:instagram`; ~122k of those are
   `shop`, ~130k `amenity`. See [Option 1](#option-1--openstreetmap--overpass-recommended-first-build).
3. **The highest value-per-line-of-code is a paste box.** You already do the
   finding by eye. A textarea that regex-extracts handles from pasted search
   results / profile lists, dedupes against existing leads, and bulk-creates
   them turns 20 minutes of copy-paste into 10 seconds, with zero network
   calls and zero third-party dependency. See [Option 2](#option-2--paste-and-parse-bulk-intake-lowest-effort-highest-certainty).
4. **Meta's own Business Discovery API is the legitimate enrichment path** —
   free, official, and it returns `biography`, `website`, `followers_count`
   for any *professional* account. An empty `website` field is a
   machine-checkable "needs a website" flag. It cannot search, only look up,
   so it complements 1–3 rather than replacing them. See [Option 5](#option-5--meta-business-discovery-api-official-enrichment).
5. **Don't log in.** Every genuinely dangerous option in this list is
   dangerous for the same one reason: it authenticates as you.

---

## Correction to the previous draft

`instagram-outreach-requirements.md` states that Meta's terms "prohibit
automated data collection from the platform," full stop. That is too broad,
and the distinction matters for how we design this.

In **Meta Platforms v. Bright Data** (N.D. Cal., 23 Jan 2024) Judge Edward
Chen granted summary judgment against Meta, holding that the Facebook and
Instagram terms "only prohibit logged-in scraping, and not logged-off
scraping" — Meta's terms bind account holders acting as account holders, and
Meta removed the language binding mere visitors back in 2009. It builds on
the same judge's *hiQ v. LinkedIn* reasoning on the CFAA.

What that does and does not mean for us:

| | Logged-out | Logged-in (session cookie / app login) |
|---|---|---|
| Breach of Meta's terms | Held **not** a breach (Bright Data) | Clear breach |
| Account risk | None (no account involved) | Ban / permanent disable |
| Technical viability | **Poor** — Instagram serves logged-out clients almost nothing and rate-limits within minutes | Good, until it isn't |
| Other legal exposure | Copyright on media, DMCA §1201 if you defeat a technical barrier, GDPR / India DPDP on personal data, and Meta can still IP-block you | All of the above, plus the contract claim |

So the rule for this project is not "never touch public data." It is:

> **Never authenticate. Never use a session cookie. Never store scraped
> photos or captions. Store the handle, the bio text, and the public business
> facts you need to write a pitch — nothing else.**

That is a narrower and more defensible line than the blanket ban, and it is
the line every option below is measured against.

---

## Options at a glance

| # | Approach | Gets you | Cost | ToS/legal risk | Build effort |
|---|---|---|---|---|---|
| 1 | OpenStreetMap / Overpass | handle + name + address + phone + category + **no-website flag** | Free, no key | **None** | Small — clones the existing Discover page |
| 2 | Paste-and-parse intake | handles from anything you can select with a mouse | Free | **None** | Tiny — no network at all |
| 3 | Link-in-bio & directory pages via search | handle + phone + "no real website" signal | Free | **None** (ordinary web pages) | Small, needs Option 4's plumbing |
| 4 | SERP API over `site:instagram.com` | handle + Google's bio snippet | Free tiers, all small | Low — you query Google, not Instagram | Medium — needs a serverless proxy |
| 5 | Meta Business Discovery API | bio, website, follower count, media count | Free | **None** — it's the sanctioned API | Medium build, **60+ day** app review |
| 6 | Free third-party bio-search sites (manual) | handle lists filtered by bio keyword + location | Free tiers | Low for you, they carry it | Zero — feed results into Option 2 |
| 7 | Apify Instagram actors | anything, at volume | $5/mo free credits ≈ 1,850–3,300 results | Moderate, mostly **borne by Apify** | Small |
| 8 | Instaloader / instagrapi in-house | anything, at volume | Free | **High** — ban + contract exposure | Medium |
| 9 | Unofficial mirror sites (picuki-style) | flaky | Free | Moderate | Wasted |

---

## Option 1 — OpenStreetMap / Overpass (recommended first build)

OSM contributors tag businesses with `contact:instagram`. As of 2026-08-27,
per taginfo:

- `contact:instagram` — **288,496** objects (249,279 nodes, 37,545 ways, 1,672 relations)
- bare `instagram` key — 6,556 more
- Top co-occurring keys: `name` 277,451 · `opening_hours` 214,405 ·
  `contact:facebook` 209,391 · `addr:street` 140,636 · `amenity` 129,983 ·
  `contact:website` 128,445 · `shop` 122,258 · `contact:phone` 118,916 ·
  `website` 109,189

Read the last two lines together: a large fraction of the businesses that
publish an Instagram handle in OSM have **no `website` tag at all**. That is
our ICP, pre-filtered, in a free public database, and Overpass QL can ask for
it directly:

```overpassql
[out:json][timeout:90];
area["name"="Bengaluru"]["boundary"="administrative"]->.searchArea;
(
  nwr["contact:instagram"]["shop"]        [!"website"][!"contact:website"](area.searchArea);
  nwr["contact:instagram"]["amenity"]     [!"website"][!"contact:website"](area.searchArea);
  nwr["contact:instagram"]["craft"]       [!"website"][!"contact:website"](area.searchArea);
  nwr["contact:instagram"]["office"]      [!"website"][!"contact:website"](area.searchArea);
  nwr["contact:instagram"]["leisure"]     [!"website"][!"contact:website"](area.searchArea);
  nwr["contact:instagram"]["tourism"]     [!"website"][!"contact:website"](area.searchArea);
);
out tags center 500;
```

Endpoint: `POST https://overpass-api.de/api/interpreter`, body
`data=<query>`. Drop the `[!"website"]` clauses to see the whole Instagram
population for a city, then tighten.

Why this fits us specifically:

- **Keyless and CORS-enabled.** Overpass emits the CORS headers and handles
  `OPTIONS` precisely so browser JS can call it, so this works from the SPA as
  it stands today — no Vercel function, no secret to leak. (Mirrors vary; use
  the main instance and fall back to `overpass.kumi.systems`.)
- **Every field we need is already there:** `name`, `contact:instagram`,
  `contact:phone`, `addr:*`, `opening_hours`, and the `shop`/`amenity` value
  maps straight onto `Lead.industry`.
- **It clones a page we've already built.** `Discover.tsx` is
  search-params → results list → *Add lead* → `createLead`, with
  `jobToLeadDraft()` doing the mapping. An `osmToLeadDraft()` beside
  `jobToLeadDraft()` and a second tab on Discover is the whole feature.
- The absent `website` tag pre-fills `Lead.problem` ("no website — Instagram
  is the only storefront") and justifies the score, automatically.

Honest limits:

- **Coverage is uneven and skews Europe.** Bengaluru/Kochi/Chennai will be far
  thinner than Berlin. Run the query for your actual target city in
  <https://overpass-turbo.eu/> before anyone writes code — that is a
  five-minute test and it decides whether this option is worth building.
  *(I could not run it from this sandbox: outbound network here is restricted
  to an allowlist and every Overpass mirror was unreachable. The tag counts
  above are from taginfo and are real; the per-city yield is unverified.)*
- Absent `website` in OSM means "nobody tagged one," not always "there is
  none." Treat it as a strong lead signal, confirm before pitching.
- Overpass load-sheds aggressively. Cache results; don't re-query on keystroke.

---

## Option 2 — Paste-and-parse bulk intake (lowest effort, highest certainty)

The bottleneck today isn't finding accounts — you can find fifty in a few
minutes of scrolling. It's the thirty seconds × fifty of retyping them into a
form. Remove that and everything else gets cheaper too, because every other
option on this list can dump its output into the same box.

The feature: one textarea, "paste anything." On submit:

1. Regex out every `instagram.com/<handle>` and bare `@handle`
   (strip `/p/`, `/reel/`, `/explore/`, `/stories/` path segments).
2. Dedupe within the paste, then against existing leads by handle.
3. Show a checkbox table — handle, guessed business name, already-in-CRM
   badge — and bulk-create the checked rows as `source: "Instagram"`,
   `status: "NEW"`, `sourceUrl: https://instagram.com/<handle>`.

It works on a copied Google results page, a copied IG "Suggested for you"
column, a hashtag page, a spreadsheet column, a WhatsApp forward, a
screenshot's OCR text. No API, no key, no CORS, no ToS surface — you are
parsing your own clipboard. It's maybe 150 lines including the table, and
it's the piece I'd build first regardless of which sourcing option wins.

---

## Option 3 — Link-in-bio and directory pages

Small businesses with no website very often have a **Linktree / Beacons /
Carrd / Bio.link page** instead, and those are ordinary indexed web pages with
no anti-scraping posture. They usually bundle exactly what you want on one
page: Instagram handle, WhatsApp number, sometimes an email, and the
self-evident fact that they never built a real site.

Query them by search (Option 4) or by hand:

```
site:linktr.ee ("bakery" OR "cafe" OR "salon") "Bengaluru"
site:beacons.ai "order on instagram" "Chennai"
site:bio.link "DM to order"
```

Same idea for local directory sites (JustDial, Sulekha, Zomato listings,
Yelp) — many list a business's Instagram alongside its phone. These are
normal websites; fetching a page you were shown in search results is not a
platform-terms problem.

---

## Option 4 — SERP API over `site:instagram.com`

This is the "when I google I get accounts, let's fetch those" idea, and it
does work: Google indexes public Instagram profile pages, and each result
gives you the handle in the URL plus a chunk of the bio in the snippet —
enough to filter on before you ever open the profile.

**Query recipes** (the operators matter more than the vendor):

```
site:instagram.com -inurl:/p/ -inurl:/reel/ -inurl:/explore/ "Bengaluru" ("cafe" OR "bakery")
site:instagram.com "DM to order" "Kochi"
site:instagram.com "Indiranagar" "salon" -inurl:/p/
```

`-inurl:/p/ -inurl:/reel/` is what turns a post firehose into a profile list.
`"DM to order"`, `"WhatsApp to order"`, `"orders on DM"` are excellent
no-website signals — a business with a real site doesn't write that.

**Vendor reality check, verified 2026-08-27:**

- **Google Custom Search JSON API — do not build on this.** Google's own docs
  now say "The Custom Search JSON API is closed to new customers," with
  existing customers cut off **1 January 2027**. The famous 100 free
  queries/day is no longer available to us.
- **Brave Search API** — the free tier was discontinued; new accounts get ~$5
  of monthly credits (≈1,000 queries) on metered billing with a card on file.
- **Serper.dev** — 2,500 free credits, **one-time**, no card. Then $50/50k.
  Best "prove it works this week" option.
- **SearXNG, self-hosted** — free, keyless, unlimited, aggregates ~70 engines,
  and has a JSON output mode. Two gotchas: `json` is not in `search.formats`
  by default, and the rate limiter blocks automated calls until you disable it
  / set `X-Forwarded-For`. This is the right long-term choice if this option
  earns its keep.
- **DDGS** (the former `duckduckgo_search` Python lib) — free and keyless, but
  it *is* a scraper of DuckDuckGo, so it inherits that fragility.

**Architecture note:** every one of these needs an API key or a server, and
this app is a pure client-side SPA — a key in the bundle is a public key. So
Option 4 is the first feature that requires a Vercel serverless function
(`/api/serp`) holding the secret. That's the real cost of this option, not
the vendor price.

---

## Option 5 — Meta Business Discovery API (official enrichment)

The sanctioned way to read another account's public profile programmatically:

```
GET /v21.0/{your-ig-user-id}
  ?fields=business_discovery.username(TARGET_HANDLE){
      username,name,biography,website,followers_count,media_count,
      profile_picture_url,media{caption,media_url,permalink,timestamp}}
  &access_token={token}
```

- Returns **`website`** — empty means no website, which is our qualifier,
  checked by machine instead of by eye.
- Returns `biography` (pitch material), `followers_count` (scoring),
  `media_count` and recent `media` (are they still active?).
- Works only against **professional** (Business/Creator) accounts. That's not
  much of a limit here: our ICP is exactly the small business that switched to
  a Business account.
- Rate limit ≈ 200 calls/hour per connected IG account.

Cost of entry, and it's the real cost: you need your own Instagram
**Professional** account, a linked Facebook Page, a Meta app, and **App
Review** — reported at 60+ days. Note also that Instagram Basic Display was
shut down permanently on 4 Dec 2024, so this and the Instagram-Login API are
what remain; personal accounts are unreachable by any official API.

It **cannot search.** You must already know the username. So it is the
qualifier stage after 1/2/3/4, not a source. Start the app review in
parallel with building the earlier options, so it's approved by the time
there's a queue to enrich.

---

## Option 6 — Third-party bio-search sites (manual, zero build)

Several services index Instagram bios and let you filter by keyword +
location + follower range on a free tier, in a browser, with no code:
influencers.club's bio search, IQFluence, Hive Influence (claims 380M+
profiles), Inflact, Toolzu, inBeat, Boostfluence.

Use them as a **hand tool feeding Option 2's paste box.** They are themselves
scrapers, so treat them the way you'd treat any free tool: assume the free
tier shrinks, assume the site may disappear, don't wire them into a build,
and don't hand them anything of yours. Zero engineering cost, immediate
value, no durability.

---

## Option 7 — Apify (the pragmatic escape hatch)

Apify's Instagram actors are the honest answer to "what if OSM has nothing in
my city and SERP snippets aren't enough." Free plan: **$5/month** in platform
credits (resets monthly, no rollover); the official Instagram Scraper runs
~$1.50 per 1,000 results, so roughly **1,850–3,300 results/month free** —
which for cold outreach at a sustainable DM rate is plenty.

The relevant point isn't the price. It's that **the scraping exposure sits
with Apify's actor and Apify's infrastructure**, not with your Instagram
account or your IP. That is a materially better risk position than Option 8,
for the same output. If you go here: pull profile metadata only, not media,
and keep the same storage discipline (handle, bio, public business facts).

---

## Option 8 — Self-hosted scrapers (not recommended)

- **Instaloader** — genuinely maintained (13.1k stars, v4.15.3, commits as
  recent as Jul 2026) and the best of the bunch. But logged-out it now
  retrieves very little and gets rate-limited within minutes; the way people
  make it useful is by feeding it their session cookie, which is squarely the
  logged-in case above: ToS breach plus account ban.
- **instagrapi / instagram-private-api / Osintgram** — wrap Instagram's
  private mobile API. Most capable by far, and the maintainers themselves
  describe private-API automation as fragile in production. Requires login by
  design, so there is no safe configuration.
- **`?__a=1&__d=dis`** — the old public JSON endpoint. Login-walled, treat as
  gone.

If you want scraped volume, Option 7 buys the same thing without putting your
own account on the line.

---

## Option 9 — Mirror sites (skip)

picuki/imginn-style proxies break constantly, carry no API contract, and are
themselves in Meta's crosshairs. Nothing to build on.

---

## A constraint that shapes the queue: you cannot prefill an Instagram DM

Worth deciding before the send-queue screen gets designed.

- `https://ig.me/m/<handle>` is Meta's official click-to-Direct deep link and
  opens a DM thread with that account. Meta says it's unsupported on web,
  though it does generally work there.
- **There is no supported way to prefill the message body.** A `?text=` param
  is passed around informally; it is not documented and shouldn't be relied on.

So the IG send flow is two buttons, not one:

> **[Copy draft]** → **[Open DM]** → paste → send → **[Mark as Sent]**

which is the same shape as the existing Gmail flow, just with an explicit
copy step. `Lead.email` empty + `Lead.instagramHandle` present should switch
the queue's action row from *Open Gmail* to *Copy + Open DM*.

Also: Instagram's spam heuristics are stricter than any inbox's. Cold DMs
from a young account to non-followers get action-blocked quickly. Practical
pacing — a warmed-up account, a couple dozen cold DMs a day, first line
genuinely specific to their profile — matters more here than any of the
sourcing above. The "leads per session" counter in the requirements draft is
the right instinct; for DMs it's closer to a real constraint than a nudge.

---

## Suggested build order

| Phase | Build | Unlocks |
|---|---|---|
| 0 | `Lead.instagramHandle`, `Lead.prototypeUrl`, `hasWebsite` derived flag | Everything else has somewhere to land |
| 1 | **Option 2** paste-and-parse bulk intake | Immediate 10× on manual sourcing; becomes the sink for every later option |
| 2 | **Option 1** Overpass tab on `Discover.tsx` (`osmToLeadDraft()`) | Free, keyless, auto-qualified "no website" leads. *Gated on the overpass-turbo yield test for your city.* |
| 3 | DM-aware outreach queue (copy + `ig.me`) + prototype-pitch template | Actually sending |
| 4 | Start Meta App Review for **Option 5** *(begin during phase 1 — the wait is the cost)* | Machine-checked `website`-empty qualification, follower scoring |
| 5 | `/api/serp` Vercel function + **Option 4/3** queries | Reach beyond OSM's coverage |
| 6 | **Option 7** only if 2/4 don't fill the pipeline | Volume, with the risk outsourced |

The one thing to do before any of it: paste the Overpass query above into
<https://overpass-turbo.eu/> for your actual target city. If it returns 200
businesses, phase 2 is the best-value feature in this document. If it returns
6, skip to phase 5 and don't look back.

---

## Sources

- Meta v. Bright Data — [Farella Braun + Martel analysis](https://www.fbm.com/publications/major-decision-affects-law-of-scraping-and-online-data-collection-meta-platforms-v-bright-data/) · [Quinn Emanuel client alert](https://www.quinnemanuel.com/media/n23fedyh/client-alert_-meta-v-bright-data-significant-decision-for-web-scraping-industry.pdf) · [Courthouse News](https://www.courthousenews.com/federal-judge-rules-against-meta-in-data-scraping-case/)
- OSM tag counts — [taginfo `contact:instagram`](https://taginfo.openstreetmap.org/keys/contact%3Ainstagram) · [Overpass API wiki](https://wiki.openstreetmap.org/wiki/Overpass_API) · [Overpass by example](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example) · [overpass turbo](https://overpass-turbo.eu/)
- Google CSE closure — [Custom Search JSON API overview](https://developers.google.com/custom-search/v1/overview)
- Search API tiers — [Brave free tier discontinued](https://www.implicator.ai/brave-drops-free-search-api-tier-puts-all-developers-on-metered-billing/) · [Serper free credits](https://costbench.com/software/web-scraping/serper/free-plan/) · [SearXNG as a self-hosted SERP API](https://apiserpent.com/blog/searxng-self-hosted-serp-api-tested)
- Instagram official APIs — [Business Discovery capabilities](https://www.keyapi.ai/blog/instagram-business-discovery-api/) · [rate limits](https://www.keyapi.ai/blog/instagram-api-follower-count/) · [Basic Display shutdown](https://www.keyapi.ai/blog/instagram-basic-display-api/) · [which API to use](https://www.keyapi.ai/blog/which-instagram-api-should-you-use/)
- Open-source scrapers — [Scrapfly: best open-source Instagram scrapers](https://scrapfly.io/blog/posts/best-open-source-instagram-scrapers) · [How to scrape Instagram in 2026](https://scrapfly.io/blog/posts/how-to-scrape-instagram)
- Apify — [Instagram Scraper actor](https://apify.com/apify/instagram-scraper) · [free plan credits](https://use-apify.com/docs/what-is-apify/apify-free-plan)
- Bio-search tools — [influencers.club](https://influencers.club/instagram-bio-search/) · [Hive Influence](https://hiveinfluence.io/blog/find-influencers-by-bio-keyword/) · [Inflact](https://inflact.com/tools/instagram-search/)
- DM links — [respond.io ig.me guide](https://respond.io/blog/instagram-direct-message-link) · [CreatorFlow ig.me guide](https://creatorflow.so/blog/ig-me-link-guide/)
- Google Places pricing (Option 3 context) — [Woosmap 2026 breakdown](https://www.woosmap.com/blog/google-places-api-pricing)
