# Layer A — Foundations

> Stable, human-authored knowledge. Slow cadence. Loaded into every AI-assisted task.

## What this layer is

Layer A is the constitutional grounding for everything the team-sdk produces. It is small enough to be carried in full as context for every task. It changes rarely and deliberately. It is human-authored — never AI-maintained — because intent and principle are exactly what humans are good at and automation is bad at.

Adopted from the **Layered Context Architecture** brain structure (Sidharta Rezende, Diego Mattos — Nu-Global). Mapped onto team-sdk substrate.

## What lives here

In team-sdk, Layer A is **not duplicated into `foundation/`** — it already exists in the SDK source and is referenced. This README is the map:

| Foundation artifact | Path | Owner | Cadence |
|---|---|---|---|
| Charter — "the company is the product" (north star) | `CHARTER.md` | Owner (ratifies) | On Owner directive |
| Priority Constraints + Purpose + Soul | `team/roles/_shared.md` | Engineering + product leadership | Quarterly |
| Bus protocol + cycles + escalation ladder | `protocol.md` | Coordinator + CTO | On structural change (version bump) |
| Agent index + activation sequence | `AGENTS.md`, `team/roles/CLAUDE.md` | Coordinator | When roster changes |
| Strategy themes + Betting Table rules | `STRATEGY.md` | CEO | Quarterly |
| Engineering practices + naming + test coverage rule | `team/roles/_shared.md` + role files | CTO + Mario | Quarterly |

If you find yourself wanting to copy Layer A content INTO `foundation/`, stop. Foundation is a pointer, not a copy. The brain-structure doc proposes a single repo for the BU; we are using the SDK source as that repo. One source of truth.

## What does NOT live here

- Task-specific intent (that's Layer C → `../intent/`)
- AI-maintained behavioral specs (that's Layer B → `../spec/`)
- Ephemeral state (loop state, session state, etc.)
- Project-specific decisions (those go to `project/history.md`)

## When to update Layer A

Quarterly or on a non-negotiable trigger (incident, regulatory change, structural protocol bump). Layer A drift is invisible until it isn't — the test coverage rule, for example, is what makes Layer B verification work. If Layer A weakens, Layer B becomes untrustworthy.

## How this layer is consumed

Every workflow run loads a distilled version of Layer A as the constitution. The distillation lives in the workflow output for that run (`../intent/<slug>/_foundation-snapshot.md`) so we can audit "what constitution this idea was shaped against" later, when the constitution itself has evolved.
