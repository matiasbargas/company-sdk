# Staff Engineer panel input — Mesa Técnica (chair: CTO Nicolás)

**Role:** Staff Engineer (interface contracts, platform primitives, cross-team coherence)
**Date:** 2026-06-15
**Focus from chair:** contracts + platform primitives + portability vs walled garden

---

## Your one-line guardrail

**The `_signals.jsonl` line schema — exactly two append-only fields (`envelope` v-pinned + `payload` namespaced) — MUST be frozen at v1.0, published in a public RFC repo, and declared "no breaking change before v2.0" BEFORE lighthouse contract #1 is signed; no lighthouse-specific extensions land in `envelope`, ever.**

## Why this guardrail (your domain prior)

The portability question is decided by exactly one file: the one that lives in the customer's repo. The Bus log, Layer B schemas, and agent topology are all *consumers* of that file — they can be re-derived, re-versioned, or rewritten behind a façade. `_signals.jsonl` cannot. It is the artifact the engineer-buyer reads in their `cat` output, the artifact the regulated buyer subpoenas, the artifact the marketing team links to in a Hacker News thread, AND the substrate the second bet (`crossing-the-chasm__regulated-enterprise`) must read from in Q1 2027 without a migration. If we negotiate a different `envelope` shape with each of the five lighthouses — even with the best intentions, even per their "legitimate data needs" — within two quarters we own five forks of the "stable" interface and the substrate has silently become a parallel system the customer mirrors into. The failure mode is invisible until month 14: each lighthouse looks fine in isolation; the union does not compose.

## The specific cost of NOT having this guardrail

Concrete sizing: a breaking `_signals.jsonl` schema change after five lighthouses are live is **6-10 engineer-months minimum** (writing the v1→v2 migrator, dual-publishing for one full quarter, getting every lighthouse to re-tool their internal dashboards built on the v1 shape) **plus 1 forfeited lighthouse** (statistically — one of five will refuse to re-sign), **plus $200-400K in unbudgeted DevRel cost** rebuilding category vocabulary mid-stream. Worse: the regulated bet's first BFSI logo (the $400-650K 3-year TCV anchor) will refuse to inherit a schema with a pending migration on the public roadmap — their model-risk team treats schema instability as audit evidence of immaturity. Total reversibility cost in the realistic case: **~$900K of direct engineering plus one un-recoverable cross-segment narrative asset.** This is the single decision in the substrate that fails the Mario test for irreversibility.

## How to verify the guardrail holds (the test)

A concrete artifact gate, not an agreement: **(a)** `signals-schema-v1.md` published in a public repo (separate from the team-sdk monorepo) under an explicit "Contract Stability Policy" file that names the no-breaking-change-before-v2.0 commitment; **(b)** a `signals-validator` CLI in that repo that returns non-zero on any line that violates the v1 envelope; **(c)** every lighthouse contract includes a clause naming the validator and the schema repo's git SHA at signing time; **(d)** CI on the main team-sdk repo runs the validator on a fixture corpus on every PR — a red build is the test. The gate trips before lighthouse #1 signs: no schema repo + no validator + no SHA-pin clause = no contract.

## What you would refuse to sign without this guardrail

I would refuse to sign off on lighthouse contract #1 — or any go-to-public-dogfood decision — until the schema, validator, stability policy, and SHA-pin contract clause are all in place; a verbal "we'll keep it stable" from any seat including the CEO does not satisfy the gate.
