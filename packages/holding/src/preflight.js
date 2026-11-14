'use strict';

/**
 * preflight.js — the one pre-flight for starting a session, shared by the runner (the authority)
 * and sdk-holding (which calls it first to give a human reason before touching the runner).
 * A pure function of the folded ledger state: limits, reserves, price table and runner pin all
 * come from the ledger (fold.js), never from settings.json.
 *
 *   readiness(state, model?) → string[]   what is missing before any run can be metered
 *   preflightRun(state, { companyId, grantId, missionId, model?, maxBudgetUsd? }) → { availableFu, priceTable, runnerPin }
 *     throws LedgerError: NOT_READY, LIMITS_REQUIRED, LEDGER_FROZEN, GRANT_NOT_RATIFIED, NO_LIVE_GRANT,
 *       COMPANY_MISMATCH, MISSION_MISMATCH, MODEL_MISMATCH, TRANCHE_EXHAUSTED, OVERRUN_RESERVE_EMPTY,
 *       NO_SESSION_FLOOR, BUDGET_BELOW_FLOOR
 * Readiness is checked only when opts.requireConfig is true (sdk-holding always; the runner when the
 * ledger carries no legacy fallback in its own options).
 */

const { LedgerError } = require('./fold');

const fail = (code, message) => { throw new LedgerError(code, message); };

function readiness(state, model) {
  const missing = [];
  const { price_table: pt, runner_pin: pin } = state.config || {};
  if (!state.limits) missing.push('fuel limits (a `limits` ledger event; sdk-holding init writes the first)');
  if (!pt) missing.push('priceTable (sdk-holding price-table set <file.json>)');
  if (!pin) {
    missing.push('pinnedVersion (sdk-holding runner-pin set --claude-version <x.y.z> --session-floor "<model>=<usd>")');
    missing.push('sessionFloorUsd (same command, --session-floor)');
  } else if (model && !Object.prototype.hasOwnProperty.call(pin.session_floor_usd, model)) {
    missing.push(`sessionFloorUsd for ${model} (sdk-holding runner-pin set ... --session-floor "${model}=<usd>")`);
  }
  if (pt && model && !pt.models[model]) missing.push(`priceTable rates for ${model} (price table ${pt.version})`);
  return missing;
}

function preflightRun(state, o = {}) {
  if (o.requireConfig) {
    const missing = readiness(state, o.model);
    if (missing.length) fail('NOT_READY', `not ready to run; missing: ${missing.join('; ')}`);
  }
  if (!state.limits) fail('LIMITS_REQUIRED', 'the ledger has no fuel limits');
  if (state.frozen) fail('LEDGER_FROZEN', `the fuel ledger is frozen (kill switch); no run for grant ${o.grantId} starts`);
  const g = state.grants[o.grantId];
  if (g && g.status === 'proposed') fail('GRANT_NOT_RATIFIED', `grant ${o.grantId} is not ratified by the holding Owner (sdk-holding ratify ${o.grantId})`);
  if (!g || g.status !== 'open') {
    fail('NO_LIVE_GRANT', `no open grant ${JSON.stringify(o.grantId)} in the ledger${g ? ` (status ${g.status})` : ''}; grants are ratified by the holding Owner`);
  }
  if (g.company !== o.companyId) fail('COMPANY_MISMATCH', `grant ${o.grantId} belongs to ${g.company}, not ${o.companyId}`);
  if (g.mission_id !== o.missionId) fail('MISSION_MISMATCH', `grant ${o.grantId} funds mission ${g.mission_id}, not ${o.missionId}`);
  if (g.model && o.model && g.model !== o.model) fail('MODEL_MISMATCH', `grant ${o.grantId} funds model ${g.model}, not ${o.model}`);
  const availableFu = g.released_fu - g.drawn_fu;
  if (availableFu <= 0) {
    fail('TRANCHE_EXHAUSTED', `grant ${o.grantId} has no FU left in its open tranche (released ${g.released_fu}, drawn ${g.drawn_fu}); `
      + 'its named proof must unlock the next tranche');
  }
  if (state.pool.overrun_reserve_empty) {
    fail('OVERRUN_RESERVE_EMPTY', `the overrun reserve is empty (target ${state.pool.reserve_targets.overrun_fu} FU): overruns stop, `
      + 'so no session starts until a fund or a tranche repayment refills it');
  }
  const pin = state.config && state.config.runner_pin;
  if (pin && o.model !== undefined) {
    if (!Object.prototype.hasOwnProperty.call(pin.session_floor_usd, o.model)) {
      fail('NO_SESSION_FLOOR', `the ledger's runner pin has no session floor for model ${o.model}; record one before running it`);
    }
    if (o.maxBudgetUsd !== undefined && o.maxBudgetUsd < pin.session_floor_usd[o.model]) {
      fail('BUDGET_BELOW_FLOOR', `maxBudgetUsd $${o.maxBudgetUsd} is below the $${pin.session_floor_usd[o.model]} session floor of ${o.model}; `
        + 'the first turn alone would overshoot it');
    }
  }
  return { availableFu, priceTable: state.config ? state.config.price_table : null, runnerPin: pin || null };
}

module.exports = { readiness, preflightRun };
