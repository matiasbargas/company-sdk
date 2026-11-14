'use strict';

// Betting-cycle mechanics: ratification (proposal ≠ drawable), cycle close (reclaim after
// reclaimCyclesWithoutProof dry cycles, envelope top-up), return on close/kill with company credit,
// small-bet and overrun reserves on a finite envelope, judgment events.

const { openLedger, drawIdemKey } = require('../src/ledger');
const { closeCycle, planCycleClose, endGrant } = require('../src/cycle');
const { createSuite } = require('./_helpers');
const { FIXED_NOW, ledgerFile, fund, grant, draw, proof } = require('./_fixtures');

const t = createSuite('cycle');
const LIMITS = { envelopePerCycle: 1000, reclaimCyclesWithoutProof: 1, smallBetReserve: 0, overrunReserve: 0, proofRevertCommits: 10 };
const open = (limits = LIMITS) => openLedger(ledgerFile(), { limits, now: FIXED_NOW });
const proposal = (o = {}) => grant({ actor: 'agent', ...o });
const ratify = (id = 'g1', actor = 'holding-owner') => ({ type: 'ratify', actor, idem_key: `ratify-${id}-${actor}`, grant_id: id });

// @covers cap-po-grant-002 — a grant proposed at the Betting Table but not ratified by the holding Owner is not drawable
{
  const L = open({ envelopePerCycle: null });
  L.append(proposal());
  const g = L.fold().grants.g1;
  t.eq(g.status, 'proposed', 'an agent-authored grant is a proposal');
  t.deepEq(g.tranches.map(x => x.released), [false, false, false], 'a proposal releases nothing');
  t.throwsCode(() => L.append(draw(1)), 'GRANT_NOT_RATIFIED', 'draw on an unratified grant refused');
  for (const actor of ['agent', 'runner', 'company-owner', 'Greg (CEO)']) {
    t.throwsCode(() => L.append(ratify('g1', actor)), 'OWNER_ONLY', `${actor} cannot ratify`);
  }
  L.append(ratify());
  const r = L.fold().grants.g1;
  t.eq(r.status, 'open', 'ratified grant is open');
  t.eq(r.ratified_cycle, 1, 'ratification cycle recorded');
  t.deepEq(r.tranches.map(x => x.released), [true, false, false], 'ratification releases tranche 1 only');
  t.eq(L.append(draw(10)).appended, true, 'draw succeeds after ratification');
  t.throwsCode(() => L.append({ ...ratify(), idem_key: 'again' }), 'GRANT_NOT_PROPOSED', 'a grant is ratified once');
  // the holding Owner authoring a grant is its own ratification (the Owner is the ratifier)
  const L2 = open({ envelopePerCycle: null });
  L2.append(grant());
  t.eq(L2.fold().grants.g1.status, 'open', 'a holding-Owner-authored grant is ratified on entry');
  // a proposal is still validated: malformed proposals are refused
  t.throwsCode(() => L.append(proposal({ grant_id: 'g2', idem_key: 'p-g2', kill_condition: '' })), 'GRANT_MALFORMED', 'malformed proposal refused');
}

// @covers cap-po-grant-003 — undrawn FU is reclaimed at cycle close after reclaimCyclesWithoutProof cycles without new proof
{
  const L = open();
  L.append(fund(1000));
  L.append(grant());                                  // g1: no proof this cycle
  L.append(grant({ grant_id: 'g2', idem_key: 'grant-g2', company: 'beta', mission_id: 'm2',
    tranches: [{ size_fu: 100, proof: { kind: 'verified_surface', ref: 'beta/S-1' } }] }));
  L.append(draw(30));
  L.append({ ...proof(1, 'beta/S-1'), grant_id: 'g2' });
  const plan = planCycleClose(L.fold(), LIMITS);
  t.deepEq(plan.reclaims.map(r => [r.grant_id, r.undrawn_fu]), [['g1', 70]], 'plan reclaims g1 only (g2 proved this cycle)');
  const before = L.fold().pool.balance_fu;
  const res = closeCycle(L, { limits: LIMITS });
  t.eq(res.closed_cycle, 1, 'cycle 1 closed');
  const s = L.fold();
  t.eq(s.cycle, 2, 'cycle counter advanced');
  t.eq(s.grants.g1.status, 'reclaimed', 'g1 reclaimed');
  t.eq(s.grants.g1.returned_fu, 70, 'undrawn FU reclaimed');
  t.eq(s.credits.acme, 70, 'returned fuel is credited to the company');
  t.eq(s.grants.g2.status, 'open', 'g2 kept (new proof this cycle)');
  const reclaim = L.read().find(e => e.type === 'reclaim');
  t.eq(reclaim.actor, 'holding-owner', 'reclaim written by the holding Owner tool');
  t.eq(reclaim.cycle, 1, 'reclaim names the cycle');
  // envelope top-up for cycle 2: pool back to the envelope
  const fundEv = L.read().filter(e => e.type === 'fund').pop();
  t.eq(fundEv.cycle, 2, 'top-up fund names the next cycle');
  t.eq(s.pool.balance_fu, 1000, `pool topped up to envelope (was ${before + 70} after reclaim)`);
  // g2 dry in cycle 2 → reclaimed at close of cycle 2
  closeCycle(L, { limits: LIMITS });
  t.eq(L.fold().grants.g2.status, 'reclaimed', 'g2 reclaimed after one dry cycle');
  // re-running a close does not double-reclaim (cycle 3 has nothing open)
  const r3 = closeCycle(L, { limits: LIMITS });
  t.eq(r3.reclaims.length, 0, 'nothing left to reclaim');
}

// @covers cap-po-grant-003 — reclaimCyclesWithoutProof: 2 keeps a dry grant one more cycle; null never reclaims
{
  const lim2 = { ...LIMITS, reclaimCyclesWithoutProof: 2 };
  const L = open(lim2);
  L.append(fund(1000));
  L.append(grant());
  closeCycle(L, { limits: lim2 });
  t.eq(L.fold().grants.g1.status, 'open', 'one dry cycle < 2: kept');
  closeCycle(L, { limits: lim2 });
  t.eq(L.fold().grants.g1.status, 'reclaimed', 'two dry cycles: reclaimed');
  const limN = { ...LIMITS, reclaimCyclesWithoutProof: null };
  const L2 = open(limN);
  L2.append(fund(1000));
  L2.append(grant());
  closeCycle(L2, { limits: limN }); closeCycle(L2, { limits: limN });
  t.eq(L2.fold().grants.g1.status, 'open', 'null: never reclaimed by cycle count');
}

// @covers cap-po-grant-003 — unspent fuel returns to the pool on close or kill, credited to the company
{
  const L = open({ envelopePerCycle: null });
  L.append(grant());
  L.append(draw(40));
  endGrant(L, 'g1', { kill: true, reason: 'kill condition met' });
  const s = L.fold();
  t.eq(s.grants.g1.status, 'returned', 'kill returns the grant');
  t.eq(s.grants.g1.returned_fu, 60, 'undrawn FU returned');
  t.eq(s.credits.acme, 60, 'company credited');
  t.eq(L.read().pop().reason, 'kill condition met', 'kill reason recorded');
  t.throwsCode(() => endGrant(L, 'g1', {}), 'GRANT_NOT_OPEN', 'an ended grant cannot end again');
}

// @covers cap-po-reserve-001 — finite envelope: the small-bet reserve funds a small grant when large grants took the rest
{
  const lim = { ...LIMITS, smallBetReserve: 0.2, overrunReserve: 0.05, smallBetMax: 100 };
  const L = open(lim);
  L.append(fund(1000));
  const p = L.fold().pool;
  t.deepEq([p.reserves.small_bet_fu, p.reserves.overrun_fu, p.general_fu], [200, 50, 750], 'fund carves the reserves');
  const big = (id, size) => grant({ grant_id: id, idem_key: `grant-${id}`, appetite_fu: size,
    tranches: [{ size_fu: size, proof: { kind: 'verified_surface', ref: `acme/${id}` } }] });
  L.append(big('L1', 750));
  t.eq(L.fold().pool.general_fu, 0, 'large grant consumed the non-reserved fuel');
  t.throwsCode(() => L.append(big('L2', 150)), 'POOL_INSUFFICIENT', 'a large grant cannot touch the reserves');
  L.append(big('S1', 100));
  const q = L.fold().pool;
  t.eq(q.reserves.small_bet_fu, 100, 'small grant funded from the small-bet reserve');
  t.eq(q.balance_fu, 150, 'pool balance accounts for every bucket');
  // overrun reserve pays overruns; when empty, the pool says so (runs refuse to start)
  const d = draw(100, { grant_id: 'L1', run_id: 'r1', session_id: 's1', result_uuid: 'u1' });
  L.append({ ...d, mission_id: 'm1' });
  L.append({ type: 'overrun', actor: 'runner', idem_key: `${drawIdemKey('r1', 's1', 'u1')}:overrun`, run_id: 'r1', session_id: 's1', result_uuid: 'u1', fu: 30 });
  t.eq(L.fold().pool.reserves.overrun_fu, 20, 'overrun paid from the overrun reserve');
  t.eq(L.fold().pool.overrun_reserve_empty, false, 'reserve not yet empty');
  L.append({ ...draw(10, { grant_id: 'L1', run_id: 'r2', session_id: 's2', result_uuid: 'u2' }) });
  L.append({ type: 'overrun', actor: 'runner', idem_key: `${drawIdemKey('r2', 's2', 'u2')}:overrun`, run_id: 'r2', session_id: 's2', result_uuid: 'u2', fu: 25 });
  const o = L.fold().pool;
  t.eq(o.reserves.overrun_fu, 0, 'reserve drained');
  t.eq(o.overrun_reserve_empty, true, 'overrun reserve empty is flagged (overruns stop)');
  t.assert(L.fold().warnings.some(w => w.includes('overrun reserve')), 'overflow beyond the reserve is warned, never hidden');
  // infinite fuel: no reserves at all
  const Li = open({ ...lim, envelopePerCycle: null });
  Li.append(fund(1000));
  t.eq(Li.fold().pool.reserves, null, 'infinite fuel carries no reserves');
}

// @covers cap-po-reserve-001 — the envelope top-up refills reserves to target before general fuel
{
  const lim = { ...LIMITS, smallBetReserve: 0.2, overrunReserve: 0.05, smallBetMax: 100 };
  const L = open(lim);
  L.append(fund(1000));
  L.append(grant({ appetite_fu: 750, tranches: [{ size_fu: 750, proof: { kind: 'verified_surface', ref: 'acme/X' } }] }));
  L.append(proof(1, 'acme/X'));
  closeCycle(L, { limits: lim });
  const p = L.fold().pool;
  t.deepEq([p.balance_fu, p.reserves.small_bet_fu, p.reserves.overrun_fu, p.general_fu], [1000, 200, 50, 750],
    'reserves stay at target; top-up restores the envelope');
}

// @covers cap-po-judgment-001 — the company Owner rates a funded bet per cycle; ratings are ledger events
{
  const L = open({ envelopePerCycle: null });
  L.append(grant());
  const j = (rating, idem, actor = 'company-owner', cycle = 1) => ({ type: 'judgment', actor, idem_key: idem, grant_id: 'g1', cycle, rating });
  t.throwsCode(() => L.append(j('advanced', 'j0', 'agent')), 'ACTOR_NOT_ALLOWED', 'agents cannot rate');
  t.throwsCode(() => L.append(j('great', 'j1')), 'JUDGMENT_INVALID', 'rating must be advanced|flat|regressed');
  t.throwsCode(() => L.append(j('flat', 'j2', 'company-owner', 5)), 'JUDGMENT_INVALID', 'cannot rate a future cycle');
  L.append(j('flat', 'j3'));
  L.append(j('advanced', 'j4'));
  t.eq(L.fold().grants.g1.judgments['1'], 'advanced', 'a later rating is the correction (last wins)');
}

// @covers cap-po-killswitch-001 — frozen: a session started before the freeze records its draw (after_freeze); any other draw is refused
{
  const L = open({ envelopePerCycle: null });
  L.append(grant());
  const startedAt = L.read().length;
  L.append({ type: 'freeze', actor: 'holding-owner', idem_key: 'fz', reason: 'halt' });
  const frozenAt = L.read().length;
  t.throwsCode(() => L.append(draw(5)), 'LEDGER_FROZEN', 'plain draw refused while frozen');
  t.throwsCode(() => L.append(draw(5, { after_freeze: true, run_started_seq: frozenAt })), 'LEDGER_FROZEN',
    'a session started at/after the freeze cannot claim after_freeze');
  t.throwsCode(() => L.append(draw(5, { after_freeze: true })), 'LEDGER_FROZEN', 'after_freeze needs run_started_seq');
  L.append(draw(5, { after_freeze: true, run_started_seq: startedAt }));
  t.eq(L.fold().grants.g1.drawn_fu, 5, 'pre-freeze session spend counts against its grant');
  t.throwsCode(() => L.append(draw(500, { after_freeze: true, run_started_seq: startedAt })), 'TRANCHE_EXHAUSTED', 'tranche gating still applies');
}

module.exports = t.done();
