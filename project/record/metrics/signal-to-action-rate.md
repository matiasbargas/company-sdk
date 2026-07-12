# Metric: Signal-to-Action Rate

**Slug:** signal-to-action-rate
**Cadence:** quarterly
**Decision this informs:** Whether the substrate hears itself and acts. <5% = collecting signals it never integrates. >30% = over-reacts; protocol unstable. Both fail.

## What it measures

Of all `improvement_signal` entries surfaced during retros in the quarter, the fraction that became either:

- a concrete delta to a **Layer A** file (a role, the protocol, STRATEGY, a squad), or
- a formal **§15a protocol-change proposal**.

Signals that resulted in neither — even if discussed at length — count against the rate.

## Computation

- **denominator** — total `improvement_signal` entries in `strategy-log.md` and per-slug retro files.
- **numerator** — signals with a traceable downstream artifact: a commit touching a Layer A file referencing the signal, or a §15a proposal referencing it.
- **rate** — numerator / denominator.

## Healthy range

- **Healthy:** 10-25%. Selective; substantive signals drive change.
- **Concerning (hears, doesn't act):** <5%. Signals written and ignored.
- **Concerning (over-reacts):** >30%. Constant rewrites; stability erodes.
- **Substrate broken:** <2% (deaf), or >50% sustained two quarters (no immune system).

## Failure modes

- **Cosmetic action** — one-line edit to count. Sample-audit.
- **Signal compression** — distinct signals merged. Count as written.
- **Lag confound** — Q1 signal drives Q3 change. Carry forward.

## Provenance

- Defined: 2026-06-14
