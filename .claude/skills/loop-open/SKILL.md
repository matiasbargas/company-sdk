---
name: loop-open
description: Open a protocol §32 generative loop (critique-revise or red-team) with a valid open message, Loop Coordinator, budget, termination rule, and provenance. Use when the PM, CTO, Mario, or Test Engineer wants a draft stress-tested at an insertion point.
---

# Open a generative loop

Rules: `protocol.md` §32; driver: `team/roles/loop-coordinator.md` (Step 0 refusal rules); patterns: `team/roles/loops/*.md`.

## Steps
1. **Check the trigger.** Read the pattern's `TRIGGER_SHAPE` and `NON_TRIGGER_SHAPE`. Pattern choice is deterministic (Level 3), not a debate. Dialectic is v0.2 and cannot be opened.
2. **Fill the pattern's `## Inputs at open` block:**
   - pattern, target artifact, constitution;
   - author role and critic role (different roles);
   - `Budget:` (≤ `limits.loopIterations` when set; one-pass patterns ignore it) and `Terminate when:`;
   - `WEAKNESS_HYPOTHESIS:` and the insertion point (Phase 0, Architecture, or Implementation).
3. **Spawn the Loop Coordinator** with that open message. It refuses if any field is missing. It assigns `LOOP-YYYYMMDD-<pattern>-<seq>` and creates `record/loops/<YYYY-MM-DD>-<pattern>-<seq>/state.md`.
4. **Run the pattern** with the `critique-revise` or `red-team` skill.
5. **Close the loop.** Every emitted artifact carries `LOOP-PROVENANCE:`, and the loop emits one improvement signal (`loops/_IMPROVEMENT_SIGNAL.md`).

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
