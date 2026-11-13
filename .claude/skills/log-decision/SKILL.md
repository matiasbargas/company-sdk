---
name: log-decision
description: Decide whether something is a consequential decision and, if so, log it to history.md in the protocol §6 format and touch the project map in the same commit (§35). Use after any irreversible, cross-domain, scope/budget/timeline, or person-affecting call.
---

# Log a decision

Rules: `team/roles/_shared.md` → Logging consequential decisions; format: `protocol.md` §6; map rule: §35.

## Steps
1. **Is it consequential?** Yes if any of these hold: irreversible; crosses a domain boundary; changes scope, budget, or timeline; affects natural persons. If none hold, a line in your area log is enough. Stop here.
2. Gather **context, the decision, alternatives considered, rationale, implications, `Reversible: YES|NO`, and `Affects natural persons: YES|NO`.**
3. Write it: `sdk-doc decision history.md --decision "..." --context "..." --made-by "<Role>"` (see `sdk-doc decision --help` for alternatives and other options).
4. If it is irreversible, attach any §29 disagreement record and route it to Mario for the irreversibility gate.
5. **Map:** in the same commit, update `current-status.md` if the phase, missions, or next action changed (§35). The commit-msg hook blocks material commits without a map touch.

## Done when
The entry exists in `history.md`, its reversibility is stated, and the map change is staged with it.

Commands: use the `sdk-*` bins; inside the SDK repo without `npm link`, run `node scripts/<name>.js`; in a generated project, `$SDK` is `sdkPath` from `./.sdkrc`.
