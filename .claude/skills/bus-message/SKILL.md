---
name: bus-message
description: Write or send a team-sdk Bus message (INFO, DECISION NEEDED, BLOCKER, or a tagged message such as CONTEXT-REQUEST, FRAMING-CHALLENGE). Use whenever an agent hands off, asks another role for a decision, reports a blocker, or announces state in Project Mode.
---

# Bus message

Source of truth: `protocol.md` §1 (format), §25 (tags), §2 (escalation and timing). This skill applies them; it does not redefine them.

## Steps
1. **Pick the priority.**
   - `INFO`: sharing state.
   - `DECISION NEEDED`: a question with options, plus a `DECISION BY` date and an `ESCALATION` role.
   - `BLOCKER`: names what is stopped and who can unstop it, plus `ESCALATION`.
2. **SOLUTION_CLASS** (`KNOWN | EXPLORATORY | HYBRID`) is required on DECISION NEEDED and BLOCKER from the CTO, Mario, EM, Staff Engineer, and Coordinator. Run the §24 pre-flight to choose it.
3. **TAG:** only tags defined in §25. CONTEXT-REQUEST is a tag on an INFO message, not a priority.
4. **RELEASE** is the current release ID from `.sdkrc` or `current-status.md`.
5. **Send it** so it is logged and validated: `sdk-doc bus . --from "<Name> (<Role>)" --to "<Role>" --priority "<P>" [--tag <TAG>] [--solution-class <C>] [--decision-by YYYY-MM-DD] [--escalation <Role>] --message "..."`. The CLI rejects missing §1 fields: DECISION BY on DECISION NEEDED, ESCALATION on DECISION NEEDED and BLOCKER, SOLUTION_CLASS for technical roles. If the CLI is unavailable, append the block to `bus-log.md` verbatim.
6. **Route it.** Address the role title (BU leads route internally), never `ALL` for a CONTEXT-REQUEST. The Owner is reached only via Greg (CEO) or the Coordinator.

## Done when
The message is in `bus-log.md` with every field §1 requires for its priority. The docs consistency test checks field names against §1.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
