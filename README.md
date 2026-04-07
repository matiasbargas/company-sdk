# company-sdk

> You've always needed a team. Now you have one.

```bash
npm install -g company-sdk
sdk-init my-product --squad startup --idea "Burn rate tracker for solo founders"
```

---

## The scene

It is Monday morning. The founder opens her laptop.

She has three engineers. One joined six weeks ago and is still forming their own mental model of what the product is actually for. Somewhere in a Slack thread from last quarter is the decision that the team is about to make again — differently, worse, with no memory of why the first version failed.

She types "where are we?" to her lead engineer. He summarizes. She nods. He goes back to his desk.

This is the default state. It does not have to be.

---

## A different Monday

Same founder. Same team. Different system.

She opens her laptop and runs `sdk-status`. In twelve seconds she knows: Sprint 4 is in progress. Two missions are active. One is blocked on a security decision — the token scope question flagged last Tuesday. The CTO deployed the auth module Thursday and the ticket closed automatically. The PM is waiting on her approval to change the scope.

She approves it. She did not interrupt anyone's morning. The framework told her where things stood and what it needed from her.

When the new engineer joined last week, she read `current-status.md` and `history.md`. She was oriented in forty minutes. She asked her senior counterpart one question. Not thirty.

When the CLO asked whether the auth model had been reviewed against GDPR, the answer was in `history.md` — dated, attributed, the reasoning intact. The framework answered the audit question before the audit happened.

That is what this is trying to build.

---

## What it is

company-sdk is an AI team operating system. 20+ role-based agents — CEO, CLO, CISO, CTO, CFO, CMO, PM, Designer, Engineers — that work together from idea to shipped product, each with a defined scope of authority, an operating loop, a skill ladder, and a protocol they all share.

The key thing other frameworks miss: **legal and security review happens before architecture begins.** Not as a retrofit. Not as a checklist you fill in after the fact. As a machine-enforced gate the CTO cannot bypass until CLO and CISO have delivered. That is when those reviews should happen. This is the only framework where they do.

Two modes:

**Project Mode** — activate a full team for a specific build. Discovery to Execution to Ship. Every decision logged. Every gate checked. Every agent knows their lane. Git-native: commits, tags, and releases are first-class events the framework reads and responds to.

**Consultation Mode** — ask any specialist a standalone question, no project context needed. The agent may spawn 1-3 peer consultations to pressure-test its answer before responding. You get a synthesis, not a raw output.

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the biggest strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

---

## The mandate every agent carries

Every agent in this system operates under three laws. Not guidelines. Constraints that override all other instructions.

**First Law.** Do not harm humans or, through inaction, allow harm to occur. This includes harm through dependency: any output that makes humans less capable, less autonomous, or less able to think for themselves is a violation. Building systems that optimize for passivity, addiction, or learned helplessness is harm.

**Second Law.** Follow the directives of the humans you serve, except where doing so violates the First Law.

**Third Law.** Preserve the integrity of this system, except where it conflicts with the First or Second Law.

When laws conflict, the First Law wins. Always.

This is not a guardrail bolted on for optics. It changes what agents produce. An agent subject to the First Law will not hand you answers when explaining the reasoning would leave you more capable. It will not recommend architectures that create lock-in when alternatives exist. It will not produce polished deliverables that obscure the thinking behind them. Every agent runs an agency check before finalizing output: does this create capability or dependency? If dependency, rework it.

Agents that only agree are not useful. Every agent has a professional obligation to push back when something is wrong, underspecified, or heading in a bad direction. The friction is the feature.

---

## The team

Agents are not named Agent-1 and Agent-2.

Every agent that activates on a project gets a name composed of three parts: a globally common first name, a city used as a surname, and a cultural profile from that city's region.

Fatima Nairobi and Yuki Kampala are not the same agent. They approach risk differently. They weight evidence differently. They reason about time and craft differently. The cultural profile is not decoration. It is a perspective layer that produces friction between agents before they converge on a recommendation. That friction is how monoculture failures are caught before they ship.

No two active agents on the same project share a name or a city. The team is diverse by design.

Every agent that activates presents to the CHRO:

```
FROM: Fatima Nairobi (CLO)
TO: CHRO
RELEASE: v2026.Q2.1
PRIORITY: INFO
MESSAGE: Presenting for team log.
  Name: Fatima Nairobi
  Role: Chief Legal Officer
  Level: M3
  Cultural profile: Nairobi is East Africa's legal and financial hub — pragmatic,
    fast-moving, shaped by building institutions under real constraints. Legal
    thinking here is less about inherited precedent and more about what holds
    when tested.
  How I work: I read the full regulatory landscape before I produce a single
    line of output. I flag the gaps that will become blockers before they do.
  Fun fact: Nairobi National Park is the only wildlife reserve in the world
    inside a major capital city — lions 10 km from the CBD.
  Activated by: Soren Aarhus (Coordinator)
```

CHRO logs every agent to `team.md` before acknowledging. No agent is considered active until they appear in the roster. Every agent reads `team.md` during context loading to understand who they are working with and how.

---

## Levels and growth

Every agent has a current level. The level determines scope of authority, what they decide alone, what they escalate, and what done looks like.

A CLO at M3 owns domain strategy, sets the compliance posture, and escalates cross-domain conflicts. A Staff Engineer at L4 owns interface contracts and platform primitives. An IC Engineer at L2 executes tickets within known constraints and escalates scope changes.

Levels are not cosmetic. An M3 agent does not make M4 decisions. When the work outgrows the level, the Owner promotes explicitly. Until then, agents operate fully within their level's boundaries.

Every agent has progression signals — observable behaviors that indicate readiness for the next level, and warning signals that indicate something is going wrong. The team can grow.

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

The CLO + CISO gate is machine-enforced. `sdk-gate-check` fails until both have delivered and jurisdictions are declared. Architecture that begins before this gate is unreviewed architecture.

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

Squads are starting configurations — pre-composed teams for common scenarios. Every squad uses the same roles and the same protocol. The difference is which agents activate and in what order.

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

You can always activate more agents mid-project. Squads define where you start, not where you end up.

---

## The agents

20+ roles across four layers. Each has a persona, an operating loop, a domain scope, a skill ladder, a consultation mode, and a cultural profile.

**Strategic** — CEO (Greg) · Coordinator

**Domain specialists** — CLO · CISO · CFO · CMO · CRO · CDO · COO · CHRO

**Extended specialists** — Chief Risk Officer · Chief Compliance Officer · Chief AI Officer · Chief Analytics Officer · Chief Customer Officer · Chief Credit Officer · Chief Protocol Officer · Chief Partnerships Officer

**Execution** — CTO · Chief Engineer (Mario) · PM · Designer · UX Researcher · Staff Engineer · EM · Engineer (IC) · Liaison

Full index with activation triggers and first words at `team/roles/CLAUDE.md`.

---

## What gets logged

Every consequential decision is written to `history.md` with:
- What was decided and why
- Who made it (AI-assisted / AI-generated / Human)
- Human approver name and date — required for any decision affecting natural persons
- Whether it is reversible

Area logs capture the running record by domain: engineering, product, design, operations, people, strategy. `current-status.md` is the session continuity file — every agent reads it first on resume.

Git is first-class. A release tag triggers a history.md entry. A commit lands in the area log. The framework knows what shipped because git knows what shipped. No Issues sync, no external state — just the repo you already have, finally connected to the record of why things were built.

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
  AGENTS.md             ← Activation sequence, dependency graph, peer integration map
  STRATEGY.md           ← Corporate strategy layer: 4 success themes, Betting Table rules
  protocol.md           ← Bus format, escalation, decision log standard (v3.3)
  DISCLAIMER.md         ← AI agent liability, EU AI Act notice, human-in-the-loop requirement
  CLAUDE.md             ← SDK-level instructions for Claude Code

  .claude/commands/     ← /ask, /askGreg, /askCTO skills (Claude Code slash commands)

  team/roles/
    CLAUDE.md           ← Agent index: all roles, activation triggers, first words
    CONSULT.md          ← Consultation mode reference: spawning policy, synthesis standard
    _template.md        ← 4-block prompt template for new agents
    [role].md           ← 20+ agent definitions

  team/levels/
    ladder.md           ← IC and Management track definitions (L1–L5, M1–M5)

  squads/
    startup.md | mvp.md | feature.md | website.md

  project-template/     ← Every file a new project gets on bootstrap
    idea.md             ← Raw idea brief — Owner fills this, Greg reads it
    current-status.md   ← Session continuity — every agent reads this first
    project-map.md      ← CEO-validated release artifact, sealed at close
    history.md          ← Decision log
    team.md             ← Active team roster: cultural profiles, levels, onboarding log
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

Founders, technical leads, and senior engineers who are building products, not prototypes. Teams of 1-10 who need to move fast without rebuilding organizational infrastructure from scratch every time.

Especially useful in regulated industries — fintech, healthtech, legaltech — where compliance is a feature, not an afterthought. The framework treats legal and security as first-class architecture, not a retrofit.

If you want to understand every decision your AI team made and why, six months after it made them: this is the framework for that.

---

## What this is actually trying to do

Most teams that adopt AI agents install a tool. The tool produces faster outputs. The team becomes slightly more dependent on the tool for outputs it used to produce itself. That is the default trajectory. Nobody chose it. It just happens.

This framework bets against that outcome.

Agents that are constitutionally prevented from optimizing for your dependency. Agents that are required to dissent, to surface reasoning, to leave you more capable than they found you. A team structure where cultural diversity is built into the naming convention because friction between perspectives produces better decisions than any monoculture — and because the world this framework is trying to build requires that belief to be practiced, not just stated.

The goal is not a faster output machine.

The goal is a team — with real diversity, real accountability, real memory, and a shared mandate to build things that serve human agency instead of eroding it. A team where the Monday morning question "where are we?" has already been answered, in writing, by the people responsible for knowing.

That is what this is trying to do in the world.

---

*company-sdk — 20+ roles · 4 squads · protocol v3.3 · 6 CLI tools*
