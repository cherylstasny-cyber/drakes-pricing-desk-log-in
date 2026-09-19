# Design Scout — status report

Branch: `claude/determined-clarke-27d87r` (feature branch; nothing here has
touched `main`/production). Dated 2026-09-19, ahead of the Sunday,
September 20, 2026 target.

## Sunday deliverable checklist

| # | Deliverable | Status |
|---|---|---|
| 1 | Architecture finalized | Done — `ARCHITECTURE.md` |
| 2 | Initial taxonomy in code/data structure | Done — `lib/design-scout/taxonomy.ts` + DB reference tables |
| 3 | Database schema/migrations | Done — `supabase/migrations/001_design_scout.sql` |
| 4 | Client + watch creation flow | Done — `/design-scout/app/clients/new`, `/design-scout/app/watches/new` |
| 5 | Natural-language preference parser | Done (rule-based v1, adapter-swappable) |
| 6 | Must/Prefer/Avoid structure | Done, end to end (parser → DB → matching) |
| 7 | Property Intelligence Record schema | Done — `ds_properties` / `ds_property_traits` |
| 8 | Initial listing-analysis adapter | Done (synthetic/text-only v1) |
| 9 | Matching/scoring engine | Done, real logic, unit-tested |
| 10 | Sample client + agent email notification | Done (content built + logged; **not actually sent** — no email provider configured) |
| 11 | Agent dashboard MVP | Done — watch list, detail, pause/resume/archive/duplicate |
| 12 | Drake's Pricing integration point defined | Done as a link/concept (`ARCHITECTURE.md` §"Relationship to Drake's Pricing"); no shared data hand-off built yet |
| 13 | Subscription-plan page updated in staging | Page built and reads live config (`/pricing`); **no staging environment exists** to deploy it to (see Blockers) |
| 14 | Two about-video scripts | Done — `video-script-pricing.md`, `video-script-design-scout.md` |
| 15 | Landing-page changes staged | Done on this branch; same staging caveat as #13 |
| 16 | Technical/invention-disclosure document | Done — `INVENTION_DISCLOSURE.md` |
| 17 | Patent-counsel diagram package | Partial — Mermaid sequence diagrams in `ARCHITECTURE.md`, versioned in Git; not a polished external-review package |
| 18 | Test suite | Done for unit level (27 tests: taxonomy, parser, matching); integration/adversarial tests are not yet written (see Blockers) |
| 19 | Staging demonstration with sample data | Runnable locally/in this container against a real Supabase project once env vars are set; no hosted staging URL (see Blockers) |
| 20 | Written blockers list | This section, below |

## Files added/changed

26 files, +2,857 / -5 lines, across 8 commits on this branch. Zero
existing Pricing Desk files were altered in behavior — `app/globals.css`,
`app/page.tsx`, and `middleware.ts` are the only pre-existing files
touched, and each change is additive (new CSS rules for previously-dead
classes, one new landing section, one new route added to the existing
protected-route check). Full list: `git diff --stat 5d1026a..HEAD`.

## Database migrations

`supabase/migrations/001_design_scout.sql` — additive only, no
`ALTER`/`DROP` against anything in `schema.sql`. Adds: shared
`product_subscriptions` + `subscription_plans` tables, taxonomy reference
tables, and the full Design Scout schema (clients, watches,
geographies, criteria, properties, listing status events, property
traits, match results, alerts, client activity/feedback), all with RLS
mirroring the existing workspace-member pattern.

**This migration has not been applied to any Supabase project** — it
exists as a file on this branch only. Someone with access to the target
Supabase project needs to run it (`supabase db push` or equivalent) before
any of this is live anywhere.

## Endpoints / routes

Public: `/design-scout`, `/design-scout/about`, `/pricing`, plus
one new section on `/`. Protected (auth-gated via `middleware.ts`):
`/design-scout/app`, `/design-scout/app/clients/new`,
`/design-scout/app/watches/new`, `/design-scout/app/watches/[id]`.
Server actions (not REST endpoints, called directly from the UI):
`enableDesignScoutBeta`, `createClientAction`, `createWatchAction`,
`updateWatchStatusAction`, `duplicateWatchAction`,
`runDemoMatchingAction`, `parsePreferencesAction` — all in
`app/design-scout/app/actions.ts`.

## Tests

`npm test` (vitest) — 27 passing unit tests covering taxonomy
normalization, NL parser MUST/PREFER/AVOID classification (including the
spec's own Susan/Willow Bend example verbatim), confidence gating, and
the matching engine's scoring/threshold/duplicate-suppression logic. Also
verified: `npx tsc --noEmit` and a full `next build`, both clean, after
every commit.

**Not yet written**, per the spec's own testing section: integration
tests (new listing → record → match → email → dashboard → Pricing
hand-off) and the adversarial test set (brand misidentification, missing
photos, duplicate listings, stale listings, false historic-designation
inference). The unit suite exercises the pieces those integration tests
would chain together, but the chained tests themselves don't exist yet.

## Staging URL

**None exists.** This container has no deployed environment; there is no
Vercel/hosting project connected to this repo, and no separate Supabase
project has been provisioned for Design Scout (or confirmed to exist
for Pricing, for that matter — no code path queries a live Supabase
instance in this container). This is the single largest blocker to
"demonstrable" in the literal sense of a shareable URL — see below.

## Unresolved blockers

1. **No staging/hosting environment.** Nothing is deployed anywhere. To
   get a shareable staging URL: provision (or point to) a Supabase
   project, run the migration against it, set
   `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`, and deploy
   the Next.js app (Vercel or similar). None of this was in scope for a
   code-only session — it needs credentials/accounts only the owner has.
2. **No email provider configured.** `NotificationAdapter`'s v1
   implementation logs alert content to the console instead of sending
   it. Choosing and wiring a provider (SES/Postmark/Resend/etc.) is
   needed before "email the buyer, copy the agent" is real.
3. **No AI/vision vendor decision.** Trait extraction only reads text
   (remarks + photo captions) today; there's no photo-pixel analysis.
   `createLLMPreferenceParser()` is an intentionally-throwing stub for the
   same reason on the parsing side.
4. **No confirmed MLS/data-source access or licensing.** See
   `DATA_SOURCE_ABSTRACTION.md` — the whole pipeline runs on two
   synthetic test listings until this is resolved.
5. **Integration and adversarial tests not yet written** (see Tests,
   above).
6. **No admin UI** for editing the taxonomy or subscription plans; both
   are seed/migration-only today.
7. **Existing Pricing Desk pages don't yet link to Design Scout** —
   the workstation/reports nav wasn't touched, since that's an existing
   Pricing file and out of scope without explicit sign-off. A one-line nav
   addition is trivial once approved.
8. **Unresolved: what visual direction to build toward.** Mockups shared
   mid-session (branded wordmark/logo, hero photography, dashboard with
   report cards, PDF export) show a more developed visual system than
   either the live app or what was built here. This work kept the
   existing navy/gold identity per the spec's own instruction not to
   change it without explicit direction — that's a decision still open
   with the owner, not a technical blocker.

## MLS / data dependencies

No MLS or data-provider is connected. Required before production: which
MLS(s)/data source(s), confirmed status coverage (Coming Soon/New/Active/
Reactivated), confirmed photo-use rights for AI analysis, and historical-
listing retention terms. Full checklist in `DATA_SOURCE_ABSTRACTION.md`.

## API / vendor dependencies (none selected yet)

- **Vision/image-analysis model** for real photo trait extraction.
- **LLM provider** if/when the rule-based parser is replaced.
- **Transactional email provider** for buyer/agent alerts.
- **MLS/RESO data feed** (see above).
- **Hosting** (Vercel or equivalent) + a provisioned Supabase project for
  staging/production.

## Estimated operating cost assumptions

Not yet modeled — the spec explicitly says not to implement unlimited
AI/photo analysis until real inference and MLS/data costs are measured,
and no vendor has been selected for either, so there's nothing to cost
yet. Once a vision-model vendor and MLS feed are chosen, cost drivers to
model before removing the beta usage caps in `subscription_plans` would
be: cost per photo analyzed × average photos per listing × listings
ingested per day, cost per NL-parse call (if moved to an LLM), MLS/data
feed fees, and email-send volume.

## What needs owner/legal approval before production

- MLS/data-source licensing terms, especially Coming Soon access and
  photo-use rights for AI analysis (`DATA_SOURCE_ABSTRACTION.md`).
- Any use of a named architect/style claim in marketing copy or the video
  scripts (both scripts flag this explicitly).
- The video scripts themselves — drafts only, not approved for
  production.
- Final subscription pricing/limits (seeded as "proposed beta structure"
  per the spec; editable without a code change once approved).
- The open visual-direction question above.
- Choice of AI/vision vendor and email provider (cost + data-handling
  implications).
- This invention disclosure document, before any external patent-counsel
  submission.
