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
