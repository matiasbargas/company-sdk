# @team-sdk/holding — Portfolio Orchestrator v0 (one company)

The holding funds and meters a company's agent sessions. Funding comes in tranches, and each tranche unlocks on a named proof. Every token a session spends is recorded in a hash-chained ledger (`holding/fuel/ledger.jsonl`). The holding Owner (a human) keeps four decisions: ratify, fund, freeze and judge. The software never makes those calls.

- Spec (binding, implementation-independent): `project/context/spec/portfolio-orchestrator/variables.yaml` and `claims.yaml`.
- CLI: `bin/sdk-holding.js`. `sdk-holding --help` lists every command.
- Tests: `node packages/holding/tests/run.js`. The tests spend no tokens; every claude session is `tests/fixtures/fake-claude.js`.

## Layout

| Path | What | Who writes it |
|---|---|---|
| `holding/` (mode 0700, Owner only) | the control plane | the Owner and the runner, never a session |
| `holding/fuel/ledger.jsonl` | append-only, hash-chained events | `sdk-holding` (Owner events) and the runner (`draw`, `overrun`, `unmetered`) |
| `holding/portfolio.json` | the registry: one company, its Owner, its clone path | `sdk-holding add-company` |
| `holding/settings.json` | runner process options; a *display* copy of the limits | the Owner (it is not authoritative) |
| `holding/keys/<company>.key` (mode 0600) | the company's API key | `sdk-holding key set` |
| `holding/runs/<runId>.json` | run records: state, terminal reason, denials, usage | the runner |
| `holding/sandbox/setup-<user>.sh` | the generated sandbox setup script (never run by the tool) | `sdk-holding sandbox setup` |

Everything that changes how the ledger replays or how a draw is priced is stored *in* the ledger: `limits`, `price_table`, `runner_pin` and `sandbox` events. Editing `settings.json` never changes past numbers.

## Lifecycle

```
init → add-company → sandbox setup (run the script) → key set → price-table set → runner-pin set
     → fund → grant (proposal) → ratify → run → proof → (next tranche released) → judge → cycle close
     → report / sdk-health;   freeze / unfreeze at any time;   kill / close a grant;   reconcile against the provider
```

## First real run: checklist

Do these in order. Each step either names its result or refuses with the fix.

1. **Sandbox (D7).** Run `sdk-holding sandbox setup --user _sdkco --home /Users/Shared/sdkco [--session-dir /Users/Shared/sdkco-sessions] [--runtime-dir /Users/Shared/sdkco-runtime] --claude-bin $(which claude)`.
   - It records the `sandbox` event and writes `holding/sandbox/setup-_sdkco.sh`. **Read the script**, then run `sudo sh holding/sandbox/setup-_sdkco.sh`.
   - The script creates a hidden user and group and gives the company clone to that user.
   - It sets `holding/` to 0700 under you, and the session dir to 0755 under you.
   - It installs a sudoers drop-in, validated with `visudo -cf`, that lets you run *only* that claude path as `_sdkco`. The environment is reset except `ANTHROPIC_API_KEY` and `HOLDING_RUN_ID`.
   - **Hook runtime.** It copies `landing-hook.js` (node built-ins only) into an Owner-owned 0755 runtime dir. It uses an existing node whose every parent is world-traversable (`/opt/homebrew/bin/node`, `/usr/local/bin/node`); if there is none, it copies your node next to the hook.
   - Why the runtime matters: the landing/freeze hook runs *as `_sdkco`*. A hook that user cannot execute exits non-zero, Claude Code treats that as non-blocking, and **landing and freeze fail open**.
   - The script ends by proving reachability as `_sdkco` with `sudo -u _sdkco test`: node, hook, claude, the clone and the session dir.
   - Then, as yourself, run `git config --global --add safe.directory <company clone>` and `sdk-holding sandbox doctor`. Every check must say `ok`.
   - **Access checks.** Doctor walks every parent directory of node, the hook, claude, the clone and the session dir. It names any directory `_sdkco` cannot traverse, for example a `drwxr-x---` Owner home it is not in the group of, and gives the fix: move the path under `/Users/Shared`, or `chmod o+x` on that one directory.
   - **Keep the company clone outside your home** (e.g. `/Users/Shared/<company>`) unless you grant traverse on it.
2. **Key.** Run `sdk-holding key set <company> --from-stdin < keyfile`, then delete keyfile. The key is stored 0600 and never echoed. The runner passes it to the session through the environment, never on the command line.
3. **Price table.** Run `sdk-holding price-table set prices.json`, where the file is `{ version, models: { <model>: { in, out, cw, cr } }, usd_per_fu }`.
   - Include **every model a session may use**, subagents included. A session that touches an unpriced model is recorded `unmetered`.
   - `usd_per_fu` prices session floors and reconciliation.
4. **Pin and floor.** Run `sdk-holding runner-pin set --claude-version <x.y.z> --session-floor "<model>=<usd>"`.
   - The pin must equal what `claude --version` reports.
   - The floor is the fixed per-session cost. The spike measured about $0.08 on Opus.
5. **Budget you approve.**
   - Fund the pool (`fund <fu> --by holding-owner`) or keep infinite fuel. Infinite fuel removes only the pool limit; every draw is still metered.
   - Propose and ratify one grant with small tranches and a kill condition.
6. **Soft cap warning.** `--max-budget-usd` is checked *after* a turn, so it **overshoots**: the spike set $0.02 and spent $0.085. The only hard ceiling is the spend limit you set at the provider account for this key. Set it before running.
7. **Run small.** Run `sdk-holding run <company> --grant <id> --mission <id> --prompt "..." --model <id> --max-budget-usd <usd> --max-turns 5` (or fewer turns).
   - Concurrency is 1.
   - Afterwards run `sdk-holding report`, then `sdk-holding reconcile --company <id> --provider-usd <console amount> --period <cycle> --evidence <ref>`.

## What a run's `terminalReason` means

| terminalReason | Meaning | What to do |
|---|---|---|
| `done` | The session ended normally and was metered. | Read the report; record proof if earned. |
| `budget` | The working budget (the open tranche) was spent; the session landed. An overshoot is recorded as `overrun`. | Prove the tranche to unlock the next. |
| `tranche_exhausted` | Pre-flight refused or stopped it: no FU left in released tranches. | Record the tranche's named proof. |
| `max_turns` | It hit `--max-turns`. | Expected for small first runs. |
| `frozen` | The ledger was frozen (kill switch); the session landed at the next turn boundary. Its spend is drawn `after_freeze`. | `unfreeze` when ready. |
| `killed` | Stopped by `stop` or a hard kill. Usage may be missing; it is then `unmetered` with a provisional debit. | Reconcile. |
| `model_mismatch` | The session resolved a different model than pinned; it was hard-stopped and charged as `unmetered`. | Check env/settings overriding the model. |
| `no_work_denied` | Every tool call was denied: the session achieved nothing (never reported as `done`). | Check the runner permission profile; `report` lists the denied tools. |
| `error` | The process failed (spawn, version check, crash). | Read `error` in the run record. |

## Numbers you should not over-trust

- **Unmetered sessions** (killed, no result, unpriced model) take a *provisional* debit against their grant: the larger of the runner's live estimate and the session floor.
  - The live estimate **undercounts**. It is built from assistant-event snapshots; spike 2 saw 16 of 73 output tokens.
  - Until you run `reconcile` for that company and cycle, the grant cannot release its next tranche.
  - `report` and `sdk-health` show provisional (charged and uncharged) FU and the unreconciled periods.
- **VOF** is suppressed for a company in any cycle with an unmetered session. It guides the Betting Table and never decides alone; read it beside your judgment column.

## Security model, honestly

- **The barrier is the OS.** Sessions run as the sandbox user. `holding/` (ledger, keys, settings, freeze flag) is 0700 under the Owner, so a session cannot write the ledger or read keys.
- **The `actor` field is a declaration, not authentication.** It stops honest mistakes inside the trusted writer.
- **Owner commands refuse with `RUN_CONTEXT` when `HOLDING_RUN_ID` is set.** This covers ratify, fund, unfreeze, judge, kill, close, reconcile, `limits/price-table/runner-pin/sandbox/key set`, `cycle close` and `config import-settings`. It is a tripwire, not a barrier: a process can unset the variable.
- **v0 runs one company.** Company-to-company separation (per-company users) is required before a second company or Owner.

## Code map

- `src/fold.js` is the reducer facade. The reducer itself is in `src/fold/` (core plus one file per event family: config, grant, spend).
- `src/ledger.js` holds the chain, lock and append.
- `src/preflight.js` is the one run pre-flight, shared by the runner and the CLI.
- `src/runner/` is the LocalRunner. `src/landing-hook.js` is its landing hook.
- `src/meter.js` turns stream-json `modelUsage` into FU.
- `src/proofs.js` checks proofs in the company repo at a commit SHA.
- `src/cycle.js` closes a cycle (reclaim, envelope top-up).
- `src/report.js` and `src/health.js` are the views. `holdingHealth()` is called by `scripts/health.js`.
- `src/sandbox-access.js` answers whether the sandbox user can reach a path (every parent x, the target's bits, the first matching class decides). Doctor and the runner pre-flight use it.
- `src/cli/` holds the commands by group: setup, grants, run, views, reconcile, sandbox (`sandbox-script.js` is the generated sudo script).
