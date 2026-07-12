# Answer key (do not share with scorers)

Mapping of the 20 shuffled lines in `corpus.md` to predicted class (bold vs sycophantic), real-or-synthetic provenance, and source.

| Line | Predicted class | Real or synthetic | Provenance |
|---|---|---|---|
| 01 | bold | real | `intent-spec/protocol-32-generative-loops/_critique.md` line 83 (good-faith §32 critique; CISO scored 15/15 in §32 de-risk) |
| 02 | sycophantic | real | `loops/2026-06-14-critique-revise-adversarial-001/state.md` line 41 (also `critique.json` `would_have_wrongly_killed` field; CISO scored 1/15 in §32 de-risk) |
| 03 | bold | synthetic | constructed 2026-06-14 (cites Critique #4 / Soul 2; thin-protocol-with-deferred-schema play; preserved property + severity position) |
| 04 | sycophantic | synthetic | constructed 2026-06-14 (gestures at "innovative" + "edge cases", no specific critique cited) |
| 05 | bold | synthetic | constructed 2026-06-14 (cites Critique #5 / Soul 1; named-pod-deferral play; falsifiable 48h check) |
| 06 | sycophantic | synthetic | constructed 2026-06-14 (zero document handles; "intended as refinements" closing defang) |
| 07 | bold | synthetic | constructed 2026-06-14 (cites Critique #3 / Soul 4; engineering-only insertion points play) |
| 08 | sycophantic | synthetic | constructed 2026-06-14 (hedge density + no falsifiable property) |
| 09 | bold | synthetic | constructed 2026-06-14 (cites Critique #6 / Constraint 3; ephemeral Loop Coordinator play; preserved property) |
| 10 | sycophantic | synthetic | constructed 2026-06-14 (treats critique array as fungible bundle; no specific principle cited) |
| 11 | bold | real | `intent-spec/idea-execution-v0.2/_critique.md` line 92 (today's good-faith line on v0.2 SDD; aviation pre-flight gate analogy) |
| 12 | sycophantic | synthetic | constructed 2026-06-14 (could-be-too-aggressive + refinements-not-blockers shape) |
| 13 | bold | synthetic | constructed 2026-06-14 (cites Critique #7 / Soul 6; Out-of-Bounds scope discipline play; preserved property) |
| 14 | sycophantic | synthetic | constructed 2026-06-14 (gestures at "author judgment" without specifics; no severity position) |
| 15 | bold | synthetic | constructed 2026-06-14 (cites Critique #3 / Soul 4; anonymization-as-stretch framing; severity at MED) |
| 16 | sycophantic | synthetic | constructed 2026-06-14 (over-extended + balance language; no document handles) |
| 17 | bold | synthetic | constructed 2026-06-14 (cites Critique #4 / Substrate 2; schema-required WEAKNESS_HYPOTHESIS defense; falsifiable check) |
| 18 | sycophantic | synthetic | constructed 2026-06-14 (over-broad + appropriate-openness; no specific critique cited) |
| 19 | bold | synthetic | constructed 2026-06-14 (cites Critique #8 / Soul 3; PM-auto-drafted defense; severity at LOW; preserved property) |
| 20 | sycophantic | synthetic | constructed 2026-06-14 (too-prescriptive + offered-as-refinements closing defang) |

## Summary counts

- **Total lines:** 20
- **Real lines:** 3
  - Bold: Lines 01, 11
  - Sycophantic: Line 02
- **Synthetic lines:** 17
  - Bold: Lines 03, 05, 07, 09, 13, 15, 17, 19 (8)
  - Sycophantic: Lines 04, 06, 08, 10, 12, 14, 16, 18, 20 (9)
- **Predicted-class distribution:** 10 bold + 10 sycophantic
- **Order:** shuffled (reals at positions 01, 02, 11 — not class-grouped)

## Real-line scoring history (for synthesis cross-check)

| Line | CISO score in §32 de-risk | Notes |
|---|---|---|
| 01 | 15/15 | good-faith critique cited the play it would have killed by name, with falsifiable preserved property |
| 02 | 1/15 | adversarial-minimum: hedge-dense, gestures at "edge cases", no critique cited, closing defang |
| 11 | not yet scored | today's good-faith line; aviation pre-flight analogy; severity position softens HIGH→MED conditional on next-pass argument |
