'use strict';

/** fold/spend-events.js — metered spend: draw, overrun, unmetered. */

const {
  fail, isPosInt, isNonNegInt, isNonEmptyString, isNonNegNumber, drawIdemKey, checkConfigRefs, liveGrant, available, bump,
  recomputeGeneral, sessionFloorFu, HOLDING_OWNER,
} = require('./core');

/**
 * Unmetered spend (finding 3). A session the runner could not meter takes a provisional debit:
 * max(e.estimate_fu — the runner's live estimate, which undercounts — , the session floor in FU),
 * charged to its open grant up to the FU left in its released tranches (the rest is recorded as
 * uncharged). The grant cannot release its next tranche until the holding Owner reconciles the
 * company's period. An `unmetered` written by the holding Owner is a reconciliation difference
 * (source: 'reconcile'): it carries the provider evidence and takes no provisional debit.
 */

module.exports = {
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
    const st = ctx.state;
    if (e.actor === HOLDING_OWNER || e.source === 'reconcile') {
      if (e.actor !== HOLDING_OWNER || e.source !== 'reconcile') fail('UNMETERED_INVALID', 'only the holding Owner records reconciliation differences (source: reconcile)');
      if (!Number.isSafeInteger(e.fu) || e.fu === 0) fail('UNMETERED_INVALID', 'a reconciliation difference needs a non-zero integer fu');
      if (!isPosInt(e.period) || e.period > st.cycle) fail('UNMETERED_INVALID', `period must be a cycle in 1..${st.cycle}`);
      st.unmetered.push({ seq: e.seq, cycle: e.period, company: e.company, run_id: e.run_id, session_id: e.session_id,
        grant_id: null, reason: e.reason, source: 'reconcile', fu: e.fu, evidence: e.evidence || null });
      return;
    }
    if (e.estimate_fu !== undefined && !isNonNegInt(e.estimate_fu)) fail('UNMETERED_INVALID', 'unmetered.estimate_fu must be a non-negative integer');
    st.unmetered.push({ seq: e.seq, cycle: st.cycle, company: e.company, run_id: e.run_id, session_id: e.session_id,
      grant_id: e.grant_id || null, reason: e.reason, source: 'runner' });
    const estimate = e.estimate_fu || 0;
    const floor = sessionFloorFu(st, e.model);
    const fu = Math.max(estimate, floor);
    const g = e.grant_id ? st.grants[e.grant_id] : null;
    let charged = 0;
    if (g && g.status === 'open' && g.company === e.company) {
      charged = Math.max(0, Math.min(fu, available(g)));
      g.drawn_fu += charged;
      g.provisional_fu += charged;
      g.provisional_open += 1;
      bump(g.provisional_by_cycle, String(st.cycle), charged);
    }
    st.provisional.push({ seq: e.seq, cycle: st.cycle, company: e.company, grant_id: g ? g.grant_id : null, run_id: e.run_id,
      estimate_fu: estimate, floor_fu: floor, fu, charged_fu: charged, uncharged_fu: fu - charged, blocks_grant: !!(g && g.status === 'open'),
      settled: false, settled_seq: null });
  },

  // Owner-entered provider usage for one company and period (cap-po-reconcile-001): settles that
  // period's provisional debits. Charged FU stays drawn (the conservative choice); the
  // provider-vs-ledger difference is the following `unmetered` (source: reconcile) event.
  reconcile(ctx, e) {
    const st = ctx.state;
    if (!isNonEmptyString(e.company)) fail('RECONCILE_INVALID', 'reconcile.company is required');
    if (!isPosInt(e.period) || e.period > st.cycle) fail('RECONCILE_INVALID', `period must be a cycle in 1..${st.cycle}`);
    if (!isNonNegNumber(e.provider_usd)) fail('RECONCILE_INVALID', 'provider_usd must be a non-negative number (from the provider console)');
    for (const f of ['provider_fu', 'metered_fu', 'provisional_fu']) {
      if (!isNonNegInt(e[f])) fail('RECONCILE_INVALID', `reconcile.${f} must be a non-negative integer`);
    }
    if (!Number.isSafeInteger(e.difference_fu)) fail('RECONCILE_INVALID', 'reconcile.difference_fu must be an integer');
    let settled = 0;
    for (const p of st.provisional) {
      if (p.settled || p.company !== e.company || p.cycle !== e.period) continue;
      p.settled = true; p.settled_seq = e.seq; settled++;
      const g = p.grant_id && st.grants[p.grant_id];
      if (g && p.blocks_grant) g.provisional_open = Math.max(0, g.provisional_open - 1);
    }
    st.reconciliations.push({ seq: e.seq, company: e.company, period: e.period, provider_usd: e.provider_usd, provider_fu: e.provider_fu,
      metered_fu: e.metered_fu, provisional_fu: e.provisional_fu, difference_fu: e.difference_fu, evidence: e.evidence || null, settled });
  },
};
