# Metric: Time-to-Shaped-Brief

**Slug:** time-to-shaped-brief
**Cadence:** daily
**Decision this informs:** Whether the substrate is fast enough to be used. If shaping takes longer than the Owner's patience window, the substrate gets bypassed — an un-shaped brief enters, defeating the point.

## What it measures

Wall-clock from workflow launch ("Hey Greg, [brief]" or `/ask` with implementation scope) to the Coordinator's shaped brief being ready. Includes Discovery, Phase 1, synthesis.

## Computation

From timestamps in `<slug>/history.md`:

- **t_start** — first entry recording launch.
- **t_end** — Coordinator synthesis entry producing the shaped brief.

Report `t_end - t_start` per slug, plus daily median and 90th percentile across slugs that crossed this boundary that day.

## Healthy range

- **Healthy:** Median <45 min active wall-clock. 90th percentile <2 hours.
- **Concerning:** Median 45-90 min. On edge of being skipped under time pressure.
- **Substrate broken:** Median >90 min, or Owner bypassed at least once in the last week because "it would take too long." Substrate has lost its right to be used.

## Failure modes

- **Idle-time confound** — wall-clock includes Owner walking away. Subtract gaps >15 min.
- **Speed at cost of depth** — skip clarifying to hit target. Pair with `decision-distribution` REVISE.
- **Selection bias** — only easy briefs reach the workflow. Track briefs that never enter.

## Provenance

- Defined: 2026-06-14
