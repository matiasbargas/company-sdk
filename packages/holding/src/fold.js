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
 *
 * Layout: fold/core.js (context, limits, reserves, pool helpers) and one file per event family —
 * fold/config-events.js, fold/grant-events.js, fold/spend-events.js. This file assembles them.
 */

const core = require('./fold/core');
const handlers = {
  ...require('./fold/config-events'),
  ...require('./fold/grant-events'),
  ...require('./fold/spend-events'),
  ...require('./fold/commons-events'),
};

/** Apply one stored event (envelope included) to the context. Throws LedgerError if invalid. */
function applyEvent(ctx, e) {
  const h = handlers[e.type] || core.fail('UNKNOWN_TYPE', `unknown event type ${JSON.stringify(e.type)}`);
  h(ctx, e);
  ctx.idem.set(e.idem_key, e);
  ctx.state.counts[e.type] = (ctx.state.counts[e.type] || 0) + 1;
  ctx.count += 1;
}

module.exports = {
  GENESIS_SHA256: core.GENESIS_SHA256, LedgerError: core.LedgerError, createFoldContext: core.createFoldContext, applyEvent,
  drawIdemKey: core.drawIdemKey, overrunIdemKey: core.overrunIdemKey, handlers, RATINGS: core.RATINGS,
  LIMIT_KEYS: core.LIMIT_KEYS, GENESIS_DEFAULTS: core.GENESIS_DEFAULTS, validateLimits: core.validateLimits,
};
