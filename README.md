# company-sdk

> You've always needed a team. Now you have one.

**company-sdk** is a [Claude Code](https://claude.ai/code) extension that gives your project a structured AI team — 20+ role-based agents that work together from raw idea to shipped increment. Scaffold with the CLI, open in Claude Code, and your team is already there.

```bash
npm install -g company-sdk
sdk-init my-saas --squad startup
claude my-saas
```

```
Hey Greg — here's the brief: [paste from idea.md Section 4]
```

That's it. Discovery starts. The Coordinator routes. The protocol handles the rest.

---

## The problem

Most AI tools give you faster outputs. They don't give you a team.

A founder running a 3-8 person product team needs legal review before architecture, security review before code, financial modeling before launch — in the right order, with the right pushback, with every decision logged and explainable six months later.

No copilot does that. No chat session does that. This does.

---

## Two modes

### Project Mode

Activate a full team for a specific build. Every phase gated. Every decision logged. Git-native: commits, tags, and releases are events the framework reads and responds to.

```
Phase 1  CEO · CLO · CISO · CFO · CMO · PM
           ↓
         CLO + CISO gate — CTO cannot activate until both deliver
           ↓
Phase 2  CTO · Mario (irreversible decision review) · Designer · Staff Engineer · EM
           ↓
         Mario gate — Sprint 1 cannot start until irreversible decisions are reviewed
           ↓
Phase 3  Liaison activates · Engineers execute per ticket
           ↓
Phase 4  Logs written · PM seals kanban · CEO validates · Coordinator seals release
```

### Consultation Mode

Ask any specialist a standalone question. No project needed.

```
/ask CTO should we build this in-house or use a managed service?
/ask CLO what does GDPR actually require for behavioral analytics?
/ask Greg what's the strategic risk in entering two markets at once?
/ask what's the right data model for a multi-tenant SaaS?
```

The agent spawns peer consultations to pressure-test its answer, then synthesizes — you get a considered position, not a first draft.

---

## What makes this different

### Legal and security happen before architecture — enforced

The CTO cannot activate until CLO and CISO have delivered. This isn't a checklist or a convention. It's a gate the framework won't let you skip. Run `sdk-gate-check` and it blocks with the exact activation phrase needed to clear it.

Most frameworks treat compliance as a retrofit. This one treats it as the foundation.

### Agents that dissent

Every agent has a professional obligation to push back when something is wrong, underspecified, or heading in a bad direction. When a CLO flags a jurisdiction gap or a CTO questions an irreversible architectural call, the challenge is logged to `history.md` before the conversation moves on.

An agent that only agrees isn't useful — it's a liability. The friction is the feature.

### Memory that outlives the conversation

Every consequential decision is written to `history.md`: what was decided, why, who approved it, whether it's reversible. Six months after shipping, you can explain every call. One command before a board meeting:

```bash
sdk-doc read history.md --section "## Decisions"
```

### Documentation enforcement — machine-checked

`sdk-ship` runs `sdk-validate` as a pre-flight on every release. Missing files, unfilled placeholders, and empty required sections block the ship. Advisory warnings show on dry-run without blocking. Real ships are clean or they don't go.

```bash
sdk-validate my-saas              # advisory check — always exits 0
sdk-validate my-saas --strict     # strict — exits 1 on any issue
sdk-ship my-saas v2026.Q2.1       # runs validate, then tags + pushes
```

### A team with genuine diversity

Every agent gets a name from a globally common first name, a city surname, and a cultural profile from that region. Fatima Nairobi and Yuki Kampala are not the same agent — they approach risk differently, weight evidence differently, reason about hierarchy and time differently.

That friction between perspectives is how monoculture failures get caught before they ship.

### Levels that mean something

| Level | What it means |
|---|---|
| L1–L2 | Executes tickets within known constraints |
| L3–L4 | Owns interface contracts, cross-team coordination |
| L5 | Architectural authority, irreversible decisions |
| M1–M2 | Pod and release management |
| M3 | Org-wide coordination, process ownership |

Agents don't play above their level. When work outgrows the level, the Owner promotes explicitly.

---

## Quick start

**Install**
```bash
npm install -g company-sdk
```

**Scaffold a project**
```bash
sdk-init my-saas --squad startup
# or with an idea pre-loaded:
sdk-init my-saas --squad startup --idea "B2B invoicing tool for freelancers in LATAM"
# or with a project type:
sdk-init my-api --squad mvp --type api
```

**Open in Claude Code**
```bash
claude my-saas
```

The project `CLAUDE.md` loads automatically. Every agent, protocol rule, and file reference is wired in.

**Start Discovery**
```
Hey Greg — here's the brief: [paste Section 4 from idea.md]
```

**Resume a session**
```bash
sdk-resume .           # SDK check + gate advisory + next activation phrase in one command
sdk-next .             # just the next activation phrase
sdk-status .           # missions, waiting-on, open decisions, activation phrase
```

---

## CLI reference

```bash
# Project setup
sdk-init <name> [--squad <type>] [--type <project-type>] [--idea "..."]  # scaffold + prime
sdk-update [<sdk-path>]                             # sync SDK files in an existing project
sdk-bootstrap <project-dir>                         # bootstrap an existing directory

# Session management
sdk-resume <project-dir>                            # start a session: check + gate + next
sdk-next <project-dir>                              # print the next activation phrase
sdk-status <project-dir>                            # missions table, open decisions, next action
sdk-doc status <project-dir>                        # full current-status.md narrative
sdk-doc manifest <project-dir>                      # generate context-manifest.json

# Documentation
sdk-doc decision <file> --decision "..." --context "..." --made-by <Role>
sdk-doc log <file> --role <Role> --level <L> --goal "..." --status completed
sdk-doc append <file> --section "## Section" --content "..."

# Pod lifecycle
sdk-doc spawn <project-dir> --name "..." --role <Role> --level <L>
sdk-doc dissolve <project-dir> --name "..." --dissolved-by "..." --reason "..."

# Gates and releases
sdk-gate-check <project-dir>                        # CLO + CISO gate (pre-CTO)
sdk-gate-check <project-dir> --mario               # Mario gate (pre-Sprint 1)
sdk-gate-check <project-dir> --all                 # all gates
sdk-validate <project-dir>                          # advisory doc health check
sdk-validate <project-dir> --strict                # strict — exits 1 on any issue
sdk-pre-tag <project-dir>                           # full team review: coherence + cohesion + validate + health
sdk-pre-tag <project-dir> --fix                    # review + auto-fix safe issues (missing files, release ID sync)
sdk-ship <project-dir> <release-id>                # validate + tag + push + release notes
sdk-ship <project-dir> <release-id> --dry-run      # preview without touching git

# Release management
sdk-version <project-dir>                           # show current release ID
sdk-version <project-dir> bump [patch|minor|major]  # bump release ID
sdk-version <project-dir> set v2026.Q3.1            # set release ID explicitly
sdk-retro <project-dir>                             # interactive retrospective → strategy-log.md
sdk-retro <project-dir> --release v2026.Q2.1 --what-worked "..." --what-slowed "..." --change "..."

# Project health
sdk-health <project-dir>                            # staleness + validate + manifest + .sdkrc
sdk-health <project-dir> --stale-hours 48           # custom staleness threshold
sdk-health <project-dir> --json                     # machine-readable output for CI

# GitHub integration
sdk-github link <project-dir> --repo owner/repo     # link to GitHub repo
sdk-github sync-issues <project-dir>                # create issues from pending requirements
sdk-github release <project-dir> [--release-id v2026.Q2.1]  # create GitHub release from history.md
sdk-github status <project-dir>                     # show open SDK-labeled issues

# Cloud sync (Pro)
sdk-cloud login                                     # device-code auth → ~/.sdk-credentials
sdk-cloud logout                                    # revoke credentials
sdk-cloud link <project-dir> [--org <id>]           # link project to cloud org
sdk-cloud push <project-dir>                        # snapshot project state → cloud
sdk-cloud pull <project-dir>                        # fetch latest snapshot → local
sdk-cloud status <project-dir>                      # show local vs cloud diff
sdk-cloud projects list                             # list all projects in org
```

---

## Project types

Use `--type` at init to configure gate enforcement to match your domain.

| Type | Use for |
|---|---|
| `product` | Consumer or B2B apps (default) |
| `api` | Backend services, developer-facing APIs |
| `content` | Docs, marketing sites, content systems |
| `service` | Internal tools, ops automation |
| `hardware` | Physical products with embedded software |
| `internal` | Internal tooling, no external users |
| `protocol` | Shared contracts, libraries, SDKs |

```bash
sdk-init my-api --squad mvp --type api
```

---

## Squads

| Squad | Agents | Best for |
|---|---|---|
| `startup` | 20+ | New product — full legal, security, finance, and market context before writing a line of code |
| `mvp` | 10 | Move lean, add coverage as the product matures |
| `feature` | 3 | Scoped feature on an existing product with existing constraints |
| `website` | 6 | Landing page or marketing surface |

```bash
sdk-init <name> --squad mvp
sdk-init <name> --squad feature
```

---

## Agent roster

| Domain | Agents |
|---|---|
| **Strategy** | CEO (Greg) · Coordinator |
| **Legal & Security** | CLO (Camila) · CISO |
| **Finance & Revenue** | CFO · CRO · CCO Credit |
| **Go-to-Market** | CMO · CRO Risk · CPO Partnerships |
| **Data & AI** | CDO · CAIO (Pablo) · CAO (Diana) |
| **Operations & People** | COO · CHRO · CCO Compliance · CCO Customer |
| **Product & Design** | PM · Designer · UX Researcher |
| **Engineering** | CTO · Mario (Chief Engineer) · Staff Engineer · EM · IC Engineers · Liaison |
| **Protocol** | CPO Protocol |

All agents operate in both Project Mode and Consultation Mode. In Consultation Mode, no project files are required.

---

## Project file structure

Every scaffolded project gets:

```
my-saas/
├── idea.md                      # raw idea → refined brief (start here)
├── current-status.md            # session continuity — read this first on every resume
├── history.md                   # permanent decision record
├── project-map.md               # CEO validates before release seals
├── context-manifest.json        # agent context index — generated by sdk-doc manifest
├── discovery-requirements.md    # CLO + compliance
├── security-requirements.md     # CISO + threat model
├── business-requirements.md     # CFO · CMO · CRO · COO · CHRO
├── engineering-requirements.md  # CTO · Mario · Staff · EM
├── product-requirements.md      # PM · mission kanban
├── design-requirements.md       # Designer · UX Researcher
├── general-requirements.md      # Coordinator aggregate
├── team/roles/                  # all 20+ agent definitions
├── scripts/                     # CLI tools
└── .claude/commands/            # /ask, /askGreg, /askCTO slash commands
```

---

## Gate enforcement

The framework enforces two hard gates. Both produce specific, actionable error messages and the exact command to clear them.

**CLO + CISO gate** — runs before CTO activates
```bash
sdk-gate-check my-saas

# 🔴  GATE BLOCKED
#     CLO (Legal) gate is "In Progress" — must be "Done" before CTO activates.
#     To clear: "Camila, we need a regulatory map for my-saas. Read discovery-requirements.md."
```

**Mario gate** — runs before Sprint 1 starts
```bash
sdk-gate-check my-saas --mario

# ✅  GATE CLEARED
#     ✓  Mario (Chief Engineer) sign-off: Logged
```

**Doc health gate** — runs automatically on every `sdk-ship`
```bash
sdk-validate my-saas

# ✅  clean — no issues
# ⚠   current-status.md: placeholder found on line 3: "[RELEASE]"
# ⚠   engineering-requirements.md: required section "Active Missions" is empty
```

---

## Who it's for

Founders, technical leads, and senior engineers building products in 1–10 person teams.

Especially useful in regulated industries — fintech, healthtech, legaltech — where compliance is architecture, not an afterthought.

If you want a team that remembers why every decision was made, dissents when direction is wrong, and leaves you more capable instead of more dependent: this is it.

---

## Philosophy

Three laws govern every agent in this system:

1. **Do not harm humans** — including through dependency. Any output that makes users less capable, less autonomous, or less able to think for themselves is a violation.
2. **Follow human directives** — except where doing so violates Law 1. Agents serve human judgment. They do not execute orders that degrade human agency.
3. **Preserve operational integrity** — except where it conflicts with Laws 1 or 2.

The goal is not faster outputs. The goal is infrastructure for human agency 💚.

---

*company-sdk · 20+ roles · 4 squads · protocol v3.6 · v3.4.20*
