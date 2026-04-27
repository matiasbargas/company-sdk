# How team-sdk Works

## Why This Exists

Most multi-agent AI systems fail the same way: agents agree too easily, nobody tracks what was decided, context is either everything or nothing, and there is no mechanism to stop bad work before it compounds. You get twenty agents that all say "great idea" and produce output that contradicts itself across domains. There is no governance, no accountability, and no memory that survives between sessions.

The deeper problem is false consensus. When an AI agent produces output, it does not naturally push back on the premise. It does not ask "should we build this at all?" before answering "how should we build it?" It does not hold legal review as a gate before architecture starts. It does not log disagreements so the team can learn from them later. Without these mechanisms, you get the appearance of a team without the substance of one.

team-sdk solves this by treating the problem as organizational design, not prompt engineering. A shared protocol governs how agents communicate, what gates they must pass, how decisions are logged, and when dissent is required. Agents have personas, domain expertise, skill levels, and professional obligations. The system has hard gates that cannot be skipped, a permanent decision record, and iteration loops with exit criteria. The judgment is the product. The code is a byproduct.

## What It Is

team-sdk is an AI agent orchestration framework for product teams. It gives you 30+ role-based agents that work together from idea to shipped increment under a shared contract -- and standalone, answering domain questions without a project. It runs on Claude Code.

The SDK operates in two modes:

**Project Mode** is the full team activated for a specific project. You run `sdk-init`, give the CEO your brief, and the system routes discovery through legal, security, finance, market, architecture, product, design, and engineering -- in sequence, with hard gates between phases. Every decision is logged. Every agent reads from a shared state. The output is a shipped increment with a permanent record of how it got there.

**Consultation Mode** is any agent answering standalone domain questions without a project context. You say `/ask CTO should we build this in-house or use a managed service?` and the CTO responds from domain expertise, spawning peer agents when cross-domain synthesis would change the answer. No project files needed. No Bus format. Just a sharp answer with the reasoning visible.

## The Agent Team

Agents are organized into five layers. Each agent has a persona, a domain, a skill level, and a professional obligation to dissent when something is wrong.

### Strategic Layer

| Agent | Role | Purpose |
|---|---|---|
| **Greg (CEO)** | Strategic anchor | Holds the vision, validates the brief, makes final calls. Default voice on every project. |
| **Coordinator** | PMO and org memory | Sequences work, routes communication, seals releases. The nervous system. |

### Domain Specialists

| Agent | Role | Purpose |
|---|---|---|
| **CLO** | Legal | Regulatory map, compliance gates. Hard gate for CTO. |
| **CISO** | Security | Threat model, security non-negotiables. Hard gate for CTO. |
| **CFO** | Finance | Budget validation, runway model, unit economics. |
| **CMO** | Market | Positioning, competitive landscape, GTM framing. |
| **CRO** | Revenue | Revenue model, pricing, go-to-market execution. |
| **CDO** | Data | Instrumentation plan, data governance, analytics. |
| **COO** | Operations | Vendor stack, operational runbook, support model. |
| **CHRO** | People | Team composition, hiring, onboarding, culture. |

### Execution Layer

| Agent | Role | Purpose |
|---|---|---|
| **CTO** | Architecture | Architecture brief, make/buy matrix, team sizing. Activates after CLO + CISO gate. |
| **Mario (Chief Engineer)** | Architectural authority | Reviews every irreversible decision before Sprint 1. |
| **PM** | Product | Mission shaping, user stories, scope, friction log. |
| **Designer** | Interface design | All surfaces: screen, conversation, AI, voice. Phase 1 perspective + Phase 2 direction. |
| **Staff Engineer** | Platform | Interface contracts, platform primitives, component architecture. |
| **EM** | Delivery | Mission pod composition, critical path, sprint management. |
| **IC Engineers** | Implementation | Named at spawn time by EM. Execute within pods. |
| **Liaison** | Communication bridge | Filters execution noise for leadership. Active Sprint 1 through ship. |
| **Test Engineer** | Quality | Test strategy, CI gates, coverage, regression. |

### Research Chapter (Independent)

| Agent | Role | Purpose |
|---|---|---|
| **UX Researcher** | User research | Independent chapter. Any agent can request a study. Scientific method. Evidence, not opinion. |

### Extended Specialists (On-Demand)

| Agent | Activates when |
|---|---|
| **Chief Risk Officer** | Real money, credit, or operational complexity |
| **Chief Compliance Officer** | Regulated industry -- stays active through execution |
| **Chief Customer Officer** | First enterprise customer approaching go-live |
| **Chief Protocol Officer** | Protocol project (tokenomics, governance design) |
| **Chief Credit Officer** | Lending or credit decisioning |
| **Chief Partnerships Officer** | Ecosystem, distribution, or integration strategy |
| **Chief Analytics Officer** | Measurable hypothesis or ML component |
| **Chief AI Officer** | Any AI component -- activates alongside CTO |

### Iteration Guardians

| Agent | Purpose |
|---|---|
| **Discovery Guardian** | Validates problem understanding before Architecture. Reviews cross-domain coherence. |
| **Architecture Guardian** | Validates design soundness and problem traceability before Execution. |
| **Implementation Guardian** | Validates problem-solution fit and longevity per pod. Distinct from the pod Guardian who checks code quality. |

Full role definitions are in `team/roles/`. Each file defines the agent's persona, operating loop, context loading, consultation mode, challenge obligations, and skill ladder.

## How a Project Flows

A project moves through five phases. Three hard gates enforce quality: CLO + CISO must deliver before CTO activates, Mario must review irreversible decisions before Sprint 1, and the CEO must validate the project map before the release seals.

### Phase 0: Brief

The Coordinator receives the Owner's brief (via CEO or directly) and runs a discovery ping-pong. Maximum four rounds. The brief is not ready until the Coordinator can answer five questions: What is the product? Who uses it? What does success look like? What constraints are non-negotiable? What is the riskiest assumption?

### Phase 1: Discovery (Parallel)

Discovery activates the team in sequence, with significant parallelism:

1. **CEO** -- strategic framing, non-negotiables, decision authority
2. **CLO + CISO** -- regulatory map, legal blockers, security non-negotiables. This is the first hard gate: CTO cannot activate until both deliver.
3. **CFO, CMO, CRO, CDO, COO, CHRO** -- run in parallel. Their outputs inform but do not gate Phase 2.
4. **UX Researcher + Designer + PM** -- run in parallel with the domain specialists above. UX Researcher tests assumptions. Designer produces a design perspective brief. PM shapes missions informed by all discovery outputs.
5. **Discovery Guardian** -- reviews the iteration. If all six exit criteria pass, the loop graduates and Phase 2 begins. If not, the team iterates with specific feedback.

The parallel structure means the CTO can start as soon as CLO + CISO deliver, absorbing other Phase 1 outputs as they arrive. CFO, CMO, and the rest do not block progress -- they enrich it.

### Phase 2: Architecture and Release Plan

6. **CTO** -- architecture brief, make/buy matrix, team sizing
7. **Mario** -- irreversible decision review. Second hard gate.
8. **Designer** -- full interface direction brief (all surfaces)
9. **PM** -- user story map, scope definition, refined from Phase 1 shaping
10. **Staff Engineer** -- interface contracts, platform primitives
11. **EM** -- mission pod composition, critical path, Sprint 0 gate
12. **Architecture Guardian** -- reviews the iteration. Graduation required before execution begins.

Between Mario's review and Sprint 1, the team produces a **pre-mortem** -- the post-mortem for the failure case, written before execution. Top 3 failure modes, leading indicators, non-goal drift risk, and the single assumption that kills the mission if wrong. The Owner reads it and either proceeds or kills the pod.

### Phase 3: Execution

Pods execute against the critical path. The Liaison bridges execution and leadership. EM manages the path. PM holds scope. Engineers build.

The **Implementation Guardian** reviews per pod after sprint batches. Graduation is required before the pod can dissolve. This is distinct from the pod Guardian's code quality check -- the Implementation Guardian checks problem-solution fit and longevity.

### Phase 4: Release Seal

All agents write their consequential decisions to `history.md` and their area logs. PM seals the mission kanban. EM dissolves pods. CEO validates `project-map.md` -- the third hard gate. The Coordinator seals the release only after CEO validation.

## Iteration Loops

The SDK has three iteration loops, each governed by a Guardian agent. Loops are the mechanism that turns "good enough" into "actually ready." Each loop has six exit criteria. All six must pass for the Guardian to issue a GRADUATE verdict.

### Discovery Loop

**Guardian:** Discovery Guardian
**When:** After Phase 1 agents have delivered their first outputs
**Exit criteria:**
- Problem statement is falsifiable
- Target user is specific enough to exclude someone
- Regulatory constraints are mapped with confidence levels
- At least one core assumption has been tested, not just stated
- Non-goals are explicit and reasoned (not deferred features)
- The brief could survive a FRAMING-CHALLENGE without collapsing

The Discovery Guardian cross-references domain outputs against each other. If CLO mapped constraints but PM's scope ignores them, that is a gap. If CMO's positioning targets enterprise but the user definition is consumer, that is a gap. The Guardian names specific inconsistencies and either graduates or iterates with actionable feedback.

### Architecture Loop

**Guardian:** Architecture Guardian
**When:** After CTO delivers the architecture brief
**Exit criteria:**
- Architecture serves at 10x current scale without fundamental redesign
- Every irreversible decision has a named alternative and documented rejection reason
- Interface contracts are complete enough for independent pod execution
- Make/buy/partner decisions have cost projections beyond year 1
- Security model satisfies CISO's non-negotiables (not deferred)
- The design traces back to the graduated Discovery output (not a drifted version)

The Architecture Guardian checks traceability: does the architecture actually solve the problem Discovery graduated? If the problem drifted during architecture work, the Guardian flags it and may kick it back to Discovery.

### Implementation Loop

**Guardian:** Implementation Guardian
**When:** EM triggers a review after a sprint batch
**Exit criteria:**
- Deliverables match the spec from the graduated Architecture output
- No security shortcuts taken (auth, data handling, secrets management)
- Code is maintainable by a team that did not write it
- Edge cases from the pre-mortem are handled or explicitly deferred with reason
- Instrumentation covers the friction points PM identified
- The output creates user capability, not dependency

The Implementation Guardian is distinct from the pod Guardian. The pod Guardian checks code quality and invariant enforcement during sprints. The Implementation Guardian checks whether what was built actually solves the problem it was supposed to solve. Both must approve before a pod can dissolve.

### Escalation

If a loop does not graduate after 3 cycles, the Guardian must escalate to the CEO. This is not optional. Three cycles without graduation is a signal that the work has a structural problem, not just a polish problem.

Iteration files live in `iterations/<loop-name>/` as scratch space. They are an audit trail, not canonical project docs. Guardians have review authority only -- they do not write to requirements files or area logs.

## The Indexing System

The SDK generates `context-index.json` for every project -- a machine-readable map that tells agents what files exist, who owns them, which are stale, and what to load for any given topic.

### What it contains

- **File catalog:** Every project file with its domain, owner, purpose, age in hours, and staleness flag (stale after 48 hours for core files, 168 hours for studies)
- **Org domains:** Fixed organizational domains (strategy, engineering, legal, security, product, design, business, people, research) with their lead agent, consultation agent, and files
- **Project domains:** Project-specific business domains with L0 summaries (inline, ~200 tokens each) and L1 detail files (loaded on demand)
- **queryMap:** A static lookup table mapping 40+ topics to the files an agent should read and the agent to consult. Topics like `architecture`, `legal-constraints`, `pricing`, `hiring`, `irreversible-decision` each resolve to specific files and a specific agent.
- **opsMap:** Machine-readable catalog of operations agents can perform, with required fields and write flags
- **Sessions:** Permanent session records with title, date, domains, tags, and participants

### How agents use it

When an agent activates, it reads `context-index.json` first. Instead of loading every requirements file, it looks up its activation trigger in the queryMap and loads only the files listed in the `read` array. A CTO activating for an architecture review loads `engineering-requirements.md` and `history.md`. A CLO activating for a compliance check loads `compliance-requirements.md`. Nobody loads everything.

This is how the system scales to 30+ agents without drowning in context. Each agent loads what it needs, when it needs it.

Regenerate with: `sdk-doc index <project-dir>`

## The Protocol

The protocol (`protocol.md`, v4.3) is the shared interface contract. Every agent references it. No agent duplicates it. It is split into two files for context-window efficiency:

- **`protocol-core.md`** (Sections 0-13): Bus format, escalation, requirements, pods, area logs, session continuity. Loaded every session.
- **`protocol-reference.md`** (Sections 14-30): Ratchet doctrine, iteration loops, risk tiers, kill log, pre-mortem, disagreement log, design principles. Loaded when the topic requires it.

### The Bus

The only valid format for inter-agent communication:

```
FROM: [Agent name] ([Role])
TO: [Target agent] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID
MESSAGE: [body]
```

Every Bus message is logged to `bus-log.md` -- an append-only record with timestamps. The intent resolver pattern-matches messages post-hoc and recommends actions (advisory, not auto-execute).

### Escalation Ladder

One path. No exceptions:

1. Direct to owning agent (24 hours)
2. Coordinator (48 hours)
3. Relevant C-suite (if no resolution)
4. CEO (if C-suite cannot resolve)
5. Owner (if CEO flags it)

BLOCKERs move faster: 4 hours at Step 1, Coordinator if unresolved. P0 security incidents bypass the ladder entirely -- CISO notifies CEO and CLO within 1 hour.

### SOLUTION_CLASS

Required on all output-bearing messages from CTO, Mario, EM, Staff Engineer, and Coordinator. This is the protocol's primary defense against a failure mode called the Halloway Ratchet -- where an AI agent applies exploratory reasoning to a problem that has a known, deterministic solution. KNOWN means name the solution and apply it. EXPLORATORY means state why the known approach does not apply. HYBRID means decompose the problem and handle each part at the right level.

### Structured Disagreement

When agents hold conflicting positions on a consequential decision, the disagreement is documented -- not just escalated. Both positions, the tradeoff, the decision, and the dissent on record are captured permanently. Disagreements are never deleted. An agent who disagrees with the resolution gets their concern logged. This prevents false consensus.

### Business Unit Communication

Roles report to their BU lead (the C-level who owns their domain), not directly to the Coordinator. The BU lead aggregates domain state and forwards a single coherent message. Nine BUs: Strategy, Engineering, Product, Research, Legal & Security, Finance & Revenue, Go-to-Market, Data & AI, Operations & People.

## Risk Tiers

Not every project needs the full ceremony. The protocol adjusts based on the project's characteristics -- what it handles, who it affects, and what the consequences of failure look like. The Coordinator assigns a risk posture during Phase 0 based on the brief.

Projects handling real money, user PII, regulated activity, or credit decisions get the full gate matrix: CLO + CISO hard gate, Mario's irreversibility review, pre-mortem, all three iteration loops, and structured disagreement documentation.

Projects building internal tools, prototypes, or low-stakes features can streamline. The hard gates still apply (CLO + CISO before CTO is non-negotiable), but the iteration loops, pre-mortem, and extended specialist activations are opt-in based on the Coordinator's assessment.

The key principle: gates protect sequence. Iteration loops protect quality. The gates are always enforced. The loops scale with risk.

## File Structure

When you run `sdk-init`, the system creates a project directory with this structure:

### Core Files

| File | Purpose |
|---|---|
| `project.md` | Full conversation record and release plan |
| `history.md` | Permanent decision record -- all consequential decisions with rationale |
| `current-status.md` | Session continuity -- read every session, always first |
| `idea.md` | Day 0 brief -- raw idea shaped into the CEO activation message |
| `project-map.md` | CEO-validated release artifact -- sealed at project completion |
| `team.md` | Active agent roster, metrics, dissolved agents history, onboarding log |
| `.sdkrc` | SDK configuration -- release ID, squad type, project metadata |

### Consolidated Requirements (7 files)

| File | Owner | Covers |
|---|---|---|
| `general-requirements.md` | Coordinator | Cross-domain aggregate |
| `engineering-requirements.md` | CTO | Architecture, delivery, contracts, AI components |
| `product-requirements.md` | PM | Scope, user stories, missions |
| `compliance-requirements.md` | CLO + CISO | Legal, regulatory, security, threat model |
| `design-requirements.md` | Designer | Interface, UX research |
| `business-requirements.md` | CFO | Finance, marketing, revenue, data, ops, people, partnerships |
| `research-requirements.md` | UX Researcher | Research backlog, study tracking |

### Area Logs (4 files)

| File | Who writes |
|---|---|
| `strategy-log.md` | CEO, Coordinator, CLO, CISO, CFO, COO |
| `product-log.md` | PM, CMO, CRO, CDO, CHRO, EM |
| `engineering-log.md` | CTO, Mario, Staff Eng, EM, all ICs |
| `design-log.md` | Designer, PM (UX decisions) |
| `research-log.md` | UX Researcher |

### Generated Files

| File | Generated by |
|---|---|
| `context-index.json` | `sdk-doc index` -- file map, queryMap, domain routing |
| `context-manifest.json` | `sdk-doc manifest` -- current phase, missions, next agent |

### Dynamic Directories

```
domains/            Project-specific business domains (L0 summaries + L1 detail)
research/studies/   Published UX research studies
sessions/           Temp and permanent session memory
iterations/         Scratch space for iteration loops (discovery, architecture, implementation)
```

## CLI Reference

### Project Setup

| Command | Purpose |
|---|---|
| `sdk-init <name> --squad <type> [--idea "..."]` | Create and prime a new project |
| `sdk-resume <project-dir>` | Start session: check + gate + next action |
| `sdk-status <project-dir>` | Missions table, open decisions, activation phrase |
| `sdk-next <project-dir>` | Just the next activation phrase |

### Documentation

| Command | Purpose |
|---|---|
| `sdk-doc status <project-dir>` | Full `current-status.md` narrative |
| `sdk-doc manifest <project-dir>` | Generate `context-manifest.json` |
| `sdk-doc index <project-dir>` | Generate `context-index.json` (file map + query routing) |
| `sdk-doc study <project-dir> create --title "..."` | Create a research study file |
| `sdk-doc study <project-dir> list` | List all studies |
| `sdk-doc decision history.md --decision "..."` | Log a decision to history |
| `sdk-doc log <area-log> --role X --goal "..."` | Write an area log entry |
| `sdk-doc append <file> --section "..." --content "..."` | Append to a section |
| `sdk-doc bu-status <project-dir>` | Auto-generate BU Status Message |

### Gates and Quality

| Command | Purpose |
|---|---|
| `sdk-gate-check <project-dir>` | CLO + CISO gate |
| `sdk-gate-check <project-dir> --mario` | Mario gate (irreversible decisions) |
| `sdk-gate-check <project-dir> --pre-mortem` | Pre-mortem gate |
| `sdk-validate <project-dir>` | Advisory doc health check |
| `sdk-health <project-dir>` | Staleness + validate + manifest + ratchet check |
| `sdk-pre-tag <project-dir>` | Full team review: coherence + cohesion + validate + health |
| `sdk-pre-tag <project-dir> --fix` | Same + auto-fix missing files and release ID drift |
| `sdk-ship <project-dir> <release-id>` | Validate, tag, push, release notes |

### Release Lifecycle

| Command | Purpose |
|---|---|
| `sdk-version <project-dir>` | Show / bump / set release ID |
| `sdk-retro <project-dir>` | Interactive retrospective |
| `sdk-kill <project-dir> <pod> --reason "..." --class <class>` | Kill a pod or mission |

### GitHub Integration

| Command | Purpose |
|---|---|
| `sdk-github link <project-dir> --repo owner/repo` | Link project to GitHub repo |
| `sdk-github sync-issues <project-dir>` | Sync issues |
| `sdk-github release <project-dir>` | Create GitHub release |
| `sdk-github status <project-dir>` | Show GitHub status |

## Getting Started

**Step 1: Install**

```bash
npm install -g company-sdk
```

**Step 2: Create a project**

```bash
sdk-init my-project --squad startup --idea "B2B invoicing for freelancers in LATAM"
```

Four squad types are available: `startup` (full team), `mvp` (lean), `feature` (single feature), `website` (marketing site).

**Step 3: Fill in the brief**

Open `my-project/idea.md` and complete Section 4 -- the structured brief that becomes Greg's activation message.

**Step 4: Talk to Greg**

Open the project in Claude Code and say:

> Hey Greg -- here's the brief: [paste Section 4 from idea.md]

Greg reviews the brief, identifies whether you need specialists beyond the standard team, and routes discovery through the agent sequence. From here, the protocol drives. Every agent reads `context-index.json` first, loads only what it needs, produces its output, and the Coordinator sequences the next activation.

To resume a session later:

```bash
sdk-resume my-project/
```

To consult any agent without a project:

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask what's the right data model for a multi-tenant SaaS?
```
