# SDD: protocol-32-generative-loops
**Date:** 2026-06-14
**Author:** PM (auto-drafted)
**Stage:** Draft v2 (revised against Layer C critique)

## Problem

team-sdk agents already disagree, spawn peers, and produce synthesis — but the *quality of dissent* is not load-bearing. Today, when Mario or the CTO says "challenge this," it happens as a one-shot Bus exchange: one agent critiques, the author responds, and the loop closes by social default rather than by a declared contract. There is no recorded transition, no provenance on the resulting artifact, and no termination rule beyond "we feel done." The 2024–2026 literature on multi-agent critique (and our own sdk-health trace on the last three releases) shows two failure modes this exposes us to: (1) **sycophantic collapse** — the critic concedes to a confident author within 1–2 turns, especially when roles are named, because named-role architectures *are themselves* a sycophancy attack surface; and (2) **unbounded deliberation** — Level 1 freeform reasoning expands indefinitely when no one owns the termination contract, violating §24. Generative Loops (protocol §32) is the constraint that makes critique *mechanical* — declared shape, declared termination, declared provenance — without turning it into another agent to please.

The window is now because we are about to seal v2026.Q2.1 and the next release cycle will involve the first multi-engineer pod execution. If we ship without §32, every Mario gate becomes a freeform deliberation surface and we will be debugging revision-trail loops instead of building.

## Target user

**Spawning agents inside team-sdk — primarily Mario (Chief Engineer), CTO, and PM — at the three insertion points Mario named: Phase 0 (Discovery framing), Architecture (SDD review), and Implementation (pre-merge artifact review).** Their problem today: they need adversarial pressure on a draft, but invoking it costs them control of scope and termination, so they either skip it or get stuck in it.

**Cross-domain audit before ship.** v0.1 protocol text and the two pattern specs will be reviewed by Designer, UXR, CLO, and CISO in a single async Bus pass before §32 seals — specifically to answer: does Critique-Revise map onto design critique and research synthesis without distortion, and does Red-Team's "name the assumption you are not attacking" line collide with CLO/CISO threat-modeling vocabulary? If any of these four returns a substantive shape conflict, v0.1 reopens for one revision. They are not insertion-point owners in v0.1 — Mario's three points stand — but they are *shape reviewers* on the protocol itself, with the explicit power to block. (Addresses Soul Principle 4: silent exclusion is what we are paying down here.)

## Appetite

**M (1 week).** This is protocol surface area — a new §32 section, a new ephemeral agent type, two pattern specs, a state-file convention, and Mario's four guardrails. It touches `protocol.md`, `AGENTS.md`, `team/roles/_template.md`, and adds `team/roles/loop-coordinator.md`. It does not touch any execution path or shipping cycle. One week is the honest Appetite — less is dishonest because of the guardrail surface; more invites the Dialectic pattern back in, which we are explicitly deferring.

One worked example of a Critique-Revise loop — *real, end-to-end, with state.md and provenance hash on the emitted artifact* — fits inside the week and ships with §32 (see Solution sketch §6). It is not a stub; it is the trace from running Critique-Revise on this very SDD as we close it out. That makes this SDD's own revision the v0.1 reference example, and means the first three production loops in the next release are not the first three loops ever run. (Addresses Soul Principle 5.)

## Solution sketch

**Ship §32 with exactly two patterns — Critique-Revise and Red-Team — and one ephemeral agent type — Loop Coordinator — wired to Mario's four guardrails. Nothing else.**

Concretely, the minimum-value increment is:

1. **Protocol §32 text** in `protocol.md` defining: Loop Coordinator role contract (ephemeral, per-loop, driver-not-judge — coordinates turn order and termination, does not opine on content); the two v0.1 patterns with Mario's mandatory `TRIGGER_SHAPE` / `NON_TRIGGER_SHAPE` declarations on each; the LOOP-YYYYMMDD-<pattern>-<seq> ID format; the loops/<id>/state.md per-loop state file with **three required headings (Open, Turns, Terminate) and a `WEAKNESS_HYPOTHESIS:` field on Open** (see §7 below); and the Bus Log rule that only loop *transitions* (open, turn boundary, terminate) appear on the Bus — internal turns stay in state.md.
2. **Mario's asymmetric termination contract**: budget-default (turn count or token cap declared at loop open by the spawning agent), early-stop authorized unilaterally by the spawning agent, extension requires countersign by a second agent at peer-or-higher tier per the §1 escalation ladder. Cross-domain countersign (e.g., CISO countersigning a CTO loop) is permitted and counts as peer tier. No Loop Coordinator extension authority.
3. **Mario's provenance hash**: every artifact emitted from a loop carries a `LOOP-PROVENANCE:` line with the loop ID and SHA-256 of the canonicalized artifact body. Loop ID is appended unhashed so the same artifact may legitimately surface from two loops; the binding is loop→artifact, not loop⇔artifact-only. Grep-able by sdk-health.
4. **Mario's Constitutional Critique-Revise guardrail**: the critic turn MUST emit a `would-have-wrongly-killed:` line naming at least one valid property of the draft the critique does *not* damage. Loop fails closed if absent. Red-Team's analog — `assumption-not-attacked:` — is **in v0.1**, not deferred (see Open questions resolution below). Cheap to specify, expensive to retrofit.
5. **`team/roles/loop-coordinator.md`** as a new role file following `_template.md`, with consultation mode disabled (this agent only exists inside a loop). The file declares `SOLUTION_CLASS: Level 3 (deterministic state machine)` for turn-coordination, budget enforcement, and termination logic — these are not persona reasoning surfaces. The role file is a thin wrapper around a state machine spec; Level 1 reasoning is reserved only for tie-breaks the spawning agent explicitly delegates. (Addresses §24 / Halloway determinism pre-flight.)
6. **`loops/2026-06-14-critique-revise-001/`** — the worked example, generated by running Critique-Revise on this SDD itself between v1 and v2. Ships in `project-template/` and is the v0.1 reference. Includes state.md with all three headings populated, the `would-have-wrongly-killed:` line that survived, the `LOOP-PROVENANCE:` line on the v2 SDD, and a one-paragraph debrief on what the shape got right and wrong. New spawning agents read this before opening their first loop.
7. **`WEAKNESS_HYPOTHESIS:` required on loop open.** The spawning agent must name, in one sentence, the specific weakness they expect the loop to expose. This is the anti-reflex lever: it costs judgment to open a loop, not just a Bus message. If the hypothesis turns out wrong, that is fine — the loop output records the miss and the next loop is better-aimed. If no hypothesis can be articulated, the loop does not open. (Addresses Constraint 1: protects human/agent judgment from procedural substitution.)

Dialectic is **deferred to v0.2** explicitly because named-role critique without author anonymization is a known sycophancy surface; we will not ship it until the anonymization layer is designed.

## Non-Negotiables

- **Driver-not-judge**: Loop Coordinator never produces content opinions. It coordinates turns and enforces termination via a declared state machine (Level 3). Violations void the loop's artifacts.
- **Asymmetric termination**: spawning agent can early-stop; nobody (not even Mario) can extend without countersign. This is the anti-sycophancy lever — it must cost two signatures to keep talking.
- **TRIGGER_SHAPE / NON_TRIGGER_SHAPE on every pattern**: prevents freeform "should we use Critique-Revise here?" deliberation. Pattern selection is Level 3, not Level 1.
- **`WEAKNESS_HYPOTHESIS:` on every loop open**: the spawning agent declares the specific weakness in the draft the loop is meant to expose. No hypothesis, no loop. This is the constraint that keeps loop-opening as an act of judgment, not a reflex.
- **`would-have-wrongly-killed:` on every Constitutional Critique-Revise turn** and **`assumption-not-attacked:` on every Red-Team turn**: both critics must name what they preserve / do not attack. Fails closed.
- **Loop provenance hash on emitted artifacts**: grep-able, auditable, non-optional. Artifacts without it do not cross gates.
- **Bus Log records transitions only**: internal loop turns live in state.md. This protects Bus signal-to-noise and §24 ratchet detection.
- **Three valid insertion points only — Phase 0, Architecture, Implementation**: Mario's call. No mid-execution loops; those are reviews, not loops.
- **Cross-domain shape review before seal**: Designer, UXR, CLO, CISO each must respond on the v0.1 protocol text before §32 seals. Substantive shape conflict reopens v0.1.
- **Worked example ships with v0.1**: `loops/2026-06-14-critique-revise-001/` is generated as we close this SDD and ships in `project-template/`. Not a stub.

## Out-of-Bounds

- **Dialectic pattern.** Deferred to v0.2. Return ticket: triggered when the anonymization layer design is accepted by CTO + Mario, owned by PM, target window v2026.Q3. Not in v0.1. Do not stub.
- **Author anonymization layer.** Same return ticket as Dialectic — v0.2, PM owner, Q3 target.
- **Loop Coordinator persistence.** The agent is ephemeral per loop. No memory file, no consultation mode, no cross-loop state.
- **Automatic loop invocation.** No agent auto-spawns loops in v0.1. Spawning is explicit by Mario/CTO/PM at the three named insertion points.
- **Loops on the Shipping Cycle execution path.** §32 belongs to ideation and architecture review surfaces. Not sprint execution.
- **More than two patterns.** Resist. Critique-Revise + Red-Team is the entire v0.1 surface.
- **Modifying §24 (Halloway Ratchet) or §16 (Consultation).** §32 sits beside them, not on top of them. Cross-references only.
- **CLI changes.** No `sdk-loop` command in v0.1. Loops are invoked from inside agent context. CLI surface is v0.2 territory.

## Open questions

- **Countersign tier table** — **RESOLVED in v0.1**: peer-or-higher per the §1 escalation ladder, and cross-domain countersign is explicitly permitted (CISO ↔ CTO, CLO ↔ PM). The Red-Team pattern requires cross-domain by construction. Encoded in the role file boilerplate.
- **State.md schema** — **RESOLVED in v0.1**: three required headings (Open, Turns, Terminate) plus `WEAKNESS_HYPOTHESIS:` on Open. Free-form markdown inside each heading. Strict enough that sdk-health can detect orphans (Open present, Terminate missing past TTL); loose enough not to over-fit the shape before we have run real loops. Schema tightening deferred to v0.2 with the explicit return ticket that v0.1 loop output informs it.
- **Provenance hash algorithm** — **RESOLVED in v0.1**: SHA-256 of canonicalized artifact body; loop ID appended unhashed (per §3 above).
- **Red-Team constitutional guardrail line** — **RESOLVED in v0.1**: `assumption-not-attacked:` on every Red-Team critic turn. Symmetric with `would-have-wrongly-killed:`. (Mario opened, PM closed under critique pressure: cheap to specify now, expensive to retrofit, and the sdk-health detector needs both lines to exist to do its job — Soul Principle 2 / broken windows.)
- **Insertion-point enforcement** — **OPEN, intentionally**: encode `LOOP_INSERTION_POINT:` as a required field on loop open, or leave it to role discipline? Lean required-field, but defer to v0.1 implementation pass — this is the one open question whose answer genuinely depends on what the first three loops feel like, and the cost of getting it wrong is one revision, not a wedge.

## Success looks like

- Mario can open a Critique-Revise loop on any SDD draft with one Bus message declaring `TRIGGER_SHAPE`, pattern, budget, insertion point, and `WEAKNESS_HYPOTHESIS:` — and the Loop Coordinator drives it to termination via its declared state machine without anyone debating "are we done yet."
- Every artifact emitted from a §32 loop carries a `LOOP-PROVENANCE:` line that `grep -r "LOOP-2026"` finds in the project tree.
- `sdk-health` gains a check for orphaned `loops/<id>/state.md` files (Open heading present, Terminate heading missing past TTL) and flags them within one release cycle. The schema is strict enough for this to work on v0.1.
- The first three Critique-Revise loops on the next release each contain a `would-have-wrongly-killed:` line that names a real preserved property — not a placeholder. Red-Team loops contain `assumption-not-attacked:`. If a critic cannot name one, the loop fails closed and we learn the critique was over-broad. This is the signal we are *actually* attacking sycophancy.
- The v0.1 worked example (`loops/2026-06-14-critique-revise-001/`) is referenced by at least one of those first three loops as "the shape we are matching" — confirming the example is load-bearing, not decorative.
- Designer, UXR, CLO, and CISO each return a one-paragraph shape review on §32 before seal. At least one returns a substantive concern, because if all four return clean we did not actually ask them anything.
- Zero Bus messages contain internal loop turn content. All internal turns live in state.md. Bus shows only open/transition/terminate.
- No v0.2 features (Dialectic, anonymization, CLI, auto-invocation) leak into the v0.1 ship. The shaped brief crosses to Shipping with §32 v0.1 scope intact, and v0.2 features carry named owners and target windows.
