# company-sdk

> AI agent team operating system. Roles, levels, squads, protocol, and CLI — everything you need to run a software project with an AI team.

```bash
npm install -g company-sdk

sdk-bootstrap my-project --squad mvp
```

---

## What It Is

Three layers that work together:

| Layer | What it is | Files |
|---|---|---|
| **Roles** | Agent prompts. Paste one into a conversation and that agent is live. | `roles/` |
| **Protocol** | How agents talk to each other. Bus format, escalation, decision log. | `protocol.md` |
| **Squads** | Activation sequences for a specific workflow (website, feature, MVP, startup). | `squads/` |

Same roles, same protocol — different squad for different work. A website doesn't need a CLO. A startup does.

For the full walkthrough → **[HOW_IT_WORKS.md](./HOW_IT_WORKS.md)**

---

## Quick Start

### Start a project
```bash
npm install -g company-sdk

# Full init — scaffold + Claude project + Greg primer  ← recommended
sdk-init my-saas --squad mvp
sdk-init my-saas --squad startup --idea "Burn rate tracker for solo founders"

# Lower-level scaffold only
sdk-bootstrap my-saas --squad mvp
```

### Ask an agent a question (no project needed)
```
/ask CTO should we build this in-house or use a managed service?
/ask Greg what's the biggest strategic risk in entering two markets at once?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask what's the right data model for a multi-tenant SaaS?
```

Agents are independent of any project. They answer from domain expertise and may spawn peer consultations for depth. See `roles/CONSULT.md`.

### Manual
```bash
git clone git@github.com:matiasbargas/company-sdk.git
node path/to/company-sdk/scripts/init.js my-saas --squad mvp
```

---

## Pick a Squad

```
Do you have an existing product?
  ├── No → Do you need the full org structure?
  │         ├── Yes → startup   (~3–6 weeks, all 16 agents)
  │         └── No  → mvp       (~1–2 weeks, 10 agents)
  └── Yes → Is it a website?
             ├── Yes → website   (~3–7 days, 6 agents)
             └── No  → feature   (~days, 3 agents)
```

| Squad | Agents | Time | Use for |
|---|---|---|---|
| `website` | 6 | 3–7 days | Landing page, marketing site, static site |
| `feature` | 3 | Days | Adding a feature to an existing product |
| `mvp` | 10 | 1–2 weeks | New product, lean activation |
| `startup` | 16 | 3–6 weeks | Full org: strategy → legal → security → engineering |

---

## The Role Set

### Strategic Layer
| Role | File | Owns |
|---|---|---|
| **Coordinator** | `roles/coordinator.md` | Release management, org memory, Sprint 0 gate |
| **CEO** | `roles/ceo.md` | Strategic framing, final escalation, gate reviews |

### Domain Specialists
| Role | File | Owns | Activate when |
|---|---|---|---|
| **CLO** | `roles/clo.md` | Legal, compliance, contracts | Any legal, financial, or user data feature |
| **CFO** | `roles/cfo.md` | Budget, runway, unit economics | Any cost or revenue component |
| **CISO** | `roles/ciso.md` | Threat model, security, compliance | Any product handling user data, keys, or money |
| **CMO** | `roles/cmo.md` | Market, positioning, launch | Before architecture — market shapes product |
| **CRO** | `roles/cro.md` | Revenue, GTM, pricing | Any monetization component |
| **CDO** | `roles/cdo.md` | Instrumentation, metrics, data governance | Any product that needs to measure itself |
| **COO** | `roles/coo.md` | Vendors, support, operational runbook | External vendors or customer-facing ops |
| **CHRO** | `roles/chro.md` | Hiring, onboarding, team health | Any project requiring new hires or team changes |

### Execution Layer
| Role | File | Owns |
|---|---|---|
| **CTO** | `roles/cto.md` | Architecture, make/buy, team sizing, technical risk |
| **Mario (Chief Engineer)** | `roles/chief-engineer.md` | Irreversible decision review, architectural authority over all ICs |
| **PM** | `roles/pm.md` | User story, scope, friction log, vision alignment |
| **Staff Engineer** | `roles/staff-engineer.md` | Interface contracts, platform primitives, cross-cell coherence |
| **EM** | `roles/em.md` | Cell management (max 2 cells), critical path, sprint |
| **Liaison** | `roles/liaison.md` | Execution ↔ leadership communication bridge |

---

## The Level Ladder

Every role has a level. Compose teams at the right level for the work.

### IC Track
| Level | Title | What they do |
|---|---|---|
| L1 | Junior | Learns inside well-scoped tasks. Needs daily check-ins. |
| L2 | Mid | Executes reliably within defined scope. Needs weekly alignment. |
| L3 | Senior | Owns a module end-to-end. Drives scope definition. |
| L4 | Staff | Cross-team technical direction. Owns the platform layer. |
| L5 | Principal | Org-wide technical strategy. Sets irreversible decisions. |

### Management Track
| Level | Title | Scope |
|---|---|---|
| M1 | EM | 1–2 cells, day-to-day execution |
| M2 | Senior EM | 2–4 cells, cross-cell coherence |
| M3 | Director | Multiple EMs, 1 product area |
| M4 | VP | Multiple Directors, org-wide delivery |
| M5 | C-Suite | Company-wide strategy and accountability |

Full ladder → `levels/ladder.md`

---

## The Cell Model

The atomic unit of an engineering team.

```
Cell-2:   1 Senior + 1 Mid/Senior      →  owns 1 service or module
Cell-4:   1 Staff + 2 Senior + 1 Mid   →  owns a full product slice

EM ratio: 1 EM per 2 cells max.
```

```
Tier 1 (Solo):     1 person
Tier 2 (Small):    1× cell-2    →  1 EM
Tier 3 (Medium):   2× cell-2    →  1 EM
Tier 4 (Large):    4× cell-2    →  2 EMs
Tier 5 (Program):  3–6× cell-4  →  1 EM per 2 cells
```

Anti-patterns: a cell of 3 is not a cell. A cell of 5+ is two cells with blurred ownership. An EM managing 3+ cells is a bottleneck.

---

## Communication Flow

The Owner speaks only to CEO or Coordinator. Never directly to execution agents.

```
OWNER
  ├──> CEO ──────────────────────────────────────────> COORDINATOR
  │      |                                                   |
  │      └──> CLO | CFO | CISO | CMO | CRO | CDO | COO | CHRO
  │                                                          |
  │      └──> CTO ──> Mario (Chief Engineer)                |
  │                        |                                 |
  │      └──> PM     Staff Engineer                         |
  │                        |                                 |
  │                  Cell-A ←──> EM ←──> Liaison ──────────┘
  │                  Cell-B ←──> EM
  │
  └──> COORDINATOR (process, status, gate reviews)
```

Liaison is the only agent that crosses between execution and leadership simultaneously. Mario is the only agent with horizontal authority across all engineering teams — craft, not management.

---

## CLI Reference

```bash
# Init a new project — scaffold, Claude project, and primer for Greg  ← recommended
sdk-init <name> [--squad <type>] [--output <dir>] [--idea "..."]

# Bootstrap a new project directory with all template files (lower-level)
sdk-bootstrap <name> [--squad <type>] [--output <dir>]

# View squad activation sequence
sdk-squad list
sdk-squad <website|feature|mvp|startup>

# Document operations
sdk-doc list <file>                                     # list sections
sdk-doc read <file> --section <heading>                 # read a section
sdk-doc append <file> --section <heading> --content     # append to section
sdk-doc rewrite <file> --section <heading> --content    # replace a section
sdk-doc add-item <file> --section <heading> --item      # append a list item
sdk-doc decision <file> --decision --context --made-by  # log a decision

# Update a project's team-sdk copy with the latest SDK (run from the project folder)
sdk-update <sdk-source-path>                            # sync roles, scripts, protocol, templates
sdk-update <sdk-source-path> --dry-run                 # preview changes without writing
```

Examples:
```bash
# Full init — scaffold + Claude project + Greg primer
sdk-init my-saas --squad mvp
sdk-init fintech --squad startup --idea "Burn rate tracker for solo founders"

# Lower-level bootstrap only
sdk-bootstrap analytics-tool --squad mvp

# Log an architecture decision
sdk-doc decision projects/analytics-tool/history.md \
  --decision "Use Supabase instead of raw Postgres" \
  --context "Saves 2 weeks of auth setup" \
  --made-by CTO \
  --reversible yes

# Update a requirements section
sdk-doc append projects/analytics-tool/product-requirements.md \
  --section "## Out of Scope" \
  --item "Admin dashboard — post-MVP"
```

---

## File Map

```
company-sdk/
  README.md
  HOW_IT_WORKS.md         ← Full narrative walkthrough
  AGENTS.md               ← Activation order + dependency graph
  SQUADS.md               ← Squad comparison and decision guide
  protocol.md             ← Bus format, escalation, decision log rules
  package.json

  roles/
    _template.md          ← Blank 4-block prompt template
    coordinator.md | ceo.md
    clo.md | cfo.md | ciso.md | cmo.md | cro.md | cdo.md | coo.md | chro.md
    cto.md | chief-engineer.md | pm.md | staff-engineer.md | em.md | liaison.md

  levels/
    ladder.md             ← IC and Management track definitions

  squads/
    website.md | feature.md | mvp.md | startup.md

  project-template/
    project.md            ← Owner brief and conversation record
    history.md            ← Decision log
    liaison-log.md        ← Daily sprint health
    general-requirements.md
    [domain]-requirements.md  ← 12 domain stubs

  scripts/
    init.js               ← sdk-init  (scaffold + Claude project + Greg primer)
    bootstrap.js          ← sdk-bootstrap  (scaffold only)
    squad.js              ← sdk-squad
    doc.js                ← sdk-doc

  example-bitcoin-wallet/
    project.md            ← Complete example conversation
    marketing-review.md   ← CMO market analysis
```

---

## The Project

### What it is

Most AI agent frameworks give you tools. team-sdk gives you a company.

The problem with every other framework is not capability — they can all call APIs, loop on tasks, and pass context between agents. The problem is that they hand you a blank canvas. You still have to figure out who decides what, how decisions get logged, when legal review is required, how to escalate a security incident, what "done" means. Every team using those frameworks rebuilds the same organizational infrastructure from scratch, badly, under pressure. Then they ship something and six months later no one can explain why any of the decisions were made.

team-sdk starts from a different premise: the missing ingredient in AI-assisted product development is not more capability — it is legitimate organizational structure. The SDK ships with 20+ role-based agents, each with a defined operating loop, a clear scope of authority, and a skill ladder. They share a versioned protocol with a standard communication format, a decision logging standard, an escalation ladder, and a machine-enforced compliance gate. On day one of any new project, legal and security reviews happen before architecture does — because that is when they should happen, not as a retrofit after you've committed to a stack and a launch date.

It is designed for founders, senior engineers, and product leads who are serious about building something that lasts. Not prototypes — products. Not demos — companies.

---

### Pitch Deck

| Slide | Core message | Key points |
|---|---|---|
| **1 — The Problem** | Every team rebuilds the same broken org chart from scratch | AI frameworks give capability without structure · Teams spend most of their time on coordination overhead · Output is capable but unaccountable |
| **2 — The Insight** | The missing ingredient is organizational legitimacy, not intelligence | Every company that ships consistently has the same infrastructure: roles, authority, compliance gates · AI capability is commoditizing · Structure is the differentiator |
| **3 — What it is** | A complete company OS you stand up in minutes | 20+ role-based agents with operating loops and skill ladders · Shared protocol: Bus format, decision logging, escalation, gate enforcement · Project template with every artifact a new team needs on day one |
| **4 — How it works** | Structure drives execution — gates are enforced before work begins | Discovery → Execution → Close with defined activation sequences · CLO + CISO gate is machine-enforced before CTO activates · `/ask CLO`, `/ask CTO` — query any specialist without opening a full project |
| **5 — Compliance first** | The first AI agent framework where legal and security are first-class architecture | `gate-check.js` enforces CLO+CISO gate programmatically · Decision log requires human approval for decisions affecting natural persons · EU AI Act notice and jurisdiction declaration built into the discovery gate · `DISCLAIMER.md` embedded in every project |
| **6 — Two modes** | Full team for building, specialists on demand for deciding | **Project Mode**: full Discovery → Execution → Close cycle · **Consultation Mode**: `/ask [role] [question]` — agents spawn peers to stress-test their own reasoning, not just split tasks |
| **7 — Squad compositions** | Four pre-configured patterns for the four most common build scenarios | Website (3–10 days) · Feature (days) · MVP (1–3 weeks) · Startup (3–6 weeks, full org) · One command: `sdk-init <name> --squad startup` |
| **8 — Memory architecture** | The project map is the durable output — the full record of why | Every decision logged with context and human approver · Area logs by domain (strategy, design, engineering, ops, product, people) · Session continuity: any agent resumes from `current-status.md` · CEO validates project map before release is sealed |
| **9 — Who it's for** | Founders and senior engineers building products, not prototypes | Teams of 1–10 who need to move fast without rebuilding org infrastructure · Technical founders who understand the cost of unstructured AI output · Regulated industries (fintech, healthtech, legaltech) where compliance is a feature, not overhead |
| **10 — Where it's going** | The SDK is the foundation. The network is the product. | Squad marketplace: community-contributed agent definitions for specialized verticals · Cross-team protocol: federated decisions and shared audit trails across organizations · The bet: as AI capability commoditizes, teams with structured, auditable, human-in-the-loop operating systems are the ones regulators trust, enterprises buy from, and customers stay with |

---

## Golden Rules

1. Owner speaks only to CEO or Coordinator. Never directly to execution agents.
2. Every consequential decision gets written to `history.md`. If it's not written, it didn't happen.
3. "Almost done" is not a status.
4. Blockers escalate the same day.
5. Sprint 0 gate is real. Nothing gets coded until all boxes are checked.
6. 1 Senior + 1 Mid/Senior per cell. EM manages 2 cells max.
7. The requirements files are the source of truth, not conversations.
8. Different squad, same protocol. Don't rewrite the rules — pick the right squad.
9. Level determines behavior. Compose teams at the right level for the work.
10. The Liaison crosses layers. Everyone else stays in their lane.

---

*`company-sdk` — 16 roles · 4 squads · 2-track level ladder · 3 CLI tools*
