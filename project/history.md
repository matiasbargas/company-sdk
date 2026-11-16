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

---

## SDK-CHANGE — Layered-context consolidation (project vs. machinery)
**Date of work:** 2026-07-01/02
**Made by:** Greg (CEO), Owner-directed
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE
**Status:** APPLIED in working tree (uncommitted at time of writing — Owner reviewing)

DECISION: Consolidate the repo's accumulated layers into a two-zone structure and one generated index
Date: 2026-07-02
Made by: Greg (CEO), Owner-directed
Context: The repo had grown four undifferentiated identities flat at the root — the SDK machine (packages/scripts/team/workflows/project-template), the foundational law (protocol*/CHARTER/STRATEGY/…), the dogfood instance (project/ + intent-spec/ + generated-spec/), and process exhaust (loops/ metrics/ specs/). 17 top-level entries; a model opening the repo could not tell the machine from the project running on it. Two competing index schemes (the org-domain `context-index.json`, stale since 2026-04-18, and the hand-authored A/B/C READMEs) gave no single truthful map. Owner directed: divide **the project (building the SDK + its history)** from **the SDK machinery (the tools built)**, simplify the model, and make it generalize so a future generated project stays under control over time.
Decision: Keep the machinery + law at the repo root (untouched — 22 CLI bins, npm workspaces, git hooks all keep working). Consolidate the project side under `project/`: the three context layers into `project/context/{foundation,spec,intent}` (Layers A/B/C) and run exhaust into `project/record/{loops,metrics,specs}`. Moves: `generated-spec/→context/spec`, `intent-spec/→context/intent`, `foundation/→context/foundation`, `loops|metrics|specs → record/*`. Division = "root is the SDK, project/ is the building-of-it."
Mechanisms updated in lockstep: (1) §35 classifier `scripts/lib/map-gate-lib.js` — five bare path rules replaced by one map-relative `context/**` (material) rule + a `record/**` exempt rule (record is run exhaust, like area logs); pinned test updated (48 passing). (2) `protocol.md` §35 summary reworded to the new dirs. (3) A shared `workflows/_paths.js` resolver (nested `project/` for SDK self-dev vs. root for a generated project) — canonical for Node scripts; the 3 live workflows (idea-execution-v0.1, retrospective, retrospective-v0.1) carry a compact inline mirror because the Workflow runtime has no `require()`. (4) The `context-index.json` generator extended with a tree-scanned `layers` block (brain A/B/C + record + loadOrder) and regenerated — one index, generated, current. (5) Orientation READMEs added at `project/context/` and `project/record/`; moved layer READMEs' cross-links fixed.
Alternatives considered: (a) push machinery into `sdk/` — rejected, breaks all 22 bins + workspaces + hooks in one big-bang; (b) logical-only division via the index without moving files — rejected, Owner wanted the tree to actually divide; (c) rewrite the ~7 historical one-shot seal scripts' path prose — rejected, they are sealed run-records and rewriting them falsifies what ran (left as-is).
Rationale: A generated project needs only the instance shape (context/ + record/ + state + index), never the machine — so defining that shape cleanly both simplifies team-sdk's instance and gives every future project an inheritable, self-tidying structure.
Implications / still owed: `team/office/rituals/*` and `team/roles/*` still name `metrics/ loops/ intent-spec/` as operative paths; these are SHARED machinery (run in generated projects too) so they need a generic path form, not team-sdk's `project/` prefix — a follow-up sweep pending an Owner decision on path form. Until then agents following those rituals could recreate root dirs; the generated index is the authoritative map that mitigates this. Verification: `npm test` green (all suites); `sdk-health project/` clean; no live code references old top-level dirs.
Reversible: YES — all moves are `git mv` (rename-tracked); classifier/generator changes are additive and revertible.
Affects natural persons: NO

---

## SDK-CHANGE — Harness review, batch 1: P0 repairs (§31 restored, protocol v4.6 → v4.7)
**Date of work:** 2026-11-13
**Made by:** Greg (CEO), Owner-directed; findings from a four-agent harness review (C-suite roles, delivery roles, coordination layer, office/loops/squads/template)
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE

DECISION: Restore §31 Iteration Loops and repair the harness paths that silently did nothing
Date: 2026-11-13
Made by: Greg (CEO), Owner-directed
Context: The review found machinery that the docs claim but that no longer runs. §31 and `sdk-doc iteration` were dropped by accident in the April file-rename commits (f4c51d0, b5ca556), yet 17 references (all three Guardians, §32, §34, README) still depend on them. `sdk-gate-check` regexes targeted headings the template no longer has, and the jurisdiction check passed on an untouched template. `sdk-doc read --section "## Pending"` silently returned another role's section. The §35 Stop reminder wrote to stderr, which Claude Code never surfaces. `/ask` called `node scripts/consult.js`, which generated projects do not have. protocol-core/reference were stuck at v4.3 with no generator, and project-template/SDK.md was a stale v4.3 copy that every new project inherited.
Decision: (1) §31 restored from c85a5c7, protocol bumped to v4.7, with a header "retired section numbers" line (old §32 Risk Tiers). The Risk-Tier paragraph was replaced by a Coordinator-logged skip rule; Risk Tiers is not revived. (2) `scripts/commands/iteration.js` re-added (pod names slugged so they cannot escape `iterations/`; feedback required on ITERATE; cycle >3 prints the CEO escalation). (3) gate-check: section matching by heading prefix, Jurisdictions must have no `[...]` placeholders, and pending warnings scan the whole owner H2. (4) Section lookup is level-aware ("## X" no longer matches "### X") and supports scoped paths (`## Finance (CFO) > Pending`). `append`/`add-item` scaffold a missing `## Domain (ROLE)` with the four status children. All role `--section` strings now use real, scoped headings, so the 8 extended roles no longer create ad-hoc status headings. (5) `scripts/split-protocol.js` generates protocol-core/reference byte-for-byte from protocol.md, and `npm test` fails if they go stale. (6) project-template/SDK.md was deleted; init now copies the root SDK.md and CHARTER.md, package.json `files` and update.js sync the generated views, and generated-project permissions are scoped to the SDK scripts instead of `Bash(node:*)`. (7) The Stop hook now emits `{"systemMessage"}`. (8) `sdk-health` now flags surfaces stuck in under-verification/reconciling (`.sdkrc` `surfaceStaleDays`, default 3). The never-built `sdk-doc bu-status` and the unimplemented loop-ID orphan scan are now stated as honest gaps instead of being claimed. (9) Smaller fixes: retrospective.js requires `args.date` (the hardcoded 2026-06-14 is gone), ritual docs drop the absolute machine path, stale cites were corrected (§29→§30, §18→§19, "§28" Mario gate, NEEDS-WORK→ITERATE, §33 fragment), the CTO loads compliance-requirements instead of the removed security-requirements, and the `sdk-doc study` argument order and the `/askMario` reference were fixed.
Alternatives considered: retire §31 and point Guardians at their local criteria — rejected; Guardians are a headline feature and retiring would mean rewriting 29 references. Making the Stop hook `decision: block` — rejected; it would force an extra turn on every stop until commit, which is too noisy for a reminder layer.
Implications: New regression suite `scripts/lib/test-doc-sections.js` (20 assertions: section lookup, scaffolding, iteration lifecycle, gate-check) runs in `npm test`. The new surface check immediately flagged `SURFACE-20260620-enforcement-claims-tooling-001` (under-verification for 132 days). Staleness is mtime-based, so a fresh clone resets it. The 11 workflows still hardcode projectRoot (the Workflow runtime has no cwd); retrospective.js now accepts an `args.projectRoot` override. Batches 2-6 of the review are still owed: configurable limits (`.sdkrc limits`, default no cap), single-source rules, `_shared.md`/`_guardian.md` extraction plus the placeholder sweep, the Greg output style + SessionStart hook + docs consistency test, Tier-1 skills + `.claude/agents/`, and the protocol split + frontmatter state.
Reversible: YES — §31 is additive and every script change is isolated and covered by tests.
Affects natural persons: NO

---

## SDK-CHANGE — Harness review, batch 2: configurable limits + one source per rule (protocol v4.7 → v4.8)
**Date of work:** 2026-11-13
**Made by:** Greg (CEO), Owner-directed ("amounts/limits configurable; no cap by default")
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE

DECISION: Move every amount into `.sdkrc` "limits" (default no cap), and give each disputed rule exactly one home
Date: 2026-11-13
Made by: Greg (CEO), Owner-directed
Context: The batch-1 review found the same rules stated differently across files: "1–3 peers" vs "no cap"; SOLUTION_CLASS on "all output-bearing" messages vs only DECISION NEEDED/BLOCKER; a CTO "decides alone >20% scope" while the CEO needs sign-off on it; platform primitives reviewed by the CTO in one file and by Mario in another; five load orders; three Bus formats; hour-based SLAs agents cannot observe; CONTEXT REQUEST used as a fourth PRIORITY the schema rejects; activation order copied into the Coordinator file and drifted.
Decision: (1) §16.1 plus `scripts/lib/limits.js`: `peerSpawns`, `discoveryRounds` and `loopIterations` default to `null` (no cap); `guardianCyclesBeforeEscalation` and `surfaceStaleDays` default to 3 (escalation triggers, not caps). init and bootstrap write them; `sdk-health` validates them; `sdk-doc iteration` reads them. Rule: `null` removes the count, never the stop condition. (2) §2 "Timing for session-bound agents" turns 1h/4h/24h/48h into events (same turn / before session ends / next activation / two activations). External legal clocks stay wall-clock. `scripts/lib/overdue.js` surfaces passed `DECISION BY` dates in `sdk-status` and `sdk-resume`, and 14 role-file SLAs now cite §2. (3) SOLUTION_CLASS follows the enforced schema (packages/protocol): required on DECISION NEEDED/BLOCKER, optional on INFO. (4) CONTEXT REQUEST becomes `PRIORITY: INFO` + `TAG: CONTEXT-REQUEST`. §25 registers CONTEXT-REQUEST, SDK-CHANGE, CONSULTATION, ITERATION-REVIEW/GRADUATED and LOOP-OPEN, and enums.js matches. (5) §7 rewritten as the one load order (cockpit first; history.md and the full protocol not loaded by default); AGENTS.md and SDK.md point to it. SDK.md's Bus block mirrors §1. (6) The AGENTS.md activation sequence is canonical and now includes the §31 Guardian gates; the Coordinator file points to it. (7) One Platform Primitive checklist, in staff-engineer.md: design → CTO, every PR → Mario. CTO authority capped at 20% technical scope. (8) Pod Guardian defined as a seat in §8a. EM dissolution logs to engineering-log; the EM close checklist requires both Guardian sign-offs. Liaison owns liaison-log (template stub added). UXR uses research-log; the 8 extended roles log to real files at their declared M3 level. CPTO is replaced by Head of Product (M3 PM). "Merged to main" becomes "merge on EM/Owner instruction"; test-engineer names `npm test` and stops claiming coverage. (9) Loops: critique-revise quotes §32.3 verbatim, names a fresh-context judge with a rubric, and has a critique record schema. Red-team emits `assumption-not-attacked:`. Dialectic gets an inline pair table, a rubric stop replacing the KS-statistic, a blind synthesizer and a v0 anonymization procedure. All three patterns have an "Inputs at open" block. One loop ID and folder rule is set in §32.5. (10) squad.js reads team/squads/*.md (no second roster copy). Squads gained Test Engineer/Designer and Dependency Graph/Gate sections. The ladder covers the guardians, loop coordinator and engineer. `research` was added to the type maps. Surfaces go to `surfaces/_template.md`. The status order and template fixes from the review are applied.
Alternatives considered: making protocol §1 the SOLUTION_CLASS authority (all output-bearing) — rejected because the validator, the CTO, Staff Engineer and Chief Engineer already enforce DECISION NEEDED/BLOCKER, and the cheaper rule is the one that is actually checked. Capping discovery at 4 rounds — rejected per the Owner's no-cap default; the five-question stop condition plus an Open-questions exit replaces it.
Implications: `workflows/retrospective.js` builds loop folders from `loop_id`, so a LOOP- form ID needs `state_path`; this is documented in _IMPROVEMENT_SIGNAL.md and the script is unchanged. Two historical loop folders predate the naming rule. Adding `research` to the type maps means a type that drops it stops getting the research files; all 7 types list it, so behaviour is unchanged.
Reversible: YES — config defaults and wording; every enforced path is covered by `npm test`.
Affects natural persons: NO

---

## SDK-CHANGE — Harness review, batch 3: shared modules + placeholder sweep
**Date of work:** 2026-11-13
**Made by:** Greg (CEO), Owner-directed ("modularity, not big chunks"; persona placeholders; keep Greg + Mario as aliases)
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE

DECISION: Each repeated rule lives in one module; role files hold only what is specific to the role
Date: 2026-11-13
Made by: Greg (CEO), Owner-directed
Context: Five generic blocks were copied into 27–31 role files (Consultation Mode, Challenge and Feedback, Clarify-before-implementing, Agency check, the two Constraint-1 safe-change lines), and Constraints/Purpose/Soul was pasted whole into 11 of them. The copies had already drifted: none carried the CHARTER pointer. The three Guardian files were about 85% identical. Personas hardcoded a city, a first name and a gender (for example "Amsterdam's merchant tradition runs in her"), which contradicts the spawn-time naming formula: a spawned "Fatima Nairobi" CFO still read Amsterdam. `[PERSONA_NAME]` was used about 200 times despite the `{{name}}` convention, and `[COMPANY]` was never filled.
Decision: (1) `team/roles/_shared.md` gains the Shared Operating Rules: placeholders, onboarding via `sdk-doc spawn` (consultation spawns exempt), Consultation Mode, Challenge and Feedback, Agency check, Shared Safe-Change Rules (including "do not commit/merge/push unless asked"), consequential-decision logging, and a standard work close. All role files point to it, and the template follows the same structure. About 120 KB, roughly 30k tokens, was removed across the role files with no rule dropped. (2) `team/roles/_guardian.md` is the single Guardian procedure: authority, an 8-step cycle with a verdict table, rhythm, commands, and the Done Definition. Each Guardian file keeps its persona, inputs, domain checks and challenge triggers (about 200 → 140 lines each). Exit criteria live only in §31.2 and `sdk-doc iteration`. (3) Personas use second person plus one `*Cultural lens — {{city}}: {{cultural_profile}}*` line. Hardcoded persona names became `{{name}}`, and sample names in examples became `<Name> <City>`. Greg and Mario stay as protocol role aliases. Trivia-only persona prose was trimmed to the conviction it supported. (4) The role loader fills `{{name}}`, `{{city}}`, `{{cultural_profile}}` and `{{company}}` (test added); `[PERSONA_NAME]` and `[COMPANY]` are swept. (5) The four Determinism Pre-flight copies point to §24 and keep only their domain examples. The Coordinator's copies of §1/§3/§10 are replaced with links. `team/roles/CLAUDE.md` points to §7 and AGENTS.md, and lists `_shared.md`, `_guardian.md`, the Loop Coordinator and `loops/`. Protocol §18–24 headings were normalized to `## N.` so the generated views and section tooling see them.
Alternatives considered: keeping city personas as labelled "defaults" — rejected by the Owner, because the persona must match the agent actually spawned. A full rewrite of each persona — rejected; only the sentences carrying geography or gender changed.
Implications: The `team/roles/CLAUDE.md` index still shows default startup-squad names (Gabriela, Rafael, Pablo …) as documented defaults. An agent reading a role file outside the loader sees raw placeholders, and `_shared.md` → Placeholders tells it how to resolve them.
Reversible: YES — text-only refactor plus an additive loader option.
Affects natural persons: NO

---

## SDK-CHANGE — Harness review, batches 4–5: harness-native persona, hooks, skills, subagents, docs test
**Date of work:** 2026-11-13
**Made by:** Greg (CEO), Owner-directed ("small composable skills")
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE

DECISION: Move rules that were only written in prose into the Claude Code harness, and package repeated procedures as small composable skills
Date: 2026-11-13
Made by: Greg (CEO), Owner-directed
Context: "You are Greg" lived in CLAUDE.md, which every subagent also loads. Each CLO or CTO peer was therefore told to be Greg (the four review agents received it). Session start, file protection, the read-only rule for consultation spawns, and fresh-context critics existed only as prose. `/ask` lived in legacy `.claude/commands/`. Nothing checked cross-file references, which is how §31 disappeared unnoticed.
Decision: (1) **Persona:** the `.claude/output-styles/greg.md` output style (main thread only) is set in settings, and CLAUDE.md now says subagents take their own role. (2) **Hooks:** SessionStart prints a compact brief (release, overdue `DECISION BY`, next agent; read-only and capped at 2.5k chars). PreToolUse denies edits to CHARTER.md (Owner ratification only) and to the generated protocol views. The Stop reminder is unchanged. Committed permissions allow the SDK scripts and deny force-push. (3) **Skills:** 25 skills in `.claude/skills/`, each one procedure that points at its canonical source instead of copying it. Atomic: bus-message, log-decision, peer-consult, domain-close, session-resume, challenge, onboard-agent, writing-style. Composite: gate-review, guardian-review, irreversible-review, seal-release, loop-open, critique-revise, red-team, office-day, squad-activate. Document templates, loaded from the role file on demand: threat-model, regulatory-map, risk-register, architecture-brief, budget-model. `/ask`, `/askCTO` and `/askGreg` moved from `.claude/commands/` to skills, and the hidden "stop after 2 perspectives" cap was removed. (4) **Subagents:** `scripts/gen-agents.js` generates `.claude/agents/<role>.md` (36 files) from the role files with `omitClaudeMd: true`. Consultation roles are Read/Grep/Glob only, which turns §16 READ ONLY into an enforced tool restriction. Guardians add Bash for `sdk-doc iteration`, and the Loop Coordinator adds Write. Engineer and Test Engineer are execution assignments with edit tools that still never commit unless told. Fresh-context critic, judge, red-teamer and blind-synthesizer make loop independence structural. `npm test` fails if the generated agents go stale. (5) **`sdk-doc bus`** now enforces §1: DECISION BY on DECISION NEEDED, ESCALATION on DECISION NEEDED and BLOCKER, SOLUTION_CLASS for technical roles only on non-INFO messages, and CONTEXT-REQUEST as a tag (the legacy priority spelling is auto-converted). (6) **`scripts/lib/test-docs-consistency.js`** runs in `npm test` and fails on version-header drift, `§N`/`§N.M`/`Section N` citations without a protocol heading, `sdk-*` bins and `sdk-doc` subcommands that don't exist, unregistered tags, `[PERSONA_NAME]`/`[COMPANY]` in role files, and SDK.md Bus fields that diverge from §1. 1,500 checks pass, and a probe file with a fake §99, a fake command and a fake tag fails as expected. (7) init, bootstrap and update copy skills, agents and output styles into generated projects, and project settings get the Greg style plus the SessionStart/PreToolUse hooks by absolute SDK path. Smoke-tested with a throwaway `sdk-init` project, since removed. (8) CLAUDE.md is slimmed (about 10 KB → 7.5 KB): the CLI list and the stale "Active Project — sdk-v3 (v2026.Q2.1)" block are replaced with pointers, and the naming formula is condensed to its §14 pointer. Mario's review template gains the named-alternative, reversal-cost and Near Misses fields its own rule requires.
Alternatives considered: a SessionStart hook that injects ceo.md as the persona — rejected, because hook context reaches the session and its subagent copies, while an output style is main-thread by design. One big "team" skill — rejected per the Owner: composable atomic skills are referenced by name from the composite ones.
Implications: `omitClaudeMd` and the output-style behaviour follow current Claude Code docs; if a future version changes them, `gen-agents.js` and `greg.md` are the only two files to touch. Generated projects still lack the §35 commit-msg gate (open follow-through). Workflow-based skills (office-day) still need the Owner's opt-in to workflows.
Reversible: YES — remove the settings keys or the generated directories; every script is covered by tests.
Affects natural persons: NO

---

## SDK-CHANGE — Harness review, batch 6: per-section protocol + one state reader
**Date of work:** 2026-11-13
**Made by:** Greg (CEO), Owner-directed ("generated per-section"; "one parser module")
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE

DECISION: protocol.md stays the only hand-edited source, generated as one file per section; markdown state is read through one module
Date: 2026-11-13
Made by: Greg (CEO), Owner-directed
Context: protocol.md is about 110 KB. Agents loaded either the whole file or a two-part split. Eight scripts parsed current-status.md and compliance-requirements.md with private regexes. Two of them had already broken silently: gate-check (headings) and `sdk-status`, which read the Active Missions table by column position and so put "Next action" into Status.
Decision: (1) `scripts/split-protocol.js` also generates `protocol/NN-<slug>.md` for §0–§35 plus `protocol/INDEX.md`. §7 now loads sections by number, the PreToolUse hook denies edits to them, init and update ship them, and `npm test` pins them. (2) `scripts/lib/project-state.js` is the one reader: header fields, H2 bodies, and header-aware tables for missions, waiting, open decisions, next agent, release, compliance gates, jurisdictions and pending items. `sdk-status`, `sdk-gate-check`, `sdk-version` and `sdk-pre-tag` read through it. `scripts/lib/test-project-state.js` pins the column-order and template-heading cases. File formats are unchanged, so existing projects keep working. (3) Ritual files carry `ritual:` frontmatter (id, order, owner, cadence, slot, runs, writes, idempotent), and the docs test checks it against roles and the README. Status Reconcile, in both the ritual and the office-day workflow, now rewrites only derived sections and carries Session Notes and Open Decisions verbatim.
Alternatives considered: YAML frontmatter on current-status.md and the requirements files — deferred by the Owner; it needs a migration and makes prose and frontmatter two sources of truth. Making the per-section files the source — rejected; every existing reference and the core/reference views would have to move.
Implications: `sdk-status` now lists the open missions in this repo's status file (three BLOCKED Tier-2 missions), which the old positional parser silently dropped. ops.js, kill.js, pod-update.js and manifest-generator still use their own small regexes; move them onto project-state.js when next touched.
Reversible: YES — generated files and a parser module; tests cover both.
Affects natural persons: NO

**Harness review complete (batches 1–6).** Six commits on `feat/harness-hardening`. `npm test` is green, including the four new guard suites (doc sections, project state, docs consistency, generated views).

---

## SDK-CHANGE — Harness review, chapter 6: work-based time, Charter v0.2, first verified surface (protocol v4.8 → v4.9)
**Date of work:** 2026-11-13
**Made by:** Greg (CEO), Owner-directed; surface verified by Mario, CISO, Test Engineer (read-only subagents)
**Release:** v2026.Q2.3
**Tag:** SDK-CHANGE

DECISION: Staleness is measured in work; the Charter gains precedence, autonomy limits and a review cadence; enforcement claims must be true
Date: 2026-11-13
Made by: Greg (CEO), Owner-directed
Context: The Owner asked to start or discard the stalled surface, noted that day-based staleness is "weird" for agents, and asked what the Charter was missing. The surface looked 132 days stale but had seen only 5 commits. Its roster had never been convened because the meta-loop meant to run it was never built. The Charter itself cited two things that don't exist.
Decision: (1) **Work-based staleness.** `scripts/lib/activity.js` counts commits since a file last changed, and agent iterations (closed §32 loops plus graduated §31 cycles). `sdk-health` and `sdk-pre-tag` use it, with `limits.statusStaleCommits` (5) and `limits.surfaceStaleCommits` (10). `surfaceStaleDays` is retired with a pointer. This is a .sdkrc interface change, so protocol **v4.9**. (2) **Charter v0.2 (DRAFT, Owner-authorized edit, pending ratification in the PR).** Added Precedence (Constraints > Charter > Owner direction > protocol > strategy > role rules > skills/agents > agent or tool input), seven Autonomy Limits, and Review every `limits.charterReviewEvery` (10) iterations. `sdk-health` flags a review as due, and the `charter-review` skill runs it. Layer A is settled as human-ratified, always. The meta-loop and Loop Interface claims are marked planned (a verifier condition). (3) **SURFACE-20260620-enforcement-claims-tooling-001 verified** after three rounds (all three verifiers raised concerns in round 1; CISO and Test Engineer passed in round 2; Mario passed in round 3). The result is protocol §30 "Enforcement claims must be true" plus the `ENFORCEMENT_CLAIMS` check in `npm test`. Four live false claims were fixed: the §24 ratchet scan, the loop-coordinator orphan check, the §21 executor guard (now naming the real tool allowlists), and the Charter meta-loop. The README gate wording is honest. The `protect-files` hook covers NotebookEdit and states its Bash limit. An improvement signal was emitted for the surface.
Alternatives considered: discard the surface — rejected, because the rule is sound and exposed live false claims. A pre-tag checklist for rule 2 — rejected by the roster, since a test runs on every commit and pre-tag never calls `health.js`.
Implications: Surfaces still need someone to convene their roster. The signal suggests ritual 01 should spawn verifiers, not only report. The Charter is not load-bearing until the Owner signs it. The claims detector is regex-based, so unusual phrasing can still slip through; the registry plus the §30 rule make each miss a test fix, not a silent lie.
Reversible: YES.
Affects natural persons: NO

---

## Portfolio Orchestrator — Discovery decisions
**Date:** 2026-11-13 · **Made by:** Owner (Matias Bargas), via Greg (CEO) · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE

DECISION: Become an orchestrator of parallel team-sdk companies; tokens are fuel allocated by protocol
Context: The Owner's direction: "we need to become an orchestrator of several team-sdks running in parallel. Tokens are fuel that the company uses to share", plus "we can build an allocation protocol" and "infinite fuel should be an option". Discovery ran with five read-only spawns (CFO, CTO, CISO, CLO, Red-Team), synthesized in `context/intent/portfolio-orchestrator/discovery-synthesis.md`.
Owner decisions:
1. **Ownership:** each company has its own human Owner. The holding Owner governs fuel and the commons, not operations.
2. **Fuel:** fund bets, release on proof, unspent fuel returns to the pool. Fuel is **API spend, with one API key per company**. The pool is an **envelope per holding cycle**, and **infinite fuel is an option** (`limits.fuel.envelopePerCycle: null`). Everything stays metered, and every grant still needs a kill condition.
3. **Proof (accepted risk):** "for now the fuel is a matter of autonomy of the system". v0 accepts each company's own gates as proof that releases a tranche. The Red-Team rated self-verification critical (fuel flows to whoever is best at paperwork). That risk is accepted knowingly. **Revisit trigger:** a second human Owner joins, or VOF diverges from the company Owner's judgment for 2 consecutive cycles (capability `cap-po-proof-002`).
4. **Isolation:** light v0 with the Owner's own ventures only: separate clones, a key per company, runner-owned settings and hooks, a kill switch. Full sandboxing becomes a gate before any other Owner joins.
5. **Commons:** patterns, plus context a company opts in to publish (with a consent record, secret and PII scans, treated as irreversible).
Alternatives considered: an outside-verifier proof rule (Red-Team, CISO), deferred by the Owner; a subscription rate-limit window as fuel, rejected in favour of API spend; full sandbox from day one, deferred.
Implications: Before a company owned by someone else onboards, the CHARTER needs a holding-Owner vs company-Owner amendment, plus the CLO gate items. The CTO's six irreversible decisions go to Mario before build. §36 stays a draft until Discovery graduates.
Reversible: YES (design stage).
Affects natural persons: NO

---

## SDK-CHANGE — Specs outlive implementations (capability layer + refactor watch)
**Date:** 2026-11-13 · **Made by:** Greg (CEO), Owner-directed · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE

DECISION: Describe every capability independent of its code, pin each built one with tests, and make refactors a triggered discussion
Context: The Owner asked for layers in which every variable of the problem is described well enough that execution can be rewritten from scratch without losing capabilities, with tests that keep functionality from getting lost between versions. Large rewrites are not required now, but rising complexity must trigger a discussion, and we must be ready for it.
Decision: (1) protocol §30 "Specs outlive implementations". (2) Layer B gets `kind: capability` claims with given/when/then acceptance against public interfaces, and status `planned | built | retired`. `context/spec/portfolio-orchestrator/variables.yaml` is the full problem model (entities, attributes, invariants), and its `claims.yaml` holds 15 planned capabilities, the v0 build backlog. `context/spec/sdk-core/claims.yaml` holds 11 built capabilities from today's work. (3) `scripts/lib/test-capability-coverage.js` runs in `npm test` and fails when a built capability has no `@covers` test that runs in `npm test`, or when a tag names no capability. A probe with a renamed tag failed as designed. (4) A refactor watch: `sdk-health` reports a refactor discussion as due when a source file passes `limits.refactorReviewLines` (400) or grows `limits.refactorReviewGrowthPct` (25%) past its acknowledged size in `context/spec/_refactor-watch.json`. The `refactor-review` skill runs the discussion (spec and cover first, then refactor, split, or defer). `pre-tag.js` (642 lines) and `init.js` (620) are baselined with the decision "defer; prerequisite: spec their capabilities first".
Implications: Building the orchestrator is test-first: conformance tests are written from the planned capabilities before the code. Specs for `pre-tag.js` and `init.js` are owed before either is rewritten.
Reversible: YES.
Affects natural persons: NO

**Addendum — 2026-11-14 (Discovery cycle 2):**
- **Commons admission needs an outside verifier** (Owner decision): another company's roster plus the CISO, always. The accepted own-gates risk covers **fuel release only**, not the commons, because a commons item reaches every company.
- **Metering spike** (Owner-approved spend, about $0.17; `record/experiments/2026-11-13-metering-spike/`): meter from `result.modelUsage`, since top-level `usage` came back all zeros. `--max-budget-usd` is a soft ceiling checked after a turn ($0.05 cap ended at $0.084), so the provider key cap is the hard ceiling and overshoot is an `overrun`. Each bare session has about 16.7k tokens of fixed overhead on Opus.
- **Infinite fuel removes the pool limit only.** Tranche gating and kill conditions still apply (§16.1).
- **The revisit trigger is now measurable.** The company Owner rates each funded bet advanced / flat / regressed. Divergence means ≥ 50% of the bets with VOF above the portfolio median are rated flat or regressed. Two consecutive cycles of divergence, or a second Owner, makes the outside-verifier decision for fuel due.

**Discovery GRADUATED — 2026-11-14 (cycle 2, 6/6; `project/iterations/discovery/iter-002.md`).** Carry-forward items settled by Greg: (1) divergence is computed within a bet class of ≥ 3 funded bets, against that class's VOF median; (2) an unrated funded bet counts as divergent, and sdk-health flags the unfilled judgment column; (5) rate-limit contention is marked as an untested assumption; (6) the brief now says v0 proof is own-gates. Routed to owners: CLO reads the live provider terms before the first two-instance run; CTO tests per-company keys and rate limits at scale; Mario plus a §32 Red-Team look at how the ledger stays out of reach of company sessions (Bash) under light v0. Next gate: Mario's irreversibility review of the six decisions.

---

## Mario gate — Portfolio Orchestrator irreversible decisions: APPROVED WITH CONDITIONS (2026-11-14)
**Made by:** Chief Engineer (Mario seat), with the Owner deciding D7 · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE

DECISION: The six irreversible decisions hold in shape, and formats are pinned before any code. D7, the trust split, goes to a dedicated sandbox OS user.
Context: The Mario review of D1 ledger model, D2 runner as the only meter, D3 one repository per company, D4 runner contract, D5 commons identity, D6 one key per company, and D7 keeping the ledger out of company reach (a Guardian carry-forward).
Decision: All seven are **APPROVED WITH CONDITIONS C1–C14**, recorded in `context/spec/portfolio-orchestrator/variables.yaml` → `mario_conditions`. **D7 (Owner decision):** company sessions run as one dedicated unprivileged sandbox OS user. The runner and `holding/` (ledger, settings, hooks, kill switch, commons, keys) stay under the Owner's user with mode 0700. The runner launches sessions through a narrow sudo rule and passes the key per session. Per-key reconciliation is added as the layer that detects problems, and deny rules as a second layer. Per-company users or containers stay deferred until a second Owner.
Alternatives considered: deny rules alone (bypassable with `python -c`); HMAC under one user (the key is readable by the forger); a ledger daemon as another user (it cannot authenticate callers under the same user); detect-not-prevent only (it cannot catch a forged proof, release or grant); containers now (deferred, too slow for the proof).
Implications: These can start now, test-first: the conformance tests, the ledger library, the meter (on recorded fixtures), and the portfolio validator. **The first two-company run is blocked until C4** (a second metering spike), **C12** (sandbox user built), **C13** (where provider caps live, possibly per workspace) **and C14** (keys never readable by the sandbox user) hold.
Reversible: NO for D1, D4 and D5 once real events or adoptions exist (formats pinned via C1, C8 and C10). YES for the others.
Affects natural persons: NO

---

## SDK capability inventory (2026-11-14)
Three agents wrote every CLI surface into Layer B and pinned each behaviour with black-box conformance tests: `context/spec/sdk-lifecycle` (47), `sdk-session` (58) and `sdk-doc` (72). Each has a suite in `npm test` (`test-cap-lifecycle.js` 259 assertions, `test-cap-session.js` 205, `test-cap-doc.js` 175). **Behaviour coverage: 157 of 188 existing capabilities pinned by tests (84%), 11 unpinned, 20 defects** (each test pins today's behaviour with a `// DEFECT:` comment; listed by `sdk-health`). One defect was a chapter-6 regression of mine: `sdk-pre-tag` crashed on any project with a manifest (undefined `staleHours`). It is fixed in this commit, and the capability is now built. The worst open defects are: `disagreement resolve` on an already-resolved id silently resolves the *next* entry, corrupting history.md; `sdk-next` and `sdk-resume` print the table header instead of the activation phrase; `sdk-resume` reports gates as clean while they are BLOCKED; `sdk-ops clo-ciso-gate` disagrees with `sdk-gate-check`.

---

## SDK-CHANGE — Defect batch (20 → 0) + Portfolio Orchestrator core (`packages/holding`) (2026-11-14)
**Made by:** Greg (CEO), Owner-directed ("both") · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE

DECISION: Fix every defect the inventory found, and start the orchestrator build test-first under the Mario conditions
Context: The capability inventory pinned 20 defects (each as a `// DEFECT:` test). The Mario gate cleared the ledger library, meter and validator to start under C1–C3 and C5–C11.
Decision: (1) **Defect batch:** four engineers fixed all 20, plus the ones found along the way. Each test was flipped from pinning the wrong behaviour to asserting the spec, and each claim is now `built` with a `fixed_note`. Highlights:
- `disagreement resolve` no longer resolves a different entry, which had corrupted history.md;
- `sdk-next` and `sdk-resume` read the activation phrase from the table, and `init` fills that row;
- `sdk-resume` shows BLOCKED gates;
- `sdk-ops` reads the same parsers as `sdk-gate-check`, and its file staleness is commit-based;
- `sdk-pre-tag` `--fix` and `--json` are consistent;
- `--dry-run` no longer writes anything in study, session, domain or disagreement (it had even deleted files);
- `sdk-update` works in generated projects (linked mode);
- `sdk-ship` and `sdk-github release` accept their own hint's history form, and `sdk-github` validates `--release-id`;
- `bootstrap` matches `init`'s harness;
- `retro` reads piped input.

New defect found and fixed during integration: `init` substituted `[YEAR]` and `[YYYY-MM-DD]` inside the law docs, which rewrote `v[YEAR].Q[QUARTER]` format rules. Law docs are now copied byte-for-byte (`cap-life-init-018`), and `update` syncs them verbatim. Removed the dead hour thresholds from `daemon-config.js`.
(2) **`packages/holding` (test-first, 217 assertions)** contains: canonical JSON + SHA-256 (C1); an append-only, hash-chained, idempotent ledger with a single-writer lock (C2); the full event list (C3); an owner-only `fund`; a freeze; fold balances; a meter that reads `modelUsage`, keeps raw usage verbatim, fails closed to `unmetered` on an unknown schema or version (C5), and records the priceTable version; overruns; the portfolio validator (owner required; a second Owner and an unratified CHARTER refused; holding and company paths never nested, C7); and grants (tranches, named proof, kill condition, one proof per tranche). Nine orchestrator capabilities are now `built`. Seven deliberate mutations to the code each turned the suite red.
Implications: **Behaviour coverage is 189 of 199 existing capabilities pinned (95%), with 0 open defects** (was 157/188, 20 defects). `npm test` runs about 4,200 assertions. Still `planned` for the orchestrator: runner, landing mode, reserves, reclaim, commons, judgment column. The two-company run is still blocked on C4, C12, C13 and C14. Design choices to review: a stale ledger lock is never broken automatically (a human removes it); there is no default price table (the caller must pass one); overruns draw from the general pool until the overrun reserve exists.
Reversible: YES (code + tests).
Affects natural persons: NO

**Owner direction — 2026-11-14:** "Focus on orchestration first; iterate until it's ready. Sandbox: keep running for 1 for now." The v0 orchestrator runs **one company** (concurrency 1). The two-company blockers (C12 sandbox user, C13 cap location, C14 key isolation) are deferred until a second company is added; `cap-po-registry` keeps refusing a second company until they hold. "Ready" means the single-company lifecycle works end to end (grant → run → meter → land/kill → proof → report → reclaim) and the Implementation Guardian graduates it.

**Metering spike 2 — 2026-11-14 (Owner limit $0.05 for validation; EXCEEDED).** Greg ran two sessions himself. Run (a) cost $0.085, because `--model claude-haiku-4-5` was overridden by the Owner's environment (`ANTHROPIC_MODEL`, user settings `model`) and the session ran on Opus. Run (b) was killed at 4 s with no usage visible; it may also have been billed. Greg did not check which model would actually run before spending; that is the cause, and no further real runs were made. Findings (`record/experiments/2026-11-14-metering-spike-2/`), now required of the runner:
- a clean environment, with no Owner env or user settings inherited;
- model pinned by runner-owned settings;
- abort on the `system:init` event when the resolved model does not match the grant's model, before any spend;
- refuse a run whose cap is below the model's session floor;
- killed runs before the first assistant message are recorded as `unmetered` (spend the meter cannot see), so per-key provider reconciliation is required even with one company.

---

## SDK-CHANGE — Orchestrator iteration 1: runner, CLI, proofs, cycle, report (2026-11-14)
**Made by:** Greg (CEO), Owner-directed ("focus on orchestration; iterate until ready; one company") · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE
- **LocalRunner + landing hook:** a contract with a version and an idempotent start; a semaphore plus a per-company lock; an authoritative pre-flight (frozen, unratified, tranche exhausted); a clean env from an allowlist, with no `ANTHROPIC_*`/`CLAUDE_*` from the Owner; the model pinned in settings and with `--model`, plus `--setting-sources project` so user settings are never loaded; a hard stop with `model_mismatch` at `system:init`; refusal below the session floor; landing mode that denies work tools and allows git; freeze mirrored to the hook. Draws from sessions started before a freeze are accepted with `after_freeze` (Greg's decision: a freeze stops new work and does not hide spend).
- **`sdk-holding` CLI:** init, add-company, fund (incl. infinite), grant, ratify, run, proof, judge, close, kill, cycle close, freeze/unfreeze, report, verify. Proofs are checked at the company's commit SHA (Level 3), with revert detection. Cycle close handles reclaim and envelope top-up. The report shows VOF per cycle, the judgment column, divergence, and the revisit trigger.
- **Tests:** `packages/holding` has 573 assertions and spends zero tokens (a fake CLI built from recorded streams). Behaviour coverage is 199 of 209 (95%).
- **Known risks going into iteration 2:** limits live outside the hash chain (editing settings changes how history replays); the runner reads only part of the limits; `priceTable` and the pinned Claude Code version must be set before a real run. Spike-2 findings are carried as runner-004/005 and reconcile-001.

**Orchestrator iteration 2 — 2026-11-14.** Limits, the price table and the runner pin are now ledger events (holding-owner only) that are replayed during the fold. `settings.json` is display-only, so editing it cannot rewrite history. A shared pre-flight (`src/preflight.js`) is used by both the runner and the CLI, so reserve and overrun enforcement live in one place. `run` refuses with NOT_READY until the price table, pin and session floor are recorded. `holdingHealth()` reports a broken chain, an unfilled judgment column, the accepted-risk revisit trigger and unmetered spend, and is wired into `sdk-health`. A new end-to-end test drives the real `sdk-holding` CLI through the whole single-company story. It found two CLI bugs (`run` never passed the budget and model, so no session could start; `freeze` used the wrong stop contract), and both are fixed. `packages/holding` has 722 assertions; behaviour coverage is 201 of 211 (95%). Next: Implementation Guardian review (§31).

**Implementation Guardian cycle 1: ITERATE (2026-11-15).** 722 tests green, but a real run today would mislead. Findings: (1) runner settings force `defaultMode: default` with no allow list, so real sessions can't Edit, Write or commit, and still report `done`; (2) an agent can self-ratify, fund or unfreeze through Bash (sessions run as the Owner's user), and the git exception passes `-c alias`; (3) killed or unpriced-model sessions charge nothing to the grant, and reconciliation is unbuilt; (4) runner.js, fold.js and the CLI are over 400 lines, there is no README, and dead bridge code remains in the e2e test; (5) denials, uncharged spend and the live-estimate caveat are not reported. Constraint 1 passes.
**Owner clarification:** "build the sandbox user, one company." D7 is back in v0: company sessions run as a dedicated OS user, launched through a narrow sudo rule, and holding/ stays under the Owner (0700). The Owner runs the one-time sudo setup and provides an API key for the company (the sandbox user cannot use the Owner's login or keychain). Iteration 3 addresses every Guardian finding.

**Orchestrator iteration 3 — 2026-11-15** (answers Implementation Guardian cycle 1):
- **Refactor first, with tests green before any behaviour change:** runner.js, fold.js and the CLI are split into `src/runner/*`, `src/fold/*` and `src/cli/*`. Every file is under 400 lines.
- **Real sessions can work and land.** The permission profile allows edits inside the company root, an allowlist of git subcommands, and the test command. Denials are recorded, and a session that achieved nothing ends as `no_work_denied`.
- **The landing hook's git allowlist** refuses `-c`, config, aliases and command chaining.
- **Self-elevation is blocked at the OS level by the D7 sandbox user.** On top of that, Owner commands refuse with RUN_CONTEXT inside a run, and Bash deny rules act as a tripwire.
- **The sandbox launch never puts the API key on argv.** The key passes through the environment (`sudo --preserve-env`, with `env_keep` limited to the key and the run id). Session files sit in an Owner-owned directory (0755/0644) that the sandbox user can read but not write.
- **Sandbox commands:** `sandbox setup` generates the sudo script and never runs it, `sandbox doctor` makes 7 read-only checks, and `key set` writes the key at mode 0600 and never echoes it.
- **Leaked spend:** an unmetered session takes a provisional debit (the larger of the estimate and the session floor), and the next tranche stays blocked until `sdk-holding reconcile` settles it against provider usage the Owner enters.
- **Visibility:** denials, provisional and uncharged FU, and unreconciled periods appear in the report and in health.
- **README** with a first-run checklist.
- **Totals:** 918 holding assertions; behaviour coverage is 204 of 214 (95%).

**Implementation Guardian cycle 2: ITERATE (2026-11-15).** All cycle-1 items are closed, and 5 of the 6 criteria pass. One blocker: under D7 the landing/freeze hook fails open. The hook command (the Owner's node running a file in the repo) sits under the Owner's 0750 home, which the sandbox user cannot reach. Claude Code treats a hook that fails to run as non-blocking, and the runner sets no deadline on budget or freeze landing. Cycle 3 (the last before escalation) fixes:
- install the runtime and hook where the sandbox user can reach them;
- check that access in both `doctor` and the runner pre-flight;
- add a hard-kill deadline to budget and freeze landing;
- read `sessionDir` from the ledger;
- deny Edit/Write on `.git/**` and `.claude/**` (a carry-forward, done now).

**Orchestrator cycle 3 — 2026-11-15** (answers Guardian cycle 2: the hook failed open under D7):
- **Reachable runtime:** `src/sandbox-access.js` walks every parent folder for the sandbox user. The setup script installs a self-contained hook and a reachable node in an Owner-owned 0755 runtime folder, and records the runtime paths in the `sandbox` ledger event.
- **Access checked twice:** `doctor` and the runner pre-flight (SANDBOX_ACCESS) both check node, the hook, claude, the clone and the session folder.
- **Fail closed without the hook:** every landing (budget, freeze, stop, hook failure) arms a runner-side hard-kill deadline, so budget and freeze are bounded even if the hook never runs. Hook errors force landing.
- **Session folder** is read from the ledger.
- **Persistence route closed:** Edit/Write is denied on `.git/**` and `.claude/**`, and git hooks/config flags are refused.
- 993 holding assertions.

---

## Portfolio Orchestrator v0 (single company) — Implementation GRADUATED (2026-11-15, cycle 3)
**Made by:** Implementation Guardian (verdict); recorded by Greg (CEO) on the Owner's explicit approval, because the Guardian's own write was blocked by the session permission check · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE
Path:
- Discovery graduated in cycle 2.
- The Mario gate approved with conditions C1–C14; D7 is the sandbox user.
- Implementation ran 3 cycles: cycle 1 ITERATE (5 fails), cycle 2 ITERATE (the hook failed open under D7), cycle 3 GRADUATE (6/6).
- `packages/holding` has 993 assertions and spends zero tokens; SDK behaviour coverage is 204 of 214 (95%).

**Ready means:** the single-company lifecycle works end to end (grant → ratify → run → meter → land/kill/freeze → proof → report → reconcile → cycle) under the sandbox user. It fails closed when the hook cannot run, and it refuses to start until the Owner's setup is complete.

**Before the first real run, the Owner must:**
- review and run the generated sudo script (`sdk-holding sandbox setup`), then pass `sandbox doctor`;
- `key set` the company key;
- set the price table, the pin and the session floor;
- approve a budget and set a **provider-side spend limit** (`--max-budget-usd` is soft);
- use a short landing deadline for run 1.

**Carry-forwards:** N1 (the setup script runs the hook as the sandbox user and expects a deny), N2 (the hook's sha256 and non-writability checked before each run), N3 (run-1 deadline). **The first real run verifies:** C1 (the real hook-error event shape), C2 (sudo keeps the two environment variables), C3 (metering of Task subagents), C4 (reconcile against the provider bill before a second run).

---

## SDK-CHANGE — Portfolio Orchestrator v0.2 built by a multi-agent pipeline (2026-11-15)
**Made by:** Greg (CEO), Owner-directed ("run a pipeline to build this; define deliverables") · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE
**Contract:** `context/intent/portfolio-orchestrator/v0.2-deliverables.md`, with acceptance tables D1–D3.
**Pipeline:** each deliverable went build → independent adversarial verify → one fix round → re-verify, followed by an integration check. 9 agents, no errors; no tokens spent on real sessions, no sudo, no commits by agents.
**Results:**
- **D1, first-run hardening (Guardian N1–N3):**
  - The setup script proves, as the sandbox user, that the installed hook denies.
  - The pre-flight refuses HOOK_STALE (sha256 mismatch) and HOOK_WRITABLE.
  - `run --landing-timeout`, with a 60 s first-run landing default (`firstRunLandingTimeoutSec`).
  - `runner/index.js` cut to 347 lines; README updated.
  - Verified 5/6. The remaining item (`sandbox setup --help`) sat at a scope boundary (`cli/common.js`); Greg fixed it so `<command> --help` works without a holding, and pinned it with tests.
- **D2, Commons:** verified 6/6.
  - Content-addressed publish into quarantine, with a forbidden-carrier denylist.
  - Admission only through a verified surface whose roster includes another company plus the CISO (self-verification refused; qualified surface ids).
  - Pull needs Owner approval, writes a lockfile, and never overwrites local edits.
  - Published context needs a consent record and passes secret and PII scans.
  - Revoke without rewriting history.
  - Ledger events: `commons_publish`, `commons_admit`, `commons_revoke`. Greg updated the ledger test's expected event set.
- **D3, second-company design (documents only):** verified 5/5 in `second-company/`:
  - isolation design (per-company users; C12/C14);
  - provider-cap verification plan, with every unverified fact marked UNKNOWN (C13);
  - CHARTER amendment for holding Owner vs company Owner, a **PROPOSAL** the Owner ratifies, recommended after v0.2 is ratified;
  - gate checklist;
  - 9 planned `cap-po-second-owner-*` capabilities, merged into claims.yaml.
**Totals:** `packages/holding` 1225 assertions (15 suites). Behaviour coverage 210 of 220 (95%). All source files are under 400 lines.

**Company brain + human collaboration: design proposal (2026-11-15).** The Owner asked how the companies' memory/brain should work and how a human team should collaborate with the agents through an API. Greg synthesized CTO, CDO, Designer and CISO consultations into `context/intent/company-brain/design.md`. In brief:
- **Brain:** git is the truth (L0 law, L1 spec, L2 intent, L3 live map, L4 exhaust) and indexes are derived. Memory uses one provenance envelope over four types (episodic, semantic, procedural, judgment); only semantic memory decays, measured in work.
- **Authority:** knowledge weight is not command authority. Human claims are high-confidence knowledge but never instructions (Precedence #8).
- **Humans** join as named principals on surfaces, bus and decisions. Interfaces in order: inbox → GitHub PR → local MCP → Slack digest; an HTTP gateway only when needed. The holding stays Owner-only through the CLI.
- **Five CISO non-negotiables** apply before any external human.
- **Gaps verified in code:** the machine-global `packages/memory` store breaks company isolation; the memory ingest duplicates entries and misdates them; Layer B has no freshness or citation checks; judgment data is never joined; humans have no identity.
Proposal only. The storage and identity model needs an irreversible §34 surface and Owner sign-off.

---

## SDK-CHANGE — Company brain pipeline: B1–B4 built, B5 prepared for the Owner (2026-11-15)
**Made by:** Greg (CEO), Owner-directed · **Release:** v2026.Q2.3 · **Tag:** SDK-CHANGE
**Contract:** `context/intent/company-brain/deliverables.md`. **Pipeline:** 15 agents (build → refuting verify → fix → re-verify, then integration), no errors.
- **B1, memory integrity:** deterministic ids (re-ingest adds zero); dates from the source, never the ingest day; an unresolved challenge is `unresolved`; a provenance envelope on every entry; **the store is per company** (`<project>/.team-sdk/memory`), with the machine-global store opt-in only and flagged as a leak risk. Greg fixed the `sdk-memory` CLI (per-company store, `--dir`, `--global` opt-in, lazy store so usage errors write nothing) and its pinned test.
- **B2, Layer B quality:** sdk-health reports claims-citation, claims-stale (work-based) and claims-supersede. The README matches reality. It found 41 broken citations: 24 were folder renames (fixed), and **17 cite line ranges that no longer exist** (`idea-execution-v0.2/sdd-v2.md` was rewritten shorter); those stay flagged for re-confirmation.
- **B3, calibration:** `sdk-holding calibration` joins VOF, Owner ratings, kills and disagreements, and shows agent-confident bets rated flat by humans. Read-only.
- **B4, `sdk-doc inbox`:** decision cards from existing primitives, with dissent first, a cited boundary on every card, at most 5 cards, and a provenance-stamped answer with a required reason. The verifier found a reason could forge the "answered" marker; it was fixed and re-verified.
- **B5, irreversible decision package (prepared, not decided):** `surfaces/SURFACE-20261115-brain-identity-storage-001.md` is **blocked** on a CISO no-go (with CFO, Mario and CLO concerns), with a "Decision for the Owner" section. The Owner was notified via a Bus BLOCKER, and an improvement signal was emitted. The four verification blocks were written by one agent reasoning from each role file, not by separate verifier sessions; that is disclosed in the surface.
- **Integration:** two new suites added to npm test; calibration capabilities merged; protocol §16.1 gains `claimStaleCommits` and `inboxMaxCards`; `.team-sdk/` is gitignored; refactor-watch decisions recorded for `inbox.js` (split next iteration), `ops.js` and `health.js` (defer, behaviour pinned).
**Totals:** behaviour coverage 224 of 234 (96%); holding 1302 assertions, memory 246.
