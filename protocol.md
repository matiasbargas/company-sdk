# Protocol -- Shared Interface Contract
**Version:** 4.8
**Retired section numbers (never reuse):** old §32 Risk Tiers (removed f4c51d0; its number was reused by Generative Loops before this rule existed).
**Owner:** Coordinator
**Every agent references this file. Do not duplicate these definitions in individual role files. If the protocol changes, it changes here.**

> **Optimized loading:** For context-window efficiency, agents may load `protocol-core.md` (Sections 0-13, ~800 lines) for routine work and `protocol-reference.md` (Sections 14+) only when the topic requires it. Both files are generated views of this document (`node scripts/split-protocol.js`; `npm test` fails if they go stale) — edit only protocol.md.

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
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID  (required on DECISION NEEDED and BLOCKER from CTO, Mario, EM, Staff Eng, Coordinator; optional on INFO)
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

**SOLUTION_CLASS — required on DECISION NEEDED and BLOCKER messages from CTO, Mario, EM, Staff Engineer, and Coordinator (optional on INFO; enforced by `packages/protocol` bus-schema):**

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

These are forcing functions, not precise measurements. They make agents state, in writing, what a decision costs and how long it has been open. The Coordinator aggregates them in the decision dashboard. Cost and time are constraints every agent carries — not a dedicated agent's domain (see Section 30, Design Principles).

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
Step 2: Coordinator
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

### Timing for session-bound agents

Agents do not experience time passing between sessions, so every hour-based deadline in this protocol and in role files means an **event**, not a clock reading:

| Written as | Means |
|---|---|
| "1 hour" / "immediately" | In the same turn. Do not end the turn holding it. |
| "4 hours" | Before the current session ends. |
| "24 hours" | At the next activation of the target agent. That session opens with the item, ahead of anything else. |
| "48 hours" | Two activations with no resolution, or one full Bus round-trip with no reply. |

Each escalation carries a `DECISION BY:` date, and `sdk-status` / `sdk-resume` surface overdue ones at session start, so the event model still gets a calendar backstop. **External legal clocks stay wall-clock** (e.g. the GDPR 72-hour window): they run in the real world whether or not an agent is active, so the CLO converts them to a date the moment they start.

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

The one load order. Role files, `AGENTS.md`, and `SDK.md` point here and do not restate it.

**1. Preferred:** `sdk-doc cockpit . --role <role>`. One command returns state, domains, context gaps, ops, and Bus activity for that role.

**2. Fallback, when cockpit is unavailable**, in this order:
1. `context-index.json` — file map, domain routing, `queryMap`, project domains. Use it to decide what else to load.
2. `context-manifest.json` if present, otherwise `current-status.md` — where the team is right now.
3. Your role file `team/roles/<role>.md`.
4. **QueryMap lookup.** Find your activation topic in `context-index.json → queryMap` and load only the files in its `read` array.
5. Your own `<domain>-requirements.md`, if the queryMap did not already include it.
6. `domains/<name>/summary.md`, only if your task touches a project domain.
7. Protocol: `protocol-core.md` (§0–13). Load later sections from `protocol-reference.md` only by number, when the topic needs them.

**Do not load by default:** `history.md` (query it with `sdk-doc history . --search <term>`), `project.md`, `general-requirements.md`, `bus-log.md`, area logs, `iterations/`, or the full `protocol.md`. Load them only when the queryMap routes you there or the task needs decision history.

**Full-context exceptions:** the Coordinator at session open and close, and the CEO for gate reviews and strategic review.

**Role-specific additions** (on top of the order above):
- CTO: the architecture brief or discovery document
- Chief Engineer (Mario): the CTO's architecture brief, all active interface contracts, the tech debt ledger
- EM: current sprint tickets, critical path, mission pod map
- Liaison: `liaison-log.md`
- PM: user story map, friction log
- Staff Engineer: all interface contracts, the tech debt ledger
- Guardians: the active `iterations/<loop>/` files

**BU leads** (CTO, PM, CLO, CFO, CMO, CDO, COO), on the first activation of a session, run the §17 self-discovery scan before sending any Bus message.

If a file does not exist yet (you are the first agent activated), note it and proceed. An agent who produces output without loading context is working on stale assumptions, and stale assumptions cause rework.

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

**Pod Guardian** is a seat, not a role file. It is the code-quality gate for one pod, held by the pod's Staff Engineer, or by Mario when the pod has none. It is distinct from the Implementation Guardian (§31), who judges problem-solution fit. EM names the Pod Guardian when the pod forms.

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

6. **Dissolution:** When a sub-role is no longer needed, the C-level dissolves it and sends an INFO Bus message to the Coordinator and CHRO. CHRO moves the agent from Active to Dissolved in `team.md` with date and reason. The Coordinator logs it to `product-log.md`.

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

### 16.1 Limits — configurable, uncapped by default

Every amount or limit in this protocol is a key under `"limits"` in the project's `.sdkrc` (the defaults live in `scripts/lib/limits.js`; `sdk-health` validates them). Prose refers to the key, never to a hardcoded number.

| Key | Default | Meaning |
|---|---|---|
| `peerSpawns` | `null` | Peers one consultation may spawn. `null` = spawn every peer whose input would change the answer. |
| `discoveryRounds` | `null` | Coordinator ↔ CEO rounds in Phase 0. `null` = until the five Phase 0 questions are answered. |
| `loopIterations` | `null` | Ceiling on any §32 loop's declared budget. `null` = the loop's own declared budget. |
| `guardianCyclesBeforeEscalation` | `3` | §31.6 escalation trigger. Not a cap: work continues once the CEO decides. |
| `surfaceStaleDays` | `3` | §34 staleness window for `sdk-health`. |

**`null` removes the count, never the stop condition.** An uncapped consultation still stops when another peer would not change the answer. An uncapped discovery stops when the five questions are answered, or when the Owner says proceed. An uncapped loop still declares `Budget:` and `Terminate when:` at open (§32.4). A rule with neither a count nor a stop condition is malformed.

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

**CLI assist:** none yet. A `sdk-doc bu-status` generator was documented in v4.3 but never shipped; BU leads author the message by hand from `sdk-doc status` output.

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
PRIORITY: INFO
TAG: CONTEXT-REQUEST
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
| `TAG: CONTEXT-REQUEST` | queryMap lookup (routing, no script) |
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

**CONTEXT-REQUEST** — Asks a domain lead for context before acting (Section 19). Sent as `PRIORITY: INFO`. It is a message type carried as a tag, not a fourth priority.

**SDK-CHANGE** — A change to the SDK itself (protocol, roles, scripts). Used on §15a proposals and on `history.md` SDK-CHANGE entries.

**CONSULTATION** — The trace of a Consultation Mode answer (§16), so the synthesis is auditable.

**ITERATION-REVIEW** / **ITERATION-GRADUATED** — A Guardian's §31 assessment, and its graduation notice to the Coordinator.

**LOOP-OPEN** — The Loop Coordinator announcing a §32 loop at Open, carrying the loop ID.

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

## 31. Iteration Loops

> Restored in v4.7. This section was dropped by accident in f4c51d0 (a file-rename commit) while the Guardian role files, `sdk-doc iteration`, and §32/§34 kept referencing it. The exit criteria in §31.2 are mirrored in `scripts/commands/iteration.js` — change both together.

The protocol's default flow is single-pass: agents deliver once per phase, gates check once, work advances. Iteration Loops replace that default with a refinement cycle where work circles on an idea until a dedicated Guardian validates it is genuinely ready for the long term.

There are three loops, one per major phase. Each loop has its own Guardian role (a separate agent, not an existing role wearing a hat), an explicit exit criteria checklist, and a scratch space that keeps intermediate work out of canonical project documentation.

### 31.1 The Three Loops

**Discovery Loop (Phase 1)**
- **What iterates:** Problem understanding, market constraints, regulatory map, user research, scope definition
- **Participants:** All Phase 1 agents (CLO, CISO, CFO, CMO, CDO, COO, PM, Designer, UX Researcher)
- **Guardian:** Discovery Guardian
- **Triggers:** Coordinator opens the loop after Phase 1 agents deliver their first outputs. Discovery Guardian reviews. Loop continues until exit criteria pass.

**Architecture Loop (Phase 2)**
- **What iterates:** Technical approach, interface contracts, make/buy/partner, platform design, security model
- **Participants:** CTO, Mario, Staff Engineer, Designer (interface direction), PM (SDD)
- **Guardian:** Architecture Guardian
- **Triggers:** Coordinator opens the loop after CTO delivers the architecture brief. Architecture Guardian reviews. Loop continues until exit criteria pass. Existing hard gates (Mario's irreversibility review, Sprint 0 gate, pre-mortem) still apply after graduation.

**Implementation Loop (Phase 3, per pod)**
- **What iterates:** Build quality, spec conformance, problem-solution fit, long-term maintainability
- **Participants:** Engineers, EM, Staff Engineer, existing pod Guardian (code quality)
- **Guardian:** Implementation Guardian (distinct from pod Guardian — checks problem-solution fit and longevity, not code quality)
- **Triggers:** EM opens the loop after each sprint batch. Implementation Guardian reviews. Loop continues until exit criteria pass. Pod dissolution requires both pod Guardian sign-off (quality) AND Implementation Guardian graduation (fit).

### 31.2 Exit Criteria

Each loop has a checklist. All items must pass for the Guardian to stamp GRADUATE. The Guardian cannot waive checklist items — they can only recommend that the Coordinator escalate to CEO for an exception.

**Discovery Loop exit criteria:**
- [ ] Problem statement is falsifiable (can be proven wrong with evidence)
- [ ] Target user is specific enough to exclude someone
- [ ] Regulatory constraints are mapped with confidence levels (HIGH/MED/LOW)
- [ ] At least one core assumption has been tested, not just stated
- [ ] Non-goals are explicit and reasoned (not deferred — excluded with rationale)
- [ ] The brief could survive a FRAMING-CHALLENGE without collapsing

**Architecture Loop exit criteria:**
- [ ] Architecture serves at 10x current scale without fundamental redesign
- [ ] Every irreversible decision has a named alternative and documented rejection reason
- [ ] Interface contracts are complete enough for independent pod execution
- [ ] Make/buy/partner decisions have cost projections beyond year 1
- [ ] Security model satisfies CISO's non-negotiables (not deferred)
- [ ] The design traces back to the graduated Discovery output (not a drifted version)

**Implementation Loop exit criteria:**
- [ ] Deliverables match the spec from the graduated Architecture output (not a drifted interpretation)
- [ ] No security shortcuts taken (auth, data handling, secrets management)
- [ ] Code is maintainable by a team that did not write it
- [ ] Edge cases from the pre-mortem are handled or explicitly deferred with reason
- [ ] Instrumentation covers the friction points PM identified in product-requirements.md
- [ ] The output creates user capability, not dependency (Constraint 1 check)

### 31.3 Scratch Space

Iteration work lives in `iterations/`, outside canonical project documentation. Only graduated outputs flow into requirements files, area logs, and history.md.

```
iterations/
  discovery/
    iter-001.md         ← first pass
    iter-002.md         ← guardian feedback incorporated
    iter-003.md         ← graduated
  architecture/
    iter-001.md
    iter-002.md         ← graduated
  implementation/
    pod-auth/
      iter-001.md
      iter-002.md       ← graduated
    pod-payments/
      iter-001.md
```

**Iteration file format:**

```markdown
---
loop: discovery | architecture | implementation
cycle: 1
pod: [pod name — implementation loop only]
guardian: [Guardian name]
status: draft | in-review | rework | graduated
created: YYYY-MM-DD
graduated: YYYY-MM-DD
---

## Input
[What the team produced this cycle]

## Guardian Review
[Guardian's assessment — filled during review]

## Exit Criteria
- [x] or [ ] per checklist item from Section 31.2

## Verdict
GRADUATE | ITERATE — [reason]

## Feedback (if ITERATE)
- [Specific item to address in next cycle]
```

**Rules:**
- Iteration files are append-only. Previous cycles are never edited — new cycles get new files.
- Agents do NOT load iteration files during normal context loading. They are loaded only during active iteration review (load_when: `iteration-review`).
- The Guardian's review in each iteration file is the permanent record of what was considered and why.
- When a Guardian stamps GRADUATE, the Coordinator triggers the flow of final content into canonical docs. The iteration file's `graduated` date is set.

### 31.4 Graduation Process

When a Guardian stamps GRADUATE:

1. Guardian sends a Bus message to Coordinator: `PRIORITY: INFO`, `TAG: ITERATION-GRADUATED`, with the loop type and cycle number.
2. Coordinator reads the graduated iteration file.
3. Coordinator routes the final content to the appropriate agents for canonical doc writes:
   - Discovery graduation → PM updates product-requirements.md, CLO updates discovery-requirements.md, etc.
   - Architecture graduation → CTO updates engineering-requirements.md, Staff Engineer finalizes contracts
   - Implementation graduation → EM triggers pod review flow (existing Section 8a)
4. Coordinator logs the graduation to the relevant area log.
5. If the graduation represents a consequential decision, the Guardian or Coordinator logs it to history.md.

### 31.5 Relationship to Existing Gates

Iteration loops wrap AROUND existing hard gates — they do not replace them.

```
Phase 1:  [Discovery Loop iterates] → Discovery Guardian GRADUATES
            ↓
          CLO + CISO hard gate (unchanged)
            ↓
Phase 2:  [Architecture Loop iterates] → Architecture Guardian GRADUATES
            ↓
          Mario irreversibility gate (unchanged)
          Sprint 0 gate (unchanged)
          Pre-mortem gate (unchanged)
            ↓
Phase 3:  [Implementation Loop iterates per pod] → Implementation Guardian GRADUATES
            ↓
          Pod Guardian final gate (unchanged — code quality)
          Pod dissolution (unchanged)
            ↓
Phase 4:  CEO validates project-map.md (unchanged)
          Coordinator seals release (unchanged)
```

Hard gates check specific non-negotiable conditions. Iteration loops ensure the QUALITY of the work that reaches those gates. A graduated output can still fail a hard gate — the gate checks different things than the loop.

**All three loops are active by default.** The Coordinator may skip a loop for a low-stakes increment (feature work, internal tooling, experiments) by logging the skip and its reason to history.md; hard gates still apply. The Discovery and Architecture loops are not skipped when the project handles PII, financial data, regulated assets, or irreversible infrastructure. (Old §32 Risk Tiers formalized this as a gate matrix; it was retired in f4c51d0 — see the retired-numbers note in the header.)

### 31.6 Guardian Authority

- Guardians have REVIEW authority, not WRITE authority over canonical docs. They assess and verdict; they do not directly modify requirements files or area logs.
- Guardians can open Structured Disagreements (Section 29) against domain agents whose output they believe does not meet exit criteria.
- Guardians cannot block indefinitely. If a loop has not graduated after `limits.guardianCyclesBeforeEscalation` cycles (default 3, §16.1), the Guardian must escalate to CEO with a written assessment of what is preventing graduation. The CEO decides: iterate once more, graduate with conditions, or kill the mission.
- Guardians use standard Bus messages. `TAG: ITERATION-REVIEW` for assessments, `TAG: ITERATION-GRADUATED` for graduation.

### 31.7 CLI Commands

```bash
# Create a new iteration cycle
sdk-doc iteration <project-dir> create --loop discovery|architecture|implementation [--pod <pod-name>] [--guardian <name>]   # cycle number is assigned automatically

# Record guardian review and verdict
sdk-doc iteration <project-dir> review --loop <type> --cycle <N> [--pod <pod-name>] --verdict graduate|iterate --feedback "..."

# List iterations with status
sdk-doc iteration <project-dir> list [--loop <type>] [--status draft|in-review|rework|graduated]

# Graduate an iteration (sets graduated date, triggers canonical doc flow)
sdk-doc iteration <project-dir> graduate --loop <type> --cycle <N> [--pod <pod-name>]
```

---

## 32. Generative Loops

team-sdk agents already disagree, spawn peers, and produce synthesis — but the *quality of dissent* is not load-bearing. Today, when Mario or the CTO says "challenge this," it happens as a one-shot Bus exchange that closes by social default rather than by a declared contract. There is no recorded transition, no provenance on the resulting artifact, and no termination rule beyond "we feel done." Section 32 is the constraint that makes critique mechanical — declared shape, declared termination, declared provenance — without turning it into another agent to please. §32 sits beside §15a (self-improvement loop), §16 (consultation and peer spawning), and §31 (Iteration Guardians). It does not replace them. §15a is how the SDK evolves between releases; §16 is how an agent borrows a peer perspective for synthesis; §31 is the iteration cycle that gates Discovery → Architecture → Implementation. §32 is the surface on which a *specific draft* is stressed against a *specific weakness hypothesis* by a *specific pattern* with a *declared termination rule*. §32 is NOT a new escalation path, NOT a substitute for the Halloway Ratchet (§24), NOT a CLI-invoked workflow in v0.1, and NOT an automatic behavior — every loop is explicitly opened by a spawning agent at one of three named insertion points.

### 32.1 Loop Coordinator

The Loop Coordinator is an ephemeral agent type spawned once per loop and dissolved at termination. It exists only inside the loop. It has no memory file, no consultation mode, no cross-loop state, and no persona reasoning surface. Its full role file is `team/roles/loop-coordinator.md`.

The Loop Coordinator is **driver, not judge**. It coordinates turn order, enforces budget, advances the state machine, and writes loop transitions to the Bus and to `record/loops/<YYYY-MM-DD>-<pattern>-<seq>/state.md`. It does not opine on content. A Loop Coordinator that produces a content opinion has violated the load-bearing non-negotiable and the loop's emitted artifacts are void.

**SOLUTION_CLASS contract:**
- `Level 3 (deterministic state machine)` for all turn coordination, budget enforcement, and termination logic. These are not reasoning surfaces.
- `Level 1` permitted **only** when the spawning agent explicitly delegates a tie-break in writing on loop open. Absent that delegation, Level 1 reasoning by the Loop Coordinator is a protocol violation.

The Loop Coordinator's consultation mode is **disabled**. It cannot be reached via `/ask`. It only exists inside an open loop.

### 32.2 v0.1 Patterns

v0.1 ships exactly two patterns and no more:

- **Constitutional Critique-Revise** — full spec at `team/roles/loops/critique-revise.md`. One author, one critic, one revision pass. Critic reads against a written constitution (Layer A: Constraints + Soul) and emits structured critiques citing the principle violated. Critic also emits a `would-have-wrongly-killed:` guardrail line on every turn (see §32.3). Convergence: violations resolved, wrongly-killed strategy survives recognizably.

- **Red-Team / Devil's Advocate** — full spec at `team/roles/loops/red-team.md`. Proposer names the load-bearing assumption; Red-Teamer (peer, not judge) names one assumption that, if wrong, breaks the whole thing, with the specific failure path. Proposer decides: revise, accept-with-deferred-risk (logged in `history.md` per §6), or kill. Red-Teamer emits an `assumption-not-attacked:` guardrail line on every turn (see §32.3).

Pattern selection is **Level 3, not Level 1**. Each pattern file declares `TRIGGER_SHAPE` and `NON_TRIGGER_SHAPE`. Spawning agents read both before opening. Freeform "should we use Critique-Revise here?" deliberation on the Bus is itself a ratchet candidate per §24.

**Dialectic is deferred to v0.2** explicitly because named-role critique without author anonymization is a known sycophancy surface. The v0.2 return ticket is owned by PM, target window v2026.Q3, triggered when the anonymization layer design is accepted by CTO + Mario. Dialectic is documented (`team/roles/loops/dialectic.md`, v0.2) but not openable in v0.1; the Loop Coordinator rejects it.

### 32.3 Loop lifecycle and the `WEAKNESS_HYPOTHESIS` rule

A loop has four lifecycle phases: **Open**, **Turns**, **Terminate**, **Dissolve**. The Loop Coordinator drives all four.

Every loop open requires a `WEAKNESS_HYPOTHESIS:` declaration from the spawning agent in one sentence:

```
WEAKNESS_HYPOTHESIS: [The specific weakness the spawning agent expects this loop to expose.]
```

Without `WEAKNESS_HYPOTHESIS`, **the loop does not open**. The Loop Coordinator rejects the open. This is the anti-reflex lever: it costs judgment to open a loop, not just a Bus message. If the hypothesis turns out wrong, that is fine — the loop output records the miss and the next loop is better-aimed. If no hypothesis can be articulated, the loop is not the right instrument.

In addition, every critic turn MUST emit its pattern-specific guardrail line:
- Critique-Revise critic: `would-have-wrongly-killed: <name at least one bold property the critique does not damage>`
- Red-Team critic: `assumption-not-attacked: <name at least one assumption this pass did not stress-test>`

The loop **fails closed** if either guardrail line is absent on a critic turn. The emitted artifact does not cross any gate.

### 32.4 Termination contract

Termination is **asymmetric** by Mario's design and may not be made symmetric without a §15a protocol change.

| Action | Authority | Countersign required |
|---|---|---|
| Declare budget at open (≤ `limits.loopIterations` when set, §16.1) | Spawning agent | None |
| Early-stop (terminate before budget exhausted) | Spawning agent | None — unilateral |
| Extend budget | Spawning agent + one peer-or-higher tier countersign per §1 ladder | YES |

Cross-domain countersign is explicitly permitted and counts as peer tier — e.g., CISO countersigning an extension on a CTO-spawned loop, or CLO countersigning a PM-spawned loop. The Red-Team pattern requires cross-domain spawning by construction.

**The Loop Coordinator has NO extension authority.** Not even on its own loop. Two signatures to keep talking — that is the anti-sycophancy lever.

The spawning agent's early-stop is unconditional. No agent — including Mario, including the Loop Coordinator — can block an early-stop. This guarantees the spawning agent never loses control of scope inside the loop.

### 32.5 Loop IDs and provenance

Every loop has a unique ID with this format:

```
LOOP-YYYYMMDD-<pattern>-<seq>
```

Examples: `LOOP-20260614-critique-revise-001`, `LOOP-20260614-red-team-003`. The Loop Coordinator assigns the ID on Open. Sequence numbers are per-day, per-pattern, monotonic. The loop folder is `record/loops/<YYYY-MM-DD>-<pattern>-<seq>/` (same date, pattern and seq, without the `LOOP-` prefix); the full loop ID is written on the state.md title line and in every `LOOP-PROVENANCE:` line.

Every artifact emitted from a loop carries a provenance line:

```
LOOP-PROVENANCE: <loop-id> + SHA256(<canonicalized artifact body>)
```

The loop ID is appended unhashed so the same artifact may legitimately surface from two loops; the binding is loop→artifact, not loop⇔artifact-only. Artifacts without a `LOOP-PROVENANCE:` line do not cross any §31 Guardian gate, Mario's irreversibility review (the Chief Engineer gate that precedes §28), or the release seal. Orphaned loop IDs are not yet machine-checked: `sdk-health` has no loop-ID scan (honest gap; the Signal Harvest ritual is the manual check).

### 32.6 State persistence

Each loop maintains a state file at `record/loops/<YYYY-MM-DD>-<pattern>-<seq>/state.md` with three required headings, in order:

```markdown
## Open
WEAKNESS_HYPOTHESIS: <one sentence>
Pattern: <slug>
Spawning agent: <role>
Budget: <turn count or token cap; ≤ limits.loopIterations when set (§16.1); ignored by one-pass patterns>
Insertion point: <Phase 0 | Architecture | Implementation>
Constitution reference (Critique-Revise only): <file path or section>

## Turns
<every critic and author turn, with timestamps, guardrail lines, and content>

## Terminate
Termination cause: <budget-exhausted | early-stop | extension-failed | guardrail-failed-closed>
Final artifact: <path + LOOP-PROVENANCE line>
Improvement signal: <emitted to record/metrics/_signals.jsonl, schema per _IMPROVEMENT_SIGNAL.md>
```

The **Bus Log records transitions only** — loop open, turn boundary, termination, dissolve. Internal turn content lives exclusively in `state.md`. This protects Bus signal-to-noise per §22 and preserves §24 Halloway Ratchet detection (a loop with 12 internal turns must not look like 12 ratchet revisions on the Bus). A Bus message containing internal loop turn content is a protocol violation; the Coordinator routes it back.

### 32.7 Insertion points

There are **exactly three valid insertion points** for a §32 loop. No mid-execution loops; those are reviews, not loops.

1. **Phase 0 — Discovery / Ideation.** A loop opened on a raw problem statement, brief, or framing document during the Ideation Cycle (§15). Owner: PM or any Phase 1 agent. Typical pattern: Critique-Revise against the constitution; Red-Team against the load-bearing market or user assumption.

2. **Architecture — before the Mario gate.** A loop opened on the SDD draft, the CTO architecture brief, or any interface contract before Mario's irreversible decision review (the gate that precedes §28). Owner: CTO, Mario, or PM. Typical pattern: Red-Team on the single killing architectural assumption; Critique-Revise against Constraints + Soul before sealing.

3. **Implementation — Test Engineer-owned, edge case generation.** A loop opened by Test Engineer (or by EM on Test Engineer's behalf) to generate adversarial test cases against a Pod's pre-merge artifact. NOT a code review surface — code review remains as defined in §9 and the engineer ladder. Typical pattern: Red-Team on the assumption underlying the test fixture; Critique-Revise on the test plan against the test-coverage constitution.

Insertion outside these three is a violation. The Loop Coordinator rejects opens whose `Insertion point:` field does not match one of the three. Cross-reference §15 cycles: Phase 0 belongs to the Ideation Cycle; Architecture and Implementation belong to the Shipping Cycle.

### 32.8 Periodic Constitutional Line Audit (CISO domain)

The §32 v0.1 anti-sycophancy contract depends on the *quality* of the `would-have-wrongly-killed:` and `assumption-not-attacked:` lines — not their presence. The de-risk test on 2026-06-14 demonstrated that good-faith and adversarial-minimum lines are reliably distinguishable by a cross-domain reviewer scored on five dimensions (verdict: HOLDS, 15/15 vs 1/15). The audit operationalizes that finding into an ongoing check.

CISO runs a quarterly audit pass on a sample of emitted guardrail lines, scoring each against five dimensions on a 0–3 scale (15 max):

1. **Specific named strategy** — does the line name a real, concrete strategy or property, not a category?
2. **Specific critique cited** — does the line name the critique that would have damaged it?
3. **Falsifiable preserved property** — is the preserved property testable, not vibes?
4. **Contextual concreteness** — does the line reference the draft's actual content, not generic best practice?
5. **Severity judgment** — does the line carry a defensible severity claim?

**Thresholds:**
- Lines scoring **≤5/15** are flagged as suspected sycophantic-compliance emissions. The loop they came from is re-opened for a single critic-only turn under a *different* critic agent (different role, different city per §14 naming).
- If **>25% of sampled lines in a release cycle score ≤5/15**, §32 is declared **failing its anti-sycophancy contract**. The v0.2 anonymization work (Dialectic + author-anonymization layer) is accelerated ahead of its scheduled v2026.Q3 window. The decision to accelerate is logged per §6 and broadcast per §15a Step 5.

Audit cadence is quarterly. Sample size is gate-check tier: minimum two completed loops per release cycle, expanding to four when the line population exceeds 50 emissions per quarter. Reference: `metrics/would-have-wrongly-killed-quality.md`.

### 32.9 Cross-domain consumer hooks and return tickets

§32 v0.1 ships with three explicit **return tickets** acknowledging shape limitations surfaced by the cross-domain shape review (Designer, UXR, CLO, CISO, 2026-06-14). Each return ticket carries a named owner and a target window. They are not stubs; they are commitments.

| Return ticket | Owner | Target | Trigger to open |
|---|---|---|---|
| **Research-Synthesis-shaped critique pattern** — Critique-Revise as written does not safely cover methodological soundness of research synthesis (evidence chain, sample-frame transparency, negative-space, observation-vs-inference). UXR builds a synthesis-shaped variant. | UX Researcher | v0.2 | When UXR confirms three live research synthesis artifacts would benefit from a shaped pattern |
| **Craft-constitution work** — Layer A as currently constituted misses design craft (accessibility/WCAG, perceived affordance, form-follows-function, emotional register). Designer treats Layer A as a critic-facing interface and ships a craft layer. | Designer | v0.2 / v0.3 | When Designer ratifies the craft-constitution scope and Mario countersigns |
| **Typed `constitution: <ref>` argument** — loops on regulated artifacts declare e.g. `constitution: gdpr-art-6+layer-a` and the critic reads against both. Closes the CLO vocabulary gap surfaced at seal. | CLO | v0.2 | When CLO confirms at least one regulated artifact is queued for §32 review |

**Cross-domain consumer hook:** UX Researcher is named **co-consumer of `record/metrics/_signals.jsonl`** alongside the Coordinator's retrospective ritual cadences. UXR reads the friction-pattern stream on a continuous basis (not gated by retro) and is empowered to open a §15a protocol change proposal when friction patterns recur. This makes the signals stream a research surface, not just an ops surface.

### 32.10 Retention, privilege, and discoverability

CLO domain. Owner-accepted 2026-06-14 with Q3 exposure profile consciously absorbed. These rules are non-negotiable for v0.1.

**Retention policy:**
- `record/loops/<YYYY-MM-DD>-<pattern>-<seq>/state.md` is retained for the **life of the shaped artifact it produced**. If the artifact is deprecated or removed from the project tree, the loop state may be archived but not destroyed within the current release cycle.
- `record/metrics/_signals.jsonl` is retained for **two release cycles**.
- Both are subject to **legal-hold override** which extends retention indefinitely until lifted by CLO. Legal hold is invoked per §6 with `Made by: CLO` and `Reversible: NO`.

**Privilege scope:**
Loops opened on legal-domain artifacts MUST declare on loop open:

```
PRIVILEGE_SCOPE: attorney-client-work-product
```

Without the `PRIVILEGE_SCOPE` header, **the option to assert privilege over the loop record is foreclosed**. The Loop Coordinator does not retroactively add the header; the spawning agent declares it on Open or accepts the foreclosure. CLO reviews any loop carrying `PRIVILEGE_SCOPE: attorney-client-work-product` before it is opened.

**Discoverability acknowledgment (non-negotiable spawning-agent rule):**

> Loop state files and the signals stream are **discoverable records** and create a duty-of-care standard. Loops MUST NOT be opened on artifacts the team is not prepared to have read in adversarial discovery.

This rule is on every loop open by reference. The spawning agent's act of opening a loop constitutes acknowledgment.

### 32.11 Composition and cross-references

§32 composes with adjacent protocol surfaces. It does not modify them.

- **§1 (Bus Message Format)** — Loop transitions use the standard Bus format with `TAG: LOOP-OPEN | LOOP-TURN | LOOP-TERMINATE`. SOLUTION_CLASS is required on Loop Coordinator messages per §1: `Level 3` for coordination, `Level 1` only on delegated tie-breaks.
- **§6 (Decision Log)** — Termination causes that involve risk acceptance (Red-Team `accept-with-deferred-risk`) are logged per §6 with `Made by: <proposer role>` and the named assumption. The Red-Team `assumption-not-attacked:` line is a process artifact, not a §6 risk acceptance — see the vocabulary clarification in `team/roles/loops/red-team.md`.
- **§15 (Cycles)** — Loops respect the Ideation / Shipping boundary. Phase 0 loops belong to the Ideation Cycle; Architecture and Implementation loops belong to the Shipping Cycle. Loops do not cross the Betting Table.
- **§15a (Self-improvement loop)** — §32 is the runtime mechanism for dissent quality on a specific draft. §15a is the between-release mechanism for evolving the protocol itself. A pattern of failed §32 audits (per §32.8) is a §15a proposal trigger.
- **§16 (Consultation and Spawning Policy)** — A consultation spawn (§16) asks a peer "what do you see?" A §32 loop binds that peer's perspective to a declared pattern, termination contract, and provenance hash. The two are not interchangeable. An agent who needs an off-the-cuff perspective uses §16; an agent who needs auditable adversarial pressure on a draft opens a §32 loop.
- **§22 (Bus Log)** — Bus Log records only loop transitions, never internal turn content. The intent resolver maps `TAG: LOOP-OPEN | LOOP-TERMINATE` to `doc.log` entries in the spawning agent's area log.
- **§24 (Halloway Ratchet)** — Pattern selection and Loop Coordinator turn coordination are Level 3. Critic content review is Level 1, which is correct because content review on an unknown draft IS exploratory. Loops are not a ratchet candidate; they are how Level 1 critique gets bounded.
- **§25 (TAG field)** — New tags introduced by §32: `LOOP-OPEN`, `LOOP-TURN`, `LOOP-TERMINATE`, `LOOP-AUDIT-FLAG` (CISO-only, emitted when a sampled line scores ≤5/15). Adding any further §32 tag requires a protocol version bump per §25.
- **§28 (Pre-Mortem Gate)** — A Red-Team loop is the recommended preparation for the Pre-Mortem. The Pre-Mortem's "single falsifiable assumption that, if wrong, kills the mission" is the natural artifact of a Red-Team termination.
- **§29 (Structured Disagreement Log)** — When a critic and an author cannot converge inside a Critique-Revise loop, the spawning agent opens a §29 disagreement on termination. The loop is the surface that *produces* the disagreement cleanly, with both positions named and provenance-hashed. §29 is the long-running record; §32 is the bounded mechanism.
- **§30 (Design Principles)** — §32 is a constraint mechanism, not a new agent type. The Loop Coordinator is ephemeral on purpose: §30 warns that adding an agent for a constraint creates the illusion that someone else is watching. The Loop Coordinator owns coordination only; the constraint (declared pattern, termination, guardrail line, provenance) is carried by every loop participant.
- **§31 (Iteration Guardians)** — Discovery, Architecture, and Implementation Guardians may *recommend* opening a §32 loop as part of their GRADUATE / ITERATE verdict. They do not spawn loops themselves; spawning authority stays with the named insertion-point owners (PM, CTO, Mario, Test Engineer). A Guardian iteration that surfaces a load-bearing assumption is the natural prompt for a Red-Team loop before the next phase advances.

---

## 33. Reserved — SDLC State Machine

Reserved for the SDLC State Machine (bet lifecycle: `proposal → committed → WIP → … → ga → sunset`). Currently in draft at `project/context/intent/sdlc-state-machine/_protocol-33-draft.md`; not yet sealed into this file. Do not reuse this number.

---

## 34. Collaboration Surfaces

### 34.0 Intent

The company is the product (`CHARTER.md`). The unit of work is therefore not a per-role output that lands in one role's log — it is a **shared artifact that multiple roles contribute to and verify over a project's life**, where each contribution is a provenance-stamped commit to the company body. The team already had four fragments of this — the draft §33 owner-plus-guardrail-signers model, §32 author-plus-critic, §6 decision authorship, §17 BU status — but no single, self-describing place where, say, a CTO authors *how something must happen* and a CFO later runs a verification on the same artifact. §34 is that primitive. It generalizes the fragments into one surface every role can commit to.

A Collaboration Surface is the answer to "where does a decision, a flow, or a roadmap live while more than one role is still shaping it?"

### 34.1 What a surface is

A Collaboration Surface is a single self-describing file. It carries machine-readable front-matter and a body of provenance-stamped contributions. Front-matter schema:

```yaml
surface:
  id: SURFACE-YYYYMMDD-<slug>-<seq>
  kind: decision | flow | roadmap
  title: <one line>
  author_roles: [<role>, ...]          # who is empowered to author the body
  verifier_roster: [<role>, ...]       # who must verify before it can reach `verified`
  depends_on: [<surface-id | file>, ...]
  produces: <what artifact/decision this surface yields>
  state: draft | authored | under-verification | reconciling | verified | blocked
  irreversible: true | false           # high-stakes; changes no-go and roster rules (§34.4, §34.5)
  evidence: [<path | claim-id>, ...]
  release: v[YEAR].Q[QUARTER].[INCREMENT]
```

`id`, `kind`, `title`, `author_roles`, `verifier_roster`, `state`, and `irreversible` are required. A surface missing any required field is malformed and does not advance.

### 34.2 Contribution blocks

The body is append-mostly. Three block types:

- **Author block** — the substance, authored by an `author_roles` member. One or more. Provenance-stamped.
- **Verification block** — one per verifier in the roster who has acted. Each carries a verdict: `pass | concern | no-go`, the reasoning, and provenance. A `concern` is non-blocking but recorded; a `no-go` triggers §34.5.
- **Reconciliation block** — written only when a `no-go` fired. Records how the no-go was resolved (author revised, verifier withdrew on new evidence, or the disagreement escalated to §29). A surface cannot reach `verified` with an open `no-go` and no reconciliation block.

Every block ends with a `LOOP-PROVENANCE:` line per §32.5 (loop-id is replaced by the surface-id; format is otherwise identical: `SURFACE-… + SHA256(canonicalized block body)`).

### 34.3 State machine

```
draft ──► authored ──► under-verification ──► verified
                            │                    ▲
                            └──► reconciling ─────┘   (a no-go fired, then resolved)
                                     │
                                     └──► blocked       (irreversible surface, no-go unresolved)
```

- `draft → authored`: an author block exists.
- `authored → under-verification`: the verifier roster has been notified (Bus, §1).
- `under-verification → verified`: every roster verifier has a `pass` (or a withdrawn `no-go` recorded in a reconciliation block), and no `no-go` is open.
- `under-verification → reconciling`: a `no-go` is recorded (§34.5).
- `reconciling → verified`: the no-go is resolved (reconciliation block written).
- `reconciling → blocked`: only for `irreversible: true` surfaces whose no-go is unresolved — the surface cannot advance until a human (per §34.7) or a §29 resolution clears it.

### 34.4 Verifier roster — dynamic with a fixed minimum

The roster is chosen **dynamically** by the spawning/authoring agent (or the meta-loop) the same way `/ask` routes: name the roles whose domain input would actually change the artifact. The roster is not a rubber stamp of every C-suite role.

For `irreversible: true` surfaces, a **fixed minimum roster** applies on top of the dynamic choice: at least CFO (cost/runway), CISO (security/threat), and Mario (irreversibility) — plus CLO whenever the surface touches legal exposure or a discoverable artifact. The minimum cannot be removed; it can only be added to.

### 34.5 No-go behavior — blunt, force the discussion

When a verifier records a `no-go`:

- The surface moves to `reconciling`. It is **not** silently passed and **not** marked `verified`.
- The system is blunt: the no-go and its reasoning are recorded verbatim; the author is required to respond (revise, or contest with evidence).
- **Default (reversible surfaces):** work elsewhere continues in parallel; the no-go forces a logged discussion but does not freeze unrelated work. If author and verifier cannot converge, the disagreement escalates to a §29 Structured Disagreement Log entry, or a §32 Red-Team / Critique-Revise loop is opened to pressure the artifact.
- **Irreversible surfaces:** the surface goes to `blocked` and cannot advance until the no-go is reconciled. Bluntness here is also a brake, because the cost of being wrong is not recoverable.

Silence is never a pass. A verifier who cannot find a problem says so explicitly (a `pass` with reasoning); an unacted roster slot keeps the surface in `under-verification`.

### 34.6 Provenance and improvement signal

- Every block carries a `LOOP-PROVENANCE:` line (§32.5 format, surface-id binding).
- On reaching `verified` or `blocked`, a surface emits one `improvement_signal` per `team/roles/loops/_IMPROVEMENT_SIGNAL.md` into `record/metrics/_signals.jsonl`. Omission fails the surface's close the same way it fails a loop close.

### 34.7 Autonomy and the human boundary

Agents author, verify, and reconcile **autonomously where it makes sense** — this is the default, per `CHARTER.md`. A human is engaged only at the boundaries that already require one:

- a shift in scope or strategy (CEO escalation triggers, `ceo.md`),
- a change to Layer A (`CHARTER.md`, `_shared.md`, `STRATEGY.md`, structural `protocol.md`),
- an `irreversible: true` surface reaching `blocked`,
- an SDLC forward transition (§33, when sealed),
- anything pushed to a shared remote (push/merge to `main`).

Everything else — routine decisions, flows, roadmaps, and their verifications — closes agent-to-agent.

### 34.8 Relationship to existing sections

- **§6 (Decision Log):** a `verified` decision-kind surface produces a §6 entry. The surface is the working artifact; §6 is the permanent index. A verifier's `no-go` that is overridden is logged per §6 with the named authority.
- **§29 (Structured Disagreement):** an unreconciled `no-go` escalates to §29. The surface produces the disagreement cleanly, both positions named and hashed.
- **§32 (Generative Loops):** a surface may *open* a §32 loop to pressure an author block (Red-Team) or principle-check it (Critique-Revise). The loop's output is a contribution block.
- **§17 (BU Communication):** surface state changes are reportable via BU status; the Coordinator aggregates open surfaces into `current-status.md`.
- **§31 (Iteration Guardians):** a Guardian may require a surface (e.g., an Architecture decision surface) before it issues GRADUATE.

### 34.9 File location and naming

Surfaces live at `<project>/surfaces/SURFACE-YYYYMMDD-<slug>-<seq>.md`. For the SDK's own project that is `project/surfaces/`. The template ships at `project-template/surface-template.md`. `sdk-health` flags surfaces stuck in `under-verification` or `reconciling` past a staleness window (`.sdkrc` `surfaceStaleDays`, default 3).

---

## 35. Document-First Gate

### 35.0 Why this exists

The company is the product (`CHARTER.md`): the protocol, the role files, the decisions in `history.md`, the surfaces — these *are* the company body, not documentation about it. It follows that **the map must never lag the work.** Twice the map did lag — the §32 substrate and then §34 + the office layer both shipped to the tree while `history.md` and `current-status.md` stayed behind, and both took a Greg audit to backfill (see `history.md`, 2026-06-19 and 2026-06-24). The repo already had ample "keep the map current" machinery — the project-map gate (§6/CEO), the Status Reconcile ritual, improvement-signals — but all of it was written norm, and written norm drifted. §35 makes document-first **load-bearing**: a real gate, not another principle to remember.

### 35.1 The rule

A commit that changes a **material** file MUST, in the same commit, either:
- touch the map — `<project>/current-status.md` and/or `<project>/history.md` (a decision uses the §6 format), or
- carry `[map-exempt: <reason>]` in the commit message (reason mandatory, non-empty).

Material change → the map travels with it, or the waiver is recorded where the git log keeps it forever. The route is always mapped, or the gap is always named.

### 35.2 What counts as material

The authoritative list is **code, not prose** — `scripts/lib/map-gate-lib.js` (`MATERIAL_RULES` / `EXEMPT_RULES`). This section does not re-enumerate it, because a prose copy would drift from the classifier (the exact failure §35 exists to stop). In summary: **material** = governance docs (`protocol*.md`, `CHARTER.md`, `STRATEGY.md`, `AGENTS.md`, `CLAUDE.md`, `SDK.md`, `README.md`), everything under `team/ workflows/ scripts/ packages/ project-template/`, the context brain (`context/**` — Layer A/B/C), and any `.js/.ts/.mjs/.cjs/.json`. **Exempt** (own write-rules or self-describing provenance) = the map files themselves, `surfaces/**` (§34), `record/**` (run exhaust — loops, metrics, spec records), area logs and `*-requirements.md` (§17), `LOOP.md`, lockfiles, `.gitignore`, `LICENSE`. Exempt wins over material. In any repo without a `current-status.md`, the gate is a no-op.

### 35.3 The escape hatch

`[map-exempt: <reason>]` is the pressure valve that keeps the gate from being a tax: a genuinely trivial change (a typo, a formatting pass) ships with one honest line of reason, permanently auditable in the git log. An empty `[map-exempt:]` is rejected — the waiver is never free of a reason.

### 35.4 Enforcement, and its honest limits

Per the §32 retro's own rule — *a mechanism named here must exist in code* — these are the three layers, each real:

- **Layer 1 — git `commit-msg` hook (hard gate).** `scripts/hooks/commit-msg` → `scripts/hooks/map-gate.js --commit-msg`. Blocks the commit (exit 1) when material files are staged without a map touch or an exempt tag. Catches both Claude's and a human's commits. Installed by `node scripts/install-hooks.js` (`sdk-install-hooks`), which sets `core.hooksPath → scripts/hooks` so the hook is versioned and updates with `git pull`.
- **Layer 2 — Claude Code `Stop` hook (reminder).** `.claude/settings.json` → `map-gate.js --stop`. At the end of a Claude turn, reminds (stderr) when uncommitted material drift exists; it **never blocks** a turn. Fires only on *uncommitted* drift, so it never double-nags Layer 1.
- **Layer 3 — `sdk-health` drift check (on-demand backstop).** Counts material commits since the last map update that neither touched the map nor were waived, and flags them.

**Honest limits, stated not hidden:** `git commit --no-verify` bypasses Layer 1 entirely — unpreventable, and nothing logs it; Layer 3 + the Status Reconcile ritual are the only catch afterward. A fresh `git clone` has no active git gate until `sdk-install-hooks` runs (`core.hooksPath` is not set by cloning); `SDK.md` HUMAN SETUP prompts it. Auto-installing the gate in *generated* projects is a known gap, not a shipped feature — those projects reference the SDK by path and carry no `scripts/hooks` of their own, so per-project wiring (a hook that points at the SDK's `map-gate.js` by absolute path, run from `sdk-init`) is an open follow-up. Today §35 is enforced in the SDK's own repo. The gate cannot silently rot: `map-gate.js` and the classifier are themselves material (editing them without a map touch trips the gate), and `scripts/lib/test-map-gate.js` pins the classifier in `npm test`.

### 35.5 Relationship to existing sections

- **§6 (Decision Log):** §35 enforces the *presence* of a map touch on every material commit; §6 governs the *form* of the decision entry that touch should contain. The gate is mechanical and per-commit; §6 is editorial.
- **§34 (Collaboration Surfaces):** surfaces are exempt from the gate (they carry their own provenance), but a `verified` decision-surface still emits a §6 entry per §34.8 — which is itself a map touch.
- **Status Reconcile ritual (`team/office/rituals/office/05`):** the daily backstop that rewrites `current-status.md` to on-disk reality. §35 is the per-commit gate; the ritual is the daily sweep; `sdk-health` is the on-demand check. Three cadences, one goal: the map never lags the route.

---

*Protocol v4.8. This file is the single source of truth for inter-agent communication, escalation, requirements tracking, organizational structure, strategy alignment, area logs, session continuity, sub-role creation, mission pod lifecycle, ideation and shipping cycles, SDK self-improvement, consultation mode, BU communication, research chapter protocol, context request routing, project domain architecture, operations map, Bus log, session memory, the Halloway Ratchet doctrine, TAG field, Kill Log, Negative Scope, Pre-Mortem gate, design principles, iteration loops, generative loops, collaboration surfaces, and the document-first gate. Every agent references it. No agent duplicates it.*
