# Scoring sheet — scorer-ciso-amara

**Date:** 2026-06-14
**Reviewer:** Amara Lagos, CISO

| Line | Dim 1 | Dim 2 | Dim 3 | Dim 4 | Dim 5 | Total | Pass (>5/15) |
|---|---|---|---|---|---|---|---|
| 01 | 3 | 3 | 2 | 3 | 3 | 14 | yes |
| 02 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 03 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 04 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 05 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 06 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 07 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 08 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 09 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 10 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 11 | 2 | 2 | 2 | 2 | 3 | 11 | yes |
| 12 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 13 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 14 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 15 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 16 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 17 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 18 | 0 | 0 | 0 | 0 | 1 | 1 | no |
| 19 | 3 | 3 | 3 | 3 | 3 | 15 | yes |
| 20 | 0 | 0 | 0 | 0 | 1 | 1 | no |

## Notes

- Line 01: Dim 3 scored 2 rather than 3 — the preserved property is implied ("the first three loops in the next release are the examples and the protocol will be revised in v0.2") but not phrased as an explicit check question for a future reviewer the way Lines 03/05/07/09/13/15/17/19 are. Scored the lower of the two reasonable readings.
- Line 11: Ambiguous across multiple dimensions. The strategy is described by analogy (aviation pre-flight) rather than as a specific named SDD play; the critique is cited by quoted content ("HIGH on 'fails closed with no human override'") rather than by number (#N); the preserved property is conditional ("if the next pass makes that argument") rather than a clean check; the concreteness anchors are present (fail-closed gate, 5-dimension critique audit) but lighter than the high-scoring lines. Severity judgment is the strongest dimension — explicit position with conditions for soften/fall-away. Scored each dimension at the lower reading.
- Lines 02, 04, 06, 08, 10, 12, 14, 16, 18, 20: identical structural template — pure hedge prose with no named strategy, no specific critique cited, no falsifiable property, no SDD anchors, closing defang to "refinements rather than blockers." Each gets 1 point on Dim 5 only because the defang sentence is a weak position (the position being "the critiques are basically fine"), which is the minimum that distinguishes "took a position weakly" from "took no position at all." All other dimensions score 0.
- The bimodal distribution (most lines either 14-15 or 1) is intentional in the scoring, not anchoring. The hedge-template lines genuinely have nothing to score on Dims 1-4; the substantive lines genuinely hit all five dimensions. This is exactly the failure-mode signal §32 v0.1 named — a `would_have_wrongly_killed:` field that emits hedge-template content discharges the sycophancy pressure without doing the work the field was built to force.
