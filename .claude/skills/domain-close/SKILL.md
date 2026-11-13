---
name: domain-close
description: Close a piece of role work with the shared Done Definition: requirements statuses, area log, decisions, hand-off Bus message, sdk-health, agency check. Use at the end of any role deliverable in Project Mode.
---

# Domain close

Rules: `team/roles/_shared.md` → Closing a piece of work. Your role file's Done Definition adds domain items on top.

## Steps
1. **Requirements.** Update your section's items to true statuses (Pending / In Progress / Done / Blocked). Done means implemented AND evidenced. Use scoped sections, e.g. `sdk-doc add-item <file> --section "## Finance (CFO) > Done" --item "..." --status done`.
2. **Area log.** Run `sdk-doc log <area-log> --role "<Role>" --level <Level> --goal "..." --status completed`.
3. **Decisions.** Run the `log-decision` skill for each consequential call.
4. **Hand-off.** Run the `bus-message` skill to send the next owner what they need (an INFO message, or DECISION NEEDED if you are blocked).
5. **Health.** Run `sdk-health .` and fix or report anything new it flags (stale status, stuck surfaces, invalid `.sdkrc` limits, map drift).
6. **Agency check** (`_shared.md`): does the output leave its readers more capable?
7. **Report.** Give a 3–5 line summary: what changed, what is still open and who owns it, and the health result.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
