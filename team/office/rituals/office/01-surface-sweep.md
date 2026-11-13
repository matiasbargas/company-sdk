---
ritual:
  id: surface-sweep
  order: 1
  owner: Coordinator
  cadence: daily
  slot: morning
  runs: "office-day-v0.1.js → Surface sweep phase"
  writes: [] # read-and-report only
  idempotent: true
---
# Ritual 01 — Surface Sweep

> Move the §34 Collaboration Surfaces forward. Find the ones that have stalled.

| Field | Value |
|---|---|
| **Owner** | Coordinator |
| **Cadence** | Daily, morning (first ritual of the office day) |
| **Trigger** | Any file in `project/surfaces/` whose front-matter `state` is not terminal (`verified`, `superseded`, `archived`). |

## What it consumes

- `project/surfaces/*.md` — front-matter (`state`, `verifier_roster`, `irreversible`) and the verification blocks in the body (`pass | concern | no-go`).
- `protocol.md` §34.4–§34.7 — roster minimums, no-go handling, and the human-escalation boundaries.

## What it produces

A per-surface status line for the day report:

- Surfaces in `under-verification` with **open roster slots** → flagged for a roster decision.
- Surfaces in `reconciling` (a `no-go` was recorded, §34.5) → flagged for §29 resolution.
- Surfaces in `blocked` (irreversible + unresolved no-go) → escalated to the human per §34.7.
- Surfaces idle in `under-verification` past the staleness threshold → flagged as **stalled**.

## How it runs

**Read-and-report only.** Today this ritual reads surface state and reports it. It does **not** fill verification blocks or advance state.

> The meta-loop that would complete verification blocks — `company-loop-v0.1` — is referenced in `AGENTS.md` and `protocol.md` §34 but **is not built yet**. Until it exists, a verifier acting on a rostered slot is a human act (see [`by-role/verifiers.md`](../by-role/verifiers.md)). This ritual's job is to make sure no rostered slot is silently forgotten.

Manual command (until `company-loop-v0.1` ships):

```bash
ls project/surfaces/*.md   # then read each one's front-matter + verification blocks
```

Inside `office-day-v0.1.js` this is the **Surface sweep** phase: one agent reads every surface and returns the structured status; no writes.

## How it fails

- A surface sits in `under-verification` with an unfilled roster for more than the staleness window — verification is owed and nobody is on the hook. The sweep exists to make that visible the next morning.
- A `no-go` on an `irreversible: true` surface goes unescalated. §34.5 says a no-go is blunt and forces a discussion; a sweep that does not surface it lets the surface rot in `blocked`.

## First worked surface

`project/surfaces/SURFACE-20260620-enforcement-claims-tooling-001.md` — authored by CTO, roster `[Mario, CISO, Test Engineer]`, all three verdicts **pending**. This is exactly the shape the sweep flags: authored, `under-verification`, roster open, awaiting verifiers.
