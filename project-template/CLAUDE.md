# [PROJECT NAME]

Built with team-sdk. This project uses a structured set of AI agents coordinated by a shared protocol.

## Start here — every session

**Step 1 — Generate the context manifest (preferred first command):**

```bash
sdk-doc manifest .
```

This produces `context-manifest.json` — a structured, machine-readable summary of the project state. Load it first. It contains: active release, current phase, active missions, waiting-on items, open decisions, next agent to activate, and a staleness flag.

**Step 2 — If the manifest is absent or you want the full narrative view:**

```bash
sdk-doc status .
```

This prints `current-status.md` directly. Use this as the fallback when `context-manifest.json` does not yet exist (e.g., first session on a new project).

This tells you: active missions, what's waiting, open decisions, next agent to activate.

## How to address agents

| Say this | Gets you |
|---|---|
| "Hey Greg, [question or direction]" | CEO strategic framing, gate reviews, project map validation |
| "Coordinator, [task to route]" | Release management, activation sequencing, retro synthesis |
| "PM, [mission or scope question]" | Mission shaping, kanban, SDD session, friction log |
| "CTO, [architecture question]" | Technical feasibility, make/buy, architecture brief |
| "Hey Mario, [decision to review]" | Irreversible decision review, quality floor, tech debt |
| "Designer, [interface question]" | Interface direction, AI conversation flows, design system, SDD Step 2 |
| "UX Researcher, [user question]" | Research plan, user interviews, insight synthesis, AI log analysis |
| "EM, [sprint or pod question]" | Pod composition, critical path, sprint tickets, status |
| "Liaison, [comms question]" | Sprint health, decision routing, team ↔ leadership translation |
| "[Domain lead], [domain question]" | CLO / CISO / CFO / CMO / CRO / CDO / COO / CHRO |

## Key files

| File | Purpose |
|---|---|
| `current-status.md` | Session continuity — always read first |
| `project.md` | Full conversation record and release plan |
| `history.md` | All consequential decisions and why |
| `idea.md` | Raw idea and brief for Greg (Day 0 document) |
| `general-requirements.md` | Cross-domain requirements status (Coordinator aggregate) |
| `discovery-requirements.md` | CLO + CISO gate — must complete before CTO activates |
| `product-requirements.md` | PM scope, user stories, kanban |
| `engineering-requirements.md` | Architecture, contracts, delivery (CTO · Mario · Staff Eng · EM) |
| `design-requirements.md` | Interface requirements + UX research (Designer · UX Researcher) |
| `business-requirements.md` | Finance, marketing, revenue, data, ops, people |
| `project-map.md` | CEO-validated release artifact (sealed at close) |
| `protocol.md` | Bus format, escalation, mission pod model |
| `AGENTS.md` | Who is active, activation sequence |

## Area logs (write here when things change)

| Area | File | Who writes |
|---|---|---|
| Engineering | `engineering-log.md` | CTO, Mario, Staff Eng, EM |
| Product | `product-log.md` | PM, CMO, CRO, CDO |
| Design | `design-log.md` | Designer, UX Researcher, PM |
| Operations | `operations-log.md` | COO, CLO, CISO, CFO |
| People | `people-log.md` | CHRO, EM |
| Strategy | `strategy-log.md` | CEO, Coordinator |

## CLI commands

```bash
sdk-doc manifest .                                  # Generate context-manifest.json (run first, every session)
sdk-doc status .                                    # Print current-status.md (fallback / full narrative)
sdk-doc log [area]-log.md --role X --level Y --goal "..." --status completed
sdk-doc decision history.md --decision "..." --context "..." --made-by [Role]
sdk-doc pod-update current-status.md --mission "..." --status "..." --next "..."
sdk-doc read [file] --section "## Section"
sdk-doc append [file] --section "## Section" --content "..."
```

## Communication protocol

All agent messages use this format:
```
FROM: [Role]
TO: [Role or ALL]
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
MESSAGE: [body]
```

The Owner speaks to Greg or the Coordinator — never directly to execution agents.

## Release cadence

- v.Q.1 — Discovery build: proves the core loop, no polish
- v.Q.2 — Retention build: makes the loop sticky, instruments everything
- v.Q.3+ — Growth build: multiplies what works, nothing new until core is stable

## Activation sequence (abbreviated)

```
Phase 0:  Coordinator
Phase 1:  Greg → CLO → CISO → CFO → CMO → UX Researcher → PM
Phase 2:  CTO → Mario → Designer → Staff Engineer → EM
Phase 3:  Liaison [Sprint 1 start, stays until ship]
Phase 4:  All write area logs → PM seals kanban → EM dissolves pods
          → Greg validates project-map.md → Coordinator seals
```
