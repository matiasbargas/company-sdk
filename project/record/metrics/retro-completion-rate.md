# Metric: Retro Completion Rate

**Slug:** retro-completion-rate
**Cadence:** quarterly
**Decision this informs:** Whether the team pays the retro tax or skips it. A workflow that ships without retroing repeats its own mistakes with confidence.

## What it measures

For each cadence (loop / daily / sprint / quarterly), the fraction of shipped slugs with a matching retro artifact. A slug shipped without its retro is one whose lessons did not enter substrate memory.

## Computation

Per cadence, across the quarter:

- **denominator** — shipped slugs eligible for this cadence's retro (e.g., for `sprint`, every slug shipped during a sprint that closed).
- **numerator** — slugs with a retro entry in `strategy-log.md` or the cadence-specific retro file.
- **rate** — numerator / denominator.

## Healthy range

- **Healthy:** Sprint >85%. Quarterly 100%. Loop >70%.
- **Concerning:** Sprint <70% or quarterly <100%. Shipping faster than learning.
- **Substrate broken:** Quarterly skipped, or sprint <50%. Output without metabolization. New mistakes indistinguishable from old.

## Failure modes

- **Retro theater** — file exists but says nothing actionable. Pair with `signal-to-action-rate`; high completion + low action = paperwork.
- **Cadence gaming** — slugs reclassified into weaker-retro cadences. Lock cadence at slug creation.
- **Owner override** — Owner waves through missing retros under deadline. Log every waiver.

## Provenance

- Defined: 2026-06-14
