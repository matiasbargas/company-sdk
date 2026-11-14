'use strict';

/**
 * cycle.js — Betting-cycle close and grant endings (cap-po-grant-003, cap-po-reserve-001).
 *
 * Closing cycle n, in this order, each step its own idempotent ledger event by the holding Owner:
 *   1. reclaim every open grant whose dry streak reached `reclaimCyclesWithoutProof`
 *      (dry streak at close of n = n − last proof cycle, or n − (ratified cycle − 1) with no proof;
 *       null = never reclaim by cycle count). Reclaim ends the grant; its undrawn released FU goes
 *      back to the pool and is credited to the company's next request (fold.js).
 *   2. `cycle_close { cycle: n }` — the fold moves to cycle n + 1.
 *   3. finite envelope only: `fund` the pool back up to `envelopePerCycle` for cycle n + 1
 *      (top-up, not additive: the envelope is the most a cycle can hold; reserves refill first).
 * Proof-revert scanning needs the company repositories, so callers run proofs.scanReverts first.
 * Limits (reclaimCyclesWithoutProof, envelopePerCycle) are the ones in force in the ledger
 * (`limits` events, fold.js) — never a caller's or settings.json's copy.
 *
 * Re-running after a partial failure is safe: reclaimed grants are no longer open, and every
 * event carries an idem_key derived from the cycle number.
 */

const HOLDING_OWNER = 'holding-owner';

/** Dry streak of an open grant at the close of `cycle`, or null if it was never ratified. */
function dryCycles(g, cycle) {
  if (g.ratified_cycle === null || g.ratified_cycle === undefined) return null;
  const lastGood = g.last_proof_cycle !== null && g.last_proof_cycle !== undefined ? g.last_proof_cycle : g.ratified_cycle - 1;
  return cycle - lastGood;
}

/** Pure plan for closing the current cycle of a folded state (limits default to the ledger's). */
function planCycleClose(state, limits = state.limits) {
  if (!limits) { const err = new Error('LIMITS_REQUIRED: the ledger has no fuel limits'); err.code = 'LIMITS_REQUIRED'; throw err; }
  const cycle = state.cycle;
  const threshold = limits.reclaimCyclesWithoutProof ?? null;
  const reclaims = [];
  if (threshold !== null) {
    if (!Number.isSafeInteger(threshold) || threshold < 1) {
      const err = new Error('LIMITS_INVALID: reclaimCyclesWithoutProof must be a positive integer or null');
      err.code = 'LIMITS_INVALID';
      throw err;
    }
    for (const g of Object.values(state.grants)) {
      if (g.status !== 'open') continue;
      const dry = dryCycles(g, cycle);
      if (dry !== null && dry >= threshold) {
        reclaims.push({ grant_id: g.grant_id, company: g.company, undrawn_fu: g.released_fu - g.drawn_fu, dry_cycles: dry });
      }
    }
  }
  return { cycle, reclaims };
}

/** Close the current cycle on an open ledger. Returns { closed_cycle, reclaims, funded_fu }. */
function closeCycle(ledger) {
  const state = ledger.fold();
  const limits = state.limits;
  const plan = planCycleClose(state, limits);
  const n = plan.cycle;
  for (const r of plan.reclaims) {
    ledger.append({
      type: 'reclaim', actor: HOLDING_OWNER, idem_key: `reclaim:${r.grant_id}:cycle:${n}`, grant_id: r.grant_id, cycle: n,
      reason: `no new proof for ${r.dry_cycles} Betting cycle(s) (reclaimCyclesWithoutProof ${limits.reclaimCyclesWithoutProof})`,
    });
  }
  ledger.append({ type: 'cycle_close', actor: HOLDING_OWNER, idem_key: `cycle_close:${n}`, cycle: n });
  let funded = 0;
  if (Number.isSafeInteger(limits.envelopePerCycle) && limits.envelopePerCycle > 0) {
    const balance = ledger.fold().pool.balance_fu;
    const topUp = limits.envelopePerCycle - balance;
    if (topUp > 0) {
      ledger.append({ type: 'fund', actor: HOLDING_OWNER, idem_key: `fund:cycle:${n + 1}`, amount_fu: topUp, cycle: n + 1,
        reason: `envelope top-up for cycle ${n + 1} (envelopePerCycle ${limits.envelopePerCycle})` });
      funded = topUp;
    }
  }
  return { closed_cycle: n, reclaims: plan.reclaims, funded_fu: funded };
}

/** Close a grant (done) or kill it (`return` with the reason); undrawn FU goes back either way. */
function endGrant(ledger, grantId, opts = {}) {
  const type = opts.kill ? 'return' : 'close';
  const ev = { type, actor: opts.actor || HOLDING_OWNER, idem_key: `${type}:${grantId}`, grant_id: grantId };
  if (opts.reason) ev.reason = opts.reason;
  return ledger.append(ev);
}

module.exports = { planCycleClose, closeCycle, endGrant, dryCycles };
