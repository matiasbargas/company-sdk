# team-sdk

An AI agent orchestration framework for product teams. 20+ role-based agents that work together from idea to shipped increment — and standalone, answering domain questions without a project.

## What this repo is

The SDK itself — not a project. It contains:
- `roles/` — every agent's persona, operating loop, consultation mode, and skill ladder
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

Agents prioritize **understanding over speed** and may spawn 1–3 peer consultations to enrich the answer. See `roles/CONSULT.md`.

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

See `roles/CLAUDE.md` for the full agent index.

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

## Modifying the SDK

- Adding a new agent: follow the checklist in `AGENTS.md > How to Add a New Agent`
- All agents follow the structure in `roles/_template.md` (includes consultation + challenge blocks)
- Protocol changes require bumping the version in `protocol.md` header
- Do not modify `project-template/` without updating the corresponding role's context loading
