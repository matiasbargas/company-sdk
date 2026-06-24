# Ritual 05 — Status Reconcile

> Close the day by making `current-status.md` tell the truth.

| Field | Value |
|---|---|
| **Owner** | Coordinator |
| **Cadence** | Daily, at close (last ritual of the office day) |
| **Trigger** | End of office day, always. |

## What it consumes

On-disk reality, compared against what `project/current-status.md` claims:

- `intent-spec/_RETRO-INDEX.md` and `metrics/_cadence-runs.jsonl` — what retros actually ran.
- `project/surfaces/*.md` — surface states from the morning sweep.
- `metrics/_signals.jsonl` + the day's digest — signal-stream state.
- `git log` HEAD — what was actually committed.
- The outputs of the day's other four rituals.

## What it produces

A refreshed `project/current-status.md` whose **Phase**, **Active Missions**, **Next Agent To Activate**, and **Session Notes** match the repository as it actually is — plus a **drift list** in the day report: each field that was wrong, what it said, and what it now says.

## How it runs

```bash
sdk-health project/      # staleness + validate + manifest + .sdkrc check
sdk-status project/      # missions table, open decisions, activation phrase
```

…then rewrite `current-status.md` to reality. Inside `office-day-v0.1.js` this is the **Status reconcile** phase: one agent diffs the status file against the evidence above, rewrites it, and returns the drift list. The file is fully reversible via git, so the rewrite is safe; the drift list keeps it auditable.

## Why this ritual exists (the gap it was built to close)

`current-status.md` has drifted from reality **twice** in eight days:

- **2026-06-19** — the entire June 14/16 generative-loops initiative was built, uncommitted, and absent from `history.md` while the status file still read "2026-04-18, Tier 1 complete." Caught only by a manual Greg audit.
- **2026-06-22** — the status file still said the §32 sprint retro was *overdue* and that `_RETRO-INDEX.md* *"does not exist yet"* — when the retro had already run on 2026-06-19 and was committed in `42888b8`. Caught only because the owner asked.

Both were the same failure: the map lied and nothing reconciled it on a clock. This ritual is that clock. If the map is the first file the next session reads (`team/roles/CLAUDE.md`), then a stale map means the team starts the day flying blind — so the day does not end until the map is true.

## How it fails

- `current-status.md` asserts something on-disk evidence contradicts and the reconcile does not catch it. The defense is that the ritual derives the status **from** the evidence rather than editing prose in place — the drift list is the proof of work.
- The reconcile runs but `sdk-health` flags are ignored. A green status over a red health check is exactly the invisible-failure pattern the §32 retro named; the day report must carry the health result, not just the rewrite.
