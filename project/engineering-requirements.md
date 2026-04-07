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

### Pending
- [ ] Mission pod composition — bootstrapped: owner + AI agents. Define what a "sprint" means in this context (session-based? time-boxed? mission-complete?)
- [ ] Critical path: Mission 1 (doc enforcement) → Mission 3 (versioning) → Mission 4 (owner CLI) can run in parallel. Mission 2 (GitHub) blocked on CISO auth decision. Mission 5 (autoevolution) is ongoing.
- [ ] Sprint 0 gate — cannot start engineering until CISO auth model resolved and CTO architecture brief written

### In Progress

### Done

### Blocked
- [ ] Sprint 0 blocked: CISO GitHub auth decision pending, CTO architecture brief pending

---

## Open Technical Decisions

| Decision | Owner | Due | Reversible? |
|---|---|---|---|
| GitHub auth model: PAT vs GitHub App | CISO → CTO | Before Sprint 1 | No — changes token storage architecture |
| Token storage: .env vs keychain vs ~/.config | CTO after CISO decides | Before Sprint 1 | Partially — can migrate but breaking change for users |
| sdk-status output format: plain text vs structured (JSON flag) | PM + CTO | Sprint 0 | Yes |
| Documentation "filled" threshold: empty check vs content length vs section count | PM | Sprint 0 | Yes |
| GitHub issue auto-sync: on sdk-doc update vs explicit sdk-github sync | PM | Sprint 0 | Yes |
