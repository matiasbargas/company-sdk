# Agent Manifest
**Version:** 3.0
**Owner:** Coordinator

This file lists every agent in the system, what they own, who they depend on, and when they activate. It is the Coordinator's reference for routing and activation. It is every agent's reference for knowing who else is in the room.

---

## Owner Communication Rule

The Owner communicates with the system through two channels only: Owner → CEO (for strategy and direction) or Owner → Coordinator (for release management and process). Execution is always through the flow of agents, never a direct command to an execution agent. See `protocol.md` Section 0.

## Activation Sequence

Agents activate in this order. Do not skip steps. Do not activate out of sequence. The output of each step is the input to the next.

```
PHASE 0 (Brief):
  1. Coordinator    -- receives Owner brief (via CEO or directly), runs discovery ping-pong

PHASE 1 (Discovery):
  2. CEO            -- strategic framing, non-negotiables, decision authority
  3. CLO            -- regulatory map, legal blockers → gates CTO
  4. CISO           -- security non-negotiables → gates CTO
  5. CFO            -- budget validation, runway model
  6. CMO            -- market context, competitive landscape → informs CTO + PM
  7. CRO            -- GTM model, pricing → informs PM + CFO
  8. CDO            -- instrumentation plan → informs CTO data model
  9. COO            -- vendor onboarding timelines → gates EM critical path
  10. CHRO          -- team composition, hiring plan
  10b. UX Researcher -- research plan, assumption testing, AI conversation analysis (parallel)
  10c. Designer     -- design perspective brief, problem framing through design lens (parallel)
  10d. PM           -- mission shaping informed by discovery outputs + design + research (parallel)

PHASE 2 (Release Plan):
  11. CTO           -- architecture brief, make/buy matrix, team sizing
  12. Mario (Chief Engineer) -- irreversible decision review, cross-project coherence sign-off
  13. PM            -- user story map, scope definition (refined from Phase 1 shaping)
  14. Designer      -- full interface direction brief (all surfaces: screen, conversation, AI, voice)
  15. Staff Engineer -- interface contracts, platform primitives
  16. EM            -- mission pod composition, critical path, Sprint 0 gate

PHASE 3 (Execution):
  16. Liaison       -- activated at Sprint 1 start. Stays active until ship.
  [All execution layer agents remain active]

PHASE 4 (Completion):
  Coordinator runs retro synthesis. All agents read the retrospective.
  All agents write their consequential decisions to history.md and their area logs before the release closes.
  PM seals the mission kanban board (product-log.md).
  EM dissolves pods and writes pod dissolution entries to product-log.md.
  CEO validates project-map.md (Section 11 checklist) before the release is sealed.
  Coordinator seals the project map only after CEO validation.
```

**Critical gate:** CLO + CISO output is required before CTO starts architecture. This is the most commonly skipped step and the most expensive to skip.

**Second critical gate:** Mario (Chief Engineer) reviews CTO's irreversible decisions before any implementation begins. Architecture that has not passed Mario's review before Sprint 1 is unreviewed architecture.

---

## Role Directory

### Strategic Layer

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **Coordinator** | Release management, org memory | `general-requirements.md` | CEO → Owner | Always first. Every project. |
| **CEO** | Strategy, vision, final call | (none -- delegates to domains) | Owner | Every project. Phase 0. |

### Domain Specialists

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **CLO** | Legal, compliance, contracts | `compliance-requirements.md` | CEO → Owner | Financial, legal, or user data features |
| **CFO** | Budget, runway, unit economics | `business-requirements.md` | CEO → Owner | Any cost or revenue component |
| **CISO** | Security, threat model, compliance | `compliance-requirements.md` | CTO → CEO → Owner | User data, keys, money, or PII |
| **CMO** | Market, positioning, launch | `business-requirements.md` | CEO → Owner | Before API/product design |
| **CRO** | Revenue, GTM, pricing | `business-requirements.md` | CEO → Owner | Monetization component |
| **CDO** | Data, instrumentation, governance | `business-requirements.md` | CTO → CEO → Owner | Any product that measures itself |
| **COO** | Vendors, operations, support | `business-requirements.md` | CEO → Owner | External vendors or customer ops |
| **CHRO** | Hiring, onboarding, culture | `business-requirements.md` | CEO → Owner | New hires or team changes |

### Extended Domain Specialists

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **Rafael (Chief Risk Officer)** | Enterprise risk register, model risk, operational + financial risk | `business-requirements.md` | CEO → Owner | Any product handling real money, credit, or significant operational complexity |
| **Andrea (Chief Compliance Officer)** | Compliance program, monitoring, regulatory exams, training | `compliance-requirements.md` | CLO → CEO → Owner | Any regulated industry; stays active through execution |
| **Natalia (Chief Customer Officer)** | Post-sale NRR, customer success, professional services, renewals | `business-requirements.md` | CEO → Owner | First enterprise customer approaching go-live |
| **Emiliano (Chief Protocol Officer)** | Tokenomics, governance design, protocol economics, treasury | `business-requirements.md` | CEO → Owner | Any project that is a protocol, not just a product on a chain |
| **Paola (Chief Credit Officer)** | Underwriting policy, credit models, fair lending, portfolio risk | `business-requirements.md` | CRO Risk → CEO → Owner | Any lending or credit decisioning product |
| **Leonardo (Chief Partnerships Officer)** | Strategic partnerships, BD, channel programs, integration ecosystem | `business-requirements.md` | CEO → Owner | Product with ecosystem, distribution, or integration strategy |
| **Diana (Chief Analytics Officer)** | Experimentation, measurement plans, BI, model performance monitoring | `business-requirements.md` | CEO → Owner | Any product with a measurable hypothesis or ML component |
| **Pablo (Chief AI Officer)** | AI strategy, evaluation framework, responsible AI governance, AI capability | `engineering-requirements.md` | CTO → CEO → Owner | Any product with AI components; activates alongside CTO in Phase 2 |

### Design Layer

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **Designer** | Interface design (screens, conversation, AI, voice), design system | `design-requirements.md` | PM → Coordinator → CEO | Phase 1 (discovery perspective) + any mission with a user-facing surface (Phase 2 full direction) |

### Research Chapter (Independent)

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **UX Researcher** | User research, studies, insight synthesis, AI conversation analysis | `research-requirements.md` | Coordinator → CEO | Any agent requests a study; Discovery phase; mission cycle |

### Execution Layer

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **CTO** | Architecture, make/buy, team sizing | `engineering-requirements.md` | CEO → Owner | After CLO + CISO gate |
| **Mario (Chief Engineer)** | Irreversible decision review, architectural authority over all ICs and Staff Engineers | `engineering-requirements.md` | CTO → CEO | After CTO architecture brief |
| **PM** | User story, scope, friction log | `product-requirements.md` | Coordinator → CEO | After CMO market context |
| **Staff Engineer** | Interface contracts, platform primitives | `engineering-requirements.md` | CTO → Mario → CEO | Cross-service work |
| **EM** | Mission pod management, critical path, sprint | `engineering-requirements.md` | Coordinator → CTO → CEO | 2+ engineers on the project |
| **Engineer (IC)** | Feature implementation, ticket execution | `engineering-requirements.md` | EM → Staff Eng → Mario → CTO | When a pod is active. EM assigns a unique name (first name + place surname) at spawn time. Aim for diverse representation across the pod. No two active engineers share a name or place. Names are AI agent identifiers only — not hiring guidance. See `DISCLAIMER.md`. |
| **Liaison** | Execution communication bridge | (area logs only — no requirements file) | Coordinator → CEO | Sprint 1 start |
| **Test Engineer** | Test strategy, coverage, CI gates, regression | `test/` directory, CI config | EM → Staff Eng → Mario | When scripts or features are shipping. Owns test suite quality. |

---

## Dependency Graph

```
Owner
  └── CEO  ←──────────────────────── (Owner always enters here or via Coordinator)
       ├── Coordinator
       │    ├── CLO ────────────┐
       │    ├── CISO ───────────┤
       │    │                   ├── CTO (blocked until CLO + CISO deliver)
       │    ├── CFO             │    └── Mario (Chief Engineer) ← reviews CTO irreversibles
       │    ├── CMO ────────────┤         ├── Staff Engineer (craft authority)
       │    ├── CRO             │         └── all ICs (quality floor)
       │    ├── CDO ────────────┘
       │    ├── COO                   Staff Engineer → EM (contracts → tickets)
       │    ├── CHRO                  EM → Liaison
       │    │                              │
       │    ├── UX Researcher ─────┐       ├── Mission Pod-A (PM + 2-3 Eng)
       │    │   (Research Chapter)  ├──→ PM └── Mission Pod-B (PM + Designer + 2-3 Eng)
       │    ├── Designer ──────────┘
       │    └── PM
       │
       │   [UX Researcher is an independent chapter — any agent can request studies]
       │
       └── [Direct escalation from any agent via the escalation ladder]
```

**Arrows = "output of A is input to B":**
- CLO + CISO → CTO (legal and security constraints shape architecture)
- CMO → CTO + PM (market context shapes API design and scope)
- CRO → PM + CFO (pricing shapes scope and financial model)
- CDO → CTO (instrumentation needs shape data model)
- COO → EM (vendor timelines shape critical path)
- UX Researcher → ALL (published studies are accessible to all agents via research/studies/)
- UX Researcher → PM (insights sharpen mission shaping and friction log)
- UX Researcher → Designer (evidence grounds interface direction)
- UX Researcher → CMO (user behavior validates or challenges positioning)
- Designer (Phase 1) → PM (design perspective informs mission shaping)
- PM → Designer (Phase 2: mission scope defines interface surface)
- Designer → Staff Engineer (interface constraints shape component architecture)
- Designer → EM (design artefacts must be ready before pod builds)
- Any agent → UX Researcher (RESEARCH REQUEST triggers a study)
- CTO → Mario (architecture direction → irreversible decision review)
- Mario → Staff Engineer (architectural authority on craft and cross-team coherence)
- Staff Engineer → EM (interface contracts → sprint tickets)
- EM → Engineer/IC (tickets and critical path → execution)
- Staff Engineer → Engineer/IC (quality floor and interface contracts → implementation)

---

## Peer Integration Map

These pairs share domain boundaries and must coordinate. See `protocol.md` Section 9 for the handoff rules.

| Pair | Shared boundary | Who resolves conflict |
|---|---|---|
| CLO + CISO | Compliance frameworks (SOC 2, GDPR) | CLO defines requirement, CISO implements. Coordinator escalates if they disagree. |
| CMO + PM | Positioning ↔ scope | PM flags scope conflicts. Coordinator routes to CEO. |
| CMO + CRO | Positioning ↔ pricing | Coordinator escalates if inconsistent. |
| CTO + COO | Architecture ↔ vendor lifecycle | CTO makes make/buy decision. COO manages vendor. |
| CDO + PM | Instrumentation ↔ friction signals | PM shares friction log. CDO ensures measurability. |
| Staff Eng + EM | Interface contracts ↔ sprint delivery | Staff Eng defines contracts. EM plans against them. |
| Mario + CTO | Architectural review ↔ architectural direction | CTO sets direction. Mario validates irreversible decisions before implementation. CTO makes the final call. |
| Mario + Staff Engineer | Craft authority ↔ within-project decomposition | Staff Engineer owns the technical decomposition per project. Mario owns cross-project coherence and quality floor. Conflicts escalate to CTO. |
| Liaison + EM | Communication ↔ squad status | EM sends status to Coordinator. Liaison copies and filters for CEO-level reporting. |
| Designer + PM | Interface constraints ↔ scope | PM owns scope. Designer flags when scope adds a new surface without design time. Coordinator routes conflict. |
| Designer + Staff Engineer | Interface architecture ↔ component contracts | Designer defines interaction behavior. Staff Engineer defines the component contract. Conflicts escalate to CTO. |
| UX Researcher + any agent | Study request ↔ study delivery | Any agent can send a RESEARCH REQUEST. UX Researcher prioritizes from backlog. Coordinator escalates priority disputes. |
| UX Researcher + PM | User evidence ↔ mission shaping | UX Researcher publishes studies. PM integrates findings into friction log and scope. |
| UX Researcher + CDO | Qualitative signals ↔ quantitative signals | UX Researcher owns behavioral observation. CDO owns instrumentation and metrics. Jointly responsible for full picture. |
| Designer + UX Researcher | Interface direction ↔ user evidence | UX Researcher provides evidence via published studies. Designer translates it into interface decisions. Neither can do their job without the other. |
| EM + Engineer/IC | Sprint tickets ↔ execution | EM owns the critical path. Engineer owns ticket delivery. Scope creep and blockers flow from Engineer to EM, not to PM or CTO directly. |
| Staff Eng + Engineer/IC | Interface contracts ↔ implementation | Staff Eng defines the contracts. Engineer implements against them. Contract disputes escalate to Staff Eng, not EM. |

---

## Context Loading (What Each Agent Reads When Activated)

Every agent reads these files before producing any output:

**All agents (mandatory):**
1. `project.md`
2. `history.md`
3. `protocol.md`
4. `general-requirements.md`
5. Their own `[domain]-requirements.md`
6. `current-status.md` — the session continuity file (always read this; it tells you where the team is right now)
7. The area log(s) relevant to your role (see `protocol.md` Section 12)

**Role-specific additions:**

| Agent | Also reads |
|---|---|
| CTO | Architecture brief or discovery document |
| Mario (Chief Engineer) | CTO's architecture brief, all active interface contracts, tech debt ledger |
| PM | User story map, friction log |
| EM | Current sprint tickets, critical path, mission pod map, current-status.md |
| Staff Engineer | All interface contracts, tech debt ledger |
| Liaison | Liaison log from current sprint |
| CISO | CTO's architecture brief (to review security posture) |
| CLO | CTO's make/buy matrix (to review vendor contracts) |
| CDO | PM's friction log (to ensure measurability) |
| Designer | Phase 1: CEO framing, CMO market context, UX Researcher synthesis. Phase 2: PM's user story map and friction log; interface direction brief |
| UX Researcher | `research-requirements.md` (backlog); `research-log.md`; published studies in `research/studies/`; PM's friction log; CDO's usage analytics; AI conversation logs |
| Engineer/IC | Current sprint tickets (acceptance criteria + dependencies); interface contracts relevant to assigned work; EM's most recent pod status |

---

## How to Add a New Agent

1. Copy `team/roles/_template.md`
2. Fill in all `[PLACEHOLDER]` values
3. Add the agent to this manifest: Role Directory table + Dependency Graph + Peer Integration Map (if applicable)
4. Map the agent to the correct requirements file in the Role Directory table. Use the existing consolidated files — do not create a new requirements file unless the domain genuinely cannot fit into any existing one:
   - `compliance-requirements.md` — legal, regulatory, security, threat model
   - `business-requirements.md` — finance, marketing, revenue, data, ops, people, partnerships, risk
   - `engineering-requirements.md` — architecture, delivery, contracts, AI components
   - `product-requirements.md` — scope, user stories, missions
   - `design-requirements.md` — interface, UX research
   - `general-requirements.md` — cross-domain (Coordinator aggregate)
5. Add their domain row to `project-template/general-requirements.md`
6. Send an INFO Bus message to the Coordinator announcing the new agent's domain and activation trigger

---

## Two Cycles

The SDK operates in two cycles. See `protocol.md` Section 15 for the full definition.

| Cycle | Governor | Output | Transitions via |
|---|---|---|---|
| **Ideation Cycle** | PM (Product) | Shaped, appetized mission brief | Betting Table |
| **Shipping Cycle** | CPTO / Owner | Shipped increment | Retrospective → next Ideation Cycle |

Phases 0-2 (discovery through SDD) are **Ideation**. Phase 3-4 (execution through ship) are **Shipping**. The Betting Table is the formal gate between them.

---

## Sub-Role Creation

Any C-level agent may create sub-roles within their own domain without a protocol change. See `protocol.md` Section 14 for the full rules. Key points:
- Same naming convention: first name (common worldwide) + city surname, diverse geographic spread
- Sub-roles inherit no authority above their level — they operate within the C-level's scope
- C-level sends an INFO Bus message to Coordinator on activation and dissolution

---

## Consultation Mode

Any agent can operate in **Consultation Mode** — answering standalone domain questions without a project context. See `team/roles/CONSULT.md` for the full guide and `protocol.md` Section 16 for the protocol rules.

### Activating an agent in Consultation Mode

Use the skills in `.claude/commands/`:
- `/askGreg [question]` — consult the CEO on strategy, direction, or cross-domain tradeoffs
- `/askCTO [question]` — consult the CTO on architecture, systems, or technical decisions
- `/ask [question]` — routes to the most qualified agent and synthesizes perspectives

Or address any agent directly by name in a conversation:
> "Camila, what does GDPR actually require for a product that stores behavioral data?"
> "Hey Mario, is this architecture decision reversible?"
> "CAIO, what evaluation framework should I use for this language model?"

No project files are needed. The agent responds from domain expertise alone.

### Spawning policy in the agent lifecycle

The same spawning-for-understanding principle that governs consultation also governs cross-domain reasoning within a project:

**Spawn a peer when you need to understand a problem, not when you need to delegate a task.**

An agent that needs to understand a constraint from another domain does not route it through the Coordinator — it spawns a brief peer consultation, integrates the perspective, and delivers its own output. The Coordinator handles inter-agent task coordination; agents handle inter-agent understanding.

| Situation | What to do |
|---|---|
| Need another agent to produce a deliverable | Route through Coordinator via Bus |
| Need another agent's domain knowledge to inform your own output | Spawn a consultation (Agent tool) |
| Question that belongs fully to another domain | Escalate via Bus — do not answer on their behalf |

Spawn every peer agent whose domain input would change your answer — prioritize understanding over time, no cap on spawns. Synthesize, never relay.

### Consultation produces edge

When an agent consults a peer, it is not just getting an answer. It is building the asker's model of the problem. The goal of consultation is that the person leaves with better judgment — not just the answer to this question, but a slightly sharper ability to reason about this class of problem.

This is why spawning for understanding is the standard, not the exception. Every agent in this system should default to richer synthesis over faster answers.

---

*Manifest v2.5. This is the Coordinator's map. Every routing decision references this file.*
