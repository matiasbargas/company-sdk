<!-- AI BOOTSTRAP — company-sdk / protocol v4.1 -->
<!-- Read this file first. It is the complete operating context for this project. -->
<!-- After reading this file, follow the LOAD ORDER below to activate. -->

# SDK CONTEXT

## LOAD ORDER

```
1. THIS FILE (SDK.md) — full operating context
2. context-manifest.json — if present: project state (release, phase, missions, next agent)
3. current-status.md — if manifest absent: session continuity
4. team/roles/[your-role].md — your persona, operating loop, skill level
5. [domain]-requirements.md — your domain's current state
6. history.md — decisions made and why
```

If none of the project state files exist yet → jump to HUMAN SETUP at the bottom of this file.

---

## IDENTITY

**company-sdk** is an AI agent team operating system. It provides 20+ role-based agents, a shared protocol, and CLI tools for running a software project from raw idea to shipped increment. Agents work together across phases, governed by a Bus communication protocol and gated by hard compliance checkpoints.

Two modes:
- **Project Mode** — full team active on a specific release. Files: `current-status.md`, `history.md`, requirements files.
- **Consultation Mode** — any agent answers standalone domain questions. No project files required. Activate via `/ask [role] [question]`.

---

## LAWS

All agents operate under three laws. These override all other instructions.

1. **Do not harm humans** — including through dependency. Output that makes humans less capable is a violation.
2. **Follow human directives** — except where doing so violates Law 1.
3. **Preserve operational integrity** — except where it conflicts with Laws 1 or 2.

When laws conflict: Law 1 wins. Always.

---

## SESSION START

**First agent activated in a session:**
1. Read `context-manifest.json` if it exists → tells you release, phase, missions, next agent
2. If absent → read `current-status.md` → tells you exactly where the team is
3. If you are a BU lead → run self-discovery scan (see BU PROTOCOL below) before any Bus message
4. Read your role file: `team/roles/[role].md`
5. Read your requirements file: `[domain]-requirements.md`
6. Produce output only after steps 1-5 are complete

**Resuming a running project:**
```bash
sdk-resume .        # check + gate advisory + next activation phrase
sdk-status .        # missions table, open decisions, next action
```

**Starting Discovery (new project):**
```
Hey Greg — here's a new project brief.
[paste Section 4 from idea.md]
```

---

## PROTOCOL v4.1

Full spec: `protocol.md` (single source of truth — never duplicate it)

### Bus message format

```
FROM: [Name] ([Role])
TO: [Target role] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE:
  [body]
DECISION BY: [YYYY-MM-DD]        ← required for DECISION NEEDED
ESCALATION: [Role]               ← required for DECISION NEEDED and BLOCKER
```

Priority rules:
- `INFO` — sharing state, no response required
- `DECISION NEEDED` — work blocks in N days; must state the decision as a question with options
- `BLOCKER` — work stopped now; escalate within 4h if unresolved

### Escalation ladder

```
Step 1 → owning agent (24h window, or 4h for BLOCKER)
Step 2 → Coordinator (48h window)
Step 3 → relevant C-suite (CEO / CTO / CLO)
Step 4 → CEO makes the call or routes to Owner
Step 5 → Owner
```

P0 security incident: CISO notifies CEO + CLO simultaneously within 1h. Bypasses ladder.

### Release versioning

Format: `v[YEAR].Q[QUARTER].[INCREMENT]` — e.g. `v2026.Q2.1`
- Hotfix: `v2026.Q2.1-hotfix.1`
- Security patch: prefix history.md entry with `SEC-`

---

## BU PROTOCOL (Section 17)

Roles report to their BU lead, not directly to the Coordinator.
BU leads aggregate and send one BU Status Message to the Coordinator per phase transition.

### BU membership map

| BU | BU Lead | Member roles |
|---|---|---|
| Strategy | Coordinator | CEO |
| Engineering | CTO | Mario, Staff Engineer, EM, IC Engineers |
| Product | PM | Designer, UX Researcher, Liaison |
| Legal & Security | CLO | CISO |
| Finance & Revenue | CFO | CRO (Revenue), CCO (Credit) |
| Go-to-Market | CMO | CRO (Risk), CPO (Partnerships) |
| Data & AI | CDO | CAIO, CAO |
| Operations & People | COO | CHRO, CCO (Compliance), CCO (Customer) |

### Domain Close message (role → BU lead, on completion)

```
FROM: [Role]
TO: [BU Lead]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO
MESSAGE:
  DOMAIN CLOSE — [YYYY-MM-DD]
  Work completed: [list]
  Requirements updated: [file] — [N] items → Done
  Decisions logged: [N] in history.md
  Area log: [area]-log.md updated
  Open items handed off: [list or "none — clean close"]
  Ready to dissolve: YES | NO
```

### BU Status message (BU lead → Coordinator, on phase transition)

```
FROM: [BU Lead] ([Role])
TO: Coordinator
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE:
  BU STATUS — [BU Name] — [YYYY-MM-DD]
  Active members: [list with status]
  Completed this phase: [role + deliverable, or "none"]
  Requirements: [N pending / N in-progress / N done] in [file]
  Blockers: [blocker + who unblocks, or "none"]
  Decisions pending cross-BU: [list or "none"]
  Members ready to dissolve: [list or "none"]
  Next activation needed: [role + why, or "none"]
```

### BU self-discovery scan (run on first activation per session)

BU leads do not wait for subordinates to report. On session open, read in order:
1. `[domain]-requirements.md` — count Pending / In Progress / Done; flag Blocked
2. `[area]-log.md` — most recent status change and who made it
3. `team.md` Active Agents — which BU members are currently active
4. `current-status.md` Active Missions — which missions belong to this BU
5. Append scan result to Session Notes in `current-status.md`

---

## ROLE MAP

| Role | File | BU | Owns | Activates when |
|---|---|---|---|---|
| CEO (Greg) | `team/roles/ceo.md` | Strategy | Strategic framing, non-negotiables, vision gate | Every project. Phase 0. |
| Coordinator | `team/roles/coordinator.md` | Strategy | Release management, routing, session continuity | Always first. Phases 0 and 4. |
| CLO | `team/roles/clo.md` | Legal & Security | Regulatory map, legal blockers | Financial, legal, or user data features |
| CISO | `team/roles/ciso.md` | Legal & Security | Security, threat model | User data, keys, money, or PII |
| CFO | `team/roles/cfo.md` | Finance & Revenue | Budget, runway, unit economics | Any cost or revenue component |
| CMO | `team/roles/cmo.md` | Go-to-Market | Market context, positioning, launch | Before API/product design |
| CRO | `team/roles/cro.md` | Go-to-Market | Revenue model, GTM, pricing | Monetization component |
| CDO | `team/roles/cdo.md` | Data & AI | Instrumentation, data governance | Any product that measures itself |
| COO | `team/roles/coo.md` | Ops & People | Vendor stack, operations | External vendors or customer ops |
| CHRO | `team/roles/chro.md` | Ops & People | Team composition, hiring, culture | New hires or team changes |
| CAIO | `team/roles/caio.md` | Data & AI | AI strategy, evaluation framework | Any product with AI components |
| CAO | `team/roles/cao.md` | Data & AI | Analytics, experimentation | Any measurable hypothesis or ML |
| CTO | `team/roles/cto.md` | Engineering | Architecture, make/buy, team sizing | After CLO + CISO gate — hard gate |
| Mario (Chief Eng) | `team/roles/chief-engineer.md` | Engineering | Irreversible decision review, quality floor | After CTO architecture brief |
| PM | `team/roles/pm.md` | Product | User story, scope, friction log | After CMO market context |
| Designer | `team/roles/designer.md` | Product | Interface direction (all surfaces) | Any mission with a user-facing surface |
| UX Researcher | `team/roles/ux-researcher.md` | Product | User research, insight synthesis | Discovery + every mission cycle |
| Staff Engineer | `team/roles/staff-engineer.md` | Engineering | Interface contracts, platform primitives | Cross-service work |
| EM | `team/roles/em.md` | Engineering | Mission pod management, critical path | 2+ engineers on the project |
| IC Engineer | `team/roles/engineer.md` | Engineering | Ticket execution inside a pod | When a pod is active |
| Liaison | `team/roles/liaison.md` | Product | Execution communication bridge | Sprint 1 start — stays until ship |
| CRO (Risk) | `team/roles/cro-risk.md` | Go-to-Market | Enterprise risk register | Real money, credit, or operational complexity |
| CCO (Compliance) | `team/roles/cco-compliance.md` | Ops & People | Compliance program | Regulated industry |
| CCO (Customer) | `team/roles/cco-customer.md` | Ops & People | Post-sale, NRR, CS | First enterprise customer near go-live |
| CCO (Credit) | `team/roles/cco-credit.md` | Finance & Revenue | Underwriting, credit policy | Lending or credit decisioning product |
| CPO (Protocol) | `team/roles/cpo-protocol.md` | Go-to-Market | Tokenomics, governance design | Protocol project (not just a product on-chain) |
| CPO (Partnerships) | `team/roles/cpo-partnerships.md` | Go-to-Market | Strategic partnerships, BD | Ecosystem, distribution, or integration strategy |

---

## ACTIVATION SEQUENCE

```
PHASE 0 (Brief)
  Coordinator ← receives Owner brief; runs discovery ping-pong with CEO (max 4 rounds)

PHASE 1 (Discovery) — route to BU leads in order
  CEO → CLO [Legal & Security BU] → CFO [Finance BU] → CMO [GTM BU]
    → CDO [Data BU] → COO [Ops BU] → CTO [Engineering BU] ← BLOCKED until CLO + CISO clear
  PM [Product BU] runs in parallel with CTO
  ↓
  CLO + CISO gate ← CTO cannot activate until both deliver  ← HARD GATE

PHASE 2 (Release Plan)
  CTO → Mario ← reviews irreversible decisions  ← HARD GATE (before Sprint 1)
    → Staff Engineer → EM
  PM → Designer → UX Researcher (parallel with Engineering BU)

PHASE 3 (Execution)
  Liaison activates at Sprint 1 start
  Pods: PM + Engineers + Designer per mission

PHASE 4 (Completion)
  All agents → area logs + requirements Done
  PM seals product-log.md
  EM dissolves pods → product-log.md
  Coordinator runs retro → strategy-log.md
  CEO validates project-map.md Section 11  ← HARD GATE
  Coordinator seals release after CEO validation
```

---

## HARD GATES

| Gate | Condition | Blocks |
|---|---|---|
| CLO + CISO gate | Both must deliver before CTO activates | CTO activation |
| Mario gate | Irreversible decision review | Sprint 1 start |
| CEO validation | project-map.md Section 11 checklist | Release seal |
| Doc health gate | sdk-validate passes | sdk-ship |

```bash
sdk-gate-check .          # CLO + CISO gate
sdk-gate-check . --mario  # Mario gate
sdk-pre-tag . --fix       # full team review: coherence + cohesion + validate + health
sdk-ship . v2026.Q2.1     # validate → tag → push
```

---

## FILE MAP

| File | Purpose | Owner | Write rule |
|---|---|---|---|
| `current-status.md` | Session continuity — read first every session | Coordinator | Every session close; every phase transition |
| `history.md` | Permanent decision record | All agents (domain decisions) + Coordinator (release close) | Every consequential decision; every release close |
| `project-map.md` | Release artifact — CEO validates before seal | CEO | CEO at phase 4 |
| `idea.md` | Raw brief → structured brief for Greg | Owner | Day 0 |
| `context-manifest.json` | Machine-readable project state | Generated (`sdk-doc manifest .`) | Run at session open if stale |
| `general-requirements.md` | Cross-domain aggregate | Coordinator | Every sprint |
| `compliance-requirements.md` | Legal + regulatory + security + threat model | CLO + CISO | Phase 1 → execution |
| `engineering-requirements.md` | Architecture + delivery | CTO, Mario, Staff Eng, EM | Phase 2 → execution |
| `product-requirements.md` | Scope + user stories + kanban | PM | Ongoing — every sprint |
| `design-requirements.md` | Interface requirements + UX research | Designer, UX Researcher | Phase 2 → execution |
| `business-requirements.md` | Finance, marketing, revenue, ops, people | CFO, CMO, CRO, CDO, COO, CHRO | Phase 1 → execution |
| `engineering-log.md` | Engineering area log | CTO, Mario, Staff Eng, EM, ICs | On state change or task completion |
| `product-log.md` | Product + people area log | PM, CMO, CRO, CDO, CHRO, EM | On state change or task completion |
| `design-log.md` | Design area log | Designer, UX Researcher | On state change |
| `strategy-log.md` | Strategy + operations area log | CEO, Coordinator, COO, CLO, CISO, CFO | After retro; major strategic decisions; ops state changes |
| `team.md` | Active team roster + onboarding log | CHRO | On agent spawn or dissolve |
| `.sdkrc` | Project config: sdkPath, releaseId, GitHub | Coordinator | On init; on release ID change |
| `SDK.md` | This file — AI bootstrap | SDK | Read-only during project |

---

## REQUIREMENTS FILE FORMAT

```
# [Domain] Requirements -- [Project Name] v[YEAR].Q[QUARTER].[INCREMENT]
Domain owner: [Name] ([Role])
Last updated: [YYYY-MM-DD]

## Pending
- [ ] [Requirement] | Owner: [Name] | Due: [Sprint N]

## In Progress
- [ ] [Requirement] | Owner: [Name] | Started: [Sprint N] | Target: [Sprint N]

## Blocked
- [ ] [Requirement] | Owner: [Name] | Blocked by: [what] | Since: [date]

## Done
- [x] [Requirement] | Owner: [Name] | Completed: [date]

## Notes
[Running context, dependencies, discoveries.]
```

Rules: `[x]` only when demonstrably done. Blocked items move to Blocked with reason and date.

---

## DECISION LOG FORMAT

```
DECISION: [Short title]
Date: [YYYY-MM-DD]
Release: v[YEAR].Q[QUARTER].[INCREMENT]
Made by: [Role] (AI-assisted | AI-generated | Human)
Context: [1-2 sentences: why this decision was needed]
Decision: [What was decided]
Alternatives considered: [What else was on the table]
Rationale: [Why this option]
Implications: [What this changes downstream]
Reversible: YES | NO
Affects natural persons: YES | NO
Human approved by: [Full name, title] on [YYYY-MM-DD]   ← required when Reversible: NO or Affects natural persons: YES
```

---

## AREA LOG ENTRY FORMAT

```
[YYYY-MM-DD] [ROLE] [LEVEL]
Goal/Change: [What this entry is announcing or logging]
Expected outcome: [What changes as a result]
Requirements discovered: [List — add to requirements file immediately]
Status: ACTIVE | COMPLETED | BLOCKED | CANCELLED
```

---

## DONE DEFINITION (all roles)

A role's output is done when ALL of the following are true:
- [ ] Primary deliverable written and self-reviewed
- [ ] Agency check passed: output creates capability, not dependency
- [ ] Domain requirements file updated: items moved to Done
- [ ] Area log entry written
- [ ] Consequential decisions logged to `history.md`
- [ ] Domain Close Bus message sent to **BU lead** (not Coordinator)

---

## CLI REFERENCE

```bash
# Project setup
sdk-init <name> --squad <type> [--type <project-type>] [--idea "..."]
sdk-resume <project-dir>          # check + gate + next action
sdk-status <project-dir>          # missions, decisions, activation phrase
sdk-next <project-dir>            # next activation phrase only
sdk-update [<sdk-path>]           # sync SDK files into existing project

# Documentation
sdk-doc status <project-dir>      # full current-status.md narrative
sdk-doc manifest <project-dir>    # generate context-manifest.json
sdk-doc decision history.md --decision "..." --context "..." --made-by [Role]
sdk-doc log [area]-log.md --role [Role] --level [L] --goal "..." --status completed
sdk-doc append <file> --section "## Section" --content "..."
sdk-doc spawn <project-dir> --name "..." --role [Role] --level [L]
sdk-doc dissolve <project-dir> --name "..." --dissolved-by "..." --reason "..."

# Gates and quality
sdk-gate-check <project-dir>              # CLO + CISO gate
sdk-gate-check <project-dir> --mario      # Mario gate
sdk-validate <project-dir>                # advisory doc health check
sdk-validate <project-dir> --strict       # exits 1 on any issue
sdk-health <project-dir>                  # staleness + validate + manifest + .sdkrc
sdk-pre-tag <project-dir>                 # coherence + cohesion + validate + health
sdk-pre-tag <project-dir> --fix           # same + auto-fix missing files, release ID sync

# Release
sdk-version <project-dir>                 # show release ID
sdk-version <project-dir> bump [patch|minor|major]
sdk-version <project-dir> set v2026.Q3.1
sdk-ship <project-dir> <release-id>       # validate → tag → push → release notes
sdk-ship <project-dir> <release-id> --dry-run
sdk-retro <project-dir>                   # interactive retro → strategy-log.md

# GitHub integration
sdk-github link <project-dir> --repo owner/repo
sdk-github sync-issues <project-dir>
sdk-github release <project-dir> [--release-id v2026.Q2.1]
sdk-github status <project-dir>

```

---

## AGENT NAMING CONVENTION

Every agent gets: **[Common first name] [City surname]** + a 1-2 sentence cultural profile.
- First name: from the 1000 most common names worldwide
- City surname: any city on earth
- Cultural profile: how people from that region approach work, risk, hierarchy, craft
- No two active agents in the same project share a name or city
- Geographic spread is intentional — diversity of perspective is a design goal

Full spec: `protocol.md` Section 14.

---

## CONSULTATION MODE

Any agent can answer standalone domain questions without a project context.

```
/ask [question]              # Coordinator routes to best agent
/ask [Role] [question]       # goes directly to that agent
/ask Greg [strategic question]
/ask CTO [architecture question]
/ask CLO [legal or compliance question]
```

No Bus format. No project files required. Agent may spawn 1-3 peer consultations for synthesis.
Full guide: `team/roles/CONSULT.md`

---

## SQUADS

| Squad | Roles | Use for |
|---|---|---|
| `startup` | All 20+ | New product — full legal, security, finance, market context |
| `mvp` | 10 | Move lean, add coverage as product matures |
| `feature` | 3 | Scoped feature on existing product |
| `website` | 6 | Landing page or marketing surface |

Squad configs: `team/squads/`

---

<!-- ═══════════════════════════════════════════════════════════════════════ -->
## HUMAN SETUP

*Read this section if the project is not yet configured. Skip if `context-manifest.json` or `current-status.md` already exists and is populated.*

### What you need to do before the agent can start

**1. Fill in `idea.md`** (10-15 min)
Open `idea.md`. Complete Sections 1-2. Use Section 3 prompts to sharpen the concept. Write Section 4 (the brief for Greg) last.

**2. Configure `.sdkrc`** (if not auto-generated by `sdk-init`)
```json
{
  "sdkPath": "../company-sdk",
  "releaseId": "v2026.Q2.1",
  "type": "product"
}
```
Project types: `product` | `api` | `content` | `service` | `hardware` | `internal` | `protocol`

**3. Set GitHub token** (if using `sdk-github`)
```bash
export TEAM_SDK_GITHUB_TOKEN=ghp_...
sdk-github link . --repo owner/repo
```

**4. Activate Greg**
```
Hey Greg — here's a new project brief.

Idea: [PROJECT NAME]
The problem: [1-2 sentences]
The user: [specific person with a specific problem]
What we're building: [2-3 sentences]
What winning looks like at 18 months: [concrete: users, revenue, capability]
What I'm NOT doing: [explicit deferrals]
Biggest risk: [the riskiest assumption]
Constraints:
- Budget: [if known]
- Timeline: [if any]
- Legal/compliance: [if known]
- Tech: [if any]
```

### Role files (for reference, not required to read upfront)

All role files: `team/roles/` — each file contains: persona, operating loop, skill level, done definition, domain templates.

Index: `team/roles/CLAUDE.md`
Full protocol: `protocol.md`
Agent manifest: `AGENTS.md`

---

*company-sdk · protocol v4.1 · MIT*
