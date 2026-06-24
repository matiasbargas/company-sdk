# Ritual 04 — Retro-Trigger Sweep

> Find the shipped work that is owed a sprint retrospective and has not had one.

| Field | Value |
|---|---|
| **Owner** | PM |
| **Cadence** | Daily |
| **Trigger** | Daily scan of every shipped slug in `intent-spec/`. |

## What it consumes

- `intent-spec/<slug>/shaped-brief.md` — the `Decision` field and the ship date.
- `intent-spec/_RETRO-INDEX.md` and `intent-spec/<slug>/_retrospective.md` — to dedupe against retros already run.

## The trigger checklist (all three must hold)

A slug is **owed** a sprint retro when:

1. **Decision is shippable** — `PROCEED`, `DE-RISK → HOLDS → PROCEED`, or `REVISE → shipped as v2`. (`KILL` and unresolved `REVISE` go to the kill-log path, not a retro.)
2. **≥24h since ship** — observable outcomes exist, not just author confidence.
3. **No retro yet** — `intent-spec/<slug>/_retrospective.md` does not exist and the slug has no row in `_RETRO-INDEX.md`.

## What it produces

A list of owed slugs for the day report, oldest first. When one is owed, the **recommended** action is to fire its sprint retro:

```js
Workflow({
  scriptPath: "/Users/matias.bargas/dev/ai-repos/team-sdk/workflows/retrospective.js",
  args: { cadence: "sprint", slug: "<slug>", date: "YYYY-MM-DD" }
})
```

> **The sweep reports; it does not auto-fire.** A sprint retro is a six-phase, file-writing act that emits durable Layer B claims and protocol proposals. Firing it is a deliberate decision by the PM (or owner), not something the daily clock should trigger silently. The orchestrator's **Retro-trigger sweep** phase returns the owed list and stops there.

## Why this ritual exists (the gap it was built to close)

On 2026-06-22 the sweep would have flagged **`idea-execution-v0.2`**: shipped 2026-06-14, decision `DE-RISK → HOLDS`, well past 24h, **no `_retrospective.md`**. It had been sitting owed and invisible. A daily sweep is how an owed retro stops being a thing someone happens to remember.

## How it fails

- **A slug ships without a `shaped-brief.md`** and is therefore unsweepable. Two real cases: `sdlc-state-machine` (which drafted protocol §33 with no shaped-brief) and `market-prioritization-2026-06-14` (a different workflow shape). The sweep cannot see them. It must report *"N shipped slugs have no shaped-brief and fall outside the retro trigger"* rather than silently skipping them — an unsweepable slug is a gap, not a pass.
