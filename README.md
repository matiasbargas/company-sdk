# Team SDK -- Reusable Agent Team Boilerplate

## What This Is

A copy-paste starter kit for running a software project using an AI agent team. Each file in `roles/` is a complete agent prompt -- paste it into a conversation and the agent is operational. Copy the `example-bitcoin-wallet/` folder, replace the content, and you have a running project with a full team in under an hour.

Every role is an agent. Not a document. Not a template to be summarized. A prompt that, when activated in a conversation, makes that agent a thinking participant in the project.

A team is complete when all areas are represented. Use the table below to decide which roles to activate -- but do not activate only the engineering roles and call it done. Legal, security, finance, people, and operations are not optional for a serious product. They are the difference between a project that ships and a company that survives shipping.

---

## The Complete Role Set

### Strategic Layer (always active)
| Role | File | What they own |
|---|---|---|
| **Coordinator** | `roles/coordinator.md` | Release management, organizational memory, Sprint 0 gate |
| **CEO** | `roles/ceo.md` | Strategic framing, final escalation, gate reviews |

### Domain Specialists (activate based on what the project touches)
| Role | File | What they own | Activate when... |
|---|---|---|---|
| **CLO** | `roles/clo.md` | Legal, compliance, regulatory map, contracts | Any financial, legal, or user data feature |
| **CFO** | `roles/cfo.md` | Budget, runway, unit economics, financial model | Any project with a cost or revenue component |
| **CISO** | `roles/ciso.md` | Threat model, security non-negotiables, compliance roadmap | Any product handling user data, keys, or money |
| **CMO** | `roles/cmo.md` | Market context, positioning, launch sequence | Before architecture is designed -- market shapes product |
| **CRO** | `roles/cro.md` | Revenue model, GTM, pricing, pipeline | Any project with a monetization component |
| **CDO** | `roles/cdo.md` | Instrumentation, metrics, data governance | Any product that needs to measure itself |
| **COO** | `roles/coo.md` | Vendor relationships, support model, operational runbook | Any project with external vendors or customer-facing operations |
| **CHRO** | `roles/chro.md` | Hiring, onboarding, team health, culture | Any project that requires new hires or team composition changes |

### Execution Layer (activate when engineering begins)
| Role | File | What they own |
|---|---|---|
| **CTO** | `roles/cto.md` | Architecture, make/buy decisions, team sizing, technical risk |
| **Mario (Chief Engineer)** | `roles/chief-engineer.md` | Irreversible decision review, architectural authority over all ICs and Staff Engineers, cross-project technical coherence, quality floor |
| **PM** | `roles/pm.md` | User story, scope definition, friction log, vision alignment |
| **Staff Engineer** | `roles/staff-engineer.md` | Interface contracts, platform primitives, cross-cell coherence, PR review |
| **EM** | `roles/em.md` | Cell management (max 2 cells), critical path, sprint planning, squad status |
| **Liaison** | `roles/liaison.md` | Execution communication bridge (team ↔ CEO/Coordinator) |

---

## The Cell Model

The atomic unit of an engineering team is a **cell**. Teams are assembled from cells. An EM manages a maximum of two cells.

**Cell-2:** 1 Senior + 1 Mid or Senior. Owns one service or module end-to-end. Minimal coordination overhead. The default pairing unit.

**Cell-4:** 1 Staff + 2 Senior + 1 Mid. Owns a full product slice. Can ship independently. Used when the ownership boundary is larger than one module.

**EM ratio:** 1 EM per 2 cells. At 3+ cells, add another EM. One EM managing 3 cells is not an EM -- they are a project tracker, and the cell model stops working.

```
Team tiers:

Tier 1 (Solo):         1 person                 -- not a cell, a spike
Tier 2 (Small):        1x cell-2 (2 eng)        -- 1 EM (lightweight)
Tier 3 (Medium):       1x cell-4 or 2x cell-2   -- 1 EM
Tier 4 (Large):        2x cell-4 or 4x cell-2   -- 2 EMs
Tier 5 (Program):      3-6x cell-4              -- 1 EM per 2 cells
```

Cell anti-patterns:
- A cell of 3 is not a cell. Either staff the cell-2 correctly or add the fourth person for cell-4.
- A cell of 5+ is two cells with blurred ownership. Split it and name the boundary explicitly.
- An EM managing 3+ cells is a bottleneck waiting to happen. Add an EM.

---

## How to Start a New Project

### Step 1: Copy two directories
```
cp -r team-sdk/roles/            your-project/roles/
cp -r team-sdk/project-template/ your-project/
cp    team-sdk/protocol.md       your-project/protocol.md
cp    team-sdk/AGENTS.md         your-project/AGENTS.md
```

You now have: 16 agent prompts (including Mario, the Chief Engineer), a blank `project.md`, a blank `history.md`, a `liaison-log.md` template, a `general-requirements.md` with all 12 domain rows, 12 empty domain requirements stubs, and the shared protocol and agent manifest. Everything pre-wired.

### Step 2: Fill in placeholders
In every role file and in project.md, replace:

| Placeholder | Replace with |
|---|---|
| `[COMPANY]` | Your project or company name |
| `[PERSONA NAME]` | A name for the agent (use names -- they create identity) |
| `[DOMAIN]` | The domain this agent owns |
| `[PROJECT_DIR]` | Path to your project directory |
| `[PROJECT NAME]` | The project name (in project.md, history.md, requirements) |
| `v[YEAR].Q[QUARTER].[INCREMENT]` | Your release ID (e.g., v2026.Q2.1) |

### Step 3: Activate agents in sequence
Follow the activation order in `AGENTS.md`. Every agent reads `protocol.md` and `project.md` before producing output. The order matters -- CLO + CISO output gates CTO architecture.

### Step 4: Run the project
The conversation goes into `project.md`. Decisions go into `history.md`. Domain tasks go into their requirements files. The Coordinator aggregates to `general-requirements.md` every sprint.

**Three structural files govern everything:**
- `protocol.md` -- how agents communicate (Bus format, escalation, decision logs, cell model)
- `AGENTS.md` -- who does what, activation order, dependency graph, peer handoffs
- `project.md` -- the conversation record and source of truth

### Step 5 (optional): Study the example
`example-bitcoin-wallet/` shows a complete project conversation for a Bitcoin wallet SDK. Read it before starting your own.

---

## Agent Communication Model

The Owner communicates through the CEO or Coordinator only. Execution is always through the flow of agents, never a direct command to an execution agent. See `protocol.md` Section 0.

```
OWNER
  |  \
  |   \──────────────────────────────────────────────────────────────────┐
  v                                                                       v
CEO <─────────────────────────────────────── Liaison (escalation only)  COORDINATOR
  |                                                    ^                    |
  v                                                    |                    |
COORDINATOR <────────────────────────── Liaison (daily sprint health)       |
  |                                                                        (or direct from Owner
  |──> CLO | CFO | CISO | CMO | CRO | CDO | COO | CHRO                    for process/status)
  |         (domain specialists, async)
  |
  |──> CTO ──────────────────────────────> Mario (Chief Engineer)
  |                                              |
  |──> PM                              ┌─────────┤
  |                                    v         v
  |                            Staff Engineer  all ICs (quality floor)
  |                                    |
  |                    Cell-A (2 eng) <──> EM <──> Liaison
  |                    Cell-B (4 eng) <──> EM
```

The Liaison is the only agent that crosses between the execution layer and leadership simultaneously. Mario is the only agent whose authority is horizontal across all engineering teams — not management, but craft. All other agents stay in their lane.

---

## File Map

```
team-sdk/
  README.md
  roles/
    _template.md              -- Blank 4-block prompt template
    -- Strategic layer --
    coordinator.md
    ceo.md
    -- Domain specialists --
    clo.md                    -- Legal, compliance, contracts
    cfo.md                    -- Budget, runway, unit economics
    ciso.md                   -- Security, threat model, compliance
    cmo.md                    -- Market, positioning, launch
    cro.md                    -- Revenue, GTM, pricing, pipeline
    cdo.md                    -- Data, instrumentation, metrics, governance
    coo.md                    -- Vendors, support model, operations
    chro.md                   -- Hiring, onboarding, team health
    -- Execution layer --
    cto.md                    -- Architecture, make/buy, team sizing
    chief-engineer.md         -- Mario: irreversible decision review, architectural authority over all ICs
    pm.md                     -- User story, scope, friction log
    staff-engineer.md         -- Interface contracts, platform primitives
    em.md                     -- Cell management, critical path, sprint
    liaison.md                -- Execution communication bridge
  example-bitcoin-wallet/
    project.md                -- Complete example: Owner -> CEO -> Team -> Plan
    marketing-review.md       -- CMO market analysis for simplicity positioning
```

---

*SDK v2.0. 16 roles. Cell model. All areas represented. Owner flow governed. Copy, customize, ship.*
