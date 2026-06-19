# Loop pattern: Role-Pair Dialectic (with anonymization)

**Pattern slug:** dialectic
**Ships in:** v0.2 (deferred until anonymization layer is designed and CTO + Mario sign off)
**Family:** generative (divergent + convergent in one mechanism)
**SOLUTION_CLASS:** Level 3 (turn coordination) + Level 1 (content review). HYBRID per §24 Halloway Ratchet.

## Intent — the team need this loop addresses

Cross-domain decisions fail predictably: one role drafts, others react. The reactor is anchored to the proposer's framing and pushes only at margins. The constraint the reactor was hired to defend — CFO's cost discipline, Designer's user trust, CLO's legal exposure — gets shaved instead of honored. The team ships a proposal that satisfies the loudest priors and silently violates the quietest. This loop forces two roles with opposed loss functions to produce independent proposals before either sees the other. Disagreement is real because priors are real. Synthesis then has two genuine options to inhabit, not one proposal with marginalia.

## Mechanism — the simplest turn structure

1. Coordinator — frames problem, selects pair from dialectic pair table.
2. Role A — independent proposal. Blind to Role B.
3. Role B — independent proposal. Blind to Role A.
4. Coordinator — strips author identity from both (anonymization layer, guard-railed).
5. Synthesizer (PM or Coordinator) — reads both blind, extracts inhabitable middle, logs synthesis.
6. Optional round two — only if synthesizer flags a substantive gap.
7. Coordinator — restores identity in decision log AFTER synthesis is sealed.

## TRIGGER_SHAPE — when to use

- Decision spans two domains with opposed loss functions (CFO/Designer, CISO/PM, CLO/CMO, CTO/CFO).
- One role alone will systematically miss the other's constraint.
- Reversible-but-expensive — worth two proposals, not a full council.
- A draft exists that suspiciously satisfies only one prior.

## NON_TRIGGER_SHAPE — when NOT to use

- WITHOUT identity anonymization. Named roles invite sycophancy drift toward the confident voice.
- Pairing roles whose priors overlap (CTO/Staff Engineer) — fake debate.
- Time-pressured Level 3 decisions where one role is the correct authority.
- Questions of fact, not tradeoff. Dialectic on "what does GDPR require" wastes both roles.
- More than two roles — collapses into council.

## Convergence contract

The synthesizer emits a memo naming both constraints and the inhabitable middle. If one proposal is adopted wholesale, the loop failed and the unaddressed prior surfaces later as rework or incident.

## Failure modes + guardrails

- Sycophancy / mimicry-as-consensus — drift toward confident voice. Guardrail: anonymization, blind synthesis read.
- Presence-not-quality — synthesizer treats "both spoke" as "both heard." Guardrail: memo must name each constraint explicitly or it is rejected.
- Degeneration-of-thought — quality decays past round two. Guardrail: hard cap at two rounds, adaptive stop via KS-statistic on proposal similarity.
- Fake debate from aligned priors. Guardrail: curated pair table; Coordinator cannot freelance pairing.
- Collective failure on shared blind spot. Guardrail: synthesizer flags low-variance pairs for council escalation.

## Composition

Nests inside Discovery before a Mario gate when the decision is cross-domain. Chains after a council loop when council surfaces a two-axis tradeoff worth deepening. Do NOT add a third role mid-loop — escalate to council.

## Provenance

- Documented: 2026-06-14
- Sources: Pablo (CAIO), deep-research SOTA report (2024-2026), brain-structure paper (Sidharta/Diego), Mario guardrails, CISO de-risk verdict (§32 v0.1).

## Improvement signal emission

On close, this loop MUST emit an `improvement_signal` per `_IMPROVEMENT_SIGNAL.md` schema. The `friction` line ties to this pattern's most prone failure mode: **anonymization was unclear, or the role pair was mis-matched** — if identity leaked into the synthesizer's read, or if priors overlapped too much for genuine debate, name it here so the next ritual sharpens the pair table or the anonymization layer. Explicit `suggested_target: none` is valid; omission fails the convergence contract.
