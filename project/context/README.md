# `context/` — the project's brain (Layers A / B / C)

> Orientation file. If you are an agent assembling context for a task, start here.

This is the **layered context** for the project — the knowledge an AI-assisted task loads to
be useful. Three layers, each with a distinct author, cadence, and consumer. Adopted from the
Layered Context Architecture and mapped onto the team-sdk substrate.

| Layer | Folder | What it holds | Author | Cadence |
|---|---|---|---|---|
| **A — Foundation** | [`foundation/`](foundation/README.md) | Stable, human-authored law (pointer to CHARTER, protocol, STRATEGY…) | Leadership | Rarely |
| **B — Specifications** | [`spec/`](spec/README.md) | AI-maintained atomic claims about system behavior, per idea slug | Workflow agent | Per merged idea |
| **C — Task intent** | [`intent/`](intent/README.md) | Engineer/agent-supplied intent per idea slug (+ `_INDEX.md`, `_archive/`) | Whoever works the idea | Per task |

## Load order for a task

1. **Layer A** in full — small, always loaded (`foundation/` → the referenced law).
2. **Layer B slice** — the `spec/<slug>/claims.yaml` for the epic/idea you're working, plus any cross-cutting tags.
3. **Layer C** in full — the active `intent/<slug>/` folder.

## What does NOT live here

- Live project state (status, history, requirements, logs) → `../` (the project root).
- Run exhaust (loop state, metrics, spec records) → [`../record/`](../record/README.md).
- The machine that produces all this (packages, scripts, workflows, team) → the SDK at the repo root.

## Gate note (§35)

`context/**` is **material** to the Document-First Gate: a change here travels with a map touch
(`../current-status.md` / `../history.md`) in the same commit. See `protocol.md` §35 and the
authoritative classifier at `scripts/lib/map-gate-lib.js`.
