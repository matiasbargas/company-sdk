# Constitutional Critique — idea-execution-v0.2 SDD

**Date:** 2026-06-14
**Critic:** Constitutional Critic (Layer A grounding)
**Target:** `sdd.md` v0.2 Draft v1

## Frame

This is a single critique pass against Layer A: Priority Constraints (C1 agency, C2 direction, C3 integrity), the Four Substrates (Physical/Cognitive/Informational/Coordinational), and the Six Soul Principles. The SDD describes a sound engineering plan with strong adversarial discipline. The critique below targets the places where that discipline either over-extends into rigidity, under-specifies humans-in-the-loop, or treats anti-sycophancy infrastructure as if it were free of its own failure modes.

## Critiques

### HIGH — "Fails closed" with no human override risks Constraint 1 (capability)

**SDD section:** Non-Negotiables ("5-dimension audit fails closed. No override path in v0.2.") + Out-of-Bounds ("Human override of the 5-dimension audit. No 'the audit is too strict, let it through' path.")

**Conflict:** A non-overridable automated gate that judges human-authored or human-co-authored critique lines on a 15-point rubric — with no escalation path — is precisely the dependency pattern C1 warns against. The author of a bold but unconventional critique line cannot appeal; they must rewrite to satisfy the rubric. This trains agents (and humans) to write for the audit rather than for the truth. The fix offered ("revise the rubric in a future cycle") is a long feedback loop that makes the audit a sovereign, not a tool. Note also that this directly contradicts C2 (human direction): a human cannot direct the system to let a line through even when they are right and the rubric is wrong on that specific case.

**Severity:** HIGH. This is the load-bearing mechanism of v0.2 and it has no humans-on-top.

### HIGH — Meta-audit deferral concentrates epistemic power in the rubric

**SDD section:** Open questions ("Meta-audit of the 5-dimension audit") + Out-of-Bounds ("Resolving the two open questions ... before shipping")

**Conflict:** Substrate 3 (Informational — truth verification, shared epistemology, resistance to synthetic manipulation) requires that the instrument of truth-judgment itself be auditable. Shipping a fail-closed gate while deferring the meta-audit of the gate means the rubric becomes the de facto epistemic authority for an unknown number of runs. The SDD acknowledges this in Open Questions but moves it Out-of-Bounds for v0.2 — i.e., the SDD knows the gap exists and ships anyway. That is exactly the "synthetic manipulation resistance" failure: the manipulation can be from a poorly-specified rubric, not just from a bad actor.

**Severity:** HIGH. The combination with the prior critique is worse than either alone: non-overridable + unaudited.

### MED — Anonymization as a non-negotiable is in tension with Soul 4 (Diversity)

**SDD section:** Solution sketch (Addition 2, Dialectic with anonymization) + Non-Negotiables (by implication via "anonymization is what makes the pattern produce signal")

**Conflict:** Soul 4 says "Diversity is our superpower. Seek perspectives unlike your own before deciding." A core mechanism of that diversity in this SDK is the *named cultural profile* of each agent (CLAUDE.md naming formula: Kenji Osaka vs Fatima Dakar bring different risk intuitions, "that variation is intentional"). Per-message anonymization strips the cultural-profile signal that the SDK explicitly designed in. Anonymization may reduce deference, but it also flattens the diversity that produces the synthesis. The SDD does not engage this tradeoff; it cites 2024-2026 research that anonymization "makes the pattern produce signal" without naming the cost.

**Severity:** MED. Anonymization is currently scoped as stretch, so the bleed is limited — but if it ships as written it conflicts with a constitutional design choice.

### MED — "WEAKNESS_HYPOTHESIS required" is schema-passes-sycophancy v2

**SDD section:** Non-Negotiables ("WEAKNESS_HYPOTHESIS required on every loop open. Schema-enforced string, not a boolean.")

**Conflict:** The Problem section diagnoses v0.1's failure as `would_have_wrongly_killed:` being "required and present, yet hedge-density rises and bold critique lines score ≤5/15 without anything stopping the run." The SDD's solution is to add another required string field (`WEAKNESS_HYPOTHESIS`) with a `maxLength` constraint. This is structurally the same pattern: schema-required → schema-passes → semantic emptiness possible. The SDD critiques v0.1 for exactly this failure mode then commits the same move. The 5-dimension audit is supposed to catch this for critique lines, but nothing audits the `WEAKNESS_HYPOTHESIS` field itself. Substrate 2 (Cognitive — independent reasoning) requires that we not deceive ourselves with required-string theater.

**Severity:** MED. Fixable with a parallel rubric check on the field, but as written this is a self-aware repeat of v0.1's failure.

### MED — Soul 1 (People are first / sustainable pace) is unaddressed at Appetite M

**SDD section:** Appetite ("M — 1 week") + Solution sketch (four additions, one explicitly load-bearing)

**Conflict:** Soul 1 mandates sustainable pace; "burnout ships nothing." Appetite M (1 week) carries four additions, the load-bearing pair (Additions 1+4), plus stretch (2+3), plus a dogfood cycle on v0.1, plus six unresolved open questions including engineer assignment ("Confirm CTO has the cycle"). The SDD does not surface team capacity, who is currently on this, or what gets dropped if the dogfood run finds the substrate is broken mid-cycle. The fallback ("ship Additions 1+4 alone") is sensible engineering, but the *human-capacity* fallback is absent. This is the failure mode the constitution explicitly names.

**Severity:** MED. Recoverable by naming the pod and confirming capacity before commit.

### MED — Dogfood as ship-gate risks Constraint 3 (system integrity) regress

**SDD section:** Non-Negotiables ("Dogfooded. v0.2 is built by running v0.1 on the v0.2 design.") + Out-of-Bounds ("Replacing v0.1. v0.1 remains runnable until v0.2 has passed its own dogfood cycle.")

**Conflict:** If v0.1 cannot produce a coherent v0.2 brief, the SDD says "that is itself a finding" — but does not say what happens next. v0.1 is the substrate currently shipping briefs. If dogfood proves it broken on the v0.2 task, do we continue shipping briefs through v0.1 on other ideas? C3 (system integrity) requires that the failure be contained, not just observed. The SDD treats the dogfood result as informational; if the finding is "v0.1 cannot produce this brief," operational integrity of the workflow is in question and there is no contingency.

**Severity:** MED. Easy to address with an explicit contingency clause.

### LOW — Out-of-Bounds scope on Loop Coordinator forecloses learning

**SDD section:** Out-of-Bounds ("Any change to the §32 Loop Coordinator protocol surface beyond exposing the callable.")

**Conflict:** Soul 6 (infinite game) and the Halloway Ratchet doctrine both treat finding a deeper fix as more valuable than scope-protection. If exposing `spawn_loop` as a callable surfaces a defect in the Loop Coordinator protocol surface itself, the SDD pre-commits to not fixing it in v0.2. This is reasonable scope discipline but it is also a structural blind spot — the constitutional posture is "fix broken windows immediately" (Soul 2), and Out-of-Bounds here pre-decides we won't.

**Severity:** LOW. Scope discipline is legitimate; just flagging the tension.

### LOW — "PM auto-drafted" without named owner is a Soul 3 violation in miniature

**SDD section:** Header ("Author: PM (auto-drafted)")

**Conflict:** Soul 3 ("Stakeholder ownership via shared plans... clear boundaries enable speed.") and the SDK naming formula (every agent gets a name; that variation is the design) are both undercut by an unnamed "PM" attribution. Who synthesized this? Who owns the brief at the Betting Table? The constitution treats named ownership as load-bearing for both accountability and diversity.

**Severity:** LOW. Cosmetic but consistent with the larger pattern of mechanisms-without-named-humans in this SDD.

## Summary table

| # | Severity | Principle | Fix complexity |
|---|---|---|---|
| 1 | HIGH | C1 capability / no human override | Add bounded escalation path |
| 2 | HIGH | Substrate 3 informational integrity | Pull meta-audit into v0.2 or block ship |
| 3 | MED | Soul 4 diversity vs anonymization | Engage the tradeoff explicitly |
| 4 | MED | Substrate 2 cognitive / schema-theater | Audit the WEAKNESS_HYPOTHESIS field |
| 5 | MED | Soul 1 sustainable pace | Name pod + capacity + drop-list |
| 6 | MED | C3 system integrity on dogfood failure | Contingency clause |
| 7 | LOW | Soul 6 infinite game | Acknowledge LC defect path |
| 8 | LOW | Soul 3 stakeholder ownership | Name the PM |

## Would have wrongly killed (Mario's guardrail)

This critique pattern — particularly the HIGH on "fails closed with no human override" — would have wrongly killed a deterministic test gate in a safety-critical system whose entire value comes from being non-overridable in the moment (think: an aviation pre-flight check that crew cannot wave off because they're behind schedule). The constitutional reading would have flagged "no human override" as a C1 violation; in fact, the absence of an override is precisely what protects humans in that domain. The bold-and-correct version of this SDD's fail-closed gate may be one of those: an audit that is *meant* to be unappealable because the appeal channel is the failure mode. A critique that reflexively requires a human override path would have killed it. The right move here is to interrogate whether the 5-dimension critique audit is in that class (it might be — it is explicitly defending against sycophantic discharge under time pressure), not to assume it is not. I am marking it HIGH because the SDD does not make the safety-critical-gate argument explicit; if the next pass makes that argument, the HIGH should soften to MED or fall away.
