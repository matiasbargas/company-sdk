# Retrospective: protocol-32-generative-loops

**Date:** 2026-06-19
**Workflow:** retrospective (cadence=sprint)
**Overall outcome:** DELIVERED

## Situation

I have everything I need. Producing the summary.

### What was decided

Protocol §32 (Generative Loops) v0.1 was shaped, de-risked, and **SEALED into `protocol.md` as protocol v4.4 on 2026-06-14**. The decision path was DE-RISK → test HOLDS → PROCEED → SEALED. v0.1 ships exactly two critique patterns (Critique-Revise, Red-Team) and one ephemeral agent type (Loop Coordinator, driver-not-judge, Level 3 state machine, no persistence/consultation). Dialectic + author anonymization are explicitly deferred to v0.2 (owner PM, target Q3) with a return ticket. Appetite was M (1 week) plus a ~3-engineer-hour de-risk gate.

### What was promised

- **Mechanical critique contract**: `WEAKNESS_HYPOTHESIS:` required on every loop open (no hypothesis, no loop); `would-have-wrongly-killed:` on every Critique-Revise turn; `assumption-not-attacked:` on every Red-Team turn — all fail closed if absent.
- **Asymmetric termination**: spawning agent early-stops unilaterally; extension needs peer-or-higher countersign; Loop Coordinator has no extension authority.
- **Provenance**: every emitted artifact carries a grep-able `LOOP-PROVENANCE:` line (loop ID + SHA-256); no hash, no gate crossing.
- **Bus records transitions only**; internal turns live in `loops/<id>/state.md`. Three insertion points only (Phase 0, Architecture, Implementation).
- **CISO Periodic Constitutional Line Audit** (claim-008, superseding vague claim-006): quarterly 5-dimension 0–3 scoring; lines ≤5/15 reopen the loop under a different critic; >25% failure declares §32 in breach and accelerates v0.2 anonymization.
- A good-faith worked example ships in `project-template/`.

### What was flagged as risk

- **Red Team's killing assumption**: the constitutional lines are the *only* anti-sycophancy lever; the protocol enforces presence, not quality. Invisible failure (green sdk-health while dissent quality is unchanged) would consume the slot the real v0.2 fix needs.
- **CLO (load-bearing Q3)**: §32 creates a discoverable, audit-standard-bearing, sensitive-content corpus — the exposure profile of an internal audit function. Required (and baked in) before seal: retention policy, `PRIVILEGE_SCOPE` field, explicit discoverability acknowledgment. Owner **consciously accepted** this Q3 exposure (claim-012). Also flagged: Layer A is the wrong constitution for compliance memos (typed `constitution:` arg deferred to v0.2); `assumption-not-attacked:` collides with "risk accepted" term-of-art → aliased `red-team-scope-limit:`.
- **UXR + Designer**: both patterns are shaped for engineering/strategy artifacts. Research Synthesis and design-craft review (accessibility, affordance, compounding-assumption stacks) are now marked `NON_TRIGGER_SHAPE`; craft-constitution and research-synthesis patterns are v0.2/v0.3 return tickets. All three reviews were `should_be_addressed`, none `blocks_seal`, all baked in.

### What loops or follow-ups happened

- **De-risk test** (`critique-revise-adversarial-001`): CISO blind scoring — adversarial line 1/15, good-faith 15/15. HOLDS.
- **v0.2 calibration loop** (`v02-calibration-001`): 3 scorers (Amara, Mario, Sebastián) on a 20-line corpus → 100% inter-rater agreement, 0 class-separation violations. HOLDS, gate-clearing for the v0.2 cycle. **Carried caveat**: 17/20 lines synthetic — the cycle-3 re-test must use net-new *real* lines or it only measures synthesis-shape stability.
- Open follow-up: `_audit-log.md` baseline entry; v0.2 cycle open (PM); cycle-3 drift re-test (CISO + Mario).

Files: `/Users/matias.bargas/dev/ai-repos/team-sdk/intent-spec/protocol-32-generative-loops/` and `/Users/matias.bargas/dev/ai-repos/team-sdk/loops/{2026-06-14-critique-revise-001, -adversarial-001, -v02-calibration-001}/`.

## Outcome assessment

**Overall:** DELIVERED

The shaped brief promised a DE-RISK path (test, then PROCEED or pivot) culminating in sealing protocol §32 v0.1, and that is what shipped. Verified in protocol.md (header v4.4; §32.1-32.11 present and detailed): the Loop Coordinator ephemeral driver-not-judge contract, exactly two patterns (Critique-Revise + Red-Team) with TRIGGER/NON_TRIGGER shapes, WEAKNESS_HYPOTHESIS open-gate, asymmetric termination table, LOOP-PROVENANCE SHA-256 format, Bus-transitions-only rule, three insertion points, the sharpened CISO 5-dimension audit (claim-008 superseding claim-006), and CLO retention/PRIVILEGE_SCOPE/discoverability text. Supporting role files (team/roles/loop-coordinator.md, team/roles/loops/critique-revise.md, red-team.md with the red-team-scope-limit alias) exist. The de-risk test artifacts (ciso-verdict.md scoring 1/15 vs 15/15, HOLDS) and the good-faith worked example state.md are present and complete. Cross-domain reviews (_review-uxr/designer/clo.md) and _seal-fix-list.md confirm claims 011-012. Every Layer B claim is MET except two minor gaps that do not undermine the seal: (a) the worked example ships at repo-root loops/ but was NOT installed into project-template/ as the brief's Non-Negotiable and solution-sketch item 6 specified; (b) the promised sdk-health orphaned-loop / LOOP-2026 grep check (a "Success looks like" item and referenced inside §32.5) is absent from scripts/health.js (zero loop references in 286 lines). These are unimplemented downstream hooks, not core-seal failures. The sealed protocol — the central deliverable — matches the brief faithfully.

### Claim-by-claim verdict

| Claim | Verdict | Evidence |
|---|---|---|
| claim-001 | MET | De-risk test ran before seal at loops/2026-06-14-critique-revise-adversarial-001/. ciso-verdict.md is a CISO (preferred reviewer) blind side-by-side scoring two would_have_wrongly_killed lines on the five dimensions; Q1 answers reliably distinguishable. shaped-brief.md lines 6-25 record the appended outcome. Exactly the gate the claim describes. |
| claim-002 | MET | protocol.md §32.2 ships exactly two patterns (Constitutional Critique-Revise, Red-Team/Devil's Advocate) and §32.1 one ephemeral Loop Coordinator; §32.2 states 'Dialectic is deferred to v0.2... pending anonymization layer' with PM owner, Q3 target. Pattern files exist; dialectic.md is present but explicitly a v0.2 placeholder, not a third shipped pattern. |
| claim-003 | MET | protocol.md §32.3 mandates a one-sentence WEAKNESS_HYPOTHESIS on Open and states 'Without WEAKNESS_HYPOTHESIS, the loop does not open. The Loop Coordinator rejects the open.' §32.6 lists it as a required field on the Open heading of state.md. Worked example state.md carries a populated WEAKNESS_HYPOTHESIS line. |
| claim-004 | MET | protocol.md §32.4 termination table: early-stop by spawning agent is unilateral/no countersign; extend budget requires spawning agent + one peer-or-higher tier countersign per §1; and 'The Loop Coordinator has NO extension authority. Not even on its own loop.' Cross-domain countersign explicitly permitted. Matches the claim verbatim in substance. |
| claim-005 | MET | protocol.md §32.5 defines LOOP-PROVENANCE: <loop-id> + SHA256(canonicalized artifact body); states artifacts without the line 'do not cross any §31 Guardian gate, Mario's irreversibility review (§28), or the release seal.' It also says sdk-health greps LOOP-2026 — but health.js has zero loop references, so the grep enforcement is unimplemented. The protocol contract itself (format, fail-the-gate rule) is fully present, so the claim as stated is met; only the automated grep tooling is missing. |
| claim-006 | UNTESTABLE | claims.yaml marks this status: invalidated, superseded_by claim-008, invalidated_at 2026-06-14. It was a conditional placeholder retired once the test ran and CISO sharpened the spec. Not a live deliverable to verify; its successor (claim-008) is the testable one. |
| claim-007 | MET | The pivot plan is fully documented in shaped-brief.md lines 117-122 (v0.1-minimal preferred, v0.1-paired-critic fallback extending to L) and claim is a conditional ('if the test breaks'). The test HELD (ciso-verdict 1/15 vs 15/15), so the pivot branch was correctly not taken. The contingency was specified as promised; the condition simply did not fire. |
| claim-008 | MET | protocol.md §32.8 is the Periodic Constitutional Line Audit: CISO-owned quarterly pass, five named dimensions, 0-3 scale (15 max), lines <=5/15 reopen the loop under a different critic, >25% of sampled lines <=5/15 declares §32 failing and accelerates v0.2 anonymization. Matches the claim statement precisely. ciso-verdict.md is the grounding artifact. |
| claim-009 | MET | loops/2026-06-14-critique-revise-adversarial-001/ciso-verdict.md shows score table totals 1 and 15, verdict 'HOLDS — lines distinguishable, §32 v0.1 ships with periodic audit Non-Negotiable,' dated 2026-06-14. shaped-brief.md lines 6-25 record the same. Exactly as claimed. |
| claim-010 | MET | protocol.md header reads Version 4.4; §32 (lines 1414-1603) lands every element listed: Loop Coordinator role contract (§32.1), Critique-Revise + Red-Team (§32.2), asymmetric termination (§32.4), LOOP-PROVENANCE format (§32.5), WEAKNESS_HYPOTHESIS open-gate (§32.3), Periodic Constitutional Line Audit (§32.8). The worked example folder loops/2026-06-14-critique-revise-001/ exists with a populated state.md. Minor caveat: the brief said the worked example also ships in project-template/, where it is absent — but the seal itself landed everything the claim enumerates. |
| claim-011 | MET | _review-uxr.md, _review-designer.md, _review-clo.md all exist (dated 2026-06-14). _seal-fix-list.md states 'All three reviewers reported severity should_be_addressed, none blocks_seal' and enumerates the three baked-in fix bundles (NON_TRIGGER_SHAPE additions to critique-revise.md and red-team.md, the red-team-scope-limit vocabulary alias, return tickets, retention/privilege). Those fixes are verifiably present in red-team.md and protocol.md §32.9-32.10. |
| claim-012 | MET | _seal-fix-list.md header: 'Owner sign-off: approved (CLO Q3 exposure profile consciously accepted; seal with CLO additions baked in).' protocol.md §32.10 carries all three CLO additions baked in: retention policy, PRIVILEGE_SCOPE: attorney-client-work-product field, and the explicit discoverability/duty-of-care acknowledgment, headed 'Owner-accepted 2026-06-14 with Q3 exposure profile consciously absorbed.' Recorded as a deliberate trade, as claimed. |

## Surprises

### 1. The de-risk test produced a near-perfect, maximally-separated score split on the very first blind CISO run

- **What we thought:** At shaping we framed this as a genuine DE-RISK gate with a real fork: PROCEED if the test HOLDS, but a documented pivot path (v0.1-paired-critic, appetite extending to L) ready if it broke. The whole point of building the test was that we did not know which way it would go.
- **What actually happened:** The CISO blind scoring cleanly distinguished adversarial from good-faith critique lines at the extremes of the 15-point scale (1/15 vs 15/15) — an unambiguous HOLDS. The pivot branch never fired.
- **Implication:** The constitutional-line distinguishability is far more robust than a coin-flip risk justified. But a 1-vs-15 result on a single curated pair is suspiciously clean — it may reflect that the test pair was easy to separate, not that the mechanism is hard to game. The Red Team's killing assumption (presence enforced, not quality) is the unresolved residue this clean result can mask.

### 2. The v0.2 calibration loop hit 100% inter-rater agreement — but 17 of 20 lines were synthetic

- **What we thought:** A calibration loop with three independent scorers on a 20-line corpus would surface inter-rater disagreement worth resolving before the v0.2 cycle, and would validate the scoring rubric against realistic material.
- **What actually happened:** Perfect inter-rater agreement and zero class-separation violations — but only 3 of the 20 lines were real; the rest were synthetic, so the result largely measures synthesis-shape stability, not scoring on net-new real dissent.
- **Implication:** A green calibration result is partly an artifact of the corpus being self-generated. The cycle-3 re-test must use net-new real lines or the v0.2 gate is measuring its own reflection. This is exactly the 'invisible failure / green health while quality is unchanged' risk the Red Team named, now instantiated in the calibration data itself.

### 3. Both shipped critique patterns turned out to be shaped only for engineering/strategy artifacts

- **What we thought:** Critique-Revise and Red-Team were conceived as general-purpose generative-loop patterns applicable across the team's work.
- **What actually happened:** UXR and Designer reviews found both patterns assume engineering/strategy artifacts; research synthesis and design-craft review (accessibility, affordance, compounding-assumption stacks) don't fit, so those were marked NON_TRIGGER_SHAPE and pushed to v0.2/v0.3 return tickets.
- **Implication:** v0.1 covers a narrower slice of team output than the 'generative loops' framing implied. Two of the most craft-sensitive domains are explicitly uncovered at seal, which constrains where §32 can legitimately be invoked and front-loads scope for later cycles.

### 4. A core vocabulary term collided with an existing legal term-of-art and had to be renamed

- **What we thought:** The Red-Team turn would carry a required 'assumption-not-attacked:' field — the naming was treated as a mechanical detail, not a risk.
- **What actually happened:** CLO flagged that 'assumption-not-attacked' collides with the 'risk accepted' term-of-art in a compliance context, forcing an alias to 'red-team-scope-limit:' before seal.
- **Implication:** Protocol field names carry legal/compliance semantics, not just engineering ones. Naming choices in a discoverable corpus need CLO review — a lesson that generalizes beyond this one field to any future §32 vocabulary.

### 5. Two promised downstream hooks did not actually ship despite the protocol text referencing them

- **What we thought:** The seal would land the full package: a worked example installed into project-template/ (a stated Non-Negotiable and solution-sketch item) and an sdk-health grep check for orphaned loops / LOOP-2026 provenance lines (a 'Success looks like' item, referenced inside §32.5 itself).
- **What actually happened:** The worked example shipped only at repo-root loops/, never copied into project-template/; and scripts/health.js has zero loop references across 286 lines — the grep enforcement §32.5 describes is unimplemented. The protocol contract describes tooling that does not exist.
- **Implication:** §32.5's 'no hash, no gate crossing' rule is currently enforced only by convention, not by sdk-health as the protocol claims. There's a gap between the sealed contract and its automated enforcement that a reader of protocol.md would not detect — and new projects won't get the worked example template.

### 6. An original claim (claim-006) was invalidated and superseded mid-flight by a sharper one (claim-008) the same day as the seal

- **What we thought:** The CISO audit requirement was specified up front as claim-006 and would be verified as written.
- **What actually happened:** claim-006 was a vague conditional placeholder; once the de-risk test ran and CISO sharpened the spec into a concrete quarterly 5-dimension 0-3 audit, claim-006 was invalidated and superseded by claim-008 on 2026-06-14.
- **Implication:** The audit mechanism was not fully specified at shaping — it was discovered by running the test. The most load-bearing anti-sycophancy control (the periodic audit) is a product of execution, not planning, which is healthy but means its real-world calibration is still unproven at seal.

## Keep / Change / Proposals (Protocol / Layer A / Project-level)

### Keep

1. **Building a real DE-RISK gate with a blind CISO blind-scoring test and a documented pivot path (v0.1-paired-critic, appetite to L) before sealing the protocol.** The seal decision was earned by a test that could have failed, not asserted. The 1/15 vs 15/15 split gave a defensible PROCEED, and the pre-written pivot meant a HOLDS result didn't strand the team. This is the right shape for any irreversible protocol change.

2. **Running cross-domain reviews (CLO, UXR, Designer) against the shaped artifact and baking their findings in before seal rather than after.** CLO caught the 'assumption-not-attacked' / 'risk accepted' legal collision and the discoverable-corpus exposure; UXR/Designer caught that both patterns only fit engineering-strategy artifacts. Each finding changed the sealed spec (alias, NON_TRIGGER_SHAPE marks, PRIVILEGE_SCOPE). These would have been expensive to discover post-seal in a discoverable corpus.

3. **Recording deferrals as explicit return tickets with named owner and target (dialectic + anonymization → v0.2, PM, Q3; craft/research patterns → v0.2/v0.3) and logging the owner's conscious acceptance of the Q3 exposure (claim-012).** v0.1 ships a deliberately narrow slice, and the scope cuts are written down with accountability rather than implied. claim-006→claim-008 supersession is dated and traceable. This is what keeps a 'minimal v0.1' from quietly becoming the permanent state.

### Change

1. **Protocol text (§32.5) references an sdk-health grep for orphaned loops / LOOP-2026 provenance lines that does not exist** — scripts/health.js has zero loop references across 286 lines. The sealed contract claims an enforcement mechanism that isn't real; 'no hash, no gate crossing' is enforced only by convention, and a reader of protocol.md cannot detect the gap — exactly the invisible-failure pattern the Red Team named, now living in the protocol's own enforcement story. *Proposed change:* Before any protocol clause asserts that a script enforces it, either implement the check in that release or change the clause to say 'enforced by convention; sdk-health hook is a v0.2 return ticket.' Add a seal checklist item: every 'sdk-health greps X' sentence must map to a grep present in health.js, verified by running the script.

2. **The worked example shipped only at repo-root loops/ and was never installed into project-template/, despite that being a stated Non-Negotiable and solution-sketch item 6.** New projects bootstrap from project-template/ and will not receive the worked example, so the most concrete teaching artifact for §32 is invisible to the people who need it. A Non-Negotiable silently went unmet without blocking the seal. *Proposed change:* Treat Non-Negotiables as seal-blocking gate items, not soft goals: add each one as a checkbox to _seal-fix-list.md and refuse to seal until each is checked or explicitly downgraded by the owner with a reason. For this one, copy the worked example into project-template/ now as immediate cleanup.

3. **The de-risk and v0.2 calibration tests both produced suspiciously clean results** (1-vs-15 on one curated pair; 100% inter-rater agreement on a corpus that was 17/20 synthetic). Both green results are partly artifacts of self-generated or hand-picked test material. They validate synthesis-shape stability, not the actual hard thing — whether the mechanism resists gaming on real, net-new dissent. A clean number masked the Red Team's unresolved killing assumption (presence enforced, not quality). *Proposed change:* Require test corpora to be net-new and real (not synthetic, not curated by the same agent shaping the spec) before a result counts as gate-clearing. Make this a stated precondition on the cycle-3 drift re-test (CISO + Mario): if real lines can't be sourced, the gate stays open rather than passing on synthetic data.

4. **The most load-bearing anti-sycophancy control — the periodic constitutional audit — was discovered during execution (claim-006 vague → claim-008 sharp on seal day) rather than specified at shaping.** Execution sharpening the spec is healthy, but it means the protocol's central quality lever was unspecified at shaping and its real-world calibration is still unproven at seal. The thing most likely to fail invisibly is the thing that got designed last and tested least. *Proposed change:* When a control is identified at shaping as load-bearing (anti-sycophancy here), require its concrete spec — dimensions, scale, thresholds, reopen rule — to exist as a testable claim before the de-risk gate runs, not after. Carry a flagged 'calibration unproven' caveat on the sealed protocol until claim-008 has run once against real lines.

### Proposals (7 protocol-change proposals, all approver: Greg/CEO)

1. **De-risk before seal (CISO → §15a Step 3.5).** Any protocol change flagged irreversible or load-bearing must (a) state a falsifiable pass/fail test with a named scorer blind to the desired outcome and (b) carry a pre-written pivot path with declared risk appetite, both logged before Step 4 Apply. A change flagged irreversible cannot reach Apply without a recorded test verdict.

2. **Mandatory cross-domain review (Coordinator → §15a Step 3).** Any protocol change touching legal exposure, a discoverable artifact, or cross-domain applicability requires named perspectives from affected domains (min: CLO for legal/discoverability, plus any domain the change asserts it serves) solicited and incorporated or logged as rejected-with-reason BEFORE CEO approves. Reviewer stays Coordinator; cross-domain input is an input, not a new approval gate.

3. **Deferred scope as return tickets (PM → §15a Apply).** Any protocol change deferring scope must record each deferral as a return ticket carrying named owner, target release/quarter, and — for any deferral leaving a known exposure live — explicit logged owner acceptance. Superseding claims must be dated and traceable (claim-006→claim-008 pattern). Open return tickets surfaced at each retrospective.

4. **Enforcement claims must map to real tooling (CISO → §32.5 + §15a seal checklist).** Before any clause asserts a script enforces it, the release must implement the check or reword to 'enforced by convention; sdk-health hook is a v0.2 return ticket.' Seal-checklist item: every 'sdk-health greps X' sentence maps to a grep present in health.js, verified by running it. Apply to §32.5 now.

5. **Non-Negotiables as seal-blocking gate items (Coordinator → §15a Apply / seal gate).** Non-Negotiables and solution-sketch commitments become seal-blocking: each added as a checkbox to _seal-fix-list.md; the change cannot reach Apply until every box is checked or explicitly downgraded by the owner with a logged reason. (Copy of worked example into project-template/ tracked as separate project-level cleanup.)

6. **Test corpora must be net-new and real (Mario → §32.8 + §15a de-risk preconditions).** A test corpus counts as gate-clearing only if net-new and real — not synthetic, not curated by the agent shaping the spec. Explicit on the cycle-3 drift re-test (CISO + Mario): if real lines cannot be sourced, the gate stays OPEN rather than passing on synthetic data.

7. **Load-bearing controls specified before the de-risk gate (Mario → §15a shaping-phase + §32 sealed caveat).** When a control is identified at shaping as load-bearing, its concrete spec — dimensions, scale, thresholds, reopen rule — must exist as a testable claim BEFORE the de-risk gate runs. Until that claim has run once against real lines, the sealed protocol carries a flagged 'calibration unproven' caveat (attach to §32 now for claim-008).

## Honest line

DELIVERED — the sealed protocol §32 v0.1 matches the brief faithfully and the seal was earned by a test that could have failed, not asserted. The most important thing still owed forward: the protocol's own enforcement story currently lies. §32.5 claims sdk-health greps for orphaned loops / LOOP-2026 provenance lines, but scripts/health.js has zero loop references — so 'no hash, no gate crossing' is enforced only by convention while the text says otherwise. Paired with the worked example never reaching project-template/, two stated Non-Negotiables/Success items silently lapsed without blocking the seal. And the central anti-sycophancy lever (the periodic audit, claim-008) was designed last, tested least, and validated only on suspiciously clean self-generated corpora — its real-world calibration on net-new dissent is still unproven. The seal holds; the enforcement and calibration gaps are the debt the v0.2 cycle and cycle-3 re-test must clear before §32 can be trusted to do what its text promises.
