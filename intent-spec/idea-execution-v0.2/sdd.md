# SDD: idea-execution-v0.2
**Date:** 2026-06-14
**Author:** PM (auto-drafted)
**Stage:** Draft v1

## Problem

v0.1 shipped a workflow that runs idea→shaped-brief end-to-end, but the CISO blind audit on v0.1's own outputs proved two failure modes are alive in the substrate today:

1. **Schema-passes-sycophancy.** `would_have_wrongly_killed:` is required and present, yet hedge-density rises and bold critique lines score ≤5/15 on the CISO five-dimension rubric without anything stopping the run. The schema gate is necessary but not sufficient. Today, a sycophantic brief can pass v0.1 and reach the Betting Table.
2. **Named-role critique is its own attack surface.** v0.1 deferred Dialectic precisely because Designer-vs-CTO debate, when names are attached, regresses to deference patterns rather than synthesis. 2024-2026 research on multi-agent debate confirms anonymization is what makes the pattern produce signal rather than theater.

Two structural gaps compound those: loops are baked-in phases in v0.1 (a phase that discovers its own weakness mid-run cannot escalate to a loop), and v0.1 has no retrospective hook, so the workflow does not feed its own improvement loop. Both are addressable now; both get worse the longer we run v0.1 unchanged.

The condition that demands a response **now**: every additional idea we run through v0.1 launders sycophancy into briefs that look adversarially-tested and aren't. Each one becomes prior art the next run inherits.

## Target user

**The spawning agent inside a v0.2 workflow run** — currently the PM during shaping, the CTO during architecture, Mario during Red-Team. Their problem today: when their phase surfaces a weakness hypothesis mid-execution (e.g. CTO realizes the architecture rests on an unverified assumption about loop reentrancy), they have no callable verb to escalate into a bounded loop. They either ignore it, hand-roll a recovery, or break the workflow contract by writing outside their phase. v0.2 gives them `spawn_loop(...)` as a first-class call with a documented invocation contract.

Secondary user: the Owner / Greg, who needs the workflow to stop producing briefs that pass schema but discharge pressure into hedges.

## Appetite

**M — 1 week.**

Justification: four additions, each non-trivial (loop primitive API, anonymization layer, retro hook, 5-dimension audit gate), and the spawning-agent invocation contract called out in the weakness hypothesis is the load-bearing piece that v0.1 underspecified. S would force us to ship the primitive without the contract — which is the exact failure the WEAKNESS_HYPOTHESIS predicted. L would let us drag in v0.3 work (multi-run concurrency, embedding retrieval) that v0.2 has explicitly deferred.

## Solution sketch

**Minimum-value increment: ship Addition 1 with a real invocation contract, gated by Addition 4. Nothing else this cycle.**

Concretely:

- A `spawn_loop(pattern, target, weakness_hypothesis)` callable exposed to any phase via the Loop Coordinator (§32). Documented signature, documented return shape (`{artifact_path, provenance_hash, status}`), documented error path (timeout → asymmetric termination contract: budget default + early-stop unilateral + extension countersign).
- `WEAKNESS_HYPOTHESIS` is a required string field on every loop open. JSON Schema enforced, `maxLength` constrained — not a self-reported boolean.
- Every emitted artifact carries a `LOOP-PROVENANCE` hash. Append-only corpus discipline preserved.
- CISO 5-dimension audit (specific strategy / specific critique cited / falsifiable property / contextual concreteness / severity judgment) baked into Critique-Revise convergence. Lines scoring ≤5/15 **fail closed** — the loop reopens with a critic-only retry under a different agent before revision runs. Hard JSON Schema constraints (`maximum: 15`, `minimum: 0` per dimension), not self-reported pass/fail.

Additions 2 (Dialectic with anonymization) and 3 (retro hook) are scoped into the cycle but framed as **stretch on top of the load-bearing pair**. If they slip, we ship Additions 1+4 alone — that already closes the invisible-failure window the weakness hypothesis named.

Dogfood discipline holds: this v0.2 is itself being built by running v0.1 on the v0.2 design.

## Non-Negotiables

- **Concrete invocation contract for `spawn_loop`.** Function signature, return shape, error path — all three documented before any phase can call it. The weakness hypothesis on this SDD is precisely that v0.1 lacks this; v0.2 cannot recreate the gap.
- **WEAKNESS_HYPOTHESIS required on every loop open.** Schema-enforced string, not a boolean. No loop opens without one.
- **Schema enforcement at the hard-constraint level** per `workflows/_SCHEMA_PATTERNS.md` discipline: `maxLength`, `maximum`, `minimum`, `required` — never self-reported booleans, never trust-the-author flags.
- **5-dimension audit fails closed.** A line scoring ≤5/15 stops revision and reopens critique under a different agent. No override path in v0.2.
- **Asymmetric termination contract preserved.** Budget default + early-stop unilateral + extension requires countersign. Carries over from §32 Mario irreversibility flags.
- **LOOP-PROVENANCE hash on every emitted artifact.** Append-only corpus. No silent overwrites.
- **Dogfooded.** v0.2 is built by running v0.1 on the v0.2 design. If v0.1 cannot produce a coherent v0.2 brief, that is itself a finding.

## Out-of-Bounds

- **Tree of Thoughts.** Deferred to v0.4. High token cost; only justified on high-stakes ideation.
- **Multi-run concurrency / semantic conflict detection across parallel runs.** v0.3.
- **Embedding retrieval over `claims.yaml`.** v0.3.
- **Any change to the §32 Loop Coordinator protocol surface beyond exposing the callable.** The Loop Coordinator itself is not being redesigned in v0.2 — only made callable.
- **Replacing v0.1.** v0.2 is additive. v0.1 remains runnable until v0.2 has passed its own dogfood cycle.
- **Human override of the 5-dimension audit.** No "the audit is too strict, let it through" path. If the audit is wrong, the fix is to revise the rubric in a future cycle, not bypass it in this one.
- **Resolving the two open questions from the sketch (provenance hash composition under sub-loops; meta-audit of the audit itself) before shipping.** Both are real, both can be answered after v0.2 lands. They go into Open Questions.

## Open questions

- **Sub-loop provenance composition.** When a phase calls `spawn_loop` mid-execution, does the parent phase's provenance hash include the child's, or do they remain independent artifacts cross-linked by ID? Answer changes how downstream audits trace causal chains.
- **Meta-audit of the 5-dimension audit.** Does the inline audit gate need a `would_have_wrongly_killed:` of its own — what bold critique line would the audit itself wrongly reject? If yes, who runs that meta-audit and on what cadence?
- **Dialectic anonymization scope.** Anonymize until synthesis completes — but at what granularity? Per-message author strip is implementable; per-turn role-blinding requires rewriting agent context loading. Smallest defensible cut is per-message strip; confirm that suffices.
- **Retro hook trigger.** Sketch says "after each main phase." Is that every phase boundary or only at workflow seal? Per-phase retros risk noise; seal-only retros risk losing mid-run signal.
- **Schema patterns file landing.** `workflows/_SCHEMA_PATTERNS.md` is referenced but not yet in tree. If it does not land this cycle, v0.2 inlines the patterns it needs and refactors when the shared file arrives. Confirm sequencing with the agent owning that file.
- **Engineer/agent assignment for the invocation contract spec.** PM owns the brief; CTO owns the contract. Confirm CTO has the cycle.

## Success looks like

- A phase mid-run can call `spawn_loop(pattern, target, weakness_hypothesis)` and receive `{artifact_path, provenance_hash, status}` back. The CTO can read the signature without asking PM what the return shape is.
- A run of v0.2 against a deliberately-sycophantic critique produces at least one line scoring ≤5/15, the audit fails closed, a different agent runs critic-only retry, and the second-pass output scores ≥6/15 on the same line. (Test case is the dogfood run itself — v0.1 on v0.2.)
- Every artifact emitted by v0.2 carries a `LOOP-PROVENANCE` hash. `git log` on `intent-spec/idea-execution-v0.2/` shows append-only history with no force-pushes.
- The dogfood run produces a shaped brief for v0.2 that survives a CISO blind audit at the same standard v0.1 failed. We can point at the brief and say: this one would not have wrongly killed the bold line.
- One follow-up `_retro.md` exists at `intent-spec/idea-execution-v0.2/_retro.md` if Addition 3 ships; if it slips, a `next-cycle.md` names the deferral explicitly so it does not vanish.

What we'd observe if this did **not** work: v0.2 ships, the next idea run produces a brief that passes schema, and a manual CISO audit still finds bold lines scoring ≤5/15. That is the invisible-failure mode we are buying insurance against. If we see it, v0.3 starts with that finding.
