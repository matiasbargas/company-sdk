---
ritual:
  id: signal-harvest
  order: 2
  owner: Coordinator
  cadence: daily
  slot: morning
  runs: "retrospective.js cadence=loop (per missing loop_id)"
  writes: [record/metrics/_signals.jsonl]
  idempotent: true  # skips loop_ids already in the stream
---
# Ritual 02 — Signal Harvest

> Every closed loop owes one `improvement_signal`. Pull them into the stream before they are lost.

| Field | Value |
|---|---|
| **Owner** | Coordinator |
| **Cadence** | Daily |
| **Trigger** | Any loop under `record/loops/` closed since the last harvest whose `improvement_signal` is not yet a line in `record/metrics/_signals.jsonl`. |

## What it consumes

- `record/loops/<loop-id>/state.md` — the `## improvement_signal` heading and its YAML block (`friction`, `suggested_target`, optional `evidence_link`). Schema: `team/roles/loops/_IMPROVEMENT_SIGNAL.md`.
- `record/metrics/_signals.jsonl` — existing `loop_id` values, to know what is already harvested.

## What it produces

One appended JSONL line in `record/metrics/_signals.jsonl` per harvested loop. Append-only; existing lines are never edited.

## How it runs

Once per unharvested loop:

```js
Workflow({
  scriptPath: "<repo-root>/workflows/retrospective.js",
  args: { cadence: "loop", loop_id: "<loop-id>", date: "YYYY-MM-DD" }
})
```

Inside `office-day-v0.1.js` this is the **Signal harvest** phase: a discovery agent diffs the `record/loops/` directory against the `loop_id`s already in the stream, then the orchestrator composes `retrospective.js --cadence loop` once per missing loop.

## Why this ritual exists (the gap it was built to close)

As of 2026-06-22, three loops had closed —
`2026-06-14-critique-revise-001`, `2026-06-14-critique-revise-adversarial-001`, and the v0.2 calibration loop —
yet `record/metrics/_signals.jsonl` held exactly **one** line, and that line came from the substrate's own self-test, **not** from any of those loops. The per-loop cadence had never been run against the real loops. The sprint retro that was meant to consume that stream therefore consumed almost nothing. A daily harvest is the standing fix: a loop closes today, its signal is in the stream tomorrow morning.

## How it fails

- A closed loop has **no** `improvement_signal` block → `retrospective.js` returns verdict `missing`. That is a convergence-contract failure (the same contract that rejects a missing `would-have-wrongly-killed` line), not something to paper over. The harvest reports the loop as `missing` and the loop's owner owes the signal.
- A malformed YAML block → verdict `malformed`. Same handling: report, do not fabricate.
