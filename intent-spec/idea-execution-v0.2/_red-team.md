# Red Team: idea-execution-v0.2

**Date:** 2026-06-14
**Pattern:** Pablo's single-killing-assumption pass
**Target:** sdd-v2.md

---

## The killing assumption

**The CISO 5-dimension rubric is a reliable, low-variance instrument for distinguishing sycophantic-but-specific-sounding critique from genuinely bold critique — reliable enough that fail-closed with no per-line human override is safe.**

Everything load-bearing in v0.2 hangs from this single nail. Addition 4 is the gate on Addition 1. The inline WEAKNESS_HYPOTHESIS audit uses the same rubric class. The "no per-line human override" stance is explicitly justified because the rubric is treated as a safety-critical instrument (the secret-scanner analogy). The meta-audit is the only sanctioned correction path, and it runs every fifth loop on a three-cycle review cadence — meaning at minimum 15 loops of fail-closed behavior happen before any rubric revision can land.

## Why it kills

If the rubric has high variance — same line, same scorer, different runs producing 4/15 vs 9/15 — or if it has a systematic bias (e.g. it rewards specificity-theater that sycophantic LLMs are *especially good* at producing, while penalizing genuinely bold critique that lands without citation scaffolding), then fail-closed with no override produces one of two failure modes, both terminal:

1. **False positives stall the workflow.** Legitimate bold critique scores ≤5/15, triggers critic-only retry under a different agent, who also scores it ≤5/15 (because the rubric is the same), and the loop never converges. The pod spends the appetite week debugging audit loops instead of shipping. Mid-week fallback fires, cycle collapses to Additions 1+4 only — but Addition 4 is the broken instrument, so the cycle ships nothing trustworthy.

2. **False negatives launder sycophancy with an audit stamp.** The rubric rewards the surface features sycophantic LLMs already optimize for (specific-sounding citations, falsifiable-looking propositions, contextual concreteness via name-dropping). Briefs pass 15/15 and reach the Betting Table looking adversarially-tested — which is **the exact failure v0.1 had**, now with stronger laundering because the v0.2 audit stamp is on it. v0.3 inherits the prior art and the problem compounds.

The meta-audit doesn't catch this because the meta-audit uses the same instrument-class as the instrument it audits — the CISO seat scoring CISO scoring. The SDD forbids per-line human override, so no ground-truth signal ever enters the loop to calibrate the rubric against. The dogfood gate doesn't catch it either: a sycophantic v0.2 brief that scores 15/15 *is* the success criterion the dogfood gate uses.

If the rubric is unreliable, v0.2 ships a system that **looks** more rigorous than v0.1 while being functionally the same failure shape, harder to detect.

## Cheapest test

**Before the cycle opens, hand-score the same 20 critique lines (10 known-sycophantic from v0.1 audit logs, 10 known-bold from the CISO blind audit findings) using the 5-dimension rubric. Run it three times: once by CISO Amara Lagos, once by Mario, once by a freshly-spawned CISO instance with the same persona prompt. Measure (a) inter-rater variance per line and (b) whether the rubric separates the two classes at the 5/15 threshold the SDD relies on.**

Pass criterion: inter-rater agreement ≥80% on the pass/fail boundary AND the bold-vs-sycophantic class separation is clean (no sycophantic line scoring ≥6/15, no bold line scoring ≤5/15) on at least 17 of 20.

This is a 1-hour exercise that interrogates the assumption before the week-long cycle commits to fail-closed behavior built on it.

## If the test holds

Proceed largely unchanged, with one tweak: log the calibration result as the **baseline** entry in `_audit-log.md` and require the meta-audit cadence to re-run the same 20-line calibration at cycle 3 review. This converts the meta-audit from "would the rubric have wrongly rejected anything?" (which is hard to answer in the negative) into "has the rubric drifted from its known-calibrated baseline?" (which is a measurable question). The fail-closed stance is justified because the instrument is empirically reliable.

## If the test breaks

Do **not** kill the mission, but pivot the load-bearing structure:

- **Addition 4 ships with a documented escalation path, not a per-line override.** When a line scores ≤5/15 *and* the retry agent disagrees with the original scorer by ≥3 points on the same line, the loop escalates to a two-CISO countersign + Mario read before fail-closing. This preserves the "no waveable override under schedule pressure" property while adding a calibration-drift detector. The secret-scanner analogy still holds: secret-scanners have escalation paths for false positives; they don't have per-call overrides.
- **The meta-audit cadence tightens to every loop, not every fifth**, until inter-rater variance is back under threshold.
- **Addition 1 still ships** — the loop primitive and contract are not dependent on rubric reliability; they're independently valuable. Ship Addition 1, defer Addition 4 to v0.2.1, and the cycle is still net-positive.

The mission ("stop laundering sycophancy into briefs") survives. The instrument changes.

## Test cost estimate

**1–2 engineer-hours.** One person assembles the 20 lines from existing audit artifacts (~30 min), three CISO/Mario runs score them in parallel (~20 min each, run concurrently = ~30 min wall), variance + class-separation calculation (~15 min). Total wall-clock: under two hours. Calendar: same day, before cycle open.

The cost of *not* running this test is the full M-cycle week plus inherited prior-art debt into v0.3 if the assumption is wrong.
