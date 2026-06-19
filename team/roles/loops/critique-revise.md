# Loop pattern: Constitutional Critique-Revise

**Pattern slug:** critique-revise
**Ships in:** v0.1 (shipped 2026-06-14 in §32)
**Family:** generative (divergent + convergent in one mechanism)
**SOLUTION_CLASS:** Level 3 (turn coordination) + Level 1 (content review). HYBRID per §24 Halloway Ratchet.

## Intent — the team need this loop addresses

Teams produce drafts that drift from stated principles — Constraints + Soul live in a doc nobody re-reads at decision time. Reviewers rubber-stamp or pattern-match generic best practice, neither catching principle violations. The opposite failure is worse: reviewers strip the bold, distinctive moves that made the draft worth shipping. Critique-Revise binds review to a written constitution so principles do the cutting — and forces the critic to name what bold thing their critique would have wrongly killed, so timidity gets caught before it becomes the verdict.

## Mechanism — the simplest turn structure

1. **Author** — produces a draft (proposal, plan, mission, memo).
2. **Critic** — reads against the fixed constitution (Layer A: Constraints + Soul). Emits structured critiques, each citing the principle violated.
3. **Critic (guardrail turn)** — emits `would-have-wrongly-killed`: names one bold strategy this pass would have rejected and the critique that would have killed it. **Required.**
4. **Author** — revises ONCE. Not a negotiation. One pass.
5. **Constitution-as-judge** — convergence: violations resolved, wrongly-killed strategy survives.

## TRIGGER_SHAPE — when to use

- A concrete draft exists (proposal, plan, memo, mission).
- A written constitution exists and is load-bearing.
- Risk is principle-drift OR timidity-creep, not generation.
- You want one sharp pass, not iterative negotiation.

## NON_TRIGGER_SHAPE — when NOT to use

- No draft yet — use Red-Team or Dialectic to generate first.
- Constitution is vague or absent — critique collapses to opinion.
- Question is exploratory, not artifact review.
- Stakes require multiple rounds with new evidence — use Iterative Refinement.
- Design craft review (accessibility/WCAG, perceived affordance, form-follows-function, emotional register) — craft standards live outside Layer A; constitutional critique will silently miss them. Source: Designer cross-domain review 2026-06-14.
- Research synthesis methodology (evidence chain, sample-frame transparency, negative-space discipline, observation-vs-inference) — methodological soundness is not a Layer A clause; the `would-have-wrongly-killed` guardrail is shaped against timidity and will systematically preserve over-confident inferences. Source: UXR cross-domain review 2026-06-14.

## Convergence contract

The constitution judges: ship when cited violations are resolved AND the wrongly-killed strategy survives recognizably. Artifact: revised draft + critique log + wrongly-killed line. Bypassing the guardrail collapses the loop to presence-not-quality theater — CISO scored that 0/15 in the §32 de-risk test.

## Failure modes + guardrails

- **Presence-not-quality theater** — critiques don't cite principles. *Guardrail:* every critique names a violated clause; unsourced ones rejected.
- **Timidity-creep / boldness flattening** — critic prefers safer revisions. *Guardrail:* mandatory `would-have-wrongly-killed` line.
- **Sycophancy** — critic softens to match author. *Guardrail:* critic spawns from a different role; forbid agreement-without-citation.
- **Loop drift into negotiation** — author and critic ping-pong. *Guardrail:* ONE pass, hard stop. New issues open a new loop.
- **Constitution-as-decoration** — principles quoted but not load-bearing. *Guardrail:* if no critique cites a specific clause, loop is invalid; escalate to Mario.

## Composition

Nests inside Dialectic (harden each thesis before synthesis). Chains after Red-Team (which generates, Critique-Revise principle-checks). Do NOT chain another Critique-Revise immediately — timidity compounds.

## Provenance

- Documented: 2026-06-14
- Source meanings: Pablo (CAIO) consultation, deep-research SOTA report (2024-2026), brain-structure paper (Sidharta/Diego), Mario (Chief Engineer) guardrails, CISO de-risk verdict (§32 v0.1).
- 2026-06-14: NON_TRIGGER_SHAPE extended with Designer + UXR cross-domain review findings (§32 seal).

## Improvement signal emission

On close, this loop MUST emit an `improvement_signal` per `_IMPROVEMENT_SIGNAL.md` schema. The `friction` line ties to this pattern's most prone failure mode: **presence-not-quality of the `would-have-wrongly-killed` line** — if the guardrail line read as boilerplate, name it here so the next ritual sharpens the constitution or the critic's spawn rule. Explicit `suggested_target: none` is valid; omission fails the convergence contract.
