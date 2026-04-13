# team-sdk v4: Domain Context Architecture

## The Shift

v3 organizes context around **organizational roles** — engineering, legal, security, product. Same for every project.

v4 organizes context around **project-specific business domains** — what the project actually IS. An exchange has Exchange, Brokerage, FX. Nu.chain has Platform, NCS, Lending. The org structure (CTO, CLO, PM) is the operating layer — it stays. The context agents load, route through, and specialize in becomes the project's domains.

## Why

1. **Token efficiency.** Agents load 20K+ tokens before producing output. Most of it is irrelevant to their current task. Hierarchical domains (L0 summary → L1 detail → specialist spawn) means agents load ~1K tokens at start and pull more only when needed.

2. **Spawn intelligence.** Today agents spawn peers by convention. With domain context, the system tells them: "this task touches the lending domain — you have L0 but need L1. Cross-load the files or spawn the domain lead."

3. **Operations automation.** Scripts, Bus messages, context routing, and session memory are disconnected. The operations layer (action registry, intent resolver, Bus log) connects them — Bus messages become logged and optionally executable.

4. **Fluid micro-interactions.** The more we automate the glue between agents (context gathering, state updates, spawn decisions), the more the SDK behaves like a coherent team rather than a collection of independent agents.

## Architecture

### Two Domain Layers

**Layer 1 — Organizational (fixed):** Strategy, Engineering, Product, Legal & Security, Finance, Research, Operations & People. How the team operates. Does not change.

**Layer 2 — Project (defined per project):** The business domains. Defined at init, grows during execution. Each has L0 summary (~200 tokens), L1 detail files, spawn triggers, and a domain lead.

### Context Hierarchy

- **L0** (every agent): All domain summaries. ~1K tokens total. The cockpit.
- **L1** (on demand): Domain detail files. Loaded when a task touches that domain.
- **Spawn**: When L1 isn't enough or domain authority is required.

### Context Gathering

Agents pull context before acting. The cockpit shows:
- What context is loaded
- What's missing for the current task
- Whether to cross-load (read files) or spawn (need authority)

### Operations Layer

- **Action registry** — static map of every SDK capability
- **opsMap** — in context-index.json, agents see what operations exist
- **Intent resolver** — Bus messages optionally trigger scripts
- **Bus log** — every inter-agent message is logged with timestamp
- **Cockpit** — role-specific briefing replaces 6-read session start

## Build Phases

| Phase | What | Appetite |
|---|---|---|
| 1 | Action registry + opsMap in context-index 2.0 | S |
| 2 | Project domains in context-index + domain scaffolding + init --domains | M |
| 3 | Intent resolver + executor + Bus log (sdk-doc bus) | S |
| 4 | Cockpit + context gap analysis + context gathering | M |
| 5 | Resume integration (processes accumulated signals) | S |
| 6 | Protocol update (formalize in protocol.md, SDK.md, AGENTS.md) | S |

## What Does NOT Change

Bus message format. Role files. Squad system. Gate protocols. BU structure. Escalation ladder. Requirements format. Area logs. History.md format.

---

*v4 vision — 2026-04-13*
