# Loop output: improvement_signal

**Field slug:** improvement_signal
**Ships in:** v0.1 (2026-06-14)
**Scope:** every loop pattern, on close.

## What this field is

The Owner directive is that improvement is continuous through loops AND rituals — not a quarterly retro habit bolted onto delivery. The `improvement_signal` field is how loops contribute to that continuous substrate. Every loop closing emits a one-line signal alongside its main artifact, so friction surfaces in the same turn it was felt instead of waiting to be remembered. Loops generate the raw material; rituals (retro, pre-tag review, version bumps) consume the accumulated signal stream and decide what to amend. Without this field, the loop infrastructure improves only when someone remembers to file a meta issue — which is the failure mode this directive exists to kill.

## Schema

```yaml
improvement_signal:
  friction: "<one sentence — what was hard, what guardrail would have helped, or what part of the constitution was unclear>"
  suggested_target: loop-pattern | layer-A | workflow | protocol | none
  evidence_link: "<optional: path to artifact, e.g. record/loops/2026-06-14-critique-revise-001/state.md>"
```

`friction` and `suggested_target` are **required**. `evidence_link` is optional but recommended when the artifact path is non-obvious.

## Where it lands

Two writes, both atomic with loop close:

1. **Per-loop:** appended to `record/loops/<YYYY-MM-DD>-<pattern>-<seq>/state.md` under a `## improvement_signal` heading. (Loop ID `LOOP-YYYYMMDD-<pattern>-<seq>` per protocol §32.5 lives inside state.md; the folder uses the dated form.)
2. **Stream:** appended as one JSONL line to `record/metrics/_signals.jsonl` by `workflows/retrospective.js` (cadence=loop). This file is **append-only, never edited.** Rituals read the tail; corrections ship as new lines, not rewrites.

Line schema (exactly what `retrospective.js` writes):

```json
{"ts":"YYYY-MM-DD","loop_id":"<id>","friction":"...","suggested_target":"...","evidence_link":"..."}
```

`ts` and `loop_id` are **required** on every line (`ts` = close date; `loop_id` = the value passed to the workflow — today it doubles as the folder name under `record/loops/` unless `state_path` is passed). `friction` and `suggested_target` are required as above; `evidence_link` may be empty.

## Schema enforcement

Enforcement is the extraction step in `workflows/retrospective.js` (cadence=loop): it returns `verdict: missing | malformed` and does not append when the field is absent. Honest gap: that step is an LLM instruction, not a deterministic validator — nothing machine-checks `state.md` or `_signals.jsonl` lines yet (the Loop Coordinator's fail-closed check covers guardrail lines only). `suggested_target: none` is valid — some loops genuinely produce no signal, and forcing a fabricated target degrades the stream more than admitting silence does. But `none` must be **explicit**, not omitted. A missing field fails the loop's convergence contract; an explicit `none` passes.

## What this is NOT

Not a vent channel for loop participants. The `friction` line must be specific and one-action-able — a sentence a downstream ritual could turn into a single amendment without further interpretation. Boilerplate like "communication was hard," "more time would have helped," or "the pattern felt heavy" fails the same CISO 5-dimension audit that rejects boilerplate `would-have-wrongly-killed` lines. The bar is: if the next person reading this signal could not, on its own, draft the amendment, the line fails.

## Provenance

- Documented: 2026-06-14
- Source: Owner directive — improvement is continuous through loops AND rituals (sdk-v3, v2026.Q2.1).
- Enforcement mirrors: critique-revise.md guardrail on `would-have-wrongly-killed` presence-not-quality; CISO §32 v0.1 de-risk verdict.
