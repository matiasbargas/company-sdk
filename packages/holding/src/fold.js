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
 */

const { validateGrant, validateRecordedProof, proofMatches, qualifiedSurfaceId } = require('./grants');

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

function createFoldContext(limits) {
  if (!limits || !('envelopePerCycle' in limits)) {
    fail('LIMITS_REQUIRED', 'limits.envelopePerCycle must be set explicitly (a number, or null for infinite fuel)');
  }
  const infinite = limits.envelopePerCycle === null;
  return {
    state: {
      pool: { infinite, funded_fu: 0, balance_fu: 0 },
      frozen: false,
      grants: {},
      unmetered: [],
      warnings: [],
      counts: {},
    },
    idem: new Map(),        // idem_key -> stored event
    usedProofs: new Set(),  // `${kind}:${ref}` across the whole ledger
    head: GENESIS_SHA256,   // sha256 of the last applied event (set by the ledger after hashing)
    count: 0,
  };
}

function liveGrant(ctx, id) {
  const g = ctx.state.grants[id];
  if (!g || g.status !== 'open') fail('NO_LIVE_GRANT', `no open grant ${JSON.stringify(id)}`);
  return g;
}

function trancheOf(g, n) {
  if (!Number.isSafeInteger(n) || n < 1 || n > g.tranches.length) {
    fail('TRANCHE_INVALID', `grant ${g.grant_id} has no tranche ${JSON.stringify(n)}`);
  }
  return g.tranches[n - 1];
}

function debitPool(ctx, fu, what) {
  const pool = ctx.state.pool;
  if (!pool.infinite && pool.balance_fu < fu) {
    fail('POOL_INSUFFICIENT', `${what} needs ${fu} FU, pool has ${pool.balance_fu} FU`);
  }
  pool.balance_fu -= fu;
}

function releaseTranche(ctx, g, t) {
  const recovered = Math.min(t.size_fu, g.overrun_outstanding_fu);
  const effective = t.size_fu - recovered;
  debitPool(ctx, effective, `tranche ${t.index} of ${g.grant_id}`);
  g.overrun_outstanding_fu -= recovered;
  t.effective_fu = effective;
  t.released = true;
  g.released_fu += effective;
}

const available = (g) => g.released_fu - g.drawn_fu;

const handlers = {
  fund(ctx, e) {
    if (!isPosInt(e.amount_fu)) fail('INVALID_AMOUNT', 'fund amount_fu must be a positive integer');
    ctx.state.pool.funded_fu += e.amount_fu;
    ctx.state.pool.balance_fu += e.amount_fu;
  },

  grant(ctx, e) {
    const { ok, errors } = validateGrant(e);
    if (!ok) fail('GRANT_MALFORMED', errors.join('; '));
    if (ctx.state.frozen) fail('LEDGER_FROZEN', 'no new grants while the ledger is frozen');
    if (ctx.state.grants[e.grant_id]) fail('GRANT_EXISTS', `grant ${e.grant_id} already exists`);
    const g = {
      grant_id: e.grant_id, company: e.company, mission_id: e.mission_id, appetite_fu: e.appetite_fu,
      kill_condition: e.kill_condition, status: 'open',
      tranches: e.tranches.map((t, i) => ({
        index: i + 1, size_fu: t.size_fu, effective_fu: 0, named_proof: { kind: t.proof.kind, ref: t.proof.ref },
        released: false, proven: false, proof_id: null, reverted: false,
      })),
      released_fu: 0, drawn_fu: 0, overrun_fu: 0, overrun_outstanding_fu: 0, returned_fu: 0,
    };
    releaseTranche(ctx, g, g.tranches[0]); // only tranche 1 is drawable at grant time
    ctx.state.grants[g.grant_id] = g;
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
  },

  proof_revert(ctx, e) {
    const g = ctx.state.grants[e.grant_id] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(e.grant_id)}`);
    const t = trancheOf(g, e.tranche);
    if (!t.proven) fail('PROOF_NOT_FOUND', `tranche ${t.index} of ${g.grant_id} has no proof to revert`);
    if (t.reverted) fail('PROOF_ALREADY_REVERTED', `tranche ${t.index} of ${g.grant_id} is already reverted`);
    t.reverted = true;
  },

  draw(ctx, e) {
    if (ctx.state.frozen) fail('LEDGER_FROZEN', 'the ledger is frozen; no draws');
    for (const f of ['run_id', 'session_id', 'result_uuid', 'company', 'mission_id', 'price_table_version']) {
      if (!isNonEmptyString(e[f])) fail('DRAW_INVALID', `draw.${f} is required`);
    }
    if (e.idem_key !== drawIdemKey(e.run_id, e.session_id, e.result_uuid)) {
      fail('DRAW_IDEM_KEY', 'a draw idem_key must be drawIdemKey(run_id, session_id, result_uuid)');
    }
    if (!isNonNegInt(e.fu)) fail('DRAW_INVALID', 'draw.fu must be a non-negative integer');
    if (!Array.isArray(e.raw) || e.raw.length === 0) fail('DRAW_INVALID', 'draw.raw (normalized per-model counts) is required');
    if (!e.model_usage || typeof e.model_usage !== 'object') fail('DRAW_INVALID', 'draw.model_usage (verbatim) is required');
    const g = liveGrant(ctx, e.grant_id);
    if (g.mission_id !== e.mission_id) fail('MISSION_MISMATCH', `grant ${g.grant_id} funds mission ${g.mission_id}, not ${e.mission_id}`);
    if (g.company !== e.company) fail('COMPANY_MISMATCH', `grant ${g.grant_id} belongs to ${g.company}, not ${e.company}`);
    if (e.fu > available(g)) {
      fail('TRANCHE_EXHAUSTED', `draw of ${e.fu} FU exceeds the ${available(g)} FU left in ${g.grant_id}'s released tranches`);
    }
    g.drawn_fu += e.fu;
  },

  // Real spend above a run's soft cap. Accepted even when frozen or exhausted: refusing it would
  // hide burn that already happened. Paid by the pool now, recovered from the next tranche.
  overrun(ctx, e) {
    const drawKey = drawIdemKey(e.run_id, e.session_id, e.result_uuid);
    if (e.idem_key !== `${drawKey}:overrun`) fail('OVERRUN_IDEM_KEY', 'an overrun idem_key must be overrunIdemKey(run_id, session_id, result_uuid)');
    const d = ctx.idem.get(drawKey);
    if (!d || d.type !== 'draw') fail('OVERRUN_WITHOUT_DRAW', `no draw ${drawKey} precedes this overrun`);
    if (!isPosInt(e.fu)) fail('INVALID_AMOUNT', 'overrun.fu must be a positive integer');
    const g = ctx.state.grants[d.grant_id];
    g.overrun_fu += e.fu;
    g.overrun_outstanding_fu += e.fu;
    ctx.state.pool.balance_fu -= e.fu;
    if (!ctx.state.pool.infinite && ctx.state.pool.balance_fu < 0) {
      ctx.state.warnings.push(`seq ${e.seq}: overrun took the pool to ${ctx.state.pool.balance_fu} FU`);
    }
  },

  unmetered(ctx, e) {
    for (const f of ['company', 'run_id', 'session_id', 'reason']) {
      if (!isNonEmptyString(e[f])) fail('UNMETERED_INVALID', `unmetered.${f} is required`);
    }
    ctx.state.unmetered.push({ seq: e.seq, company: e.company, run_id: e.run_id, session_id: e.session_id,
      grant_id: e.grant_id || null, reason: e.reason });
  },

  freeze(ctx) { ctx.state.frozen = true; },
  unfreeze(ctx) { ctx.state.frozen = false; },

  checkpoint(ctx, e) {
    if (e.head_sha256 !== ctx.head || e.count !== ctx.count) {
      fail('CHECKPOINT_MISMATCH', `checkpoint records ${e.count}@${e.head_sha256}, chain is ${ctx.count}@${ctx.head}`);
    }
  },
};

// close / return / reclaim end a grant and credit its undrawn released fuel back to the pool.
for (const [type, status] of [['close', 'closed'], ['return', 'returned'], ['reclaim', 'reclaimed']]) {
  handlers[type] = (ctx, e) => {
    const g = ctx.state.grants[e.grant_id] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(e.grant_id)}`);
    if (g.status !== 'open') fail('GRANT_NOT_OPEN', `grant ${g.grant_id} is already ${g.status}`);
    const undrawn = available(g);
    ctx.state.pool.balance_fu += undrawn;
    g.returned_fu = undrawn;
    g.status = status;
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

module.exports = { GENESIS_SHA256, LedgerError, createFoldContext, applyEvent, drawIdemKey, overrunIdemKey, handlers };
