# Pre-Mortem Gate — Protocol Addition (Section 25b)

**Status:** Spec — reviewed (CTO + Mario)
**Protocol version:** 4.1 → 4.2
**Affects:** protocol.md (new Section 25b), gate-check.js (new `--pre-mortem` flag), shaped brief template

---

## Design Decision

A new hard gate between Mario's irreversibility review and Sprint 1. The team writes the post-mortem for the failure case before starting execution. The Owner reviews and either proceeds or `/kill`s the pod.

This is the Owner's highest-leverage moment. The team has done all the thinking. The pre-mortem forces them to articulate the failure case. The Owner reads it and decides: is this bet worth taking?

---

## Placement in Phase Model

```
Phase 2:    CTO → Mario (irreversibility review) → Designer → PM → Staff Eng → EM
Phase 2.5:  PRE-MORTEM GATE ← new
Phase 3:    Sprint 1 starts (Liaison activates, engineers pick up tickets)
```

Mario's review asks "is this decision sound?" The pre-mortem asks "assuming everything goes wrong, where does it break?" Different questions. Mario catches "we saw it and got it wrong." Pre-mortem catches "we didn't see this coming."

---

## Pre-Mortem Template

Added as a required section in the mission/shaped brief, not a separate file. Keeps the bet and the failure case in the same document.

```markdown
## Pre-Mortem

> It is [date + Appetite duration]. This mission failed. Write the post-mortem.

**Date:** [YYYY-MM-DD]
**Participants:** [Roles — minimum: PM, CTO, and one Staff Engineer or EM]
**Mission:** [Mission name]
**Appetite:** [Time-box]

### 1. This mission will fail because...
> Top 3 failure modes. Each must be specific and falsifiable — not "requirements change" but "the payment provider's sandbox doesn't support recurring billing and we discover this in Sprint 2."

1. [Failure mode + why it's likely]
2. [Failure mode + why it's likely]
3. [Failure mode + why it's likely]

### 2. We will know we are failing when...
> Leading indicators, not lagging. What will we see in week 1-2 that signals the failure, before the sprint is lost?

1. [Early signal + what it means]
2. [Early signal + what it means]

### 3. Non-goals we are most likely to drift into
> Cross-reference Explicit Non-Goals from the shaped brief. Which excluded scope is the team most likely to absorb anyway?

1. [Non-goal from shaped brief] — why we'd drift: [reason]
2. [Non-goal from shaped brief] — why we'd drift: [reason]

### 4. The assumption that, if wrong, kills this mission
> One sentence. The falsifiable bet. If this turns out to be false, the mission should be killed immediately.

[The assumption]

### Reviewed by
- [ ] Owner reviewed pre-mortem
- [ ] Owner decision: PROCEED | /kill
```

---

## Gate Enforcement

### gate-check.js Changes

New flag: `--pre-mortem`

```
node scripts/gate-check.js <project-dir> --pre-mortem
```

**Checks:**

1. The shaped brief (in `product-requirements.md` or mission brief) contains a `## Pre-Mortem` section
2. Section 1 has at least 3 failure modes (3 numbered items)
3. Section 2 has at least 2 leading indicators
4. Section 3 exists and has at least 1 item (structural check only — semantic cross-reference with Explicit Non-Goals is agent responsibility, not script)
5. Section 4 has exactly 1 falsifiable assumption
6. "Owner reviewed pre-mortem" checkbox is checked (`- [x]` format exclusively)
7. Owner decision is recorded (PROCEED or reference to /kill entry)
8. Participants field lists at least 2 names

**Failure message:**
```
GATE BLOCKED

Pre-mortem gate not cleared. Sprint 1 cannot start without a reviewed pre-mortem.

Missing:
  1. [specific missing element]

To clear: complete the Pre-Mortem section in the mission brief and have the Owner review it.
```

### Combined gate sequence

The full pre-Sprint 1 gate check becomes:

```
sdk-gate-check <project-dir> --all
```

Runs in order:
1. CLO + CISO gate (pre-CTO) — already exists
2. Mario gate (irreversibility review) — already exists
3. Negative Scope gate — new (Wave 1)
4. Pre-mortem gate — new (Wave 1)

All must pass before Sprint 1 starts.

---

## Participation Requirement

The pre-mortem is not a Mario-only exercise.

**Full team (3+ active roles):** PM + CTO/Staff Engineer + EM. Each writes independently, then PM synthesizes.

**Small team fallback (fewer than 3 roles):** Minimum 2 participants from distinct domains. The gate checks for 2+ names in the Participants field, not specific role titles.

Each participant writes independently, then the PM (or lead) synthesizes into the template. This prevents groupthink in the pre-mortem itself. If all three failure modes come from one participant, the pre-mortem is shallow.

---

## Protocol Text

Add to protocol.md after the Mario gate description:

```
### Pre-Mortem Gate (Phase 2.5)

After Mario's irreversibility review and before Sprint 1 starts, every mission
produces a pre-mortem: the post-mortem for the failure case, written before
execution begins.

Required sections: (1) top 3 failure modes, (2) leading indicators visible in
week 1-2, (3) non-goals most likely to drift into (cross-ref Explicit Non-Goals),
(4) the single falsifiable assumption that, if wrong, kills the mission.

Participants: minimum PM + CTO/Staff Engineer + EM. Independent writing, then
synthesis. The pre-mortem is the Owner's primary challenge surface — they read it
and either proceed or /kill the pod.

Enforcement: `sdk-gate-check <project-dir> --pre-mortem` or `--all`.
Sprint 1 cannot start until the Owner has reviewed the pre-mortem and recorded
their decision (PROCEED or /kill with rationale).
```
