'use strict';

/** cli/run.js — sessions and the kill switch: run, freeze, unfreeze (and the LocalRunner factory). */

const fs = require('fs');
const path = require('path');
const { openLedger } = require('../ledger');
const { validatePortfolio, loadPortfolio } = require('../portfolio');
const { recordProof, scanReverts } = require('../proofs');
const { closeCycle, endGrant } = require('../cycle');
const { buildReport, formatReport } = require('../report');
const { preflightRun, readiness } = require('../preflight');
const { LIMIT_KEYS, validateLimits } = require('../fold');
const { canonicalize } = require('../canonical');
const {
  SDK_ROOT, KIND_ALIASES, BOOLEAN_FLAGS, DEFAULT_FUEL_LIMITS, TERMINAL, LIMIT_KEYS_DOC, DEFAULT_MAX_TURNS, USAGE, Refusal, usage, refuse, parseArgs, need, posInt, writeJson, openHolding, writeLimits, parseLimitValue, importSettingsConfig, companyMap, qualify, grantOrRefuse, scanAll,
} = require('./common');

const commands = {
  async run({ pos, flags }, io, h, deps) {
    const company = pos[0] || usage('run needs <company>');
    const grantId = need(flags, 'grant', 'run');
    const missionId = need(flags, 'mission', 'run');
    const prompt = need(flags, 'prompt', 'run');
    const maxTurns = flags['max-turns'] === undefined ? DEFAULT_MAX_TURNS : posInt(flags['max-turns'], '--max-turns');
    const co = (h.portfolio.companies || []).find(c => c.id === company) || refuse(`company ${company} is not registered`);
    const L = h.ledger();
    // 1. The ledger's answer first (frozen, ratified, mission, tranche, reserves): the same
    //    pre-flight the runner runs (preflight.js); the runner stays the authority at start.
    preflightRun(L.fold(), { companyId: company, grantId, missionId });
    // 2. The per-run budget and the model this session is pinned to.
    if (flags['max-budget-usd'] === undefined) refuse('run needs --max-budget-usd <usd> (the per-run soft ceiling, cap-po-runner-005)');
    const maxBudgetUsd = Number(flags['max-budget-usd']);
    if (!Number.isFinite(maxBudgetUsd) || maxBudgetUsd <= 0) usage(`--max-budget-usd must be a positive number, got ${JSON.stringify(flags['max-budget-usd'])}`);
    const model = flags.model || (h.settings.runner && h.settings.runner.model);
    if (!model) refuse('run needs --model <id> (or settings.json runner.model): the session is pinned to one model');
    // 3. Readiness: price table, Claude Code pin and session floor are in the ledger (recorded from
    //    the settings.json input form when it carries new values).
    for (const note of importSettingsConfig(h, L)) io.out(note);
    preflightRun(L.fold(), { companyId: company, grantId, missionId, model, maxBudgetUsd, requireConfig: true });
    const left = (() => { const g = L.fold().grants[grantId]; return g.released_fu - g.drawn_fu; })();
    const runner = deps.runner || makeRunner(h);
    const runId = await runner.start(co.id, { grantId, missionId, prompt, maxTurns, model, maxBudgetUsd });
    io.out(`run ${runId} started for ${company} (grant ${grantId}, ${left} FU open)`);
    let status = null;
    if (typeof runner.wait === 'function') status = await runner.wait(runId);
    else if (typeof runner.status === 'function') status = await runner.status(runId);
    const rec = path.join(h.files.runs, `${runId}.json`);
    if (!fs.existsSync(rec)) { // the LocalRunner writes its own record; never overwrite it
      writeJson(rec, { run_id: runId, company, grant_id: grantId, mission_id: missionId, max_turns: maxTurns, model, max_budget_usd: maxBudgetUsd,
        state: status ? status.state : null, terminal_reason: status ? status.terminalReason || null : null, recorded_by: 'sdk-holding' });
    }
    if (status) io.out(`run ${runId}: ${status.state}${status.terminalReason ? ` (${status.terminalReason})` : ''}`);
  },

  async freeze({ flags }, io, h, deps) {
    const L = h.ledger();
    const n = (L.fold().counts.freeze || 0) + 1;
    L.append({ type: 'freeze', actor: flags.by || 'holding-owner', idem_key: `freeze:${n}`, reason: flags.reason || 'kill switch' });
    io.out('ledger frozen: no draws, grants or releases; running sessions land at the next turn boundary');
    if (deps.runner && typeof deps.runner.stop === 'function') {
      for (const f of fs.existsSync(h.files.runs) ? fs.readdirSync(h.files.runs).filter(x => x.endsWith('.json')) : []) {
        let rec; try { rec = JSON.parse(fs.readFileSync(path.join(h.files.runs, f), 'utf8')); } catch { continue; }
        const state = rec.state;
        const runId = rec.run_id || f.replace(/\.json$/, '');
        if (state && !TERMINAL.has(state)) {
          try { await deps.runner.stop(runId, { mode: 'landing' }); io.out(`run ${runId}: landing requested`); } catch (e) { io.err(`run ${runId}: stop failed: ${e.message}`); }
        }
      }
    }
  },

  unfreeze({ flags }, io, h) {
    const L = h.ledger();
    const n = (L.fold().counts.unfreeze || 0) + 1;
    L.append({ type: 'unfreeze', actor: flags.by || 'holding-owner', idem_key: `unfreeze:${n}`, reason: flags.reason || 'resume' });
    io.out('ledger unfrozen');
  },
};

function makeRunner(h) {
  let mod;
  try { mod = require('../runner'); } catch (e) { refuse(`the LocalRunner is not available (${e.message})`); }
  // Limits, price table, pin and floors come from the ledger; settings.runner carries process options.
  const { limits, priceTable, pinnedVersion, ...runnerOpts } = h.settings.runner || {};
  return mod.createLocalRunner({
    ...runnerOpts,
    holdingDir: h.files.dir,
    companies: (h.portfolio.companies || []).map(c => ({ id: c.id, path: c.path })),
  });
}

module.exports = commands;
