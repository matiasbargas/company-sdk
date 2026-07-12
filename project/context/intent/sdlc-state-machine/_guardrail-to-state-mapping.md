# Guardrail-to-state mapping (post-SDLC re-shape)

**Date:** 2026-06-16
**Bet:** christensen-disruption × devtool (anchor)

## The mapping table

| State transition | Guardrails to sign | Owner sign-off action | Why this state |
|---|---|---|---|
| proposal → committed | G-001, G-002, G-003 | Owner signs portfolio commit doc (CEO + CFO + PM countersign) | Portfolio-level commitment without locking technical surface yet — calendar reservation, paid-SKU shape, lighthouse sequencing are all bet-level decisions that gate whether the bet exists at all, not how it is built |
| committed → WIP | G-004, G-005, G-006, G-007 | Owner signs technical envelope commit (Mario + Staff + CTO + PM countersign) | Bet has technical shape — envelope frozen, ratchet entries logged, slice scoped, lineage invariant declared — build can start without lighthouse customer pressure but cannot start without these four artifacts on disk |
| WIP → internal_test | (no new signing — automatic when artifacts materialize) | Test Engineer green light | Substrate validates substrate before customers see it — G-004 validator CLI and G-007 replay job were wired at WIP entry, they run here |
| internal_test → staging | (no new signing) | EM promotes | Substrate-internal deployment — exercises the envelope under load without customer linkage |
| staging → preprod_metrics | (no new signing) | CDO promotes | Metrics baseline established — `_signals.jsonl` produces real lines under the frozen envelope, day-60 gate denominator can now be defined |
| preprod_metrics → lighthouse_canary_1 | G-009, G-010, G-011 | Owner signs MSA template (CLO + CISO + CCO + CRO-Risk countersign) | Customer-facing legal surface activates only when needed — Carve-Out Rider, Claim Altitude Register, Control Matrix v0 are all artifacts the first lighthouse will sign against; before this state they would have been theoretical |
| canary_1 → canary_2 | (no new signing — G-003 day-60 gate fires) | CRO + CMO promote on signal-gate evidence | Second lighthouse only if first produces signal — the gate is the artifact G-003 already committed to; no new Owner signature, but a real go/no-go decision tied to `_signals.jsonl` evidence |
| canary_2 → cohort_rollout | G-012 | Owner signs Editorial classification policy (CRO-Risk + CLO countersign) | First public dissent corpus publication triggers this — before G-012 is signed, no Halloway-Ratchet log or §32 Red-Team transcript may be made public; the write-time linkage-sever code path is the gate artifact |
| cohort_rollout → ga | (no new signing — STRATEGY.md GA criteria) | CMO promotes | Substrate operates at scale — guardrails already in force; transition is operational, not legal |
| ga → critical_mass | G-013 | Owner + Board signs Interoperability Commitment (CLO + CTO joint countersign) | Trigger event at ~50 paying teams — antitrust posture must be registered before the substrate is a market; board resolution, open Bus spec, portability endpoint, non-discrimination policy all land here |

## ONGOING discipline guardrails (do not gate single transition; gate compound milestones)

| Guardrail | Continuous gate |
|---|---|
| G-008 (eval-portability CI) | LLMProvider seam must exist at committed → WIP transition (it is part of the technical envelope Mario freezes alongside G-004); two-provider CI on ≥30-scenario frozen public eval set must be green by day-30 of lighthouse_canary_1; if CI is red at day-30, lighthouse_canary_2 is blocked regardless of G-003 signal-gate outcome |
| G-013 (Antitrust Interoperability) | Continuous from ga onwards; state-machine watches paying-team count; if substrate hits ~50 paying teams without board resolution registered, automatic alert blocks new customer onboarding until commitment is posted — this is the only guardrail that can retroactively re-freeze a later state |

## What changed from "sign 9 at once"

The Owner now signs 3 guardrails to start (G-001, G-002, G-003) and unlocks `committed` state — these are portfolio-level decisions about whether the bet exists, not how it is built. 4 more (G-004, G-005, G-006, G-007) to enter WIP — technical envelope freeze, no customer pressure yet. 3 more (G-009, G-010, G-011) when the first lighthouse signs an MSA — legal surface activates exactly when it is load-bearing. 1 more (G-012) when the first public dissent corpus is published — Editorial classification gates the publication pipeline, not the build. Same eleven pre-commit guardrails as before plus G-013 at critical mass, but signed at the moment they actually gate something, with the artifact-on-disk requirement at each transition preventing skip-ahead. The three sign-now guardrails are portfolio commitment level, not technical lock-in — the Owner can still kill the bet before WIP without having frozen any envelope, written any code, or talked to any customer.

## What this preserves from the original convergence

G-004 is still the most load-bearing guardrail in the bet — it is now the explicit WIP-gate. Without G-004 signed, no code gets written. The Mesa Técnica + Mesa Legal + market-prio convergence on `_signals.jsonl` as the public API of the company is intact; G-005, G-007, G-010, G-011, and G-012 all still reference it. Only the temporal sequencing changes: G-009, G-010, G-011 land later (when the MSA template is actually drafted), and G-012 lands later still (when publication actually happens), instead of being pre-signed against artifacts that did not yet exist. The envelope/payload split adjudication from the original chair ruling is unchanged. The non-merge of G-008 vs G-005 is unchanged. The four explicitly-unguarded risks from the original list (narrative half-life, DevRel headcount, hosted-margin trap, lighthouse-cascade single-denominator) remain explicitly unguarded.

## Provenance

- Mapped: 2026-06-16
- Owner directive: path #3 + SDLC requirement
- Source: `_pre-commit-guardrails.md` (Greg, 2026-06-15) + state machine spec (parallel-produced, 2026-06-16)
- Consolidator: Greg (CEO)
