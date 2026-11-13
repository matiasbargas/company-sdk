---
name: squad-activate
description: Create a new team-sdk project with a squad (startup, mvp, feature, website) and prime the first activation. Use when the user wants to start a new project or asks which squad fits.
---

# Squad activate

Squads: `team/squads/*.md` (the single source; `sdk-squad <type>` prints a roster); types: `team/types/`.

## Steps
1. **Clarify first** (`_shared.md` → Clarify before implementing):
   - what is IN and what is OUT;
   - the target user and the core flow;
   - platform or asset constraints, including regulated money or PII.
2. **Pick the squad.** Run `sdk-squad list`, then `sdk-squad <type>` to show the roster. Recommend one and say why.
3. **Create:** `sdk-init <name> --squad <type> [--type <project-type>] --idea "..."`. It writes `.sdkrc` with `limits` (no cap by default).
4. **Brief.** The Owner completes `idea.md` Section 4. Greg receives the brief, and the Coordinator runs Phase 0 until the five questions are answered (`limits.discoveryRounds` if set).
5. **Activate** in the `AGENTS.md` order. Use the `onboard-agent` skill for each agent, and run the `gate-review` skill before the CTO.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
