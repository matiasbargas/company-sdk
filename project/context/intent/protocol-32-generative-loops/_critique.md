# Constitutional Critique — protocol-32-generative-loops SDD v1

**Date:** 2026-06-14
**Critic:** Constitutional Critic (Layer A foundation)
**Pattern:** Single-pass Critique-Revise (Pablo) with Mario's `would-have-wrongly-killed` guardrail

---

## Part 1 — Critiques

### 1. Constraint 1 — Human agency / capability not dependency — HIGH

**SDD section:** Solution sketch (Loop Coordinator role definition) and Non-Negotiables (driver-not-judge clause)

**Conflict:** The Loop Coordinator is defined entirely by what it does *not* do — "never produces content opinions," "driver-not-judge" — but the SDD never says how spawning agents (Mario, CTO, PM) build the *judgment* to know when to open a loop, when to early-stop, and what shape of critique they need. Over multiple releases, agents will learn to reach for "open a loop" the way they reach for "ask Claude" — a procedural reflex that substitutes for the harder judgment about what kind of pressure a draft actually needs. The agency the loop is meant to protect (the spawning agent's critical thinking) becomes dependency on the loop machinery. Constraint 1 forbids harm-through-dependency, including the dependency of expert agents on a process scaffold they no longer reason about.

**What's missing:** A line in §32 saying "before opening a loop, the spawning agent declares in one sentence what specific weakness they expect the loop to expose, and why a peer Bus message would not surface it." This forces the cognition to happen *before* the machinery engages.

---

### 2. Soul Principle 5 — Code is the last part — HIGH

**SDD section:** Solution sketch (items 1-5) and Appetite

**Conflict:** The entire Solution sketch is mechanism — protocol text, ID format, state file convention, guardrail lines, role file. There is no upstream artifact that demonstrates the *thinking* this protocol encodes: no worked example of Mario running a Critique-Revise loop on a real draft and showing what state.md looks like, no walkthrough of a `would-have-wrongly-killed:` line on a real critique, no example of an early-stop versus a budget-exhaustion termination. Shipping the protocol without a worked example means the first three loops will be the worked examples — under release pressure, with no fallback if the shape is wrong. This is "code first, thinking later" at the protocol level.

**What's missing:** A worked example (loop transcript with state.md, Bus transitions, and provenance hash) as a deliverable inside Appetite, not as a Success-looks-like aspiration.

---

### 3. Soul Principle 4 — Diversity is our superpower — MED

**SDD section:** Target user and Solution sketch (insertion points)

**Conflict:** Loops are scoped to three insertion points (Phase 0, Architecture, Implementation) and to three spawning agents (Mario, CTO, PM). The SDD says this is "Mario's call." Designer, UX Researcher, CLO, CISO, and Liaison — all of whom routinely produce drafts that benefit from adversarial pressure — are silently excluded. The protocol is being shaped by the engineering-heavy view of what "review" looks like, which is exactly the diversity gap the principle warns against. There is no recorded peer view from Designer or UXR on whether a Critique-Revise loop maps onto a design critique or a research synthesis.

**What's missing:** Either (a) a documented spawn to Designer / UXR / CLO before sealing v0.1 scope, with their input on whether the two patterns serve their drafts, or (b) an explicit statement that v0.1 is engineering-pattern-only and v0.2 will widen — owned, not silent.

---

### 4. Soul Principle 2 — Fix every broken window / zero tech debt — MED

**SDD section:** Open questions (state.md schema, provenance hash algorithm, countersign tier table, Red-Team analog)

**Conflict:** Five open questions are flagged but the resolution path defers four of them to v0.2 or to "lean: ship markdown." Shipping protocol surface area with unresolved schema, unresolved countersign authority, and unresolved Red-Team constitutional guardrail creates exactly the compounding debt Principle 2 names. The state.md "three required headings, schema later" is a broken window the moment sdk-health needs to detect stuck loops — which the SDD itself names as a Success criterion. You cannot ship "sdk-health flags orphaned loops" and "state.md schema is v0.2" in the same release.

**What's missing:** Resolve the state.md schema and the Red-Team guardrail line *before* sealing v0.1, or move "sdk-health detects orphaned loops" to v0.2 alongside them. They are coupled.

---

### 5. Halloway Ratchet (§24) — Determinism pre-flight — MED

**SDD section:** Solution sketch (Loop Coordinator) and Non-Negotiables

**Conflict:** The SDD does not declare a SOLUTION_CLASS for the Loop Coordinator's turn-coordination logic. Turn ordering, budget enforcement, and termination checking are deterministic Level 3 problems (a state machine plus a counter). Yet the role file is described as a persona-style agent file ("follows `_template.md`"). If the Loop Coordinator is implemented as Level 1 freeform reasoning over each turn, it will itself become a revision-trail surface — the very failure mode §24 names. The constitution requires a determinism pre-flight on exactly this kind of decomposition (KNOWN coordination + EXPLORATORY content review = HYBRID).

**What's missing:** Declare in the SDD that Loop Coordinator turn-coordination is `KNOWN` (Level 3 state machine), content review by participants is `EXPLORATORY` (Level 1), and the loop overall is `HYBRID`. Then specify which parts of the coordinator are encoded as deterministic protocol versus role-driven reasoning.

---

### 6. Constraint 3 — System integrity / decision-record integrity — LOW

**SDD section:** Solution sketch (Bus Log records transitions only) and Non-Negotiables

**Conflict:** Restricting Bus log to transitions-only is defensible for signal-to-noise, but it creates a forensic gap: if an artifact later proves wrong, the reasoning that produced it lives only in `loops/<id>/state.md`, which is a per-project file that can be deleted, edited, or lost. The provenance hash binds artifact to loop ID, but does not bind loop ID to a tamper-evident turn record. For high-stakes loops (architecture, compliance), the record is weaker than the Bus log it replaces.

**What's missing:** A note on state.md durability — at minimum, state.md is append-only after loop close, and `sdk-health` checksums it alongside the artifact hash. Or: high-stakes loops (CISO, CLO, architecture) emit full turn record to Bus on termination as a single archival message.

---

### 7. Soul Principle 3 — It is not magic; it is engineering / clear boundaries — LOW

**SDD section:** Out-of-Bounds (Dialectic deferred, anonymization deferred)

**Conflict:** The deferral of Dialectic to v0.2 is correctly justified (named-role sycophancy surface). But the SDD never specifies the *boundary condition* that would let v0.2 ship Dialectic — what evidence from v0.1 loops would unlock it, what anonymization design would satisfy the concern, who owns that design. This is a deferral without a return ticket, which over time becomes a permanent silent exclusion presented as "we already decided."

**What's missing:** One line naming the owner of the Dialectic + anonymization v0.2 design and the trigger condition (e.g., "after 10 Critique-Revise loops or one release cycle, whichever first, PM + Mario review whether Dialectic is unblocked").

---

## Part 2 — Mario's `would_have_wrongly_killed` guardrail

This critique pattern, applied uncritically, would have wrongly killed early protocol increments that intentionally ship mechanism *before* worked examples in order to discover what the protocol should look like through use — for instance, a v0.1 of §32 deliberately shipped as a one-week probe with no example transcript, accepting that the first three loops in the next release *are* the examples and the protocol will be revised in v0.2 once those examples reveal what shape the state.md actually needs. The "ship mechanism, learn the shape from use" play is a legitimate strategy under appetite-bounded ideation, and Critique #2 (Code is the last part) would have killed it on Soul grounds even though it is exactly how a research-driven protocol surface should be shaped. The SDD's Appetite of 1 week and the explicit scope-discipline (only two patterns, defer Dialectic, no CLI) suggest the author *is* running this play deliberately — and a critique that demands a worked example before ship is asking for a different release strategy, not a better SDD. The author should weigh #2 as a "consider adding an example if cheap" rather than a hard block.
