# SDLC State Machine — bet lifecycle for team-sdk

**Date:** 2026-06-16
**Authors:** Nicolás (CTO) + Coordinator
**Source directive:** Owner, 2026-06-16, on path #3 of the pre-commit-guardrails decision
**Status:** Draft v1.0 for Owner review

## Why this exists (one paragraph)

The substrate already has loops (§32), cycles (§15), guardians (§31), a corpus (Layer B), and the Halloway Ratchet (§24). What it lacked was **lifecycle visibility** — once a bet was committed, the substrate had no canonical state for "where is this bet right now." Without explicit states, all twelve `_pre-commit-guardrails.md` items collapse into a single sign-everything-upfront gate, which is neither agile (the Owner cannot sign things that depend on artifacts not yet produced) nor falsifiable (we cannot detect a bet skipping a stage). With states, guardrails become **per-transition gates** and metrics become **promotion criteria**. The bet progresses one transition at a time, each transition gated by named artifacts on disk + a metric reading + the specific guardrails relevant at that altitude.

## The states (canonical ordered list)

| State | Entry criteria | Exit criteria | Required artifacts | Owner | Metric gate | Rollback trigger |
|---|---|---|---|---|---|---|
| **proposal** | shaped-brief exists with `PROCEED` or `DE-RISK→HOLDS→PROCEED` decision logged | Portfolio-level Owner approval logged in `history.md` + STRATEGY.md alignment confirmed | `shaped-brief.md`, `claims.yaml` | CEO | n/a — judgment call by Owner | n/a (proposals don't roll back; they get `KILLED` in shaping) |
| **committed** | proposal state cleared + Owner sign-off on portfolio guardrails (G-001, G-002, G-003 from `_pre-commit-guardrails.md`) | All WIP-gate guardrails signed (G-004, G-005, G-007) | Owner-signed portfolio commit doc | CEO | n/a | Owner withdraws commit → state regresses to `proposal` |
| **WIP** | committed + WIP-gate guardrails signed (G-004 envelope freeze, G-005 Halloway entries, G-007 lineage invariant) | All artifacts for state's gate materialize on disk + CI green | code/spec files + envelope schemas + slice doc | EM (KNOWN-class scope) or CTO (EXPLORATORY-class scope) | `time-to-shaped-brief` trends down at sprint cadence | Mario blocks irreversibility violation → regress to `committed` |
| **internal_test** | WIP cleared + envelope SHA pinned + lineage invariant CI green | Test Engineer green light + contract tests pass + Bus replay job 100% | test artifacts + CI configs + replay fixtures | Test Engineer + CTO | `claim-count-and-invalidation-rate` below threshold | red CI build or replay drift → regress to `WIP` |
| **staging** | internal_test cleared + eval-portability CI live (G-008 day-30 seam) | Substrate-internal staging deploys without incident for N consecutive runs | staging config + smoke tests + portability diff in `_signals.jsonl` | EM | `retro-completion-rate` baseline established for the bet | staging incident → regress to `internal_test` |
| **preprod_metrics** | staging cleared + `_signals.jsonl` baseline established | Observable metrics in `_signals.jsonl` match staging baseline within tolerance | metric dashboards + baseline doc | CDO | `signal-to-action-rate` measurable for this bet | metric divergence > tolerance → regress to `staging` |
| **lighthouse_canary_1** | preprod_metrics cleared + Legal MSA gate signed (G-009 Carve-Out + G-010 Claim Altitude + G-011 Control Plane + G-006 lighthouse slice + kill-list) | First lighthouse customer signs MSA + integrates + emits first 30 days of `_signals.jsonl` lines | signed MSA + customer integration record + 30-day jsonl segment | CRO + CLO | `decision-distribution` baseline established for customer | customer-side rollback request → regress to `preprod_metrics` |
| **lighthouse_canary_2** | canary_1 cleared + day-60 signal-gate from G-003 passed | Second lighthouse signs against same envelope SHA | day-60 signal-gate evidence + second MSA | CRO + CMO | minimum-viable-delta confirmed in `_signals.jsonl` | day-60 gate fails → regress to `canary_1` OR `KILL` per G-003 |
| **cohort_rollout** | canary_2 cleared + Editorial Publication classification live (G-012 for any public dissent corpus) | Cohort metrics stable across multiple customers | rollout plan + cohort observability + Editorial classification policy on `_signals.jsonl` writes | CRO + CMO | `retro-completion-rate` > 80% across cohort | cohort regression metric → regress to `canary_2` |
| **ga** | cohort_rollout cleared + GA criteria from STRATEGY.md met | Substrate operates at scale with predictable metric drift only | GA announcement + public docs | CMO | all 6 metrics in healthy range | GA-blocking incident → regress to `cohort_rollout` |
| **critical_mass** | ga + substrate hits ~50 paying teams trigger | Antitrust Interoperability Commitment registered with board (G-013) | board resolution + open Bus spec published + portability endpoint + non-discrimination policy | CLO + CTO | n/a — trigger event | Commitment withdrawal → no rollback (irreversible by G-013 design) |
| **sunset** | (manual entry from any state by Owner directive or CEO + Coordinator joint motion) | Bet wound down with documented learnings + corpus archived | sunset retrospective + corpus archival to `intent-spec/_archive/` | EM + Coordinator | n/a | n/a (sunset is terminal) |

## State transition rules (non-negotiable)

- **Forward transitions** require ALL of: exit criteria met + required artifacts on disk + metric gate green + state-specific guardrails signed. A transition is logged as a `state_change` event in `_signals.jsonl` with the proof artifact SHAs inline.
- **Backward transitions (rollback)** require: rollback trigger fired + EM or higher logs the regression with reason in `history.md`. Rollback is one state at a time — a bet in `lighthouse_canary_2` regressing because the day-60 gate failed goes to `canary_1`, not all the way back to `WIP`, unless the gate failure surfaced a deeper invariant break (in which case the CTO escalates).
- **Skip-forward is forbidden.** A bet cannot transition `committed → staging` without passing through `WIP` and `internal_test`. This is the agile-but-disciplined property: the Owner does not sign the lighthouse MSA before the lighthouse slice exists, and the lighthouse slice does not exist before the envelope SHA is pinned.
- **State is single-valued per bet.** A bet is in exactly one state at any moment. Multiple bets can be in different states simultaneously — this is the SDLC analog of the `_HORIZONS.md` "one row in Next at a time" rule: one bet per transition decision, not one bet total across the substrate.
- **State is recorded in `intent-spec/<bet-slug>/_state.md`** — a tiny file with: current state, transition history (state + timestamp + proof artifact SHAs), last-promoted-on, owner-of-record. Auto-updated by `retrospective.js --cadence=sprint`. The file is the single source of truth; the dashboard reads it, not the other way around.

## How this composes with existing protocol

- **§15 cycles** — the **Ideation Cycle** produces `proposal` state artifacts (shaped-brief + claims); the **Shipping Cycle** starts at `committed` and runs through `ga`. The state machine is the explicit substrate the cycles operate over.
- **§15a self-improvement** — state transition failures (rollbacks, gates that fire repeatedly, artifacts that never materialize) become protocol change proposals via `_signals.jsonl` `friction:` entries with `suggested_target: protocol`.
- **§24 Halloway Ratchet** — state transitions are LEVEL 3 decisions (deterministic based on artifacts + metrics, not judgment). A forward transition without the named artifact present is a ratchet violation and Mario blocks it automatically. The ratchet is the enforcement layer for the rules above.
- **§31 iteration guardians** — the Discovery guardian validates quality at `proposal`, the Architecture guardian at `WIP` and `internal_test`, the Implementation guardian at `staging` through `lighthouse_canary_*`. Guardians do not own states; they audit them at transition.
- **§32 generative loops** — can be invoked at any state to deepen judgment before a transition. A Red-Team loop at `preprod_metrics` is the canonical pattern for catching what the baseline did not.

## Provenance

- Authored: 2026-06-16
- Source: Owner directive on path #3 of pre-commit-guardrails decision; CTO + Coordinator collaboration
- Guardrails referenced: `intent-spec/market-prioritization-2026-06-14/_pre-commit-guardrails.md` (G-001 through G-013)
- Metrics referenced: `metrics/README.md` (all six)
- Protocol sections composed: §15, §15a, §24, §31, §32
