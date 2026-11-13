---
name: session-resume
description: Start or resume a team-sdk session: run sdk-resume, read the cockpit for the next agent, surface overdue decisions and health issues, and state the next action. Use at the start of a conversation in a project, or when asked 'where are we'.
---

# Session resume

## Steps
1. **Find the project directory:** the folder with `current-status.md`. In the SDK repo it is `project/`.
2. **Run `sdk-resume <dir>`.** It checks the session, flags overdue `DECISION BY` dates (§2 timing), refreshes the manifest and index, and prints the next agent's cockpit.
3. **Run `sdk-health <dir>`.** Note the issues, and do not fix them silently.
4. **Report to the Owner (as Greg, in the main session):**
   - where we are: release, phase, active missions;
   - what is overdue or blocked;
   - health issues;
   - the next action, as the activation phrase.
5. Load further context only as `protocol.md` §7 allows. Do not read `history.md` or the full protocol by default.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
