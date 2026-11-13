---
name: critique-revise
description: Run a one-pass constitutional critique-revise loop on a draft: fresh critic emits sourced critique records plus the would-have-wrongly-killed line, author revises once, fresh judge applies the rubric. Use after loop-open for an existing draft against Layer A principles.
---

# Critique-Revise

Pattern spec: `team/roles/loops/critique-revise.md`, the single source. Open it first with the `loop-open` skill.

## Steps
1. **Spawn the critic** as a fresh subagent (`.claude/agents/critic.md`), not the author. It returns one record per critique: `{clause_id, quote_from_draft, violation, proposed_fix, severity}`. Reject any record missing `clause_id` or `quote_from_draft`.
2. **Guardrail line.** The critic must also emit `would-have-wrongly-killed: <bold property the critique does not damage>`. Without it, the loop fails closed.
3. **The author revises once.** It is not a negotiation, and new issues open a new loop.
4. **Spawn the judge** as a fresh subagent that is neither critic nor author. It scores each violation (resolved / partially / unresolved) and whether the guardrail property is preserved (yes / no). Ship only if every violation is resolved AND the property is preserved.
5. **Record** the turns in `state.md` and the transitions on the Bus. Emit the improvement signal.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
