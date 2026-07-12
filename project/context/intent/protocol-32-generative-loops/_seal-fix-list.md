# §32 Seal Fix List

**Date:** 2026-06-14
**Owner sign-off:** approved (CLO Q3 exposure profile consciously accepted; seal with CLO additions baked in)
**Synthesizer:** Coordinator

## Decision

PROCEED with seal. All three reviewers reported severity `should_be_addressed`, none `blocks_seal`. Fixes are surgical and cheap.

## Fixes by destination file

### `team/roles/loops/critique-revise.md` (NON_TRIGGER_SHAPE additions)

Add the following bullets at the end of the NON_TRIGGER_SHAPE list (preserve existing bullets, do NOT remove):

- Design craft review (accessibility/WCAG, perceived affordance, form-follows-function, emotional register) — craft standards live outside Layer A; constitutional critique will silently miss them. Source: Designer cross-domain review 2026-06-14.
- Research synthesis methodology (evidence chain, sample-frame transparency, negative-space discipline, observation-vs-inference) — methodological soundness is not a Layer A clause; the `would-have-wrongly-killed` guardrail is shaped against timidity and will systematically preserve over-confident inferences. Source: UXR cross-domain review 2026-06-14.

### `team/roles/loops/red-team.md` (NON_TRIGGER_SHAPE additions + vocabulary clarification)

Add the following bullets at the end of the NON_TRIGGER_SHAPE list:

- Composite design artifacts where failure is cumulative degradation rather than catastrophic break — use Red-Team only on the hard-to-reverse subset (navigation model, design token system, conversation architecture, AI tone model). Source: Designer cross-domain review 2026-06-14.
- Research synthesis whose trustworthiness rests on a compound stack of assumptions (recruitment × question framing × interpretation × negative-space × method-confidence) — the singleton framing flattens a stack into a single load-bearing beam. Source: UXR cross-domain review 2026-06-14.

Add a new section at the end of red-team.md, titled "## Vocabulary clarification (CLO 2026-06-14)":

> `assumption-not-attacked:` is a process artifact recording what THIS pass did not stress-test. It does NOT constitute risk acceptance under protocol §6. In regulatory writing, "risk accepted" implies informed acceptance by an authorized decision-maker and creates duty-of-care. Any actual risk acceptance must be logged separately via the §6 decision log entry, signed by the authorized role. For CLO-owned artifacts, prefer the alias `red-team-scope-limit:` which carries no regulatory term-of-art collision.

### `protocol.md` — new §32 (Generative Loops) section

§32 prose must include:

- Loop Coordinator agent type contract (ephemeral, per-loop, driver-not-judge)
- The two v0.1 patterns (Critique-Revise + Red-Team) with TRIGGER_SHAPE / NON_TRIGGER_SHAPE per the loop pattern files
- WEAKNESS_HYPOTHESIS requirement on every loop open
- Mario asymmetric termination contract (budget default; early-stop unilateral by spawning agent; extension requires countersign by peer-or-higher tier; no Loop Coordinator extension authority)
- LOOP-YYYYMMDD-<pattern>-<seq> ID format + LOOP-PROVENANCE: hash on every emitted artifact
- Bus Log records transitions only; internal turns live in loops/<id>/state.md
- Three valid insertion points: Phase 0 (Discovery), Architecture (before Mario gate), Implementation (Test Engineer-owned)
- CISO Periodic Constitutional Line Audit (quarterly, 5-dimension 0-3 scoring, ≤5/15 flag, >25% triggers v0.2 anonymization acceleration)
- Cross-references: §1 (Bus), §15 (Cycles), §15a (Self-improvement loop), §16 (Consultation), §22 (Bus Log), §24 (Halloway Ratchet), §25 (TAG), §29 (Structured Disagreement), §30 (Design Principles), §31 (Iteration Guardians)

PLUS the cross-domain review additions (these go in a dedicated subsection):

**Sub-section 32.X — Cross-domain return tickets and consumer hooks:**
- UXR return ticket: Research-Synthesis-shaped critique pattern → v0.2, owner: UX Researcher.
- Designer return ticket: craft-constitution work (treating Layer A as a critic-facing interface) → v0.2/v0.3, owner: Designer.
- CLO return ticket: typed `constitution: <ref>` argument so loops on regulated artifacts can declare `constitution: gdpr-art-6+layer-a` and the critic reads against both → v0.2, owner: CLO.
- UXR is named co-consumer of `metrics/_signals.jsonl` for ongoing friction-pattern analysis of loop substrate use (alongside the retrospective ritual cadences).

**Sub-section 32.Y — Retention, privilege, and discoverability (CLO Q3, Owner-accepted 2026-06-14):**

- Retention policy: `loops/<id>/state.md` is retained for the life of the shaped artifact it produced. `metrics/_signals.jsonl` is retained for two release cycles. Both are subject to legal-hold override which extends retention indefinitely until lifted by CLO.
- Privilege scope: Loops opened on legal-domain artifacts MUST declare `PRIVILEGE_SCOPE: attorney-client-work-product` on loop open. Without the header, the option to assert privilege over the loop record is foreclosed.
- Discoverability acknowledgment (non-negotiable spawning-agent rule): "Loop state files and the signals stream are discoverable records and create a duty-of-care standard. Loops MUST NOT be opened on artifacts the team is not prepared to have read in adversarial discovery."

### `team/roles/loop-coordinator.md` (NEW role file)

Follow `team/roles/_template.md` exactly. Set:
- consultation mode disabled (per shaped-brief)
- SOLUTION_CLASS: Level 3 for turn coordination, Level 1 only for spawning-agent-delegated tie-breaks
- Driver-not-judge clause as the load-bearing non-negotiable
- Naming formula applied: pick a globally-common first name + city surname not yet used in `team/roles/CLAUDE.md` defaults

### `loops/2026-06-14-critique-revise-001/` (NEW worked example, good-faith counterpart)

The actual Critique-Revise that ran during the §32 idea-execution workflow already produced its artifacts in intent-spec/. The worked example folder needs:
- `state.md` with the three required headings (Open, Turns, Terminate) populated from the actual workflow run
- `LOOP-PROVENANCE: LOOP-20260614-critique-revise-001 + SHA256(state.md body)`
- A one-paragraph debrief at the end explaining this is the good-faith counterpart to `loops/2026-06-14-critique-revise-adversarial-001/`

## Return

Return ONLY:

{ "fix_list_path": "intent-spec/protocol-32-generative-loops/_seal-fix-list.md", "section_count": N, "destination_files_count": N }
