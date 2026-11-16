# Bus Log

> Append-only record of all inter-agent communication. Do not edit — only append.

---
[2026-04-16 17:19] FROM: Owner → TO: ALL | PRIORITY: INFO | TAG: POD-KILL | RELEASE: v2026.Q2.1
POD KILLED: auth-v2
Class: FRAMING_WRONG
Reason: Users don't want SSO for MVP
Assumption: Enterprise users need SSO before trying the product

---
[2026-04-16 17:19] FROM: Owner → TO: ALL | PRIORITY: INFO | TAG: POD-KILL | RELEASE: v2026.Q2.1
POD KILLED: notif-push
Class: PRIORITY_SHIFT
Reason: Payments corridor took priority

---
[2026-11-14 13:25] FROM: Discovery Guardian → TO: Coordinator | PRIORITY: INFO | TAG: ITERATION-REVIEW | RELEASE: v2026.Q2.3
Portfolio Orchestrator Discovery cycle 1: ITERATE (4/6 criteria failed: regulatory confidence, core assumption untested, non-goals unreasoned, framing contradictions). Rework done by CEO in cycle 2: metering spike, §36 v0.2, CLO confidence table, reasoned non-goals + deferred-with-trigger, 10 new capabilities. See project/iterations/discovery/iter-001.md.

---
[2026-11-14 13:28] FROM: Discovery Guardian → TO: Coordinator | PRIORITY: INFO | TAG: ITERATION-GRADUATED | RELEASE: v2026.Q2.3
Portfolio Orchestrator Discovery GRADUATED at cycle 2 (6/6). Canonical outputs: context/intent/portfolio-orchestrator/{brief,discovery-synthesis}.md, context/spec/portfolio-orchestrator/{variables,claims}.yaml (25 planned capabilities). Carry-forward to route: CLO read live provider terms before first two-instance run; CTO test per-company keys + rate limits; Mario/Red-Team: ledger reachable via Bash under light v0 (trust boundary). Next gate: Mario irreversibility review.

---
[2026-11-15 16:06] FROM: Implementation Guardian → TO: Coordinator | PRIORITY: INFO | TAG: ITERATION-REVIEW | RELEASE: v2026.Q2.3
holding pod, implementation cycle 2: ITERATE. All cycle-1 items closed; one new blocker: landing/freeze hook fails open under the D7 sandbox user (hook + node under Owner home 0750, unreachable; Claude Code treats hook errors as non-blocking; no landing deadline). Cycle 3 fixes in progress. See project/iterations/implementation/holding/iter-002.md.

---
[2026-11-15 17:20] FROM: Implementation Guardian → TO: Coordinator | PRIORITY: INFO | TAG: ITERATION-GRADUATED | RELEASE: v2026.Q2.3
holding pod GRADUATED at implementation cycle 3 (6/6). Single-company v0 orchestrator ready for its first real run after Owner setup (sudo script review+run, key, price table, pin, floor, approved budget, provider spend limit). Carry-forwards N1-N3, first-run checks C1-C4 in project/iterations/implementation/holding/iter-003.md.

---
[2026-11-16 00:22] FROM: CTO → TO: Owner | PRIORITY: BLOCKER | SOL: HYBRID | RELEASE: v2026.Q2.3
SURFACE-20261115-brain-identity-storage-001 (irreversible) is blocked on a CISO no-go and awaits the Owner's decision: brain truth location, principal id format, signature/verification scheme, transport sequence. See the surface's 'Decision for the Owner' section.
ESCALATION: CEO
