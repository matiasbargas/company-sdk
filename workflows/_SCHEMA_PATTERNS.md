# Schema Patterns for Workflow Scripts

## The failure mode this doc exists to prevent

**Presence-not-quality enforcement at the schema layer.**

On 2026-06-14, `continuous-improvement-substrate-v0.1` produced 6 metric definition files against a 100-200 word target. Each agent returned `{ within_budget: boolean }` to a JSON schema that only required `within_budget` be a boolean. The agents returned `false` honestly. The workflow output was `all_within_budget: false`. The actual word counts were **272, 297, 306, 311, 346, 350**. The workflow shipped anyway because the schema validated the *presence* of the field, not the *value* of the constraint.

This is the same failure-mode family CISO scored 0/15 against in the §32 de-risk test. It recurs because JSON Schema is permissive by default — engineers reach for `{ type: "boolean" }` because it is easier to write than `{ type: "integer", maximum: N }`.

## The principle

**A schema MUST validate the constraint, not the self-report.**

If the constraint is "≤200 words," the schema enforces the word count, not a boolean the agent self-reports. If the agent cannot measure its own output reliably, the *workflow* does — either via post-write check + retry, or by structuring the agent to return the content itself so schema constraints fire on that content.

## Correct patterns

**Word-count ceiling on returned text** (character count approximates words at ~5-7 chars/word; 1200 for 200 words, 1800 for 300 words):
```json
{ "type": "string", "maxLength": 1200 }
```
Limitation: `maxLength` counts characters, so domains with longer words need higher ceilings.

**Bounded-integer range:**
```json
{ "type": "integer", "minimum": 0, "maximum": 200 }
```

**Enum for finite discrete choices:**
```json
{ "type": "string", "enum": ["pass", "fail", "needs-revision"] }
```

**Array length bounds:**
```json
{ "type": "array", "minItems": 3, "maxItems": 7 }
```

**Required structure rejecting empty:**
```json
{ "type": "string", "minLength": 1 }
```

## Anti-patterns to refuse

**Self-report boolean:**
```json
{ "within_budget": { "type": "boolean" } }
```
Failure mode: the agent reports the outcome and the workflow ships failed outputs.

**Self-graded quality enum with no rubric:**
```json
{ "quality": { "type": "string", "enum": ["good", "ok", "bad"] } }
```
Failure mode: the agent picks "good" because there is no anchored standard to refute it.

**Post-hoc compliance claim:**
```json
{ "checks_passed": { "type": "boolean" } }
```
Failure mode: the schema accepts the claim that checks ran without verifying any check fired.

## Escape valve for genuinely semantic constraints

When the constraint cannot be validated by shape alone — e.g., "the line names a specific defensive strategy" (CISO 5-dimension territory) — the workflow runs a **separate judge agent in a follow-up phase** whose own schema CAN be hard-validated (bounded integers, enums, maxLength). The judge sees the artifact, the producer never grades itself.

Canonical example: CISO Q3 + the §32 Periodic Constitutional Line Audit. The producer ships the line; the auditor scores it on 5 dimensions, each `{ type: "integer", minimum: 0, maximum: 3 }`. No self-report path exists.

## Provenance and evidence trail

- **Detected by:** `continuous-improvement-substrate-v0.1` self-report, 2026-06-14.
- **Evidence:** output `all_within_budget: false`; metric word counts 272, 297, 306, 311, 346, 350 against ≤200 target.
- **Logged into:** this document.
- **Action taken:** `fix-schema-enforcement-gap-v0.1` workflow re-ran the 6 metric files with hard `maxLength` enforcement.
- **Substrate signal-to-action rate, this incident:** 1/1 (detected → acted within the same release).
