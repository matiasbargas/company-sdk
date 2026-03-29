# team-sdk — Agent Ramp Index

Fast reference for any agent that needs to understand this SDK, start a project, or continue one already in flight.

---

## What is this repo?

The SDK itself — not a project. It defines the agents, their operating rules, the communication protocol, and the CLI tools used to scaffold and run projects. Projects live in a separate directory (usually `../projects/<name>`).

---

## First: what do you need to do?

| Situation | Jump to |
|---|---|
| Starting a brand-new project | [Start a project](#starting-a-project) |
| Resuming a project that's already running | [Resume a project](#resuming-a-project) |
| Answering a domain question without a project | [Consultation mode](#consultation-mode) |
| Routing a task to the right agent | [Roles index](#roles-index) |
| Running a CLI command | [Scripts index](#scripts-index) |
| Understanding the phase you're in | [Phase map](#phase-map) |
| Checking what gates need to pass | [Hard gates](#hard-gates) |

---

## Starting a project

```bash
# Full product / company bootstrap (most common)
node scripts/init.js <project-name> --squad startup --idea "your raw idea"

# MVP (compressed build, no full org)
node scripts/init.js <project-name> --squad mvp

# Single feature
node scripts/init.js <project-name> --squad feature

# Marketing / landing site
node scripts/init.js <project-name> --squad website
```

After running `init.js`:
1. Open `<project-name>/idea.md` and complete Section 4 (if `--idea` was not passed)
2. Paste the brief from `idea.md` Section 4 to Greg (CEO):
   > "Hey Greg — [brief from idea.md Section 4]"
3. Greg activates Coordinator → full Discovery sequence begins

---

## Resuming a project

```bash
# See where the project is right now
node scripts/doc.js status <project-dir>
```

Then read `current-status.md` in the project:
> "Read current-status.md and tell me where we are."

`current-status.md` tells you:
- Active phase
- Last agent to produce output
- Next agent that should activate
- Any open blockers or pending gate checks

---

## Phase map

```
PHASE 0  — Brief
  Coordinator receives Owner brief (via CEO or directly)

PHASE 1  — Discovery
  CEO → CLO → CISO → CFO → CMO → CRO → CDO → COO → CHRO
  UX Researcher runs in parallel with PM during this phase

PHASE 2  — Release Plan
  CTO (after CLO + CISO gate) → Mario → PM → Designer → Staff Engineer → EM

PHASE 3  — Execution
  Liaison activates at Sprint 1 start. Stays active until ship.
  Engineers execute tickets inside pods.

PHASE 4  — Completion
  All agents write to history.md and area logs.
  PM seals product-log.md. EM dissolves pods.
  CEO validates project-map.md. Coordinator seals release.
```

---

## Hard gates

These are non-negotiable. Skipping them is the most expensive mistake in the sequence.

| Gate | Blocks | Rule |
|---|---|---|
| CLO + CISO both deliver | CTO cannot start architecture | Run `node scripts/gate-check.js <project-dir>` to check |
| Mario reviews irreversible decisions | Sprint 1 cannot begin | All architecture decisions pass Mario before any implementation |
| CEO validates `project-map.md` | Release cannot be sealed | Section 11 checklist must be signed off |

---

## Roles index

### Strategic layer

| Agent | File | Activate when | First words | Output |
|---|---|---|---|---|
| **Coordinator** | `roles/coordinator.md` | Always first. Every project. | "Coordinator, route this: [task]" | `project.md`, `history.md`, release structure |
| **Greg (CEO)** | `roles/ceo.md` | New project, strategic call, gate review | "Hey Greg, [brief or question]" | Strategic framing, non-negotiables, decision authority |

### Domain specialists (Phase 1 — Discovery)

Activate in this order. Each output feeds the next.

| # | Agent | File | Activate when | Gates | Req file |
|---|---|---|---|---|---|
| 1 | **Camila (CLO)** | `roles/clo.md` | Legal, compliance, user data, contracts | Gates CTO | `legal-requirements.md` |
| 2 | **CISO** | `roles/ciso.md` | User data, keys, money, PII, security posture | Gates CTO | `security-requirements.md` |
| 3 | **CFO** | `roles/cfo.md` | Any cost or revenue component | — | `finance-requirements.md` |
| 4 | **CMO** | `roles/cmo.md` | Before API/product design | → CTO + PM | `marketing-requirements.md` |
| 5 | **CRO** | `roles/cro.md` | Any monetization component | → PM + CFO | `revenue-requirements.md` |
| 6 | **CDO** | `roles/cdo.md` | Any product that measures itself | → CTO data model | `data-requirements.md` |
| 7 | **COO** | `roles/coo.md` | External vendors or customer ops | → EM critical path | `operations-requirements.md` |
| 8 | **CHRO** | `roles/chro.md` | New hires or team changes | — | `people-requirements.md` |

### Extended domain specialists (conditional)

Activate only when the trigger applies.

| Agent | File | Trigger |
|---|---|---|
| **Rafael (Chief Risk Officer)** | `roles/cro-risk.md` | Real money, credit, or significant operational complexity |
| **Andrea (Chief Compliance Officer)** | `roles/cco-compliance.md` | Regulated industry — stays active through execution |
| **Natalia (Chief Customer Officer)** | `roles/cco-customer.md` | First enterprise customer approaching go-live |
| **Emiliano (Chief Protocol Officer)** | `roles/cpo-protocol.md` | Protocol project (tokenomics, governance) |
| **Paola (Chief Credit Officer)** | `roles/cco-credit.md` | Lending or credit decisioning product |
| **Leonardo (Chief Partnerships Officer)** | `roles/cpo-partnerships.md` | Ecosystem, distribution, or integration strategy |
| **Diana (Chief Analytics Officer)** | `roles/cao.md` | Measurable hypothesis or ML component |
| **Pablo (Chief AI Officer)** | `roles/caio.md` | Any AI component — activates alongside CTO |

### Execution layer (Phase 2 → Phase 3)

Activate in this order after CLO + CISO gate clears.

| # | Agent | File | Activate when | First words |
|---|---|---|---|---|
| 1 | **CTO (Nicolás)** | `roles/cto.md` | After CLO + CISO gate | "CTO, produce the architecture brief for [project]" |
| 2 | **Mario (Chief Engineer)** | `roles/chief-engineer.md` | After CTO architecture brief | "Hey Mario, review this architectural decision: [decision]" |
| 3 | **PM (Isabella)** | `roles/pm.md` | After CMO market context | "PM, shape the mission for [feature]" |
| 4 | **Designer (Daniela)** | `roles/designer.md` | Any mission with a user-facing surface | "Designer, produce the interface direction for [mission]" |
| 5 | **UX Researcher** | `roles/ux-researcher.md` | Discovery phase + any mission cycle | "UX Researcher, plan a research cycle for [assumption]" |
| 6 | **Staff Engineer** | `roles/staff-engineer.md` | Cross-service or platform work | "Staff Engineer, decompose [feature] into components and contracts" |
| 7 | **EM** | `roles/em.md` | 2+ engineers on the project | "EM, compose pods and map the critical path for [release]" |
| 8 | **Gabriela (Liaison)** | `roles/liaison.md` | Sprint 1 start | "Gabriela, you're live. Sprint [N] starts now." |
| 9 | **Engineer (IC)** | `roles/engineer.md` | When a pod is active. EM assigns a unique name. | "Hey [name], you're in Pod [X]. Pick up ticket [N]." |

---

## Scripts index

| Script | When to use | Key options |
|---|---|---|
| `scripts/init.js` | Create a new project end-to-end (scaffold + Claude project + prime idea.md) | `--squad <type>` `--idea "..."` `--output <dir>` |
| `scripts/bootstrap.js` | Scaffold project files only (no Claude project creation) | `--squad <type>` `--output <dir>` |
| `scripts/squad.js` | Inspect a squad's roster and activation sequence | `<squad-type>` or `list` |
| `scripts/doc.js` | Read/write/append to project files from the CLI | see below |
| `scripts/gate-check.js` | Verify CLO + CISO gate is cleared before CTO activates | `<project-dir>` |
| `scripts/update.js` | Sync a project's local SDK copy with the latest source | `<sdk-source-path>` |

### `doc.js` sub-commands

```bash
node scripts/doc.js status <project-dir>                  # Where are we? (resume helper)
node scripts/doc.js read <file> --section "## Section"    # Read a specific section
node scripts/doc.js append <file> --section "## S" --content "..."   # Append to a section
node scripts/doc.js rewrite <file> --section "## S" --content "..."  # Replace a section
node scripts/doc.js add-item <file> --section "## S" --item "..." [--status pending|done|blocked]
node scripts/doc.js decision history.md --decision "..." --context "..." --made-by [Role]
node scripts/doc.js log <area-log> --role X --level Y --goal "..." --status active|completed|blocked
node scripts/doc.js pod-update current-status.md --mission <name> --status <status> --next <action>
```

---

## Squads

| Squad | File | Size | Use when |
|---|---|---|---|
| `startup` | `squads/startup.md` | Large | Full product or company from scratch. All 16 roles. |
| `mvp` | `squads/mvp.md` | Medium | Compressed build, no full org. 8–12 roles. |
| `feature` | `squads/feature.md` | Small | Single feature delivery. 3–5 roles. |
| `website` | `squads/website.md` | Small–Medium | Marketing/landing/docs site. 5–7 roles. |

---

## Consultation mode (no project needed)

Any agent answers standalone domain questions without project files.

```
/ask CTO should we build this in-house or use a managed service?
/ask Greg what's the strategic risk of launching in two markets at once?
/ask CLO what does GDPR require for behavioral analytics?
/ask what's the right data model for multi-tenant SaaS?
```

- `/ask [role] [question]` — routes directly to that agent
- `/ask [question]` — Coordinator routes to the best agent and synthesizes
- Address any agent by name directly in conversation (no `/ask` needed)

See `roles/CONSULT.md` for the full consultation protocol.

---

## Key SDK files

| File | Purpose |
|---|---|
| `AGENTS.md` | Agent manifest: activation sequence, dependency graph, peer integration map, context loading |
| `protocol.md` | The shared contract: Bus format, escalation ladder, spawning policy |
| `STRATEGY.md` | Corporate strategy layer: 4 success themes, Betting Table rules |
| `roles/CLAUDE.md` | Agent index with activation phrases — quick reference for each role |
| `roles/CONSULT.md` | How agents behave in consultation mode |
| `roles/_template.md` | Template for adding a new agent |
| `project-template/` | All files a new project gets on bootstrap |
| `squads/` | Pre-configured team compositions |

---

## Key project files (after `init.js`)

These live inside `<project-dir>/`, not in this SDK repo.

| File | Purpose | Who writes it |
|---|---|---|
| `idea.md` | Raw idea → structured brief (4 sections) | Owner → Greg |
| `project.md` | Source of truth, decision log, project map | Coordinator |
| `history.md` | Permanent decision record | All agents |
| `current-status.md` | Session continuity — what's happening right now | All agents update |
| `general-requirements.md` | Cross-cutting constraints all agents read | Coordinator |
| `*-requirements.md` | Domain-specific requirements (legal, security, etc.) | Each domain agent |
| `product-log.md` | Mission kanban board | PM |
| `*-log.md` | Area logs per domain | Each agent |
| `liaison-log.md` | Sprint communication record | Liaison |

---

## Communication protocol (Project Mode)

```
FROM: [Role]
TO: [Role or ALL]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE: [body]
```

Owner → CEO or Owner → Coordinator only. Never direct to execution agents.

---

## Adding a new agent

1. Copy `roles/_template.md`
2. Fill all `[PLACEHOLDER]` values
3. Add to `AGENTS.md`: Role Directory + Dependency Graph + Peer Integration Map
4. Add requirements file to `project-template/`
5. Add domain row to `project-template/general-requirements.md`
6. Add context loading row to `AGENTS.md > Context Loading`
7. Send INFO Bus message to Coordinator

---

*This index is the fast-ramp entry point. For depth on any topic: `AGENTS.md` (routing and dependencies), `protocol.md` (communication rules), `roles/CONSULT.md` (standalone questions).*
