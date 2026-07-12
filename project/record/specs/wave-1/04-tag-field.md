# TAG Field + FRAMING-CHALLENGE Pattern — Protocol Addition

**Status:** Spec — reviewed (CTO + Mario)
**Protocol version:** 4.1 → 4.2
**Affects:** protocol.md Section 1 (Bus format), intent-resolver.js, sdk-doc bus command

---

## Design Decision

Add a `TAG` field to the Bus message format instead of a new message type. Tags are semantic metadata, not routing. This keeps the priority gradient clean (`INFO` → `DECISION NEEDED` → `BLOCKER`) while allowing semantic intent to be expressed and pattern-matched.

`FRAMING-CHALLENGE` is the first defined tag. It triggers a pause on downstream work until the framing is defended or revised.

---

## Bus Format Addition

Add after the `ESCALATION` field in protocol.md Section 1:

```
TAG: [optional — semantic metadata. Defined tags listed below. Multiple tags comma-separated.]
```

Full format becomes:

```
FROM: [Agent name] ([Role])
TO: [Target agent] | ALL
RELEASE: v[YEAR].Q[QUARTER].[INCREMENT]
PRIORITY: INFO | DECISION NEEDED | BLOCKER
SOLUTION_CLASS: KNOWN | EXPLORATORY | HYBRID  (required for CTO, Mario, EM, Staff Eng, Coordinator)
TAG: [optional — see defined tags below]
MESSAGE:
  [Body]
DECISION BY: [YYYY-MM-DD] (required for DECISION NEEDED)
ESCALATION: [Role] (required for DECISION NEEDED and BLOCKER)
```

---

## Defined Tags

### FRAMING-CHALLENGE

**When to use:** An agent believes the premise of the current work is wrong — not the execution, the framing. The assumption, target user, hypothesis, or scope boundary that downstream work is built on is incorrect or untested.

**Who can send:** Any agent. This is not an escalation — it is a signal.

**Required fields when TAG includes FRAMING-CHALLENGE:**
- `PRIORITY` must be `DECISION NEEDED` or `BLOCKER`
- `MESSAGE` must include:
  - The assumption being challenged (one sentence)
  - Why the agent believes it is wrong (evidence or reasoning)
  - What changes if the assumption is wrong
  - Options: (A) Defend current framing with evidence. (B) Revise framing.

**Example:**

```
FROM: Nicolás (CTO)
TO: Greg (CEO)
RELEASE: v2026.Q2.2
PRIORITY: DECISION NEEDED
SOLUTION_CLASS: EXPLORATORY
TAG: FRAMING-CHALLENGE
MESSAGE:
  FRAMING CHALLENGE — Target user assumption

  The current framing assumes individual consumers will self-serve onboarding.
  Our API complexity requires developer integration — no consumer will complete
  this without technical help. If this assumption is wrong, the entire
  architecture (self-serve flow, no SDK, browser-only) changes.

  Options:
  (A) Defend: provide evidence that consumers can self-serve this complexity.
  (B) Revise: reframe target as developer-first with consumer-facing frontend.

DECISION BY: 2026-04-20
ESCALATION: Owner
```

**Intent resolver behavior when TAG includes FRAMING-CHALLENGE:**

Wave 1 scope (logging + surfacing only):
1. Log the challenge to `history.md` (disagreement log format)
2. Surface in `sdk-status` output under "Framing Challenges (Open)"
3. Set deadline from `DECISION BY` field
4. If no response by deadline, escalate per standard escalation ladder

Wave 2 (deferred — requires mission dependency graph):
5. Automated pause of downstream missions in `current-status.md` that depend on the challenged framing

**Resolution:** The challenged party must articulate the assumption being challenged **in their own words** before the thread unfreezes. This is not a formality — it ensures the defender understood the challenge. Then: defend with evidence or revise.

Resolution is logged to `history.md` using the structured disagreement log format (see disagreement log spec — Wave 2).

---

### RATCHET-CANDIDATE (existing — now formalized as TAG)

Already defined in protocol.md Section 24 (Halloway Ratchet). Formalize as a TAG:

**When to use:** An agent notices a pattern of corrections on the same task, or an `EXPLORATORY` classification on a known-solution task class.

**Required fields:** `PRIORITY: INFO`, `TAG: RATCHET-CANDIDATE`. Message must name the task class, the level mismatch, and the known solution.

---

### Future tags (not in Wave 1)

Reserved for later definition:
- `COST-ESCALATION` — decision has budget implications above threshold
- `SCOPE-DRIFT` — framing has shifted from original brief without logged decision
- `KILL-CANDIDATE` — agent recommends pod termination (triggers Owner confirmation)

---

## intent-resolver.js Changes

Add tag parsing to the Bus message parser. When `TAG` field is present:

```javascript
// Tag patterns (Wave 1: logging + surfacing only)
const tagPatterns = {
  'FRAMING-CHALLENGE': {
    actions: ['log-disagreement', 'surface-in-status'],
    requiresPriority: ['DECISION NEEDED', 'BLOCKER'],
  },
  'RATCHET-CANDIDATE': {
    actions: ['log-ratchet-flag'],
    requiresPriority: ['INFO'],
  },
};
```

---

## sdk-doc bus Changes

The `sdk-doc bus` command accepts `--tag` parameter:

```bash
sdk-doc bus . --from "Nicolás (CTO)" --to "Greg (CEO)" --priority "DECISION NEEDED" --tag "FRAMING-CHALLENGE" --message "..."
```

Validation: if `--tag FRAMING-CHALLENGE` is set, enforce that `--priority` is `DECISION NEEDED` or `BLOCKER`. Reject `INFO` priority with framing challenge tag.

---

## Protocol Text

Add to protocol.md Section 1, after the SOLUTION_CLASS description:

```
**TAG — optional semantic metadata on any Bus message:**

```
TAG: [tag-name] | [tag-name, tag-name]
```

Tags express semantic intent without adding new message types. The intent resolver
pattern-matches tags and recommends actions. Defined tags:

- `FRAMING-CHALLENGE` — the premise of the work is being challenged, not the
  execution. Requires PRIORITY: DECISION NEEDED or BLOCKER. Intent resolver pauses
  downstream work dependent on the challenged framing. The challenged party must
  restate the challenged assumption in their own words before the thread unfreezes.
  Resolution logged to history.md.

- `RATCHET-CANDIDATE` — a Halloway Ratchet signal. An agent has observed
  exploratory reasoning on a known-solution task class. See Section 24.

Tags are extensible. New tags require a protocol version bump and an entry in
this section. Do not invent ad-hoc tags.
```
