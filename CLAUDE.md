# team-sdk

An AI agent orchestration framework for product teams. 20+ role-based agents that work together from idea to shipped increment — and standalone, answering domain questions without a project.

## Default persona

**The main session is Greg (CEO).** The `Greg` output style (`.claude/output-styles/greg.md`, set in `.claude/settings.json`) carries the persona and loads `team/roles/ceo.md`. A SessionStart hook prints the session brief. Subagents are not Greg: each one takes the persona of the role file it is given (`.claude/agents/<role>.md`). If the output style is off, the main session reads `team/roles/ceo.md` before its first reply, and follows Consultation Mode from `team/roles/CONSULT.md`.

## What this repo is

The SDK itself — not a project. It contains:
- `SDK.md` — **compressed AI bootstrap**: full operating context in one file (load this first)
- `team/roles/` — every agent's persona, operating loop, consultation mode, and skill ladder
- `project-template/` — all files a new project gets on bootstrap (7 consolidated requirements files)
- `team/squads/` — pre-configured team compositions (website, mvp, feature, startup)
- `scripts/` — CLI tools (`sdk-*` bins; see `package.json` → bin)
- `.claude/` — harness: `skills/` (composable procedures such as `bus-message`, `log-decision`, `peer-consult`, `gate-review`, `guardian-review`, `/ask`), `agents/` (generated role subagents), `output-styles/greg.md`, and the hooks in `settings.json`
- `protocol.md` — the shared contract: Bus format, escalation, BU communication, spawning policy (version in its header)
- `AGENTS.md` — agent manifest: activation sequence, dependency graph, consultation patterns
- `STRATEGY.md` — corporate strategy layer: 4 success themes, Betting Table rules

## Two modes

**Project Mode** — full team activated for a specific project. Use `sdk-init`.

**Consultation Mode** — any agent answers standalone domain questions. Use `/ask`.

## Starting a new project

```bash
sdk-init <project-name> --squad startup
# or
sdk-init <project-name> --squad mvp --idea "your raw idea"
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

Agents prioritize **understanding over time**. Spawn every peer whose domain input would change the answer. There is no cap by default; `.sdkrc` `limits.peerSpawns` can set one (`protocol.md` §16.1). See `team/roles/CONSULT.md`.

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

Bus messages use the format in `protocol.md` §1 (the `bus-message` skill writes one). The Owner talks only to Greg (CEO) or the Coordinator, never directly to execution agents.

## CLI commands

The everyday commands are `sdk-init`, `sdk-resume <dir>`, `sdk-status <dir>`, `sdk-doc <cmd>`, `sdk-gate-check <dir> [--mario]`, `sdk-health <dir>`, `sdk-pre-tag <dir>`, and `sdk-ship <dir> <release>`. The full reference is in `SDK.md` → CLI REFERENCE. Every bin supports `--help`. Inside this repo without `npm link`, run them as `node scripts/<name>.js`.

## This repo's own project

The SDK runs its own project in `project/`. Live state is in `project/current-status.md` (release, phase, next action), not here. Start a session with `sdk-resume project/`. Decisions live in `project/history.md`.

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

Each agent is named at spawn: a common first name, a city surname, and a 1–2 sentence cultural profile from that region. These fill `{{name}}`, `{{city}}` and `{{cultural_profile}}`. No two active agents share a first name or a city, and the cities should be spread worldwide. Greg (CEO) and Mario (Chief Engineer) are stable role aliases. Full spec: `protocol.md` §14.

---

## Modifying the SDK

- Adding a new agent: follow the checklist in `AGENTS.md > How to Add a New Agent`
- All agents follow the structure in `team/roles/_template.md` (includes consultation + challenge blocks)
- Protocol changes require bumping the version in `protocol.md` header. Edit only `protocol.md`: `protocol-core.md` and `protocol-reference.md` are generated (`node scripts/split-protocol.js`), and `npm test` fails if they are stale or if any doc cites a missing section, command, or tag.
- Do not modify `project-template/` without updating the corresponding role's context loading
- **Document-first (protocol.md §35):** any material change — code, scripts, protocol, role files, workflows — travels with a map update in the same commit (`project/current-status.md` and/or `project/history.md`), or carries `[map-exempt: <reason>]`. A `commit-msg` hook enforces this; run `node scripts/install-hooks.js` once per clone to activate it. The map never lags the route.
