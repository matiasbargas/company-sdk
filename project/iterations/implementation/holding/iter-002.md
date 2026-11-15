---
loop: "implementation"
cycle: 2
pod: "holding"
guardian: "Implementation Guardian"
status: "rework"
created: "2026-11-15"
graduated: ""
---

## Input

Iteration 3 (commit after e0e167c): answers every required change in `iter-001.md`.
- Code: `packages/holding/` (src/runner/*, src/fold/*, src/cli/*, landing-hook, preflight, proofs, cycle, report, health; README.md)
- Tests: `packages/holding/tests/` (13 suites, 918 assertions, zero tokens), incl. test-e2e, test-sandbox, test-reconcile
- Spec: `project/context/spec/portfolio-orchestrator/claims.yaml` (cap-po-sandbox-001, runner-006, reconcile-001 built)
- Owner decisions: history.md (D7 sandbox user, one company)

## Guardian Review

[Implementation Guardian, cycle 2, 2026-11-15. Scope: single-company v0 under D7, readiness = safe first real run after the Owner runs the generated sudo script, sets key, price table, pin, floor and an approved budget. Evidence: `node packages/holding/tests/run.js` 13 suites 918/918; capability coverage 613/0 (204 built, 6 planned, 10 unpinned); `sdk-holding --help` lists sandbox/key/reconcile and the RUN_CONTEXT rule. Read-only check of this machine: Owner home `/Users/matias.bargas` is drwxr-x--- (staff), node is `~/.local/node/bin/node`, the repo is under `~/dev`.]

| Criterion | PASS/FAIL | Evidence (file:section) | Required change |
|---|---|---|---|
| Deliverables match the graduated Architecture spec | FAIL | Cycle-1 item 1 closed: explicit profile (runner/settings.js:43-63, `//abs/**` rules, git landing set), denials recorded and `no_work_denied` (runner/stream.js:37-66). New gap, D7-specific: the landing/freeze hook is `<process.execPath> <repo>/src/landing-hook.js` (settings.js:60-61). Under D7 it runs as `_sdkco`, who is not in `staff` and cannot traverse a 0750 Owner home, so node or the script cannot be exec'd. A PreToolUse hook that exits non-zero (not 2) is non-blocking in Claude Code, so budget landing (cap-po-runner-001) and freeze (cap-po-killswitch-001) fail OPEN. The runner never hard-kills on its own landing or freeze (index.js:178,190; the landingTimer is only armed by stop()), so the session runs to --max-turns with a soft --max-budget-usd. `sandbox doctor` (cli/sandbox.js:149-197) checks none of this, and it does not check that `_sdkco` can reach the company clone's parents either. Minor: the runner ignores the ledger's `sandbox.sessionDir` and derives `home/../sdkco-sessions` (index.js:105). That matches only the README default, and it fails closed otherwise. | Put the hook runtime where `_sdkco` can exec it: copy landing-hook.js (plus a world-exec node, or `/usr/bin/env node` from a traversable path) into the Owner-owned 0755 session dir, or make setup check it. `sandbox doctor` and runner pre-flight verify traversal (o+x/g+x on every parent) for node, hook, claude and the company clone, and refuse otherwise. Arm a landing deadline (hard kill after landingTimeoutMs) on budget and freeze landing too, not only on stop(), so an unenforced hook is bounded. Read `state.sandbox.sessionDir`. Test each. |
| No security shortcuts taken | PASS | Cycle-1 item 2 closed. D7 is built: SANDBOX_REQUIRED unless tests (index.js:138-140); the key is read from a 0600, uid-checked file and passed through env only, never on argv (spawn.js:59-85); the sudoers rule allows only the claude path with env_keep of 2 vars, checked with visudo -cf (sandbox.js:131-140); holding/ is 0700. Bash deny rules cover holding paths and sdk-holding (settings.js:52-56). RUN_CONTEXT is documented as a tripwire (cli/index.js:74, README). The git allowlist refuses -c, config, aliases and chaining (landing-hook.js:33-78). | Carry-forward (below): deny Edit/Write on `<co>/.git/**` and `<co>/.claude/**`. |
| Maintainable by a team that did not write it | PASS | Cycle-1 item 4 closed. runner/, fold/ and cli/ are split, and every file is <400 (largest runner/index.js 396). The stale E2E-BUG bridge is gone (test-e2e.js:8 is only a note). README.md has the layout, lifecycle, first-run checklist, the terminalReason table and an honest security model. | None. |
| Pre-mortem edge cases handled or deferred with reason | PASS | Cycle-1 item 3 closed. An unmetered event takes a provisional debit of max(live estimate, session floor) (fold/spend-events.js:89-106). The tranche refuses PROVISIONAL_UNRECONCILED until `reconcile` (grant-events.js:59-60). reconcile-001 is built (cli/reconcile.js, test-reconcile.js). | None. The hook fail-open is under row 1. |
| Instrumentation covers the friction points | PASS | Cycle-1 item 5 closed for the code. report and health show denials, provisional and uncharged FU, unreconciled periods and LIVE_ESTIMATE_CAVEAT (report.js:22-31,63,131-132). The run record keeps `live_estimate.estimate:true`. | Carry-forward: the first real run is the C4 evidence. Record it as an experiment. |
| Creates user capability, not dependency | PASS | The Owner keeps ratify, fund, freeze, judge and reconcile. Every refusal names its fix. The README says which numbers not to over-trust. Note: a freeze that silently fails open (row 1) would mislead the Owner, so fixing row 1 protects this row. | None. |

Cycle-1 items: 1 permission profile + denials: CLOSED. 2 Bash deny + RUN_CONTEXT + git allowlist: CLOSED (D7 built). 3 provisional debit + reconcile: CLOSED. 4 refactor + README + stale bridge: CLOSED. 5 report/health visibility: CLOSED (code); the C4 real run is OPEN by design: it is the first run.

Blocks graduation: the hook runtime is unreachable by the sandbox user, so landing and freeze fail open, and there is no runner-side deadline (row 1).
Carry-forward, not blocking: (a) Write(/co/**) reaches `.git/hooks/*` (run by the allowed `git commit`) and `.claude/settings.json` (loaded next run via --setting-sources project). Under D7 this is bounded to the sandbox user plus the key, and the provider-side spend limit (README step 6) caps the key. (b) sessionDir drift (row 1, fails closed). (c) The first run must name a multi-turn + Task subagent prompt and be recorded as C4 evidence. (d) The doctor cannot prove sudo env_keep behaviour without running sudo. The Owner should read the first run's record (`sandbox_user`, exit) before a second run.

## Exit Criteria

- [ ] Deliverables match the spec from the graduated Architecture output (not a drifted interpretation)
- [ ] No security shortcuts taken (auth, data handling, secrets management)
- [ ] Code is maintainable by a team that did not write it
- [ ] Edge cases from the pre-mortem are handled or explicitly deferred with reason
- [ ] Instrumentation covers the friction points PM identified in product-requirements.md
- [ ] The output creates user capability, not dependency (Constraint 1 check)

## Verdict

ITERATE — 1) D7 hook fail-open: the landing/freeze PreToolUse hook runs <Owner node> <repo>/src/landing-hook.js as the sandbox user, who cannot traverse a 0750 Owner home; a non-zero hook exit is non-blocking, so budget landing and freeze fail OPEN, and the runner arms no deadline on its own landing/freeze (only stop() does). Fix: install the hook runtime in an Owner-owned 0755 location the sandbox user can exec; sandbox doctor and runner pre-flight verify traversal for node, hook, claude and the company clone and refuse otherwise; arm a landing deadline (hard kill) on budget and freeze landing; read state.sandbox.sessionDir instead of deriving home/../sdkco-sessions; tests for each. Carry-forward (not blocking): deny Edit/Write on <co>/.git/** and <co>/.claude/**; first real run = multi-turn + Task subagent, recorded as C4 evidence.

## Feedback

- 1) D7 hook fail-open: the landing/freeze PreToolUse hook runs <Owner node> <repo>/src/landing-hook.js as the sandbox user, who cannot traverse a 0750 Owner home; a non-zero hook exit is non-blocking, so budget landing and freeze fail OPEN, and the runner arms no deadline on its own landing/freeze (only stop() does). Fix: install the hook runtime in an Owner-owned 0755 location the sandbox user can exec; sandbox doctor and runner pre-flight verify traversal for node, hook, claude and the company clone and refuse otherwise; arm a landing deadline (hard kill) on budget and freeze landing; read state.sandbox.sessionDir instead of deriving home/../sdkco-sessions; tests for each. Carry-forward (not blocking): deny Edit/Write on <co>/.git/** and <co>/.claude/**; first real run = multi-turn + Task subagent, recorded as C4 evidence.

