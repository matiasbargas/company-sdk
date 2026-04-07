# Product Requirements -- sdk-v3
**Domain owner:** Isabella (PM)
**Last updated:** 2026-04-06
**Release:** v2026.Q2.1

---

## Mission 1 — Documentation Enforcement System
*Make documentation mandatory without making it punishing.*

### Pending
- [ ] Design advisory-mode doc checks: `sdk-doc-check .` warns on missing/empty required sections but does not block work mid-sprint
- [ ] Design blocking-mode doc checks: `sdk-ship` cannot proceed if required files (history.md, current-status.md, project-map.md Section 11) have unfilled placeholders
- [ ] Define "minimum viable documentation" threshold per file — what counts as "filled" vs placeholder
- [ ] Define which files are required vs. recommended per squad type (startup vs. feature vs. website)
- [ ] UX: warning messages must name the specific gap and tell the user exactly how to fix it ("history.md has no entries — run `sdk-doc decision history.md --decision ...`")

### In Progress

### Done
- [x] Gate model decided: advisory during sprint, blocking only at `sdk-ship` (release close). Logged in history.md 2026-04-06.

### Blocked

---

## Mission 2 — GitHub Native Integration
*Issues ↔ missions. PRs ↔ tickets. Releases ↔ history.md.*

### Pending
- [ ] `sdk-github link` — link a project to a GitHub repo (stores repo ref in .claude/settings.json)
- [ ] `sdk-github sync-issues` — create GitHub issues from product-requirements.md pending items; label by domain; milestone = release ID
- [ ] `sdk-github close-issue` — close issue when requirement moves to Done in requirements file
- [ ] `sdk-github release` — create GitHub release from history.md latest entry; auto-generate release notes from decisions + what shipped
- [ ] PR ↔ ticket linking — convention: PR title includes ticket ID; `sdk-doc` can parse and cross-reference
- [ ] Decide: does the SDK create issues automatically on `sdk-doc` updates, or only on explicit `sdk-github sync` command? (PM decision — affects UX significantly)

### In Progress

### Done

### Blocked
- [ ] GitHub auth model not yet decided (CISO pending). Cannot finalize GitHub integration scope until token model is confirmed.

---

## Mission 3 — Versioning CLI
*Version bumping is a command, not a convention people forget.*

### Pending
- [ ] `sdk-version` — print current release ID from .claude/settings.json
- [ ] `sdk-version bump [patch|minor|major]` — increment version, update settings.json, log to history.md
- [ ] `sdk-version set v2026.Q3.1` — manually set version (for cross-quarter resets)
- [ ] Auto-reset increment on quarter change (Q2 → Q3 resets .N to 1)
- [ ] Git tag created on `sdk-version bump` (optional, ask user)

### In Progress

### Done
- [x] Version format defined: v[YEAR].Q[QUARTER].[INCREMENT] — documented in protocol.md Section 3

### Blocked

---

## Mission 4 — Owner-Facing CLI
*Founders and PMs should be able to run their operating system without engineering help.*

### Pending
- [ ] `sdk-status` — human-readable project status: active missions, waiting on, open decisions, next agent. Reads current-status.md + formats it cleanly. Target: Maya opens terminal Monday morning, types one command, knows exactly where her project is.
- [ ] `sdk-ship` — guided release-close flow: runs doc-check → validates project-map.md → creates GitHub release → updates current-status.md → prints next-cycle checklist. Blocks if doc gates fail.
- [ ] `sdk-retro` — prompts for retrospective inputs (what worked, what slowed, what to change), writes to strategy-log.md in correct format
- [ ] `sdk-next` — "what should I do right now?" reads current-status.md, history.md, general-requirements.md and prints the highest-priority next action with the exact command to run
- [ ] Onboarding flow: after `sdk-init`, user is guided through completing idea.md Section 4 step by step — not just told "fill this in"
- [ ] All owner commands output in plain English, not CLI jargon. No JSON. No raw markdown.

### In Progress

### Done

### Blocked

---

## Mission 5 — Autoevolution: The Last Picture
*Every project always has a complete, current picture. No session starts blind.*

### Pending
- [ ] `current-status.md` auto-update hooks: define when and how agents are expected to update this file (end of every session, not batched)
- [ ] `sdk-doc health` — check if current-status.md was updated in the last N hours; warn if stale
- [ ] Onboarding path for new contributors: `sdk-status` + `history.md` should be sufficient to understand context without Slack. Define what "sufficient" means and validate it.
- [ ] Session resume prompt: `sdk-status` output should end with "To resume, say: [specific activation phrase for next agent]"

### In Progress

### Done
- [x] current-status.md seeded for sdk-v3 project with active state

### Blocked

---

## Mission Pipeline — v2026.Q2.1 Sprint Missions
**Shaped by:** Isabella (PM, L4)
**Date shaped:** 2026-04-06
**Source:** Mario (Ravi Colombo) gap analysis — 9 mission cards from autonomy layer review
**Release:** v2026.Q2.1

> Sprint slots follow CTO (Tariq Bishkek) sequencing: Foundation → Track A → Track B → Track C.
> Foundation missions must complete before their dependents can start. Tracks A/B/C can parallelize within their layer.

---

### Kanban Board

| Shaping | Appetized | Pod Active | In Review | Done |
|---------|-----------|------------|-----------|------|
| — | coordinator-owns-session-close, mario-gate-script, next-activation-handoff, validate-script, gate-check-hardening, git-release, gate-check-ci | — | — | context-manifest, doc-spawn-dissolve |

---

### MISSION BRIEF: context-manifest

**One-line description:** Give every agent a machine-readable session context file so it can orient itself without reading the entire project history.

**User story:**
As an agent activating mid-project, I want to load a structured context manifest so that I can start contributing immediately without reading every log file.

**Acceptance criteria:**
1. `context-manifest.json` (or equivalent structured file) is generated at session open and contains: active release ID, current phase, active missions, last-agent-to-write, and open blockers.
2. Every agent role file references the manifest as the first read on activation — no agent reads raw log files before the manifest.
3. The manifest is deterministically reproducible: running the generation command twice produces identical output given the same input files.
4. The manifest format is versioned (a `manifestVersion` field) so future schema changes are detectable.
5. No agent is blocked at activation if the manifest is missing — fallback to current-status.md read is documented and tested.

**Appetite:** S (one sprint)
**Dependencies:** None — standalone
**Sprint slot:** Foundation (CRITICAL PATH)
**Priority:** CRITICAL PATH

---

### MISSION BRIEF: coordinator-owns-session-close

**One-line description:** Enforce that only the Coordinator writes the canonical current-status.md block at session close, preventing stale or conflicting status entries.

**User story:**
As a team member resuming a project session, I want current-status.md to reflect a single authoritative write by the Coordinator so that I always know I am reading the true project state.

**Acceptance criteria:**
1. `doc.js` (or equivalent CLI) logs a visible warning when a non-Coordinator role writes to the canonical block of current-status.md.
2. The enforcement model chosen (social convention + PR checklist vs. technical `--role` flag) is documented in protocol.md and logged in history.md before this mission ships.
3. Coordinator role file contains an explicit session-close checklist that is testable — a reviewer can confirm the close happened correctly.
4. Protocol Section 13 is updated to name Coordinator as sole write authority for the canonical block with the exact trigger condition ("session close").
5. At least one documented failure scenario exists: what happens if the Coordinator is not activated before session ends, and the fallback path is explicit.

**Appetite:** S (one sprint)
**Dependencies:** CEO + Coordinator alignment on enforcement model (decision pending — logged in current-status.md open decisions)
**Sprint slot:** Foundation (CRITICAL PATH)
**Priority:** CRITICAL PATH

**PM flag:** The open decision on technical vs. social enforcement must be closed before this mission enters a pod. I am not blocking the shaping, but I will block pod formation until that decision is logged. The enforcement model shapes the entire acceptance surface.

---

### MISSION BRIEF: mario-gate-script

**One-line description:** Make Mario's irreversible-decision review a CLI-enforced gate, not a social convention — the gate cannot be bypassed by omission.

**User story:**
As a project lead, I want `sdk-gate-check` (or a dedicated Mario gate script) to block Sprint 1 start unless Mario's sign-off on irreversible decisions is logged, so that the team cannot accidentally skip the architectural safety review.

**Acceptance criteria:**
1. A `mario-gate` check is added to the gate-check suite: it reads history.md (or a dedicated sign-off file) for Mario's explicit sign-off entry and fails with a specific error message if absent.
2. The check names the exact missing decisions — not a generic "Mario gate failed" — so the user knows what to resolve.
3. Mario's sign-off entry format is defined and documented (fields: decision-id, reviewed-by, verdict, date, notes).
4. The gate integrates cleanly with the existing `sdk-gate-check` CLI — no new top-level command required unless the CTO explicitly decides otherwise.
5. The check passes with exit code 0 when all flagged irreversible decisions have a logged Mario sign-off entry.

**Appetite:** S (one sprint)
**Dependencies:** context-manifest must be complete first (gate script reads manifest for active decision list)
**Sprint slot:** Foundation (CRITICAL PATH)
**Priority:** CRITICAL PATH

---

### MISSION BRIEF: next-activation-handoff

**One-line description:** Produce a structured "next agent" handoff at session close so the resuming team member gets the exact activation phrase, not a vague pointer.

**User story:**
As an owner resuming a project after a break, I want current-status.md to end with a ready-to-paste activation phrase for the next agent so that I do not have to reconstruct context before I can make progress.

**Acceptance criteria:**
1. The Coordinator's session-close write to current-status.md includes a "Next Action" block with: agent role, activation phrase (copy-paste ready), and the specific context that agent needs to read first.
2. The activation phrase format is standardized across all agents — tested against at minimum Greg, CTO, PM, Mario, and EM activation patterns.
3. `sdk-status` CLI output includes the "Next Action" block as the last printed section — it is the action the user sees when they open the terminal.
4. If no next agent is determined (e.g., project is in a wait state), the block says so explicitly and names what must happen before the next activation.
5. The handoff block is machine-parseable (structured subsection, not free prose) so future tooling can extract it.

**Appetite:** S-M (one to two sprints)
**Dependencies:** coordinator-owns-session-close must be complete first
**Sprint slot:** Track A (HIGH)
**Priority:** HIGH

---

### MISSION BRIEF: doc-spawn-dissolve

**One-line description:** Document the pod lifecycle — spawn, active, dissolve — so agents and owners know exactly when a pod starts, what it does, and how it closes.

**User story:**
As an Engineering Manager activating a mission pod, I want a documented and CLI-reflected spawn-and-dissolve lifecycle so that pod state is never ambiguous and handoffs between pods do not drop context.

**Acceptance criteria:**
1. Protocol.md gains a Pod Lifecycle section defining: spawn conditions, active state definition, dissolve trigger, and what the EM writes to the engineering log at each transition.
2. The EM role file references the lifecycle section and includes a pod-close checklist (minimum: all tickets in Done or Deferred, area log updated, product-log.md updated, Coordinator notified).
3. `sdk-doc` (or equivalent) can log a pod spawn and dissolve event — the event format is defined and the CLI command is documented.
4. The kanban board in product-requirements.md reflects pod state — "Pod Active" column shows the pod members and appetite remaining, not just the mission name.
5. At least one end-to-end example (a fictional pod spawn → execute → dissolve sequence) exists in the protocol or a documentation file so future teams can follow the pattern.

**Appetite:** S (one sprint)
**Dependencies:** None — standalone
**Sprint slot:** Track A (HIGH)
**Priority:** HIGH

---

### MISSION BRIEF: validate-script

**One-line description:** Build a validation script that checks project file health against the SDK's required structure before any gate or release command runs.

**User story:**
As an owner running `sdk-ship`, I want a pre-flight validation script to catch missing sections, unfilled placeholders, and broken file references before the release gate blocks me, so that I can fix issues early rather than at the last minute.

**Acceptance criteria:**
1. `sdk-validate` (or equivalent) checks all required project files: current-status.md, history.md, product-requirements.md, engineering-requirements.md, general-requirements.md — reporting missing files, empty required sections, and unfilled `[PLACEHOLDER]` patterns.
2. Output format: each failure is a specific, actionable message ("history.md has no entries — run `sdk-doc decision history.md --decision ...`") — never a generic "validation failed."
3. The script runs in advisory mode by default (warnings, exit 0) and in blocking mode with `--strict` flag (exit 1 on any failure) — both modes are documented.
4. The script is integrated into the `sdk-ship` pre-flight sequence — it runs automatically before the release gate.
5. The "minimum viable documentation" threshold (what counts as "filled" vs. placeholder) is defined in a config file or constants module, not hardcoded across multiple places.

**Appetite:** M (two sprints)
**Dependencies:** context-manifest (reads manifest for file list) + mario-gate-script (must not conflict with existing gate-check patterns)
**Sprint slot:** Track A (HIGH)
**Priority:** HIGH

---

### MISSION BRIEF: gate-check-hardening

**One-line description:** Harden the existing `sdk-gate-check` so it is robust, non-bypassable, and produces actionable output — not just a pass/fail signal.

**User story:**
As a project lead running the gate check, I want each failing gate item to tell me exactly what is wrong and how to fix it so that I spend my time resolving issues, not diagnosing the checker.

**Acceptance criteria:**
1. Every gate-check item produces a specific failure message with: what was checked, what was found, what the expected state is, and the exact command or action to remediate.
2. Gate-check results are machine-parseable (structured output with `--json` flag) so future CI integration can consume them without screen-scraping.
3. No gate item silently passes when its input file is missing — a missing file is always a gate failure, never a skip.
4. The gate-check suite is configurable per squad type (startup vs. mvp vs. feature): required checks are defined in a config, not hardcoded in the script body.
5. Gate-check run time is under 5 seconds on a typical project directory (no file-system blocking calls without timeouts).

**Appetite:** S-M (one to two sprints)
**Dependencies:** validate-script must be complete first (gate-check-hardening extends the validate-script output contract)
**Sprint slot:** Track B (HIGH)
**Priority:** HIGH

---

### MISSION BRIEF: git-release

**One-line description:** Make release creation a single CLI command that produces a git tag, a GitHub release, and a history.md entry — atomically and without manual steps.

**User story:**
As an owner closing a release, I want `sdk-ship` to create the git tag, push the GitHub release, and update history.md in one command so that releases are consistent and no step is forgotten under pressure.

**Acceptance criteria:**
1. `sdk-ship` (or a `sdk-release` sub-command) creates a git tag using the release ID format (vYYYY.QQ.N), pushes it to the remote, and creates a GitHub release with auto-generated release notes from history.md latest entry — all in one atomic operation.
2. If any step fails (network error, auth failure, dirty working tree), the command rolls back cleanly: no partial tag, no partial release. The failure message tells the user exactly what happened and what to retry.
3. Release notes are sourced from history.md — the script parses the latest release entry and formats it as GitHub-flavored markdown. No manual copy-paste.
4. The command requires a clean git working tree before proceeding — it fails with an explicit message if uncommitted changes are present.
5. Git-native only: no gh-sync.js, no gh-close.js, no GitHub API calls beyond the release creation endpoint. Scope confirmed by CEO (Amara Lagos, 2026-04-06).

**Appetite:** L (four sprints — was scoped down from gh-sync; now git-native only)
**Dependencies:** None — standalone (GitHub auth model resolved: git-native confirmed, CISO gate cleared)
**Sprint slot:** Track B (HIGH)
**Priority:** HIGH — blocked on CEO+CISO resolution, which is already resolved (git-native confirmed 2026-04-06)

---

### MISSION BRIEF: gate-check-ci

**One-line description:** Run the gate-check suite in CI so that no merge to main passes a project with broken gates — enforcement moves from optional to structural.

**User story:**
As a team member merging a pull request, I want CI to run the gate-check suite automatically so that gate violations are caught before they reach the main branch, not after.

**Acceptance criteria:**
1. A GitHub Actions workflow (`.github/workflows/gate-check.yml`) runs `sdk-gate-check --strict` on every PR targeting main — pass/fail is visible in the PR checks before merge.
2. The workflow runs only on project directories (not SDK source files) — the path filter is explicit and documented.
3. Gate failures in CI produce the same actionable messages as local runs — no difference in output format between local and CI execution.
4. The workflow file is templated: it works for any project bootstrapped with `sdk-init` without modification, pulling config from `.claude/settings.json`.
5. The workflow completes in under 60 seconds on a standard GitHub Actions runner — no external service calls, no install steps beyond `node --version` check.

**Appetite:** S (one sprint)
**Dependencies:** gate-check-hardening must be complete first (CI runs the hardened gate-check)
**Sprint slot:** Track C (MEDIUM)
**Priority:** MEDIUM

---

## Notes

**The autocatalytic transposition lens (from strategy-log.md 2026-04-06):**
Product decisions should always be filtered through: does this trigger a new self-reinforcing cycle in the team's operating rhythm, or does it just add a feature to something teams already don't use?

Each mission above was chosen because it removes a specific friction point that prevents catalysis:
- Mission 1 removes the "documentation is optional" cycle
- Mission 2 removes the "GitHub and the SDK are parallel worlds" cycle
- Mission 3 removes the "versioning is a convention nobody remembers" cycle
- Mission 4 removes the "only engineers can operate the system" cycle
- Mission 5 removes the "every session starts with 'where were we?'" cycle
