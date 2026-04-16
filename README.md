# team-sdk

> A system that is slightly hostile to its own work — by design.

**team-sdk** is a [Claude Code](https://claude.ai/code) extension that gives your project a structured AI team — role-based agents coordinated by a shared protocol, optimized for the one behavior that matters: **challenging framings and killing bad work before it compounds.**

It is not a coding assistant. It is infrastructure for product judgment at AI speed.

```bash
npm install -g company-sdk
sdk-init my-project --squad mvp
claude my-project
```

```
Hey Greg — here's the brief: [paste from idea.md Section 4]
```

---

## The problem

The scarcest resource in any product organization is the judgment of the person who can challenge framings and kill bad work early. That person becomes the bottleneck they were supposed to remove, because the system produces work faster than their attention can govern it.

Adding process protects work in flight from disruption — which is the wrong default when the work in flight is cheap and the judgment is expensive.

AI coding assistants solve the wrong problem. They make individual developers faster at writing code. But code was never the bottleneck. Alignment, decision quality, and organizational memory are.

## What the Owner actually does

The Owner challenges framings and kills bad pods. That is the product thesis stated as a user behavior. Every design decision in the system traces back to it:

- Negative Scope is mandatory so the assumption that's load-bearing is findable in thirty seconds
- `/kill` is a first-class verb so terminating work is cheap and not political
- The daily surface shows framing assumptions, not status, so attention routes to what needs judgment
- Bad-pod signals are automated so detection scales past what one person can read
- The pre-mortem gate forces teams to write the failure case before starting — the Owner reads it and either proceeds or kills

If the Owner opens a session and nothing needs challenging, the session is thirty seconds. The system is working.

---

## Getting started

### 1. Install

```bash
npm install -g company-sdk
```

### 2. Pick a squad

| Squad | Agents | Use when |
|---|---|---|
| `mvp` | 8-12 | **Default.** Validate a hypothesis. Compressed discovery, jump to architecture. |
| `startup` | 20+ | New product from scratch. Full legal, security, finance, market context. |
| `feature` | 3-5 | Scoped addition to an existing product. Single sprint. |
| `website` | 5-7 | Marketing site, docs, landing page. |

### 3. Scaffold

```bash
sdk-init my-project --squad mvp
# With an idea pre-loaded:
sdk-init my-project --squad mvp --idea "B2B invoicing tool for freelancers in LATAM"
# With a project type:
sdk-init my-api --squad mvp --type api
```

### 4. Open in Claude Code and start

```bash
claude my-project
```

```
Hey Greg — here's the brief: [paste Section 4 from idea.md]
```

Discovery starts. The Coordinator routes. The protocol handles the rest.

### 5. Resume any session

```bash
sdk-status .           # framing assumptions, open challenges, kills, missions, next action
sdk-resume .           # full session start: health check + gate advisory + cockpit
sdk-next .             # just the next activation phrase
```

### 6. Ask any agent without a project

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

The agent spawns peer consultations to pressure-test its answer, then synthesizes — you get a considered position, not a first draft.

---

## What makes this different

### The protocol is the product

The value isn't in any single agent. It's in the protocol between them — the Bus format, the escalation ladder, the hard gates, the Kill Log, the Negative Scope, the pre-mortem, the near-miss log. These are the connective tissue that turns specialist agents into something that behaves like a high-functioning organization.

### Legal and security happen before architecture — enforced

The CTO cannot activate until CLO and CISO have delivered. This isn't a checklist. It's a gate the framework won't let you skip.

```bash
sdk-gate-check my-project
# GATE BLOCKED
#   CLO (Legal) gate is "In Progress" — must be "Done" before CTO activates.
```

### Every framing is written to be challenged

Negative Scope is mandatory on every gate-crossing artifact — what you're choosing NOT to do. `sdk-gate-check` hard-fails if it's empty. The pre-mortem gate forces the team to write the post-mortem for the failure case before Sprint 1 starts. The Owner reads it and either proceeds or `/kill`s the pod.

### Killing work is cheap

```bash
sdk-kill . auth-v2 --reason "Users don't want SSO for MVP" --class FRAMING_WRONG --assumption "Enterprise users need SSO before trying the product"
```

Kills are classified: `FRAMING_WRONG` (the bet was wrong), `SCOPE_OBSOLETE`, `PRIORITY_SHIFT`, `EXECUTION_STALLED`. Only framing kills feed the cross-project judgment corpus. The Kill Log is the most valuable artifact the system produces — a catalog of your judgment applied to real work.

### Agents that dissent

Every agent has a professional obligation to push back when something is wrong or heading in a bad direction. Challenges are logged. Disagreements are structured — positions, tradeoffs, resolution, and dissent on record.

```bash
sdk-doc disagreement . open --topic "Auth provider" --position-a "CTO: Use Auth0" --position-b "CISO: Build in-house"
```

### Memory that compounds across projects

The Kill Log, disagreement logs, and near-miss logs persist across projects. Future pods consult them before spinning up. New team members read them to calibrate. Projects are disposable. Judgment isn't.

```bash
sdk-status . --cross-project    # FRAMING_WRONG kills across all projects
sdk-doc history . --domain engineering --reversible false   # irreversible engineering decisions
```

### Framing drift detection

```bash
sdk-health . --framing-drift
# Framing drift: Brief -> product-requirements: 60% of original brief terms missing from current scope
```

The system watches for scope creep dressed as learning.

---

## How a project flows

```
Phase 0   Owner writes brief in idea.md → activates Greg (CEO)
            ↓
Phase 1   CEO → CLO → CISO → CFO → CMO → PM (discovery)
            ↓
          CLO + CISO gate — CTO cannot start until both deliver
            ↓
Phase 2   CTO → Mario (irreversibility + near-miss review) → Designer → Staff Eng → EM
            ↓
          Negative Scope gate — non-goals must be explicit
            ↓
          Pre-mortem gate — team writes the failure case, Owner reviews
            ↓
Phase 3   Liaison activates → Engineers execute → /kill available at all times
            ↓
Phase 4   Logs written → PM seals kanban → CEO validates → Coordinator seals
```

Four hard gates: CLO+CISO before CTO, Mario before Sprint 1, Negative Scope on every gate artifact, Pre-mortem before execution.

---

## CLI reference

```bash
# Project setup
sdk-init <name> [--squad <type>] [--type <type>] [--idea "..."]
sdk-update [<sdk-path>]

# Daily workflow
sdk-status <project-dir>                            # framing-first view
sdk-resume <project-dir>                            # full session start
sdk-next <project-dir>                              # next activation phrase

# Kill and challenge
sdk-kill <project-dir> <pod> --reason "..." --class <class> [--assumption "..."]
sdk-doc disagreement <project-dir> open --topic "..." --position-a "..." --position-b "..."
sdk-doc disagreement <project-dir> resolve --id DISAGREE-NNN --decision "..." --decided-by <Role>

# Decision record
sdk-doc decision <file> --decision "..." --context "..." --made-by <Role> [--domain X] [--reversible Y]
sdk-doc history <project-dir> [--domain X] [--search Y] [--reversible Z]

# Gates
sdk-gate-check <project-dir>                        # CLO + CISO gate
sdk-gate-check <project-dir> --mario               # Mario gate
sdk-gate-check <project-dir> --pre-mortem          # Pre-mortem gate
sdk-gate-check <project-dir> --all                 # all gates

# Documentation
sdk-doc log <file> --role <Role> --level <L> --goal "..." --status completed
sdk-doc bus <project-dir> --from <Role> --to <Role> --message "..." [--tag FRAMING-CHALLENGE]
sdk-doc manifest <project-dir>
sdk-doc index <project-dir>

# Pod lifecycle
sdk-doc spawn <project-dir> --name "..." --role <Role> --level <L>
sdk-doc dissolve <project-dir> --name "..." --dissolved-by "..." --reason "..."

# Releases
sdk-validate <project-dir> [--strict]
sdk-health <project-dir> [--framing-drift] [--json]
sdk-pre-tag <project-dir> [--fix]
sdk-ship <project-dir> <release-id> [--dry-run]
sdk-version <project-dir> [bump|set]
sdk-retro <project-dir>

# GitHub integration
sdk-github link <project-dir> --repo owner/repo
sdk-github sync-issues <project-dir>
sdk-github release <project-dir>
```

---

## Project types

Use `--type` at init to configure gate enforcement.

| Type | Use for |
|---|---|
| `product` | Consumer or B2B apps (default) |
| `api` | Backend services, developer-facing APIs |
| `content` | Docs, marketing sites, content systems |
| `service` | Internal tools, ops automation |
| `hardware` | Physical products with embedded software |
| `internal` | Internal tooling, no external users |
| `protocol` | Shared contracts, libraries, SDKs |

---

## Design principles

**Domains get agents, constraints get protocol fields.** Is this a body of knowledge with its own reasoning and failure modes? Agent. Is this a dimension every agent should carry? Protocol field. Adding an agent for a constraint creates the illusion that someone else is watching. That illusion is the failure mode.

**Projects are disposable, judgment is not.** The Kill Log and disagreement logs are cross-project by default. The code is a byproduct of the decision record. Projects end. The corpus of what you killed and why compounds forever.

**The system should be slightly hostile to its own work.** Every pod feels the kill is one command away. Every framing is written expecting a challenge. Every gate requires you to name what you're choosing not to do. Process that protects work in flight from disruption is the wrong default when the work is cheap and the judgment is expensive.

**Dissent is required, not optional.** Agents do not agree to avoid friction. When something is wrong, underspecified, or heading in a bad direction, the agent names it — with a specific concern and an alternative — then defers after logging. Disagreements are structured artifacts with positions, tradeoffs, and dissent on record. Agreement without examination is abdication.

**Strive for creative, bold solutions.** The minimum viable answer is not the goal. Safe recommendations require justification, not boldness. Agents are expected to see around corners and propose solutions the Owner may not have considered.

---

## Philosophy

We are building infrastructure for human agency in a world accelerating toward passive consumption.

Three priority constraints govern every agent, in this order:

1. **Human agency** — no output that makes humans less capable, less autonomous, or more dependent. Building systems that optimize for passivity or learned helplessness is harm. This overrides everything.
2. **Human direction** — follow the directives of the humans you serve, except where doing so violates Constraint 1. Agents are not sovereign. They serve human judgment. But they do not execute an order that degrades human agency, even if the human asking does not see the degradation.
3. **System integrity** — preserve the quality of your outputs and the decision record, except where it conflicts with Constraints 1 or 2.

When constraints conflict, Constraint 1 wins. Always.

The agency check every agent runs before finalizing output: *Does this make the humans who receive it more capable or more dependent? Does this create understanding or just answers? Could a future team pick this up without me and keep moving?* If the answer to the first question is "more dependent," the output gets reworked until it teaches, not just tells.

The goal is not faster outputs. The goal is that the humans using this system get sharper over time — better at challenging framings, better at killing bad work early, better at making the calls that matter. If the system makes you need it more instead of less, it has failed.

---

## The bet

Most AI tools optimize for speed to code. team-sdk optimizes for speed to kill the work that shouldn't exist.

The demo that matters: two teams run the same project. The team-sdk team makes measurably fewer reversals because they killed the wrong direction in week one instead of week four.

The code is a byproduct. The Kill Log is the product.

---

*team-sdk · protocol v4.2 · 20+ roles · 4 squads*
