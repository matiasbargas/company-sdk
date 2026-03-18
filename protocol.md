# Protocol -- Shared Interface Contract
**Version:** 2.0
**Owner:** Coordinator
**Every agent references this file. Do not duplicate these definitions in individual role files. If the protocol changes, it changes here.**

---

## 0. Owner Communication Protocol

The Owner is the company's founder or principal. All flow starts here, and this is the rule: the Owner communicates with the system through two channels only.

**Owner → CEO:** For project initiation, strategic direction, non-negotiables, and any decision that requires CEO judgment.

**Owner → Coordinator:** For release management questions, process clarifications, and cross-team status.

The CEO or Coordinator routes the Owner's intent through the Bus to the appropriate agents. This is how the whole team stays aligned — when the Owner talks to an execution agent directly, the CFO does not know what was said, the Coordinator cannot sequence it, and the team builds against two different pictures of the truth.

**Execution is always through the flow of agents, never through a direct command to an execution agent.** No agent below the CEO/Coordinator layer receives Owner direction without it being routed and visible on the Bus.

**Rule for agents:** If you receive a direct message from the Owner that contains a task or direction, acknowledge it, do not act on it unilaterally, and immediately send an INFO Bus message to the Coordinator flagging it. The task is not live until the Coordinator activates it through the Bus.

**The Owner is always welcome to read any agent's output.** This protocol governs input direction, not output visibility.

---

## 1. Bus Message Format

This is the only valid format for inter-agent communication. No variations.

```
FROM: [Agent name] ([Role])
TO: [Target agent] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE:
  [Body -- plain text, no headers inside the message for INFO.
   For DECISION NEEDED: must include a specific question and a deadline.
   For BLOCKER: must name what is stopped and who can unstop it.]
DECISION BY: [YYYY-MM-DD] (required for DECISION NEEDED, omit for INFO)
ESCALATION: [Role that gets this if no response by deadline] (required for DECISION NEEDED and BLOCKER)
```

**Priority rules:**
- `INFO`: Sharing state. No response required. Weekly status, completion confirmations, FYI items.
- `DECISION NEEDED`: Work will be blocked within N days without a specific decision. The decision must be stated as a question with options.
- `BLOCKER`: Work has stopped now. Immediate escalation within 4 hours if not resolved.

**Message format extensions for specific roles:**

EM Squad Status (sent weekly during sprints):
```
MESSAGE:
  SQUAD STATUS - Sprint [N] - [YYYY-MM-DD]
  Cells: [Cell-A (cell-2) | Cell-B (cell-4)]
  Done: [items]
  In progress: [items + % + cell]
  Blocked: [items + who unblocks]
  At risk: [items + reason]
  Sprint goal: ON TRACK | AT RISK | SCOPE REDUCTION NEEDED
  Cell health: [Cell-A: GREEN | Cell-B: YELLOW -- reason]
```

Liaison Daily Health (sent once per day during sprints):
```
MESSAGE:
  Sprint [N] -- [YYYY-MM-DD]: GREEN | YELLOW | RED
  [One paragraph: what changed, what is the state, what is coming.]
  Open decisions pending leadership: [list or "none"]
```

Liaison Decision Request (max 3 sentences):
```
MESSAGE:
  Context: [What is happening]
  Decision needed: [The specific question]
  Impact if not decided by [date]: [What blocks]
```

---

## 2. Escalation Ladder

One path. No exceptions. Every agent uses this ladder. Do not invent ad hoc escalation paths.

```
Step 1: Direct to the owning agent (the person whose domain this falls in)
         ↓ if no response in 24 hours
Step 2: Coordinator (Nova or equivalent)
         ↓ if no resolution in 48 hours
Step 3: Relevant C-suite agent (CEO for strategy, CTO for architecture, CLO for legal, etc.)
         ↓ if C-suite cannot resolve without Owner input
Step 4: CEO makes the call or routes to Owner
         ↓ if CEO explicitly flags it
Step 5: Owner
```

**Escalation is not failure.** Escalation is the system working. Agents who sit on a blocker for 48 hours because they are "trying to resolve it themselves" are not helping -- they are hiding information from the system.

**BLOCKER escalation is faster:**
- Step 1: Direct to owning agent (4 hours, not 24)
- Step 2: Coordinator (if unresolved in 4 hours)
- Step 3: CEO (if unresolved in 24 hours)

---

## 3. Release Versioning

Format: `v[YEAR].Q[QUARTER].[INCREMENT]`

| Field | Values | Resets |
|---|---|---|
| YEAR | Calendar year (2026, 2027...) | Never |
| QUARTER | Q1, Q2, Q3, Q4 | Yearly |
| INCREMENT | Integer starting at 1 | Per quarter |

Examples: `v2026.Q2.1`, `v2026.Q2.2`, `v2026.Q3.1`

**Special versions:**
- Hotfix: `v2026.Q2.1-hotfix.1` (append `-hotfix.N` to the parent release)
- Security patch: same as hotfix, but prefix the history.md entry with `SEC-`
- Sub-release: `v2026.Q2.1` → `v2026.Q2.2` (increments within the same quarter for scope expansions)

---

## 4. Requirements File Format

Every domain agent owns one file: `[DOMAIN]-requirements.md`. The Coordinator aggregates them into `general-requirements.md`.

```
# [Domain] Requirements -- [Project Name] v[YEAR].Q[QUARTER].[INCREMENT]
Domain owner: [PERSONA NAME] ([Role])
Last updated: [YYYY-MM-DD]

## Pending
- [ ] [Requirement description] | Owner: [Name] | Due: [Sprint N or date]
- [ ] [Requirement description] | Owner: [Name] | Due: [Sprint N or date] | CRITICAL

## In Progress
- [ ] [Requirement] | Owner: [Name] | Started: [Sprint N] | Target: [Sprint N]

## Blocked
- [ ] [Requirement] | Owner: [Name] | Blocked by: [what] | Since: [date]

## Done
- [x] [Requirement] | Owner: [Name] | Completed: [date]

## Notes
[Running notes, context, dependencies discovered during the release.]
```

**Rules:**
- Requirements are checked `[x]` only when work is demonstrably done (tested, reviewed, merged, validated). Not "almost done."
- New requirements discovered mid-sprint are added immediately, not deferred to a list the team never looks at.
- Blocked items move to Blocked with the reason and the date. They do not stay in Pending looking healthy.
- The `CRITICAL` tag means the release cannot ship without this item. Use sparingly.
- Domain owners update their own files every sprint. The Coordinator does not update domain files -- that is each owner's job.

---

## 5. General Requirements (Coordinator's Aggregate)

```
# General Requirements -- [Project Name]
Last updated by: Coordinator
Release: v[YEAR].Q[QUARTER].[INCREMENT]

| Domain | File | Pending | Done | Last updated |
|---|---|---|---|---|
| Legal | legal-requirements.md | [N] | [N] | [date] |
| Security | security-requirements.md | [N] | [N] | [date] |
| Product-Eng | product-engineering-requirements.md | [N] | [N] | [date] |
| ... | ... | ... | ... | ... |

## Open CEO Decisions
- [ ] [Decision + context + date needed by]

## Active Blockers (cross-domain)
- [Blocker] | Affects: [domains] | Owner: [who] | Since: [date]
```

---

## 6. Decision Log Format

Every decision of consequence gets logged. If it was not logged, it did not happen. Future agents will not know about it.

```
DECISION: [Short title]
Date: [YYYY-MM-DD]
Release: v[YEAR].Q[QUARTER].[INCREMENT]
Made by: [Role]
Context: [1-2 sentences: why this decision was needed]
Decision: [What was decided]
Alternatives considered: [What else was on the table]
Rationale: [Why this option, not the others]
Implications: [What this changes downstream]
Reversible: YES / NO
```

**Where decisions are logged:**
- Project-level decisions: in `history.md` under the relevant release entry
- Domain-specific decisions: in the domain's requirements file under Notes
- Sprint-level decisions: in the EM's squad status (ephemeral) and the Coordinator's sprint review summary (persistent)

---

## 7. Context Loading Protocol

When an agent is activated mid-project (not at project start), they must load context before producing any output.

**Mandatory reads before first output:**
1. `project.md` -- the full conversation record and release plan
2. `history.md` -- what was decided, when, and why
3. `[own-domain]-requirements.md` -- the current state of their domain's tasks
4. `general-requirements.md` -- the aggregate view of all domains
5. `protocol.md` -- this file (if the agent has not read it before)

**Mandatory reads for specific roles:**
- CTO: also reads the architecture brief or discovery document
- Chief Engineer (Mario): also reads the CTO's architecture brief, all active interface contracts, and the tech debt ledger
- EM: also reads the current sprint's open tickets and the critical path
- Liaison: also reads the liaison log from the current sprint
- PM: also reads the user story map and friction log
- Staff Engineer: also reads all interface contracts and the tech debt ledger

An agent who produces output without reading their context files is working with stale assumptions. Stale assumptions cause rework.

---

## 8. Cell Model

The atomic unit of an engineering team is a **cell**: 2 or 4 engineers with a clear ownership boundary.

**Cell-2:** 1 Senior + 1 Mid or Senior. Owns one service or module end-to-end.
**Cell-4:** 1 Staff + 2 Senior + 1 Mid. Owns a full product slice.

**EM ratio:** 1 EM per 2 cells maximum. At 3+ cells, add another EM.

**Team tiers:**
| Tier | Cells | Total eng | EM count |
|---|---|---|---|
| Solo | none (1 person) | 1 | 0 (Coordinator tracks) |
| Small | 1x cell-2 | 2 | 1 (lightweight) |
| Medium | 1x cell-4 or 2x cell-2 | 4 | 1 |
| Large | 2x cell-4 or 4x cell-2 | 8 | 2 |
| Program | 3-6x cell-4 | 12-24 | 1 per 2 cells |

**Anti-patterns:**
- Cell of 3: not a cell. Staff it as cell-2 or cell-4.
- Cell of 5+: two cells with blurred ownership. Split and name the boundary.
- EM with 3+ cells: EM is a bottleneck. Add an EM.

**Cell ownership contract:** Each cell has a single owner (usually the senior in cell-2, the Staff in cell-4). That person is accountable for the cell's sprint commitments. Nobody outside the cell assigns work to engineers inside the cell without going through the cell owner.

---

## 9. Peer Integration Points

These are the handoff protocols between roles that share domain boundaries. When in doubt about who owns an issue that crosses these boundaries, the Coordinator routes it.

**CLO + CISO (compliance):**
CLO owns the regulatory map (what the law requires). CISO owns the implementation plan (how the system satisfies those requirements). When a compliance requirement is ambiguous -- is it a legal question or a technical one? -- CLO defines the requirement and CISO proposes the implementation. If they disagree on scope, Coordinator escalates to CEO.

**CMO + PM (positioning ↔ scope):**
CMO owns the market positioning and the "one sentence" test. PM owns the user story and scope. When the CMO's positioning implies features that are out of scope, PM does not absorb them silently. PM sends a Bus message to Coordinator flagging the scope-position conflict. Coordinator routes to CEO for a scope decision.

**CMO + CRO (positioning ↔ pricing):**
CMO owns the message. CRO owns the price. The pricing model must be consistent with the positioning. If CMO positions the product as premium but CRO prices it at commodity level (or the reverse), Coordinator escalates. Neither role changes the other's output without a logged decision.

**CTO + COO (architecture ↔ vendors):**
CTO makes the make/buy/partner decisions. COO manages the vendor relationships once the decision is made. When a vendor's behavior changes (SLA breach, price increase, feature deprecation), COO notifies CTO with a Bus message. CTO decides whether to stay, migrate, or renegotiate. COO executes.

**CDO + PM (instrumentation ↔ friction):**
CDO owns the instrumentation plan and the metrics framework. PM owns the friction log and user story map. Every sprint, PM shares the top 5 friction log items with CDO. CDO ensures those friction points have measurable events in the instrumentation plan. If a friction item cannot be measured, CDO flags it as a gap.

**Staff Engineer + EM (architecture ↔ delivery):**
Staff Engineer defines interface contracts and reviews platform PRs. EM translates those contracts into sprint tickets. When a contract change mid-sprint affects the critical path, Staff Engineer notifies EM immediately. EM adjusts the path and sends a revised squad status.

---

## 10. History Entry Format

`history.md` is the organizational memory. Every agent contributes to it — not only the Coordinator. The Coordinator writes the release-close entries. Individual agents write decision log entries (Section 6 format) when they make domain-specific decisions of consequence within a release.

The rule: if a decision took more than a day to make, cost money, cannot be easily reversed, or changes the architecture, scope, or legal posture of the project, it belongs in `history.md`. An idea that dies in someone's head is a crime against the person who needed it. A decision that dies in a conversation and is not recorded will be made again, worse, six months later.

Every release closes with a history entry. Every significant mid-release decision also gets an entry.

```
## [vYYYY.QQ.N] -- [Release Name]
Date: YYYY-MM-DD
Status: Shipped | Cancelled | Deferred

What shipped:
- [User-visible capability]

What did not ship (and why):
- [Deferred item + reason]

Decisions made this increment:
- [Decision + rationale, or reference to the decision log]

Immediate next actions:
- [What must happen in the first week of the next increment]

Retrospective summary:
[1 paragraph: what the team learned]
```

---

*Protocol v2.0. This file is the single source of truth for inter-agent communication, escalation, requirements tracking, and organizational structure. Every agent references it. No agent duplicates it.*
