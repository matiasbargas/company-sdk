# _HORIZONS.md — Maintenance Rules

Infrastructure for the queue. The queue itself lives in `_HORIZONS.md`.

## Rules

1. **Sprint cadence (`retrospective.js --cadence=sprint`)**
   - Check the `Now` row: did the workflow / artifact ship?
   - If yes: mark `Now` complete, then promote exactly one `Next` row to `Now`. Never promote two.
   - If the sprint retro produced a Layer A delta candidate that matches an existing `Later` or `Longer term` row, promote that row one notch (`Longer term` → `Later`, `Later` → `Next` — only if `Next` is empty after the `Now` promotion).
   - If `Next` was empty before the sprint retro ran, leave `Now` empty and emit a signal: the queue is exhausted, Owner input needed.

2. **Quarterly cadence (`retrospective.js --cadence=quarterly`)**
   - Walk every row, every horizon.
   - For each row that has been in the same horizon for two or more sprints without movement: re-justify (write one sentence on why it still belongs) or drop.
   - Re-check the `Vision (12 months)` section against accumulated KR evidence. If KR movement contradicts the vision, flag for Owner — do not silently rewrite.
   - Audit whether `Later` and `Longer term` rows still trace to the vision. Rows that no longer ladder up get dropped.

## Conflict resolution — two cadences run close in time

**Later cadence wins.** If `sprint` runs at T and `quarterly` runs at T+1 hour, the quarterly run sees the sprint's mutations as ground truth and proceeds from there. The quarterly run never undoes a sprint promotion — it only re-justifies or drops.

If two runs of the same cadence collide (rare — should be serialized by the workflow runner), the later run is a no-op against the earlier one. File timestamps are the tiebreaker.

## Owner override logging

Any directive from the Owner that changes a row — adds, displaces, demotes, or rewrites — is logged at the bottom of `_HORIZONS.md` under Provenance with:
- Date
- Directive source (chat session, retro, doc edit)
- Which row was affected and how

Auto-maintenance reads these entries: it will not promote *over* an Owner-placed row in the same sprint that the Owner placed it. Owner intent has a one-sprint grace period before automation may touch it.

## Why this doc is separate from `_HORIZONS.md`

The rules are **infrastructure**. The queue is **content**. They change on different cadences and for different reasons — infrastructure changes when the team learns how it wants to maintain itself; content changes every sprint. Mixing them would mean every queue update reads the rulebook again. Keeping them separate honors the same principle the substrate is built on: simplest faithful representation of each concern, in its own place.
