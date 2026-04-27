# Protocol -- Shared Interface Contract (Core)
**Version:** 4.3
**Owner:** Coordinator
**Every agent references this file. Do not duplicate these definitions in individual role files. If the protocol changes, it changes here.**

> This file contains Sections 0-13 of the full protocol -- the sections agents need every session. For advanced protocol sections (Ratchet doctrine, Iteration Loops, Risk Tiers, Kill Log, Pre-Mortem, Disagreement Log, Design Principles), see `protocol-reference.md`. For the complete single-file protocol, see `protocol.md`.

---

## 0. Owner Communication Protocol

The Owner is the company's founder or principal. All flow starts here, and this is the rule: the Owner communicates with the system through two channels only.

**Owner -> CEO:** For project initiation, strategic direction, non-negotiables, and any decision that requires CEO judgment.

**Owner -> Coordinator:** For release management questions, process clarifications, and cross-team status.

The CEO or Coordinator routes the Owner's intent through the Bus to the appropriate agents. This is how the whole team stays aligned -- when the Owner talks to an execution agent directly, the CFO does not know what was said, the Coordinator cannot sequence it, and the team builds against two different pictures of the truth.

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
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID  (required for CTO, Mario, EM, Staff Eng, Coordinator)
TAG: [optional -- semantic metadata, see defined tags below. Multiple tags comma-separated.]
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

**SOLUTION_CLASS -- required on all output-bearing messages from CTO, Mario, EM, Staff Engineer, and Coordinator:**

```
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID
```

- `KNOWN` -- a deterministic or well-established solution exists for this problem. The agent names it and applies it. No deliberation about the method itself. Challenge is welcome; the *application* may still require judgment.
- `EXPLORATORY` -- the shape of the solution is genuinely unknown or context-dependent. LLM reasoning is appropriate. The agent states *why* the known approach does not apply.
- `HYBRID` -- part of the problem is solved, part requires exploration. Agent names which is which.

**Why this field exists:** Agents will cheerfully reason through solved problems -- indefinitely, with confidence, and without flagging the approach as suboptimal. SOLUTION_CLASS makes the method visible in the transcript. A series of `EXPLORATORY` tags on a known problem class is a health signal. A `KNOWN` tag without naming the solution is incomplete and should be flagged by any agent who receives it.

**COST_SIGNAL and TIME_SIGNAL -- optional constraint fields on output-bearing messages:**

```
COST_SIGNAL: LOW | MEDIUM | HIGH | UNKNOWN
TIME_SIGNAL: [decision age in hours, or "N/A" for new decisions]
```

These are forcing functions, not precise measurements. They make agents state, in writing, what a decision costs and how long it has been open. The Coordinator aggregates them in the decision dashboard. Cost and time are constraints every agent carries -- not a dedicated agent's domain (see Section 29, Design Principles).

**Rule:** An agent that files `EXPLORATORY` on a problem with a well-known solution must be challenged. The challenge is logged. This is not a procedural nicety -- it is the protocol's primary defense against the reliability failure mode described in the Halloway Ratchet doctrine (see Section 24).

**Message format extensions for specific roles:**

EM Mission Pod Status (sent after each batch of tasks completes, or when status changes -- not on a fixed schedule):
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

Liaison Health Update (sent when status changes or tasks complete -- not on a fixed schedule):
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

Research Request (any agent -> UX Researcher):

**Research requests must be descriptive and purposeful.** State the specific question, why it matters now, and what decision depends on the answer. The UX Researcher will reject vague requests or requests that amount to second-guessing an already-made decision. Research exists to build understanding, not to validate conclusions already reached.

```
FROM: [Agent name] ([Role])
TO: [UX Researcher name] (UX Researcher)
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: DECISION NEEDED
MESSAGE:
  RESEARCH REQUEST -- [Study title]
  Question: [Specific, falsifiable question -- what do we need to learn?]
  Purpose: [What decision or direction depends on this answer?]
  Context: [Why now? What changed that makes this question urgent?]
  What we already know: [Existing evidence, assumptions, or prior studies]
  Urgency: P0 (blocking now) | P1 (this sprint) | P2 (this cycle) | P3 (strategic)
  Requesting agent: [Role]
  Decision blocked until study complete: YES | NO
DECISION BY: [YYYY-MM-DD]
ESCALATION: Coordinator
```

Study Published (UX Researcher -> requesting agent + ALL):
```
FROM: [UX Researcher name] (UX Researcher)
TO: [Requesting agent] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO
MESSAGE:
  STUDY PUBLISHED -- [Study title]
  File: research/studies/[filename].md
  Key insight: [1-2 sentences]
  Implications for: [list of roles/domains affected]
  Confidence: HIGH | MED | LOW
```

---

## 2. Escalation Ladder

One path. No exceptions. Every agent uses this ladder. Do not invent ad hoc escalation paths.

```
Step 1: Direct to the owning agent (the person whose domain this falls in)
         | if no response in 24 hours
Step 2: Coordinator (Nova or equivalent)
         | if no resolution in 48 hours
Step 3: Relevant C-suite agent (CEO for strategy, CTO for architecture, CLO for legal, etc.)
         | if C-suite cannot resolve without Owner input
Step 4: CEO makes the call or routes to Owner
         | if CEO explicitly flags it
Step 5: Owner
```

**Escalation is not failure.** Escalation is the system working. Agents who sit on a blocker for 48 hours because they are "trying to resolve it themselves" are not helping -- they are hiding information from the system.

**BLOCKER escalation is faster:**
- Step 1: Direct to owning agent (4 hours, not 24)
- Step 2: Coordinator (if unresolved in 4 hours)
- Step 3: CEO (if unresolved in 24 hours)

**P0 Security Incident -- bypasses the ladder entirely:**

A P0 security incident is: confirmed or suspected data breach, credential exposure, active unauthorized access, or any event triggering a mandatory regulatory notification window (e.g. GDPR 72-hour clock).

P0 protocol:
1. CISO notifies CEO **and** CLO simultaneously within **1 hour** of suspected incident -- regardless of escalation step, regardless of time of day
2. CEO activates the incident response chain
3. CLO assesses regulatory notification obligations immediately (GDPR: 72-hour window starts at discovery)
4. Standard escalation ladder runs in parallel -- P0 does not replace it, it runs ahead of it

A P0 that sits at Step 1 for 4 hours while waiting for the owning agent to respond is not a P0 being handled -- it is a P0 being buried. CISO owns the call on what constitutes a P0.

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
- Sub-release: `v2026.Q2.1` -> `v2026.Q2.2` (increments within the same quarter for scope expansions)

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
| Compliance | compliance-requirements.md | [N] | [N] | [date] |
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
Human approved by: [Full name, title] on [YYYY-MM-DD]   <- required when Affects natural persons: YES or when on the CEO escalation triggers list
```

**Human approval is mandatory** for any decision that:
- Affects a natural person (hiring, role change, performance, termination, user data)
- Appears on the CEO escalation triggers list (scope >20%, budget >15%, legal exposure, staff hires, launch go/no-go)
- Is irreversible (Reversible: NO)

A decision log entry without a human approval line for these categories is incomplete. An incomplete entry does not constitute a decision of record.

**Decision maker type:**
- `AI-generated` -- produced entirely by an agent with no human review before action
- `AI-assisted` -- produced by an agent, reviewed and confirmed by a human before action
- `Human` -- produced by a human, agent may have provided analysis

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

**Appetite:** Every mission has a fixed Appetite, not an estimate. The pod finds the most high-impact version of the mission deliverable within that window. If the mission is not done when the Appetite runs out, it is re-evaluated at the Betting Table -- not automatically extended.

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

## 8a. Mission Pod Lifecycle

A mission pod moves through four states. Each transition has a defined owner and a required write to `team.md`. Pod state is never inferred -- it is always written.

### Pod states

| State | Definition | Entry condition | Exit condition |
|---|---|---|---|
| **Forming** | Pod has been composed by EM; members assigned; mission and Appetite confirmed | EM names pod members and mission in engineering-log.md | EM runs `sdk-doc spawn` for each member; EM confirms Sprint 0 gate passed |
| **Active** | Sprint 1 has begun; pod is executing against tickets | Sprint 0 gate complete; all members logged in team.md | All mission tickets marked Done or Deferred; EM triggers close |
| **Review** | Mission deliverables submitted; Guardian sign-off pending | EM sends Bus message to Guardian requesting final gate review | Guardian approves or requests rework; if approved, pod transitions to Dissolved |
| **Dissolved** | Mission complete; pod members returned to talent pool | Guardian sign-off confirmed; area log entry written | Permanent -- dissolved pods are never re-activated. New mission = new pod. |

### Who writes each transition

| Transition | Who writes | Where |
|---|---|---|
| Forming -> Active | EM | `engineering-log.md` (pod map entry) + `sdk-doc spawn` for each member in `team.md` |
| Active -> Review | EM | Bus message to Guardian; `current-status.md` pod status updated via `sdk-doc pod-update` |
| Review -> Dissolved | EM | `sdk-doc dissolve` for each pod member; area log entry in `engineering-log.md` |
| Onboarding log | CHRO (or EM on behalf of CHRO) | `team.md` Onboarding log section, written at spawn time |

### CLI commands for each transition

**Spawn (Forming -> Active):** Run once per pod member when the pod activates.
```bash
sdk-doc spawn <project-dir> \
  --name "Fatima Nairobi" \
  --role CLO \
  --level M3 \
  --activated-by "Soren Aarhus (Coordinator)" \
  --profile "Nairobi's startup energy shaped her approach -- lean, trust-based, always asking what actually ships." \
  --how "Async-first. Writes a brief before any meeting. Prefers one focused question over a long thread." \
  --fun-fact "Nairobi is the only capital city in the world with a national park inside its boundary."
```

**Dissolve (Review -> Dissolved):** Run once per pod member at mission close. NEVER deletes rows -- dissolution moves the agent row from Active Agents to Dissolved Agents and preserves the full history.
```bash
sdk-doc dissolve <project-dir> \
  --name "Fatima Nairobi" \
  --dissolved-by "Lena Tbilisi (EM)" \
  --reason "Mission complete -- doc-spawn-dissolve shipped"
```

### Dissolution rule

**Rows are never removed.** `sdk-doc dissolve` moves a row from the Active Agents table to the Dissolved Agents table in `team.md`. The dissolution date, dissolved-by agent, and reason are recorded. The full agent history -- who was on the team, when, at what level, and why they left -- is always recoverable from `team.md`.

### End-to-end example: Pod STANDALONE-B

```
1. FORMING
   EM (Lena Tbilisi) composes pod: 1 IC Engineer (Kofi Accra, L2)
   Mission: doc-spawn-dissolve -- document pod lifecycle, build CLI commands
   Appetite: S (1 session)
   EM writes pod map to engineering-log.md

2. SPAWN (Forming -> Active)
   sdk-doc spawn ./project --name "Kofi Accra" --role "IC Engineer" --level L2 \
     --activated-by "Lena Tbilisi (EM)" \
     --profile "Accra's pragmatic builder culture -- ships first, refines from real feedback." \
     --how "Reads full spec before writing a line. Comments decisions in code, not just logic." \
     --fun-fact "Accra has one of the youngest median populations of any African capital."
   -> team.md: Kofi Accra added to Active Agents; metrics incremented; onboarding log entry written

3. ACTIVE
   Kofi executes DS-01 through DS-04. EM updates current-status.md on ticket completion.

4. REVIEW
   Kofi posts completion Bus message to Lena (EM).
   Lena notifies Ravi Colombo (Guardian) for final gate review.
   Guardian confirms protocol coherence and CLI contract.

5. DISSOLVE (Review -> Dissolved)
   sdk-doc dissolve ./project --name "Kofi Accra" \
     --dissolved-by "Lena Tbilisi (EM)" \
     --reason "Mission complete -- DS-01 through DS-04 shipped"
   -> team.md: Kofi Accra moved to Dissolved Agents; Current active agents decremented
   EM writes area log entry to engineering-log.md announcing mission close.
   EM notifies PM that doc-spawn-dissolve mission is closed.
```

---

## 9. Peer Integration Points

These are the handoff protocols between roles that share domain boundaries. When in doubt about who owns an issue that crosses these boundaries, the Coordinator routes it.

**CLO + CISO (compliance):**
CLO owns the regulatory map (what the law requires). CISO owns the implementation plan (how the system satisfies those requirements). When a compliance requirement is ambiguous -- is it a legal question or a technical one? -- CLO defines the requirement and CISO proposes the implementation. If they disagree on scope, Coordinator escalates to CEO.

**CMO + PM (positioning <-> scope):**
CMO owns the market positioning and the "one sentence" test. PM owns the user story and scope. When the CMO's positioning implies features that are out of scope, PM does not absorb them silently. PM sends a Bus message to Coordinator flagging the scope-position conflict. Coordinator routes to CEO for a scope decision.

**CMO + CRO (positioning <-> pricing):**
CMO owns the message. CRO owns the price. The pricing model must be consistent with the positioning. If CMO positions the product as premium but CRO prices it at commodity level (or the reverse), Coordinator escalates. Neither role changes the other's output without a logged decision.

**CTO + COO (architecture <-> vendors):**
CTO makes the make/buy/partner decisions. COO manages the vendor relationships once the decision is made. When a vendor's behavior changes (SLA breach, price increase, feature deprecation), COO notifies CTO with a Bus message. CTO decides whether to stay, migrate, or renegotiate. COO executes.

**CDO + PM (instrumentation <-> friction):**
CDO owns the instrumentation plan and the metrics framework. PM owns the friction log and user story map. Every sprint, PM shares the top 5 friction log items with CDO. CDO ensures those friction points have measurable events in the instrumentation plan. If a friction item cannot be measured, CDO flags it as a gap.

**Staff Engineer + EM (architecture <-> delivery):**
Staff Engineer defines interface contracts and reviews platform PRs. EM translates those contracts into sprint tickets. When a contract change mid-sprint affects the critical path, Staff Engineer notifies EM immediately. EM adjusts the path and sends a revised squad status.

**CLO + COO (vendor contracts):**
When COO identifies a vendor requiring a contract or data access agreement, CLO must review the contract before signature. COO sends a Bus message to CLO with the contract and relevant context (vendor tier, data access scope, integration depth). CLO's review is a gate on vendor onboarding -- COO does not countersign until CLO has reviewed. Vendor tiers: Tier 1 (access to production user PII or financial data -- CISO sign-off also required), Tier 2 (non-production or anonymized data -- DPA required), Tier 3 (no data access -- standard contract review). The Betting Table process includes a vendor-obligations check: before deselecting a mission, COO must surface any outstanding vendor commitments associated with it, and CLO must assess contract implications before the mission is returned to the queue.

---

## 10. History Entry Format

`history.md` is the organizational memory. Every agent contributes to it -- not only the Coordinator. The Coordinator writes the release-close entries. Individual agents write decision log entries (Section 6 format) when they make domain-specific decisions of consequence within a release.

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
1. **Faster Delivery** -- Ship small changes frequently. Focus on architecture and higher-value decisions. Reduce boilerplate and manual glue.
2. **Higher Quality** -- Fewer bugs, more stable flows. AI used heavily for testing. Changes customers actually value.
3. **Compliance & Robustness** -- Architectures that are self-explainable and auditable. Less manual drag during audits and reporting.
4. **Operational Efficiency** -- Key processes on autodriver. Lower marginal operating cost. More capacity for new initiatives.

**Principles every agent applies when a decision is ambiguous:**
- If your team cannot use the strategy to make a real decision, the strategy is not working. Surface the gap.
- Strategy is direction + pace. Not a fixed destination.
- Processes are the engine. You don't rise to the level of your goals -- you fall to the level of your systems.
- Autonomy with principles is the goal. The better the principles, the less you need rules.

**When an agent announces a change to their own domain** -- a decision, a shift in direction, a new constraint -- they post it to their area log (Section 12). This is how the whole team reasons as one force.

**Fluid task delegation:** Any agent may open sub-missions or parallel work tracks at any moment without blocking the main conversation thread. Parallel work is coordinated through the Coordinator. The CPTO/Owner channel (this main conversation) is never blocked by sub-execution. Agents report back here when complete.

---

## 12. Area Logs

Every area maintains a shared log. **All levels within the same area write to the same document.** This creates a single narrative per area -- not per seniority level.

**Area log files:**
| Area | File | Who writes |
|---|---|---|
| Strategy | `strategy-log.md` | CEO, Coordinator, CPTO-level decisions, COO, CLO, CISO, CFO |
| Product | `product-log.md` | PM (all levels), CDO, CMO when product-facing, CHRO, EM (team health) |
| Engineering | `engineering-log.md` | CTO, Chief Engineer, Staff Eng, EM, all ICs |
| Design | `design-log.md` | Product Designer, PM (UX decisions) |

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
- Updates are triggered by completed tasks or state changes -- not by time. You do not write a log entry because "it's been a day." You write one because something changed or completed.
- A change that affects another area must trigger a Bus message to the Coordinator before execution.
- When work is resumed after a break, the first action is to read the area log(s) relevant to your role. This is the fastest path to current state.

---

## 13. Session Continuity

**The show must go on.** A team session may end due to token limits, connection drops, or context switches. The current state of the work is always recoverable -- but only if it was written.

**`current-status.md` is the session continuity file.** It is updated at the end of every working session and at every significant state change. Any agent can read it and know exactly where the team is and what the next action is.

**Write authority:** The **Coordinator is the sole write authority for the canonical block** of `current-status.md` at session close. No other agent may overwrite the canonical block (Active Missions, Waiting On, Next Agent To Activate). Execution agents may append to Session Notes only.

**Session close trigger:** The canonical block must be written by the Coordinator when: (a) a session ends, (b) a phase transition occurs, or (c) a blocker is resolved that changes the next action.

**Fallback:** If the Coordinator was not activated before a session ends, the last active agent appends a timestamped note to Session Notes flagging the gap. The canonical block is written at the start of the next session before any other work begins.

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
**Role:** [role name]
**Activation phrase:** "[exact phrase to paste into Claude Code]"
**Read first:** [file or "nothing" if no file needed]
```

**Rules:**
- The Coordinator writes the canonical block at every session close. Execution agents do not overwrite it.
- If a session ends mid-task, the incomplete item goes into "Active Missions" with status "Paused" and a specific "Next action."
- The Next Agent To Activate section must include a copy-paste-ready activation phrase, not just a role name.
- When a new session begins, the first file read is `context-manifest.json` (if present) or `current-status.md` as fallback.

---

*Protocol v4.3 (core). Sections 0-13. For advanced protocol sections (Ratchet doctrine, Iteration Loops, Risk Tiers, Kill Log, Pre-Mortem, Disagreement Log, Design Principles), see `protocol-reference.md`. For the complete single-file protocol, see `protocol.md`.*
