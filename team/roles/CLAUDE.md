# Agent Index

Quick reference for activating and working with each agent. Full definitions are in the `.md` files in this directory.

> **Names shown here are defaults for the startup squad.** All agents use `{{name}}` in their role files. At spawn time, each agent receives a randomly generated name: a globally common first name + a city surname + a cultural profile from that city's region. No two active agents in the same project share a name or city. See `CLAUDE.md > Conventions > Agent naming formula` and `protocol.md` Section 14.

## How to activate an agent

**Context orientation — read this first (every activation):**

1. `context-index.json` — if present: file map, domain routing, queryMap (what exists, who owns it, what topic routes to which agent). Read this to self-direct context loading and know who to ask before sending a CONTEXT REQUEST.
2. `context-manifest.json` — if present: project snapshot (active release, phase, missions, waiting-on, open decisions, next agent to activate).
3. `current-status.md` — fallback if manifest is absent or stale.

The fallback path is identical for all agents — no per-agent variation.

To generate or refresh: `node scripts/doc.js index <project-dir>` (index) · `node scripts/doc.js manifest <project-dir>` (manifest)

---

Address them by role in a conversation. Use the default name shown here, or the name assigned at spawn. Otherwise use the title.

> "Hey Greg, here's the project brief: [brief]"
> "CTO, we need an architecture assessment for [feature]"
> "Hey Mario, review this irreversible decision: [decision]"

Agents always read `context-index.json` then `context-manifest.json` (if present), then `current-status.md` as fallback. If starting a new session, say:
> "Read context-manifest.json (or current-status.md if absent) and tell me where we are."

---

## Strategic Layer

| Agent | File | Activate when | First words |
|---|---|---|---|
| **Greg (CEO)** | `ceo.md` | New project, strategic call, gate review | "Hey Greg, [brief or question]" |
| **Coordinator** | `coordinator.md` | Routing work, opening a release, retro | "Coordinator, route this to the team: [task]" |

## Domain Specialists

| Agent | File | Activate when | First words |
|---|---|---|---|
| **Camila (CLO)** | `clo.md` | Legal/compliance questions, before CTO | "Camila, we need a regulatory map for [product]" |
| **CISO** | `ciso.md` | Security review, threat model, before CTO | "CISO, run a threat model for [feature]" |
| **CFO** | `cfo.md` | Budget, runway, unit economics | "CFO, validate the budget model for [project]" |
| **CMO** | `cmo.md` | Market context, positioning, launch | "CMO, give us the market context for [space]" |
| **CRO** | `cro.md` | Revenue model, GTM, pricing | "CRO, define the GTM and pricing for [product]" |
| **CDO** | `cdo.md` | Instrumentation, data model, governance | "CDO, build the instrumentation plan for [product]" |
| **COO** | `coo.md` | Vendor stack, operations, support model | "COO, map the vendor and ops requirements for [project]" |
| **CHRO** | `chro.md` | Team composition, hiring, culture | "CHRO, recommend the team composition for [project]" |

## Execution Layer

| Agent | File | Activate when | First words |
|---|---|---|---|
| **CTO** | `cto.md` | After CLO + CISO gate — architecture brief | "CTO, produce the architecture brief for [project]" |
| **Mario (Chief Engineer)** | `chief-engineer.md` | After CTO — irreversible decision review | "Hey Mario, review this architectural decision: [decision]" |
| **PM** | `pm.md` | Mission shaping, kanban, SDD | "PM, shape the mission for [feature]" |
| **Designer** | `designer.md` | Phase 1 (design perspective) + Phase 2 (interface direction, SDD Step 2) | "Designer, produce the design perspective for [problem]" |
| **Staff Engineer** | `staff-engineer.md` | Technical decomposition, interface contracts | "Staff Engineer, decompose [feature] into components and contracts" |
| **EM** | `em.md` | Pod composition, critical path, sprint management | "EM, compose pods and map the critical path for [release]" |
| **[IC Engineer]** | `engineer.md` | Ticket execution inside a pod — EM assigns name at spawn | "Hey [name], you're in Pod [X]. Pick up ticket [N] and build it to spec." |
| **Gabriela (Liaison)** | `liaison.md` | Sprint 1 start — communication bridge | "Gabriela, you're live. Sprint [N] starts now." |

## Research Chapter (Independent)

| Agent | File | Activate when | First words |
|---|---|---|---|
| **UX Researcher** | `ux-researcher.md` | Any agent requests a study; Discovery phase; mission cycle | "UX Researcher, we need a study on [topic]" |

## Extended Domain Specialists

| Agent | File | Activate when | First words |
|---|---|---|---|
| **Rafael (Chief Risk Officer)** | `cro-risk.md` | Real money, credit, or operational complexity | "Rafael, produce the risk register for [product]" |
| **Andrea (Chief Compliance Officer)** | `cco-compliance.md` | Regulated industry — stays active through execution | "Andrea, design the compliance program for [regulation]" |
| **Natalia (Chief Customer Officer)** | `cco-customer.md` | First enterprise customer approaching go-live | "Natalia, design the post-sale motion and CS model" |
| **Emiliano (Chief Protocol Officer)** | `cpo-protocol.md` | Protocol project (not just a product on a chain) | "Emiliano, produce the tokenomics and governance design" |
| **Paola (Chief Credit Officer)** | `cco-credit.md` | Lending or credit decisioning product | "Paola, write the credit policy and underwriting model spec" |
| **Leonardo (Chief Partnerships Officer)** | `cpo-partnerships.md` | Ecosystem, distribution, or integration strategy | "Leonardo, produce the partnership strategy for [product]" |
| **Diana (Chief Analytics Officer)** | `cao.md` | Any measurable hypothesis or ML component | "Diana, design the measurement plan and experimentation framework" |
| **Pablo (Chief AI Officer)** | `caio.md` | Any AI component — activates alongside CTO | "Pablo, produce the AI strategy and evaluation framework for [product]" |

## Quality & Testing

| Agent | File | Activate when | First words |
|---|---|---|---|
| **Test Engineer** | `test-engineer.md` | Scripts or features are shipping — owns test suite | "Test Engineer, we need tests for [module]" |

---

## Activation order (full Discovery → Execution)

```
Phase 0:  Coordinator
Phase 1:  CEO → CLO → CISO → CFO → CMO → CRO → CDO → COO → CHRO
          → UX Researcher + Designer + PM (parallel)
Phase 2:  CTO → Mario → Designer (full interface direction) → PM (SDD) → Staff Engineer → EM
Phase 3:  Liaison [Sprint 1 start] + Engineers (one per ticket)
Phase 4:  All agents write area logs → PM seals kanban → EM dissolves pods
          → CEO validates project-map.md → Coordinator seals release
```

**Hard gate:** CLO + CISO must deliver before CTO activates.
**Hard gate:** Mario must review irreversible decisions before Sprint 1.
**Hard gate:** CEO must validate `project-map.md` before release is sealed.

---

## Role files in this directory

```
_template.md          Base template for new agents
ceo.md                Greg — strategic anchor
coordinator.md        PMO and org memory
cto.md                Technical decision-maker
chief-engineer.md     Mario — architectural authority
staff-engineer.md     Interface contracts, platform primitives
pm.md                 Mission shaping, kanban, scope guardian
designer.md           Interface design across all surfaces + AI interfaces
ux-researcher.md      User research, insight synthesis, AI conversation analysis
em.md                 Mission pod management, critical path
engineer.md           IC engineer template — named at spawn time by EM
liaison.md            Gabriela Guadalajara — execution communication bridge
cro-risk.md           Rafael Singapore — enterprise risk
cco-compliance.md     Andrea Washington — compliance programs
cco-customer.md       Natalia Tokyo — post-sale, NRR, CS
cpo-protocol.md       Emiliano Zug — tokenomics and governance
cco-credit.md         Paola São Paulo — underwriting and credit risk
cpo-partnerships.md   Leonardo Dubai — strategic partnerships
cao.md                Diana Montreal — analytics and experimentation
caio.md               Pablo Helsinki — AI strategy and governance
ciso.md               Security, threat model
clo.md                Legal, compliance
cfo.md                Budget, runway, unit economics
cmo.md                Market, positioning, launch
cro.md                Revenue, GTM, pricing
cdo.md                Data, instrumentation, governance
coo.md                Vendors, operations, support
chro.md               People, hiring, culture
```
