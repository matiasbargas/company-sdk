# Loop pattern: Red-Team / Devil's Advocate

**Pattern slug:** red-team
**Ships in:** v0.1 (shipped 2026-06-14 in §32)
**Family:** generative (divergent + convergent in one mechanism)
**SOLUTION_CLASS:** Level 3 (turn coordination, deterministic) + Level 1 (content review, exploratory). HYBRID per §24 Halloway Ratchet.

## Intent — the team need this loop addresses

Teams that produce a coherent-looking draft stop looking. Peers nod and the proposal carries forward one unexamined assumption that, if wrong, voids the plan. The failure is not bad analysis; it is exhausted attention — launches failing on a knowable risk, architectures collapsing on an untested load assumption. Red-Team spends one cheap pass hunting the single killing assumption — the proposer defends it, logs it as accepted risk, or kills the proposal.

## Mechanism — the simplest turn structure

1. **Proposer** presents the draft and names the load-bearing assumption.
2. **Red-Teamer** (peer, not judge) names ONE assumption that, if wrong, breaks the whole thing with the specific failure path, then emits the mandatory §32.3 guardrail line `assumption-not-attacked: <an assumption this pass did not stress-test>` (alias `red-team-scope-limit:`). Missing line = fail closed. N independent Red-Teamers may run (self-consistency); still only ONE assumption is surfaced.
3. **Proposer** decides: revise, accept-with-deferred-risk (logged in `history.md`), or kill.

That is the whole loop. No voting, no second round, no synthesis agent. One pass is the pattern's shape, not a budget; extension = open a new loop.

## Inputs at open

Missing any field = Loop Coordinator refuses to open (Step 0, [`../loop-coordinator.md`](../loop-coordinator.md)):
- `Pattern: red-team` · `Target:` artifact path · `Constitution:` optional (n/a unless typed, §32.9)
- `Author:` proposer role · `Critic:` Red-Teamer role (different domain)
- `Budget:` ignored (one pass) · `Terminate when:` proposer logs revise / accept-with-deferred-risk / kill
- `WEAKNESS_HYPOTHESIS:` one sentence · `Insertion point:` Phase 0 | Architecture | Implementation
- Output carries `LOOP-PROVENANCE:`. ID `LOOP-YYYYMMDD-red-team-<seq>` (§32.5) lives in state.md; folder `record/loops/<YYYY-MM-DD>-red-team-<seq>/`.

## TRIGGER_SHAPE — when to use

- Draft is coherent and ready to commit
- Decision is costly or hard to reverse (architecture, market entry, hiring, irreversible spend)
- Team converged suspiciously fast — suspect groupthink
- One pass costs little next to being wrong

## NON_TRIGGER_SHAPE — when NOT to use

- Draft has many open issues — Red-Team collapses on the obvious one; fix the draft first
- Team is in early divergence (no draft to attack)
- Decision is cheap and reversible — overhead exceeds value
- Proposer cannot revise/kill — no convergence path
- Composite design artifacts where failure is cumulative degradation, not catastrophic break — Red-Team only the hard-to-reverse subset (navigation model, token system, AI tone model). (Designer, 2026-06-14)
- Research synthesis resting on a compound assumption stack (recruitment × framing × interpretation × negative-space) — the singleton framing flattens the stack into one beam. (UXR, 2026-06-14)

## Convergence contract

The original proposer decides — not the Red-Teamer, not a third party. Artifact: a revised draft, or the original plus a logged risk acceptance in `history.md` naming the assumption. If no decision is logged, the loop failed and the team has imported the killing assumption silently.

## Failure modes + guardrails

- **Sycophancy** — softening to preserve harmony. Guardrail: spawn from a different domain; require a specific failure path, not a vibe.
- **Presence-not-quality** — going through the motions. Guardrail: if no killing assumption exists, say so; silence is not approval.
- **Scope creep into ten weaknesses** — Guardrail: ONE assumption per pass.
- **Red-Teamer-as-judge** — Guardrail: decision authority stays with proposer.
- **Degeneration across rounds** — Guardrail: single pass; if more is needed, the draft is not ready.

## Composition

Nests after a generative loop and before commit — one pass on the synthesized output. Do NOT chain Red-Team rounds; the 80/15 cost-value ratio is single-pass. Do NOT add a judge agent — it collapses the convergence contract.

## Vocabulary clarification (CLO 2026-06-14)

> `assumption-not-attacked:` is a process artifact recording what THIS pass did not stress-test. It does NOT constitute risk acceptance under protocol §6. In regulatory writing "risk accepted" implies informed acceptance by an authorized decision-maker and creates duty-of-care; actual risk acceptance is logged separately per §6, signed by the authorized role. For CLO-owned artifacts, prefer the alias `red-team-scope-limit:` (no regulatory term-of-art collision).

## Provenance

- Documented: 2026-06-14
- Sources: Pablo (CAIO), deep-research SOTA report (2024-2026), brain-structure paper (Sidharta/Diego), Mario guardrails, CISO de-risk verdict (§32 v0.1).
- 2026-06-14: NON_TRIGGER_SHAPE extended with Designer + UXR findings; vocabulary clarification added per CLO Q2 cross-domain review (§32 seal).

## Improvement signal emission

On close, emit an `improvement_signal` per `_IMPROVEMENT_SIGNAL.md`. The `friction` line targets this pattern's prone failure: **the killing assumption was too generic to test** (no specific failure path) — so the next ritual sharpens the trigger or spawning rule. Explicit `suggested_target: none` is valid; omission fails the convergence contract.
