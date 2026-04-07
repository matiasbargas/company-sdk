# General Requirements -- sdk-v3
Last updated by: Coordinator
Release: v2026.Q2.1

> Aggregate view of all domain requirements. Coordinator updates this at the end of every sprint. Domain owners update their own files.

| Domain | File | Pending | In Progress | Done | Blocked | Last updated |
|---|---|---|---|---|---|---|
| Discovery (Legal + Security gate) | discovery-requirements.md | 6 | 0 | 2 | 1 | 2026-04-06 |
| Product | product-requirements.md | 18 | 0 | 3 | 1 | 2026-04-06 |
| Engineering (Architecture + Delivery) | engineering-requirements.md | 10 | 0 | 4 | 2 | 2026-04-06 |
| Design + Research | design-requirements.md | 0 | 0 | 0 | 0 | — |
| Business (Finance, Mktg, Rev, Data, Ops, People) | business-requirements.md | 11 | 0 | 8 | 0 | 2026-04-06 |
| Security | security-requirements.md | 8 | 0 | 7 | 0 | 2026-04-06 |

## Gate Status

| Gate | Condition | Status |
|---|---|---|
| CTO unlock | CLO Done + CISO Done in discovery-requirements.md | **Conditionally open** — CLO soft-clear (no hard blockers), CISO blocked on GitHub auth model decision |
| Sprint 0 | Engineering Architecture section Done + CTO brief written + Mario review complete | Blocked — awaiting CISO auth decision → CTO brief |
| Release seal | CEO validates project-map.md Section 11 | Blocked — not started |

## Open CEO Decisions
- [ ] GitHub auth model: PAT vs GitHub App — CISO must recommend, CTO must design to it, CEO confirms. Required before Sprint 1. Impact: determines entire token storage architecture.
- [ ] Enforcement UX final call: advisory-during-sprint + blocking-at-ship is the current model (logged history.md). PM and CTO must confirm this holds after Sprint 0 design. Escalate to CEO if they diverge.

## Active Blockers (cross-domain)
- **BLOCKER:** CISO GitHub auth model decision → blocks CTO architecture brief → blocks Sprint 0 gate → blocks all engineering. Owner: CISO. Escalation: CTO → CEO if unresolved within 48h of CISO activation.
