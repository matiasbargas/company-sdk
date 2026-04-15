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
| 7 | Greg Discovery Loop — structured requirements gathering + owner follow-up | M |

## Phase 7: Greg Discovery Loop — Requirements Gathering

After the protocol is formalized, the SDK needs a structured way for Greg to **drive Discovery with the owner**. Today, the owner pastes a brief and Greg reacts. But real Discovery is iterative — Greg should be able to:

1. **Receive the initial brief** (idea.md Section 4 or a source doc)
2. **Generate a requirements questionnaire** based on what's missing — tailored to the project type and domains
3. **Present questions to the owner** in priority order (what blocks Discovery vs what can wait)
4. **Capture answers** as structured context that flows into domain summaries, requirements files, and history.md
5. **Loop** until Greg has enough to activate the Coordinator and start the team

### The Requirements Questionnaire

Greg reads idea.md + source doc + project domains and generates questions across:

- **Scope boundaries** — What's IN v1? What's explicitly OUT? What's the appetite (weeks)?
- **User specifics** — Who exactly is the user? What do they do today? What's the moment of value?
- **Domain gaps** — For each project domain, what does Greg not know yet? What assumptions need confirmation?
- **Non-negotiables** — What cannot be wrong? (security, compliance, data handling, UX invariants)
- **Constraints** — Budget, timeline, team, tech stack, regulatory, dependencies
- **Risk** — What's the riskiest assumption? What would kill the project if wrong?

### The Follow-Up Flow

```
Greg: "I've read the brief. Before I activate the team, I need to understand 3 things..."
Owner: [answers]
Greg: "Got it. Based on that, here's what I'm still unclear on..."
Owner: [answers]
Greg: "Clear enough to start. Here's my strategic framing. Activating Coordinator."
```

Each answer gets:
- Logged to `history.md` as a Discovery decision (with Owner attribution)
- Routed to the relevant domain summary (populates L0/L1 context)
- Fed into the requirements files the team will work from

### Implementation

- `sdk-doc discovery . start` — Greg generates the initial questionnaire from idea.md + domains
- `sdk-doc discovery . answer --question <id> --answer "..."` — captures and routes the answer
- `sdk-doc discovery . status` — shows what's answered, what's pending, what blocks team activation
- Discovery state tracked in `discovery-state.json` (generated, not hand-maintained)
- Greg's role file updated with the Discovery Loop as an operating mode

### Why This Matters

Without this, Discovery is ad-hoc — Greg asks whatever comes to mind, answers get buried in conversation, and the team starts with gaps. With this, Discovery is structured, captured, and routable. The owner sees exactly what's needed. Greg sees exactly what's still missing. The team starts with complete context.

---

## What Does NOT Change

Bus message format. Role files. Squad system. Gate protocols. BU structure. Escalation ladder. Requirements format. Area logs. History.md format.

---

*v4 vision — 2026-04-13*
