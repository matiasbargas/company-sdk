'use strict';

/**
 * fold.js — the ledger reducer: event stream → pool / grant / tranche balances.
 *
 * One reducer serves both validation (an append is accepted only if it applies cleanly to the
 * folded state) and replay (fold of the file). That is what makes "replaying an event does not
 * change any balance" structural: the same function decides both.
 *
 * Units are integer Fuel Units (FU). Pool rule: with `limits.envelopePerCycle: null` (infinite
 * fuel) no event is refused for pool balance; every other rule (live grant, mission, tranche
 * gating, frozen ledger, kill condition at grant time) still applies (cap-po-fuel-002).
 *
 * Cycles (cap-po-grant-003): the fold counts Betting cycles from 1; `cycle_close` closes the
 * current one. Draws, overruns, proofs, reverts, unmetered sessions and judgments are stamped
 * with the cycle they landed in, so per-cycle reports are a pure function of the ledger.
 *
 * Ratification (cap-po-grant-002): a `grant` authored by anyone but the holding Owner is a
 * proposal (status `proposed`, nothing released, not drawable) until the holding Owner writes
 * `ratify`. A grant the holding Owner authors is ratified on entry: the ratifier is the author.
 *
 * Reserves (cap-po-reserve-001), finite envelope only: each `fund` first tops the small-bet
 * reserve up to floor(smallBetReserve × envelope), then the overrun reserve up to
 * floor(overrunReserve × envelope); the rest is general fuel. Tranches of large grants debit
 * general fuel only; small grants (appetite ≤ smallBetMax, default the small-bet target) debit
 * general first, then the small-bet reserve. Overruns debit the overrun reserve first; beyond it
 * they are still recorded (real spend) with a warning and `overrun_reserve_empty` set, which is
 * the pre-flight signal that stops further runs. Returned fuel goes back to general fuel.
 * pool.balance_fu is always the total of all buckets.
 */

const { validateGrant, validateRecordedProof, proofMatches, qualifiedSurfaceId } = require('./grants');

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
    fail('PRICE_TABLE_INVALID', 'price_table needs { version: string, models: { [model]: { in, out, cw, cr } } }');
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

const handlers = {
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

  grant(ctx, e) {
    const { ok, errors } = validateGrant(e);
    if (!ok) fail('GRANT_MALFORMED', errors.join('; '));
    if (ctx.state.frozen) fail('LEDGER_FROZEN', 'no new grants while the ledger is frozen');
    if (ctx.state.grants[e.grant_id]) fail('GRANT_EXISTS', `grant ${e.grant_id} already exists`);
    if (e.bet_class !== undefined && !isNonEmptyString(e.bet_class)) fail('GRANT_MALFORMED', 'bet_class must be a non-empty string when given');
    const g = {
      grant_id: e.grant_id, company: e.company, mission_id: e.mission_id, appetite_fu: e.appetite_fu,
      bet_class: e.bet_class || 'default', kill_condition: e.kill_condition, status: 'proposed', proposed_by: e.actor,
      tranches: e.tranches.map((t, i) => ({
        index: i + 1, size_fu: t.size_fu, effective_fu: 0, named_proof: { kind: t.proof.kind, ref: t.proof.ref },
        released: false, proven: false, proof_id: null, proof: null, proof_cycle: null, reverted: false, revert_cycle: null,
      })),
      released_fu: 0, drawn_fu: 0, overrun_fu: 0, overrun_outstanding_fu: 0, returned_fu: 0,
      proposed_cycle: ctx.state.cycle, ratified_cycle: null, ended_cycle: null, last_proof_cycle: null,
      fu_by_cycle: {}, overrun_by_cycle: {}, judgments: {},
    };
    if (e.actor === HOLDING_OWNER) ratifyGrant(ctx, g); // the holding Owner's own grant is ratified by its author
    ctx.state.grants[g.grant_id] = g;
  },

  limits(ctx, e) {
    applyLimits(ctx, validateLimits(e.limits, 'limits event'), e.seq);
  },

  price_table(ctx, e) {
    validatePriceTable(e.price_table);
    ctx.state.config.price_table = { version: e.price_table.version, models: e.price_table.models, seq: e.seq };
  },

  runner_pin(ctx, e) {
    validateRunnerPin(e);
    ctx.state.config.runner_pin = { claude_code_version: e.claude_code_version, session_floor_usd: { ...e.session_floor_usd }, seq: e.seq };
  },

  ratify(ctx, e) {
    if (ctx.state.frozen) fail('LEDGER_FROZEN', 'no ratifications while the ledger is frozen');
    const g = ctx.state.grants[e.grant_id] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(e.grant_id)}`);
    if (g.status !== 'proposed') fail('GRANT_NOT_PROPOSED', `grant ${g.grant_id} is ${g.status}, not a proposal awaiting ratification`);
    ratifyGrant(ctx, g);
  },

  judgment(ctx, e) {
    const g = ctx.state.grants[e.grant_id] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(e.grant_id)}`);
    if (!RATINGS.includes(e.rating)) fail('JUDGMENT_INVALID', `rating must be one of ${RATINGS.join(', ')}, got ${JSON.stringify(e.rating)}`);
    if (!isPosInt(e.cycle) || e.cycle > ctx.state.cycle) fail('JUDGMENT_INVALID', `cycle must be a past or current cycle (1..${ctx.state.cycle})`);
    if (g.ratified_cycle === null || e.cycle < g.ratified_cycle || (g.ended_cycle !== null && e.cycle > g.ended_cycle)) {
      fail('JUDGMENT_INVALID', `grant ${g.grant_id} was not funded in cycle ${e.cycle}`);
    }
    g.judgments[String(e.cycle)] = e.rating; // a later rating for the same cycle is the correction
  },

  cycle_close(ctx, e) {
    if (e.cycle !== ctx.state.cycle) fail('CYCLE_MISMATCH', `cycle ${ctx.state.cycle} is open; cannot close cycle ${e.cycle}`);
    ctx.state.closed_cycles.push(e.cycle);
    ctx.state.cycle += 1;
  },

  release(ctx, e) {
    if (ctx.state.frozen) fail('LEDGER_FROZEN', 'no releases while the ledger is frozen');
    const g = liveGrant(ctx, e.grant_id);
    const t = trancheOf(g, e.tranche);
    if (t.released) fail('TRANCHE_ALREADY_RELEASED', `tranche ${t.index} of ${g.grant_id} is already released`);
    const prev = g.tranches[t.index - 2];
    if (prev.reverted) fail('PROOF_REVERTED', `tranche ${prev.index}'s proof was reverted; it cannot unlock tranche ${t.index}`);
    if (!prev.proven) fail('TRANCHE_LOCKED', `tranche ${t.index} of ${g.grant_id} needs tranche ${prev.index}'s named proof first`);
    releaseTranche(ctx, g, t);
  },

  proof(ctx, e) {
    const g = liveGrant(ctx, e.grant_id);
    const t = trancheOf(g, e.tranche);
    if (!t.released) fail('TRANCHE_NOT_RELEASED', `tranche ${t.index} of ${g.grant_id} is not released`);
    if (t.proven) fail('PROOF_ALREADY_USED', `tranche ${t.index} of ${g.grant_id} is already proven (${t.proof_id})`);
    const errors = validateRecordedProof(e.proof);
    if (errors.length) fail('PROOF_INVALID', errors.join('; '));
    if (!proofMatches(t.named_proof, e.proof)) {
      fail('PROOF_MISMATCH', `tranche ${t.index} needs ${t.named_proof.kind} ${t.named_proof.ref}, got ${e.proof.kind} ${e.proof.ref}`);
    }
    const key = `${e.proof.kind}:${e.proof.ref}`;
    if (ctx.usedProofs.has(key)) fail('PROOF_ALREADY_USED', `${e.proof.ref} already unlocked a tranche`);
    ctx.usedProofs.add(key);
    t.proven = true;
    t.proof_id = qualifiedSurfaceId(e.proof.ref, e.proof.sha);
    t.proof = { kind: e.proof.kind, ref: e.proof.ref, sha: e.proof.sha };
    t.proof_cycle = ctx.state.cycle;
    g.last_proof_cycle = ctx.state.cycle;
  },

  proof_revert(ctx, e) {
    const g = ctx.state.grants[e.grant_id] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(e.grant_id)}`);
    const t = trancheOf(g, e.tranche);
    if (!t.proven) fail('PROOF_NOT_FOUND', `tranche ${t.index} of ${g.grant_id} has no proof to revert`);
    if (t.reverted) fail('PROOF_ALREADY_REVERTED', `tranche ${t.index} of ${g.grant_id} is already reverted`);
    t.reverted = true;
    t.revert_cycle = ctx.state.cycle;
  },

  // A draw while frozen is accepted only for a session that started before the freeze
  // (after_freeze: true, run_started_seq < the freeze event's seq): that spend already happened,
  // so it counts against its grant instead of hiding as unmetered (Greg decision 2026-11-14).
  draw(ctx, e) {
    if (ctx.state.frozen) {
      const preFreeze = e.after_freeze === true && isPosInt(e.run_started_seq) && e.run_started_seq < ctx.state.frozen_at_seq;
      if (!preFreeze) fail('LEDGER_FROZEN', 'the ledger is frozen; no draws (only a session started before the freeze may record its draw, marked after_freeze)');
    }
    for (const f of ['run_id', 'session_id', 'result_uuid', 'company', 'mission_id', 'price_table_version']) {
      if (!isNonEmptyString(e[f])) fail('DRAW_INVALID', `draw.${f} is required`);
    }
    if (e.idem_key !== drawIdemKey(e.run_id, e.session_id, e.result_uuid)) {
      fail('DRAW_IDEM_KEY', 'a draw idem_key must be drawIdemKey(run_id, session_id, result_uuid)');
    }
    if (!isNonNegInt(e.fu)) fail('DRAW_INVALID', 'draw.fu must be a non-negative integer');
    if (!Array.isArray(e.raw) || e.raw.length === 0) fail('DRAW_INVALID', 'draw.raw (normalized per-model counts) is required');
    if (!e.model_usage || typeof e.model_usage !== 'object') fail('DRAW_INVALID', 'draw.model_usage (verbatim) is required');
    checkConfigRefs(ctx, e);
    const g = liveGrant(ctx, e.grant_id);
    if (g.mission_id !== e.mission_id) fail('MISSION_MISMATCH', `grant ${g.grant_id} funds mission ${g.mission_id}, not ${e.mission_id}`);
    if (g.company !== e.company) fail('COMPANY_MISMATCH', `grant ${g.grant_id} belongs to ${g.company}, not ${e.company}`);
    if (e.fu > available(g)) {
      fail('TRANCHE_EXHAUSTED', `draw of ${e.fu} FU exceeds the ${available(g)} FU left in ${g.grant_id}'s released tranches`);
    }
    g.drawn_fu += e.fu;
    bump(g.fu_by_cycle, String(ctx.state.cycle), e.fu);
  },

  // Real spend above a run's soft cap. Accepted even when frozen or exhausted: refusing it would
  // hide burn that already happened. Paid by the pool now, recovered from the next tranche.
  overrun(ctx, e) {
    const drawKey = drawIdemKey(e.run_id, e.session_id, e.result_uuid);
    if (e.idem_key !== `${drawKey}:overrun`) fail('OVERRUN_IDEM_KEY', 'an overrun idem_key must be overrunIdemKey(run_id, session_id, result_uuid)');
    const d = ctx.idem.get(drawKey);
    if (!d || d.type !== 'draw') fail('OVERRUN_WITHOUT_DRAW', `no draw ${drawKey} precedes this overrun`);
    if (!isPosInt(e.fu)) fail('INVALID_AMOUNT', 'overrun.fu must be a positive integer');
    checkConfigRefs(ctx, e);
    const g = ctx.state.grants[d.grant_id];
    g.overrun_fu += e.fu;
    g.overrun_outstanding_fu += e.fu;
    bump(g.overrun_by_cycle, String(ctx.state.cycle), e.fu);
    const pool = ctx.state.pool;
    pool.balance_fu -= e.fu;
    if (pool.reserves) {
      const fromReserve = Math.min(e.fu, pool.reserves.overrun_fu);
      pool.reserves.overrun_fu -= fromReserve;
      if (fromReserve < e.fu) {
        ctx.state.warnings.push(`seq ${e.seq}: overrun of ${e.fu} FU exceeded the overrun reserve by ${e.fu - fromReserve} FU (taken from general fuel)`);
      }
    }
    recomputeGeneral(pool);
    if (!pool.infinite && pool.balance_fu < 0) {
      ctx.state.warnings.push(`seq ${e.seq}: overrun took the pool to ${pool.balance_fu} FU`);
    }
  },

  unmetered(ctx, e) {
    for (const f of ['company', 'run_id', 'session_id', 'reason']) {
      if (!isNonEmptyString(e[f])) fail('UNMETERED_INVALID', `unmetered.${f} is required`);
    }
    ctx.state.unmetered.push({ seq: e.seq, cycle: ctx.state.cycle, company: e.company, run_id: e.run_id, session_id: e.session_id,
      grant_id: e.grant_id || null, reason: e.reason });
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

// close / return / reclaim end a grant and credit its undrawn released fuel back to the pool
// (general fuel) and to the company's next request (state.credits). A proposal can be closed or
// returned (nothing was released); only an open grant can be reclaimed.
for (const [type, status] of [['close', 'closed'], ['return', 'returned'], ['reclaim', 'reclaimed']]) {
  handlers[type] = (ctx, e) => {
    const g = ctx.state.grants[e.grant_id] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(e.grant_id)}`);
    const endable = g.status === 'open' || (g.status === 'proposed' && type !== 'reclaim');
    if (!endable) fail('GRANT_NOT_OPEN', `grant ${g.grant_id} is ${g.status}; it cannot be ${status}`);
    const undrawn = available(g);
    ctx.state.pool.balance_fu += undrawn;
    recomputeGeneral(ctx.state.pool);
    if (undrawn > 0) bump(ctx.state.credits, g.company, undrawn);
    g.returned_fu = undrawn;
    g.status = status;
    g.ended_cycle = ctx.state.cycle;
  };
}

/** Apply one stored event (envelope included) to the context. Throws LedgerError if invalid. */
function applyEvent(ctx, e) {
  const h = handlers[e.type] || fail('UNKNOWN_TYPE', `unknown event type ${JSON.stringify(e.type)}`);
  h(ctx, e);
  ctx.idem.set(e.idem_key, e);
  ctx.state.counts[e.type] = (ctx.state.counts[e.type] || 0) + 1;
  ctx.count += 1;
}

module.exports = { GENESIS_SHA256, LedgerError, createFoldContext, applyEvent, drawIdemKey, overrunIdemKey, handlers, RATINGS,
  LIMIT_KEYS, GENESIS_DEFAULTS, validateLimits };
