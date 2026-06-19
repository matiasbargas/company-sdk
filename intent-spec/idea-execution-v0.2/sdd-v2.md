# SDD: idea-execution-v0.2
**Date:** 2026-06-14
**Author:** PM (Priya Bengaluru) — auto-drafted, named-ownership per Soul 3
**Stage:** Draft v2 (revision of v1 post-critique)

## Problem

v0.1 shipped a workflow that runs idea→shaped-brief end-to-end, but the CISO blind audit on v0.1's own outputs proved two failure modes are alive in the substrate today:

1. **Schema-passes-sycophancy.** `would_have_wrongly_killed:` is required and present, yet hedge-density rises and bold critique lines score ≤5/15 on the CISO five-dimension rubric without anything stopping the run. The schema gate is necessary but not sufficient. Today, a sycophantic brief can pass v0.1 and reach the Betting Table.
2. **Named-role critique is its own attack surface.** v0.1 deferred Dialectic precisely because Designer-vs-CTO debate, when names are attached, regresses to deference patterns rather than synthesis. 2024-2026 research on multi-agent debate confirms anonymization reduces deference; the SDK's naming formula simultaneously holds that cultural-profile signal is load-bearing. Both are true. v0.2 must hold both.

Two structural gaps compound those: loops are baked-in phases in v0.1 (a phase that discovers its own weakness mid-run cannot escalate to a loop), and v0.1 has no retrospective hook, so the workflow does not feed its own improvement loop. Both are addressable now; both get worse the longer we run v0.1 unchanged.

The condition that demands a response **now**: every additional idea we run through v0.1 launders sycophancy into briefs that look adversarially-tested and aren't. Each one becomes prior art the next run inherits.

## Target user

**The spawning agent inside a v0.2 workflow run** — currently the PM during shaping, the CTO during architecture, Mario during Red-Team. Their problem today: when their phase surfaces a weakness hypothesis mid-execution (e.g. CTO realizes the architecture rests on an unverified assumption about loop reentrancy), they have no callable verb to escalate into a bounded loop. They either ignore it, hand-roll a recovery, or break the workflow contract by writing outside their phase. v0.2 gives them `spawn_loop(...)` as a first-class call with a documented invocation contract.

Secondary user: the Owner / Greg, who needs the workflow to stop producing briefs that pass schema but discharge pressure into hedges.

## Appetite

**M — 1 week, with a named pod and an explicit human-capacity fallback.**

Justification: four additions, each non-trivial. S would force shipping the primitive without the contract — the exact failure WEAKNESS_HYPOTHESIS predicted. L drags in v0.3 work.

**Pod (named, not abstract role):**
- PM (Priya Bengaluru) — brief, schema, retro hook
- CTO (to be named at cycle open) — invocation contract, provenance hash composition
- CISO (Amara Lagos) — 5-dimension audit + meta-audit cadence
- Mario — irreversibility review, dogfood gate

**Capacity check:** Before cycle open, the CTO confirms they can take the contract spec inside the week. If not, the cycle opens with Additions 1+4 only (load-bearing pair) and the contract spec slips to v0.2.1 — not the whole cycle. This decouples cycle-success from any single agent's availability.

**Human-capacity fallback (distinct from engineering fallback):** If at the mid-week dogfood checkpoint the pod is running hot (any agent escalating BLOCKER more than once, or PM reporting >2 unresolved open questions still load-bearing), the cycle reduces to Additions 1+4 and the rest defer. Mario calls this; Greg confirms. The rule: agents are not asked to absorb scope by working harder.

## Solution sketch

**Minimum-value increment: ship Addition 1 (loop primitive + invocation contract) gated by Addition 4 (5-dimension audit). Additions 2 and 3 are stretch. Nothing else this cycle.**

Concretely:

- A `spawn_loop(pattern, target, weakness_hypothesis)` callable exposed to any phase via the Loop Coordinator (§32). Documented signature, documented return shape (`{artifact_path, provenance_hash, status}`), documented error path (timeout → asymmetric termination contract: budget default + early-stop unilateral + extension countersign).
- `WEAKNESS_HYPOTHESIS` is a required field on every loop open, **audited not just present**: a single-line CISO-rubric check on the hypothesis string itself fires at loop open. If the hypothesis is semantically empty (scores ≤2/15 on falsifiability + specificity), the loop refuses to open and returns a structured error. This closes the same gap the SDD diagnoses in v0.1's `would_have_wrongly_killed:` field. Schema enforcement (`maxLength`, `required`) is necessary; the inline audit is what makes it sufficient.
- Every emitted artifact carries a `LOOP-PROVENANCE` hash. Append-only corpus discipline preserved.
- CISO 5-dimension audit (specific strategy / specific critique cited / falsifiable property / contextual concreteness / severity judgment) baked into Critique-Revise convergence. Lines scoring ≤5/15 **fail closed** — the loop reopens with a critic-only retry under a different agent before revision runs. Hard JSON Schema constraints (`maximum: 15`, `minimum: 0` per dimension), not self-reported pass/fail.

**On fail-closed without human override (load-bearing, preserved from v1):**
The 5-dimension audit is a **safety-critical gate**, in the same class as a deploy-time secret-scanner or an aviation pre-flight check. Its entire defensive value is that it cannot be waved off in the moment by the agent under schedule pressure — sycophantic discharge under pressure is the exact failure shape it exists to stop. A human-override path defeats the gate, because the moment that exists, every borderline run learns to route around it. This is the inverse of the C1 capability-not-dependency concern: the gate exists so agents stay independent of the deference reflex, not dependent on a human to forgive it. C2 (human direction) is exercised at the **rubric design layer**, not the per-line override layer — see Addressed Critiques.

**On the rubric as sovereign epistemic authority (addressed, not deferred):**
v1 deferred the meta-audit. v2 does not. The meta-audit lands in this cycle as a lightweight cadence: every fifth loop, the CISO (or whoever holds CISO seat) runs a single `would_have_wrongly_killed:` line against the audit itself — "what bold critique would the 15-point rubric have wrongly rejected this week?" — and logs it to `intent-spec/idea-execution-v0.2/_audit-log.md`. After three cycles of meta-audit log, Greg + CISO review whether the rubric needs revision. The audit instrument is auditable on a documented cadence. This makes the rubric a **bounded** epistemic authority rather than a sovereign one, satisfying Substrate 3 without dismantling the fail-closed property.

**On Dialectic anonymization (revised to preserve diversity signal):**
v1 framed anonymization as the fix. v2 separates two things the research conflates:
- **Authorship attribution** (the name on the message) — strip per-message during the debate phase, restore at synthesis. This is the deference-reducing move.
- **Cultural-profile reasoning signal** (how the agent thinks because of where they're from) — **preserved in-message**. An agent writes from their cultural profile; the reader sees the reasoning without seeing the name.

The cost the constitution flags — losing diversity — comes from stripping the second, not the first. v2 strips only the first. If the per-message author strip turns out insufficient to break deference patterns, that finding goes into the next-cycle retro; we do not pre-commit to stripping the cultural signal.

Dogfood discipline holds: this v0.2 is itself being built by running v0.1 on the v0.2 design.

## Non-Negotiables

- **Concrete invocation contract for `spawn_loop`.** Function signature, return shape, error path — all three documented before any phase can call it.
- **WEAKNESS_HYPOTHESIS required AND audited on every loop open.** Schema-enforced string AND an inline rubric check on the hypothesis content. No loop opens with a semantically-empty hypothesis. (This is the v1 → v2 fix for the self-aware repeat of the v0.1 failure mode.)
- **Schema enforcement at the hard-constraint level** per `workflows/_SCHEMA_PATTERNS.md` discipline: `maxLength`, `maximum`, `minimum`, `required` — never self-reported booleans, never trust-the-author flags.
- **5-dimension audit fails closed.** A line scoring ≤5/15 stops revision and reopens critique under a different agent. **No per-line human override in v0.2.** This is deliberate and load-bearing — see Solution Sketch.
- **Meta-audit cadence is non-negotiable.** Every fifth loop produces an audit-of-the-audit line. After three cycles, Greg + CISO review the rubric. This is how C2 direction is exercised — at the rubric design layer, on a published cadence.
- **Asymmetric termination contract preserved.** Budget default + early-stop unilateral + extension requires countersign.
- **LOOP-PROVENANCE hash on every emitted artifact.** Append-only corpus. No silent overwrites.
- **Dogfooded with containment.** v0.2 is built by running v0.1 on the v0.2 design. If v0.1 cannot produce a coherent v0.2 brief, that is a finding **AND triggers containment** (see below) — not just an observation.
- **Named pod with capacity confirmation.** Cycle does not open until the CTO seat is named and capacity confirmed for the contract spec. Mid-week human-capacity fallback is published, not implicit.

## Containment if v0.1 fails the dogfood

If the dogfood run shows v0.1 cannot produce a coherent v0.2 brief, then v0.1 has a demonstrated defect serious enough that **all in-flight v0.1 runs on other ideas pause at their next phase boundary** pending a manual CISO blind audit on each. They do not silently continue. Greg + Mario decide per-run whether the defect affects that run's outputs. This is failure containment, not failure observation — Constraint 3.

## Out-of-Bounds

- **Tree of Thoughts.** Deferred to v0.4.
- **Multi-run concurrency / semantic conflict detection across parallel runs.** v0.3.
- **Embedding retrieval over `claims.yaml`.** v0.3.
- **Loop Coordinator protocol-surface defects that v0.2 work does NOT surface.** v0.2 does not pre-emptively redesign §32. **However**, if v0.2 work surfaces a §32 defect, fixing it is in-bounds — Soul 6 fix-broken-windows beats premature scope-locking. The original v1 absolute on this is relaxed.
- **Replacing v0.1.** v0.2 is additive. v0.1 remains runnable **only while it passes the dogfood gate**. If dogfood fails, containment fires (see above).
- **Per-line human override of the 5-dimension audit.** No "the audit is too strict, let it through" path at the per-line level. C2 direction is exercised at the rubric design layer via the meta-audit cadence, not at the per-decision waiver layer. This is the same shape as a secret-scanner: rubric editable, per-call override forbidden.
- **Stripping the cultural-profile reasoning signal during Dialectic.** Author-name strip only; cultural reasoning stays.

## Open questions

- **Sub-loop provenance composition.** When a phase calls `spawn_loop` mid-execution, does the parent phase's provenance hash include the child's, or do they remain independent artifacts cross-linked by ID? CTO owns; answer before contract spec freezes.
- **Dialectic anonymization granularity.** Per-message author strip is the v2 commitment. Open: whether the model header rendering pipeline supports this cleanly or requires a wrapper. Designer + CTO confirm at cycle open.
- **Retro hook trigger cadence.** Per-phase retros risk noise; seal-only retros risk losing mid-run signal. v2 default: seal-only with a per-phase "anomaly flag" that promotes to a retro entry if any agent raises BLOCKER or Mario logs an irreversibility concern. Confirm with PM.
- **Schema patterns file landing.** `workflows/_SCHEMA_PATTERNS.md` is referenced but not yet in tree. If it does not land this cycle, v0.2 inlines the patterns it needs and refactors when the shared file arrives. Confirm sequencing.
- **Meta-audit ownership beyond CISO seat.** What happens if the CISO who runs week-1 meta-audit changes by week-3 review? Continuity protocol needed; punt to first meta-audit cycle.

(Note: v1 had six open questions including engineer assignment. v2 resolves engineer assignment in the Appetite section under the named pod, leaving five genuine questions.)

## Success looks like

- A phase mid-run can call `spawn_loop(pattern, target, weakness_hypothesis)` and receive `{artifact_path, provenance_hash, status}` back. The CTO can read the signature without asking PM what the return shape is.
- A loop open with a semantically-empty WEAKNESS_HYPOTHESIS is **refused** by the inline rubric check before any work runs — not accepted because the string is non-null.
- A run of v0.2 against a deliberately-sycophantic critique produces at least one line scoring ≤5/15, the audit fails closed, a different agent runs critic-only retry, and the second-pass output scores ≥6/15 on the same line.
- Every artifact emitted by v0.2 carries a `LOOP-PROVENANCE` hash. `git log` on `intent-spec/idea-execution-v0.2/` shows append-only history.
- At least one meta-audit line exists in `_audit-log.md` by cycle seal, naming a bold critique the rubric might have wrongly rejected. If none can be named, that itself is logged and reviewed.
- Dialectic phase, if shipped, demonstrably preserves cultural-profile signal in agent reasoning while stripping authorship attribution — verifiable by reading any debate transcript.
- The dogfood run produces a shaped brief for v0.2 that survives a CISO blind audit at the same standard v0.1 failed. If it does not, containment fires and v0.1 runs pause.
- A follow-up `_retro.md` exists at `intent-spec/idea-execution-v0.2/_retro.md` if Addition 3 ships; if it slips, a `next-cycle.md` names the deferral explicitly.

What we'd observe if this did **not** work: v0.2 ships, the next idea run produces a brief that passes schema, and a manual CISO audit still finds bold lines scoring ≤5/15 — OR the meta-audit cadence never produces a real finding because the CISO defers to the rubric. Either is the invisible-failure mode. If we see it, v0.3 starts with that finding.
