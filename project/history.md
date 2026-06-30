# History -- sdk-v3

> Every release ships with a history entry. Every significant mid-release decision gets an entry. Format: protocol.md Section 10.

---

## [Project Start] — sdk-v3 Discovery Initiated
**Date:** 2026-04-06
**Made by:** Greg (CEO)
**Status:** Active

**What happened:**
Owner briefed Greg on sdk-v3. The core thesis: team-sdk reaches genesis (people install it) but not catalysis (it doesn't change how teams work). v3 addresses this by making documentation mandatory and machine-enforced, integrating GitHub as a first-class citizen, elevating versioning from a convention to a CLI feature, and building owner-facing tooling modeled on YC/a16z onboarding playbooks. Discovery activated with startup squad.

**Capital / constraints:**
- Budget: bootstrapped, no external spend
- Team: small — owner + AI agents
- Hard constraints: Node.js >=18, CLI + file system only (no SaaS), GitHub only (no other VCS in v3), no AI inference in scripts

**Key decisions:**
- Decision: Ship to CLI + file system, not SaaS. Rationale: the SDK's power is that it lives in the repo. SaaS would break that. Reversible: yes, but not in this cycle.
- Decision: GitHub-only VCS integration in v3. GitLab/Bitbucket deferred. Rationale: scope control — doing one integration well beats three done poorly.
- Decision: Documentation gates must feel like guardrails, not gatekeepers. The enforcement model is advisory-first, blocking only at release close (not mid-sprint). This is the critical UX distinction from v2.

---

[Future release entries go here. Use the format from protocol.md Section 10.]

---

## SDK-CHANGE — Halloway Ratchet Doctrine
**Date:** 2026-04-14
**Made by:** Greg (CEO), directed by Owner (Matias Bargas)
**Release:** v2026.Q2.1
**Tag:** SDK-CHANGE
**Status:** APPLIED

**What happened:**
Owner surfaced the Halloway "ABCs of Failure" analysis — a documented case where an AI agent applied freeform LLM reasoning to a lexicographic sorting problem (a deterministic solved problem) across multiple sessions, accumulating 25 out-of-order errors with full confidence. The analysis introduced the reliability ratchet concept: a four-level model of increasing determinism (freeform LLM → REPL → library → enforcement), where agents default to Level 1 even when Level 3 or 4 is clearly correct.

CEO and Owner identified three gaps in the SDK: no mechanism to make solution strategy visible on the Bus, no role-level guidance on when to stop reasoning and apply a known solution, and no health signal that detects revision-trail patterns (the "wait, actually" signature of a ratchet failure).

**Changes applied:**

1. **protocol.md → v4.1** — SOLUTION_CLASS field (`KNOWN | EXPLORATORY | HYBRID`) added to Section 1 Bus format. Required on all output-bearing messages from CTO, Mario, EM, Staff Engineer, and Coordinator. Section 24 (The Halloway Ratchet Doctrine) added: four ratchet levels, determinism pre-flight protocol, Known Solution Registry (owned by Mario), revision trail signal definition, sdk-health ratchet scan format, and challenge obligation.

2. **team/roles/cto.md** — Determinism Pre-flight block added before Details section. CTO must classify every task against the ratchet before producing output.

3. **team/roles/chief-engineer.md** — Determinism Pre-flight block added. Mario named as Known Solution Registry owner with explicit challenge obligation to flag peers operating at wrong ratchet level.

4. **team/roles/em.md** — Determinism Pre-flight block added with specific callout of EM-domain failure modes: counting requirements by hand instead of parsing files, estimating appetite instead of computing it, ordering work by feel instead of mapping the dependency chain.

5. **project/LOOP.md** — Sprint Closure Ritual section added. sdk-health is mandatory step 2 of a 5-step close sequence. Iteration counter does not increment if ritual was skipped. Rule 7 added to Loop Rules.

**Alternatives considered:**
- Protocol-only change (no role changes): rejected — SOLUTION_CLASS on the Bus is only useful if agents know to classify before writing it. Role-level pre-flight is what makes the field meaningful.
- Role changes only (no protocol): rejected — the signal must be visible in the Bus transcript for the health scanner to detect it.
- sdk-health extension only (no protocol, no role): rejected — passive detection without active prevention is a lagging indicator. All three layers together create a ratchet: classify before acting (pre-flight), declare it visibly (SOLUTION_CLASS), detect violations post-hoc (sdk-health).

**Rationale:**
The failure mode is not that agents are bad at sorting. It is that agents will apply terrible strategies indefinitely, with confidence, without volunteering to change. The ratchet doctrine embeds the correction into the operating loop of the roles most exposed to architectural decisions — CTO, Mario, EM — and makes the failure mode detectable at the sprint level.

**Implications:**
- Every output-bearing Bus message from CTO, Mario, EM, Staff Engineer, Coordinator must include SOLUTION_CLASS going forward
- Mario begins the Known Solution Registry with the seed entries defined in protocol.md Section 24
- sdk-health ratchet scan will surface RATCHET-CANDIDATE items after every sprint close — Mario triages and updates the registry
- Protocol version: 3.7 → 4.1 (structural addition; not a breaking change to existing message formats)

**Reversible:** YES — SOLUTION_CLASS is additive; removing it does not break the Bus format. The pre-flight discipline is behavioral and cannot be "rolled back," but the protocol enforcement can be.
**Affects natural persons:** NO
**Human approved by:** Matias Bargas (Owner) on 2026-04-14

---

## Mario Gate — 5 Irreversible Decision Reviews Completed
**Date:** 2026-04-06
**Made by:** Ravi Colombo (Chief Engineer, L5)
**Release:** v2026.Q2.1
**Status:** COMPLETED — Sprint 1 unblocked (with one condition, see below)

**What happened:**
Ravi Colombo conducted the mandatory Mario gate review of all 5 irreversible architectural decisions from Tariq Bishkek's (CTO) architecture brief for v2026.Q2.1. Reviewed against: scale at 10x, failure modes, long-term maintainability, and cross-project implications.

**Decision outcomes:**

| # | Decision | Verdict | Key findings |
|---|---|---|---|
| 1 | No octokit — direct Node.js https calls | APPROVED | github.js must be named platform primitive; error handling, pagination, and rate-limit backoff centralized there. Piecemeal call-site handling is the risk to prevent. |
| 2 | TEAM_SDK_GITHUB_TOKEN canonical env var | APPROVED | Naming is correct; deliberately avoids GITHUB_TOKEN collision with Actions-injected token. Recommend startup check that emits clear error if GITHUB_TOKEN is set but TEAM_SDK_GITHUB_TOKEN is not. |
| 3 | doc.js as single file-write authority | APPROVED | Correct architectural call. Tech debt logged: doc.js has no project-root boundary validation — acceptable for v3 single-project scope, must be addressed before any multi-project support ships. |
| 4 | sanitize.js as shared utility (NN-1 + NN-5) | APPROVED | Structural/policy separation is right. Condition on implementation: explicit enforcement contract must be in sanitize.js file header (what it enforces, what it does not, caller field allowlist interface). |
| 5 | context-manifest.json schema fields locked | APPROVED WITH CONDITIONS | Schema-first is correct. Decision is incomplete without a versioning strategy. CONDITION: schemaVersion field required in locked schema before any consumer is written. Staff Engineer must review Decision 4 + 5 together. |

**Conditions to clear before Sprint 1 consumers of context-manifest.json are written:**
- CTO confirms schemaVersion: "1.0" is included in the locked context-manifest.json schema
- This confirmation must be logged to history.md before consumer scripts begin
- Staff Engineer interface contract review must cover Decision 4 (sanitize.js) and Decision 5 (context-manifest.json) in a single review, not separately

**Tech debt items logged to engineering-log.md:**
- doc.js project-root boundary check (fix before multi-project support, owner: Staff Engineer + CTO)

**New requirements added to engineering-log.md:**
- github.js designated platform primitive → add to Staff Engineer interface contract checklist
- sanitize.js file header enforcement contract (explicit, in the file itself)
- sanitize.js caller field allowlist interface (extensibility for downstream project customization)
- context-manifest.json schemaVersion field (required in locked schema)

**Escalation path:** Any CTO disagreement with these findings is logged here. CTO makes final call. Mario's dissent stands in the record regardless.

**Sprint 1 gate:** UNBLOCKED for Decisions 1–4. Decision 5 condition must be confirmed in writing by CTO before consumers of context-manifest.json are written.

---

## CTO Confirmation — context-manifest.json schemaVersion Field
**Date:** 2026-04-06
**Made by:** Tariq Bishkek (CTO, M4)
**Release:** v2026.Q2.1
**Status:** CONFIRMED

**What happened:**
CTO confirms Mario gate Decision 5 condition: the locked `context-manifest.json` schema includes a `schemaVersion` field with value `"1.0"`. Consumers of context-manifest.json may now be written.

**Schema field confirmed:** `"schemaVersion": "1.0"` — required in every manifest file written by the generator. Consumers must validate this field on read and fail gracefully (fallback to current-status.md) if absent or unrecognised.

**Decision:** CONFIRMED — consumer tickets CM-02 through CM-05 unblocked.
**Reversible:** No — schema field is part of the locked schema contract.

---

## coordinator-owns-session-close — Enforcement Model Decision
**Date:** 2026-04-06
**Made by:** Amara Lagos (CEO) + Soren Aarhus (Coordinator)
**Release:** v2026.Q2.1
**Status:** DECIDED

**What happened:**
Tariq Bishkek (CTO) recommended social enforcement for the Coordinator session-close write authority (convention + PR checklist, not a technical --role flag block). CEO and Coordinator reviewed and confirm.

**Decision:** Social enforcement. The `doc.js session-close` subcommand logs a warning if the caller role is not Coordinator, but does not block the write. Enforcement is by convention, protocol documentation, and PR review checklist — not a hard technical gate.

**Rationale:** The cost of a technical block (sprint held up because the Coordinator agent wasn't explicitly named) is higher than the cost of the occasional wrong-role write. The protocol documents the rule; the PR checklist catches violations before merge. A hard gate can be added in a later release if convention proves insufficient.
**Reversible:** Yes — can add technical enforcement later without breaking existing usage.

**Effect:** coordinator-owns-session-close mission PM hold is lifted. Pod may now form.

## Version Bump — v2026.Q2.2 → v2026.Q2.3
Date: 2026-04-09
Made by: Owner (sdk-version patch)

patch bump. New release cycle: v2026.Q2.3.

## Version Bump — v2026.Q2.3 → v2026.Q2.1
Date: 2026-04-09
Made by: Owner (sdk-version set)

set bump. New release cycle: v2026.Q2.1.

---

## Bus Policy Decision — Mandatory Everywhere
**Date:** 2026-04-18
**Made by:** Owner (Matias Bargas)
**Release:** v2026.Q2.2
**Status:** DECIDED

**What happened:**
Greg (CEO) audited the project's compliance with its own framework and found that the Bus format was not used for inter-agent communication during the entire Tier 1 cycle. All routing happened through direct consultation and area logs. The Bus parser was shipped with 399 tests — while the Bus itself had 0 messages from the cycle that built it.

Owner was asked: should Bus communication be mandatory for internal SDK development, or only for projects that use the SDK?

**Decision:** Bus communication is mandatory everywhere, including internal SDK development. The SDK dogfoods its own protocol fully. If we don't use it ourselves, we can't credibly tell others to.

**Implications:**
- Tier 2 must use Bus messages for all inter-agent communication
- Pod activations, gate results, and mission completions must flow through the Bus
- bus-log.md must be current at session close
- The Tier 1 gap is acknowledged in the retrospective (project-map.md Section 10), not retroactively fixed

**Reversible:** YES — could exempt internal development later, but the default is full dogfooding.
**Affects natural persons:** NO
**Human approved by:** Matias Bargas (Owner) on 2026-04-18

---

## Mario Gate — 5 Irreversible Decisions for Package Extraction
**Date:** 2026-04-17
**Made by:** Mario (Chief Engineer)
**Release:** v2026.Q2.2
**Status:** COMPLETED — All 5 APPROVED

| # | Decision | Verdict | Conditions |
|---|---|---|---|
| 1 | Package naming: @team-sdk/protocol, @team-sdk/context, @team-sdk/cli | APPROVED | None. Names map to dependency chain. |
| 2 | parseBusMessage stays regex-based | APPROVED WITH CONDITIONS | Must ship with contract test suite covering every field, multi-line bodies, missing fields, malformed input before any external consumer imports it. |
| 3 | Role-to-domain mapping unification | APPROVED WITH CONDITIONS | (a) Canonical mapping must be data structure (object/map), not if-chains. (b) Test asserting every role from CLAUDE.md resolves — no silent fallthrough. |
| 4 | CATALOG becomes declarative schema | APPROVED WITH CONDITIONS | Must include version field + load-time validation. All consumers import from package, no local copies. Missing file handling surfaces as warning. |
| 5 | context-index.json schemaVersion bump to 3.0 | APPROVED | @team-sdk/context must export SUPPORTED_SCHEMA_VERSIONS constant. |

**Near-misses investigated:** Circular dependency risk between cli/context (dismissed — no cycle in traced code). Regex parser field-drop risk (dismissed — covered by contract test suite condition).

---

## CTO Architecture Brief — Package Extraction
**Date:** 2026-04-17
**Made by:** CTO (Nicolas)
**Release:** v2026.Q2.2
**Status:** COMPLETED

**Key findings:**
- doc.js: 2,575 lines, 7 functional clusters, extractable in order (A: markdown utils → B: protocol-aware → D: context/knowledge graph → rest)
- scripts/lib/: 8 files, already partially factored. intent-resolver.js and action-registry.js map directly to @team-sdk/protocol.
- protocol.md: 10 structural elements expressible as JSON Schema, ~10 behavioral elements stay as prose.
- Package architecture: monorepo, npm workspaces, 3 packages. Protocol (zero deps) → Context (depends on protocol) → CLI (depends on both).
- Migration: additive, existing scripts continue working. Estimated 4-5 weeks.
- Riskiest target: doc.js decomposition. Mitigated by cluster-order extraction with per-cluster tests.

---

## CLO + CISO Gate — Package Extraction
**Date:** 2026-04-17
**Made by:** CLO (Camila) + CISO (Sebastian)
**Release:** v2026.Q2.2
**Status:** CLEAR

**CLO:** MIT → scoped npm: no issues. No PII, no telemetry. Action item: verify Anthropic acceptable use policy permits CLI tool extensions before first publish.
**CISO:** Path traversal check needed on sdk-query (realpath vs project root). npm supply chain: 2FA required, provenance attestation, pin deps. JSON Schema: use ajv, strict mode.

---

## New Discovery Cycle — The Extractable Core
**Date:** 2026-04-17
**Made by:** Greg (CEO), directed by Owner (Matias Bargas)
**Release:** v2026.Q2.2
**Status:** DISCOVERY

**What happened:**
Owner initiated a new discovery cycle for team-sdk. The previous loop (iterations 1-5) shipped CLI tooling and documentation enforcement. SaaS was cancelled. The next phase addresses six structural problems in the SDK, organized in two tiers.

**The problems:**
1. Decision memory is trapped in markdown — kills, decisions, challenges are not queryable
2. Protocol is human-readable only — no machine can validate a Bus message or gate state
3. Adoption requires full project commitment before delivering any value
4. Each project is an island — no organizational memory across projects
5. Single-vendor lock-in — role files are model-agnostic but execution is Claude Code-only
6. Squads are frozen — only the maintainer can create team compositions

**Strategic direction:**
Extract team-sdk's core infrastructure into reusable packages that people can use independently. The Bus format, context index, protocol spec, and knowledge graph become `@team-sdk/core`. The full SDK becomes an opinionated implementation on top of a reusable foundation.

**Package architecture (CTO recommendation):**
- `@team-sdk/protocol` — Bus schema, message parser/validator, escalation rules
- `@team-sdk/context` — manifest/index generation, knowledge graph, context loading
- `@team-sdk/cli` — current scripts/ rewritten to consume the above

Monorepo with npm workspaces. Single repo, single CI, version-locked.

**Build order:** Protocol Schema first (dependency for everything) → Knowledge Graph → Consultation Standalone. Tier 2 (cross-project memory, pluggable runtime, squad marketplace) blocked until Tier 1 lands.

**CTO risk flag:** doc.js at 115KB is the riskiest extraction target. Audit before timeline commitment. Protocol schema can only validate structure, not orchestration semantics — that boundary must be explicit.

**Key decisions:**
- Decision: Tier 1 before Tier 2. No multiplier work until foundations are solid.
- Decision: Extraction, not redesign. Tier 1 must not break existing SDK workflow.
- Decision: Monorepo with npm workspaces. Owner confirmed 2026-04-17.
- Decision: doc.js audit before committing timeline. Owner confirmed 2026-04-17.
- Decision: Consultation Mode targets people already inside agentic environments (Claude Code, other engines). Not a standalone binary. The SDK extends the runtime the user is already in — slash commands, skills, MCP servers — not a separate tool. This applies regardless of which engine is used. Owner confirmed 2026-04-17.

**Reversible:** YES — packages are additive. The current SDK continues to work.
**Affects natural persons:** NO
**Human approved by:** Matias Bargas (Owner) on 2026-04-17

---

## SaaS Initiative Cancelled
**Date:** 2026-04-15
**Made by:** Owner (Matias Bargas)
**Release:** v2026.Q2.1
**Status:** DECIDED

**What happened:**
Owner cancelled the SaaS initiative (LOOP iterations 6-11). The project refocuses on the CLI-only product. All SaaS design documents (SAAS.md, INVESTOR.md, VISION.md) and the cloud.js implementation were archived to `project/archive/`.

**What was cancelled:**
- Iteration 6: SaaS scaffold (sdk-cloud, API layer, auth model)
- Iteration 7: Pro team dashboard web app
- Iteration 8: GitHub automation + compliance export (Pro)
- Iteration 9: Org view + billing (Stripe)
- Iteration 10: Investor pitch assets
- Iteration 11: Launch prep (Product Hunt, Show HN)

**What remains:**
- CLI product as shipped through iterations 1-5 (v3.2.1 → v3.6.0)
- All SDK protocol changes including Halloway Ratchet Doctrine (v4.1)
- GitHub integration (sdk-github) — CLI-only, no cloud dependency
- sdk-cloud CLI bridge script archived (was functional but never connected to a real backend)

**Rationale:** Owner decision. SaaS layer deferred indefinitely. The CLI product stands on its own.
**Reversible:** YES — archived materials can be restored if the initiative resumes.
**Affects natural persons:** NO

## Version Bump — v2026.Q2.1 → v2026.Q2.3
Date: 2026-04-18
Made by: Owner (sdk-version set)

set bump. New release cycle: v2026.Q2.3.

---

## SDK-CHANGE — Protocol §32 Generative Loops + Continuous-Improvement Substrate
**Date of work:** 2026-06-14 (SDLC state-machine follow-on 2026-06-16)
**Logged:** 2026-06-19 (governance backfill — Greg audit found this initiative undocumented in history.md and current-status.md)
**Made by:** PM + CTO + Mario + CISO + CAIO (Pablo), Owner-directed
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE
**Status:** APPLIED (uncommitted at audit time; committed with this entry)

**What happened:**
Over a single intensive session on 2026-06-14 (~6 hours of workflow runs), the team designed and sealed a generative-loops layer plus the continuous-improvement substrate that consumes it. The thesis: team-sdk agents already dissent and spawn peers, but the *quality of dissent* was not load-bearing — critique closed "by social default" with no declared shape, termination rule, or provenance. §32 makes critique mechanical without turning it into another agent to please.

DECISION: Seal Protocol §32 (Generative Loops) into protocol.md
Date: 2026-06-14
Release: v2026.Q2.3
Made by: PM (AI-assisted), Owner-directed
Context: Critique on real teams closes by social default; no recorded transition, provenance, or termination rule. The Halloway Ratchet (§24) made *solution strategy* visible but not *dissent quality*.
Decision: Add §32 to protocol.md (bumped v4.3 → v4.4). Ships two v0.1 patterns — Constitutional Critique-Revise and Red-Team/Devil's-Advocate — plus an ephemeral Loop Coordinator role (driver-not-judge), per-loop `state.md`, a `WEAKNESS_HYPOTHESIS` open requirement, an asymmetric termination contract (Mario's rule: spawning agent early-stops unilaterally; extension requires peer-or-higher countersign), and `LOOP-PROVENANCE:` SHA-256 hashes on every emitted artifact. Fail-closed guardrail lines: `would-have-wrongly-killed:` (Critique-Revise) and `assumption-not-attacked:` / `red-team-scope-limit:` (Red-Team).
Alternatives considered: (a) keep critique informal — rejected, the failure mode is invisible and compounding; (b) ship all three patterns including Dialectic — rejected, Dialectic deferred to v0.2 until the author-anonymization layer is designed and CTO + Mario sign off, because named-role debate is itself a sycophancy attack surface (deep-research SOTA 2024–2026); (c) a CLI-invoked workflow — rejected for v0.1, every loop is explicitly opened by a spawning agent at one of three named insertion points.
Rationale: Declared shape + declared termination + declared provenance makes dissent auditable years later without adding a thirteenth voice to please. Cross-domain review (UXR + Designer + CLO) caught discoverability, dignity, and accessibility gaps baked into the sealed text rather than deferred, on the principle that protocol text ships once and is hard to amend mid-cycle.
Implications: AGENTS.md registers the Loop Coordinator as an ephemeral per-loop agent. New pattern files live under `team/roles/loops/`. The loop library is deliberately capped — a sixth pattern costs the team forgetting the first five.
Reversible: YES — §32 is additive; patterns can be retired the same way they were added.
Affects natural persons: NO

DECISION: Ship the continuous-improvement substrate (improvement_signal + 4-cadence retrospective + metrics + OKR proposals + horizons auto-maintenance)
Date: 2026-06-14
Release: v2026.Q2.3
Made by: PM + CAIO (AI-assisted), Owner-directed
Context: Owner directive — improvement is continuous through loops AND rituals, not a quarterly retro bolted onto delivery.
Decision: Every loop close emits a one-line `improvement_signal` (friction + suggested_target) into the append-only `metrics/_signals.jsonl`. `retrospective.js` runs at four cadences (per-loop / sprint / pre-tag / quarterly), each consuming the layer below. `metrics/` holds observation definitions; OKR adoption ships as proposals under `intent-spec/_PROTOCOL_PROPOSALS/`; `_HORIZONS.md` becomes auto-maintained.
Alternatives considered: ship the five components separately — rejected, the irreducibility note holds (signal without metrics = noise; metrics without OKRs = scoreboard without game; OKRs without rituals = wall art). Any four of five collapses the fifth.
Rationale: Improvement as default state, not calendar event. The substrate detected and fixed its own false-pass schema bug the same day (`continuous-improvement-substrate-v0.1` → `fix-schema-enforcement-gap-v0.1`), which is the first `_signals.jsonl` entry.
Implications: Layered Context Architecture lands on disk — `foundation/` (Layer A), `intent-spec/` (Layer C), `generated-spec/` (Layer B). Runnable workflow scripts live in `workflows/`.
Reversible: YES
Affects natural persons: NO

DECISION: Accept the v0.2 calibration verdict as HOLDS, with synthetic-corpus caveat
Date: 2026-06-14
Release: v2026.Q2.3
Made by: Coordinator (synthesizer), scored by CISO Amara Lagos + Mario + CISO instance-2 (AI-assisted)
Context: Red-Team on the v0.2 idea-execution dogfood flagged the CISO 5-dimension anti-sycophancy rubric as the load-bearing assumption; fail-closed-with-no-override is brittle if the rubric has variance or bias. A 20-line calibration test was spec'd to de-risk it.
Decision: Verdict HOLDS — inter-rater agreement 20/20 (100%, criterion ≥80%), class separation 20/20 clean (criterion ≥17/20). Proceed with the v2 SDD shape unchanged; no-override stance on Addition 4 stands.
Alternatives considered: declare the rubric validated outright — rejected. 17 of 20 lines were synthetic, constructed to fit the prediction templates; clean separation on those proves only internal consistency, not organic signal. The load-bearing evidence is the 3 real lines (2 reproduce the §32 single-CISO baseline within ≤1 point; the third shows convergent three-scorer reasoning).
Rationale: Honest weak-evidence acceptance beats false confidence. The caveat is carried forward: the cycle-3 re-test MUST use a freshly-assembled real-line corpus, not a re-run of this synthetic-heavy one, or the drift check measures only synthesis-shape stability.
Implications: `_audit-log.md` baseline entry owed at v0.2 cycle open (not yet created). Meta-audit cadence (CISO + Mario) pivots to drift-from-baseline at cycle-3.
Reversible: YES — a failing cycle-3 re-test reopens the rubric.
Affects natural persons: NO

**Governance note (Greg, 2026-06-19):** This entire initiative shipped to the working tree on 2026-06-14/16 but was never committed, never entered in `history.md`, and `current-status.md` still read "2026-04-18, Tier 1 complete." A release is not done when code ships — it is done when the map is written. This backfill closes that gap. The substrate that emits provenance on every loop had no project-level map of its own; that is the failure mode the substrate exists to prevent, surfacing one level above the substrate.

---

## SDK-CHANGE — Protocol §34 Collaboration Surfaces + CHARTER (Layer A draft)
**Date of work:** 2026-06-20 (committed `b9823b3`)
**Logged:** 2026-06-24 (governance backfill — Greg audit found this commit absent from `history.md` and `current-status.md` still reading "v4.4, §32 sealed")
**Made by:** PM + CTO + Mario + CLO + UXR + Designer, Owner-directed
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE
**Status:** APPLIED (committed `b9823b3`; documented with this entry)

**What happened:**
Phase 1 of the self-describing team-organism plan landed. Two things shipped together: a constitutional charter (Layer A) and a new protocol primitive (§34).

DECISION: Draft CHARTER.md — "The Company Is The Product" (Layer A, DRAFT awaiting Owner ratification)
Date: 2026-06-20
Release: v2026.Q2.3
Made by: Claude (drafted), Owner-directed (2026-06-18/20)
Context: The vision was latent in `intent-spec/_HORIZONS.md` and `team/roles/_shared.md` but never stated constitutionally. The Owner directed that it be written down as Layer A.
Decision: Add `CHARTER.md`. Thesis: there is no deliverable outside the organization — the protocol, role files, history.md, surfaces, claims, and signals **are** the company body. Three non-negotiable consequences: every artifact is a provenance-stamped commit to the company body; every role is a real collaborator (engineer or not); the information an agent produces is its empowerment. Behavior norms: proactive + blunt, autonomous where sensible, persisted to GitHub. Pointers added in `team/roles/_shared.md` and `foundation/README.md`.
Alternatives considered: leave the vision implicit in horizons/shared — rejected; a load-bearing constitution must be explicit and human-ratified, not inferred.
Rationale: Layer A is human-ratified and never silently AI-maintained. It is **not load-bearing until the Owner signs the ratification line at the bottom of CHARTER.md.**
Reversible: YES — DRAFT; unratified text carries no authority.
Affects natural persons: NO
**OPEN — Owner action owed:** ratify or revise CHARTER.md.

DECISION: Seal Protocol §34 (Collaboration Surfaces) into protocol.md
Date: 2026-06-20
Release: v2026.Q2.3
Made by: PM + CTO + Mario (AI-assisted), Owner-directed
Context: A single decision/flow/roadmap is authored and verified by multiple roles, but there was no shared artifact format — verification closed in conversation with no record of who checked what.
Decision: Add §34 to protocol.md (bumped v4.4 → v4.5). A Collaboration Surface is a self-describing shared artifact: front-matter schema (id, state, verifier_roster, irreversible), author/verification/reconciliation blocks, a state machine, a dynamic-plus-fixed-minimum verifier roster, blunt no-go → forced discussion (reuses §29/§32), and provenance + `improvement_signal` reuse. Human boundary fixed at §34.7. §33 reserved for the SDLC state machine (still draft). Ships `project-template/surface-template.md` and the first worked surface `project/surfaces/SURFACE-20260620-enforcement-claims-tooling-001.md` (seeded from §32 retro proposal #4, authored and awaiting its verifier roster). AGENTS.md v3.0 → v3.1 registers the surface lifecycle.
Alternatives considered: keep multi-role verification informal — rejected, same invisible-failure logic as §32.
Rationale: A surface makes "who authored, who verified, what's unresolved" durable and auditable, consistent with the CHARTER thesis that the artifact is the company.
Implications: The meta-loop `company-loop-v0.1` that would advance a surface past `under-verification` is referenced in §34 / AGENTS.md but **is not built yet** — until it exists, advancing a surface is a human/verifier act, not automated.
Reversible: YES — §34 is additive.
Affects natural persons: NO

**Sprint retro delivered (2026-06-19, committed `42888b8`):** The overdue sprint-cadence retrospective on `protocol-32-generative-loops` ran. Artifacts: `_retrospective.md` (6 surprises, 7 protocol-change proposals), `intent-spec/_RETRO-INDEX.md` (now exists), `claims-retro.yaml` (5 retro claims), and the first `metrics/_cadence-runs.jsonl` provenance line. The 7 proposals seed the meta-loop's first run. This closes the "Next Agent To Activate" action standing since the 2026-06-19 audit.

---

## SDK-CHANGE — The Office: Daily Operating Rituals (office-day workflow)
**Date of work:** 2026-06-22
**Logged:** 2026-06-24 (governance backfill — Greg audit found this uncommitted and undocumented)
**Made by:** Coordinator + PM (AI-assisted), Owner-directed
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE
**Status:** APPLIED (uncommitted at audit time; committed with this entry)

DECISION: Add `team/office/` daily rituals + `workflows/office-day-v0.1.js` orchestrator
Date: 2026-06-22
Release: v2026.Q2.3
Made by: Coordinator + PM (AI-assisted), Owner-directed
Context: The company kept drifting in the same five places — surfaces stall un-rostered, loop signals never reach the stream, owed retros sit undone, the status file lies, and the digest watchlist goes unread. These are exactly the failure modes the §32 substrate and §34 surfaces exist to prevent, but nothing ran them on a fixed clock.
Decision: Add a **legible operating rhythm** (not a second engine) under `team/office/rituals/`: five ritual files (01 Surface Sweep, 02 Signal Harvest, 03 Daily Digest, 04 Retro-Trigger Sweep, 05 Status Reconcile), per-role daily obligations under `by-role/`, and a runnable conductor `workflows/office-day-v0.1.js` that sequences all five. No ritual re-implements a workflow — each points at the existing `workflows/`+`scripts/` substrate. Honesty contract (per §32 retro proposal #4): a ritual must not claim an enforcement mechanism that does not exist.
Alternatives considered: keep relying on agents remembering to reconcile — rejected; "a ritual that runs only when someone remembers it is not a ritual, it is a hope." The 2026-06-19 and 2026-06-24 audits are the evidence.
Rationale: Reconcile the company body to truth on a fixed clock, by a named owner, with a command anyone can run and a failure mode anyone can check.
Implications / declared honest gaps: (a) Surface Sweep is read-and-report only — advancing a surface needs `company-loop-v0.1`, not yet built; (b) `retrospective.js` has no `pre-tag` cadence despite the substrate docs naming one; (c) `retrospective.js` hardcodes `today='2026-06-14'` — the orchestrator passes `date` explicitly so filenames/triggers are correct, but provenance `ts` in `metrics/_cadence-runs.jsonl` inherits the stale constant until fixed. All three tracked as substrate cleanup tickets.
Reversible: YES — additive; the rituals point at the substrate and can be retired without touching it.
Affects natural persons: NO

**Governance note (Greg, 2026-06-24):** Same failure mode as the 2026-06-19 audit, one cycle later: §34 + CHARTER were committed but never entered in `history.md`, and the office layer (Jun 22) sat uncommitted and unmapped while `current-status.md` still read "v4.4, §32 sealed." The office layer is itself the standing fix for this exact drift — Status Reconcile (ritual 05) exists so the map stops lagging the tree. Running it on the clock is the open follow-through.

---

## SDK-CHANGE — Protocol §35 Document-First Gate
**Date of work:** 2026-06-29/30
**Made by:** Greg (CEO) + CTO + Mario + Test Engineer (AI-assisted), Owner-directed
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE
**Status:** APPLIED (committed with this entry — the commit passes its own gate)

DECISION: Seal Protocol §35 (Document-First Gate) — make "the map never lags the work" load-bearing
Date: 2026-06-30
Release: v2026.Q2.3
Made by: Greg (CEO), Owner-directed; built with CTO + Mario + Test Engineer
Context: Twice in June the map lagged the tree and needed a Greg audit to backfill (2026-06-19 §32; 2026-06-24 §34/CHARTER/office). The repo was full of "keep the map current" machinery (project-map gate, §6, Status Reconcile ritual, improvement-signals) but **all of it was written norm, and written norm drifted.** The Owner directed: make document-first a root-level *enforced* concept — every material change goes through the map first.
Decision: Add §35 to protocol.md (bumped v4.5 → v4.6). A material change must, in the same commit, touch the map (`project/current-status.md` and/or `history.md`) or carry `[map-exempt: <reason>]`. Enforced by three real layers: (1) a git `commit-msg` hook (`scripts/hooks/commit-msg` → `scripts/hooks/map-gate.js`, hard-block, installed via `sdk-install-hooks` setting `core.hooksPath`); (2) a Claude Code `Stop` hook (`.claude/settings.json`, reminds, never blocks); (3) an `sdk-health` drift check (on-demand backstop). The authoritative material/exempt list lives in code (`scripts/lib/map-gate-lib.js`), pinned by `scripts/lib/test-map-gate.js` in `npm test`, NOT re-enumerated in prose.
Alternatives considered: (a) principle only — rejected, that is exactly what drifted twice; (b) auto-run the Status Reconcile ritual on a cadence — kept as a complementary backstop, not the primary, because daily reconcile heals drift after the fact while §35 prevents it at commit time; (c) scope = decisions only — rejected, Owner chose everything material including code, since the company *is* the product (CHARTER); (d) anchor in CHARTER only — rejected, CHARTER is unratified, so §35 lives in protocol (load-bearing now) with a CHARTER anchor for the constitutional why.
Rationale: Per the §32 retro's own rule (and the open surface `SURFACE-20260620-enforcement-claims-tooling-001`), a clause must not claim enforcement that does not exist — so every mechanism §35.4 names was built and verified before the text shipped. Gate verified end-to-end (block on material-only; pass on material+map; pass on `[map-exempt: reason]`; block on empty `[map-exempt:]`; pass on exempt-only; `--no-verify` bypasses as documented).
Implications: Honest limits, stated in §35: `--no-verify` bypasses Layer 1 and nothing logs it; a fresh clone has no git gate until `sdk-install-hooks` runs (`sdk-init` runs it for new projects). The gate self-gates (its own files are material) and is pinned by `npm test`, so it cannot silently rot. `sdk-init` wiring to auto-install is the one remaining build follow-up.
Reversible: YES — additive; the hook can be uninstalled (`git config --unset core.hooksPath`) and §35 retired like any protocol section.
Affects natural persons: NO
