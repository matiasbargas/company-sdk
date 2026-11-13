# Loop pattern: Role-Pair Dialectic (with anonymization)

**Pattern slug:** dialectic
**Ships in:** v0.2 (deferred until anonymization layer is designed and CTO + Mario sign off)
**Family:** generative (divergent + convergent in one mechanism)
**SOLUTION_CLASS:** Level 3 (turn coordination) + Level 1 (content review). HYBRID per §24 Halloway Ratchet.

## Intent — the team need this loop addresses

Cross-domain decisions fail predictably: one role drafts, others react, anchored to the proposer's framing. The constraint the reactor was hired to defend gets shaved instead of honored, and the team ships a proposal that satisfies the loudest prior and silently violates the quietest. This loop forces two roles with opposed loss functions to propose independently before either sees the other, so synthesis has two genuine options to inhabit, not one proposal with marginalia.

## Mechanism — the simplest turn structure

1. Coordinator — frames problem, selects pair from the pair table below.
2. Role A — independent proposal. Blind to Role B.
3. Role B — independent proposal. Blind to Role A.
4. Coordinator — anonymizes both (v0 procedure below).
5. Synthesizer — a fresh-context agent spawned by the spawning agent that never saw un-anonymized proposals (never the Coordinator or either role). Reads both blind, extracts the inhabitable middle, scores each side's constraint **honored / traded / dropped**.
6. Round two — only if any constraint is scored **dropped**; rounds capped by `limits.loopIterations` when set (§16.1).
7. Coordinator — restores identity in decision log AFTER synthesis is sealed.

**Pair table** (curated; Coordinator cannot freelance pairing):

| Pair | Side A loss function | Side B loss function |
|---|---|---|
| CFO × Designer | burn / unit economics overrun | user trust and experience eroded |
| CISO × PM | exploitable exposure shipped | outcome missed or learning delayed |
| CLO × CMO | legal / regulatory liability created | reach lost, message diluted |
| CTO × CFO | irreversible tech debt / reliability failure | spend beyond appetite |

**Anonymization v0:** (a) strip role names, titles, and domain-jargon tells (e.g. "runway", "OWASP", "WCAG") to plain language; (b) normalize both into one fixed template — Problem read · Proposal · Constraint defended · Cost accepted; (c) randomize A/B order before the synthesizer reads.

## Inputs at open

Not openable in v0.1 — the Loop Coordinator rejects it (§32.2). From v0.2, missing any field = refusal (Step 0, [`../loop-coordinator.md`](../loop-coordinator.md)):
- `Pattern: dialectic` · `Target:` decision/artifact path · `Constitution:` optional
- `Author:` Role A + Role B (from pair table) · `Critic:` synthesizer (fresh context)
- `Budget:` rounds (≤ `limits.loopIterations`) · `Terminate when:` no constraint scored dropped, or early-stop
- `WEAKNESS_HYPOTHESIS:` one sentence · `Insertion point:` Phase 0 | Architecture | Implementation
- Output carries `LOOP-PROVENANCE:`. ID `LOOP-YYYYMMDD-dialectic-<seq>` (§32.5) lives in state.md; folder `record/loops/<YYYY-MM-DD>-dialectic-<seq>/`.

## TRIGGER_SHAPE — when to use

- Decision spans two domains with opposed loss functions (see pair table).
- One role alone will systematically miss the other's constraint.
- Reversible-but-expensive — worth two proposals, not a full council.
- A draft exists that suspiciously satisfies only one prior.

## NON_TRIGGER_SHAPE — when NOT to use

- WITHOUT identity anonymization. Named roles invite sycophancy drift toward the confident voice.
- Overlapping priors (CTO/Staff Engineer) — fake debate.
- Time-pressured Level 3 decisions with one correct authority.
- Questions of fact, not tradeoff ("what does GDPR require").
- More than two roles — that is a council.

## Convergence contract

The synthesizer emits a memo naming both constraints, each scored honored / traded / dropped, and the inhabitable middle. If one proposal is adopted wholesale, the loop failed; the unaddressed prior resurfaces as rework or incident.

## Failure modes + guardrails

- Sycophancy — drift toward the confident voice. Guardrail: anonymization, blind synthesis read.
- Presence-not-quality — synthesizer treats "both spoke" as "both heard." Guardrail: memo must name each constraint explicitly or it is rejected.
- Degeneration-of-thought across rounds. Guardrail: rubric stop (no constraint dropped) + `limits.loopIterations`. Future option, not implemented: KS-statistic on proposal similarity.
- Fake debate from aligned priors. Guardrail: the pair table above.
- Shared blind spot. Guardrail: synthesizer flags low-variance pairs for council escalation.

## Composition

Nests inside Discovery before a Mario gate when the decision is cross-domain. Chains after a council loop when council surfaces a two-axis tradeoff worth deepening. Do NOT add a third role mid-loop — escalate to council.

## Provenance

- Documented: 2026-06-14
- Sources: Pablo (CAIO), deep-research SOTA report (2024-2026), brain-structure paper (Sidharta/Diego), Mario guardrails, CISO de-risk verdict (§32 v0.1).

## Improvement signal emission

On close, emit an `improvement_signal` per `_IMPROVEMENT_SIGNAL.md`. The `friction` line targets this pattern's prone failure: **identity leaked into the synthesizer's read, or the pair's priors overlapped** — so the next ritual sharpens the pair table or anonymization. Explicit `suggested_target: none` is valid; omission fails the convergence contract.
