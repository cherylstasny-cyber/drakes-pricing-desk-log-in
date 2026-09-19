# MLS / data-source abstraction and rights

Status: open legal/business questions below are **not resolved by this
document** — they need owner/broker/legal sign-off before any real MLS
feed is connected. Nothing in the current codebase assumes an answer;
`ListingSource` (see `lib/design-scout/listing-adapter.ts`) is built
so a real MLS-backed implementation slots in without touching callers.

## Why this exists

The product spec is explicit: "Do not assume Coming Soon or all listing
imagery can be used without authorization." Every listing source has its
own rules about what statuses it exposes, what photo-use rights come with
a feed, and how long historical data can be retained. Those rules vary by
MLS, by market, and sometimes by individual listing broker remarks
("no AI/no third-party use" clauses do exist in some MLS RETS/RESO
feeds). This document is where those answers get recorded once known.

## Required per data source (to fill in before connecting one)

| Question | Answer for [MLS/provider name] |
|---|---|
| Which statuses does this source expose to us? (Coming Soon / New / Active / Pending / Sold / Withdrawn / Expired) | _TBD_ |
| Is Coming Soon data licensed for third-party/AI use, or internal-display only? | _TBD_ |
| Are listing photos licensed for automated (AI) analysis, or display-only? | _TBD_ |
| Does the feed agreement require attribution, watermark removal restrictions, or retention limits on photos? | _TBD_ |
| How far back can historical/off-market listing data be retained and reused? | _TBD_ |
| Refresh cadence: polling interval or webhook/push availability? | _TBD_ |
| Rate limits / cost per call or per photo processed? | _TBD_ |
| Any brokerage-level opt-out or "no AI use" remarks we must honor per-listing? | _TBD_ |

## What v1 uses instead

`SyntheticListingSource` (in `lib/design-scout/listing-adapter.ts`)
returns two fixed, clearly-fictional test listings — including the
product spec's own Susan/Willow Bend scenario — so the full pipeline
(ingest → analyze → store → match → alert) can be demonstrated end-to-end
without touching any real feed or real photos. `KeywordTraitExtractor`
only reads listing *remarks* and photo *captions* (text), not actual
photo pixels, so there is no image-rights question in v1 at all.

## What changes when a real MLS feed is confirmed

1. Fill in the table above per source.
2. Implement a new class satisfying `ListingSource` (e.g.
   `RESOListingSource`) that calls the real feed and maps its statuses to
   `ListingRaw['status']`.
2. If photo pixel analysis is authorized, implement a new `TraitExtractor`
   that calls a vision model on photo URLs — a vendor decision (see
   `ARCHITECTURE.md`'s adapter table) that hasn't been made yet.
3. Respect any per-listing "no AI use" flag the feed surfaces by skipping
   trait extraction for that listing (store the property record with
   status only, no traits).
4. Re-run the adversarial test cases in `STATUS_REPORT.md` against real
   data before removing the "beta" labeling anywhere real clients see it.

## Explicitly out of scope for this vertical slice

- Any actual connection to a live MLS/RESO feed.
- Any processing of real listing photos.
- Any retention-period or licensing decision — those are business/legal
  calls, not engineering defaults.
