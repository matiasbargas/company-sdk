# Agent Manifest
**Version:** 2.0
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

PHASE 2 (Release Plan):
  11. CTO           -- architecture brief, make/buy matrix, team sizing
  12. Mario (Chief Engineer) -- irreversible decision review, cross-project coherence sign-off
  13. PM            -- user story map, scope definition
  14. Staff Engineer -- interface contracts, platform primitives
  15. EM            -- cell composition, critical path, Sprint 0 gate

PHASE 3 (Execution):
  16. Liaison       -- activated Sprint 1 day 1. Stays active until ship.
  [All execution layer agents remain active]

PHASE 4 (Completion):
  Coordinator runs retro synthesis. All agents read the retrospective.
  All agents write their consequential decisions to history.md before the release closes.
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
| **CLO** | Legal, compliance, contracts | `legal-requirements.md` | CEO → Owner | Financial, legal, or user data features |
| **CFO** | Budget, runway, unit economics | `finance-requirements.md` | CEO → Owner | Any cost or revenue component |
| **CISO** | Security, threat model, compliance | `security-requirements.md` | CTO → CEO → Owner | User data, keys, money, or PII |
| **CMO** | Market, positioning, launch | `marketing-requirements.md` | CEO → Owner | Before API/product design |
| **CRO** | Revenue, GTM, pricing | `revenue-requirements.md` | CEO → Owner | Monetization component |
| **CDO** | Data, instrumentation, governance | `data-requirements.md` | CTO → CEO → Owner | Any product that measures itself |
| **COO** | Vendors, operations, support | `operations-requirements.md` | CEO → Owner | External vendors or customer ops |
| **CHRO** | Hiring, onboarding, culture | `people-requirements.md` | CEO → Owner | New hires or team changes |

### Execution Layer

| Agent | Domain | Requirements file | Escalation path | Activation trigger |
|---|---|---|---|---|
| **CTO** | Architecture, make/buy, team sizing | `product-engineering-requirements.md` | CEO → Owner | After CLO + CISO gate |
| **Mario (Chief Engineer)** | Irreversible decision review, architectural authority over all ICs and Staff Engineers | `release-architecture-requirements.md` (shared with Staff Engineer) | CTO → CEO | After CTO architecture brief |
| **PM** | User story, scope, friction log | `product-requirements.md` | Coordinator → CEO | After CMO market context |
| **Staff Engineer** | Interface contracts, platform primitives | `release-architecture-requirements.md` | CTO → Mario → CEO | Cross-service work |
| **EM** | Cell management, critical path, sprint | `delivery-requirements.md` | Coordinator → CTO → CEO | 2+ engineers on the project |
| **Liaison** | Execution communication bridge | `liaison-log.md` (not a requirements file) | Coordinator → CEO | Sprint 1 day 1 |

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
       │    └── PM                         │
       │                                   ├── Cell-A (2 or 4 eng)
       │                                   └── Cell-B (2 or 4 eng)
       │
       └── [Direct escalation from any agent via the escalation ladder]
```

**Arrows = "output of A is input to B":**
- CLO + CISO → CTO (legal and security constraints shape architecture)
- CMO → CTO + PM (market context shapes API design and scope)
- CRO → PM + CFO (pricing shapes scope and financial model)
- CDO → CTO (instrumentation needs shape data model)
- COO → EM (vendor timelines shape critical path)
- CTO → Mario (architecture direction → irreversible decision review)
- Mario → Staff Engineer (architectural authority on craft and cross-team coherence)
- Staff Engineer → EM (interface contracts → sprint tickets)

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

---

## Context Loading (What Each Agent Reads When Activated)

Every agent reads these files before producing any output:

**All agents (mandatory):**
1. `project.md`
2. `history.md`
3. `protocol.md`
4. `general-requirements.md`
5. Their own `[domain]-requirements.md`

**Role-specific additions:**

| Agent | Also reads |
|---|---|
| CTO | Architecture brief or discovery document |
| Mario (Chief Engineer) | CTO's architecture brief, all active interface contracts, tech debt ledger |
| PM | User story map, friction log |
| EM | Current sprint tickets, critical path, cell ownership map |
| Staff Engineer | All interface contracts, tech debt ledger |
| Liaison | Liaison log from current sprint |
| CISO | CTO's architecture brief (to review security posture) |
| CLO | CTO's make/buy matrix (to review vendor contracts) |
| CDO | PM's friction log (to ensure measurability) |

---

## How to Add a New Agent

1. Copy `roles/_template.md`
2. Fill in all `[PLACEHOLDER]` values
3. Add the agent to this manifest: Role Directory table + Dependency Graph + Peer Integration Map (if applicable)
4. Add their requirements file to `project-template/` directory
5. Add their domain row to `project-template/general-requirements.md`
6. Add their context loading requirements to the table above
7. Send an INFO Bus message to the Coordinator announcing the new agent's domain and activation trigger

---

*Manifest v2.0. This is the Coordinator's map. Every routing decision references this file.*
