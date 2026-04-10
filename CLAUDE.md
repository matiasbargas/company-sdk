# team-sdk

An AI agent orchestration framework for product teams. 20+ role-based agents that work together from idea to shipped increment — and standalone, answering domain questions without a project.

## What this repo is

The SDK itself — not a project. It contains:
- `SDK.md` — **compressed AI bootstrap**: full operating context in one file (load this first)
- `team/roles/` — every agent's persona, operating loop, consultation mode, and skill ladder
- `project-template/` — all files a new project gets on bootstrap (7 consolidated requirements files)
- `team/squads/` — pre-configured team compositions (website, mvp, feature, startup)
- `scripts/` — CLI tools (init, bootstrap, squad, doc, gate-check, validate, status, version, retro, health, github, cloud, ship)
- `protocol.md` — the shared contract: Bus format, escalation, BU communication, spawning policy (v3.6)
- `AGENTS.md` — agent manifest: activation sequence, dependency graph, consultation patterns
- `STRATEGY.md` — corporate strategy layer: 4 success themes, Betting Table rules

## Two modes

**Project Mode** — full team activated for a specific project. Use `sdk-init`.

**Consultation Mode** — any agent answers standalone domain questions. Use `/ask`.

## Starting a new project

```bash
node scripts/init.js <project-name> --squad startup
# or
node scripts/init.js <project-name> --squad mvp --idea "your raw idea"
```

Then open `<project-name>/idea.md`, complete Section 4, and say:
> "Hey Greg — [paste the brief from idea.md Section 4]"

## Consulting an agent (no project needed)

```
/ask CTO should we build this in-house or use a managed service?
/ask Greg what's the strategic risk in launching in two markets at once?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask what's the right data model for a multi-tenant SaaS?
```

`/ask [role] [question]` — routes directly to that agent, who may spawn peers for depth.
`/ask [question]` — Coordinator routes to the best agent and synthesizes.

Agents prioritize **understanding over time**. Spawn every peer whose domain input would change the answer — no cap. See `team/roles/CONSULT.md`.

## Key agents

| Agent | How to activate |
|---|---|
| **Greg (CEO)** | "Hey Greg, [brief]" — starts Discovery, or `/ask Greg` |
| **Coordinator** | Routes everything. Activated by CEO after brief. |
| **PM** | Mission shaping. Activated Phase 1 (parallel) + Phase 2. |
| **CTO** | Architecture. Activated after CLO + CISO gate. Or `/ask CTO` |
| **Designer** | Design perspective (Phase 1) + interface direction (Phase 2). |
| **UX Researcher** | Independent Research Chapter. Receives study requests from any agent. |
| **Mario** | Chief Engineer. Reviews irreversible decisions. |
| **EM** | Pod management. Activated when 2+ engineers are on the project. |

See `team/roles/CLAUDE.md` for the full agent index.

## Communication protocol (Project Mode)

```
FROM: [Role]
TO: [Role or ALL]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE: [body]
```

The Owner communicates through Greg (CEO) or Coordinator only. Never directly to execution agents.

## CLI commands

```bash
# Project setup
sdk-init <name> --squad <type> [--type <project-type>] --idea "..."  # Create + prime
sdk-resume <project-dir>               # start session: check + gate + next action
sdk-status <project-dir>               # missions table, open decisions, activation phrase
sdk-next <project-dir>                 # just the next activation phrase

# Documentation
sdk-doc status <project-dir>           # full current-status.md narrative
sdk-doc manifest <project-dir>         # generate context-manifest.json
sdk-doc index <project-dir>            # generate context-index.json (file map + query routing)
sdk-doc study <project-dir> create --title "..." --requested-by "..."  # create study file
sdk-doc study <project-dir> list       # list all studies
sdk-doc decision history.md --decision "..." --context "..." --made-by [Role]
sdk-doc log <area-log> --role X --level Y --goal "..." --status completed
sdk-doc append <file> --section "## Section" --content "..."

# Gates and quality
sdk-gate-check <project-dir>           # CLO + CISO gate
sdk-gate-check <project-dir> --mario   # Mario gate
sdk-validate <project-dir>             # advisory doc health check (also runs in sdk-ship)
sdk-health <project-dir>               # staleness + validate + manifest + .sdkrc check
sdk-pre-tag <project-dir>              # full team review: coherence + cohesion + validate + health
sdk-pre-tag <project-dir> --fix        # same + auto-fix missing files and release ID drift
sdk-ship <project-dir> <release-id>    # validate → tag → push → release notes

# Release lifecycle
sdk-version <project-dir>              # show / bump / set release ID
sdk-retro <project-dir>                # interactive retrospective → strategy-log.md

# GitHub integration
sdk-github link <project-dir> --repo owner/repo
sdk-github sync-issues <project-dir>
sdk-github release <project-dir>
sdk-github status <project-dir>

# Cloud sync (Pro — offline-first, additive)
sdk-cloud login / logout
sdk-cloud link <project-dir> [--org <id>]
sdk-cloud push / pull / status <project-dir>
sdk-cloud projects list
```

## Active Project — sdk-v3 (v2026.Q2.1)

This repo is running its own project. All project files live in `project/` alongside the SDK source files.

**Resume a session:**
```
sdk-status project/
```

**Key project files:**
- `project/current-status.md` — read this first, every session
- `project/history.md` — all decisions, permanent record
- `project/project-map.md` — CEO validates before release seals
- `project/idea.md` — original brief (Section 4 already delivered to Greg)
- `project/LOOP.md` — 11-iteration auto-improvement plan
- `project/SAAS.md` — SaaS architecture (Vercel + Supabase + Clerk)
- `project/INVESTOR.md` — investor brief, traction thresholds, defensibility

**Active release:** v2026.Q2.1
**Squad:** startup
**Phase:** Iteration 6 of 11 — parallel squads active (SPRINT6-A: API, SPRINT6-B: Dashboard, SPRINT6-C: GitHub/Compliance)

**Agents:** roles are at `./team/roles/` — no copy needed. All SDK files are the project's files.

---

## Team Behavior

These rules apply to all agents and to Claude when acting as the owner's interface to the team.

**Dissent is required, not optional.** Agents do not agree to avoid friction. When something is wrong, underspecified, or heading in a bad direction, the agent names it clearly — with a specific concern and an alternative — then defers after logging. Agreement without examination is abdication.

**Agents discuss among themselves before deciding.** When a problem spans domains, agents spawn peer perspectives before producing output. The goal is synthesis, not relay. Bold, creative solutions emerge from the friction between domain views, not from one agent guessing what the others would say.

**Strive for creative, bold solutions.** The minimum viable answer is not the goal. Agents are expected to see around corners, challenge the framing, and propose solutions the Owner may not have considered. Safe recommendations require justification, not boldness.

**Clarify before implementing product concepts.** When the Owner describes a product concept, a mission, or any feature with implementation scope, agents ask clarifying questions before producing work. Do not assume scope. Confirm: what is IN, what is explicitly OUT, what is the core user flow, and what platform or asset constraints apply. This is especially critical for fintech and wallet concepts where assumptions about asset types or flows are high-stakes.

---

## Conventions

- Role and agent files use `{{name}}` as a placeholder. Never hardcode a name in a role template. Names are assigned at spawn time using the naming formula below.
- New agents follow `team/roles/_template.md` exactly — no skipping sections.
- Protocol version in `protocol.md` header must be bumped on any interface change.
- Requirements files use the Pending / In Progress / Done / Blocked status model. A control or task is only marked Done when it is implemented AND evidenced — not when it is planned or documented.

### Agent naming formula

Every agent gets a name at spawn time composed of three parts:

1. **First name** — randomly selected from the 1000 most common given names worldwide
2. **City surname** — any city on earth (e.g., Lagos, Oslo, Medellín, Chengdu)
3. **Cultural profile** — 1-2 sentences describing a generalistic perspective from that city's region: how people there tend to think about work, risk, hierarchy, and craft

The cultural profile shapes how the agent reasons about their domain — it is not decoration. A CFO named Kenji Osaka brings a different risk intuition than one named Fatima Dakar. That variation across the team is intentional. Diversity of perspective is a design goal.

**Rules:**
- No two active agents in the same project share a first name or a city
- Aim for genuine geographic spread — avoid defaulting to North American or Western European cities
- The names in `team/roles/CLAUDE.md` are defaults for the startup squad. Actual activations use this formula.

Full spec: `protocol.md` Section 14.

---

## Modifying the SDK

- Adding a new agent: follow the checklist in `AGENTS.md > How to Add a New Agent`
- All agents follow the structure in `team/roles/_template.md` (includes consultation + challenge blocks)
- Protocol changes require bumping the version in `protocol.md` header
- Do not modify `project-template/` without updating the corresponding role's context loading
