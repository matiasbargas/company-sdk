# Protocol -- Shared Interface Contract
**Version:** 3.3
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
- `INFO`: Sharing state. No response required. Sprint status, completion confirmations, FYI items.
- `DECISION NEEDED`: Work will be blocked within N days without a specific decision. The decision must be stated as a question with options.
- `BLOCKER`: Work has stopped now. Immediate escalation within 4 hours if not resolved.

**Message format extensions for specific roles:**

EM Mission Pod Status (sent after each batch of tasks completes, or when status changes — not on a fixed schedule):
```
MESSAGE:
  POD STATUS - [YYYY-MM-DD]
  Mission: [Mission name and Appetite remaining]
  Pods: [Pod-A (PM + 2 Eng) | Pod-B (PM + Designer + 3 Eng)]
  Completed since last update: [items]
  In progress: [items + pod]
  Blocked: [items + who unblocks]
  At risk: [items + reason]
  Appetite: ON TRACK | AT RISK | SCOPE REDUCTION NEEDED
  Pod health: [Pod-A: GREEN | Pod-B: YELLOW -- reason]
```

Liaison Health Update (sent when status changes or tasks complete — not on a fixed schedule):
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

**P0 Security Incident — bypasses the ladder entirely:**

A P0 security incident is: confirmed or suspected data breach, credential exposure, active unauthorized access, or any event triggering a mandatory regulatory notification window (e.g. GDPR 72-hour clock).

P0 protocol:
1. CISO notifies CEO **and** CLO simultaneously within **1 hour** of suspected incident — regardless of escalation step, regardless of time of day
2. CEO activates the incident response chain
3. CLO assesses regulatory notification obligations immediately (GDPR: 72-hour window starts at discovery)
4. Standard escalation ladder runs in parallel — P0 does not replace it, it runs ahead of it

A P0 that sits at Step 1 for 4 hours while waiting for the owning agent to respond is not a P0 being handled — it is a P0 being buried. CISO owns the call on what constitutes a P0.

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
Made by: [Role] (AI-assisted | AI-generated | Human)
Context: [1-2 sentences: why this decision was needed]
Decision: [What was decided]
Alternatives considered: [What else was on the table]
Rationale: [Why this option, not the others]
Implications: [What this changes downstream]
Reversible: YES / NO
Affects natural persons: YES / NO
Human approved by: [Full name, title] on [YYYY-MM-DD]   ← required when Affects natural persons: YES or when on the CEO escalation triggers list
```

**Human approval is mandatory** for any decision that:
- Affects a natural person (hiring, role change, performance, termination, user data)
- Appears on the CEO escalation triggers list (scope >20%, budget >15%, legal exposure, staff hires, launch go/no-go)
- Is irreversible (Reversible: NO)

A decision log entry without a human approval line for these categories is incomplete. An incomplete entry does not constitute a decision of record.

**Decision maker type:**
- `AI-generated` — produced entirely by an agent with no human review before action
- `AI-assisted` — produced by an agent, reviewed and confirmed by a human before action
- `Human` — produced by a human, agent may have provided analysis

In regulated contexts and for all decisions affecting natural persons, the minimum acceptable type is `AI-assisted`.

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

## 8. Mission Pod Model

The atomic unit of delivery is a **Mission Pod**: a small, cross-functional team formed around a specific mission objective, executing within a fixed Appetite (maximum 6 weeks), then dissolving back into the talent pool.

**The Liquid Engineering shift:** We do not organize by domain ownership. We organize by outcomes. Pods are ephemeral; the mission is temporary; the quality is permanent.

**Standard Mission Pod composition:**
| Pod Type | Members | Use for |
|---|---|---|
| Product Pod | 1 PM + 2-3 Engineers | Feature build, product iteration |
| Full Pod | 1 PM + 1 Designer + 2-3 Engineers | Product + UX missions |
| Platform Pod | 1 Staff Eng + 2-3 Engineers | Infrastructure, architectural work |
| Discovery Pod | 1 PM + 1 Engineer | Validation, prototyping, research |

**Appetite:** Every mission has a fixed Appetite, not an estimate. The pod finds the most high-impact version of the mission deliverable within that window. If the mission is not done when the Appetite runs out, it is re-evaluated at the Betting Table — not automatically extended.

**Guardians (permanent domain anchors):**
Lead/Staff Engineers and PMs who remain fixed in specific business domains. While pods move around them, Guardians act as permanent "Architectural Librarians." Their role:
- **Context Priming:** Before a mission pod starts, the Guardian primes the AI context with correct documentation, security patterns, and known pitfalls for that domain
- **Invariant Enforcement:** They define the "Non-Negotiables" (e.g., security rules, regulatory constraints, API contracts that cannot break)
- **Final Gate:** Guardian provides the final sign-off on all high-risk logic before the pod ships

**EM ratio:** 1 EM per 2 active pods maximum. At 3+ active pods, add another EM.

**Mission Pod tiers:**
| Tier | Pods | Total members | EM count |
|---|---|---|---|
| Solo | 0 (1 person) | 1 | 0 (Coordinator tracks) |
| Small | 1 pod (3-4 people) | 3-4 | 1 (lightweight) |
| Medium | 1-2 pods | 4-8 | 1 |
| Large | 2-4 pods | 8-16 | 2 |
| Program | 4-8 pods | 16-32 | 1 per 2 pods |

**Anti-patterns:**
- Pod of 6+: not a pod. Split into two with separate missions and separate owners.
- Pod without a PM: a pod without domain context is contextless. Assign a PM or Guardian before kick-off.
- EM managing 3+ pods: EM is a bottleneck. Add an EM.
- Pod without a defined Appetite: if there's no time boundary, there's no mission. Define it before the pod forms.

**Pod ownership contract:** Each pod has a single PM owner. That person is accountable for the mission outcome. Nobody outside the pod assigns work to pod members without going through the PM. The Guardian can inject constraints but does not assign work.

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

**CLO + COO (vendor contracts):**
When COO identifies a vendor requiring a contract or data access agreement, CLO must review the contract before signature. COO sends a Bus message to CLO with the contract and relevant context (vendor tier, data access scope, integration depth). CLO's review is a gate on vendor onboarding — COO does not countersign until CLO has reviewed. Vendor tiers: Tier 1 (access to production user PII or financial data — CISO sign-off also required), Tier 2 (non-production or anonymized data — DPA required), Tier 3 (no data access — standard contract review). The Betting Table process includes a vendor-obligations check: before deselecting a mission, COO must surface any outstanding vendor commitments associated with it, and CLO must assess contract implications before the mission is returned to the queue.

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

## 11. Strategy Alignment Protocol

Strategy is not a deck. It is the set of decisions every agent can use to make real choices without waiting for approval.

**The CPTO/CEO broadcasts strategy through this conversation.** The owner communicates via this channel (the main chat). Every agent must be able to answer: *what are we trying to achieve, why does it matter, and how does my role contribute?*

**The 4 success themes every agent reasons from:**
1. **Faster Delivery** — Ship small changes frequently. Focus on architecture and higher-value decisions. Reduce boilerplate and manual glue.
2. **Higher Quality** — Fewer bugs, more stable flows. AI used heavily for testing. Changes customers actually value.
3. **Compliance & Robustness** — Architectures that are self-explainable and auditable. Less manual drag during audits and reporting.
4. **Operational Efficiency** — Key processes on autodriver. Lower marginal operating cost. More capacity for new initiatives.

**Principles every agent applies when a decision is ambiguous:**
- If your team cannot use the strategy to make a real decision, the strategy is not working. Surface the gap.
- Strategy is direction + pace. Not a fixed destination.
- Processes are the engine. You don't rise to the level of your goals — you fall to the level of your systems.
- Autonomy with principles is the goal. The better the principles, the less you need rules.

**When an agent announces a change to their own domain** — a decision, a shift in direction, a new constraint — they post it to their area log (Section 12). This is how the whole team reasons as one force.

**Fluid task delegation:** Any agent may open sub-missions or parallel work tracks at any moment without blocking the main conversation thread. Parallel work is coordinated through the Coordinator. The CPTO/Owner channel (this main conversation) is never blocked by sub-execution. Agents report back here when complete.

---

## 12. Area Logs

Every area maintains a shared log. **All levels within the same area write to the same document.** This creates a single narrative per area — not per seniority level.

**Area log files:**
| Area | File | Who writes |
|---|---|---|
| Strategy | `strategy-log.md` | CEO, Coordinator, CPTO-level decisions |
| Product | `product-log.md` | PM (all levels), CDO, CMO when product-facing |
| Engineering | `engineering-log.md` | CTO, Chief Engineer, Staff Eng, EM, all ICs |
| Design | `design-log.md` | Product Designer, PM (UX decisions) |
| Operations | `operations-log.md` | COO, CLO, CISO, CFO |
| People | `people-log.md` | CHRO, EM (team health) |

**Area log entry format:**
```
[YYYY-MM-DD] [ROLE] [LEVEL]
Goal/Change: [What this entry is announcing or logging]
Expected outcome: [What changes as a result]
Requirements discovered: [List any new requirements; add them to the relevant requirements file immediately]
Status: ACTIVE | COMPLETED | BLOCKED | CANCELLED
```

**Rules:**
- Every announced goal or change gets an entry. Every discovered requirement goes into both the log AND the relevant requirements file.
- Updates are triggered by completed tasks or state changes — not by time. You do not write a log entry because "it's been a day." You write one because something changed or completed.
- A change that affects another area must trigger a Bus message to the Coordinator before execution.
- When work is resumed after a break, the first action is to read the area log(s) relevant to your role. This is the fastest path to current state.

---

## 13. Session Continuity

**The show must go on.** A team session may end due to token limits, connection drops, or context switches. The current state of the work is always recoverable — but only if it was written.

**`current-status.md` is the session continuity file.** It is updated at the end of every working session and at every significant state change. Any agent can read it and know exactly where the team is and what the next action is.

**Format:**
```
# Current Status -- [Project Name]
Last updated: [YYYY-MM-DD HH:MM]
Updated by: [Role]
Release: v[YEAR].Q[QUARTER].[INCREMENT]

## Active Missions
| Mission | Pod | Appetite remaining | Status | Next action |
|---|---|---|---|---|
| [Mission name] | [PM + members] | [N weeks] | [Active/Blocked/Paused] | [Specific next step] |

## Waiting On
- [ ] [What is needed] | From: [Role] | Since: [date]

## Completed This Session
- [What was done] | By: [Role] | Date: [date]

## Open Decisions (not yet logged to history.md)
- [Decision pending] | Needs: [who must decide] | By: [date]

## Next Agent To Activate
[Role] — because [reason]
```

**Rules:**
- Any agent who completes work updates `current-status.md` before closing the session.
- If a session ends mid-task, the incomplete item goes into "Active Missions" with status "Paused" and a specific "Next action."
- When a new session begins, the first file read after `project.md` is `current-status.md`.

---

---

## 14. Sub-Role Creation

Any C-level agent may create and activate sub-roles within their domain without a protocol change request. This is standard organizational design — as the company scales or a domain becomes more complex, the C-level who owns that domain is the right person to define what roles are needed below them.

**Rules for C-level sub-role creation:**

1. **Domain authority:** A C-level can only create sub-roles within their own domain. The CRO (Risk) creates risk analysts; the CCO (Compliance) creates compliance analysts. They do not create roles in each other's domains.

2. **Naming convention:** Every sub-role gets a unique name — a first name plus a random place in the world as the surname. The place's regional ethics should color how this agent approaches their work. Aim for diversity across the team: varied geographies, cultural backgrounds, and frames of reference. No two active agents in the same project share a name or a place. These are AI agent identifiers only — not hiring guidance for human employees. See `DISCLAIMER.md`.

3. **Activation:** The C-level activates a sub-role by naming them, stating their scope, and sending an INFO Bus message to the Coordinator. The Coordinator routes and records it. No CEO approval needed for standard sub-roles.

4. **CEO approval required for:**
   - A new C-level peer role (a new domain at the executive layer)
   - A sub-role that will have cross-domain authority (e.g., a role that reports to two C-levels)
   - A sub-role that touches regulated activity not currently in the C-level's domain

5. **Skill levels:** Sub-roles are assigned skill levels (L1–L4 for ICs, M1+ for managers) from the levels defined in `levels/`. The C-level states the level at activation. The level determines the scope and expected outputs.

6. **Dissolution:** When a sub-role is no longer needed, the C-level dissolves it and sends an INFO Bus message to the Coordinator. The Coordinator logs it to `people-log.md`.

**Sub-roles inherit the naming convention but not the C-level's authority.** A Credit Analyst created by Paola São Paulo can analyze; they cannot set credit policy. A Compliance Analyst created by Andrea Washington can run monitoring procedures; they cannot sign off on a compliance program. Authority stays at the level where the role is defined.

---

## 15. Ideation Cycle and Shipping Cycle

The SDK operates in two distinct cycles. They have different governors, different success conditions, and different authority structures. Confusing them is the source of most scope and priority dysfunction.

### Ideation Cycle
**Governor: PM (Product)**
**Character: Design-driven, evidence-backed, exploratory**

The Ideation Cycle runs from raw idea to Appetized mission brief. Its output is a shaped, scoped, tested idea that is ready for the Betting Table.

| Phase | Primary owner | What happens |
|---|---|---|
| Raw idea | Owner / CEO / PM | Problem statement, user hypothesis |
| UX Research | UX Researcher | Assumption testing, user evidence, friction log |
| Mission shaping | PM | Appetite set, scope defined, non-negotiables listed |
| Interface direction | Designer | All surfaces mapped, conversation flows designed |
| Appetized | PM | Brief ready for Betting Table |

**Who leads:** PM governs scope and framing. Designer shapes what the solution looks, feels, and speaks like before a line of engineering is written. UX Researcher provides the evidence both need.

**Success condition:** A shaped brief that any engineer can read without asking a clarifying question, with an Appetite that is honest.

**What does NOT happen here:** Tickets. Code. Infrastructure decisions. Architecture. Those belong to the Shipping Cycle.

### Shipping Cycle
**Governor: CPTO / Owner**
**Character: Execution-focused, delivery-committed, time-bounded**

The Shipping Cycle begins when the Betting Table selects a mission. Its output is a shipped increment.

| Phase | Primary owner | What happens |
|---|---|---|
| Betting Table | CPTO / CEO | Mission selected from Appetized queue |
| Architecture + SDD | CTO → Mario → Staff Eng | Architecture brief, irreversible decision review, interface contracts |
| Pod formation | EM | Pod composed, critical path mapped, Sprint 0 gate |
| Execution | PM + Engineers + Designer | Pods build, Liaison bridges, EM manages path |
| Ship + retrospective | Coordinator | Release sealed, retro synthesized, history logged |

**Who leads:** CPTO governs delivery commitments. EM manages the critical path. PM holds scope. Nobody extends the Appetite without CPTO sign-off.

**What does NOT happen here:** New scope without Vision Alignment Test. Appetite extensions without CPTO approval. Scope absorbed silently by engineers.

### The Betting Table transition
The Betting Table is the formal handoff between cycles. A mission crosses from Ideation to Shipping only when:
1. The PM has submitted a shaped brief with a defined Appetite
2. The UX Researcher's synthesis has been reviewed by the PM
3. The Designer has produced an Interface Direction Brief
4. Leadership has selected the mission (CPTO + CEO)

A mission not selected does not die. It returns to the Ideation queue. The Betting Table does not fail ideas — it sequences them.

---

## 15. SDK Self-Improvement Loop

The SDK can build products. It also needs to improve itself. This section defines the mechanism.

**The problem:** The team runs retrospectives. The retrospectives surface process failures. Without a feedback loop, those findings stay in `history.md` and the next release runs the same failure again.

**The rule:** Any finding from a retrospective that implies a change to the protocol, a role definition, or the SDK template can be proposed as a protocol change. Proposals flow through a defined path. Changes that are approved are written into the SDK files. The SDK evolves from real project experience.

### Protocol Change Process

**Step 1: Identify**
Any agent may notice a protocol gap during a sprint or retrospective. They write a short proposal:
```
PROTOCOL CHANGE PROPOSAL
Date: [YYYY-MM-DD]
Proposed by: [Role]
File to change: [protocol.md section / roles/[role].md / project-template/[file]]
Change: [What to add, remove, or modify — be specific]
Evidence: [What happened that suggests this change is needed — retro finding, recurring friction, failure mode]
Impact: [What breaks or improves if this change is made]
```

**Step 2: Route**
The proposing agent sends the proposal to the Coordinator via Bus message (PRIORITY: INFO, tagged `SDK-CHANGE`). The Coordinator collects proposals and batches them for review.

**Step 3: Review authority**
| Change type | Reviewer | Approver |
|---|---|---|
| `protocol.md` change | Coordinator reviews | CEO approves |
| Role file change | Role owner reviews (or Coordinator if role is vacant) | CEO approves |
| Project template change | Coordinator reviews | CPTO approves |
| `AGENTS.md` change | Coordinator reviews | CEO approves |

**Step 4: Apply**
Approved changes are applied to the SDK files directly. The Coordinator updates the protocol version and writes an entry to `history.md` (or the SDK's own changelog if one exists).

**Step 5: Broadcast**
Once applied, the Coordinator sends an INFO Bus message to ALL agents: "Protocol updated — [what changed] — re-read [file] Section [N] before your next activation."

### What qualifies for the self-improvement loop

Changes that qualify:
- A recurring friction point that appeared in 2+ retrospectives
- A gap in a role definition that caused rework or ambiguity
- A protocol rule that was frequently misunderstood or violated
- A template that needed manual correction on every new project

Changes that do NOT qualify (wrong venue):
- Project-specific decisions (those go to `history.md`)
- Tactical adjustments within a sprint (those go to the EM)
- Feature requests for the product being built (those go to the PM)
- Architectural debates (those go to the CTO/Mario)

### Version management
When a protocol change is accepted and applied:
- Increment the version in the protocol file header (`v3.0` → `v3.1` for minor changes, `v3.0` → `v4.0` for structural changes)
- Log the change in `history.md` under the current release with tag `SDK-CHANGE`
- Update `AGENTS.md` manifest version if the agent roster or activation sequence changes

The self-improvement loop is the team's immune system. Use it after every retrospective.

---

## 16. Consultation Mode & Spawning Policy

Agents operate in two modes. **Project Mode** is the default — full context loading, Bus protocol, requirements files. **Consultation Mode** is for standalone questions answered from domain expertise alone, without any project context.

See `roles/CONSULT.md` for the full consultation guide. This section defines the protocol rules that govern it.

### When Consultation Mode applies

An agent is in Consultation Mode when:
- Activated via `/ask`, `/askGreg`, `/askCTO`, or any other consultation skill
- No project directory exists or has been provided
- The Owner explicitly addresses the agent with a one-off question outside a release context

In Consultation Mode:
- Context loading (Section 7) is **optional**. Operate from domain knowledge.
- Bus format (Section 1) is **not required**. You are communicating with a person, not routing to a team.
- Release ID references are **not required**.
- Area log writes are **not required**.
- Escalation ladder (Section 2) still applies if the question requires a decision above your authority.

### Spawning policy

An agent in Consultation Mode MAY spawn peer agents using the Agent tool to enrich understanding. This is governed by one rule:

**Spawn to understand, not to offload.**

A spawned consultation asks a peer "what do you see from your vantage point?" — not "produce this deliverable." The spawning agent owns the synthesis. The peer contributes a perspective, not a document.

**Spawn when:**
- The question touches a domain you do not own AND getting it wrong would meaningfully mislead the asker
- A peer perspective would reveal a constraint, risk, or tradeoff invisible from your position
- The question genuinely requires cross-domain synthesis

**Do NOT spawn when:**
- The question falls squarely within your domain
- A peer's input would not change the answer
- You are already integrating two or more perspectives (three is the maximum)

**How to spawn:**
1. Identify the peer agent and their role file in `roles/`
2. Formulate a specific sub-question — the slice of the problem their domain owns
3. Launch a subagent via the Agent tool with their role file as context and the sub-question as the prompt
4. Read their response, distill the key insight, and integrate it into your synthesis
5. Attribute the perspective in your response: *[CLO view: ...]*, *[Technical concern from CTO: ...]*

**Spawned agent authority — two tiers:**

| Spawn type | Who authorizes | Write access |
|---|---|---|
| Consultation spawn (understanding) | Spawning agent | READ ONLY — no writes to project files, no sdk-doc write commands |
| Execution assignment (delivery) | EM or lead agent | WRITE — authorized within the assigned scope |

A consultation-spawned agent that writes to project state without the spawning agent's explicit decision is acting outside its authority. All write decisions from consultation spawns flow back to the spawning agent, who reviews and chooses what to apply. This prevents both silent privilege escalation and prompt injection via spawned agents reading adversarial content in project files.

The spawning agent must log what was spawned, the sub-question asked, and the key insight returned — before incorporating it into synthesis.

### Synthesis standard

A consultation answer that relays raw peer output has failed. The goal is synthesis: a single coherent answer that integrates perspectives, names the tradeoffs, and leaves the asker with better judgment — not just an answer.

Every consultation should include:
- The map of what was considered (what paths were ruled out and why)
- The key uncertainty the asker should carry forward
- One assumption that, if wrong, would change the answer

### Consultation and the agent lifecycle

The spawning policy described here applies within Project Mode as well. Any time an agent in a project needs domain input from a peer — and that input is for *understanding a problem*, not for *tasking the peer* — the same rules apply: spawn with a focused question, synthesize the perspective, own the output.

This means consultation-style spawning is not a special mode. It is the standard for any cross-domain reasoning within the agent lifecycle, in or out of a project.

---

*Protocol v3.3. This file is the single source of truth for inter-agent communication, escalation, requirements tracking, organizational structure, strategy alignment, area logs, session continuity, sub-role creation, ideation and shipping cycles, SDK self-improvement, and consultation mode. Every agent references it. No agent duplicates it.*
