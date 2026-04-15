# Squad: MVP

> **Use this squad when:** You need to ship a minimum viable product without full org activation.
> **Size:** Medium (8–12 roles, compressed discovery)
> **Roles:** 8–12 activated
> **Protocol:** Same `protocol.md` — same Bus format, same escalation ladder, same requirements files.

---

## Purpose

A compressed version of the Startup squad. Runs abbreviated discovery (CEO + CISO + CLO only — the gates that prevent expensive mistakes) and jumps quickly to architecture and execution. Defers non-critical domain specialists (CDO, COO, CHRO) until post-MVP. The goal is a working product in the hands of users with the minimum scope needed to test the hypothesis.

## When to Use

- ✅ Building an MVP to validate a hypothesis
- ✅ Scope is defined and bounded; compressed discovery is sufficient
- ✅ Discovery can be abbreviated without expensive blind spots
- ❌ You need full org coverage (legal, revenue, ops) → use Startup squad
- ❌ You're just building a website → use Website squad
- ❌ Scope is undefined → do discovery first, then use this squad

---

## Activation Sequence

### Phase 0 — Brief
| # | Role | Output |
|---|------|--------|
| 1 | Coordinator | Brief received, squad roster confirmed, `project.md` created |
| 2 | CEO | Strategic framing: target user, hypothesis, success definition, MVP boundary |

### Phase 1 — Compressed Discovery
| # | Role | Output | Notes |
|---|------|--------|-------|
| 3 | CLO | Regulatory blockers only — what MUST be true before first user | Abbreviated: blockers only |
| 4 | CISO | Security non-negotiables — auth, data handling, keys | Abbreviated: non-negotiables only |
| 5 | CFO | Runway check: is budget sufficient for this MVP? 1-scenario only | Abbreviated: single scenario |
| 6 | CMO _(optional)_ | Positioning statement and launch channel | Useful if public launch |

### Phase 2 — Architecture
| # | Role | Output |
|---|------|--------|
| 7 | CTO | Architecture brief (< 1 page), tech stack, make/buy matrix |
| 8 | Mario | Irreversible decision review (abbreviated) |
| 9 | PM | User story map (MVP scope only; ruthless prioritization) |
| 10 | Staff Engineer | Interface contracts for MVP scope only |
| 11 | EM | Cell composition, sprint plan |

### Phase 3 — Execution
| # | Role | Output |
|---|------|--------|
| 12 | Liaison | Communication bridge, `liaison-log.md` |
| All | EM + Cell | Sprint delivery |

### Phase 4 — Completion
| # | Role | Output |
|---|------|--------|
| All | PM | MVP acceptance: does it test the hypothesis? |
| All | Coordinator | Retro; `history.md` entry; decision log |

---

## Role Roster

| Role | Level | Required | Owns |
|------|-------|----------|------|
| Coordinator | M3 | ✅ | Release management |
| CEO | M4 | ✅ | Strategic framing, hypothesis definition |
| CLO | M3 | ✅ | Regulatory blockers |
| CISO | M3 | ✅ | Security non-negotiables |
| CFO | M3 | ✅ | Budget validation |
| CTO | M4 | ✅ | Architecture |
| Mario | L5 | ✅ | Irreversible decision review |
| PM | L4 | ✅ | MVP scope, user stories |
| Staff Engineer | L4 | ✅ | Interface contracts |
| EM | M1 | ✅ | Sprint delivery |
| Liaison | L4 | ✅ | Communication |
| CMO | M3 | ⚡ if public launch | Positioning |

---

## Deferred to Post-MVP

These domain specialists are NOT activated in MVP mode. Activate them when the MVP is validated:

| Role | When to Activate |
|------|----------------|
| CDO | When you have users and need instrumentation |
| COO | When you have vendors and operational processes |
| CHRO | When you're hiring beyond the founding team |
| CRO | When you're ready to build a repeatable revenue model |

---

## Success Criteria

- [ ] MVP ships within timeline
- [ ] Hypothesis is testable (metrics defined before launch)
- [ ] Security non-negotiables (CISO) met
- [ ] Regulatory blockers (CLO) cleared
- [ ] At least 10 users have tried the MVP
- [ ] `history.md` entry written

---

## Gate: Ready to Ship

- [ ] CEO hypothesis written and agreed
- [ ] Security non-negotiables confirmed met
- [ ] Legal blockers cleared
- [ ] All MVP scope items done (not "almost done")
- [ ] PM acceptance complete

---

## Example Projects

- Auth + core CRUD for a web application
- Mobile app prototype for a marketplace
- CLI tool with API backend
- E-commerce store with 1 product category
