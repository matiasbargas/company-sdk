---
name: guardian-review
description: Run one Iteration Guardian review cycle (discovery, architecture, or implementation loop, protocol §31) using the shared guardian procedure and sdk-doc iteration. Use when a phase's outputs are ready for graduation review.
---

# Guardian review

Procedure: `team/roles/_guardian.md` (the single source). Persona and domain checks: `team/roles/<loop>-guardian.md`. Exit criteria: `protocol.md` §31.2, pre-filled in each iteration file.

## Steps
1. **Argument:** `discovery`, `architecture`, or `implementation`. The last needs `--pod <name>`.
2. **Open the cycle:** `sdk-doc iteration . list --loop <loop>`. If no cycle is open, run `sdk-doc iteration . create --loop <loop> [--pod <pod>] --guardian "<name>"`.
3. **Run the 8-step procedure** in `_guardian.md`, including the guardian's own domain checks. Fill the verdict table with one row per criterion, each with evidence.
4. **Record the verdict:** `sdk-doc iteration . review --loop <loop> --cycle <N> --verdict graduate|iterate --feedback "..."`.
5. **Share it** with the `bus-message` skill, tagged `ITERATION-REVIEW` or `ITERATION-GRADUATED`.
6. **Escalate** if the escalation threshold is reached (`limits.guardianCyclesBeforeEscalation`, default 3): send a CEO BLOCKER.

Run as a fresh-context subagent (`.claude/agents/<loop>-guardian.md`) so the reviewer did not author the work.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
