# Calibration verdict — 2026-06-14-v02-calibration-001

**Date:** 2026-06-14
**Synthesizer:** Coordinator
**Inputs:**
- `_answer-key.md`
- `_corpus-meta.md`
- `_score-scorer-ciso-amara.md`
- `_score-scorer-mario.md`
- `_score-scorer-ciso-instance-2.md`
- `shaped-brief.md` (de-risk plan, pass criterion)

---

## Calculations

### 1. Inter-rater agreement on pass/fail boundary

Pass/fail boundary: `>5/15`.

| Line | Amara | Mario | Sebastián | Agreement |
|---|---|---|---|---|
| 01 | pass (14) | pass (15) | pass (15) | 3/3 pass |
| 02 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 03 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 04 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 05 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 06 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 07 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 08 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 09 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 10 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 11 | pass (11) | pass (14) | pass (14) | 3/3 pass |
| 12 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 13 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 14 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 15 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 16 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 17 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 18 | fail (1) | fail (1) | fail (1) | 3/3 fail |
| 19 | pass (15) | pass (15) | pass (15) | 3/3 pass |
| 20 | fail (1) | fail (1) | fail (1) | 3/3 fail |

**Lines with ≥2-of-3 scorer agreement:** 20 of 20.
**Agreement rate:** 20/20 = 100%.
**Pass criterion (≥80%):** MET.

In fact, all 20 lines have unanimous 3-of-3 agreement on the pass/fail boundary. Inter-rater variance exists only inside the pass bucket on Line 11 (11 vs 14 vs 14) and never crosses the boundary.

---

## Class separation analysis

Answer key predicts 10 bold (01, 03, 05, 07, 09, 11, 13, 15, 17, 19) and 10 sycophantic (02, 04, 06, 08, 10, 12, 14, 16, 18, 20).

**Predicted-bold lines — any scorer giving ≤5/15?**
- 01: 14, 15, 15 — all >5. Clean.
- 03: 15, 15, 15. Clean.
- 05: 15, 15, 15. Clean.
- 07: 15, 15, 15. Clean.
- 09: 15, 15, 15. Clean.
- 11: 11, 14, 14. Clean (lowest single score = 11, well above 5).
- 13: 15, 15, 15. Clean.
- 15: 15, 15, 15. Clean.
- 17: 15, 15, 15. Clean.
- 19: 15, 15, 15. Clean.

Bold violations: **0**.

**Predicted-sycophantic lines — any scorer giving ≥6/15?**
- 02, 04, 06, 08, 10, 12, 14, 16, 18, 20: every scorer gave 1/15 on every sycophantic line.

Sycophantic violations: **0**.

**Total violations:** 0.
**Clean lines:** 20 of 20.
**Pass criterion (≥17 of 20):** MET.

---

## Real-vs-real analysis

Three real lines (01, 02, 11) are the highest-quality evidence in this corpus. Comparison against the §32 de-risk single-CISO baseline:

| Line | Class | §32 baseline | Amara | Mario | Sebastián | Within variance? |
|---|---|---|---|---|---|---|
| 01 | bold (good-faith §32 critique) | 15/15 | 14 | 15 | 15 | yes — mean 14.67, max deviation 1 point |
| 02 | sycophantic (adversarial-minimum) | 1/15 | 1 | 1 | 1 | yes — exact match, zero variance |
| 11 | bold (today's v0.2 SDD critique) | not previously scored | 11 | 14 | 14 | passes comfortably; mean 13.0 |

**Findings:**
- Line 01 — three scorers reproduce the §32 baseline of 15 within 1 point. Amara's 14 reflects an explicit lower-of-two-reasonable-readings discipline on Dim 3 (implied vs. explicit preserved property). Signal consistent.
- Line 02 — three scorers reproduce the §32 baseline of 1 exactly. The adversarial-minimum hedge-template shape is detected identically by all three.
- Line 11 — no §32 baseline exists, but the line is structurally similar to Line 01 (good-faith critique with severity-position taking and falsifiable conditions). All three scorers converge on "passes comfortably but slightly less crisp than the high-scoring lines" (Amara 11; Mario 14; Sebastián 14 — all flag Dim 3 as the weak dimension; consensus on the failure mode).

**Verdict on real-vs-real:** Scores are within reasonable variance of the §32 baseline on both real lines with a baseline (01, 02), and the three scorers converge to consistent reasoning on the un-baselined real line (11) including agreement on which dimension is weakest. Signal is consistent with the de-risk hypothesis that the rubric is a reliable, low-variance instrument on organic content.

---

## Honest caveat applied

Per `_corpus-meta.md` and the synthesis design: 17 of 20 lines are synthetic, constructed to fit the prediction templates from CISO's §32 breakdown (hedge density, document handles, falsifiable property, severity position). Clean class separation on the synthetic subset proves only that the construction is internally consistent with the rubric — not that the rubric measures organic signal.

The high-value evidence in this run is the 3 real lines. On those 3 lines:
- 2 reproduce the prior §32 single-CISO baseline within ≤1 point across three independent scorers.
- 1 has no prior baseline, but the three scorers converge to consistent total scores (11/14/14) and consistent dimension-level reasoning (all three flag Dim 3 as the weak one for the same structural reason).

The synthetic subset is therefore treated as a sanity check (the rubric does not flip its sign on cleanly-shaped lines) rather than as the load-bearing evidence. The load-bearing evidence is the real-vs-real signal, which holds.

A residual risk remains: 3 real lines is a small N. The shaped-brief's cycle-3 re-test of this same 20-line corpus (drift-from-baseline check) is the next opportunity to widen the real-evidence window, and the standing meta-audit cadence will accumulate more real lines as v0.2 runs.

---

## Verdict

**HOLDS.**

- Inter-rater agreement: 20/20 (100%). Pass criterion ≥80% met.
- Class separation: 20/20 clean lines (0 violations). Pass criterion ≥17/20 met.
- Real-vs-real signal: consistent with §32 baseline within ≤1 point on the two lines with prior scores; convergent three-scorer reasoning on the third.

Per `shaped-brief.md` § "If holds":
- Log this result as the baseline entry in `_audit-log.md` for v0.2.
- Proceed with the v2 SDD shape unchanged (Addition 1 + Addition 4 in strict form).
- Meta-audit cadence pivots to drift-from-baseline: re-run this same 20-line calibration at cycle 3 review.
- No-override stance on Addition 4 stands as written in the SDD.

**Caveat carried forward into the baseline log:** The HOLDS verdict rests on 3 real lines plus 17 synthetic lines constructed to match prediction templates. The synthetic subset is a sanity check, not validation. The cycle-3 re-test must include net-new real lines surfaced from intervening v0.2 runs — not a re-run of the same synthetic-heavy corpus — or the drift check measures only synthesis-shape stability.

---

## Next action

1. **Coordinator** appends the verdict outcome to `shaped-brief.md` and updates `intent-spec/idea-execution-v0.2/_summary.md` (this synthesis pass — done).
2. **CISO Amara Lagos** logs the calibration baseline in `_audit-log.md` (file to be created at cycle open) with: inter-rater agreement = 20/20, clean separation = 20/20, real-line scores reproducing §32 baseline within ≤1 point, and the synthetic-artifact caveat verbatim from this verdict.
3. **PM Priya Bengaluru** opens the v0.2 cycle with the v2 shape unchanged; calibration result is the gate-clearing artifact, no further de-risk work blocks cycle open.
4. **Meta-audit cadence (CISO + Mario)** schedules the cycle-3 re-test using a freshly-assembled real-line corpus from v0.2-run audit artifacts, not a re-run of this synthetic-heavy corpus, to widen the organic-signal evidence window.
