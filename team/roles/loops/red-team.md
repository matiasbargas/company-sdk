# Loop pattern: Red-Team / Devil's Advocate

**Pattern slug:** red-team
**Ships in:** v0.1 (shipped 2026-06-14 in §32)
**Family:** generative (divergent + convergent in one mechanism)
**SOLUTION_CLASS:** Level 3 (turn coordination, deterministic) + Level 1 (content review, exploratory). HYBRID per §24 Halloway Ratchet.

## Intent — the team need this loop addresses

Teams that produce a coherent-looking draft stop looking. The draft reads as internally consistent, peers nod, and the proposal carries forward — carrying one unexamined assumption that, if wrong, voids the plan. The failure is not bad analysis; it is exhausted attention. On real teams this shows up as launches failing on a known-knowable risk, architectures collapsing on an untested load assumption, strategies built on a market belief never named aloud. Red-Team counters with one cheap, deliberate pass hunting the single killing assumption — forcing the proposer to defend it, log it as accepted risk, or kill the proposal.

## Mechanism — the simplest turn structure

1. **Proposer** presents the draft and names the load-bearing assumption.
2. **Red-Teamer** (peer, not judge) names ONE assumption that, if wrong, breaks the whole thing — with the specific failure path.
3. **Proposer** decides: revise, accept-with-deferred-risk (logged in `history.md`), or kill.

That is the whole loop. No voting, no second round, no synthesis agent.

## TRIGGER_SHAPE — when to use

- Draft is coherent and looks ready to commit
- Decision is costly or hard to reverse (architecture, market entry, hiring, irreversible spend)
- Team converged faster than the problem warrants — suspect groupthink
- Cost of one pass is small relative to cost of being wrong

## NON_TRIGGER_SHAPE — when NOT to use

- Draft has many open issues — Red-Team collapses on the obvious one; fix the draft first
- Team is in early divergence (no draft to attack)
- Decision is cheap, reversible, low-blast-radius — overhead exceeds value
- Proposer is not empowered to revise/kill — no convergence path
- Composite design artifacts where failure is cumulative degradation rather than catastrophic break — use Red-Team only on the hard-to-reverse subset (navigation model, design token system, conversation architecture, AI tone model). Source: Designer cross-domain review 2026-06-14.
- Research synthesis whose trustworthiness rests on a compound stack of assumptions (recruitment × question framing × interpretation × negative-space × method-confidence) — the singleton framing flattens a stack into a single load-bearing beam. Source: UXR cross-domain review 2026-06-14.

## Convergence contract

The original proposer decides — not the Red-Teamer, not a third party. The artifact is either a revised draft, or the original draft plus a logged risk acceptance in `history.md` naming the assumption. If no decision is logged, the loop failed and the team has imported the killing assumption silently.

## Failure modes + guardrails

- **Sycophancy / mimicry-as-consensus** — softening to preserve harmony. Guardrail: spawn from a different domain; require a specific failure path, not a vibe.
- **Presence-not-quality** — going through the motions. Guardrail: if no killing assumption can be named, say so — silence is not approval.
- **Scope creep into ten weaknesses** — defeats the cost advantage. Guardrail: hard limit of ONE assumption per pass.
- **Red-Teamer-as-judge** — Guardrail: decision authority stays with proposer.
- **Degeneration-of-thought across rounds** — Guardrail: single pass only; if more is needed, the draft is not ready.

## Composition

Nests well after a generative loop (brainstorm, design exploration) and before commit — one pass on the synthesized output. Do NOT chain multiple Red-Team rounds; the 80/15 cost-value ratio is single-pass. Do NOT add a separate judge agent — collapses the convergence contract.

## Vocabulary clarification (CLO 2026-06-14)

> `assumption-not-attacked:` is a process artifact recording what THIS pass did not stress-test. It does NOT constitute risk acceptance under protocol §6. In regulatory writing, "risk accepted" implies informed acceptance by an authorized decision-maker and creates duty-of-care. Any actual risk acceptance must be logged separately via the §6 decision log entry, signed by the authorized role. For CLO-owned artifacts, prefer the alias `red-team-scope-limit:` which carries no regulatory term-of-art collision.

## Provenance

- Documented: 2026-06-14
- Source meanings: Pablo (CAIO) consultation, deep-research SOTA report (2024-2026), brain-structure paper (Sidharta/Diego), Mario (Chief Engineer) guardrails, CISO de-risk verdict (§32 v0.1).
- 2026-06-14: NON_TRIGGER_SHAPE extended with Designer + UXR findings; vocabulary clarification added per CLO Q2 cross-domain review (§32 seal).

## Improvement signal emission

On close, this loop MUST emit an `improvement_signal` per `_IMPROVEMENT_SIGNAL.md` schema. The `friction` line ties to this pattern's most prone failure mode: **the killing assumption was too generic to test** — if the Red-Teamer's assumption could not be tied to a specific failure path, name that here so the next ritual sharpens the trigger or the spawning rule. Explicit `suggested_target: none` is valid; omission fails the convergence contract.
