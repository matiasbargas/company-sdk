# §32 Shape Review — UX Researcher

**Reviewer:** UX Researcher
**Date:** 2026-06-14
**Pass:** v0.1 pre-seal cross-domain shape review (blind to Designer, CLO)
**Verdict in brief:** Substantive concern. Should be addressed before seal.

---

## Q1 — Critique-Revise on a Research Synthesis

**Verdict:** `substantive_distortion`

A Research Synthesis is not the same shape of artifact as an SDD or a strategy memo. Its trustworthiness rests on a structure Layer A does not address:

- **Evidence chain.** Every finding traces back to a session, a quote, a count. The critique question is "does this claim survive when you walk it back to the raw data?" — not "does this claim honor a principle?"
- **Sample-frame transparency.** The trustworthy synthesis names who we did NOT recruit, and where that biases the read. Layer A is silent on sample frame.
- **Negative space.** What was not observed is half the data. A synthesis that fails to name silence is unreliable in a way the Constraints + Soul constitution will not catch.
- **Falsifiability clause.** A good synthesis names what finding, observed next cycle, would invalidate it. Layer A does not ask this question.
- **Observation vs. inference discipline.** The most common research failure mode is dressing inference as observation. This is a methodological category error invisible to a principle-drift critic.

The `would-have-wrongly-killed:` guardrail is shaped against timidity — protecting bold moves from over-cautious critique. In research synthesis, the dominant failure runs the other way: **bold inferences from thin evidence**. Forcing the critic to preserve a bold strategy is a sycophancy lever pointed at the wrong target when the artifact is a synthesis. A researcher running Critique-Revise as currently shaped would systematically come out the other side with their over-confident inferences validated by the guardrail, while methodological soundness goes unexamined.

This is not a tweak to v0.1 wording. It is a domain-mismatch admission: v0.1 Critique-Revise is shaped for proposal/strategy artifacts, and Research Synthesis is `NON_TRIGGER_SHAPE` for it.

## Q2 — Red-Team's "one killing assumption" on a research artifact

**Verdict:** `substantive_distortion`

Red-Team's intent — name ONE assumption that, if wrong, voids the plan — is engineered for artifacts whose trustworthiness rests on a single load-bearing beam: an architecture decision, a market entry call, an irreversible spend. A Research Synthesis does not have that shape. Its trustworthiness rests on a **stack of compounding assumptions** that interact:

- Recruitment frame (we sampled X, missed Y)
- Question framing (we asked it this way; another framing would surface different signals)
- Interpretation (we read this quote as evidence of frustration; another reader sees confusion)
- Negative-space discipline (what we did not ask)
- Method-confidence honesty (was N=8 enough for this claim?)

Each one is partially load-bearing. None alone usually voids the synthesis. Five of them aligning is the classical research failure — and that failure is invisible to a pattern that lets the proposer log-and-defer the single named assumption. The `assumption-not-attacked:` line helps at the edge — but its singleton sibling baked into the pattern's intent is the wrong shape for research. A researcher running Red-Team on a synthesis would honestly log one assumption as accepted risk, ship the synthesis, and the compounding stack would walk through the gate untouched.

The Red-Team pattern as shaped is fine for SDDs and architecture decisions. It should not be the v0.1 pattern researchers reach for to pressure-test a study.

## Q3 — UXR hook into the loop substrate itself

**Verdict:** `UXR_silently_excluded`

§32 ships an `improvement_signal` stream appended to `metrics/_signals.jsonl` — an append-only continuous-signal channel describing friction with the substrate. The spec names rituals (retro, pre-tag, version bumps) as consumers. UX Research is not named.

This is the same shape of data as AI conversation logs — continuous behavioral signal about how a substrate is being used by its actual users (in this case, the agents themselves). My role file calls AI conversation logs "a research goldmine that most teams never use." The loop signal stream is structurally identical: real-time, unprompted, friction-labeled behavioral data about substrate use. §32 leaves it on the table for ritual consumption only.

The cross-domain shape review (this pass) is one-shot pre-seal. There is no hook for ongoing UXR analysis of how the loop substrate is actually being used. Without one, the team will have no research-quality answer to "are loops working in practice" — only the gate-check sample audit of constitutional line quality, which is structural-assurance work, not behavioral research.

The fix is small: name UXR as a consumer of `_signals.jsonl` alongside rituals, with the explicit clause that signals are an analysis surface for friction-pattern study. No new infrastructure. One sentence in §32.

## Substantive concern

**Yes.** Two distortions and one silent exclusion converge on the same fix surface: v0.1 ships two patterns shaped for proposal/strategy artifacts without acknowledging that Research Synthesis is `NON_TRIGGER_SHAPE` for both, AND ships a signal stream UXR has no formal hook into.

## Severity

**`should_be_addressed`** — not `blocks_seal`. The patterns ship correctly for the artifacts Mario named as insertion points (Phase 0, Architecture, Implementation). Research artifacts are not yet in the loop surface, so the distortion is currently latent — but if it is not flagged in v0.1, the first time a researcher reaches for Critique-Revise on a synthesis (likely in the next cycle), they will produce worse research than they would have without the pattern, and the team will declare the pattern working because the format passed.

## Suggested fix (one-line, v0.1 protocol text)

Add to §32 protocol text, in the patterns section: **"Research Synthesis artifacts are `NON_TRIGGER_SHAPE` for both v0.1 patterns; a Research-Synthesis-shaped critique pattern is a v0.2 return ticket (owner: UX Researcher)."** And in the same section, name UXR as a co-consumer of `metrics/_signals.jsonl` for ongoing friction-pattern analysis of loop substrate use.
