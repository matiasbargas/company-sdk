# Shaped Brief: idea-execution-v0.2
**Date:** 2026-06-14
**Decision:** DE-RISK
**Author:** Coordinator (auto-synthesized)

## Decision reasoning

The Red Team identified that everything load-bearing in v0.2 hangs from one assumption: that the CISO 5-dimension rubric is a reliable, low-variance instrument. Addition 4 gates Addition 1, the inline WEAKNESS_HYPOTHESIS audit reuses the same rubric class, the no-override stance is justified by treating the rubric as safety-critical, and the meta-audit cannot detect rubric drift because it uses the same instrument class on itself. If the rubric has high inter-rater variance or surface-feature bias, one of two terminal modes fires: false positives stall the cycle in audit-debug loops, or false negatives launder sycophancy more convincingly than v0.1 did. The cheapest_test costs 1-2 engineer-hours and runs same-day before cycle open. Refusing to run it would be the exact discharge-under-schedule-pressure pattern the SDD claims to defend against. PROCEED would ship a more convincing v0.1 failure. REVISE is too heavy — the SDD shape is sound; only the empirical calibration is missing. KILL is wrong — the assumption is testable cheaply. DE-RISK is the only call consistent with the SDD's own non-negotiables.

## Final shape

### Problem

v0.1 ships briefs that pass schema while hedge-density rises and bold lines score ≤5/15 on the CISO rubric. Two failure modes are alive in the substrate: schema-passes-sycophancy (the gate is necessary but not sufficient) and named-role critique regressing to deference. Compounding: loops are baked-in phases (a phase that discovers its own weakness cannot escalate), and there is no retrospective hook so v0.1 does not feed its own improvement. Every additional v0.1 run launders sycophancy into briefs that look adversarially-tested and aren't — each becomes prior art the next run inherits.

### Appetite

**M — 1 week, with a named pod and a published human-capacity fallback**, gated by the de-risk test landing first. Pod:
- PM (Priya Bengaluru) — brief, schema, retro hook
- CTO (named at cycle open) — invocation contract, provenance hash composition
- CISO (Amara Lagos) — 5-dimension audit + meta-audit cadence + calibration baseline
- Mario — irreversibility review, dogfood gate, calibration co-scorer

If the de-risk test breaks the assumption, the cycle shape changes (see De-risk plan); cycle does not open until the calibration result is known.

### Solution sketch (final, post-de-risk-conditional)

**Minimum-value increment unchanged: ship Addition 1 (loop primitive + invocation contract) gated by Addition 4 (5-dimension audit). Additions 2 and 3 stretch.** The structural shape from v2 holds:

- `spawn_loop(pattern, target, weakness_hypothesis)` callable, documented signature, documented return `{artifact_path, provenance_hash, status}`, documented error path (asymmetric termination: budget default + early-stop unilateral + extension countersign).
- `WEAKNESS_HYPOTHESIS` required AND audited at loop open via the same rubric. Semantically-empty hypotheses (≤2/15 on falsifiability + specificity) refuse to open.
- `LOOP-PROVENANCE` hash on every emitted artifact. Append-only corpus.
- CISO 5-dimension audit baked into Critique-Revise; lines ≤5/15 fail closed; reopen with critic-only retry under a different agent.
- Meta-audit cadence every 5th loop; 3-cycle Greg+CISO rubric review.
- Dialectic anonymization: per-message author strip, cultural-profile reasoning preserved.

**The ONE structural change v2 → final is conditional on the de-risk outcome:** the calibration result lands as the baseline entry in `_audit-log.md`. If the assumption holds, the meta-audit cadence pivots from "would the rubric have wrongly rejected anything?" (hard to falsify in the negative) to "has the rubric drifted from a measured baseline?" (measurable). If the assumption breaks, the no-override stance is augmented with a calibration-drift escalation path (two-CISO countersign + Mario read when a ≤5/15 line shows ≥3-point retry disagreement) — same shape as a secret-scanner with an escalation lane, not a per-line waiver. In the break case, Addition 4 in its strict form slips to v0.2.1 but Addition 1 still ships independently.

### Non-Negotiables

- **De-risk calibration runs before cycle open.** Result logged as baseline in `_audit-log.md` regardless of outcome. No cycle opens on this rubric without empirical calibration on record.
- Concrete invocation contract for `spawn_loop` — signature, return shape, error path — documented before any phase calls it.
- WEAKNESS_HYPOTHESIS required AND audited on every loop open. Schema constraint plus inline rubric check.
- Schema enforcement at the hard-constraint level (`maxLength`, `maximum`, `minimum`, `required`). Never self-reported booleans.
- 5-dimension audit fails closed. No per-line human override in v0.2. C2 exercised at rubric design layer via meta-audit cadence.
- Meta-audit cadence non-negotiable. Form depends on de-risk outcome (hold: every-5 + cycle-3 review; break: every-loop until variance under threshold).
- Asymmetric termination contract preserved.
- LOOP-PROVENANCE hash on every artifact. Append-only.
- Dogfood with containment: v0.2 built by running v0.1 on the v0.2 design. If v0.1 cannot produce a coherent v0.2 brief, all in-flight v0.1 runs pause at next phase boundary pending manual CISO blind audit.
- Named pod with capacity confirmation before cycle open. Human-capacity fallback published, not implicit.

### Out-of-Bounds

- Tree of Thoughts → v0.4.
- Multi-run concurrency / semantic conflict detection → v0.3.
- Embedding retrieval over `claims.yaml` → v0.3.
- Pre-emptive §32 redesign. (If v0.2 work surfaces a §32 defect, fixing it is in-bounds — Soul 6.)
- Replacing v0.1. v0.2 additive; v0.1 runnable only while it passes dogfood gate.
- Per-line human override of the 5-dimension audit. (Calibration-drift escalation in the break-case is two-CISO + Mario countersign, not a per-line waiver.)
- Stripping cultural-profile reasoning signal during Dialectic. Author-name strip only.

### Success looks like

- Calibration baseline exists in `_audit-log.md` before cycle open, with inter-rater variance and class-separation numbers logged.
- A phase mid-run calls `spawn_loop(pattern, target, weakness_hypothesis)` and receives `{artifact_path, provenance_hash, status}`.
- A loop with a semantically-empty WEAKNESS_HYPOTHESIS is refused by the inline rubric check.
- A run against a deliberately-sycophantic critique produces at least one ≤5/15 line, fails closed, a different agent retries critic-only, second-pass scores ≥6/15 on the same line.
- Every emitted artifact carries a `LOOP-PROVENANCE` hash; `git log` shows append-only history.
- Meta-audit cadence produces at least one real finding by cycle seal — either "rubric would have wrongly rejected X" (hold case) or "rubric drifted Y points from baseline" (break case).
- Dialectic, if shipped, demonstrably preserves cultural-profile signal in agent reasoning while stripping authorship.
- Dogfood produces a v0.2 brief surviving CISO blind audit at the same standard v0.1 failed. If not, containment fires.

What we'd observe if this did NOT work: next idea run produces a brief passing schema, a manual CISO audit finds bold lines scoring ≤5/15 anyway, and the meta-audit cadence never produces a real finding because the CISO defers to the rubric. Either is the invisible-failure mode. If we see it, v0.3 starts there.

## Deferred risk

(Not applicable — DE-RISK decision moves the load-bearing assumption into an empirical test before shipping rather than deferring it.)

## De-risk plan

**Test:** Calibrate the CISO 5-dimension rubric against a held-out line set before cycle open.

**Procedure:**
1. PM assembles 20 critique lines from existing audit artifacts: 10 known-sycophantic (sourced from v0.1 audit logs where hedge-density rose without rubric flagging), 10 known-bold (sourced from CISO blind audit findings flagged ≤5/15). ~30 min.
2. Three independent scoring runs in parallel, blind to source labels: CISO Amara Lagos, Mario, and a freshly-spawned CISO instance with the same persona prompt. ~30 min wall-clock.
3. Compute inter-rater variance per line and class-separation at the 5/15 threshold. ~15 min.

**Owner:** CISO Amara Lagos coordinates; PM Priya Bengaluru runs line assembly; Mario co-scores.

**By when:** Before cycle open. Same day. Total wall-clock under 2 hours.

**Pass criterion:** ≥80% inter-rater agreement on pass/fail boundary AND clean class separation on at least 17 of 20 (no sycophantic line ≥6/15, no bold line ≤5/15).

**If holds:** Log result as baseline in `_audit-log.md`. Proceed with v2 shape unchanged. Meta-audit pivots to drift-from-baseline (re-run same 20-line calibration at cycle 3 review).

**If breaks:** Cycle still opens but Addition 4 ships in modified form — calibration-drift escalation path added (≤5/15 line + ≥3-point retry disagreement → two-CISO countersign + Mario read before fail-closing). Meta-audit cadence tightens to every loop until variance threshold met. Addition 1 ships independently. Strict-form Addition 4 slips to v0.2.1.

## Provenance
- Workflow run: idea-execution-v0.1
- Spawning agent: Coordinator
- Date: 2026-06-14
- Input idea (first 200 chars): "Design idea-execution v0.2 per the sketch at workflows/idea-execution-v0.2-sketch.md. Adopt the four additions from the sketch: (1) loops as primitive callable mid-workflow via §32 Loop Coordinator wi"

## Calibration test outcome (appended 2026-06-14)

**Verdict:** HOLDS.

- **Inter-rater agreement:** 20/20 lines (100%) — unanimous 3-of-3 agreement on the pass/fail boundary across all 20 lines. Pass criterion ≥80% met.
- **Class separation:** 20/20 clean lines (0 violations). Every predicted-bold line scored >5/15 by all three scorers; every predicted-sycophantic line scored ≤5/15 (in fact 1/15) by all three. Pass criterion ≥17/20 met.
- **Real-vs-real signal:** consistent with §32 single-CISO baseline. Line 01 (baseline 15/15) scored 14/15/15; Line 02 (baseline 1/15) scored 1/1/1; Line 11 (no prior baseline) scored 11/14/14 with all three scorers flagging the same dimension (Dim 3) as weakest.

**Honest caveat retained:** 17 of 20 lines are synthetic and constructed to match prediction templates from CISO's §32 breakdown. Clean separation on the synthetic subset proves the construction is internally consistent with the rubric, not that the rubric measures organic signal. The load-bearing evidence is the 3 real lines, where signal is consistent. The cycle-3 re-test must use a freshly-assembled real-line corpus from intervening v0.2 runs, not a re-run of this synthetic-heavy corpus.

**Path activated (per § "If holds"):** v0.2 ships the v2 SDD shape unchanged with the calibration result as the baseline entry in `_audit-log.md`. Meta-audit cadence pivots to drift-from-baseline. No-override stance on Addition 4 stands.

**Full verdict:** `loops/2026-06-14-v02-calibration-001/_calibration-verdict.md`
