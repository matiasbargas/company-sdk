'use strict';

/** fold/grant-events.js — grant lifecycle: proposal, ratification, release, proof, judgment, endings. */

const { validateGrant, validateRecordedProof, proofMatches, qualifiedSurfaceId } = require('../grants');
const {
  HOLDING_OWNER, RATINGS, fail, isPosInt, isNonEmptyString, liveGrant, trancheOf, releaseTranche, ratifyGrant,
  recomputeGeneral, available, bump,
} = require('./core');

const handlers = {
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
      provisional_fu: 0, provisional_open: 0, provisional_by_cycle: {},
    };
    if (e.actor === HOLDING_OWNER) ratifyGrant(ctx, g); // the holding Owner's own grant is ratified by its author
    ctx.state.grants[g.grant_id] = g;
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

  release(ctx, e) {
    if (ctx.state.frozen) fail('LEDGER_FROZEN', 'no releases while the ledger is frozen');
    const g = liveGrant(ctx, e.grant_id);
    const t = trancheOf(g, e.tranche);
    if (t.released) fail('TRANCHE_ALREADY_RELEASED', `tranche ${t.index} of ${g.grant_id} is already released`);
    const prev = g.tranches[t.index - 2];
    if (prev.reverted) fail('PROOF_REVERTED', `tranche ${prev.index}'s proof was reverted; it cannot unlock tranche ${t.index}`);
    if (!prev.proven) fail('TRANCHE_LOCKED', `tranche ${t.index} of ${g.grant_id} needs tranche ${prev.index}'s named proof first`);
    if (g.provisional_open > 0) {
      fail('PROVISIONAL_UNRECONCILED', `grant ${g.grant_id} has ${g.provisional_open} unmetered session(s) with provisional debits; `
        + 'the holding Owner reconciles them first (sdk-holding reconcile --company <id> --provider-usd <usd> --period <cycle>)');
    }
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
};

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

module.exports = handlers;
