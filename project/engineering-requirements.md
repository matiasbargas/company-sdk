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
Date: 2026-04-07 (Sprint 2 re-map)
EM: Lena Tbilisi (M1)

--- SPRINT 1 COMPLETE ---
Dissolved pods:
  - FOUNDATION-A: context-manifest — DONE
  - STANDALONE-B: doc-spawn-dissolve — DONE
  - (coordinator-owns-session-close and mario-gate-script also shipped Sprint 1)

--- SPRINT 2 ACTIVE ---

Mission Pod — SPRINT2-A: validate-script
  PM: Isabella (PM, L4)
  Designer: none
  Engineers: one AI IC agent (spawned per ticket)
  Guardian: Ravi Colombo (Chief Engineer, L5) — gate-check interface coherence
  Mission: Build the validation script that checks project file health against SDK
           required structure so owners get actionable pre-flight errors before sdk-ship runs.
  Appetite: M (2 sessions) | Started: 2026-04-07 | Remaining: M
  Current sprint goal: Ship VS-01 (script skeleton + advisory mode) and VS-02 (placeholder
                       detection + actionable error messages). VS-03 (--strict flag + sdk-ship
                       integration) and VS-04 (config module for thresholds) in Sprint 3.
  Dependencies: context-manifest (DONE), mario-gate-script (DONE) — fully unblocked.
  Blocks: gate-check-hardening (cannot start until validate-script ships)

Mission Pod — SPRINT2-B: git-release
  PM: Isabella (PM, L4)
  Designer: none
  Engineers: one AI IC agent (spawned per ticket)
  Guardian: Ravi Colombo (Chief Engineer, L5) — git atomicity + rollback design
  Mission: Make release creation a single CLI command (sdk-ship) that produces a git tag,
           a GitHub release, and a history.md entry atomically without manual steps.
  Appetite: L (4 sessions total) | Started: 2026-04-07 | Remaining: S (1 session — GR-04 only)
  Note: GR-01 (git.js), GR-02 (release-notes.js), GR-03 (ship.js) all shipped 2026-04-07.
        GR-04 (integration test) also shipped 2026-04-07 (scripts/lib/test-ship.js, 11 tests).
  **STATUS: DONE — all 4 GR tickets complete. Pod SPRINT2-B dissolved.**
  Dependencies: None — standalone. GitHub auth model resolved (git-native, 2026-04-06).
  Blocks: nothing in the critical chain — parallel track

EM manages: Pod SPRINT2-A + Pod SPRINT2-B (at capacity — 2 active pods)

--- QUEUED (not yet active) ---
  - next-activation-handoff: UNBLOCKED (coordinator-owns-session-close DONE). Remaining
    scope: structured handoff block format in current-status.md + machine-parseability
    acceptance criteria. Appetite: S (1 session). Slots Sprint 3 as Pod SPRINT3-A when
    one of the Sprint 2 pods dissolves.
  - gate-check-hardening: blocked on validate-script. Slots Sprint 3-4 as Pod SPRINT3-B.
    Appetite: S-M.
  - gate-check-ci: blocked on gate-check-hardening. Slots Sprint 4-5. Appetite: S.
```

---

### Critical Path — v2026.Q2.1

```
CRITICAL PATH: v2026.Q2.1
Date: 2026-04-07 (updated Sprint 2 — Sprint 1 complete)
EM: Lena Tbilisi (M1)

COMPLETED (Sprint 1):
  ✓ context-manifest — DONE
  ✓ doc-spawn-dissolve — DONE
  ✓ coordinator-owns-session-close — DONE
  ✓ mario-gate-script — DONE

ACTIVE CHAIN (longest remaining chain — critical path):
  1. validate-script — unblocked, IN PROGRESS (Sprint 2) — M (2 sessions)
     └── gate-check-hardening — blocked on validate-script — S-M
         └── gate-check-ci — blocked on gate-check-hardening — S [Track C]

COMPLETED THIS SESSION:
  2. git-release (ALL 4 GR tickets) — DONE 2026-04-07
     GR-01: scripts/lib/git.js, GR-02: scripts/lib/release-notes.js
     GR-03: scripts/ship.js (sdk-ship bin), GR-04: scripts/lib/test-ship.js (11 tests)

QUEUED — UNBLOCKED:
  3. next-activation-handoff — depends on coordinator-owns-session-close (DONE)
     Remaining scope: handoff block format + machine-parseability — S
     Slots Sprint 3 as first pod when SPRINT2-A dissolves.

Critical path (longest remaining chain):
  validate-script → gate-check-hardening → gate-check-ci
  Total remaining: ~4 sessions

Schedule slack:
  - git-release: parallel track, no blocking dependencies downstream — buffer exists
  - next-activation-handoff: S remaining, queued Sprint 3 — no schedule pressure
  - gate-check-hardening + gate-check-ci: end of the critical chain — no buffer once
    validate-script ships; must pod immediately after validate-script closes

External dependencies:
| Dependency | Owner | Status | Risk if delayed |
|---|---|---|---|
| GitHub auth (git-native, PAT) | CISO + CTO | RESOLVED (2026-04-06) | No remaining risk |
| CEO+Coordinator enforcement model | Amara Lagos + Soren Aarhus | RESOLVED (2026-04-06) | No remaining risk |
```

---

### Sprint 1 — COMPLETE

**Shipped in Sprint 1:**
- context-manifest — generator script, locked schema with schemaVersion, agent role file
  update, fallback-to-current-status.md documented and tested
- doc-spawn-dissolve — protocol.md pod lifecycle section, EM role file pod-close checklist,
  sdk-doc commands, kanban Pod Active column update, end-to-end example
- coordinator-owns-session-close — session-close checklist in coordinator.md, Protocol
  Section 13 updated, enforcement model logged
- mario-gate-script — sdk-gate-check --mario enforces Mario sign-off in history.md

---

### Sprint 2 Scope

**What ships in Sprint 2:**
- validate-script (Pod SPRINT2-A) — VS-01 (script skeleton + advisory mode) + VS-02
  (placeholder detection + actionable error messages). First session of an M appetite.
- git-release ALL tickets (GR-01 through GR-04) — FULLY SHIPPED this session.
  sdk-ship bin, clean-tree guard, rollback, --dry-run, 11-test integration suite.

**What does NOT ship in Sprint 2:**
- validate-script VS-03 + VS-04 — held for Sprint 3 (second session of M appetite)
- next-activation-handoff — unblocked but queued Sprint 3; fits as Pod SPRINT3-A
- gate-check-hardening — queued Sprint 3-4; blocked on validate-script
- gate-check-ci — queued Sprint 4-5; blocked on gate-check-hardening

**Appetite per session (AI-agent execution):**
- AI agents execute at high speed within a session but each ticket needs its own activation.
  Realistic throughput: 2-3 tickets per session if acceptance criteria are clear and
  dependencies are unblocked. A mission with 4-5 tickets = 2 sessions.
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

**Pod: SPRINT2-A — validate-script**

---
```
TICKET: VS-01 — Build sdk-validate script skeleton with advisory mode
Epic: v2026.Q2.1 / validate-script
Owner: IC Engineer (spawned by EM, Pod SPRINT2-A)
Size: S

Description:
Build the entry point for sdk-validate. The script accepts a project directory path and
checks all five required project files: current-status.md, history.md,
product-requirements.md, engineering-requirements.md, general-requirements.md. In
advisory mode (default), it reports each missing file as a warning and exits 0. No
placeholder detection yet — that is VS-02. The goal of this ticket is a working,
testable skeleton with clean output formatting and a clear per-failure message structure.

Acceptance criteria:
- [ ] `node scripts/validate.js <project-dir>` runs without error on a valid project directory
- [ ] Missing required files each produce a distinct warning line: "WARN: <file> is missing —
      create it with sdk-doc init <file>"
- [ ] All five required files are checked
- [ ] Exit code is 0 in advisory mode regardless of warnings
- [ ] Script is importable as a module (exports a validate() function) for future sdk-ship integration
- [ ] At least one unit test confirms: missing file → warning line + exit 0

Dependencies:
- Blocked by: none
- Blocks: VS-02, VS-03

Definition of done:
[ ] Code written and passes local tests
[ ] Unit test covers missing-file path
[ ] Reviewed by Ravi Colombo (Chief Engineer) for interface consistency with existing sdk-* scripts
[ ] Merged to main
```

---
```
TICKET: VS-02 — Add placeholder detection and actionable error messages
Epic: v2026.Q2.1 / validate-script
Owner: IC Engineer (spawned by EM, Pod SPRINT2-A)
Size: S

Description:
Extend sdk-validate with placeholder detection: scan each required file for unfilled
`[PLACEHOLDER]` patterns and empty required sections. Every failure must produce a
specific, actionable message that names the file, the section, and the exact command
to fix it. Generic "validation failed" is not acceptable output. This ticket extends
VS-01 — do not rewrite the skeleton, extend it.

Acceptance criteria:
- [ ] Unfilled `[PLACEHOLDER]` tokens in any required file produce: "WARN: <file> section
      '<section>' has unfilled placeholder — run `sdk-doc append <file> --section '<section>'
      --content '...'"
- [ ] Empty required sections (defined by a constants module, not hardcoded) produce an
      equivalent specific message
- [ ] A constants module (or config file) defines the list of required sections per file —
      not hardcoded in the detection logic
- [ ] Acceptance criteria 2 from the mission brief met: every failure is a specific,
      actionable message — no generic errors
- [ ] Advisory mode still exits 0; all warnings are collected and printed at end of run

Dependencies:
- Blocked by: VS-01 (skeleton must exist before extension)
- Blocks: VS-03

Definition of done:
[ ] Code written and passes local tests
[ ] Unit test covers: placeholder found, empty section, clean file (no warnings)
[ ] Constants/config module exists for required sections list
[ ] Reviewed by Ravi Colombo (Chief Engineer)
[ ] Merged to main
```

---
```
TICKET: VS-03 — Add --strict flag and integrate into sdk-ship pre-flight
Epic: v2026.Q2.1 / validate-script
Owner: IC Engineer (spawned by EM, Pod SPRINT2-A)
Size: S
NOTE: Sprint 3 ticket — do not start until VS-01 and VS-02 are merged.

Description:
Add `--strict` flag to sdk-validate: in strict mode, any failure exits 1 instead of 0.
Integrate sdk-validate into the sdk-ship pre-flight sequence so it runs automatically
before the release gate. Both modes (advisory and strict) must be documented.

Acceptance criteria:
- [ ] `--strict` flag causes exit 1 on any failure; advisory mode (no flag) always exits 0
- [ ] sdk-ship (or sdk-gate-check) calls sdk-validate as a pre-flight step before proceeding
- [ ] Acceptance criteria 3 from the mission brief met: both modes documented with expected
      behavior and exit codes
- [ ] Acceptance criteria 4 from the mission brief met: script integrated into sdk-ship
      pre-flight sequence

Dependencies:
- Blocked by: VS-02
- Blocks: VS-04

Definition of done:
[ ] --strict flag implemented and tested (exit 0 and exit 1 paths)
[ ] sdk-ship integration added and tested end-to-end
[ ] Documentation updated
[ ] Reviewed by Ravi Colombo (Chief Engineer)
[ ] Merged to main
```

---
```
TICKET: VS-04 — Config module for "minimum viable documentation" thresholds
Epic: v2026.Q2.1 / validate-script
Owner: IC Engineer (spawned by EM, Pod SPRINT2-A)
Size: S
NOTE: Sprint 3 ticket — do not start until VS-03 is merged.

Description:
Extract all hardcoded threshold definitions (required sections per file, placeholder
patterns, required file list) into a single config module or constants file. This is
the gate ticket for the validate-script mission — it ensures the thresholds are
configurable, not scattered across the implementation.

Acceptance criteria:
- [ ] A single config module (e.g., scripts/lib/validate-config.js) defines: required files,
      required sections per file, placeholder pattern(s)
- [ ] Acceptance criteria 5 from the mission brief met: "minimum viable documentation"
      threshold is defined in a config, not hardcoded across multiple places
- [ ] The constants module from VS-02 is consolidated into this config module (no duplication)
- [ ] VS-01 through VS-03 implementation points to this module — no threshold values live
      in the detection logic

Dependencies:
- Blocked by: VS-03
- Blocks: none — this is the gate ticket for validate-script mission close

Definition of done:
[ ] Config module written
[ ] All prior validate-script code updated to reference the config module
[ ] PM (Isabella) verifies all 5 mission acceptance criteria are met
[ ] EM (Lena Tbilisi) confirms mission done — writes dissolution entry to engineering-log.md
[ ] Merged to main
```

---

**Pod: SPRINT2-B — git-release (GR-03 + GR-04)**

*Foundation: GR-01 (scripts/lib/git.js) and GR-02 (scripts/lib/release-notes.js) already shipped.*

---
```
TICKET: GR-03 — Build sdk-ship command: atomic tag + push + GitHub release
Epic: v2026.Q2.1 / git-release
Owner: IC Engineer (spawned by EM, Pod SPRINT2-B)
Size: M

Description:
Build the sdk-ship command that wires together GR-01 (git.js) and GR-02
(release-notes.js) into one atomic operation: (1) validate clean working tree,
(2) create git tag from current release ID in settings.json, (3) push tag to remote,
(4) create GitHub release using release notes from history.md latest entry. If any
step fails, roll back cleanly — no partial tag, no partial release. The failure message
must name exactly what happened and what to retry.

Acceptance criteria:
- [ ] `sdk-ship` requires a clean git working tree — fails with an explicit message if
      uncommitted changes are present (acceptance criteria 4 from mission brief)
- [ ] Git tag is created using release ID format vYYYY.QQ.N from settings.json
- [ ] Tag is pushed to remote; GitHub release is created with auto-generated release notes
      from history.md latest entry — formatted as GitHub-flavored markdown
- [ ] If any step fails: tag creation attempted → push fails → tag is deleted locally;
      no partial state is left (acceptance criteria 2 from mission brief)
- [ ] Failure message names: which step failed, what was left in what state, and what
      command to retry
- [ ] Git-native only: no gh-sync.js, no gh-close.js (acceptance criteria 5 confirmed)

Dependencies:
- Blocked by: GR-01 (git.js — already shipped), GR-02 (release-notes.js — already shipped)
- Blocks: GR-04

Definition of done:
[ ] Code written and passes local tests
[ ] Rollback path tested: network failure after tag creation → local tag deleted
[ ] Reviewed by Ravi Colombo (Chief Engineer) for atomicity design
[ ] Merged to main
```

---
```
TICKET: GR-04 — Integration test: sdk-ship end-to-end in a test repo
Epic: v2026.Q2.1 / git-release
Owner: IC Engineer (spawned by EM, Pod SPRINT2-B)
Size: S
NOTE: Sprint 3 ticket — do not start until GR-03 is merged.

Description:
Write an integration test that runs sdk-ship against a test git repository (can be
a temporary local repo created in the test setup). The test confirms: clean-tree check,
tag creation, rollback on simulated network failure, and release notes content. This is
the gate ticket for the git-release mission.

Acceptance criteria:
- [ ] Integration test creates a temporary git repo, seeds it with a settings.json and
      a history.md entry, and runs sdk-ship
- [ ] Test asserts: tag created with correct name, release notes contain content from
      history.md latest entry
- [ ] Rollback path tested: test simulates a push failure and confirms no tag remains
      locally after rollback
- [ ] Test runs without network access (GitHub release creation stubbed/mocked)
- [ ] Acceptance criteria 1 and 2 from the mission brief confirmed by this test

Dependencies:
- Blocked by: GR-03
- Blocks: none — gate ticket for git-release mission close

Definition of done:
[ ] Integration test written and passes
[ ] Rollback path confirmed by test
[ ] PM (Isabella) verifies all 5 mission acceptance criteria are met
[ ] EM (Lena Tbilisi) confirms mission done — writes dissolution entry to engineering-log.md
[ ] Merged to main
```

---

### Pending
- [ ] next-activation-handoff tickets — write at Sprint 3 pod activation (S appetite remaining)
- [ ] gate-check-hardening tickets — write after validate-script ships
- [ ] gate-check-ci tickets — write after gate-check-hardening ships

### In Progress
- [ ] validate-script (VS-01, VS-02) — Pod SPRINT2-A | IC agent to be spawned | Sprint 2
- [ ] git-release GR-03 — Pod SPRINT2-B | IC agent to be spawned | Sprint 2

### Done
- [x] Sprint 2 pod map and tickets — written 2026-04-07 by Lena Tbilisi (EM)
- [x] Sprint 1 pod map and ticket list — written 2026-04-06 by Lena Tbilisi (EM)
- [x] context-manifest — SHIPPED (Sprint 1)
- [x] doc-spawn-dissolve — SHIPPED (Sprint 1)
- [x] coordinator-owns-session-close — SHIPPED (Sprint 1)
- [x] mario-gate-script — SHIPPED (Sprint 1)

### Blocked
(none — all Sprint 2 pods are unblocked)

---

## Open Technical Decisions

| Decision | Owner | Due | Reversible? |
|---|---|---|---|
| GitHub auth model: PAT vs GitHub App | CISO → CTO | Before Sprint 1 | No — changes token storage architecture |
| Token storage: .env vs keychain vs ~/.config | CTO after CISO decides | Before Sprint 1 | Partially — can migrate but breaking change for users |
| sdk-status output format: plain text vs structured (JSON flag) | PM + CTO | Sprint 0 | Yes |
| Documentation "filled" threshold: empty check vs content length vs section count | PM | Sprint 0 | Yes |
| GitHub issue auto-sync: on sdk-doc update vs explicit sdk-github sync | PM | Sprint 0 | Yes |
