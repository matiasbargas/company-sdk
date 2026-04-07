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

## Notes

**The autocatalytic transposition lens (from strategy-log.md 2026-04-06):**
Product decisions should always be filtered through: does this trigger a new self-reinforcing cycle in the team's operating rhythm, or does it just add a feature to something teams already don't use?

Each mission above was chosen because it removes a specific friction point that prevents catalysis:
- Mission 1 removes the "documentation is optional" cycle
- Mission 2 removes the "GitHub and the SDK are parallel worlds" cycle
- Mission 3 removes the "versioning is a convention nobody remembers" cycle
- Mission 4 removes the "only engineers can operate the system" cycle
- Mission 5 removes the "every session starts with 'where were we?'" cycle
