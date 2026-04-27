# Squad: Startup / Company Bootstrap

> **Use this squad when:** You are starting a company or building a full product from scratch.
> **Size:** Large (20+ roles, all phases, full discovery)
> **Roles:** All core + domain roles activated in sequence
> **Protocol:** Same `protocol.md` — same Bus format, same escalation ladder, same requirements files.

---

## Purpose

Full activation of the team-sdk. All agents run in the defined sequence from AGENTS.md. Use this when the scope is a full product or company — not just a website or a feature. This squad runs through all four phases: Brief, Discovery, Release Plan, and Execution.

## When to Use

- ✅ Building a new product from scratch
- ✅ Starting a company and need the full org activated
- ✅ Major pivot requiring a full re-plan across all domains
- ❌ You only need a website → use Website squad
- ❌ You only need one feature → use Feature squad
- ❌ You need a fast, compressed build → use MVP squad

---

## Activation Sequence

Full activation sequence per `AGENTS.md`. Abbreviated here for reference:

### Phase 0 — Brief
| # | Role | Output |
|---|------|--------|
| 1 | Coordinator | Receives Owner brief; creates project structure; opens `project.md` |

### Phase 1 — Discovery
| # | Role | Output | Gates |
|---|------|--------|-------|
| 2 | CEO | Strategic framing brief | Activates all C-suite |
| 3 | CLO | Regulatory map | Gates CTO |
| 4 | CISO | Security non-negotiables | Gates CTO |
| 5 | CFO | Budget validation, runway (3 scenarios) | — |
| 6 | CMO | Market context, positioning statement | — |
| 7 | CRO | GTM model, pricing | — |
| 8 | CDO | Instrumentation plan | — |
| 9 | COO | Vendor timelines | Gates EM |
| 10 | CHRO | Team composition recommendation | — |
| 10b | UX Researcher | Research plan, assumption testing | Parallel |
| 10c | Designer | Design perspective brief, problem framing | Parallel |
| 10d | PM | Mission shaping informed by discovery + design + research | Parallel |

### Phase 2 — Release Plan
| # | Role | Output | Gates |
|---|------|--------|-------|
| 11 | CTO | Architecture brief (1-page max), make/buy matrix | — |
| 12 | Mario | Irreversible decision review | Validates CTO |
| 13 | PM | User story map, scope definition (refined from Phase 1 shaping) | — |
| 14 | Designer | Full interface direction brief | — |
| 15 | Staff Engineer | Interface contracts, platform primitives | — |
| 16 | EM | Cell composition, critical path, sprint plan | — |

### Phase 3 — Execution (Sprint 1 → Ship)
| # | Role | Output |
|---|------|--------|
| 17 | Liaison | Communication bridge (active until ship) |
| All | All execution agents | Domain requirements files continuously updated |

### Phase 4 — Completion
| # | Role | Output |
|---|------|--------|
| All | Coordinator | Retro synthesis; all agents write to `history.md` |

---

## Role Roster

| Role | Level | Layer | Owns |
|------|-------|-------|------|
| Coordinator | M3 | Strategic | Release management, org memory |
| CEO | M4 | Strategic | Company direction, strategic brief |
| CLO | M3 | Domain | Legal, `compliance-requirements.md` |
| CFO | M3 | Domain | Finance, runway, `business-requirements.md` |
| CISO | M3 | Domain | Security, threat model, `compliance-requirements.md` |
| CMO | M3 | Domain | Marketing, positioning, `business-requirements.md` |
| CRO | M3 | Domain | Revenue, GTM, `business-requirements.md` |
| CDO | M3 | Domain | Data, instrumentation, `business-requirements.md` |
| COO | M3 | Domain | Operations, vendors, `business-requirements.md` |
| CHRO | M3 | Domain | People, hiring, `business-requirements.md` |
| CTO | M4 | Execution | Architecture, `engineering-requirements.md` |
| Mario | L5 | Execution | Quality floor, `engineering-requirements.md` |
| UX Researcher | L3 | Research | Studies, assumption testing, `research-requirements.md` |
| Designer | L3 | Design | Interface direction, design system, `design-requirements.md` |
| PM | L4 | Execution | Scope, stories, `product-requirements.md` |
| Staff Engineer | L4 | Execution | Contracts, platform, `engineering-requirements.md` |
| EM | M1 | Execution | Delivery, cells, `engineering-requirements.md` |
| Liaison | L4 | Execution | Communication, `liaison-log.md` |

---

## Sprint 0 Gate (Hard Stop)

All of the following must be true before engineering starts:

- [ ] CEO brief written
- [ ] Regulatory map (CLO) complete
- [ ] Security non-negotiables (CISO) documented
- [ ] Budget validated (CFO), runway > 12 months (or decision made)
- [ ] Market context (CMO) written
- [ ] GTM model (CRO) defined
- [ ] Instrumentation plan (CDO) drafted
- [ ] Vendor timelines (COO) mapped
- [ ] Team composition (CHRO) confirmed
- [ ] Research plan (UX Researcher) drafted
- [ ] Design perspective brief (Designer) written
- [ ] Mission shaping (PM) complete
- [ ] Architecture brief (CTO) written, 1-page max
- [ ] Irreversible decisions reviewed (Mario)
- [ ] User story map (PM) refined
- [ ] Interface direction brief (Designer) complete
- [ ] Interface contracts (Staff Engineer) drafted
- [ ] Cell composition (EM) confirmed
- [ ] Coordinator confirms Sprint 0 gate passed

---

## Success Criteria

- [ ] All Sprint 0 gate items complete
- [ ] First sprint shipped with defined acceptance criteria
- [ ] All domain requirements files active and current
- [ ] `history.md` entry written for Sprint 0

---

## Example Projects

- Building a B2B product from scratch
- Launching a fintech product (CLO + CISO are critical gates)
- Starting an e-commerce company
- Bootstrapping a developer tool with full org activation
