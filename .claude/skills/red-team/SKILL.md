---
name: red-team
description: Run a red-team loop: independent fresh-context red-teamers attack a decision or plan, surface the ONE killing assumption plus the assumption-not-attacked line. Use before a costly or irreversible decision, or when the team converged suspiciously fast.
---

# Red-Team

Pattern spec: `team/roles/loops/red-team.md`, the single source. Open it first with the `loop-open` skill. Red-teamers are cross-domain by construction.

## Steps
1. **Spawn the red-teamer** as a fresh subagent (`.claude/agents/red-teamer.md`) from a domain other than the author's. Optionally spawn N=3 in parallel (self-consistency).
2. **Collect the results.** Each returns its single highest-severity killing assumption, the evidence, the failure scenario, and the mandatory `assumption-not-attacked:` line (alias `red-team-scope-limit:`). A result missing that line is void.
3. **Converge to ONE.** Keep the assumption named most often or rated most severe. Surface only that one.
4. **Hand it to the spawning agent**, who decides: test it, mitigate it, accept it with a logged risk (`log-decision`), or kill the plan.
5. **Record and emit** the improvement signal.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
