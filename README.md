# company-sdk

> You've always needed a team. Now you have one.

company-sdk is a [Claude Code](https://claude.ai/code) extension. You scaffold a project with the CLI, open it in Claude Code, and your team is already there — structured, role-aware, and ready to work.

---

Most AI agent frameworks give you faster outputs. This one gives you a team.

20+ role-based agents — CEO, CLO, CISO, CTO, CFO, CMO, PM, Designer, Engineers — that work together from idea to shipped product. Each has a defined scope of authority, a skill level, a cultural profile, and a protocol they all share. They push back when something is wrong. They log every decision with the reasoning intact. They remember what happened last sprint.

---

## Two modes

**Project Mode** — activate a full team for a specific build. Discovery to Execution to Ship. Every decision logged. Every gate enforced. Git-native: commits, tags, and releases are events the framework reads and responds to.

**Consultation Mode** — ask any specialist a standalone question. The agent spawns peer consultations to pressure-test its answer before responding. You get synthesis, not a raw output.

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

---

## What makes this different

**Legal and security review happen before architecture begins.** Machine-enforced. The CTO cannot activate until CLO and CISO have delivered. Not as a retrofit. Not as a checklist. As a gate the framework won't let you skip. This is the only framework where those reviews happen at the right time.

**Agents that dissent.** Every agent has a professional obligation to push back when something is wrong or heading in a bad direction. An agent that only agrees isn't useful — it's a liability. The friction is the feature.

**Memory that outlives the conversation.** Every consequential decision is written to `history.md` — what was decided, why, who approved it, whether it's reversible. Six months after shipping, you can explain every call. `history.md` answers the audit question before the audit happens.

**A team with real diversity.** Every agent gets a name composed of a globally common first name, a city surname, and a cultural profile from that region. Fatima Nairobi and Yuki Kampala are not the same agent — they approach risk differently, weight evidence differently, reason about time differently. That friction between perspectives is how monoculture failures get caught before they ship.

**Levels that mean something.** A CLO at M3 owns domain strategy and escalates cross-domain conflicts. A Staff Engineer at L4 owns interface contracts. An IC at L2 executes tickets within known constraints. Agents don't play above their level. When work outgrows the level, the Owner promotes explicitly.

---

## How a project runs

```
Phase 1  — CEO · CLO · CISO · CFO · CMO · PM (parallel)
              ↓
         CLO + CISO gate must clear before CTO activates
              ↓
Phase 2  — CTO · Mario (irreversible decision review) · Designer · Staff Engineer · EM
              ↓
         Mario gate must clear before Sprint 1
              ↓
Phase 3  — Liaison activates · Engineers execute per ticket
              ↓
Phase 4  — Area logs written · PM seals kanban · CEO validates · Coordinator seals release
```

---

## Quick start

**1. Scaffold the project**
```bash
npm install -g company-sdk
sdk-init my-saas --squad startup --idea "your raw idea here"
```

**2. Open it in Claude Code**
```bash
claude my-saas
```

The project CLAUDE.md loads automatically. Every agent definition, protocol rule, and file reference is already wired in.

**3. Activate the team**
```
Hey Greg — here's the brief: [paste from idea.md Section 4]
```

Greg kicks off Discovery. The Coordinator routes the team. The protocol handles the rest.

**Resuming a session:**
```
sdk-doc manifest .    # structured JSON: active missions, blockers, next agent
sdk-doc status .      # full narrative: current-status.md
```

---

## Squads

| Squad | Agents | Best for |
|---|---|---|
| `startup` | 20+ | New product — legal, security, finance, and market context before you write a line of code |
| `mvp` | 10 | Move lean, add coverage later |
| `feature` | 3 | Scoped feature on an existing product |
| `website` | 6 | Landing page or marketing surface |

---

## CLI

```bash
sdk-init <name> [--squad <type>] [--idea "..."]   # scaffold + prime the team
sdk-doc manifest <project-dir>                     # generate context-manifest.json
sdk-doc status <project-dir>                       # print current-status.md
sdk-doc decision history.md --decision "..." --context "..." --made-by [Role]
sdk-doc spawn <project-dir> --name "..." --role ... --level ...
sdk-doc dissolve <project-dir> --name "..." --dissolved-by "..." --reason "..."
sdk-gate-check <project-dir>                       # verify CLO + CISO gate before CTO
```

---

## Who it's for

Founders, technical leads, and senior engineers building products in 1–10 person teams. Especially useful in regulated industries — fintech, healthtech, legaltech — where compliance is architecture, not a checklist.

If you want a team that remembers why every decision was made, dissents when direction is wrong, and leaves you more capable instead of more dependent: this is that.

---

*company-sdk — 20+ roles · 4 squads · protocol v3.4 · CLI*
