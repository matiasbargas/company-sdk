# Ritual 03 — Daily Digest

> Turn the raw signal stream into a watchlist a human can act on.

| Field | Value |
|---|---|
| **Owner** | Coordinator |
| **Cadence** | Daily (after Signal Harvest) |
| **Trigger** | Once per office day, after the day's signals are in the stream. |

## What it consumes

- `record/metrics/_signals.jsonl` — the tail since the most recent prior digest in `record/metrics/_daily-digests/`.

## What it produces

`record/metrics/_daily-digests/YYYY-MM-DD.md` — signals grouped by `suggested_target` (loop-pattern / layer-A / workflow / protocol / none), with the most action-able friction lines quoted **verbatim**, clusters counted, and a **Watchlist**: which clusters are starting to look like a pattern that a sprint or quarterly retro should action.

## How it runs

```js
Workflow({
  scriptPath: "<repo-root>/workflows/retrospective.js",
  args: { cadence: "daily", date: "YYYY-MM-DD" }
})
```

Inside `office-day-v0.1.js` this is the **Daily digest** phase: the orchestrator composes `retrospective.js --cadence daily` directly. Re-running for the same date overwrites that day's digest (idempotent).

## The cross-domain reader

The digest is not the Coordinator's alone. Per `protocol.md` §32, **UX Researcher is a named co-consumer of `record/metrics/_signals.jsonl`** — the stream is a research surface, not just an ops surface. UXR reads the friction patterns continuously, not gated by any retro, and may open a §15a protocol-change proposal when a friction pattern recurs. See [`by-role/ux-researcher.md`](../by-role/ux-researcher.md).

## How it fails

- The **Watchlist names a cluster but no ritual or owner picks it up.** That is a signal-to-action leak — the digest did its job and the company did not. The leak shows up later as a low `signal-to-action-rate` (a quarterly metric). The daily defense is that the watchlist is read at close and any named cluster gets an owner or an explicit "not yet."
- A digest is produced but never read — wall art. A digest with no reader is the failure `record/metrics/README.md` warns against: a metric nobody acts on is noise.
