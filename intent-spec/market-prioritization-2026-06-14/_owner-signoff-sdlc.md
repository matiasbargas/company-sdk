# Owner sign-off — SDLC-aware (re-shaped 2026-06-16)

**Bet:** christensen-disruption × devtool
**Re-shape source:** Owner directive 2026-06-16 (path #3 of pre-commit-guardrails decision + SDLC requirement)
**Supersedes:** the all-at-once sign-off block in `_pre-commit-guardrails.md` (preserved as historical artifact)

## What changed

The original `_pre-commit-guardrails.md` block required nine PRE-COMMIT signatures upfront, before lighthouse contract #1 was drafted — including signatures against artifacts that did not yet exist (MSA template, lighthouse slice doc, Editorial classification policy). The SDLC-aware version requires three signatures NOW (G-001, G-002, G-003) to enter the `committed` state — portfolio-level decisions about whether the bet exists, not how it is built. The remaining nine guardrails (G-004 through G-007, G-009 through G-012, plus the ongoing-discipline G-008 seam and G-013 critical-mass trigger) are signed at the moment they actually gate a specific state transition, with the named artifact on disk as the prerequisite. Same total commitment as the original twelve-guardrail set, distributed across the bet lifecycle, with artifact-on-disk requirements at each transition preventing skip-ahead.

## Step 1: Sign now to enter committed state

- [ ] **G-001** — 25% CEO calendar reservation for non-devtool segments
  Signature: _____________________________  Date: __________

- [ ] **G-002** — Day-one paid SKU structurally hard to self-host (cross-team benchmarks, federated corpus, NOT SOC2 export)
  Signature: _____________________________  Date: __________

- [ ] **G-003** — One lighthouse first; day-60 signal-gate in `_signals.jsonl` before any second lighthouse
  Signature: _____________________________  Date: __________

**When all three boxes are checked, the bet enters state: committed.** Mario, Staff, PM begin WIP-gate artifact preparation (G-004, G-005, G-006, G-007). No customer-facing surface activates yet. The Owner can still kill the bet before WIP without having frozen any envelope, written any code, or talked to any customer.

## Step 2: Sign at committed → WIP transition (NOT NOW — when WIP-gate artifacts materialize)

- [ ] G-004 — `_signals.jsonl` envelope v1.0 freeze + SHA-pinning + public RFC
- [ ] G-005 — Halloway Ratchet per field + bet-#2 reviewer envelope sign-off
- [ ] G-006 — Signed `lighthouse-1-slice.md` + 30-min walkthrough + kill-list
- [ ] G-007 — Bus-to-`_signals.jsonl` lineage invariant + CI replay

Owner action required: when Mario + Staff + PM present completed artifacts (RFC repo commit SHA, validator CLI green in CI, Halloway-Ratchet entries logged, signed `lighthouse-1-slice.md` with the fresh-laptop 30-minute walkthrough recording and OUT-OF-SCOPE kill-list, Bus replay CI green), Owner reviews and signs all four to promote bet to `WIP` state. Until then, bet remains `committed`. G-004 is load-bearing — without it, no code gets written, because every other technical and legal guardrail downstream of WIP references the envelope SHA.

## Step 3: Sign at preprod_metrics → lighthouse_canary_1 transition (when first lighthouse customer is identified)

- [ ] G-009 — Carve-Out Rider + Joint-Custodian DPA + non-sign list
- [ ] G-010 — Claim Altitude Register + Representation Altitude Lock MSA clause
- [ ] G-011 — Single Control Plane, Two Evidence Surfaces

Owner action required: when CLO presents the drafted MSA template incorporating the Carve-Out Rider (MFN / perpetual on-prem / uncapped IP indemnification non-sign list), the Claim Altitude Register with third-party cryptographic attestation, and Control Matrix v0 dual-mapped to wedge + upmarket frameworks — AND CRO/CMO identify the first lighthouse candidate — Owner signs all three to promote bet to `lighthouse_canary_1`. Before this state, these legal surfaces would be theoretical; signing them here ties them to a real counterparty.

## Step 4: Sign at canary_2 → cohort_rollout transition (when first public dissent corpus is about to be published)

- [ ] G-012 — Editorial/Research Publication classification + write-time linkage severance

Owner action required: when the first public publication (Halloway Ratchet logs, §32 Red-Team transcripts) is ready and the write-time linkage-sever code path is in repo, Owner signs to promote bet to `cohort_rollout`. Before G-012 is signed, no public dissent-corpus artifact may be published.

## Ongoing discipline (not gated by single signature)

- **G-008** — Eval-portability CI seam exists at `committed → WIP` (LLMProvider interface is part of the technical envelope Mario freezes alongside G-004); two-provider CI on the ≥30-scenario frozen public eval set must be green by day-30 of `lighthouse_canary_1`. If CI is red at day-30, `lighthouse_canary_2` is blocked regardless of G-003 signal-gate outcome.
- **G-013** — Antitrust Interoperability Commitment continuously watched from `ga` onwards; state machine tracks paying-team count. If substrate hits ~50 paying teams without a board-resolved Interoperability Commitment registered (open Bus spec under permissive license, one-click portability endpoint, written non-discrimination policy on cross-team benchmark queries), automatic alert blocks new customer onboarding until the commitment is posted. Triggers at `ga → critical_mass` transition; Owner + Board sign at that moment.

## Rollback authority

At any state, if the metric gate fails or a rollback trigger fires, the state owner regresses the bet to the previous state, logs the regression with reason to `history.md`, and surfaces to Owner via Bus message. Rollback is one state at a time — a bet in `lighthouse_canary_2` regressing because the day-60 gate failed goes to `canary_1`, not all the way back to `WIP`, unless the gate failure surfaced a deeper invariant break (CTO escalates in that case). Mario can block any forward transition that violates §24 (Halloway Ratchet — a forward transition without the named artifact on disk is a ratchet violation and is blocked automatically). CEO can override either direction by logging the override + rationale + reversibility classification to `history.md`. Sunset is terminal and is the only state with no rollback path.

## What the Owner is NOT signing today

G-004, G-005, G-006, G-007, G-008, G-009, G-010, G-011, G-012, and G-013 are NOT being signed today. They are listed for awareness so the Owner sees the full commitment arc, but the bet does not lock in to them until their state transition arrives and the required artifact is on disk:

- G-004, G-005, G-006, G-007 — deferred to `committed → WIP` transition
- G-008 — seam at `committed → WIP`; CI green by day-30 of `canary_1`
- G-009, G-010, G-011 — deferred to `preprod_metrics → lighthouse_canary_1` transition
- G-012 — deferred to `canary_2 → cohort_rollout` transition
- G-013 — deferred to `ga → critical_mass` trigger (~50 paying teams)

## Provenance

- Re-shaped: 2026-06-16
- Author: Greg (CEO)
- Source: Owner directive path #3 + SDLC state machine
- Inputs: `_pre-commit-guardrails.md` (Greg, 2026-06-15); `_state-machine-spec.md` (Nicolás + Coordinator, 2026-06-16); `_guardrail-to-state-mapping.md` (Greg, 2026-06-16)
- Supersedes: Owner sign-off block in `_pre-commit-guardrails.md` (lines 51-88) — preserved as historical artifact
