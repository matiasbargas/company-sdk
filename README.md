# company-sdk

> Most AI agent frameworks give you capability. This one gives you a company.

```bash
npm install -g company-sdk
sdk-init my-product --squad startup --idea "Burn rate tracker for solo founders"
```

---

## The problem

Every team building with AI agents hits the same wall. The agents are capable. The coordination is a mess.

Who decides what? Who reviews the security posture before you commit to a stack? When does legal weigh in — before or after the API design? What happens when two agents disagree? How do you know a decision was made by a human, not inferred from context? Six months after shipping, can anyone explain why any of the decisions were made?

Other frameworks hand you a blank canvas. You still have to rebuild the organizational infrastructure — roles, authority, compliance gates, decision logging, escalation ladders — from scratch, under pressure, badly. Then you live with the consequences.

---

## What it is

company-sdk is a structured AI team OS. 20+ role-based agents that work together from idea to shipped product — each with a defined scope of authority, an operating loop, a skill ladder, and a protocol they all share.

On day one of any project, legal and security reviews happen before architecture does. Not as a retrofit. Not as a checklist you fill in after the fact. As a machine-enforced gate that the CTO cannot bypass until CLO and CISO have delivered. That is when those reviews should happen. This is the only framework where they do.

Two modes:

**Project Mode** — activate a full team for a specific build. Discovery → Execution → Ship. Every decision logged. Every gate checked. Every agent knows their lane.

**Consultation Mode** — ask any specialist a standalone question, no project context needed. The agent may spawn 1–3 peer consultations to stress-test its own answer before responding. You get a synthesis, not a raw output.

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the biggest strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

---

## Quick start

```bash
npm install -g company-sdk

# Start a new project — scaffolds everything, primes the team, opens with Greg
sdk-init my-saas --squad startup --idea "your raw idea here"

# Or skip the idea for now
sdk-init my-saas --squad mvp
```

Then open `my-saas/idea.md`, complete Section 4, and say:
> "Hey Greg — [paste the brief from idea.md Section 4]"

Greg activates the team. The protocol handles the rest.

---

## Squads

Squads are starting templates — pre-configured team compositions for common scenarios. They are not rigid prescriptions. Every squad uses the same roles and the same protocol. The difference is which agents activate and in what order.

```
Starting a new product?
  ├── Need full org coverage (legal, security, finance, market)? → startup
  └── Want to move lean and add coverage as you go?            → mvp

Adding to an existing product?
  ├── It's a website or marketing surface?  → website
  └── It's a product feature?               → feature
```

| Squad | Agents | Best for |
|---|---|---|
| `startup` | 20+ | New product where legal, security, finance, and market context all matter before you write a line of code |
| `mvp` | 10 | New product, lean team, add coverage later |
| `feature` | 3 | Adding a scoped feature to a product that already has architecture and context |
| `website` | 6 | Landing page, marketing site, or any static surface |

You can always activate more agents mid-project. Squads define where you start, not where you can go.

---

## How a project works

```
Phase 0  — Coordinator receives the brief
Phase 1  — CEO frames strategy · CLO maps legal · CISO sets security
           CFO validates budget · CMO provides market context
           UX Researcher plans user research · PM shapes mission scope
Phase 2  — CTO architects (only after CLO + CISO gate clears)
           Mario reviews irreversible decisions
           Designer sets interface direction · Staff Engineer defines contracts
           EM composes pods and maps critical path
Phase 3  — Liaison activates at Sprint 1 start · Engineers execute
Phase 4  — All agents write area logs · PM seals kanban
           CEO validates project map · Coordinator seals the release
```

The CLO + CISO gate is machine-enforced. `sdk-gate-check` will fail until both have delivered and jurisdictions are declared. Architecture that begins before this gate is unreviewed architecture.

---

## The agents

20+ roles across four layers. Each has a persona, an operating loop, a domain scope, a skill ladder, and a consultation mode.

**Strategic** — CEO (Greg), Coordinator

**Domain specialists** — CLO · CISO · CFO · CMO · CRO · CDO · COO · CHRO

**Extended specialists** — Chief Risk Officer · Chief Compliance Officer · Chief AI Officer · Chief Analytics Officer · Chief Customer Officer · Chief Credit Officer · Chief Protocol Officer · Chief Partnerships Officer

**Execution** — CTO · Chief Engineer (Mario) · PM · Designer · UX Researcher · Staff Engineer · EM · Engineer (IC) · Liaison (Gabriela)

Full index with activation triggers and first words → `roles/CLAUDE.md`

---

## What gets logged

Every consequential decision is written to `history.md` with:
- What was decided and why
- Who made it (AI-assisted / AI-generated / Human)
- Human approver name and date — required for any decision affecting natural persons
- Whether it's reversible

Area logs capture the running record by domain: engineering, product, design, operations, people, strategy. `current-status.md` is the session continuity file — every agent reads it first on resume.

Six months after shipping, you can explain every decision. That is not an accident.

---

## CLI

```bash
# Start a project
sdk-init <name> [--squad <type>] [--idea "..."]   # scaffold + Claude project + Greg primer
sdk-bootstrap <name> [--squad <type>]              # scaffold only

# Gate check (run before activating CTO)
sdk-gate-check <project-dir>

# Document operations
sdk-doc status <project-dir>                       # where are we right now
sdk-doc read <file> --section <heading>
sdk-doc append <file> --section <heading> --content "..."
sdk-doc decision <file> --decision "..." --context "..." --made-by [Role]

# Squad reference
sdk-squad <startup|mvp|feature|website>

# Keep your local team-sdk copy current
sdk-update <sdk-source-path>
sdk-update <sdk-source-path> --dry-run
```

---

## File map

```
company-sdk/
  README.md
  HOW_IT_WORKS.md       ← Full narrative walkthrough — start here if you want the full picture
  AGENTS.md             ← Activation sequence, dependency graph, peer integration map
  STRATEGY.md           ← Corporate strategy layer: 4 success themes, Betting Table rules
  protocol.md           ← Bus format, escalation, decision log standard (v3.3)
  DISCLAIMER.md         ← AI agent liability, EU AI Act notice, human-in-the-loop requirement
  CLAUDE.md             ← SDK-level instructions for Claude Code

  .claude/commands/     ← /ask, /askGreg, /askCTO skills (Claude Code slash commands)

  roles/
    CLAUDE.md           ← Agent index: all roles, activation triggers, first words
    CONSULT.md          ← Consultation mode reference: spawning policy, synthesis standard
    _template.md        ← 4-block prompt template for new agents
    [role].md           ← 20+ agent definitions

  levels/
    ladder.md           ← IC and Management track definitions

  squads/
    startup.md | mvp.md | feature.md | website.md

  project-template/     ← Every file a new project gets on bootstrap
    idea.md             ← Raw idea brief — Owner fills this, Greg reads it
    current-status.md   ← Session continuity — every agent reads this first
    project-map.md      ← CEO-validated release artifact, sealed at close
    history.md          ← Decision log
    general-requirements.md
    discovery-requirements.md   ← CLO + CISO gate + jurisdiction declaration
    product-requirements.md
    engineering-requirements.md
    design-requirements.md
    business-requirements.md
    security-requirements.md    ← CISO non-negotiables, present in every project
    [area]-log.md × 6          ← engineering, product, design, operations, people, strategy
    CLAUDE.md | DISCLAIMER.md

  scripts/
    init.js             ← sdk-init
    bootstrap.js        ← sdk-bootstrap
    gate-check.js       ← sdk-gate-check
    doc.js              ← sdk-doc
    squad.js            ← sdk-squad
    update.js           ← sdk-update
```

---

## Who it's for

Founders, technical leads, and senior engineers who are building products, not prototypes. Teams of 1–10 who need to move fast without rebuilding organizational infrastructure from scratch every time.

It is especially useful in regulated industries — fintech, healthtech, legaltech — where compliance is a feature, not an afterthought. The framework treats legal and security as first-class architecture, not a retrofit.

If you want to understand every decision your AI team made and why, six months after it made them: this is the framework for that.

---

*company-sdk — 20+ roles · 4 squads · protocol v3.3 · 6 CLI tools*
