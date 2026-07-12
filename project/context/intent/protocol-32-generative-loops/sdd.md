# SDD: protocol-32-generative-loops
**Date:** 2026-06-14
**Author:** PM (auto-drafted)
**Stage:** Draft v1

## Problem

team-sdk agents already disagree, spawn peers, and produce synthesis — but the *quality of dissent* is not load-bearing. Today, when Mario or the CTO says "challenge this," it happens as a one-shot Bus exchange: one agent critiques, the author responds, and the loop closes by social default rather than by a declared contract. There is no recorded transition, no provenance on the resulting artifact, and no termination rule beyond "we feel done." The 2024–2026 literature on multi-agent critique (and our own sdk-health trace on the last three releases) shows two failure modes this exposes us to: (1) **sycophantic collapse** — the critic concedes to a confident author within 1–2 turns, especially when roles are named, because named-role architectures *are themselves* a sycophancy attack surface; and (2) **unbounded deliberation** — Level 1 freeform reasoning expands indefinitely when no one owns the termination contract, violating §24. Generative Loops (protocol §32) is the constraint that makes critique *mechanical* — declared shape, declared termination, declared provenance — without turning it into another agent to please.

The window is now because we are about to seal v2026.Q2.1 and the next release cycle will involve the first multi-engineer pod execution. If we ship without §32, every Mario gate becomes a freeform deliberation surface and we will be debugging revision-trail loops instead of building.

## Target user

**Spawning agents inside team-sdk — primarily Mario (Chief Engineer), CTO, and PM — at the three insertion points Mario named: Phase 0 (Discovery framing), Architecture (SDD review), and Implementation (pre-merge artifact review).** Their problem today: they need adversarial pressure on a draft, but invoking it costs them control of scope and termination, so they either skip it or get stuck in it.

## Appetite

**M (1 week).** This is protocol surface area — a new §32 section, a new ephemeral agent type, two pattern specs, a state-file convention, and Mario's four guardrails. It touches `protocol.md`, `AGENTS.md`, `team/roles/_template.md`, and adds `team/roles/loop-coordinator.md`. It does not touch any execution path or shipping cycle. One week is the honest Appetite — less is dishonest because of the guardrail surface; more invites the Dialectic pattern back in, which we are explicitly deferring.

## Solution sketch

**Ship §32 with exactly two patterns — Critique-Revise and Red-Team — and one ephemeral agent type — Loop Coordinator — wired to Mario's four guardrails. Nothing else.**

Concretely, the minimum-value increment is:

1. **Protocol §32 text** in `protocol.md` defining: Loop Coordinator role contract (ephemeral, per-loop, driver-not-judge — coordinates turn order and termination, does not opine on content); the two v0.1 patterns with Mario's mandatory `TRIGGER_SHAPE` / `NON_TRIGGER_SHAPE` declarations on each; the LOOP-YYYYMMDD-<pattern>-<seq> ID format; the loops/<id>/state.md per-loop state file; and the Bus Log rule that only loop *transitions* (open, turn boundary, terminate) appear on the Bus — internal turns stay in state.md.
2. **Mario's asymmetric termination contract**: budget-default (turn count or token cap declared at loop open by the spawning agent), early-stop authorized unilaterally by the spawning agent, extension requires countersign by a second agent at peer-or-higher tier. No Loop Coordinator extension authority.
3. **Mario's provenance hash**: every artifact emitted from a loop carries a `LOOP-PROVENANCE:` line with the loop ID and a content hash; grep-able by sdk-health.
4. **Mario's Constitutional Critique-Revise guardrail**: the critic turn MUST emit a `would-have-wrongly-killed:` line naming at least one valid property of the draft the critique does *not* damage. Loop fails closed if absent.
5. **`team/roles/loop-coordinator.md`** as a new role file following `_template.md`, with consultation mode disabled (this agent only exists inside a loop).

Dialectic is **deferred to v0.2** explicitly because named-role critique without author anonymization is a known sycophancy surface; we will not ship it until the anonymization layer is designed.

## Non-Negotiables

- **Driver-not-judge**: Loop Coordinator never produces content opinions. It coordinates turns and enforces termination. Violations void the loop's artifacts.
- **Asymmetric termination**: spawning agent can early-stop; nobody (not even Mario) can extend without countersign. This is the anti-sycophancy lever — it must cost two signatures to keep talking.
- **TRIGGER_SHAPE / NON_TRIGGER_SHAPE on every pattern**: prevents freeform "should we use Critique-Revise here?" deliberation. Pattern selection is Level 3, not Level 1.
- **`would-have-wrongly-killed:` on every Constitutional Critique-Revise turn**: critic must name what the critique preserves. Fails closed.
- **Loop provenance hash on emitted artifacts**: grep-able, auditable, non-optional. Artifacts without it do not cross gates.
- **Bus Log records transitions only**: internal loop turns live in state.md. This protects Bus signal-to-noise and §24 ratchet detection.
- **Three valid insertion points only — Phase 0, Architecture, Implementation**: Mario's call. No mid-execution loops; those are reviews, not loops.

## Out-of-Bounds

- **Dialectic pattern.** Deferred to v0.2 pending author-anonymization design. Not in this ship. Do not stub.
- **Author anonymization layer.** Same reason — v0.2.
- **Loop Coordinator persistence.** The agent is ephemeral per loop. No memory file, no consultation mode, no cross-loop state.
- **Automatic loop invocation.** No agent auto-spawns loops in v0.1. Spawning is explicit by Mario/CTO/PM at the three named insertion points.
- **Loops on the Shipping Cycle execution path.** §32 belongs to ideation and architecture review surfaces. Not sprint execution.
- **More than two patterns.** Resist. Critique-Revise + Red-Team is the entire v0.1 surface.
- **Modifying §24 (Halloway Ratchet) or §16 (Consultation).** §32 sits beside them, not on top of them. Cross-references only.
- **CLI changes.** No `sdk-loop` command in v0.1. Loops are invoked from inside agent context. CLI surface is v0.2 territory.

## Open questions

- **Countersign tier table**: who counts as "peer-or-higher" for extension countersign? Mario's instinct is the existing escalation ladder (§1), but Red-Team loops may need a tier definition that crosses domains (a CISO countersigning a CTO loop extension, for example). Resolving this changes the role file boilerplate.
- **State.md schema**: how strict? A free-form markdown file is fastest to ship; a schema is needed for sdk-health to detect stuck loops. Lean: ship markdown with three required headings (Open, Turns, Terminate) and add schema in v0.2.
- **Provenance hash algorithm**: SHA-256 of canonicalized artifact body is the obvious answer; the open question is whether the loop ID itself participates in the hash (preventing replay of the same artifact across loops) or is appended unhashed (allowing the same artifact to be emitted from two loops legitimately). CTO call.
- **Red-Team `would-have-wrongly-killed:` analog**: does Red-Team need its own constitutional guardrail line, or is "name the assumption you are not attacking" enough? Mario opened this and did not close it.
- **Insertion-point enforcement**: do we encode the three insertion points as a `LOOP_INSERTION_POINT:` required field on loop open, or leave it to role discipline? Required field is cheaper but adds protocol surface.

## Success looks like

- Mario can open a Critique-Revise loop on any SDD draft with one Bus message declaring `TRIGGER_SHAPE`, pattern, budget, and insertion point — and the Loop Coordinator drives it to termination without anyone debating "are we done yet."
- Every artifact emitted from a §32 loop carries a `LOOP-PROVENANCE:` line that `grep -r "LOOP-2026"` finds in the project tree.
- `sdk-health` gains a check for orphaned `loops/<id>/state.md` files (opened, never terminated) and flags them within one release cycle.
- The first three Critique-Revise loops on the next release each contain a `would-have-wrongly-killed:` line that names a real preserved property — not a placeholder. If the critic cannot name one, the loop fails closed and we learn the critique was over-broad. This is the signal we are *actually* attacking sycophancy.
- Zero Bus messages contain internal loop turn content. All internal turns live in state.md. Bus shows only open/transition/terminate.
- No v0.2 features (Dialectic, anonymization, CLI, auto-invocation) leak into the v0.1 ship. The shaped brief crosses to Shipping with §32 v0.1 scope intact.
