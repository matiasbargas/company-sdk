# Mario — Mesa Técnica panel input

**Role:** Chief Engineer (irreversibility)
**Chair:** CTO Nicolás Oslo
**Question assigned:** Of the three day-1 commitments (git-native storage, paid-layer self-host resistance, AI provider portability), which one — shipped wrong at lighthouse #1 — costs >6 engineer-months and at least one breaking schema migration to reverse when bet #2 reads from the same corpus in Q1 2027, and what single architectural invariant prevents that reversal?

---

## Your one-line guardrail

**`_signals.jsonl` and the Bus message envelope are frozen at v1.0 with a Halloway-Ratchet-enforced append-only schema and a `schema_version` field on every line before lighthouse contract #1 is signed — and the regulated-bet team is in the room when v1.0 is sealed.**

## Why this guardrail (your domain prior)

The CTO, PM, and CAIO are positioned to see the wedge. Only the engineering seat is positioned to see what the **second customer** inherits. The lighthouse-1 devtool company is going to negotiate `_signals.jsonl` fields to suit their PR flow — `pr_url`, `merge_sha`, `reviewer_handle`. That is fine for them. It becomes catastrophic when a Tier-2 BFSI Model Risk team six months later needs to **query the same corpus** for `decision_id`, `regulation_ref`, `model_id`, `approver_role`, and the audit byproduct of the devtool corpus is structurally incompatible. The failure mode I have lived through three times: an early customer's domain vocabulary leaks into the substrate's primary keys, and every subsequent customer either migrates around it (breaking the first one) or accepts a parallel corpus (killing the cross-segment thesis the recommendation depends on). The recommendation explicitly bets that `_signals.jsonl` is "the positioning statement, the marketing artifact, the sales asset, and the falsification test — all at once." That artifact is **one file format**. If we ship it wrong, we ship the wrong company.

## The specific cost of NOT having this guardrail

A breaking `_signals.jsonl` migration after lighthouse #1 publishes data and bet #2 starts negotiation costs: **9-14 engineer-months** for the migration tooling itself (forward/back compat, replay, dual-write window, audit trail of the migration), **2-3 months of lighthouse-1 trust capital** (their public corpus becomes invalid or forks), **the regulated lighthouse refuses to sign** because their auditor will not accept a substrate whose schema changed mid-engagement, and we lose roughly **6 months of GTM velocity** rebuilding the dogfood narrative. Conservative total: $400-700K direct + the optionality cost of bet #2's first audit-survived logo slipping from Q1 2027 to Q4 2027 — which the CMO panel called "the single most cross-segment-compounding brand asset in the entire batch."

## How to verify the guardrail holds (the test)

A concrete artifact, not a promise: **`/intent-spec/schemas/signals-v1.0.md` exists, is git-tagged `schema/signals-v1.0`, and contains (a) the full field list with types, (b) the `schema_version` field positioned first, (c) a written Halloway-Ratchet entry for every field explaining why it generalizes across devtool AND regulated AND agency segments, (d) one reviewed sign-off from a representative of the bet #2 buyer persona (real Model Risk practitioner, even if advisory), and (e) a passing CI check on the lighthouse repo that rejects any `_signals.jsonl` line missing `schema_version` or using a field not in the registry.** If any of those five artifacts is missing on the day lighthouse contract #1 is drafted, the guardrail has not held.

## What you would refuse to sign without this guardrail

I would refuse to sign the engineering ratification of lighthouse contract #1 — and would log dissent to `history.md` blocking the release — if `_signals.jsonl` v1.0 has not been frozen, schema-versioned, and reviewed by a bet #2 buyer-persona representative before the contract is countersigned.

---

## Provenance

- Panel: Mesa Técnica, 2026-06-15
- Chair: Nicolás Oslo (CTO)
- Inputs: `_framing.md`, `christensen-disruption__devtool-companies.md`, `_recommendation.md`, role file `chief-engineer.md`
- Reference: protocol.md §24 (Halloway Ratchet doctrine)
