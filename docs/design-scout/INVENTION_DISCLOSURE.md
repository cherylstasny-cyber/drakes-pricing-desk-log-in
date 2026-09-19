# Internal invention disclosure — Design Scout

Prepared 2026-09-19. Internal working draft for patent counsel review —
not a public document. Do not publish scoring weights, thresholds, or
implementation internals from this document anywhere public-facing (this
file itself should stay out of the public site/marketing content).

## 1. Overall system architecture

A shared Property Intelligence Layer analyzes each real-estate listing
exactly once, deriving structured, evidence-backed traits from structured
listing data, free-text remarks, and (in a future phase) listing photos.
Those traits are persisted per property and compared against any number
of client-specific "watch" profiles, each expressing preferences as
Must/Prefer/Avoid criteria with per-criterion weight and confidence
threshold. A scoring engine produces a match score with an accompanying,
always-present explanation (which criteria matched, which didn't, and
why), which drives buyer and agent notifications and feeds an engagement-
tracking dashboard. The same intelligence layer is designed to also serve
a separate pricing-recommendation system (Drake's Pricing) by exposing
verified/inferred condition and character traits for comp selection and
valuation adjustment — see `ARCHITECTURE.md` for the full diagram.

Reference implementation: `lib/design-scout/` (taxonomy, types,
parser, matching, listing-adapter, notify) plus the Supabase schema in
`supabase/migrations/001_design_scout.sql` and the route handlers
under `app/design-scout/`.

## 2. Property-intelligence taxonomy

A two-level, open-ended taxonomy (Category → Attribute) with ~20
categories and ~230 initial attributes spanning architectural style,
historic/character, exterior materials, kitchen finish/brand, wine and
entertainment amenities, bathroom fixtures, interior aesthetic,
condition/renovation state, natural light, flooring, ceiling/architectural
detail, fireplaces, specialty rooms, primary-suite features, functional
layout, lot/landscaping, outdoor living, pool/spa, and garage/auto
features. Reference data lives in database tables
(`ds_taxonomy_categories`, `ds_taxonomy_attributes`) separate from the
instance data that carries value/confidence/evidence, so the taxonomy can
grow to thousands of attributes without a schema migration — only new
rows. Two structural safeguards are notable for disclosure purposes:
official/confirmed designations (e.g. historic-landmark status) are
modeled as attributes distinct from AI-inferred character judgments, and
brand/named-architect attributes carry a flag requiring corroborating
evidence from multiple source types before being represented as
"confirmed" rather than "likely."

## 3. Image/text/structured-data extraction

A `TraitExtractor` interface accepts a raw listing (structured fields +
remarks + photo references) and returns a list of typed trait records.
The reference (v1) implementation performs keyword/synonym matching
against the taxonomy over remarks and photo captions; the interface is
designed so a later implementation can substitute a vision-model call
over actual photo pixels without changing any caller. Each derived trait
independently tracks which source type (photo, remarks, structured data,
or historical listing data) contributed it, and multiple source types
corroborating the same attribute raise its confidence classification.

## 4. Persistent Property Intelligence Record

Traits are stored once per property (not duplicated per client or per
watch), keyed by a stable property identity, and are compared against
every relevant active watch rather than re-derived per comparison. Each
stored trait carries: property identifier, taxonomy category, attribute,
value, confidence score, source type, a human-readable evidence
reference, the extraction model/version that produced it, and both an
initial-analysis and a last-verified timestamp — enabling re-verification
or model-version auditing over time without losing the original
provenance.

## 5. Confidence and evidence methodology

Every trait carries a confidence score in [0,1] and a textual evidence
reference rather than a bare boolean. Attributes flagged as requiring a
higher evidence bar (brand identifications, named-architect/style
attributions, historic designation) are only classified at the higher
("confirmed") tier when corroborated by more than one source type;
otherwise they are classified at a lower ("likely") tier. This confidence
value is later consumed by the matching engine's confidence-threshold
gate, so a criterion can require not just presence of an attribute but a
minimum confidence in it.

## 6. Natural-language client-preference conversion

Free-text agent input (e.g., a paragraph describing a client's desired
home) is parsed into structured criteria, each assigned a taxonomy
category/attribute, a requirement tier (below), and a confidence score,
with the originating phrase retained as evidence for agent review. The
reference parser is rule-based (synonym matching plus sentence-scoped
requirement-marker detection, so that a single negation like "does not
want X, Y, or Z" correctly propagates across a list rather than only
covering the first item); the parsing step sits behind an interface
allowing a model-based (LLM) implementation to be substituted without
changing the rest of the pipeline. In both cases, the structured
interpretation is always shown back to the agent for review/edit before a
watch is activated — a human-in-the-loop confirmation step that is part
of the disclosed method, not just an implementation nicety.

## 7. Must / Prefer / Avoid framework

Each watch criterion carries a requirement tier — MUST, PREFER, or AVOID
— plus an independent weight and confidence threshold. A property missing
a confidently-evidenced MUST criterion, or confidently matching an AVOID
criterion, is excluded from that watch's results entirely (hard rejection
with the specific triggering criterion recorded — as a MUST failure or an
AVOID match respectively), so a client is never shown a property with a
feature they've explicitly said they dislike, regardless of how well it
otherwise scores. PREFER criteria reward the score proportionally to
(weight × confidence) when matched.

## 8. Geographic monitoring

Each watch is associated with one or more named geography targets (area
label, radius, or polygon representation), against which newly eligible
listings are filtered before trait comparison.

## 9. Event-driven new-listing analysis

New or status-changed listings (Coming Soon, New, Active, reactivated)
trigger the extraction pipeline; listing-status transitions are recorded
as a discrete event history per property, independent of the trait
records, so status changes over time (e.g., relisted, price-reduced,
reactivated) can be reasoned about separately from the property's
physical/design characteristics.

## 10. Match scoring

Described in detail in section 7 above and implemented in
`lib/design-scout/matching.ts`. The scoring function never returns a
bare numeric score — it always returns, alongside the score, the full set
of per-criterion reasons (matched/unmatched, confidence, and each
criterion's contribution to the score), the specific MUST failures (if
any), and the specific missing PREFER criteria, so a consuming interface
or notification can always explain *why* a property scored as it did.

## 11. Client and agent notifications

When a property's score for an active watch clears a per-watch
configurable alert threshold, the system generates a buyer-facing
notification identifying the property, price, a representative photo, the
match percentage, the top contributing matched characteristics, any
materially missing preferred characteristics, and a call-to-action, and
simultaneously generates an agent-facing notice summarizing the same
event. A duplicate-alert suppression method prevents re-notifying the same
client about the same property repeatedly within a cooldown window unless
the score has since improved by a meaningful margin.

## 12. Engagement feedback

Each generated alert is tracked through a status lifecycle (delivered,
opened, clicked, saved, dismissed, showing-requested), and client-level
activity/feedback events are recorded separately from the alert record
itself, allowing engagement to be analyzed independent of the specific
match that generated it.

## 13. Historical listing comparison

The property/listing schema separates current property attributes from a
discrete listing-status-event history, and the source-type taxonomy on
each trait includes a distinct "historical" category — allowing a
property's current intelligence record to be informed by (and to retain
provenance from) prior listing history where the data source's licensing
permits it.

Concretely: each time a listing is checked, the system prefers whatever
photos and remarks came back that pass. When a check returns no new
photos or no new remarks (e.g. an agent hasn't updated the listing since
last checked), the last known content for that field is reused rather
than the record going blank, and any trait derived from reused content is
explicitly retagged as "historical" evidence rather than left looking as
fresh as a trait derived from this pass's own data — so the record is
always honest about what was actually re-verified versus carried
forward. This reuse is a per-property default that an agent can turn off
(e.g. once they know the home has since been renovated and the old
photos are no longer representative), in which case only what a check
actually returns is used, even if that means less evidence than before
until new photos appear.

## 14. Connection between Property Intelligence, Design Scout, and Drake's Pricing

The same persistent trait record that drives Design Scout's matching
is designed to be the input to Drake's Pricing's comparable-selection and
valuation-adjustment logic (condition, renovation quality, premium
appliances, and architectural character as adjustment factors) — see
section 1 and `ARCHITECTURE.md`. This hand-off is defined as an
integration point (a link from a match to the pricing workstation) in
this vertical slice; the deeper data hand-off is future work.

## 15. Alternative implementations considered

- **Per-client re-analysis** (analyzing a listing fresh for every client
  watch) was rejected in favor of the single persistent record described
  in section 4, for both cost and consistency reasons.
- **LLM-first preference parsing** was considered for v1 but deferred in
  favor of a deterministic rule-based parser with an explicit adapter
  seam, so behavior is auditable and testable before any AI vendor
  dependency is introduced; the interface is designed for either
  implementation interchangeably.
- **Penalizing rather than hard-rejecting AVOID matches** was the initial
  v1 design, on the theory that an agent might still want a property
  shown despite one undesired trait if the rest of the match was strong.
  Superseded by explicit product direction: a client who dislikes a
  feature should never be shown a property that has it, full stop — the
  scoring engine now excludes on any confidently-matched AVOID criterion,
  the same as a MUST failure, with the triggering criterion always named
  in the result. Per-criterion softness (e.g. a "strongly dislike" vs.
  "mildly prefer not" distinction) remains a candidate future refinement
  if needed, but isn't built.

## 16. Diagrams

See the sequence diagrams in `ARCHITECTURE.md` (listing-to-alert pipeline,
natural-language watch setup). These are a first-pass Mermaid diagram
set, versioned in Git as requested; a polished diagram package for
external patent counsel review would be produced from these as a
follow-up, not as part of this vertical slice.
