# Squad: Feature

> **Use this squad when:** You are adding a specific feature to an existing product.
> **Size:** Small (3–5 roles, single sprint scope)
> **Roles:** 3–5 activated
> **Protocol:** Same `protocol.md` — same Bus format, same escalation ladder, same requirements files.

---

## Purpose

A minimal squad for delivering a single, well-scoped feature. No discovery phase — assumes the product exists, the team exists, and the feature has an owner. Activates PM (for scope), EM (for delivery), and Liaison (for communication). Staff Engineer is optional if the feature touches platform primitives.

## When to Use

- ✅ Adding a feature to an existing product
- ✅ Feature is well-scoped and < 1 sprint
- ✅ Existing team already has context on the product
- ❌ Feature requires new platform primitives → add Staff Engineer and get contract review
- ❌ Feature requires regulatory or security decisions → activate CISO/CLO first
- ❌ Feature is ambiguous or requires discovery → use MVP or Startup squad

---

## Activation Sequence

### Phase 0 — Brief
| # | Role | Output |
|---|------|--------|
| 1 | PM | Feature brief: user story, acceptance criteria, success metric, scope boundary |

### Phase 1 — Plan
| # | Role | Output |
|---|------|--------|
| 2 | Staff Engineer _(if platform touches)_ | Interface contract or confirmation that no contract changes required |
| 3 | EM | Sprint plan: task breakdown, cell assignment, critical path, estimated duration |

### Phase 2 — Execution
| # | Role | Output |
|---|------|--------|
| 4 | Liaison | Routes blockers and decisions; updates `liaison-log.md` |
| 5 | EM + Cell | Implementation, PR reviews, testing |

### Phase 3 — Completion
| # | Role | Output |
|---|------|--------|
| 6 | PM | Acceptance review against feature brief |
| 7 | Coordinator _(lightweight)_ | Decision log entry if any consequential decisions were made |

---

## Role Roster

| Role | Level | Required | Owns |
|------|-------|----------|------|
| PM | L4 | ✅ | Feature scope, acceptance criteria |
| EM | M1 | ✅ | Sprint delivery, task breakdown |
| Liaison | L4 | ✅ | Communication, `liaison-log.md` |
| Staff Engineer | L4 | ⚡ if platform touch | Interface contract |
| Coordinator | M3 | ⚡ if decisions needed | Decision logging |

---

## Success Criteria

- [ ] Feature ships within sprint
- [ ] Acceptance criteria all met
- [ ] No regressions in adjacent features
- [ ] Any consequential decisions logged to `history.md`

---

## Example Projects

- Adding dark mode to a web app
- Building a CSV export feature
- Implementing OAuth login
- Adding a notification system
