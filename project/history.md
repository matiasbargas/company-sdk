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
