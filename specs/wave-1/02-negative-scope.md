# Negative Scope — Protocol Addition

**Status:** Spec — reviewed (CTO + Mario)
**Protocol version:** 4.1 → 4.2
**Affects:** protocol.md (new subsection in Section 15), gate-check.js, shaped brief template, architecture brief template, pre-mortem template

---

## Design Decision

Every gate-crossing artifact must include an "Explicit Non-Goals" section. This is the line nobody writes and the one the Owner needs most. It makes the challenge surface findable in thirty seconds.

**Enforcement:** `sdk-gate-check` hard-fails if the section is empty or contains fewer than 2 items. This is a hard gate, not advisory.

---

## Template

Added to every artifact that crosses a gate (shaped brief, architecture brief, pre-mortem, sprint plan):

```markdown
## Explicit Non-Goals

> What this pod/mission is NOT doing. Each item must be as specific as the goals.
> If you can't name what you're choosing not to do, you haven't scoped the work.

- [What adjacent problem we are deliberately ignoring and why]
- [What capability we are choosing not to build in this cycle and why]
- [What user segment or use case we are explicitly deferring and why]
```

**Rules:**

1. Minimum 2 items. Fewer than 2 means the team hasn't thought about boundaries.
2. Each item must name the thing AND the reason. "We're not building X" is incomplete. "We're not building X because Y" is valid.
3. The pre-mortem (Section 25b) must cross-reference non-goals: "If we fail, it will be because we drifted into [non-goal]."
4. Non-goals are not aspirational deferrals ("we'll do this later"). They are active exclusions ("we are choosing not to do this and here's why that choice is correct").

---

## Gate Enforcement

### gate-check.js Changes

Add a Negative Scope check to both gates:

**Pre-CTO gate (CLO + CISO):**
- Check `discovery-requirements.md` for `## Explicit Non-Goals` section
- Fail if section is missing or has fewer than 2 `- ` items
- Error message: `Explicit Non-Goals section missing or incomplete in discovery-requirements.md. Every gate-crossing artifact must name at least 2 things this project is NOT doing and why.`

**Pre-Sprint 1 gate (Mario):**
- Check the mission/shaped brief for `## Explicit Non-Goals` section
- Check `engineering-requirements.md` for `## Explicit Non-Goals` in the architecture section
- Fail if either is missing or has fewer than 2 items
- Error message: same pattern

**Pre-mortem gate (new — Section 25b):**
- Check that pre-mortem references at least 1 non-goal from the shaped brief
- Warn (not fail) if the pre-mortem doesn't cross-reference non-goals

---

## Where the Section Lives in Each Artifact

| Artifact | File | Section placement |
|---|---|---|
| Discovery brief | `discovery-requirements.md` | After gate status table, before Legal section |
| Shaped brief | `product-requirements.md` | After mission statement, before user stories |
| Architecture brief | `engineering-requirements.md` | After architecture decisions, before interface contracts |
| Pre-mortem | Mission brief or `pre-mortem.md` | After failure modes, as cross-reference |
| Sprint plan | `current-status.md` (Active Missions) | Each mission includes non-goals summary (1-line each) |

---

## Protocol Addition

Add to protocol.md Section 15 (Ideation Cycle), after the Appetized phase description:

```
**Negative Scope requirement:** Every artifact that crosses a gate must include an
"Explicit Non-Goals" section with at least 2 items. Each item names what is excluded
and why. `sdk-gate-check` enforces this as a hard gate — missing or incomplete
Negative Scope blocks the gate.

Non-goals are not aspirational deferrals. They are active exclusions with reasoning.
The Owner's primary challenge surface is the Negative Scope — if the team can't
articulate what they're choosing not to do, they haven't scoped the work.
```
