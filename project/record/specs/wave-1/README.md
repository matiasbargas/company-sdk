# Wave 1 Specs — Framing Challenge Infrastructure

**Protocol version:** 4.1 → 4.2
**Sprint scope:** 4 deliverables, ~5 days
**Goal:** Give the Owner the kill verb, the challenge surface, and the pre-mortem gate. Ship the behavior change, not the polish.

---

## Deliverables

| # | Spec | What it does | Effort |
|---|------|-------------|--------|
| 01 | [Kill Log](01-kill-log.md) | `/kill` command + cross-project Kill Log with kill_class | 1.5 days |
| 02 | [Negative Scope](02-negative-scope.md) | Mandatory "Explicit Non-Goals" on every gate-crossing artifact | 0.5 day |
| 03 | [Pre-Mortem Gate](03-pre-mortem.md) | Phase 2.5 gate — team writes the failure post-mortem before Sprint 1 | 1 day |
| 04 | [TAG Field](04-tag-field.md) | TAG metadata on Bus messages + FRAMING-CHALLENGE pattern | 1 day |
| 05 | [Design Principle](05-design-principle.md) | "Domains get agents, constraints get protocol fields" encoded in protocol | 0.5 day |

**Total:** ~4.5 days

---

## Key Design Decisions

1. **Kill Log is cross-project** (`~/.claude/kill-log.md`), not per-project. The judgment corpus compounds across projects. Per-project kills also logged to `history.md` for local context.

2. **kill_class is mandatory.** `FRAMING_WRONG | SCOPE_OBSOLETE | PRIORITY_SHIFT | EXECUTION_STALLED`. Only `FRAMING_WRONG` feeds the cross-project judgment corpus.

3. **Projects are disposable by default.** The cross-project Kill Log and (future) disagreement log are the compounding assets. Per-project history is local context.

4. **TAG field, not new message type.** Keeps the priority gradient clean. Tags express semantic intent; the intent resolver pattern-matches.

5. **Pre-mortem is multi-role.** PM + CTO/Staff Eng + EM write independently, then synthesize. Prevents groupthink in the failure analysis.

6. **No approval chain for Owner kills.** Agent-initiated kills require Owner confirmation.

---

## What's NOT in Wave 1

Deferred to Wave 1.5:
- Rename pass (roles named by verb: Framer, Reviewer, Architect)
- Default squad → MVP
- Near-miss log in Mario's review template
- Priority Constraints rename (Laws → Override Hierarchy)
- COST_SIGNAL / TIME_SIGNAL Bus fields
- SOLUTION_CLASS enforcement in `sdk-doc bus`

Deferred to Wave 2:
- Redesigned `sdk-status` (framing-first view)
- Structured disagreement log schema
- Structured decision entries in history.md (YAML frontmatter)

Deferred to Wave 3:
- `sdk-doc history --query` (the read path)
- `sdk-health --framing-drift` detector
- Conflict detection on new decisions
- Mission types (non-software work routing)

---

## Implementation Order

1. **TAG field** (04) — protocol change that other specs reference
2. **Kill Log** (01) — the atomic unit of the redesign
3. **Negative Scope** (02) — gate enforcement for challenge surface
4. **Pre-Mortem** (03) — depends on Negative Scope (cross-references non-goals)
5. **Design Principle** (05) — protocol text, no code dependency

---

## Acceptance Criteria

Wave 1 is done when:
- [ ] `/kill` command exists and writes to both cross-project and per-project logs
- [ ] `sdk-status` shows last 5 kills
- [ ] `sdk-gate-check` fails on empty Negative Scope
- [ ] `sdk-gate-check --pre-mortem` validates pre-mortem section
- [ ] Bus messages accept TAG field; FRAMING-CHALLENGE triggers downstream pause
- [ ] Protocol.md is at version 4.2 with all new sections
- [ ] Design principle is encoded in protocol.md
