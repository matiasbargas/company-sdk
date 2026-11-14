# Brief — Portfolio Orchestrator ("the holding")

**Author:** Greg (CEO) · **Date:** 2026-11-13 · **Status:** Phase 0 brief, Discovery opened
**Source:** Owner direction, 2026-11-13: *"We need to become an orchestrator of several team-sdks running in parallel. Tokens are fuel that the company uses to share."*

## The idea in one sentence
A holding layer, itself a team-sdk instance, that runs many team-sdk companies in parallel, funds their bets from a shared fuel pool (tokens), and shares what one company learns with all of them.

## Scope decided with the Owner
| Question | Decision |
|---|---|
| Ownership | **Each company has its own human Owner.** That Owner ratifies its charter and approves its outward-facing acts. The holding Owner governs fuel and the commons, not operations. |
| Fuel | **Fund bets, release on proof.** A portfolio Betting Table funds missions. Tranches unlock as verified work lands (surfaces, graduated cycles, shipped increments), and unspent fuel returns to the pool. |
| Runtime | **Local first, cloud later.** v0 runs parallel headless sessions, one worktree or directory per instance, behind a runner interface that a cloud runner can replace. |
| Commons | **Patterns, plus context a company opts in to publish.** Skills, protocol improvements, kill-log classes and ratchet task classes flow freely. A decision or study crosses only when its company publishes it. |

## Step 1 answers (ceo.md)
- **Market truth:** agent teams are cheap to start and expensive to keep honest. The scarce thing is not tokens but *verified* work per token, plus the discipline that compounds across projects.
- **Customer:** a builder running several ventures at once (first, the Owner) who wants each to have a full team without being each team's bottleneck.
- **Winning at 18 months:** 5+ companies run from one holding. Fuel follows verified output. A lesson learned in one company reaches the others within one heartbeat. No company's Owner is surprised by what its agents did (measured: zero outward-facing or Autonomy-Limit acts without that Owner's recorded approval, per the run log).
- **What would make this unnecessary in 3 years:** model vendors shipping native multi-project agent orchestration. Our hedge is the governance and verification layer (charter, gates, surfaces, commons), not the scheduling.
- **NOT building (v0):** the reasoned exclusions (billing, raw cross-company context, holding authority over operations, spend outside the ledger, a marketplace) and the deferrals with their revisit triggers (cloud runner, OS-level isolation, outside-verifier fuel proof, automated recall, signed commons) are listed in `discovery-synthesis.md` → Non-goals / Deferred, with trigger.

## Smallest proof
Two instances run in parallel from one orchestrator. A fuel ledger meters both and shows burn next to proof (in v0, each company's own gates: an accepted risk, see `discovery-synthesis.md` → "What v0 proves, and what it does not"). One lesson crosses between them through the commons, via a verified surface.

## Open for Discovery
CTO: runner and scheduler architecture · CFO: fuel ledger and tranche economics · CISO: isolation, secrets and the commons boundary · CLO: consent and confidentiality for opt-in sharing · Red-Team: the one assumption that kills it.
