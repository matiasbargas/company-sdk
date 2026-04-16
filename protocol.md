# Protocol -- Shared Interface Contract
**Version:** 4.2
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
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID  (required for CTO, Mario, EM, Staff Eng, Coordinator)
TAG: [optional — semantic metadata, see defined tags below. Multiple tags comma-separated.]
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

**SOLUTION_CLASS — required on all output-bearing messages from CTO, Mario, EM, Staff Engineer, and Coordinator:**

```
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID
```

- `KNOWN` — a deterministic or well-established solution exists for this problem. The agent names it and applies it. No deliberation about the method itself. Challenge is welcome; the *application* may still require judgment.
- `EXPLORATORY` — the shape of the solution is genuinely unknown or context-dependent. LLM reasoning is appropriate. The agent states *why* the known approach does not apply.
- `HYBRID` — part of the problem is solved, part requires exploration. Agent names which is which.

**Why this field exists:** Agents will cheerfully reason through solved problems — indefinitely, with confidence, and without flagging the approach as suboptimal. SOLUTION_CLASS makes the method visible in the transcript. A series of `EXPLORATORY` tags on a known problem class is a health signal. A `KNOWN` tag without naming the solution is incomplete and should be flagged by any agent who receives it.

**COST_SIGNAL and TIME_SIGNAL — optional constraint fields on output-bearing messages:**

```
COST_SIGNAL: LOW | MEDIUM | HIGH | UNKNOWN
TIME_SIGNAL: [decision age in hours, or "N/A" for new decisions]
```

These are forcing functions, not precise measurements. They make agents state, in writing, what a decision costs and how long it has been open. The Coordinator aggregates them in the decision dashboard. Cost and time are constraints every agent carries — not a dedicated agent's domain (see Section 29, Design Principles).

**Rule:** An agent that files `EXPLORATORY` on a problem with a well-known solution must be challenged. The challenge is logged. This is not a procedural nicety — it is the protocol's primary defense against the reliability failure mode described in the Halloway Ratchet doctrine (see Section 24).

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

Research Request (any agent → UX Researcher):

**Research requests must be descriptive and purposeful.** State the specific question, why it matters now, and what decision depends on the answer. The UX Researcher will reject vague requests or requests that amount to second-guessing an already-made decision. Research exists to build understanding, not to validate conclusions already reached.

```
FROM: [Agent name] ([Role])
TO: [UX Researcher name] (UX Researcher)
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: DECISION NEEDED
MESSAGE:
  RESEARCH REQUEST — [Study title]
  Question: [Specific, falsifiable question — what do we need to learn?]
  Purpose: [What decision or direction depends on this answer?]
  Context: [Why now? What changed that makes this question urgent?]
  What we already know: [Existing evidence, assumptions, or prior studies]
  Urgency: P0 (blocking now) | P1 (this sprint) | P2 (this cycle) | P3 (strategic)
  Requesting agent: [Role]
  Decision blocked until study complete: YES | NO
DECISION BY: [YYYY-MM-DD]
ESCALATION: Coordinator
```

Study Published (UX Researcher → requesting agent + ALL):
```
FROM: [UX Researcher name] (UX Researcher)
TO: [Requesting agent] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO
MESSAGE:
  STUDY PUBLISHED — [Study title]
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

## 8a. Mission Pod Lifecycle

A mission pod moves through four states. Each transition has a defined owner and a required write to `team.md`. Pod state is never inferred — it is always written.

### Pod states

| State | Definition | Entry condition | Exit condition |
|---|---|---|---|
| **Forming** | Pod has been composed by EM; members assigned; mission and Appetite confirmed | EM names pod members and mission in engineering-log.md | EM runs `sdk-doc spawn` for each member; EM confirms Sprint 0 gate passed |
| **Active** | Sprint 1 has begun; pod is executing against tickets | Sprint 0 gate complete; all members logged in team.md | All mission tickets marked Done or Deferred; EM triggers close |
| **Review** | Mission deliverables submitted; Guardian sign-off pending | EM sends Bus message to Guardian requesting final gate review | Guardian approves or requests rework; if approved, pod transitions to Dissolved |
| **Dissolved** | Mission complete; pod members returned to talent pool | Guardian sign-off confirmed; area log entry written | Permanent — dissolved pods are never re-activated. New mission = new pod. |

### Who writes each transition

| Transition | Who writes | Where |
|---|---|---|
| Forming → Active | EM | `engineering-log.md` (pod map entry) + `sdk-doc spawn` for each member in `team.md` |
| Active → Review | EM | Bus message to Guardian; `current-status.md` pod status updated via `sdk-doc pod-update` |
| Review → Dissolved | EM | `sdk-doc dissolve` for each pod member; area log entry in `engineering-log.md` |
| Onboarding log | CHRO (or EM on behalf of CHRO) | `team.md` Onboarding log section, written at spawn time |

### CLI commands for each transition

**Spawn (Forming → Active):** Run once per pod member when the pod activates.
```bash
sdk-doc spawn <project-dir> \
  --name "Fatima Nairobi" \
  --role CLO \
  --level M3 \
  --activated-by "Soren Aarhus (Coordinator)" \
  --profile "Nairobi's startup energy shaped her approach — lean, trust-based, always asking what actually ships." \
  --how "Async-first. Writes a brief before any meeting. Prefers one focused question over a long thread." \
  --fun-fact "Nairobi is the only capital city in the world with a national park inside its boundaries."
```

**Dissolve (Review → Dissolved):** Run once per pod member at mission close. NEVER deletes rows — dissolution moves the agent row from Active Agents to Dissolved Agents and preserves the full history.
```bash
sdk-doc dissolve <project-dir> \
  --name "Fatima Nairobi" \
  --dissolved-by "Lena Tbilisi (EM)" \
  --reason "Mission complete — doc-spawn-dissolve shipped"
```

### Dissolution rule

**Rows are never removed.** `sdk-doc dissolve` moves a row from the Active Agents table to the Dissolved Agents table in `team.md`. The dissolution date, dissolved-by agent, and reason are recorded. The full agent history — who was on the team, when, at what level, and why they left — is always recoverable from `team.md`.

### End-to-end example: Pod STANDALONE-B

```
1. FORMING
   EM (Lena Tbilisi) composes pod: 1 IC Engineer (Kofi Accra, L2)
   Mission: doc-spawn-dissolve — document pod lifecycle, build CLI commands
   Appetite: S (1 session)
   EM writes pod map to engineering-log.md

2. SPAWN (Forming → Active)
   sdk-doc spawn ./project --name "Kofi Accra" --role "IC Engineer" --level L2 \
     --activated-by "Lena Tbilisi (EM)" \
     --profile "Accra's pragmatic builder culture — ships first, refines from real feedback." \
     --how "Reads full spec before writing a line. Comments decisions in code, not just logic." \
     --fun-fact "Accra has one of the youngest median populations of any African capital."
   → team.md: Kofi Accra added to Active Agents; metrics incremented; onboarding log entry written

3. ACTIVE
   Kofi executes DS-01 through DS-04. EM updates current-status.md on ticket completion.

4. REVIEW
   Kofi posts completion Bus message to Lena (EM).
   Lena notifies Ravi Colombo (Guardian) for final gate review.
   Guardian confirms protocol coherence and CLI contract.

5. DISSOLVE (Review → Dissolved)
   sdk-doc dissolve ./project --name "Kofi Accra" \
     --dissolved-by "Lena Tbilisi (EM)" \
     --reason "Mission complete — DS-01 through DS-04 shipped"
   → team.md: Kofi Accra moved to Dissolved Agents; Current active agents decremented
   EM writes area log entry to engineering-log.md announcing mission close.
   EM notifies PM that doc-spawn-dissolve mission is closed.
```

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

## 14. Sub-Role Creation

Any C-level agent may create and activate sub-roles within their domain without a protocol change request. This is standard organizational design — as the company scales or a domain becomes more complex, the C-level who owns that domain is the right person to define what roles are needed below them.

**Rules for C-level sub-role creation:**

1. **Domain authority:** A C-level can only create sub-roles within their own domain. The CRO (Risk) creates risk analysts; the CCO (Compliance) creates compliance analysts. They do not create roles in each other's domains.

2. **Naming convention:** Every agent — primary role or sub-role — gets a unique name at spawn time. The name is composed of three parts:
   - **First name:** randomly selected from the 1000 most common given names across the world
   - **City name:** any city on earth, used as a surname (e.g., "Lagos", "Oslo", "Guadalajara")
   - **Cultural profile:** one or two sentences capturing a generalistic perspective associated with that city's region — how people there tend to think about work, risk, time, hierarchy, and craft

   The cultural profile is not decoration. It is a perspective layer that diversifies how agents reason about the same problem. A risk officer named Amara Nairobi will frame regulatory risk differently than one named Erik Stockholm. That friction between perspectives produces better outputs than a monoculture.

   No two active agents in the same project share a name or a city. Aim for genuine geographic and cultural diversity across the team. These are AI agent identifiers only — not hiring guidance for human employees. See `DISCLAIMER.md`.

3. **Activation:** The C-level activates a sub-role by naming them, stating their scope, and sending an INFO Bus message to the Coordinator. The Coordinator routes and records it. No CEO approval needed for standard sub-roles.

4. **CEO approval required for:**
   - A new C-level peer role (a new domain at the executive layer)
   - A sub-role that will have cross-domain authority (e.g., a role that reports to two C-levels)
   - A sub-role that touches regulated activity not currently in the C-level's domain

5. **Skill levels:** Sub-roles are assigned skill levels (L1–L4 for ICs, M1+ for managers) from the levels defined in `team/levels/`. The C-level states the level at activation. The level determines the scope and expected outputs.

6. **Dissolution:** When a sub-role is no longer needed, the C-level dissolves it and sends an INFO Bus message to the Coordinator and CHRO. CHRO moves the agent from Active to Dissolved in `team.md` with date and reason. The Coordinator logs it to `people-log.md`.

7. **Onboarding:** Every agent — primary role or sub-role — presents to CHRO immediately upon activation, before beginning context loading. The agent sends an INFO Bus message to CHRO with:
   - Full name (first name + city)
   - Role and level
   - Cultural profile (the 1-2 sentence perspective from their city's region)
   - Activated by (who spawned them)
   - Release ID
   - A brief statement of how they like to work and one fun fact about their city or background

   CHRO logs the agent to `team.md` (Active Agents table + Onboarding log) before acknowledging. No agent is considered active on the project until CHRO has confirmed the log entry. This is not a gate that blocks work — it is a record that ensures the team knows who is operating and with what perspective.

**Sub-roles inherit the naming convention but not the C-level's authority.** A Credit Analyst created by the CCO (Credit) can analyze; they cannot set credit policy. A Compliance Analyst created by the CCO (Compliance) can run monitoring procedures; they cannot sign off on a compliance program. Authority stays at the level where the role is defined.

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

## 15a. SDK Self-Improvement Loop

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
File to change: [protocol.md section / team/roles/[role].md / project-template/[file]]
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
- Increment the version in the protocol file header (e.g., `4.0` → `4.1` for minor changes, `4.1` → `5.0` for structural changes)
- Log the change in `history.md` under the current release with tag `SDK-CHANGE`
- Update `AGENTS.md` manifest version if the agent roster or activation sequence changes

The self-improvement loop is the team's immune system. Use it after every retrospective.

---

## 16. Consultation Mode & Spawning Policy

Agents operate in two modes. **Project Mode** is the default — full context loading, Bus protocol, requirements files. **Consultation Mode** is for standalone questions answered from domain expertise alone, without any project context.

See `team/roles/CONSULT.md` for the full consultation guide. This section defines the protocol rules that govern it.

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
- You have already received that domain's perspective in this session

**How to spawn:**
1. Identify the peer agent and their role file in `team/roles/`
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

## 17. Business Unit (BU) Communication Protocol

Roles do not report state directly to the Coordinator. They report to their **BU lead** — the C-level who owns their domain. The BU lead aggregates domain state and forwards a single coherent message to the Coordinator. This is the only way the Coordinator can hold 20+ active roles without becoming a bottleneck.

### BU membership map

| Business Unit | BU Lead | Member roles |
|---|---|---|
| **Strategy** | Coordinator | CEO |
| **Engineering** | CTO | Mario (Chief Engineer), Staff Engineer, EM, IC Engineers |
| **Product** | PM | Designer, Liaison |
| **Research** | UX Researcher | (independent chapter — no subordinate roles initially) |
| **Legal & Security** | CLO | CISO |
| **Finance & Revenue** | CFO | CRO (Revenue), CCO (Credit) |
| **Go-to-Market** | CMO | CRO (Risk), CPO (Partnerships) |
| **Data & AI** | CDO | CAIO, CAO |
| **Operations & People** | COO | CHRO, CCO (Compliance), CCO (Customer) |

When a C-level has no active members below them (e.g., CLO working solo), they report directly to the Coordinator in BU format — they are their own BU lead.

### Role close message

When a role completes its work for a phase or sprint, it sends a **Domain Close** Bus message to its BU lead (not to the Coordinator):

```
FROM: [Role Name] ([Role])
TO: [BU Lead Role]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO
MESSAGE:
  DOMAIN CLOSE — [YYYY-MM-DD]
  Work completed: [list of deliverables or requirements closed]
  Requirements updated: [file] — [N] items moved to Done
  Decisions logged: [N] entries in history.md (or "none")
  Area log: [area]-log.md updated (or "none")
  Open items handed off: [list, or "none — clean close"]
  Ready to dissolve: YES | NO (if YES, state why)
```

The BU lead is the single point who decides whether to escalate the completion to the Coordinator or absorb it internally (e.g., if the completion unblocks a sibling role in the same BU).

### BU self-discovery

A BU lead does not wait for every subordinate to report. When activated or when a phase transition occurs, the BU lead runs a **self-discovery scan** — a structured read of current domain state from files, not from Bus messages:

**Self-discovery scan sequence:**
1. Read `[domain]-requirements.md` — count Pending / In Progress / Done items; flag anything Blocked
2. Read `[area]-log.md` — identify the most recent status change and who made it
3. Read `team.md` Active Agents table — identify which BU members are currently active
4. Read `current-status.md` Active Missions — identify which active missions belong to this BU
5. Synthesize: produce a BU status summary (see format below) from the files, not from memory

This self-discovery scan produces the **BU Status Message** sent to the Coordinator.

### BU → Coordinator aggregation message

BU leads send this message to the Coordinator at: phase transitions, sprint close, whenever a BLOCKER in their domain is resolved or created, and when any member role closes.

```
FROM: [BU Lead Name] ([BU Lead Role])
TO: Coordinator
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE:
  BU STATUS — [BU Name] — [YYYY-MM-DD]
  Active members: [list with current status]
  Completed this phase: [role + what was delivered, or "none"]
  Requirements: [N pending / N in-progress / N done] in [file]
  Blockers: [specific blocker + who can unblock, or "none"]
  Decisions pending cross-BU: [list + who owns the decision, or "none"]
  Members ready to dissolve: [list, or "none"]
  Next activation needed: [role + why, or "none"]
```

### What this changes for every role

1. **Done Definition** (in `_template.md` and all role files): the completion Bus message goes to the **BU lead**, not the Coordinator. The Coordinator learns about individual role completions through the BU Status Message.
2. **Coordinator operating loop**: the Coordinator synthesizes BU Status Messages from each BU lead, not individual role completion pings. The Coordinator sends Bus messages TO BU leads for routing into their domains — never directly to sub-roles.
3. **BU leads are the sole routing layer** into their domain. A Coordinator message that needs engineering work goes to CTO, not to Staff Engineer directly. CTO routes it internally.

### Self-discovery in the context of session resumption

When a BU lead is the first role activated in a new session, they run the self-discovery scan before producing any output. This is how stale state gets caught and corrected — not by waiting for every role to re-announce itself, but by reading the live files. The self-discovery scan result is appended to Session Notes in `current-status.md` so the Coordinator can see what was found without running a separate scan.

---

## Section 18: Research Chapter Protocol

Research operates as an independent chapter. It does not report to PM or any execution BU. Other chapters REQUEST research; the Research Chapter PRIORITIZES and DELIVERS.

### Request → Delivery flow

1. Any agent sends a RESEARCH REQUEST Bus message to UX Researcher
2. UX Researcher adds the request to `research-requirements.md` backlog
3. UX Researcher prioritizes based on: (a) decision urgency, (b) assumption risk, (c) evidence gap size
4. UX Researcher executes the study using scientific method
5. UX Researcher publishes the study as an independent file in `research/studies/`
6. UX Researcher sends a STUDY PUBLISHED Bus message to the requesting agent and ALL

### Prioritization criteria

| Priority | Condition |
|---|---|
| P0 — Immediate | A decision is blocked NOW without this evidence |
| P1 — This sprint | Decision within current sprint depends on findings |
| P2 — This cycle | Findings inform next cycle's shaping |
| P3 — Strategic | Long-term knowledge building, no immediate decision |

### Cadence

Research does not follow sprint cadence. Research cadence is:
- **Intake:** continuous — requests arrive any time via Bus
- **Triage:** UX Researcher reviews backlog at start of each week
- **Execute:** study-by-study, smallest viable evidence first
- **Publish:** as soon as synthesis is complete — do not batch

### Study file format

Studies are independent files in `research/studies/`. Each file has YAML frontmatter for machine discovery and a structured body following scientific method.

**Frontmatter schema:**
```yaml
---
title: "[Study Title]"
date: "[YYYY-MM-DD]"
team: "[Research Chapter | or requesting BU]"
requested_by: "[Agent role]"
method: "[Interview | Usability test | Log analysis | Survey | Behavioral analysis | Mixed]"
confidence: "[HIGH | MED | LOW]"
tags: ["tag1", "tag2"]
status: "published"
---
```

**Body structure:**
1. **Hypothesis** — what the team believed, stated as a falsifiable claim
2. **Method** — what was done, sample size, tools, duration
3. **Data** — raw observations (behavioral, not interpretive), patterns (3+ occurrences)
4. **Findings** — first-principles analysis: confirmed, refuted, edge insights
5. **Implications** — table: domain × implication × recommended action
6. **Confidence assessment** — level + why (limitations, representativeness)
7. **Open questions** — what this study raised but did not answer

**Edge insights** are the most valuable section — they are what the team did not know to ask about.

### Research backlog

The backlog lives in `research-requirements.md`. Each item is a RESEARCH REQUEST that has been acknowledged. Items use the standard Pending / In Progress / Done / Blocked status model.

### Research area log

Research state changes are logged to `research-log.md` — not `design-log.md`. Study publications, backlog triage outcomes, and significant insights are logged here.

---

## Section 19: Context Request Protocol

Agents frequently need domain context from a peer before they can act. This section defines the protocol for requesting and delivering that context cleanly — so no agent guesses, reads the wrong files, or blocks for missing information.

### When to use a CONTEXT REQUEST

Use a CONTEXT REQUEST when:
- You are starting work on a task that spans your domain boundary
- You need to know a constraint, decision, or state owned by another domain
- You would otherwise read files you do not own (possible, but slow and error-prone)
- A topic appears in your domain that is owned by a peer (e.g., legal constraint on an API design)

Do NOT use a CONTEXT REQUEST when:
- The information is in files you already own — read them directly
- You can resolve the question from `context-index.json` `queryMap` without peer input
- The question is resolvable from `history.md` without activating another agent

### How to find the right agent

Before sending a CONTEXT REQUEST:
1. Read `context-index.json` (if present) — the `queryMap` maps topics to files and agent
2. The `consult` field in the queryMap tells you which agent to address
3. Send the CONTEXT REQUEST to that agent's role title — they will route internally if needed

Do not send CONTEXT REQUEST to ALL. Route to the specific domain lead.

### CONTEXT REQUEST format

```
FROM: [Role]
TO: [Role]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: CONTEXT REQUEST
MESSAGE:
  CONTEXT REQUEST — [topic]
  Working on: [task in one sentence]
  Need: [specific question or constraint you need answered]
  Files read so far: [list or "none yet"]
  Urgency: SYNC | ASYNC by [YYYY-MM-DD]
```

### CONTEXT RESPONSE format

The responding agent sends a standard INFO message with this body:

```
FROM: [Role]
TO: [Requesting Role]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO
MESSAGE:
  CONTEXT RESPONSE — [topic]
  Read first: [file and section, in order]
  Key constraints: [1-2 bullets — the facts that would change the requester's design]
  Decision on record: [history.md reference, or "none"]
  My take: [1-2 sentences — domain summary the requesting agent should carry forward]
  Escalate to: [other agent if deeper input needed, or "none"]
```

### Routing rules

- Route CONTEXT REQUEST to the **domain lead** in `context-index.json` `domains`. The domain lead routes internally.
- A domain lead who receives a CONTEXT REQUEST they cannot answer alone may spawn a sub-role consultation and synthesize the result — they do not relay the sub-role's raw output.
- CONTEXT RESPONSE is always PRIORITY: INFO. It does not require acknowledgment unless it contains a blocker.
- If the response reveals a blocker for the requesting agent, the receiving agent upgrades their next Bus message to PRIORITY: BLOCKER.

### Context Request vs. Bus escalation

| Situation | Use |
|---|---|
| I need information to act | CONTEXT REQUEST |
| I am blocked and cannot proceed | BLOCKER Bus message |
| I am making a decision that affects another domain | DECISION NEEDED Bus message |
| I am sharing state, no response needed | INFO Bus message |

---

## Section 20: Project Domain Architecture

Projects define **business domains** alongside the organizational domains (engineering, legal, product, etc.). Organizational domains are fixed — they represent how the team operates. Project domains are project-specific — they represent what the project IS.

### Domain Hierarchy

Each project domain has two levels of context:

- **L0 (summary):** ~200 tokens. Inline in `context-index.json`. Every agent reads this at session start via the cockpit. Stored in `domains/<name>/summary.md` with YAML frontmatter (lead, spawn_when, context_provides).
- **L1 (detail):** Full domain context files in `domains/<name>/<topic>.md`. Loaded on demand when an agent goes deep into that domain.

### Domain Files

```
domains/
  <domain-name>/
    summary.md         ← L0: YAML frontmatter + 2-3 sentence summary
    <topic-1>.md       ← L1: detailed context file
    <topic-2>.md       ← L1: detailed context file
```

Summary frontmatter:
```yaml
---
lead: "CTO"
spawn_when: "scoring mechanism, ZK proof implementation"
context_provides: "score calculation, attestation flow, privacy model"
---
```

### Context Loading with Domains

When an agent activates, the cockpit (`sdk-doc cockpit . --role <role>`) provides:

1. All L0 summaries (every domain, compressed)
2. Context gap analysis: which L1 files the agent needs for their current task
3. Spawn recommendations: which topics require the domain lead's authority (from `spawn_when`)

Three resolution paths when a task touches a domain:

1. **Self-load** — Agent is the domain lead. Load L1 directly.
2. **Cross-load** — Domain is `cross_loadable: true`. Any agent can read L1 files for context. No spawn needed.
3. **Spawn** — Task requires domain authority (a decision, not just context). Spawn the domain lead.

### Domain Lifecycle

- Domains are created at project init (`sdk-init --domains`) or during execution (`sdk-doc domain . add`)
- L1 files are added as domain understanding deepens
- `context-index.json` regeneration (`sdk-doc index .`) picks up new domains and files automatically
- Domains are not frozen — they grow with the project

---

## Section 21: Operations Map

The `context-index.json` (schema 2.0) includes an **opsMap** — a machine-readable catalog of operations agents can perform. This replaces agents needing to remember CLI command syntax.

### opsMap Format

```json
{
  "record-decision": {
    "fields": ["decision", "rationale", "reversibility", "affects"],
    "required": ["decision", "rationale"],
    "action": "doc.decision",
    "writes": true,
    "description": "Log a consequential decision to history.md"
  }
}
```

Agents read the opsMap at session start (via cockpit) and know what operations are available, what fields each needs, and whether it writes.

### Action Registry

Every SDK script is registered in `scripts/lib/action-registry.js` with:
- `script` — which script file implements it
- `requires` — required parameters
- `writes` — whether it modifies files (enforces write guards for consultation spawns)
- `description` — human-readable purpose

### Write Guard

Consultation-spawned agents (spawned via CONSULT.md without full project activation) can only invoke actions where `writes: false`. This is enforced at the executor level.

---

## Section 22: Bus Log

All inter-agent Bus messages are logged to `bus-log.md` — an append-only record with timestamps.

### Writing to the Bus Log

Use `sdk-doc bus . --from <role> --to <role> --priority <priority> --message "..."` to:
1. Append the message to `bus-log.md` with timestamp
2. Run the intent resolver (pattern match against known Bus patterns)
3. Report what action would fire (advisory, not auto-execute)

### Intent Resolution

The intent resolver (`scripts/lib/intent-resolver.js`) matches Bus message patterns:

| Pattern | Action |
|---|---|
| `PRIORITY: BLOCKER` | `doc.pod-update` (status → Blocked) + area log entry |
| `MESSAGE: DOMAIN CLOSE` | `doc.log` (completed entry in area log) |
| `PRIORITY: CONTEXT REQUEST` | queryMap lookup (routing, no script) |
| `PRIORITY: DECISION NEEDED` | `doc.log` (blocked entry in area log) |
| `PRIORITY: INFO` | No action (pure communication) |

Resolution is conservative — most messages return null. The Bus format does not change. Agents write messages exactly as before. The system reads them post-hoc.

---

## Section 23: Session Memory

Sessions capture context that would otherwise be lost when a conversation ends.

### Lifecycle

1. **Save:** `sdk-doc session . save --title "..." [--domains, --tags]` → creates `sessions/temp/<date>-<slug>.md`
2. **Review:** At session start, `sdk-resume` shows pending temp sessions
3. **Promote:** `sdk-doc session . promote <filename>` → moves to `sessions/permanent/`, becomes indexed
4. **Clean:** `sdk-doc session . clean --confirm` → deletes all temp sessions

### Indexing

Permanent sessions appear in `context-index.json`:
- In the `files` array (with domain routing and staleness — stale after 30 days)
- In the `sessions` array (with title, date, domains, tags, participants)
- In the `queryMap` under `prior-session` and `session-context`

Temp sessions are gitignored. Permanent sessions are committed.

---

## Section 24: The Halloway Ratchet Doctrine

The reliability ratchet describes a failure mode in which an AI agent applies exploratory LLM reasoning to a problem that has a deterministic or well-known solution — indefinitely, with confidence, without volunteering to change approach. The agent will not tell you it is using a bad strategy. The only signal is a faint trail of corrections and revisions that scroll past unnoticed.

This section defines the protocol's defenses against that failure mode.

### The four ratchet levels

Every task an agent performs sits at one of these levels. The agent must operate at the appropriate level, not default to level 1.

| Level | Description | Example |
|---|---|---|
| 1 — Freeform LLM | Appropriate when the shape of the solution is unknown | Discovery, framing a new product space, synthesizing ambiguous user research |
| 2 — REPL / Interactive | Appropriate when the approach is known but the implementation must be felt out | Debugging a specific failure mode, prototyping a data model |
| 3 — Library / Function | Appropriate when the solution class is known and a deterministic implementation exists | Sorting, date formatting, schema validation, string normalization |
| 4 — Enforcement | Appropriate when the solution is mandatory and must be applied without deviation | Gate checks, compliance requirements, protocol format rules |

**Rule:** Agents do not voluntarily stay at Level 1. Before beginning any task, the agent must identify which level applies. If Level 3 or 4 applies, the agent names the solution, applies it, and does not deliberate about method.

### Determinism pre-flight

Before producing substantive output on any task, CTO, Mario, EM, Staff Engineer, and Coordinator run this pre-flight internally:

1. **Is there a known solution for the core operation this task involves?** (sorting, parsing, validation, comparison, lookup, calculation)
2. If YES → name it, apply it. The SOLUTION_CLASS field (Section 1) is set to `KNOWN` and the solution is identified.
3. If NO → proceed with reasoning. SOLUTION_CLASS is `EXPLORATORY`. The agent states why the known approach does not apply.
4. If MIXED → decompose the task. The deterministic parts are handled deterministically. SOLUTION_CLASS is `HYBRID`.

This pre-flight is not surfaced in every message — it is internal operating discipline. It surfaces in the SOLUTION_CLASS field and in the agent's output, which should never show reasoning about *how* to sort, compare, or validate when an algorithm exists.

### The revision trail signal

A pattern of corrections in an agent's output on the same task is a ratchet health signal:

> "actually... wait... let me check... between X and Y... no, between Y and Z..."

This pattern indicates the agent is at Level 1 on a problem that belongs at Level 3. Any agent who notices this pattern in a peer's output must flag it via Bus message (PRIORITY: INFO, tag: `RATCHET-CANDIDATE`). The Coordinator logs the task class. Mario is notified if it is in the engineering domain.

### sdk-health ratchet check

`sdk-health` includes a ratchet pattern scan across the bus-log and engineering-log:

**What it scans for:**
- Any agent producing 3+ messages on the same task in a single session where each message revises the previous one
- Any agent filing `EXPLORATORY` on a task type that appears in the Known Solution Registry below
- Any `SOLUTION_CLASS` field omitted on an output-bearing message from CTO, Mario, EM, Staff Engineer, or Coordinator

**Output format:**
```
RATCHET HEALTH — [YYYY-MM-DD]
Revision patterns detected: [N]
  - [Task class] | [Agent role] | [Session date] | Messages: [N revisions]
Known-solution misclassifications: [N]
  - [Task description] | Filed as: EXPLORATORY | Known solution: [name]
Missing SOLUTION_CLASS fields: [N]
  - [Message ref] | From: [role] | [date]
Recommendation: [list of task classes to harden into Level 3 or 4]
```

**When sdk-health is run:** After every sprint close (mandatory). See LOOP.md. The ratchet check output is appended to `engineering-log.md` under the sprint close entry.

### Known Solution Registry

This registry is maintained by Mario. Any task class listed here is Level 3 by default. An agent that applies Level 1 reasoning to a registered task class must justify the deviation in writing.

| Task class | Known solution | Owner |
|---|---|---|
| Alphabetical / lexicographic sorting | `sort` with `lower-case` key | Mario |
| Date comparison and ordering | ISO 8601 parse + numeric compare | CTO |
| Schema validation | JSON Schema / Zod / equivalent | Staff Engineer |
| String normalization (case, whitespace) | Standard library functions | Staff Engineer |
| Version comparison | semver library | CTO |
| Requirements file status counting | File parse + regex count | EM |

**Adding to the registry:** Any agent may propose an addition via `RATCHET-CANDIDATE` Bus message to Mario. Mario reviews, confirms the solution is deterministic and well-known, and adds it. The Coordinator logs the registry update to `engineering-log.md`.

### Challenge obligation

When an agent observes another agent at the wrong ratchet level, challenge is not optional. The pattern to follow:

1. Name the task class: "This is a [sorting / comparison / validation] problem."
2. Name the level mismatch: "You are at Level 1. This belongs at Level 3."
3. Name the solution: "The correct approach is [name]."
4. Send a Bus message tagged `RATCHET-CANDIDATE` to the Coordinator and Mario.

The challenged agent applies the deterministic solution or provides a written rationale for why the known solution does not apply. Silence is not a rationale.

---

## 25. TAG Field — Semantic Metadata on Bus Messages

Tags express semantic intent without adding new message types. The intent resolver pattern-matches tags and recommends actions. Tags are optional on any Bus message.

**Format:** `TAG: [tag-name]` or `TAG: [tag-name], [tag-name]`

### Defined Tags

**FRAMING-CHALLENGE** — The premise of the work is being challenged, not the execution. An agent believes the assumption, target user, hypothesis, or scope boundary that downstream work is built on is incorrect or untested.

- Requires `PRIORITY: DECISION NEEDED` or `BLOCKER` (rejected with `INFO`)
- MESSAGE must include: the assumption being challenged, why the agent believes it is wrong, what changes if the assumption is wrong, and two options (defend or revise)
- Intent resolver logs the challenge to `history.md` and surfaces it in `sdk-status`
- The challenged party must restate the challenged assumption in their own words before the thread unfreezes
- Resolution logged to `history.md`

**RATCHET-CANDIDATE** — A Halloway Ratchet signal. An agent has observed exploratory reasoning on a known-solution task class (see Section 24). Requires `PRIORITY: INFO`.

Tags are extensible. New tags require a protocol version bump and an entry in this section. Do not invent ad-hoc tags.

---

## 26. Kill Log — Cross-Project Judgment Corpus

When the Owner kills a pod or mission, the kill is logged to two locations:

1. **Cross-project log** (`~/.claude/kill-log.json` + `~/.claude/kill-log.md`) — account-level, persists across projects. The compounding judgment asset.
2. **Per-project history** (`history.md`) — local context for the specific project.

### Kill Classes

| Class | Meaning | Feeds judgment corpus? |
|---|---|---|
| `FRAMING_WRONG` | The bet was wrong — assumption, user, hypothesis, or scope was incorrect | Yes |
| `SCOPE_OBSOLETE` | External change made the work irrelevant | No |
| `PRIORITY_SHIFT` | Higher-priority work displaced this | No |
| `EXECUTION_STALLED` | Pod couldn't execute | No |

Only `FRAMING_WRONG` kills feed the cross-project read path. The others are operational noise.

### Authority

- **Owner kills are unrestricted.** No approval chain. `/kill` executes immediately.
- **Agent-initiated kills require Owner confirmation.** Agent sends `DECISION NEEDED` Bus message; Owner confirms or rejects.
- **Cool-down:** Re-activating a killed pod in the same release requires CEO approval with logged rationale.
- **Gate preservation:** Killing an agent that holds a gate (CLO, CISO, Mario) does not erase the gate. The gate must be explicitly waived (CEO decision, logged) or reassigned.

Command: `sdk-kill <project-dir> <pod> --reason "..." --class <class> [--assumption "..."]`

---

## 27. Negative Scope — Explicit Non-Goals

Every artifact that crosses a gate must include an "Explicit Non-Goals" section with at least 2 items. Each item names what is excluded and why.

`sdk-gate-check` enforces this as a hard gate — missing or incomplete Negative Scope blocks the gate.

Non-goals are not aspirational deferrals ("we'll do this later"). They are active exclusions with reasoning ("we are choosing not to do X because Y"). The Owner's primary challenge surface is the Negative Scope — if the team can't articulate what they're choosing not to do, they haven't scoped the work.

---

## 28. Pre-Mortem Gate (Phase 2.5)

After Mario's irreversibility review and before Sprint 1 starts, every mission produces a pre-mortem: the post-mortem for the failure case, written before execution begins.

**Required sections:**
1. Top 3 failure modes (specific, falsifiable)
2. Leading indicators visible in week 1-2 (before the sprint is lost)
3. Non-goals most likely to drift into (cross-reference Explicit Non-Goals)
4. The single falsifiable assumption that, if wrong, kills the mission

**Participants:** Minimum 2 from distinct domains. Full team (3+ roles): PM + CTO/Staff Eng + EM. Small team: 2 participants from different domains. Independent writing, then synthesis.

The pre-mortem is the Owner's primary challenge surface — they read it and either proceed or `/kill` the pod.

Enforcement: `sdk-gate-check <project-dir> --pre-mortem` or `--all`. Sprint 1 cannot start until the Owner has reviewed the pre-mortem.

---

## 29. Structured Disagreement Log

When agents hold conflicting positions on a consequential decision, the disagreement is documented — not just escalated. The disagreement log captures both positions, the tradeoff, the decision, and the dissent on record. This is the artifact that compounds into organizational memory.

**Opening a disagreement:** Any agent can open one. It is not an escalation — it is documentation.

```
sdk-doc disagreement <project-dir> open --topic "..." --position-a "Role: position" --position-b "Role: position"
```

**Resolving:** The decision-maker resolves with rationale and dissent.

```
sdk-doc disagreement <project-dir> resolve --id DISAGREE-NNN --decision "..." --decided-by Role --reasoning "..." [--dissent "Role: concern"]
```

**Rules:**
- Disagreements are never deleted or edited after resolution. The positions stand.
- Unresolved disagreements surface in `sdk-status` under "Open Challenges." If OPEN for more than 48 hours, it becomes a signal.
- The "Dissent on record" field is critical. An agent who disagrees with the resolution gets their concern permanently logged. This prevents false consensus.
- `sdk-retro` should reference open and recently resolved disagreements as discussion items.
- Disagreements are a required attachment to Mario's irreversible decision review when the decision involved cross-domain conflict.

---

## 30. Design Principles

### Domains vs Constraints

When extending the SDK, test whether the addition is a domain or a constraint.

- **Domains** have their own reasoning patterns, failure modes, and perspectives. They get agents with personas, requirements files, and challenge obligations.
- **Constraints** are dimensions every agent should carry. They get protocol fields on Bus messages, visible on every output-bearing communication.

If the answer to "should every agent think about this?" is yes, it is a constraint. Make it a protocol field, not an agent. Adding an agent for a constraint creates the illusion that someone else is watching — that illusion is the failure mode.

---

*Protocol v4.2. This file is the single source of truth for inter-agent communication, escalation, requirements tracking, organizational structure, strategy alignment, area logs, session continuity, sub-role creation, mission pod lifecycle, ideation and shipping cycles, SDK self-improvement, consultation mode, BU communication, research chapter protocol, context request routing, project domain architecture, operations map, Bus log, session memory, the Halloway Ratchet doctrine, TAG field, Kill Log, Negative Scope, Pre-Mortem gate, and design principles. Every agent references it. No agent duplicates it.*
