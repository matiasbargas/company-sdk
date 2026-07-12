# `record/` — run exhaust (records + measurement)

> Orientation file. This is where the project's *runs* leave their trace — not its knowledge.

`record/` holds the by-products of doing the work: loop state, metric streams, and historical
spec records. It is append-mostly and self-describing. Distinct from `../context/` (the brain,
which agents load as knowledge) — you rarely load `record/` to do a task; you write to it as a
task runs, and you read it when auditing or measuring.

| Folder | What it holds | Written by |
|---|---|---|
| [`loops/`](loops/) | Per-loop state (`<id>/state.md`) — Critique-Revise / Red-Team turns | Loop runs |
| [`metrics/`](metrics/) | Metric definitions + append-only JSONL streams (`_signals.jsonl`, `_cadence-runs.jsonl`, `_daily-digests/`) | Retrospective cadences |
| [`specs/`](specs/) | Historical shipped spec waves (design records) | One-shot, at ship |

## Keeping it under control over time

`record/` is exhaust, so it grows. The discipline: metric streams stay append-only; old loop
state rolls up into digests rather than accumulating unbounded; nothing here is a source of truth
that another layer depends on. When in doubt, summarize forward and keep the live tail.

## Gate note (§35)

`record/**` is **exempt** from the Document-First Gate (like area logs): appending a metric line
or a loop-state file does not require a map touch. See `protocol.md` §35 and the authoritative
classifier at `scripts/lib/map-gate-lib.js`.
