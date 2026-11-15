'use strict';

/**
 * sdk-holding — the holding Owner's command line for the Portfolio Orchestrator.
 *
 * Layout (created by `init`, holding/ is 0700 under the Owner's user, D7):
 *   <holdingDir>/holding/portfolio.json      registry (portfolio.js)
 *   <holdingDir>/holding/settings.json       runner options + input form (see "Authority" below)
 *   <holdingDir>/holding/fuel/ledger.jsonl   the fuel ledger (ledger.js)
 *   <holdingDir>/holding/runs/               run records (owned by the runner)
 *   <holdingDir>/holding/commons/            commons (not yet built)
 *
 * The holding dir comes from --holding, else $SDK_HOLDING, else the current directory.
 * Exit codes: 0 done · 1 refused (the reason is printed) · 2 usage error.
 * `--by` names the actor: fund requires it; ratify/freeze/unfreeze/cycle/close/kill default to
 * holding-owner, grant to agent (a proposal), judge to company-owner. The ledger enforces who may
 * write what; the OS (D7) is the real barrier — this CLI stops honest mistakes.
 *
 * Authority (iteration 2): everything that changes how the ledger replays or how a draw is priced
 * lives in the hash chain. Fuel limits are `limits` events, written by `init`, `limits set` and
 * `fund --infinite`; settings.json keeps a display copy (limits.fuel) that nothing reads. The price
 * table and Claude Code pin are `price_table` / `runner_pin` events (a full event, not a hash in
 * each draw: a hash proves a table changed but cannot recompute a draw's FU; the event can). The
 * Owner may type them into settings.json (priceTable, claude.pinnedVersion, runner.sessionFloorUsd)
 * as an input form: `run` and `config import-settings` record any new or changed value as a
 * ledger event first and say so; the runner and replay only ever read the ledger.
 *
 * Layout: src/cli/common.js (parsing, holding access, shared helpers), one file per command group
 * (setup.js, grants.js, run.js, views.js), index.js (dispatch + main). bin/sdk-holding.js is a shim.
 *
 * main(argv, deps) is exported for tests: deps = { runner?, stdout?, stderr?, env?, cwd? }.
 * Without deps.runner, `run` builds the LocalRunner from settings (src/runner.js).
 */

const path = require('path');
const { USAGE, Refusal, usage, parseArgs, openHolding } = require('./common');

const commands = {
  ...require('./setup'),
  ...require('./grants'),
  ...require('./run'),
  ...require('./views'),
  ...require('./reconcile'),
  ...require('./sandbox').commands,
  commons: require('./commons').commons,
};

/**
 * Owner commands refuse inside a run (finding 2): a session launched by the runner carries
 * HOLDING_RUN_ID, so an agent that reaches `sdk-holding` through Bash cannot ratify, fund, unfreeze
 * or rate its own bet. This is a TRIPWIRE, not a barrier — an agent could unset the variable; the
 * barrier is the OS (D7: sessions run as the sandbox user, holding/ is 0700 under the Owner).
 */
const OWNER_COMMANDS = {
  ratify: null, fund: null, unfreeze: null, judge: null, kill: null, close: null, reconcile: null, 'add-company': null,
  limits: 'set', 'price-table': 'set', 'runner-pin': 'set', sandbox: 'setup', key: 'set', config: 'import-settings', cycle: 'close',
};
function isOwnerCommand(cmd, sub) {
  if (!Object.prototype.hasOwnProperty.call(OWNER_COMMANDS, cmd)) return false;
  return OWNER_COMMANDS[cmd] === null || OWNER_COMMANDS[cmd] === sub;
}

async function main(argv, deps = {}) {
  const io = {
    out: deps.stdout || ((s) => process.stdout.write(`${s}\n`)),
    err: deps.stderr || ((s) => process.stderr.write(`${s}\n`)),
  };
  try {
    const [cmd, ...rest] = argv;
    if (!cmd || cmd === '--help' || cmd === 'help') { io.out(USAGE); return cmd ? 0 : 2; }
    const fn = commands[cmd] || usage(`unknown command ${JSON.stringify(cmd)}`);
    const args = parseArgs(rest);
    const env = deps.env || process.env;
    if (env.HOLDING_RUN_ID && (cmd === 'init' || isOwnerCommand(cmd, args.pos[0]))) {
      throw new Refusal(`refused: RUN_CONTEXT: \`${cmd}${args.pos[0] ? ` ${args.pos[0]}` : ''}\` is a holding-Owner command and this process runs inside `
        + `session ${env.HOLDING_RUN_ID} (HOLDING_RUN_ID is set). Run it from your own terminal. (A tripwire, not a barrier: the OS sandbox user is the barrier.)`, 1);
    }
    if (cmd === 'init') { await fn(args, io); return 0; }
    // `<command> --help` never needs a holding: commands print their own usage from flags.help.
    if (args.flags.help !== undefined) {
      if (cmd === 'sandbox') await fn(args, io, null, deps); else io.out(USAGE);
      return 0;
    }
    const root = path.resolve(args.flags.holding || env.SDK_HOLDING || deps.cwd || process.cwd());
    const h = openHolding(root);
    await fn(args, io, h, deps);
    return 0;
  } catch (err) {
    if (err instanceof Refusal) { io.err(err.message); return err.exitCode; }
    if (err && typeof err.code === 'string') { io.err(`refused: ${err.message}`); return 1; }
    io.err(`error: ${err && err.stack ? err.stack : err}`);
    return 1;
  }
}

module.exports = { main, USAGE, OWNER_COMMANDS, isOwnerCommand };
