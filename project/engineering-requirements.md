# Engineering Requirements -- sdk-v3
**Owners:** CTO · Mario (Chief Engineer) · Staff Engineer · EM
**Last updated:** 2026-04-06
**Release:** v2026.Q2.1

> Technical requirements, architectural decisions, interface contracts, and delivery tracking. CTO owns the architecture section. Mario owns the review section. Staff Engineer owns interface contracts. EM owns delivery.

---

## Architecture (CTO)

### Pending
- [ ] Architecture brief — full system design for sdk-v3 new scripts, GitHub integration module, and doc-check system
- [ ] Make/buy matrix — specifically: GitHub API client (@octokit/rest vs gh CLI subprocess vs raw fetch), keychain integration for token storage, config file format
- [ ] Dependency audit — propose new deps, justify each one against "no new runtime deps unless clearly justified" constraint
- [ ] Team sizing recommendation — bootstrapped project, owner + AI agents only; what does a realistic sprint structure look like?

### In Progress

### Done
- [x] Runtime constraint confirmed: Node.js >=18, no new runtime deps without justification (history.md 2026-04-06)
- [x] Scope boundary confirmed: CLI + file system only. No SaaS layer. (history.md 2026-04-06)
- [x] GitHub-only VCS in v3: GitLab/Bitbucket deferred (history.md 2026-04-06)
- [x] No AI inference in scripts: scripts remain deterministic; agents are the intelligent layer (history.md 2026-04-06)

### Blocked
- [ ] GitHub integration architecture: blocked on CISO GitHub auth model decision. CTO cannot finalize token handling design until PAT vs GitHub App decision is made.

---

## Architectural Review (Mario — Chief Engineer)

### Pending
- [ ] GitHub integration design review — token handling and storage is an irreversible structural decision. Must pass Mario before Sprint 1.
- [ ] Documentation gate mechanism review — the enforcement model (advisory vs. blocking) must be architecturally sound. A brittle gate-check will be circumvented.
- [ ] Script interface contracts review — new owner-facing CLI commands (sdk-status, sdk-ship, sdk-next) must maintain backward compatibility with existing sdk-doc, sdk-gate-check patterns

### In Progress

### Done

### Blocked

---

## Interface Contracts (Staff Engineer)

### Pending
- [ ] GitHub module interface — define the contract for the GitHub integration layer: what it accepts, what it returns, how it handles auth errors, rate limits, and missing permissions gracefully
- [ ] Doc-check module interface — define the contract for documentation validation: file path, section name, threshold config, return format (list of failures with remediation hints)
- [ ] Settings schema — .claude/settings.json schema must be versioned. v3 adds: `github.repo`, `github.authMethod`, `docCheck.mode` (advisory|blocking). Define migration path from v2 settings.
- [ ] New scripts input/output contracts — sdk-status, sdk-ship, sdk-version, sdk-next: each must have a defined stdin/stdout contract (for future piping and automation)

### In Progress

### Done
- [x] Existing script contracts: sdk-doc, sdk-gate-check, sdk-init, sdk-bootstrap, sdk-update — stable, no changes planned in v3

### Blocked

---

## Delivery (EM)
**EM:** Lena Tbilisi (M1) — activated 2026-04-06

### Sprint Definition
In this bootstrapped project (owner + AI agents, no human engineers) a **sprint** = one session of focused execution. Each AI agent is activated per ticket. A sprint closes when its tickets reach Done or are formally deferred. Appetite estimates use session units: S = 1 session, M = 2 sessions, L = 4 sessions, XL = 6 sessions.

---

### Pod Map — v2026.Q2.1

```
POD MAP: v2026.Q2.1
Date: 2026-04-06
EM: Lena Tbilisi (M1)

Mission Pod — FOUNDATION-A: context-manifest
  PM: Isabella (PM, L4)
  Designer: none
  Engineers: one AI IC agent (spawned per ticket)
  Guardian: Ravi Colombo (Chief Engineer, L5) — schema lock + Decision 5 conditions
  Mission: Build the context-manifest.json generator and schema so every agent can
           orient itself at activation without reading raw log files.
  Appetite: S (1 session) | Started: pending Sprint 1 start | Remaining: S
  Current sprint goal: Ship manifest generator + locked schema including schemaVersion
                       field; confirm CTO Decision 5 Condition 1 in history.md before
                       consumers written.
  Special condition: CTO must log schemaVersion confirmation to history.md before
                     consumer scripts are written. EM will block consumer tickets
                     until that entry exists.

Mission Pod — STANDALONE-B: doc-spawn-dissolve
  PM: Isabella (PM, L4)
  Designer: none
  Engineers: one AI IC agent (spawned per ticket)
  Guardian: Ravi Colombo (Chief Engineer, L5) — protocol coherence
  Mission: Document the pod lifecycle (spawn, active, dissolve) in protocol.md and
           surface pod state in the kanban board so pod transitions never drop context.
  Appetite: S (1 session) | Started: pending Sprint 1 start | Remaining: S
  Current sprint goal: Protocol.md pod lifecycle section written; EM role file updated
                       with pod-close checklist; sdk-doc commands documented.
  Note: Zero dependencies — parallel-eligible from Sprint 1 day one.

EM manages: Pod FOUNDATION-A + Pod STANDALONE-B (max 2 active per EM — at capacity for Sprint 1)

Pods waiting (not yet active):
  - mario-gate-script: depends on context-manifest completion
  - validate-script: depends on context-manifest + mario-gate-script
  - next-activation-handoff: depends on coordinator-owns-session-close (PM hold)
  - coordinator-owns-session-close: PM HOLD — pending CEO+Coordinator enforcement decision
  - gate-check-hardening: depends on validate-script
  - git-release: standalone, Track B — queued after Foundation pods close
  - gate-check-ci: depends on gate-check-hardening, Track C
```

---

### Critical Path — v2026.Q2.1

```
CRITICAL PATH: v2026.Q2.1
Date: 2026-04-06
EM: Lena Tbilisi (M1)

TRACK FOUNDATION (longest chain — must complete before Tracks A/B can start):
  1. [CTO confirmation] schemaVersion field logged to history.md — no dependencies — XS (pre-Sprint gate)
  2. context-manifest — depends on CTO confirmation — S
  3. mario-gate-script — depends on context-manifest — S
  4. validate-script — depends on context-manifest + mario-gate-script — M
     └── gate-check-hardening — depends on validate-script — S-M
         └── gate-check-ci — depends on gate-check-hardening — S [Track C]

TRACK A (parallel from Foundation complete):
  5. coordinator-owns-session-close — PM HOLD (CEO+Coordinator enforcement decision)
     └── next-activation-handoff — depends on coordinator-owns-session-close — S-M

TRACK B (parallel from Foundation complete):
  6. git-release — standalone, no dependencies — L

STANDALONE (parallel from Sprint 1 day one):
  7. doc-spawn-dissolve — no dependencies — S

Critical path (longest chain):
  schemaVersion confirmation → context-manifest → mario-gate-script → validate-script →
  gate-check-hardening → gate-check-ci
  Total: ~5-6 sessions

Schedule slack:
  - doc-spawn-dissolve: fully parallel — no slack risk
  - git-release: no dependencies; can start any session — buffer exists
  - coordinator-owns-session-close: externally blocked by CEO+Coordinator decision;
    every session this stays open adds latency to next-activation-handoff
  - gate-check-hardening + gate-check-ci: sit at the end of the critical chain — no buffer

External dependencies:
| Dependency | Owner | Status | Risk if delayed |
|---|---|---|---|
| CTO confirms schemaVersion field to history.md | Tariq Bishkek (CTO) | PENDING — pre-Sprint gate | Blocks all context-manifest consumer tickets |
| CEO+Coordinator enforcement decision (technical vs social) | Amara Lagos (CEO) + Soren Aarhus (Coordinator) | OPEN | Blocks coordinator-owns-session-close → next-activation-handoff chain |
```

---

### Sprint 1 Scope

**What ships in Sprint 1:**
- context-manifest (Pod FOUNDATION-A) — generator script, locked schema with schemaVersion,
  agent role file update, fallback-to-current-status.md documented and tested
- doc-spawn-dissolve (Pod STANDALONE-B) — protocol.md pod lifecycle section, EM role file
  pod-close checklist, sdk-doc commands, kanban Pod Active column update, end-to-end example

**Pre-Sprint 1 gate (must clear before Sprint 1 opens):**
- CTO logs schemaVersion confirmation to history.md (Decision 5 Condition 1)

**What does NOT ship in Sprint 1:**
- mario-gate-script — queued Sprint 2 (depends on context-manifest)
- validate-script — queued Sprint 2-3 (depends on context-manifest + mario-gate-script)
- coordinator-owns-session-close — PM HOLD; cannot pod until enforcement decision logged
- next-activation-handoff — blocked by coordinator-owns-session-close
- gate-check-hardening — queued Sprint 3-4
- git-release — queued Sprint 2-3 (standalone but large Appetite: L)
- gate-check-ci — queued Sprint 4-5

**Appetite per session (AI-agent execution):**
- AI agents execute at high speed within a session but each ticket needs its own activation.
  Realistic throughput: 2-3 tickets per session if acceptance criteria are clear and dependencies
  are unblocked. A mission with 4-5 tickets = 2 sessions.
  Do not compress more than 3 missions into one session.

---

### Sprint 1 Tickets

**Pod: FOUNDATION-A — context-manifest**

---
```
TICKET: CM-01 — Lock context-manifest.json schema including schemaVersion field
Epic: v2026.Q2.1 / context-manifest
Owner: IC Engineer (spawned by EM)
Size: S

Description:
Define and document the context-manifest.json schema. Fields: manifestVersion (locked
"1.0"), activeReleaseId, currentPhase, activeMissions (array), lastAgentToWrite,
openBlockers (array). Add schemaVersion as required field per Mario gate Decision 5
Condition 1. Produce the schema as a JSON Schema file or equivalent typed contract.
This ticket is the prerequisite for all consumer scripts — nothing that reads
context-manifest.json may be written before this ticket merges.

Acceptance criteria:
- [ ] Schema file exists at a defined path in the repo (e.g., scripts/schema/context-manifest.schema.json)
- [ ] All fields are named, typed, and marked required or optional
- [ ] schemaVersion field present with value "1.0"
- [ ] Consumer versioning behavior documented: what a consumer does when it reads an unknown
      schemaVersion (fail loudly or degrade gracefully — decision logged)
- [ ] Schema reviewed by CTO and logged to history.md (Decision 5 Condition 1 fulfilled)

Dependencies:
- Blocked by: CTO schemaVersion confirmation (pre-Sprint gate) — must be logged to history.md first
- Blocks: CM-02, CM-03, CM-04, CM-05

Definition of done:
[x] Schema file written and passes JSON Schema validation
[x] Reviewed by Ravi Colombo (Chief Engineer) — Decision 4+5 co-review per Mario conditions
[x] CTO confirmation entry exists in history.md
[x] Merged to main
```

---
```
TICKET: CM-02 — Build context-manifest generator script
Epic: v2026.Q2.1 / context-manifest
Owner: IC Engineer (spawned by EM)
Size: M

Description:
Build the script that generates context-manifest.json at session open. The generator
reads current-status.md, history.md, and product-requirements.md to populate the
manifest fields. Output must be deterministic: identical inputs produce identical output.
The generator is the write path — it owns manifest creation. No other script may write
context-manifest.json directly.

Acceptance criteria:
- [ ] Running the generator twice with the same input files produces byte-identical output
- [ ] Generator correctly extracts: activeReleaseId, currentPhase, activeMissions,
      lastAgentToWrite, openBlockers
- [ ] All output fields conform to the locked schema from CM-01
- [ ] schemaVersion field always written as "1.0" in generated output
- [ ] Generator does not fail if optional source fields are absent — it omits or defaults
      them cleanly with no silent corruption

Dependencies:
- Blocked by: CM-01 (schema must be locked before generator is built)
- Blocks: CM-03, CM-05

Definition of done:
[x] Code written and passes local tests
[x] Unit tests cover: normal path, missing optional fields, and idempotency
[x] Reviewed by IC Senior or Ravi Colombo
[x] Merged to main
```

---
```
TICKET: CM-03 — Update agent role files to reference context-manifest as first read
Epic: v2026.Q2.1 / context-manifest
Owner: IC Engineer (spawned by EM)
Size: S

Description:
Update every agent role file to reference context-manifest.json as the first read
on activation. The update must be a single consistent instruction placed at the top
of each role file's activation sequence. No agent should read raw log files before
the manifest.

Acceptance criteria:
- [ ] All role files in roles/ that have an activation sequence reference context-manifest.json
      as first read
- [ ] The instruction is identical in wording across all files — no per-file variation
- [ ] The fallback instruction is present in every role file: "if context-manifest.json is
      absent, fall back to current-status.md"
- [ ] Reviewer can confirm changes are complete by grepping for the standard phrase across roles/

Dependencies:
- Blocked by: CM-01 (schema must exist before role files reference it)
- Blocks: none (can run in parallel with CM-02 after CM-01 is done)

Definition of done:
[x] All role files updated
[x] Grep check confirms no role file is missing the manifest reference
[x] Reviewed by EM (Lena Tbilisi) for completeness
[x] Merged to main
```

---
```
TICKET: CM-04 — Document and test fallback behavior (manifest absent → current-status.md)
Epic: v2026.Q2.1 / context-manifest
Owner: IC Engineer (spawned by EM)
Size: S

Description:
No agent should be blocked at activation if context-manifest.json is missing (e.g.,
first session on a new project). Document the fallback path and write a test that
confirms agents can activate cleanly when the manifest file does not exist.

Acceptance criteria:
- [ ] Fallback behavior is documented in a protocol section or the manifest generator README:
      when manifest is absent, agents read current-status.md directly
- [ ] A test case exists that verifies a simulated agent activation with no manifest file
      present does not throw an unhandled error
- [ ] The fallback path is the same for all agents — no per-agent variation

Dependencies:
- Blocked by: CM-01 (schema defines what "absent" means — missing file, not empty)
- Blocks: none

Definition of done:
[x] Fallback documented in a referenceable location
[x] Test written and passes
[x] Merged to main
```

---
```
TICKET: CM-05 — End-to-end: generate manifest → verify agent orientation
Epic: v2026.Q2.1 / context-manifest
Owner: IC Engineer (spawned by EM)
Size: S

Description:
End-to-end acceptance test: run the generator against the current project state,
inspect the output, and verify a simulated agent activation reads the manifest
and can answer "what is the active release, current phase, and next blocker?"
without reading any other file.

Acceptance criteria:
- [ ] Generator runs against project/ directory without error
- [ ] Output manifest passes schema validation (CM-01 schema)
- [ ] All required fields are populated with correct values from the project state
- [ ] A simulated read of the manifest produces: correct release ID (v2026.Q2.1),
      correct phase, correct open blocker list
- [ ] Mission acceptance criteria 3 confirmed: deterministic — running generator twice
      produces identical output

Dependencies:
- Blocked by: CM-02 (generator must exist), CM-03 (role files updated),
              CM-04 (fallback documented)
- Blocks: none — this is the gate ticket for context-manifest mission close

Definition of done:
[x] End-to-end test passes
[x] PM (Isabella) verifies acceptance criteria are met
[x] EM (Lena Tbilisi) confirms mission done — writes dissolution entry to engineering-log.md
[x] Merged to main
```

---

**Pod: STANDALONE-B — doc-spawn-dissolve**

---
```
TICKET: DS-01 — Write Pod Lifecycle section in protocol.md
Epic: v2026.Q2.1 / doc-spawn-dissolve
Owner: IC Engineer (spawned by EM)
Size: S

Description:
Add a Pod Lifecycle section to protocol.md that defines: spawn conditions (when does
a pod form?), active state definition (what is a pod doing while running?), dissolve
trigger (what event closes a pod?), and what the EM writes to engineering-log.md at
each transition. This section becomes the canonical reference for all future pod
management.

Acceptance criteria:
- [ ] protocol.md contains a "Pod Lifecycle" section with all four elements:
      spawn, active, dissolve, EM log entries
- [ ] The section names the exact EM engineering-log.md entry format for spawn and dissolve
- [ ] The section is referenced from the EM role file (link or note pointing to this section)
- [ ] A reviewer can confirm pod state is unambiguous: given any point in a project,
      there is a clear answer to "is this pod active or dissolved?"

Dependencies:
- Blocked by: none
- Blocks: DS-02, DS-03

Definition of done:
[x] Section written and internally consistent
[x] Reviewed by Ravi Colombo (Chief Engineer) for protocol coherence
[x] Merged to main
```

---
```
TICKET: DS-02 — Update EM role file with pod-close checklist
Epic: v2026.Q2.1 / doc-spawn-dissolve
Owner: IC Engineer (spawned by EM)
Size: S

Description:
Add a pod-close checklist to the EM role file (roles/em.md). Minimum items:
all tickets in Done or Deferred, area log (engineering-log.md) updated with
dissolution entry, product-requirements.md kanban updated, Coordinator notified
via Bus message. The checklist must reference the Pod Lifecycle section added in DS-01.

Acceptance criteria:
- [ ] EM role file contains a pod-close checklist with at minimum the four required items
- [ ] Checklist references the protocol.md Pod Lifecycle section by name
- [ ] A reviewer running through the checklist can confirm a pod is fully dissolved
      — no ambiguity
- [ ] The checklist is in the "Done Definition" or equivalent section of the EM role file

Dependencies:
- Blocked by: DS-01 (lifecycle section must exist before role file references it)
- Blocks: DS-03, DS-04

Definition of done:
[x] EM role file updated
[x] Reviewed by EM (Lena Tbilisi) for self-consistency
[x] Merged to main
```

---
```
TICKET: DS-03 — Document sdk-doc pod spawn and dissolve commands
Epic: v2026.Q2.1 / doc-spawn-dissolve
Owner: IC Engineer (spawned by EM)
Size: S

Description:
Define and document the CLI commands for logging a pod spawn and dissolve event via
sdk-doc (or equivalent). The event format must be defined (what fields are required
in a spawn entry vs a dissolve entry) and the CLI command must be documented in the
SDK's command reference. If sdk-doc does not yet support pod events, define the
command signature and add it to the pending implementation list.

Acceptance criteria:
- [ ] Pod spawn event format defined: fields include pod name, mission one-liner,
      appetite, EM name, date
- [ ] Pod dissolve event format defined: fields include pod name, tickets-closed count,
      tickets-deferred count, dissolution reason, date
- [ ] CLI command documented: exact syntax for logging each event type
- [ ] If not yet implemented in sdk-doc: a pending ticket is created in
      engineering-requirements.md and the command spec is documented for the implementing engineer

Dependencies:
- Blocked by: DS-01 (event format must align with lifecycle section definition)
- Blocks: DS-04

Definition of done:
[x] Event formats defined in a referenceable location
[x] CLI command documented (or pending ticket created with full spec)
[x] Reviewed by Tariq Bishkek (CTO) for doc.js interface consistency
[x] Merged to main
```

---
```
TICKET: DS-04 — Update kanban Pod Active column and write end-to-end example
Epic: v2026.Q2.1 / doc-spawn-dissolve
Owner: IC Engineer (spawned by EM)
Size: S

Description:
Update the kanban board in product-requirements.md so the "Pod Active" column shows
pod members and appetite remaining, not just the mission name. Write one end-to-end
example of a fictional pod spawn → execute → dissolve sequence in protocol.md or a
documentation file so future teams can follow the pattern.

Acceptance criteria:
- [ ] Kanban board "Pod Active" column definition updated to include: pod name, EM,
      appetite remaining
- [ ] End-to-end example exists covering: spawn (Bus message + log entry), execute
      (2-3 tickets), dissolve (checklist + log entry + Coordinator notification)
- [ ] The example is concrete enough that a future EM can follow it without additional explanation
- [ ] Mission acceptance criteria 5 met: example exists in protocol or documentation file

Dependencies:
- Blocked by: DS-02 (checklist must be defined before the example can reference it),
              DS-03 (commands must be documented before the example can use them)
- Blocks: none — this is the gate ticket for doc-spawn-dissolve mission close

Definition of done:
[x] Kanban column definition updated
[x] End-to-end example written
[x] PM (Isabella) verifies mission acceptance criteria 1-5 are all met
[x] EM (Lena Tbilisi) confirms mission done — writes dissolution entry to engineering-log.md
[x] Merged to main
```

---

### Pending
- [ ] mario-gate-script tickets — write after context-manifest ships
- [ ] validate-script tickets — write after context-manifest + mario-gate-script ship
- [ ] coordinator-owns-session-close tickets — blocked on PM hold; write after enforcement decision logged

### In Progress
- [x] Sprint 1 pod map and ticket list — written 2026-04-06 by Lena Tbilisi (EM)

### Done

### Blocked
- [ ] coordinator-owns-session-close pod: PM hold pending CEO+Coordinator enforcement model decision
- [ ] CTO Decision 5 Condition 1: schemaVersion confirmation must be logged to history.md before CM-01 ticket can close

---

## Open Technical Decisions

| Decision | Owner | Due | Reversible? |
|---|---|---|---|
| GitHub auth model: PAT vs GitHub App | CISO → CTO | Before Sprint 1 | No — changes token storage architecture |
| Token storage: .env vs keychain vs ~/.config | CTO after CISO decides | Before Sprint 1 | Partially — can migrate but breaking change for users |
| sdk-status output format: plain text vs structured (JSON flag) | PM + CTO | Sprint 0 | Yes |
| Documentation "filled" threshold: empty check vs content length vs section count | PM | Sprint 0 | Yes |
| GitHub issue auto-sync: on sdk-doc update vs explicit sdk-github sync | PM | Sprint 0 | Yes |
