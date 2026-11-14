'use strict';

// Grant shape and tranche gating: tranches + named proof per tranche + kill condition;
// only tranche 1 drawable at grant time; one proof unlocks at most one tranche.

const { validateGrant, qualifiedSurfaceId, PROOF_KINDS } = require('../src/grants');
const { openLedger } = require('../src/ledger');
const { createSuite } = require('./_helpers');
const { FIXED_NOW, ledgerFile, fund, grant, draw, proof, release } = require('./_fixtures');

const t = createSuite('grants');
const open = () => openLedger(ledgerFile(), { limits: { envelopePerCycle: 10000 }, now: FIXED_NOW });
const body = (g) => { const { type, actor, idem_key, ...rest } = g; return rest; };

// @covers cap-po-grant-001 — a grant request without a kill condition (or tranches, or named proofs) is malformed
{
  t.deepEq(validateGrant(body(grant())), { ok: true, errors: [] }, 'well-formed grant validates');
  const { kill_condition, ...noKill } = body(grant());
  const r = validateGrant(noKill);
  t.eq(r.ok, false, 'missing kill condition is malformed');
  t.assert(r.errors.some(e => e.includes('kill_condition')), 'error names kill_condition');
  t.eq(validateGrant({ ...body(grant()), kill_condition: '  ' }).ok, false, 'blank kill condition is malformed');
  t.eq(validateGrant({ ...body(grant()), tranches: [] }).ok, false, 'no tranches is malformed');
  t.eq(validateGrant({ ...body(grant()), tranches: [{ size_fu: 10 }] }).ok, false, 'tranche without a named proof is malformed');
  t.eq(validateGrant({ ...body(grant()), tranches: [{ size_fu: 10, proof: { kind: 'vibes', ref: 'acme/x' } }] }).ok, false,
    'unknown proof kind is malformed');
  t.deepEq(PROOF_KINDS, ['verified_surface', 'graduated_cycle', 'owner_approved_ship'], 'proof kinds');
  t.eq(validateGrant({ ...body(grant()), appetite_fu: 299 }).ok, false, 'tranches summing above appetite are malformed');
  const dupRef = body(grant());
  dupRef.tranches[1].proof = { ...dupRef.tranches[0].proof };
  t.eq(validateGrant(dupRef).ok, false, 'the same named proof on two tranches is malformed (one proof, one tranche)');
  for (const f of ['grant_id', 'company', 'mission_id']) {
    const g = body(grant()); delete g[f];
    t.eq(validateGrant(g).ok, false, `missing ${f} is malformed`);
  }
  const L = open();
  L.append(fund(1000));
  t.throwsCode(() => L.append({ ...grant(), kill_condition: '' }), 'GRANT_MALFORMED', 'ledger refuses a malformed grant');
  t.eq(L.read().length, 1, 'nothing written for a malformed grant');
}

// @covers cap-po-grant-001 — a ratified three-tranche grant: a draw beyond tranche 1 is refused until its proof is recorded
{
  const L = open();
  L.append(fund(1000));
  L.append(grant());
  const s0 = L.fold().grants.g1;
  t.deepEq(s0.tranches.map(x => x.released), [true, false, false], 'only tranche 1 is open at grant time');
  t.eq(L.fold().pool.balance_fu, 900, 'pool debited by tranche 1 only');
  L.append(draw(100));
  t.throwsCode(() => L.append(draw(1)), 'TRANCHE_EXHAUSTED', 'draw beyond tranche 1 refused');
  t.throwsCode(() => L.append(release(2)), 'TRANCHE_LOCKED', 'tranche 2 cannot be released before tranche 1 proof');
  L.append(proof(1, 'acme/SURFACE-1'));
  L.append(release(2));
  t.eq(L.append(draw(1)).appended, true, 'draw succeeds once tranche 1 proof is recorded and tranche 2 released');
}

// @covers cap-po-proof-001 — tranche 1's named surface verified at SHA s unlocks tranche 2; the same surface again unlocks nothing
{
  t.eq(qualifiedSurfaceId('acme/SURFACE-1', 'abc1234'), 'acme/SURFACE-1@abc1234', 'C11 qualified surface id');
  const L = open();
  L.append(fund(1000));
  L.append(grant());
  t.throwsCode(() => L.append(proof(1, 'acme/SURFACE-9')), 'PROOF_MISMATCH', 'a proof other than the named one fails');
  t.throwsCode(() => L.append(proof(1, 'acme/cycle-1', 'abc1234', 'graduated_cycle')), 'PROOF_MISMATCH', 'kind must match too');
  t.throwsCode(() => L.append({ ...proof(1, 'acme/SURFACE-1'), proof: { kind: 'verified_surface', ref: 'acme/SURFACE-1' } }),
    'PROOF_INVALID', 'a proof without a commit SHA fails');
  t.throwsCode(() => L.append(proof(2, 'acme/cycle-1')), 'TRANCHE_NOT_RELEASED', 'a proof for an unreleased tranche fails');
  L.append(proof(1, 'acme/SURFACE-1', 'abc1234'));
  const g = L.fold().grants.g1;
  t.eq(g.tranches[0].proven, true, 'tranche 1 proven');
  t.eq(g.tranches[0].proof_id, 'acme/SURFACE-1@abc1234', 'proof identified by qualified surface id');
  L.append(release(2));
  t.eq(L.fold().grants.g1.tranches[1].released, true, 'tranche 2 becomes drawable');
  // same surface recorded again: by replay (no-op) and as a fresh event at a new SHA (refused)
  t.eq(L.append(proof(1, 'acme/SURFACE-1', 'abc1234')).appended, false, 'replayed proof is a no-op');
  t.throwsCode(() => L.append(proof(1, 'acme/SURFACE-1', 'def5678')), 'PROOF_ALREADY_USED', 'the same surface cannot prove twice');
  t.throwsCode(() => L.append(proof(2, 'acme/SURFACE-1', 'def5678')), 'PROOF_MISMATCH', 'nor prove the next tranche');
  t.throwsCode(() => L.append(release(3)), 'TRANCHE_LOCKED', 'tranche 3 stays locked');
  t.throwsCode(() => L.append({ ...release(2), idem_key: 'again' }), 'TRANCHE_ALREADY_RELEASED', 'a tranche releases once');
}

// @covers cap-po-proof-003 — ledger part: a reverted proof cannot unlock a further tranche
{
  const L = open();
  L.append(fund(1000));
  L.append(grant());
  L.append(proof(1, 'acme/SURFACE-1'));
  L.append({ type: 'proof_revert', actor: 'runner', idem_key: 'rv-1', grant_id: 'g1', tranche: 1, reason: 'reverted 3 commits later' });
  t.eq(L.fold().grants.g1.tranches[0].reverted, true, 'proof marked reverted');
  t.throwsCode(() => L.append(release(2)), 'PROOF_REVERTED', 'reverted proof cannot release tranche 2');
}

module.exports = t.done();
