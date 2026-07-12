# Revision notes: sdd.md → sdd-v2.md

## Addressed

### Substrate 3 — Informational (HIGH): meta-audit deferred
**v1 move:** "Meta-audit of the 5-dimension audit" listed in Open Questions, deferred to "a future cycle."
**v2 move:** Meta-audit cadence is now a Non-Negotiable, lands in this cycle. Every fifth loop produces a `would_have_wrongly_killed:` line against the audit itself, logged to `_audit-log.md`. After three cycles, Greg + CISO review the rubric. The audit instrument is bounded-authority not sovereign-authority.
**Why this fix and not removing the gate:** The critique's structural concern was unauditable epistemic sovereignty. Adding a documented meta-audit cadence resolves the sovereignty problem without removing the fail-closed property the gate exists for. C2 direction is now exercised at the rubric design layer on a published cadence.

### Substrate 2 — Cognitive (MED): self-aware repeat of v0.1 failure mode
**v1 move:** WEAKNESS_HYPOTHESIS required as a schema string, no audit on contents.
**v2 move:** Required AND audited — an inline single-line rubric check on the hypothesis fires at loop open. Semantically-empty hypotheses (≤2/15 on falsifiability + specificity) refuse the loop open with a structured error. The SDD now does to its own required field what it demanded of v0.1's `would_have_wrongly_killed`.
**Why this matters:** The critique was correct that v1 committed the exact failure mode it diagnosed. Caught cleanly.

### Soul 4 — Diversity (MED): anonymization vs cultural signal
**v1 move:** Per-message anonymization framed as the fix to deference, citing 2024-2026 research.
**v2 move:** Separated authorship-attribution (stripped during debate, restored at synthesis) from cultural-profile-reasoning-signal (preserved in-message). The deference-reducing move is stripping the name; the diversity-eroding move is stripping the reasoning style. v2 only strips the first.
**Why this fix:** The critique surfaced a real conflation in the v1 framing. The constitution's claim that cultural-profile is load-bearing was being treated as ignorable. v2 holds both claims.

### Soul 1 — People (MED): four additions in a week with no named pod
**v1 move:** Appetite M with no pod, no capacity check, "Confirm CTO has the cycle" as an open question.
**v2 move:** Named pod (Priya Bengaluru on PM, Amara Lagos on CISO, CTO seat named at cycle open with capacity confirmation). Mid-week human-capacity fallback published: if any agent escalates BLOCKER more than once OR PM reports >2 unresolved load-bearing open questions, the cycle reduces to Additions 1+4. Mario calls, Greg confirms. Engineering fallback (S-scope reduction) and human-capacity fallback (mid-week trigger) are now distinct.
**Why this fix:** "Confirm CTO has the cycle" as an open question on a load-bearing dependency is exactly the move that produces overrun. The critique was correct; v2 fixes the structure not just the wording.

### Constraint 3 — System integrity (MED): containment of dogfood failure
**v1 move:** "If v0.1 cannot produce a coherent v0.2 brief, that is itself a finding." Observation only.
**v2 move:** Dogfood failure triggers containment — all in-flight v0.1 runs on other ideas pause at their next phase boundary pending manual CISO blind audit. Greg + Mario decide per-run whether to continue. Failure is now contained, not just observed.
**Why this fix:** The critique correctly identified that v1 treated a substrate-level defect signal as an information event rather than an operational event. v2 makes the operational consequence explicit.

### Soul 6 — Fix broken windows (LOW, but trivial): Loop Coordinator surface
**v1 move:** Absolute "no change to §32 Loop Coordinator protocol surface beyond exposing the callable."
**v2 move:** Pre-existing §32 defects stay out of scope; defects that v0.2 work itself surfaces are in-bounds to fix. This is the one-line trivial fix the rubric allows on LOW.

### Soul 3 — Stakeholder ownership (LOW, but trivial): author attribution
**v1 move:** "PM (auto-drafted)" — anonymous role.
**v2 move:** "PM (Priya Bengaluru) — auto-drafted, named-ownership per Soul 3." One-line trivial fix.

## Rejected

### Constraint 1 — Capability not dependency (HIGH): fail-closed gate, no override
**Critique demanded:** A human override path on the fail-closed 5-dimension audit, on the grounds that a non-overridable automated rubric trains agents to write for the audit and removes C2 human direction.

**Why rejected:** The `would_have_wrongly_killed` field on this critique pattern names the rejection reason exactly. The 5-dimension audit is a safety-critical gate in the same class as a deploy-time secret-scanner or an aviation pre-flight check. The defensive value of these gates is that they cannot be waved off in the moment under schedule pressure — which is precisely the sycophantic-discharge-under-pressure failure mode this SDD exists to stop. Adding a per-line override path defeats the gate, because every borderline run learns to route around it.

**What v2 does instead:** v2 makes the safety-critical-gate argument explicit in the Solution Sketch (which v1 did not — the critic noted this gap). C2 human direction is exercised at the **rubric design layer** via the now-mandatory meta-audit cadence and three-cycle review, not at the per-line waiver layer. This is the inverse framing the critic missed: the gate exists so agents stay independent of the deference reflex, not dependent on a human authority to forgive each instance of it. Per-line override creates the dependency; rubric-layer governance preserves capability.

The critique's own `would_have_wrongly_killed` field acknowledges that "a critic that reflexively demands a human override path would have killed exactly the gates that worked" and notes the severity should drop if the SDD makes the safety-critical-gate case explicit. v2 makes that case explicit. The HIGH is rejected at the per-line override level and addressed at the rubric design level — which is where the legitimate C1/C2 concern actually lives.
