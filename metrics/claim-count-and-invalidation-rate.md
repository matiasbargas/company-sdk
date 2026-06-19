# Metric: Claim Count and Invalidation Rate

**Slug:** claim-count-and-invalidation-rate
**Cadence:** sprint
**Decision this informs:** Whether Layer B accumulates signal or noise. Growing claims with near-zero invalidation = hoarding. High invalidation with no learning extracted = churn.

## What it measures

Two paired counts:

1. **Claims per shipped slug** — testable claims surfaced during shaping and review.
2. **Invalidation rate** — of prior-sprint claims, % explicitly invalidated, confirmed, or expired (vs. left silently stale).

The pair matters more than either alone. A ledger that only grows is a graveyard.

## Computation

From `<slug>/claims.md` across shipped slugs in the sprint:

- **Claim count** — sum per slug; report mean and distribution.
- **Invalidation rate** — denom: claims 30+ days old. Numer: moved to `invalidated` / `confirmed` / `expired`.

## Healthy range

- **Healthy:** 3-8 claims per slug. Invalidation 20-50% within 90 days.
- **Concerning (hoarding):** <10% invalidation. Ledger is a museum.
- **Concerning (churn):** >70% with no Layer A / strategy deltas. Killed but no learning extracted.
- **Substrate broken:** Claim count trending to zero. Workflow stopped producing testable claims.

## Failure modes

- **Trivial-claim padding** — low-stakes claims to hit count. Score-sample quarterly.
- **Silent expiration** — tooling-marked `expired` counts as invalidation. Separate buckets.
- **Slug-size confound** — big slugs produce more. Normalize, or report distribution.

## Provenance

- Defined: 2026-06-14
