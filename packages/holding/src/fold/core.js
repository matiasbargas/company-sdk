'use strict';

/**
 * fold/core.js — shared state and helpers of the ledger reducer (see ../fold.js for the model):
 * the fold context, fuel limits and reserves, pool debits, tranche release, config checks.
 * Event handlers live by family in config-events.js, grant-events.js and spend-events.js.
 */

const HOLDING_OWNER = 'holding-owner';
const RATINGS = ['advanced', 'flat', 'regressed'];

class LedgerError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new LedgerError(code, message); };

const GENESIS_SHA256 = '0'.repeat(64);

const isNonNegInt = (v) => Number.isSafeInteger(v) && v >= 0;
const isPosInt = (v) => Number.isSafeInteger(v) && v > 0;
const isNonEmptyString = (v) => typeof v === 'string' && v.length > 0;

function drawIdemKey(runId, sessionId, resultUuid) {
  return `draw:${runId}:${sessionId}:${resultUuid}`;
}
function overrunIdemKey(runId, sessionId, resultUuid) {
  return `${drawIdemKey(runId, sessionId, resultUuid)}:overrun`;
}

/**
 * Fuel limits: the `limits` ledger event is the only authority (Mario C3 spirit: anything that
 * changes how events replay lives in the chain). `genesisLimits` (openLedger opts.limits) is the
 * default *before the first `limits` event* — for tests and pre-iteration-2 ledgers only; a
 * holding created by sdk-holding starts with a `limits` event and passes none. Missing genesis
 * keys default to no reserves and the spec defaults otherwise (GENESIS_DEFAULTS).
 */
const LIMIT_KEYS = ['envelopePerCycle', 'reclaimCyclesWithoutProof', 'smallBetReserve', 'smallBetMax', 'overrunReserve',
  'proofRevertCommits', 'concurrency'];
const GENESIS_DEFAULTS = { reclaimCyclesWithoutProof: 1, smallBetReserve: 0, smallBetMax: null, overrunReserve: 0,
  proofRevertCommits: 10, concurrency: 1 };

/** Validate a complete limits object (every LIMIT_KEYS key present). Returns a clean copy. */
function validateLimits(l, where = 'limits') {
  if (!l || typeof l !== 'object' || Array.isArray(l)) fail('LIMITS_INVALID', `${where} must be an object`);
  const missing = LIMIT_KEYS.filter(k => !(k in l));
  if (missing.length) fail('LIMITS_INVALID', `${where} is missing ${missing.join(', ')} (null means "no cap" and must be explicit)`);
  const out = {};
  for (const k of LIMIT_KEYS) out[k] = l[k];
  if (out.envelopePerCycle !== null && !isPosInt(out.envelopePerCycle)) fail('LIMITS_INVALID', 'envelopePerCycle must be a positive integer or null (infinite)');
  if (out.reclaimCyclesWithoutProof !== null && !isPosInt(out.reclaimCyclesWithoutProof)) fail('LIMITS_INVALID', 'reclaimCyclesWithoutProof must be a positive integer or null');
  if (!isPosInt(out.proofRevertCommits)) fail('LIMITS_INVALID', 'proofRevertCommits must be a positive integer');
  if (!isPosInt(out.concurrency)) fail('LIMITS_INVALID', 'concurrency must be a positive integer');
  reserveConfig(out, out.envelopePerCycle === null); // validates reserve fractions and smallBetMax
  return out;
}

function createFoldContext(genesisLimits) {
  let limits = null;
  if (genesisLimits !== undefined && genesisLimits !== null) {
    if (!('envelopePerCycle' in genesisLimits)) {
      fail('LIMITS_REQUIRED', 'limits.envelopePerCycle must be set explicitly (a number, or null for infinite fuel)');
    }
    limits = validateLimits({ ...GENESIS_DEFAULTS, ...genesisLimits }, 'genesis limits');
  }
  const ctx = {
    state: {
      limits: null,
      limits_source: null,  // 'genesis' | seq of the `limits` event in force
      config: { price_table: null, runner_pin: null },
      sandbox: null,          // { user, home, seq } from the latest `sandbox` event (D7)
      provisional: [],        // provisional debits for unmetered sessions (settled by `reconcile`)
      reconciliations: [],    // Owner-entered provider usage per company and period
      pool: {
        infinite: false, funded_fu: 0, balance_fu: 0, general_fu: 0,
        reserves: null, reserve_targets: null, small_bet_max_fu: null, overrun_reserve_empty: false,
      },
      cycle: 1,
      closed_cycles: [],
      frozen: false,
      frozen_at_seq: null,
      grants: {},
      credits: {},
      unmetered: [],
      warnings: [],
      counts: {},
    },
    idem: new Map(),        // idem_key -> stored event
    usedProofs: new Set(),  // `${kind}:${ref}` across the whole ledger
    head: GENESIS_SHA256,   // sha256 of the last applied event (set by the ledger after hashing)
    count: 0,
  };
  if (limits) applyLimits(ctx, limits, 'genesis');
  return ctx;
}

/** Put limits in force from this point of history on. Reserves are re-shaped, never invented. */
function applyLimits(ctx, limits, source) {
  const pool = ctx.state.pool;
  const infinite = limits.envelopePerCycle === null;
  const cfg = reserveConfig(limits, infinite);
  pool.infinite = infinite;
  if (!cfg) {
    pool.reserves = null; pool.reserve_targets = null; pool.small_bet_max_fu = null; // reserves fold into general fuel
  } else {
    pool.reserves = pool.reserves || { small_bet_fu: 0, overrun_fu: 0 };
    pool.reserve_targets = { small_bet_fu: cfg.smallTarget, overrun_fu: cfg.overrunTarget };
    pool.small_bet_max_fu = cfg.smallBetMax;
    for (const k of ['small_bet_fu', 'overrun_fu']) pool.reserves[k] = Math.min(pool.reserves[k], pool.reserve_targets[k]);
  }
  ctx.state.limits = { ...limits };
  ctx.state.limits_source = source;
  recomputeGeneral(pool);
}

function requireLimits(ctx, what) {
  if (!ctx.state.limits) fail('LIMITS_REQUIRED', `${what} needs fuel limits; the ledger has no \`limits\` event yet (sdk-holding init writes the first)`);
}

const isNonNegNumber = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0;

function validatePriceTable(pt) {
  if (!pt || typeof pt !== 'object' || !isNonEmptyString(pt.version) || !pt.models || typeof pt.models !== 'object' || Array.isArray(pt.models)) {
    fail('PRICE_TABLE_INVALID', 'price_table needs { version: string, models: { [model]: { in, out, cw, cr } }, usd_per_fu? }');
  }
  if (pt.usd_per_fu !== undefined && !(typeof pt.usd_per_fu === 'number' && Number.isFinite(pt.usd_per_fu) && pt.usd_per_fu > 0)) {
    fail('PRICE_TABLE_INVALID', 'price_table.usd_per_fu (list-price USD per FU, used for session floors and reconciliation) must be a positive number');
  }
  const models = Object.keys(pt.models);
  if (models.length === 0) fail('PRICE_TABLE_INVALID', 'price_table.models is empty');
  for (const m of models) {
    const r = pt.models[m];
    if (!r || !['in', 'out', 'cw', 'cr'].every(k => isNonNegNumber(r[k]))) fail('PRICE_TABLE_INVALID', `price_table.models.${m} needs non-negative in, out, cw, cr`);
  }
}

function validateRunnerPin(e) {
  if (typeof e.claude_code_version !== 'string' || !/^\d+\.\d+\.\d+$/.test(e.claude_code_version)) {
    fail('RUNNER_PIN_INVALID', 'runner_pin.claude_code_version must be a semantic version like 2.1.292 (C5)');
  }
  const f = e.session_floor_usd;
  if (!f || typeof f !== 'object' || Array.isArray(f) || Object.keys(f).length === 0 || !Object.values(f).every(isNonNegNumber)) {
    fail('RUNNER_PIN_INVALID', 'runner_pin.session_floor_usd must map each runnable model to its fixed per-session cost in USD');
  }
}

const isFraction = (v) => typeof v === 'number' && v >= 0 && v < 1;

/** Reserve configuration, or null when reserves do not apply (infinite fuel, or no fractions set). */
function reserveConfig(limits, infinite) {
  if (infinite) return null;
  if (!isPosInt(limits.envelopePerCycle)) fail('LIMITS_INVALID', 'limits.envelopePerCycle must be a positive integer or null');
  const small = limits.smallBetReserve ?? 0;
  const over = limits.overrunReserve ?? 0;
  if (!isFraction(small) || !isFraction(over) || small + over >= 1) {
    fail('LIMITS_INVALID', 'smallBetReserve and overrunReserve must be fractions in [0, 1) that sum below 1');
  }
  if (small === 0 && over === 0) return null;
  const smallTarget = Math.floor(small * limits.envelopePerCycle);
  const smallBetMax = limits.smallBetMax ?? smallTarget;
  if (!isNonNegInt(smallBetMax)) fail('LIMITS_INVALID', 'smallBetMax must be a non-negative integer or null');
  return { smallTarget, overrunTarget: Math.floor(over * limits.envelopePerCycle), smallBetMax };
}

// overrun_reserve_empty: reserves apply, the overrun target is > 0, and the reserve holds nothing —
// overruns stop, so pre-flight refuses new runs (cap-po-reserve-001).
function recomputeGeneral(pool) {
  pool.general_fu = pool.balance_fu - (pool.reserves ? pool.reserves.small_bet_fu + pool.reserves.overrun_fu : 0);
  pool.overrun_reserve_empty = !!pool.reserves && pool.reserve_targets.overrun_fu > 0 && pool.reserves.overrun_fu <= 0;
}

function liveGrant(ctx, id) {
  const g = ctx.state.grants[id];
  if (g && g.status === 'proposed') fail('GRANT_NOT_RATIFIED', `grant ${id} is a proposal; the holding Owner has not ratified it`);
  if (!g || g.status !== 'open') fail('NO_LIVE_GRANT', `no open grant ${JSON.stringify(id)}`);
  return g;
}

const bump = (obj, key, n) => { obj[key] = (obj[key] || 0) + n; };

function trancheOf(g, n) {
  if (!Number.isSafeInteger(n) || n < 1 || n > g.tranches.length) {
    fail('TRANCHE_INVALID', `grant ${g.grant_id} has no tranche ${JSON.stringify(n)}`);
  }
  return g.tranches[n - 1];
}

function debitPool(ctx, fu, what, small) {
  requireLimits(ctx, what);
  const pool = ctx.state.pool;
  if (pool.infinite) { pool.balance_fu -= fu; recomputeGeneral(pool); return; }
  if (!pool.reserves) {
    if (pool.balance_fu < fu) fail('POOL_INSUFFICIENT', `${what} needs ${fu} FU, pool has ${pool.balance_fu} FU`);
    pool.balance_fu -= fu; recomputeGeneral(pool); return;
  }
  const general = Math.max(0, pool.general_fu);
  const fromSmall = small ? Math.max(0, fu - general) : 0;
  if (fu - fromSmall > general || fromSmall > pool.reserves.small_bet_fu) {
    fail('POOL_INSUFFICIENT', `${what} needs ${fu} FU; general fuel has ${general} FU` +
      (small ? ` and the small-bet reserve ${pool.reserves.small_bet_fu} FU` : ` (reserves are held for small bets and overruns)`));
  }
  pool.reserves.small_bet_fu -= fromSmall;
  pool.balance_fu -= fu;
  recomputeGeneral(pool);
}

/** Move up to `fu` of general fuel into the overrun reserve, never above its target. */
function refillOverrunReserve(pool, fu) {
  if (!pool.reserves) return;
  const room = pool.reserve_targets.overrun_fu - pool.reserves.overrun_fu;
  const moved = Math.max(0, Math.min(fu, room, pool.general_fu));
  pool.reserves.overrun_fu += moved;
  recomputeGeneral(pool);
}

const isSmallBet = (ctx, g) => ctx.state.pool.small_bet_max_fu !== null && g.appetite_fu <= ctx.state.pool.small_bet_max_fu;

function releaseTranche(ctx, g, t) {
  const recovered = Math.min(t.size_fu, g.overrun_outstanding_fu);
  const effective = t.size_fu - recovered;
  debitPool(ctx, effective, `tranche ${t.index} of ${g.grant_id}`, isSmallBet(ctx, g));
  refillOverrunReserve(ctx.state.pool, recovered); // the grant repays the reserve that covered its overrun
  g.overrun_outstanding_fu -= recovered;
  t.effective_fu = effective;
  t.released = true;
  g.released_fu += effective;
}

const available = (g) => g.released_fu - g.drawn_fu;

/**
 * Session floor in FU for a model: ceil(runner_pin.session_floor_usd[model] / price_table.usd_per_fu).
 * Unknown model → the largest floor (conservative); no usd_per_fu or no pin → 0 (the provisional
 * debit still blocks the next tranche until reconciled, and health says the floor is unpriced).
 */
function sessionFloorFu(state, model) {
  const pin = state.config.runner_pin;
  const pt = state.config.price_table;
  if (!pin || !pt || !pt.usd_per_fu) return 0;
  const floors = pin.session_floor_usd;
  const usd = Object.prototype.hasOwnProperty.call(floors, model) ? floors[model] : Math.max(0, ...Object.values(floors));
  return Math.ceil(usd / pt.usd_per_fu);
}

// Once the ledger carries a price table / runner pin, every draw must name the ones in force, so
// its FU is recomputable from the ledger alone (raw × the named table).
function checkConfigRefs(ctx, e) {
  const { price_table: pt, runner_pin: pin } = ctx.state.config;
  if (pt && e.price_table_version !== pt.version) {
    fail('PRICE_TABLE_MISMATCH', `${e.type} priced with ${JSON.stringify(e.price_table_version)}; the ledger's price table is ${pt.version}`);
  }
  if (pin && e.claude_code_version !== undefined && e.claude_code_version !== pin.claude_code_version) {
    fail('RUNNER_PIN_MISMATCH', `${e.type} metered from Claude Code ${e.claude_code_version}; the ledger pins ${pin.claude_code_version}`);
  }
}

function ratifyGrant(ctx, g) {
  g.status = 'open';
  g.ratified_cycle = ctx.state.cycle;
  releaseTranche(ctx, g, g.tranches[0]); // only tranche 1 is drawable at ratification
}

module.exports = {
  HOLDING_OWNER, RATINGS, LedgerError, fail, GENESIS_SHA256, isNonNegInt, isPosInt, isNonEmptyString, isNonNegNumber,
  drawIdemKey, overrunIdemKey, LIMIT_KEYS, GENESIS_DEFAULTS, validateLimits, createFoldContext, applyLimits, requireLimits,
  validatePriceTable, validateRunnerPin, reserveConfig, recomputeGeneral, liveGrant, bump, trancheOf, debitPool,
  refillOverrunReserve, isSmallBet, releaseTranche, available, checkConfigRefs, ratifyGrant, sessionFloorFu,
};
