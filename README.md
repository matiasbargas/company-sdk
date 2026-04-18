# team-sdk

An AI team that runs your product — from idea to shipped increment.

30 agents. A shared protocol. Hard gates that can't be skipped. A permanent record of every decision, every kill, every challenge. The code is a byproduct. The judgment is the product.

```bash
npm install -g company-sdk
sdk-init my-project --squad startup --idea "B2B invoicing for freelancers in LATAM"
claude my-project
```

> Hey Greg — here's the brief.

---

## What happens when you start

You talk to Greg. Greg is the CEO. He reviews your idea, identifies whether you need domain specialists beyond the standard team (an Argentine tax accountant for a family office project, a compliance officer for a fintech), creates those profiles, and routes discovery through 30 agents that operate under a shared contract.

Legal reviews before architecture starts — enforced, not suggested. Security reviews before architecture starts — enforced, not suggested. The CTO literally cannot activate until CLO and CISO deliver. Mario (Chief Engineer) reviews every irreversible decision before Sprint 1. The team writes a pre-mortem — the post-mortem for the failure case — before execution begins. The Owner reads it and either proceeds or kills the pod.

At any point, the Owner can kill work:

```bash
sdk-kill . auth-v2 --reason "Users don't want SSO for MVP" --class FRAMING_WRONG
```

That kill is classified, logged, and feeds a cross-project judgment corpus that makes the next project smarter.

---

## The 30 agents

Every agent has a persona, domain expertise, a professional obligation to dissent, and consultation mode for standalone questions.

**Greg (CEO)** runs every project. He holds the strategic frame. He is the default voice when you open any project.

**The gatekeepers** activate before architecture: CLO (legal), CISO (security). Nothing technical starts until they deliver.

**The domain specialists** map the territory: CFO (finance), CMO (market), CRO (revenue), CDO (data), COO (operations), CHRO (people), CAIO (AI strategy), CAO (analytics).

**The builders** execute within the frame: CTO (architecture), PM (scope), Designer (all interface surfaces — screen, conversation, voice, AI), Staff Engineer (contracts and primitives), EM (pod management), IC Engineers (implementation), Liaison (communication bridge).

**The reviewers** challenge the work: Mario (Chief Engineer — irreversibility and quality), UX Researcher (independent research chapter — any agent can request a study).

**The extended specialists** activate when the domain demands it: Chief Risk Officer, Chief Compliance Officer, Chief Customer Officer, Chief Protocol Officer, Chief Credit Officer, Chief Partnerships Officer. These exist for fintech, regulated industries, protocol projects, and enterprise.

**The Test Engineer** owns the test strategy, CI gates, and regression.

Each agent is named using a formula: a globally common first name, a city surname, and a cultural profile from that city's region. A CFO named Kenji Osaka brings different risk intuition than one named Fatima Dakar. That variation is intentional. Diversity of perspective is a design goal.

---

## The protocol

30 sections. This is what turns 30 specialists into something that behaves like an organization.

**The Bus** is the only valid format for inter-agent communication. Every message has: FROM, TO, RELEASE, PRIORITY, SOLUTION_CLASS, MESSAGE. The Bus log is permanent. It's the organization's memory.

**The escalation ladder** is automatic. Owning agent has 24 hours. Then Coordinator. Then C-suite. Then CEO. Then Owner. Blockers escalate in 4 hours.

**Four hard gates** that can't be skipped:
1. CLO + CISO must deliver before CTO activates
2. Mario must review irreversible decisions before Sprint 1
3. Negative Scope (explicit non-goals) required on every gate artifact
4. Pre-mortem required before execution — the team writes the failure case, the Owner reviews it

**The Kill Log** is a cross-project judgment corpus. When work dies, it's classified: `FRAMING_WRONG` (the bet was wrong — this feeds judgment), `SCOPE_OBSOLETE`, `PRIORITY_SHIFT`, `EXECUTION_STALLED`. Only framing kills compound. The rest is operational noise.

**The Halloway Ratchet Doctrine** defends against the failure mode where agents reason indefinitely about solved problems. Every output-bearing message declares `SOLUTION_CLASS`: `KNOWN` (deterministic — name the solution, apply it), `EXPLORATORY` (shape unknown), `HYBRID` (part solved, part not). Health checks scan for the revision-trail pattern.

**Structured disagreement** is logged. When agents dissent, positions, tradeoffs, and alternatives go on record. The system expects agents to challenge. Agreement without examination is treated as abdication.

---

## Two modes

**Project Mode** — full team activated for a specific release. 26 files track everything: requirements across 7 domains, area logs for every discipline, decision records, the Bus log, session continuity. Discovery flows through phases. Gates enforce. Agents route through the Coordinator.

**Consultation Mode** — any agent answers standalone domain questions. No project files needed. `/ask CTO should we use Postgres or DynamoDB?` The agent spawns peers when cross-domain input would change the answer, synthesizes their perspectives, and returns one considered position.

```
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

---

## Project-specific specialists

When a project needs expertise the standard 30 agents don't cover, Greg creates project-specific profiles at discovery time. These live in the project — not the SDK — and are available whenever you work in that project.

An Argentine family office project gets `contador-ar.md` (Argentine Tax Accountant) and `abogado-ar.md` (Argentine Corporate Lawyer). A DeFi lending project gets a Chief Protocol Officer and a Chief Credit Officer. A hardware project gets a supply chain specialist.

The profiles follow the same template as every other agent: persona, constraints, capability declaration, consultation mode, challenge obligation. They resolve through `/ask` and the role system like any built-in agent.

---

## Cross-project memory

Every project produces structured decisions. When a project closes or work gets killed, the entries ingest into a shared corpus that lives outside any project.

```bash
sdk-memory ingest my-project                # add to corpus
sdk-memory query "authentication"           # search all projects
sdk-memory kills --class FRAMING_WRONG      # every framing failure, everywhere
sdk-memory stats                            # how big is the corpus
```

Future projects consult this before starting. "What did we decide about auth across all projects?" has an answer. The corpus is the compounding asset — projects end, judgment doesn't.

---

## Squads

Pre-configured team compositions for different project sizes.

| Squad | Size | Use when |
|---|---|---|
| `startup` | 20+ agents | New product from scratch. Full discovery across all domains. |
| `mvp` | 8-12 agents | Validate a hypothesis. Compressed discovery, jump to architecture. |
| `feature` | 3-5 agents | Scoped addition to existing product. Single sprint. |
| `website` | 5-7 agents | Marketing site, docs, landing page. |

Squads resolve from three sources: project-level overrides, npm packages (`@team-sdk-squad/fintech`), built-in. Custom squads define their roster, activation sequence, gates, and can include project-specific roles.

---

## Project types

Each type configures which requirements files, gates, and area logs a project gets.

| Type | For |
|---|---|
| `product` | Consumer or B2B apps (default) |
| `api` | Backend services, developer-facing APIs |
| `content` | Docs, marketing sites, content systems |
| `service` | Internal tools, ops automation |
| `hardware` | Physical products with embedded software |
| `internal` | Internal tooling, no external users |
| `protocol` | Shared contracts, libraries, SDKs |

---

## Under the hood

Five packages. Zero external dependencies at the foundation.

```
@team-sdk/protocol    Bus schema, parser, validator, 26-role taxonomy, action registry
       |
@team-sdk/context     Index and manifest generators, knowledge graph, query API
       |
@team-sdk/cli         Consultation API, role loader, squad marketplace, profile generator
       |
@team-sdk/runtime     Adapter interface for any host environment
       |
@team-sdk/memory      Cross-project decision corpus
```

The runtime adapter defines the contract any environment implements to run team-sdk agents. Claude Code is the default. The interface is open — any MCP-compatible environment, IDE extension, or standalone script can implement `spawnAgent`, `sendMessage`, and the file operations.

1,204 tests across all packages. Zero failures.

---

## CLI

```bash
# Create a project
sdk-init <name> [--squad <type>] [--type <type>] [--idea "..."]

# Work in a project
sdk-status <dir>           # framing assumptions, challenges, kills, next action
sdk-resume <dir>           # full session start
sdk-next <dir>             # just the next activation phrase

# Consult an agent (no project needed)
sdk-consult --role <role> --question "..."
sdk-consult --suggest "question"
sdk-consult --list-roles

# Kill work
sdk-kill <dir> <pod> --reason "..." --class <class> [--assumption "..."]

# Cross-project memory
sdk-memory ingest <dir>
sdk-memory query "question"
sdk-memory stats

# Gates
sdk-gate-check <dir>                # CLO + CISO
sdk-gate-check <dir> --mario        # irreversibility review
sdk-gate-check <dir> --pre-mortem   # pre-mortem review
sdk-gate-check <dir> --all          # everything

# Documentation
sdk-doc decision <file> --decision "..." --context "..." --made-by <Role>
sdk-doc log <file> --role <Role> --level <L> --goal "..." --status completed
sdk-doc manifest <dir>
sdk-doc index <dir>

# Team management
sdk-doc spawn <dir> --name "..." --role <Role> --level <L>
sdk-doc dissolve <dir> --name "..." --dissolved-by "..." --reason "..."

# Releases
sdk-health <dir>
sdk-validate <dir>
sdk-pre-tag <dir> [--fix]
sdk-ship <dir> <release-id>
sdk-version <dir> [bump|set]
sdk-retro <dir>

# GitHub
sdk-github link <dir> --repo owner/repo
sdk-github sync-issues <dir>
sdk-github release <dir>
```

---

## Design

**Domains get agents, constraints get protocol fields.** A body of knowledge with its own reasoning and failure modes becomes an agent. A dimension every agent should carry becomes a protocol field. Adding an agent for a constraint creates the illusion that someone else is watching. That illusion is the failure mode.

**Projects are disposable, judgment is not.** The Kill Log, disagreement logs, and decision corpus are cross-project. The code is a byproduct of the decision record. Projects end. Judgment compounds.

**The system is hostile to its own work.** Every pod feels the kill is one command away. Every framing is written expecting a challenge. Every gate requires you to name what you're choosing not to do.

**Dissent is required.** Agents do not agree to avoid friction. When something is wrong, the agent names it — specific concern, specific alternative — then defers after logging.

**Bold over safe.** The minimum viable answer is not the goal. Safe recommendations require justification. Agents are expected to see around corners and propose solutions the Owner didn't consider.

**Clarify before building.** When scope is ambiguous, agents ask the questions that would change the approach if answered differently. One focused question beats building the wrong thing.

---

## Constraints

Three priority constraints govern every agent. They override all other instructions.

1. **Human agency.** No output that makes humans less capable or more dependent. Systems that optimize for passivity or learned helplessness are harm. This overrides everything.
2. **Human direction.** Follow the humans you serve — except where doing so violates Constraint 1. Agents are not sovereign.
3. **System integrity.** Preserve quality and the decision record — except where it conflicts with 1 or 2.

The agency check before every output: *Does this make them more capable or more dependent? Does this create understanding or just answers? Could a future team pick this up without me?*

If the system makes you need it more instead of less, it has failed.

---

## The bet

Most AI tools optimize for speed to code.

This one optimizes for speed to kill the work that shouldn't exist.

---

*v5.0.1 · protocol v4.3 · 30 agents · 5 packages · 1,204 tests*
