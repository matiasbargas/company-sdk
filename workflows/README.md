# Workflows

> Self-aware documented contexts for incremental project development. We all build our infra.

## What this directory is

This directory holds **runnable workflow scripts** that orchestrate the team-sdk roles through the Layered Context Architecture (Layer A foundation → Layer C task context → Layer B specifications, with verification baked in).

The workflows here are not human-curated documents. They are **executable substrate**. Running one takes a raw idea as input and produces, on disk, the always-documented folder structure that the team can read, review, and audit. Every artifact is sourced. Every claim is provenance-tagged.

## The principle

> *Self-aware documented contexts will allow incremental project developments that keep all team accountable. We all build our infra.*

What that means in practice:

- **Self-aware**: each workflow run writes its own foundation snapshot, so we can answer "what constitution was this idea shaped against" later.
- **Documented contexts**: nothing exists only in chat. Everything material lands in `intent-spec/`, `generated-spec/`, or this directory.
- **Incremental**: minimum value, one idea at a time. v0.1 ships two loop patterns (Critique-Revise + Red-Team), not five. v0.2 is the next ship, not a year out.
- **Team accountable**: source attribution per claim is the keystone. Provenance hashes make idea origin grep-able. Kill log is honored — killed ideas archive with reasons.
- **We all build our infra**: this directory is checked in. The PM, the Designer, the CTO, the CEO — every role's input becomes an artifact in the corpus. No private prompts.

## Available workflows

### `idea-execution-v0.1.js` — Take an idea → shaped brief + Layer B claims

**What it does.** Six phases: load Layer A → PM drafts SDD (Layer C) → Constitutional Critique-Revise loop → Red-Team pass → Coordinator synthesizes the shaped brief + extracts atomic claims (Layer B) → index update.

**What it does NOT do (yet).**
- No Dialectic loop. The 2024–2026 research on Multi-Agent Debate shows named-role architectures are themselves a sycophancy attack surface. v0.2 adds Dialectic with author anonymization.
- No verification invariant. v0.2 adds the regeneration test against the original Layer C.
- No semantic conflict detection across concurrent runs. v0.3+, when we run more than one workflow at a time.
- No automatic archival. The shaped-brief decision is logged; movement to `_archive/` is a manual `mv` for now.

**Inputs.** Pass an object as `args` to `Workflow`:

```js
Workflow({
  scriptPath: "/Users/matias.bargas/dev/ai-repos/team-sdk/workflows/idea-execution-v0.1.js",
  args: {
    idea: "Design protocol §32 — Generative Loops. Spec the Loop Coordinator agent, the three v0.1 patterns (Critique-Revise + Red-Team + nothing else), the per-loop state file under loops/, the termination contract per Mario, and the provenance hash format.",
    slug: "protocol-32-generative-loops",
    date: "2026-06-14"
  }
})
```

**Outputs.** A folder tree:

```
intent-spec/<slug>/
├── sdd.md
├── sdd-v2.md
├── _foundation-snapshot.md
├── _revision-notes.md
├── _red-team.md
├── shaped-brief.md
└── _summary.md
generated-spec/<slug>/
└── claims.yaml
intent-spec/_INDEX.md   (appended)
```

Plus a structured return value with the decision (PROCEED / DE-RISK / REVISE / KILL), file paths, deferred risks, and next action.

**Defaults baked in (Mario's "sticky defaults" rule).**

| Loop pattern | Default rounds | Default wall time | Source |
|---|---|---|---|
| Critique-Revise | 1 critique + 1 revision | 15 min | Pablo: "one revision; more rewards the critic's voice, not the proposal's" |
| Red-Team | 1 pass / 1 assumption | 10 min | Pablo: "the forced economy of attention is what makes it useful" |

Overrides are possible but must be logged. The workflow doesn't enforce wall-clock today — that arrives in v0.2 with the loop budget primitive.

## Roadmap

| Version | Adds | Defers | Why this version |
|---|---|---|---|
| **v0.1** (this) | SDD + Critique-Revise + Red-Team + Layer B claim extraction | Dialectic, verification, retrieval, semantic conflict | Ship the substrate. Validate the folder shape. |
| **v0.2** (sketched 2026-06-14) | Dialectic with author anonymization, Layer A foundation snapshot per run, basic verification (replay critique against revised SDD), `_archive/` automation | Tree of Thoughts, multi-run conflict resolution | The Mario gate: termination contract + provenance hash become enforced. Pattern file shipped at `../team/roles/loops/dialectic.md`; orchestration deferred until CTO + Mario sign off on anonymization layer. |
| **retrospective-v0.1** (shipped 2026-06-14) | deprecated — superseded by `retrospective.js` with cadence arg (kept as historical artifact) | — | First cut of the self-improvement loop. Surpassed once the four-cadence model landed; the file remains for provenance. |
| **continuous-improvement-substrate-v0.1** (shipped 2026-06-14) | `improvement_signal` as a first-class loop output + 4-cadence retrospective (`retrospective.js` keyed by cadence: per-loop / sprint / pre-tag / quarterly) + `metrics/` observation layer + OKR adoption proposals at `intent-spec/_PROTOCOL_PROPOSALS/` + horizons auto-maintenance | The OKRs themselves (proposals stand, adoption is the next decision); signal-to-action measurement (the metric of metrics) until one full quarter of runs is in the stream | Improvement is not an event after a sprint — it is a continuous substrate. The five components ship together because each one without the others degrades to noise, scoreboard without game, or wall art. See `## The continuous-improvement substrate` below. |
| **protocol-32-seal-v0.1** (shipped 2026-06-14) | Protocol §32 (Generative Loops) added to `protocol.md`; protocol version bumped to v4.4; `team/roles/loop-coordinator.md` ephemeral role file shipped; worked example at `loops/2026-06-14-critique-revise-001/`; 3-reviewer cross-domain audit (UXR + Designer + CLO) verdicts baked into sealed text via `_seal-fix-list.md` | First sprint-cadence retrospective on this slug deferred 24h per the trigger checklist; v0.2 Dialectic + anonymization layer remain on the Q3 return ticket | The seal converts §32 from a shaped intent into operative protocol. Cross-domain review caught discoverability, dignity, and accessibility gaps that the de-risk test alone could not surface — each baked in rather than deferred, on the principle that protocol text ships once and is hard to amend mid-cycle. |
| **fix-schema-enforcement-gap-v0.1** (shipped 2026-06-14) | `_SCHEMA_PATTERNS.md` written as the discipline doc every future workflow script must read before defining agent() schemas; 6 metric files compressed from 272–413 words down to ≤220 each under hard `maxLength` enforcement; `metrics/_signals.jsonl` initialized with the first detected→fixed cycle the substrate performed on itself | Generalization of the post-write checker primitive across all workflow scripts (this run fixed the metrics slug; other scripts inherit the pattern via `_SCHEMA_PATTERNS.md` rather than via a tool change) | The substrate had a false-pass failure mode (`continuous-improvement-substrate-v0.1` reported `all_within_budget: false` but the schema accepted it because presence-not-value was being validated). Same failure shape CISO scored 0/15 against in the §32 de-risk test. Fixing the substrate that detected its own failure but shipped anyway is itself first-class work. |
| **v0.3** | Tag-filter retrieval over `claims.yaml`, MODIFY operation when an idea revises a prior one, semantic conflict detection between concurrent runs | Tree of Thoughts, embedding retrieval | When the corpus crosses ~50 claims. |
| **v0.4+** | Tree of Thoughts for high-stakes ideation (single pattern, deeply guardrailed), embedding-based retrieval, Tier 2 LLM-judge verification | — | When we have the production runs to know what's missing. |

## The self-improvement principle

Per Owner directive (2026-06-14): *"self-improving is as important as executing the task, should be appended after every major sprint."*

After every major sprint that produces a **shipped** (PROCEED or DE-RISK → HOLDS → PROCEED) shaped-brief, run `retrospective-v0.1.js` on that slug. This is **not optional** — it is the equal-importance partner to idea-execution. Without it, the team's ability to improve its own infrastructure degrades release-over-release. Idea-execution alone ships product. Idea-execution plus retrospective ships product *and* improves the substrate that ships the next product. Skipping the retro is the same shape of debt as skipping tests: invisible today, compounding tomorrow.

**Trigger checklist** (all three must hold before firing retrospective-v0.1):

- [ ] Shaped-brief has `Decision: PROCEED` or `DE-RISK → HOLDS → PROCEED`
- [ ] At least 24 hours have passed since the shipped artifact was deployed (so observable outcomes — not just author confidence — exist to retro against)
- [ ] No prior retrospective for this slug in `intent-spec/_RETRO-INDEX.md`

If any box fails, do not run the retro yet. Wait for the 24h window, dedupe against the index, or — for KILL / REVISE outcomes — log the decision in `history.md` instead. KILLs get a different review path (kill-log), not retrospective-v0.1.

## The continuous-improvement substrate

Per Owner directive (2026-06-14): *"este loop de improvement deberia ser continue a traves de loops y rituals."* Improvement is not an event that happens after a sprint — it is a **continuous substrate** running at four cadences, with loops generating raw signal and rituals consuming it.

**The four cadences** (`retrospective.js --cadence <name>`):

- **per-loop** — fires on every loop close; cheapest layer, captures friction in the same turn it was felt.
- **sprint** — fires at the end of a shipped shaped-brief; consumes the per-loop stream for that slug and decides what to amend.
- **pre-tag** — fires before a release tag; cross-slug pattern detection on the accumulated stream since the last tag.
- **quarterly** — fires once per quarter; consumes the metrics layer and asks whether the substrate itself is improving (the meta-question).

**The `improvement_signal` field.** Every loop close emits one. It is a one-line, one-action-able friction note plus a `suggested_target` (loop-pattern / layer-A / workflow / protocol / none). Schema and enforcement: [`../team/roles/loops/_IMPROVEMENT_SIGNAL.md`](../team/roles/loops/_IMPROVEMENT_SIGNAL.md). Empty signals are rejected by the same convergence contract that rejects missing `would-have-wrongly-killed`.

**The metrics layer.** Observation of whether the substrate is actually improving — signal volume, friction recurrence, time-to-amendment, cadence latency. See [`../metrics/`](../metrics/). Rituals read these to decide whether their own attention is well-spent.

**The OKR adoption proposals.** Quarterly targets for the substrate live as proposals at [`../intent-spec/_PROTOCOL_PROPOSALS/`](../intent-spec/_PROTOCOL_PROPOSALS/). Proposals stand; adoption is the next decision.

**Why these five components shipped together.** Per the irreducibility note in `_HORIZONS.md`: improvement signal without metrics is noise; metrics without OKRs is scoreboard without game; OKRs without rituals is wall art; rituals without continuous loop signal are ceremonies that did not earn their attention. Any four of five collapses the fifth. Ship together or ship none.

## Schema patterns reference

Every workflow script defines `agent()` schemas that constrain what each spawned agent returns. Schemas that validate **presence** of a self-reported field (e.g., a boolean `within_budget`) rather than the **value** that field claims to summarize (e.g., the actual word count of an output file) are how the substrate ships failures it has already detected. The `continuous-improvement-substrate-v0.1` run on 2026-06-14 made this mistake; `fix-schema-enforcement-gap-v0.1` fixed it the same day and produced the discipline doc.

**Before defining any new `agent()` schema, read [`_SCHEMA_PATTERNS.md`](_SCHEMA_PATTERNS.md).** It is non-optional reading for workflow authors — the canonical patterns for hard `maxLength` enforcement on file outputs, re-prompt-on-overrun, and the rule that no schema may accept a self-reported summary boolean in place of the underlying value. Future workflow scripts that bypass these patterns are subject to the same false-pass failure mode this slug eliminated, and reviewers should flag the bypass as a substrate-level regression, not a stylistic preference.

## Cross-references

- Layer A foundation → `../foundation/README.md`
- Layer C task context → `../intent-spec/README.md`
- Layer B specifications → `../generated-spec/README.md`
- Brain structure source: Sidharta Rezende, Diego Mattos — *A Layered Context Architecture for AI-Assisted Engineering in Nu-Global* (referenced in conversation)
