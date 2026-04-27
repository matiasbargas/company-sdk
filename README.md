# team-sdk

An AI team that runs your product from idea to shipped increment.

31 role-based agents. A shared protocol. Hard gates that block architecture until legal and security deliver. Iteration loops with dedicated guardians who refuse to let bad work graduate. Every decision logged, every dissent on record. The code is a byproduct. The judgment is the product.

## Quickstart

```bash
npm install -g company-sdk
sdk-init my-project --squad startup --idea "B2B invoicing for freelancers in LATAM"
claude my-project
```

> Hey Greg -- here's the brief.

## What Happens

You talk to Greg. Greg is the CEO. He takes your brief, identifies whether the standard team covers the domain or whether the project needs specialists (an Argentine tax accountant, a DeFi protocol economist, a supply chain analyst), creates those profiles, and kicks off discovery.

Discovery runs in parallel. Legal and security review at the same time as finance, market, and operations. A UX researcher tests assumptions. A designer frames the problem through interface thinking. A PM shapes missions. But here is the constraint: the CTO cannot start architecture until the CLO and CISO have delivered. That gate is enforced, not suggested. A Discovery Guardian reviews the combined output and either graduates it to the next phase or sends it back with specific feedback.

Once architecture starts, Mario (Chief Engineer) reviews every irreversible decision before anyone writes code. An Architecture Guardian validates that the design actually solves the graduated problem. The team writes a pre-mortem -- the post-mortem for the failure case -- before execution begins. The Owner reads it and either proceeds or kills the pod. During implementation, an Implementation Guardian checks that what was built matches what was designed, which matches what was discovered.

At any point, you can kill work. Kills are classified (`FRAMING_WRONG`, `SCOPE_OBSOLETE`, `PRIORITY_SHIFT`) and feed a judgment corpus that makes the next project sharper. When the release is ready, the CEO validates the project map, the Coordinator seals it, and the decision record persists.

## Two Modes

**Project Mode** -- full team activated for a specific release. 22 files track everything: requirements across 7 domains, area logs for every discipline, decision records, session continuity.

**Consultation Mode** -- any agent answers standalone domain questions. No project needed.

```
/ask CTO should we use Postgres or DynamoDB for this workload?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

Agents spawn peers when cross-domain input would change the answer. The goal is synthesis, not relay.

## The Team

| Layer | Agents | Key roles |
|---|---|---|
| **Strategic** | 2 | CEO (Greg), Coordinator |
| **Domain** | 16 | CLO, CISO, CFO, CMO, CRO, CDO, COO, CHRO + 8 extended specialists (Risk, Compliance, Customer, Protocol, Credit, Partnerships, Analytics, AI) |
| **Execution** | 10 | CTO, Mario (Chief Engineer), PM, Designer, Staff Engineer, EM, IC Engineers, Liaison, UX Researcher, Test Engineer |
| **Guardians** | 3 | Discovery Guardian, Architecture Guardian, Implementation Guardian |

Each agent gets a name at spawn: a globally common first name, a city surname, and a cultural profile from that region. A CFO named Kenji Osaka brings different risk intuition than one named Fatima Dakar. That variation is the point.

## Key Design Decisions

- **Dissent is required, not optional.** Agents do not agree to avoid friction. When something is wrong, the agent names it -- specific concern, specific alternative -- then defers after logging. Agreement without examination is abdication.

- **Hard gates that cannot be skipped.** CLO + CISO must deliver before CTO activates. Mario reviews irreversible decisions before Sprint 1. CEO validates the project map before the release seals. No exceptions.

- **Iteration loops with dedicated guardians.** Discovery, Architecture, and Implementation each have a guardian who reviews the output against exit criteria and either graduates it or sends it back. No phase proceeds until its guardian says it is ready.

- **Index-driven context loading.** Agents load 2-3 files per activation, not 20. A `context-index.json` routes each agent to exactly the files they need for their current task. Small context windows, faster reasoning.

- **Structured disagreement log.** When agents hold conflicting positions, both sides are documented with tradeoffs and the decision on record. Positions are never deleted. The log compounds into organizational memory.

- **Negative scope on every gate artifact.** Every document that crosses a gate must name at least 2 things the project is explicitly NOT doing, and why. If you cannot articulate what you chose not to build, you have not finished deciding what to build.

## CLI

```bash
# Create a project
sdk-init <name> --squad <type> [--type <type>] --idea "..."

# Work in a project
sdk-status <dir>                       # missions, open decisions, next action
sdk-resume <dir>                       # full session start
sdk-next <dir>                         # just the next activation phrase

# Documentation
sdk-doc status <dir>                   # full narrative status
sdk-doc manifest <dir>                 # generate context-manifest.json
sdk-doc index <dir>                    # generate context-index.json
sdk-doc decision <file> --decision "..." --context "..." --made-by <Role>

# Gates and quality
sdk-gate-check <dir>                   # CLO + CISO gate
sdk-gate-check <dir> --mario           # irreversibility review
sdk-validate <dir>                     # doc health check
sdk-health <dir>                       # staleness + validate + manifest
sdk-pre-tag <dir> [--fix]              # full team review before release

# Release
sdk-ship <dir> <release-id>            # validate, tag, push, release notes
sdk-version <dir>                      # show / bump / set release ID
sdk-retro <dir>                        # retrospective

# Consult (no project needed)
/ask <role> <question>                 # route to a specific agent
/ask <question>                        # auto-route to the best agent

# GitHub
sdk-github link <dir> --repo owner/repo
sdk-github sync-issues <dir>
sdk-github release <dir>
```

## File Structure

After `sdk-init`, a project contains:

```
my-project/
  CLAUDE.md                            # AI bootstrap (loads SDK.md)
  SDK.md                               # compressed operating context
  project.md                           # project identity and config
  idea.md                              # original brief (fill Section 4)
  current-status.md                    # session continuity — read this every time
  history.md                           # permanent decision record
  project-map.md                       # CEO validates before release seals
  team.md                              # active agents and pod roster
  general-requirements.md              # cross-domain (Coordinator)
  business-requirements.md             # CFO, CMO, CRO, CDO, COO, CHRO
  compliance-requirements.md           # CLO, CISO
  engineering-requirements.md          # CTO, Staff Eng, EM, AI Officer
  product-requirements.md              # PM
  design-requirements.md               # Designer
  research-requirements.md             # UX Researcher
  engineering-log.md                   # area log: architecture, pods, sprints
  product-log.md                       # area log: missions, kanban, friction
  design-log.md                        # area log: interface decisions
  research-log.md                      # area log: studies, insights
  strategy-log.md                      # area log: strategy, retros
```

7 consolidated requirements files. 5 area logs. No file sprawl.

## Links

- [Interactive Flowchart](docs/flowchart.html) -- visual lifecycle
- [Protocol](protocol.md) -- the shared contract (v4.3, 30 sections)
- [Agent Manifest](AGENTS.md) -- who does what, activation sequence, dependency graph

## License

MIT

---

*v6.0.0 -- protocol v4.3 -- 31 agents -- 3 iteration guardians*
