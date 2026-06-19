# Metric: Decision Distribution

**Slug:** decision-distribution
**Cadence:** sprint
**Decision this informs:** Whether the workflow converges too fast or slow. >80% PROCEED = Critique-Revise / Red-Team are theater. >40% REVISE = SDD shaping is under-loaded.

## What it measures

The shape of the Coordinator's synthesis output across shipped slugs in a sprint, bucketed PROCEED / DE-RISK / REVISE / KILL. A healthy workflow produces a non-degenerate distribution: most proceed, some need de-risking, some need rework, a few die.

## Computation

For each shipped slug, read the Coordinator's final synthesis decision from `<slug>/history.md`. Count by bucket. Report as percentages and absolute counts.

## Healthy range

- **Healthy:** 50-75% PROCEED, 10-25% DE-RISK, 10-25% REVISE, 2-10% KILL.
- **Concerning (too fast):** >80% PROCEED. Likely rubber-stamping. Audit a sample.
- **Concerning (too slow):** >40% REVISE. Briefs under-baked; load more into shaping.
- **Substrate broken:** 0% KILL across a quarter. No idea is bad enough to die. Workflow has lost its rejection muscle.

## Failure modes

- **Bucket gaming** — avoid REVISE to hit a target; everything becomes DE-RISK. Watch DE-RISK for sudden inflation.
- **Selection bias** — only ideas the Owner already believes in reach the workflow. Cross-check volume that never enters.
- **Definition drift** — "PROCEED with conditions" coded as PROCEED. Hold the bucket boundaries.

## Provenance

- Defined: 2026-06-14
