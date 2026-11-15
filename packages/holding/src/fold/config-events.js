'use strict';

/** fold/config-events.js — pool funding, fuel limits, price table, runner pin, kill switch, cycles. */

const {
  fail, isPosInt, requireLimits, recomputeGeneral, validateLimits, applyLimits, validatePriceTable, validateRunnerPin,
} = require('./core');

const SANDBOX_USER_RE = /^_?[a-z][a-z0-9_-]{0,30}$/;

module.exports = {
  // D7: the dedicated OS user company sessions run as. The runner reads state.sandbox.
  sandbox(ctx, e) {
    if (typeof e.user !== 'string' || !SANDBOX_USER_RE.test(e.user)) {
      fail('SANDBOX_INVALID', 'sandbox.user must be a short lowercase account name (e.g. _sdkco)');
    }
    const absolute = (p) => typeof p === 'string' && p.startsWith('/') && !p.split('/').some(x => x === '..');
    if (!absolute(e.home)) fail('SANDBOX_INVALID', 'sandbox.home must be an absolute path without ".."');
    if (!absolute(e.sessionDir)) fail('SANDBOX_INVALID', 'sandbox.sessionDir (Owner-owned, 0755: per-run settings the sandbox user reads) must be an absolute path without ".."');
    // Hook runtime (Guardian cycle 2): where the sandbox user execs the landing/freeze hook.
    // Optional for events recorded before the runtime step; `sandbox doctor` flags their absence.
    const runtime = {};
    for (const k of ['runtimeDir', 'nodePath', 'hookPath']) {
      if (e[k] === undefined) continue;
      if (!absolute(e[k])) fail('SANDBOX_INVALID', `sandbox.${k} must be an absolute path without ".."`);
      runtime[k] = e[k];
    }
    ctx.state.sandbox = { user: e.user, home: e.home, sessionDir: e.sessionDir, ...runtime, seq: e.seq };
  },

  fund(ctx, e) {
    if (!isPosInt(e.amount_fu)) fail('INVALID_AMOUNT', 'fund amount_fu must be a positive integer');
    requireLimits(ctx, 'fund');
    const pool = ctx.state.pool;
    pool.funded_fu += e.amount_fu;
    pool.balance_fu += e.amount_fu;
    if (pool.reserves) {
      let left = e.amount_fu;
      for (const k of ['small_bet_fu', 'overrun_fu']) {
        const add = Math.max(0, Math.min(left, pool.reserve_targets[k] - pool.reserves[k]));
        pool.reserves[k] += add;
        left -= add;
      }
    }
    recomputeGeneral(pool);
  },

  limits(ctx, e) {
    applyLimits(ctx, validateLimits(e.limits, 'limits event'), e.seq);
  },

  price_table(ctx, e) {
    validatePriceTable(e.price_table);
    ctx.state.config.price_table = { version: e.price_table.version, models: e.price_table.models, seq: e.seq };
    if (e.price_table.usd_per_fu !== undefined) ctx.state.config.price_table.usd_per_fu = e.price_table.usd_per_fu;
  },

  runner_pin(ctx, e) {
    validateRunnerPin(e);
    ctx.state.config.runner_pin = { claude_code_version: e.claude_code_version, session_floor_usd: { ...e.session_floor_usd }, seq: e.seq };
  },

  cycle_close(ctx, e) {
    if (e.cycle !== ctx.state.cycle) fail('CYCLE_MISMATCH', `cycle ${ctx.state.cycle} is open; cannot close cycle ${e.cycle}`);
    ctx.state.closed_cycles.push(e.cycle);
    ctx.state.cycle += 1;
  },

  freeze(ctx, e) {
    if (!ctx.state.frozen) ctx.state.frozen_at_seq = e.seq;
    ctx.state.frozen = true;
  },
  unfreeze(ctx) { ctx.state.frozen = false; ctx.state.frozen_at_seq = null; },

  checkpoint(ctx, e) {
    if (e.head_sha256 !== ctx.head || e.count !== ctx.count) {
      fail('CHECKPOINT_MISMATCH', `checkpoint records ${e.count}@${e.head_sha256}, chain is ${ctx.count}@${ctx.head}`);
    }
  },
};
