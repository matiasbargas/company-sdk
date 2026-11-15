'use strict';

/**
 * runner/config.js — the runner's configuration and start-option checks. Limits, price table,
 * Claude Code pin and session floors come from the folded ledger; constructor opts are a legacy
 * fallback used only while the ledger lacks the event, and must agree when both exist (CONFIG_MISMATCH).
 */

const { canonicalize } = require('../canonical');
const { fail, isNonEmptyString } = require('./state');
const { checkExtraArgs } = require('./settings');

/** Constructor options the runner refuses before touching the ledger. Returns { extraArgs, legacyLimits }. */
function checkRunnerOpts(opts) {
  if (!isNonEmptyString(opts.holdingDir)) fail('INVALID_OPTION', 'holdingDir is required');
  if (!Array.isArray(opts.companies)) fail('INVALID_OPTION', 'companies [{ id, path }] is required');
  const extraArgs = opts.extraArgs || [];
  checkExtraArgs(extraArgs);
  if (opts.limits && opts.limits.concurrency !== undefined && (!Number.isSafeInteger(opts.limits.concurrency) || opts.limits.concurrency < 1)) {
    fail('INVALID_OPTION', 'limits.concurrency must be a positive integer');
  }
  return { extraArgs, legacyLimits: opts.limits && 'envelopePerCycle' in opts.limits ? opts.limits : undefined };
}

/** Runner config from the folded ledger, legacy opts only where the ledger has nothing. */
function resolveRunnerConfig(state, opts) {
  const pt = state.config.price_table;
  const pin = state.config.runner_pin;
  if (pt && opts.priceTable && opts.priceTable.version !== pt.version) {
    fail('CONFIG_MISMATCH', `runner opts priceTable ${opts.priceTable.version} differs from the ledger's ${pt.version}; the ledger wins — drop the option`);
  }
  if (pin && opts.pinnedVersion && opts.pinnedVersion !== pin.claude_code_version) {
    fail('CONFIG_MISMATCH', `runner opts pinnedVersion ${opts.pinnedVersion} differs from the ledger's ${pin.claude_code_version}`);
  }
  if (pin && opts.sessionFloorUsd && canonicalize(opts.sessionFloorUsd) !== canonicalize(pin.session_floor_usd)) {
    fail('CONFIG_MISMATCH', 'runner opts sessionFloorUsd differs from the ledger\'s runner pin');
  }
  const c = {
    priceTable: pt ? { version: pt.version, models: pt.models } : opts.priceTable,
    pinnedVersion: pin ? pin.claude_code_version : opts.pinnedVersion,
    floors: pin ? pin.session_floor_usd : opts.sessionFloorUsd,
    concurrency: (state.limits && state.limits.concurrency) || 1,
    fromLedger: { priceTable: !!pt, runnerPin: !!pin },
  };
  if (!isNonEmptyString(c.pinnedVersion)) fail('PIN_REQUIRED', 'pinnedVersion (the Claude Code version this runner meters) is required (C5): record a runner_pin');
  if (!c.priceTable) fail('INVALID_OPTION', 'priceTable is required: record a price_table');
  const f = c.floors;
  if (!f || typeof f !== 'object' || Array.isArray(f) || !Object.values(f).every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)) {
    fail('SESSION_FLOOR_REQUIRED', 'sessionFloorUsd { [model]: usd } is required (the fixed per-session cost; no defaults)');
  }
  return c;
}

/** Validate start() options against the resolved config. Returns the session model. */
function validateStart(o, opts, cfg) {
  if (!isNonEmptyString(o.prompt)) fail('PROMPT_REQUIRED', 'start needs a prompt');
  if (!isNonEmptyString(o.grantId)) fail('GRANT_REQUIRED', 'start needs a grantId');
  if (!isNonEmptyString(o.missionId)) fail('MISSION_REQUIRED', 'start needs a missionId');
  if (!Number.isSafeInteger(o.maxTurns) || o.maxTurns < 1) fail('MAX_TURNS_REQUIRED', 'start needs maxTurns (a positive integer stop condition)');
  if (o.idempotencyKey !== undefined && !isNonEmptyString(o.idempotencyKey)) fail('INVALID_OPTION', 'idempotencyKey must be a non-empty string');
  if (o.testCommand !== undefined && !isNonEmptyString(o.testCommand)) fail('INVALID_OPTION', 'testCommand must be a non-empty string');
  const model = o.model || opts.model;
  if (!isNonEmptyString(model)) fail('MODEL_REQUIRED', 'start needs a model (opts.model or runner opts.model); it is pinned for the session');
  if (typeof o.maxBudgetUsd !== 'number' || !Number.isFinite(o.maxBudgetUsd) || o.maxBudgetUsd <= 0) {
    fail('MAX_BUDGET_REQUIRED', 'start needs maxBudgetUsd (a positive number, passed as --max-budget-usd)');
  }
  if (!Object.prototype.hasOwnProperty.call(cfg.floors, model)) {
    fail('NO_SESSION_FLOOR', `sessionFloorUsd has no floor for model ${model}; record one before running it`);
  }
  if (o.maxBudgetUsd < cfg.floors[model]) {
    fail('BUDGET_BELOW_FLOOR', `maxBudgetUsd $${o.maxBudgetUsd} is below the $${cfg.floors[model]} session floor of ${model}; `
      + 'the first turn alone would overshoot it');
  }
  return model;
}

module.exports = { checkRunnerOpts, resolveRunnerConfig, validateStart };
