# team-sdk

An AI agent orchestration framework for product teams. 20+ role-based agents that work together from idea to shipped increment — and standalone, answering domain questions without a project.

## What this repo is

The SDK itself — not a project. It contains:
- `team/roles/` — every agent's persona, operating loop, consultation mode, and skill ladder
- `project-template/` — all files a new project gets on bootstrap (5 requirements files, not 18)
- `squads/` — pre-configured team compositions (website, mvp, feature, startup)
- `scripts/` — CLI tools (init, bootstrap, squad, doc)
- `protocol.md` — the shared contract: Bus format, escalation, spawning policy (v3.3)
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

Agents prioritize **understanding over speed** and may spawn 1–3 peer consultations to enrich the answer. See `team/roles/CONSULT.md`.

## Key agents

| Agent | How to activate |
|---|---|
| **Greg (CEO)** | "Hey Greg, [brief]" — starts Discovery, or `/ask Greg` |
| **Coordinator** | Routes everything. Activated by CEO after brief. |
| **PM** | Mission shaping. Activated during Phase 2. |
| **CTO** | Architecture. Activated after CLO + CISO gate. Or `/ask CTO` |
| **Designer** | Interface direction. Activated in Phase 2 or when a pod forms. |
| **UX Researcher** | User insights. Activated in Phase 1 alongside PM. |
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
node scripts/init.js <name> --squad <type> --idea "..."   # Create + prime a new project
node scripts/doc.js status <project-dir>                  # Resume from where you left off
node scripts/doc.js log <area-log> --role X --level Y --goal "..." --status completed
node scripts/doc.js decision history.md --decision "..." --context "..." --made-by [Role]
node scripts/doc.js read <file> --section "## Section"
node scripts/doc.js append <file> --section "## Section" --content "..."
```

## Active Project — sdk-v3 (v2026.Q2.1)

This repo is running its own project. All project files live in `project/` alongside the SDK source files.

**Resume a session:**
```
node scripts/doc.js status project/
```

**Key project files:**
- `project/current-status.md` — read this first, every session
- `project/history.md` — all decisions, permanent record
- `project/project-map.md` — CEO validates before release seals
- `project/idea.md` — original brief (Section 4 already delivered to Greg)

**Active release:** v2026.Q2.1
**Squad:** startup
**Phase:** Phase 2 — CTO architecture brief delivered. Mario irreversible decision review next. CLO + CISO gates cleared.

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
