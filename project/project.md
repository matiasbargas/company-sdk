# Project: sdk-v3
## [One-line description]
### Release: v2026.Q2.1 -- "[Release Name]"

---

> **Usage:** Copy this entire `project-template/` directory to start a new project. Rename the directory. Fill in every `[PLACEHOLDER]`. This file is the conversation record and source of truth. Every decision is logged here. Every agent reads this first.

---

## CONVERSATION 1 -- Owner Brief

**[OWNER → CEO]**

[Owner describes the product, the problem, the target user, and any constraints. 1-3 paragraphs. This is the raw brief before any strategic framing.]

---

## CONVERSATION 2 -- CEO: Strategic Framing

**[CEO → OWNER + COORDINATOR]**

```
PROJECT BRIEF: [Name]
Date: [YYYY-MM-DD]
Release target: v2026.Q2.1

Market truth:
[1-2 sentences. What condition in the market makes this worth building now?]

Target customer:
[Specific person, not a segment. Role, problem, current solution.]

What winning looks like at 18 months:
[Concrete: users, revenue, market position, or capability.]

Non-negotiables:
- [Thing that cannot be compromised]
- [Thing that cannot be compromised]

What we are NOT building:
- [Explicit deferral + reason]
- [Explicit deferral + reason]

Decision authority matrix:
- Technical architecture: CTO
- Legal/compliance: CLO
- Scope changes: PM + Coordinator (CEO if >20% shift)
- Budget changes: CFO (CEO if >15% overrun)
- Launch go/no-go: CEO
```

---

## CONVERSATION 3 -- Coordinator: Release Opened

**[COORDINATOR → ALL]**

```
FROM: [Coordinator name]
TO: ALL
RELEASE: v2026.Q2.1
PRIORITY: INFO
MESSAGE:
  [Project name] is open. Release v2026.Q2.1 "[Name]" is now active.
  Epic: [One sentence]
  Team tier: [Solo / Small / Medium / Large / Program]
  Discovery phase starting. Activating in sequence per AGENTS.md.
  Sprint 0 gate target: [date]
  Engineering start: [date]
```

---

## CONVERSATION 4+ -- Team Activation

> For each activated agent, add a conversation block:
> **[COORDINATOR → AGENT]** with the activation Bus message
> **[AGENT → COORDINATOR + relevant peers]** with their deliverable

[Paste each agent's activation and response here as the project progresses.]

---

## SPRINT 0 GATE

```
Sprint 0 Gate -- v2026.Q2.1:
[ ] Epic definition complete and Owner-approved
[ ] Discovery document(s) written
[ ] All domain requirements files updated
[ ] CLO: legal/compliance reviewed (if applicable)
[ ] CISO: security reviewed (if applicable)
[ ] CTO: architecture brief written
[ ] CTO or Staff Eng: data model reviewed (if applicable)
[ ] CMO: market context report complete
[ ] PM: user story map + scope definition complete
[ ] EM: critical path mapped, pods composed
[ ] COO: vendor onboarding initiated (if new vendors)
[ ] Make/buy/partner decisions locked
[ ] Interface contracts written (if cross-service)
[ ] Owner aligned on scope, timeline, budget

Gate status: [OPEN / BLOCKED]
Blocked by: [item, if any]
```

---

## RELEASE PLAN

**Release ID:** v2026.Q2.1
**Name:** [Release name]
**Target ship date:** [date]
**Team tier:** [Tier N]
**Pods:** [Pod-A: PM + 2-3 eng, mission: ... | Pod-B: PM + Designer + 2-3 eng, mission: ...]

### Outcome
[1-2 sentences: what a user can do after this ships that they cannot do today.]

### Scope Shipped
- [ ] [Capability]
- [ ] [Capability]

### Scope Deferred
- [Item] → [future release] -- reason: [why]

### Dependencies
- [Dependency + owner + risk if delayed]

### Sprint Sequence
| Sprint | Focus | Gate |
|---|---|---|
| Sprint 0 | [Setup, repo, CI/CD] | [What must be true] |
| Sprint 1 | [Core work] | [Milestone] |
| Sprint N | [Hardening] | [Ship criteria] |

---

## OPEN DECISIONS LOG

| Decision | Owner | Status | Due |
|---|---|---|---|
| [Question] | [Role] | Open | [Date] |

---

## DECISION HISTORY

> As decisions are made, move them from Open Decisions to here with the full format from protocol.md Section 6.

---

*project.md v1.0 -- [Project Name] / v2026.Q2.1 -- Created [date] by [Coordinator name]*
