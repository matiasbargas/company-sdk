# Loop pattern library

> Generative loops the team can pick from. We all build our infra.

## What this directory is

A **pattern library** of generative loops — turn structures the team uses when one agent's draft is not enough and a multi-turn structure is required to reach quality. Each pattern is a written contract: what it does, when to fire it, when not to fire it, how it converges, and how it fails.

Patterns are owned by the team, not by any one role. PM, CTO, Coordinator, Designer — any spawning agent picks a pattern from this library. The library is **deliberately small**. Every file is **300–500 words by design**: a loop pattern that cannot be summarized in 500 words is too complex to compose with other patterns, and composition is the point. New patterns ship under §32 versioning and require Mario sign-off — the cost of adding a sixth pattern is the team forgetting when to use the first five.

The patterns are also the **substrate** for `../../../workflows/idea-execution-v0.1.js` and its successors. A workflow run is a sequence of pattern firings. The pattern files here are the canonical contract; the workflow scripts are the executable orchestration.

## Pattern roster

| Pattern | File | Ships in | One-line use |
|---|---|---|---|
| Constitutional Critique-Revise | [critique-revise.md](critique-revise.md) | v0.1 (2026-06-14) | A draft exists, a constitution exists, run one principle-cited revision pass — and force the critic to name what bold thing they would have wrongly killed. |
| Red-Team / Devil's Advocate | [red-team.md](red-team.md) | v0.1 (2026-06-14) | A coherent draft is about to commit on a costly-to-reverse call — spend one cheap pass naming the single killing assumption. |
| Role-Pair Dialectic (with anonymization) | [dialectic.md](dialectic.md) | v0.2 (deferred) | A cross-domain decision has two opposed loss functions — produce two blind proposals, anonymize, synthesize the inhabitable middle. |

Dialectic is documented but **not shipped** until the anonymization layer is designed and CTO + Mario sign off. Firing it before then violates the pattern's own NON_TRIGGER_SHAPE — named-role debate is itself a sycophancy attack surface (deep-research SOTA, 2024–2026).

## How a spawning agent picks a pattern (TRIGGER_SHAPE pre-flight)

Per Mario's rule: **pattern selection is a pre-flight checklist, not a vibe call.** Before firing a loop, the spawning agent runs the TRIGGER_SHAPE block of each candidate pattern against the actual situation. The first pattern whose TRIGGER_SHAPE matches AND whose NON_TRIGGER_SHAPE does **not** match wins. If two match, compose (e.g., Red-Team then Critique-Revise) rather than choose. If none match, the situation is wrong for a loop — escalate to council or single-author work.

The pre-flight is logged. The shaped-brief / decision artifact must name which pattern fired and which TRIGGER clause it matched. A loop fired without a logged trigger match is treated as **presence-not-quality theater** and rejected by the convergence contract.

Defaults are sticky: one critique + one revision (Critique-Revise), one pass / one assumption (Red-Team). Overrides require a logged reason — see `../../../workflows/README.md > Defaults baked in`.

## Cross-references

- Required emission for every pattern in this library: [`_IMPROVEMENT_SIGNAL.md`](_IMPROVEMENT_SIGNAL.md) — schema, landing locations, and convergence-contract enforcement for the `improvement_signal` field every loop must emit on close.
- Protocol §32 (Generative Loops) — when it ships, this directory is its source of truth for pattern definitions. Protocol §32 references these files; do not duplicate the contracts there.
- Workflow substrate: `../../../workflows/README.md` — how patterns compose inside runnable orchestrations.
- Source meanings: Pablo (CAIO) consultation, deep-research SOTA report (2024–2026), brain-structure paper (Sidharta Rezende / Diego Mattos), Mario (Chief Engineer) guardrails, CISO de-risk verdict (§32 v0.1).
