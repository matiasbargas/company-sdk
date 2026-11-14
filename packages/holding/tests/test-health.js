'use strict';

// holdingHealth(holdingDir): the read-only health surface scripts/health.js calls.

const fs = require('fs');
const path = require('path');
const { openLedger } = require('../src/ledger');
const { closeCycle } = require('../src/cycle');
const { holdingHealth } = require('../src/health');
const { createSuite, tmpDir } = require('./_helpers');
const { FIXED_NOW, grant, draw } = require('./_fixtures');

const t = createSuite('health');
const LIMITS = { envelopePerCycle: null, reclaimCyclesWithoutProof: null, smallBetReserve: 0, smallBetMax: null, overrunReserve: 0,
  proofRevertCommits: 10, concurrency: 1 };

/** A holding root with portfolio.json and a ledger that starts with a `limits` event. */
function holding(companies = [{ id: 'acme', owner: 'Ada' }]) {
  const root = tmpDir('health-');
  const h = path.join(root, 'holding');
  fs.mkdirSync(path.join(h, 'fuel'), { recursive: true });
  fs.writeFileSync(path.join(h, 'portfolio.json'), JSON.stringify({ schema_version: 1, holding: { owner: 'Ada' }, companies }));
  const L = openLedger(path.join(h, 'fuel', 'ledger.jsonl'), { now: FIXED_NOW });
  L.append({ type: 'limits', actor: 'holding-owner', idem_key: 'limits:1', limits: LIMITS });
  return { root, L, file: path.join(h, 'fuel', 'ledger.jsonl') };
}
function bet(L, id, fu) {
  L.append(grant({ grant_id: id, idem_key: `grant-${id}`, mission_id: `m-${id}`, appetite_fu: 2000,
    tranches: [{ size_fu: 1000, proof: { kind: 'verified_surface', ref: `acme/S-${id}` } },
      { size_fu: 1000, proof: { kind: 'graduated_cycle', ref: `acme/discovery/${id}` } }] }));
  L.append(draw(fu, { grant_id: id, mission_id: `m-${id}`, run_id: `r-${id}-${fu}` }));
  L.append({ type: 'proof', actor: 'holding-owner', idem_key: `pf-${id}`, grant_id: id, tranche: 1, proof: { kind: 'verified_surface', ref: `acme/S-${id}`, sha: 'abc1234' } });
}
const judge = (L, id, rating, cycle) => L.append({ type: 'judgment', actor: 'company-owner', idem_key: `j-${id}-${cycle}`, grant_id: id, cycle, rating });
const codes = (r) => r.issues.map(i => i.code);

// a healthy holding, and one that does not exist
{
  const { root } = holding();
  const r = holdingHealth(root);
  t.eq(r.ok, true, 'fresh holding is healthy');
  t.deepEq(r.issues, [], 'no issues');
  t.eq(holdingHealth(path.join(root, 'holding')).ok, true, 'holding/ itself is accepted too');
  const none = holdingHealth(tmpDir('health-none-'));
  t.deepEq([none.ok, codes(none)], [false, ['NO_HOLDING']], 'missing holding reported');
}

// @covers cap-po-ledger-001 — health reports a broken chain naming the line
{
  const { root, L, file } = holding();
  bet(L, 'b1', 100);
  const lines = fs.readFileSync(file, 'utf8').split('\n');
  lines[1] = lines[1].replace('"mission_id":"m-b1"', '"mission_id":"m-xx"');
  fs.writeFileSync(file, lines.join('\n'));
  const r = holdingHealth(root);
  t.eq(r.ok, false, 'broken chain is an error');
  t.deepEq(codes(r), ['CHAIN_BROKEN'], 'CHAIN_BROKEN');
  t.assert(/line 2/.test(r.issues[0].message), 'names the line');
}

// @covers cap-po-judgment-001 — a funded bet left unrated at cycle close: sdk-health flags the unfilled judgment column
{
  const { root, L } = holding();
  bet(L, 'b1', 100); bet(L, 'b2', 200);
  judge(L, 'b2', 'advanced', 1);
  t.eq(codes(holdingHealth(root)).includes('JUDGMENT_UNFILLED'), false, 'an open cycle is not flagged yet');
  closeCycle(L);
  const r = holdingHealth(root);
  const i = r.issues.find(x => x.code === 'JUDGMENT_UNFILLED');
  t.assert(!!i, 'unfilled judgment column flagged after close');
  t.assert(i && i.message.includes('b1') && !i.message.includes('b2,'), 'names the unrated bet only');
  t.eq(i && i.capability, 'cap-po-judgment-001', 'tagged with the capability');
  t.eq(r.ok, true, 'a warning, not an error');
  judge(L, 'b1', 'flat', 1);
  t.eq(codes(holdingHealth(root)).includes('JUDGMENT_UNFILLED'), false, 'rating it clears the flag');
}

// @covers cap-po-proof-002 — divergence in 2 consecutive cycles: sdk-health reports the outside-verifier decision is due
{
  const { root, L } = holding();
  ['e1', 'e2', 'e3'].forEach((id, i) => bet(L, id, (i + 1) * 100));
  judge(L, 'e1', 'regressed', 1); judge(L, 'e2', 'advanced', 1); judge(L, 'e3', 'advanced', 1);
  closeCycle(L);
  t.eq(codes(holdingHealth(root)).includes('REVISIT_TRIGGER'), false, 'one divergent cycle: not yet');
  ['e1', 'e2', 'e3'].forEach((id, i) => {
    L.append({ type: 'release', actor: 'holding-owner', idem_key: `rel-${id}`, grant_id: id, tranche: 2 });
    L.append(draw((i + 1) * 100, { grant_id: id, mission_id: `m-${id}`, run_id: `r2-${id}` }));
    L.append({ type: 'proof', actor: 'holding-owner', idem_key: `pf2-${id}`, grant_id: id, tranche: 2, proof: { kind: 'graduated_cycle', ref: `acme/discovery/${id}`, sha: 'abc1234' } });
  });
  judge(L, 'e1', 'flat', 2); judge(L, 'e2', 'advanced', 2); judge(L, 'e3', 'advanced', 2);
  closeCycle(L);
  const r = holdingHealth(root);
  const i = r.issues.find(x => x.code === 'REVISIT_TRIGGER');
  t.assert(!!i && /outside-verifier decision due/.test(i.message) && /proof self-verification risk/.test(i.message), 'outside-verifier decision due');
  t.assert(i && /cycles 1 and 2/.test(i.message), 'names the consecutive cycles');
  t.eq(i && i.capability, 'cap-po-proof-002', 'tagged with the capability');
}

// @covers cap-po-proof-002 — a second human Owner registered: the decision is due immediately
{
  const { root } = holding([{ id: 'acme', owner: 'Ada' }, { id: 'beta', owner: 'Grace' }]);
  const i = holdingHealth(root).issues.find(x => x.code === 'REVISIT_TRIGGER');
  t.assert(!!i && i.message.includes('Grace'), 'second Owner triggers the revisit, naming the Owner');
}

// @covers cap-po-metric-001 — unmetered sessions in the open cycle are reported (VOF suppressed)
{
  const { root, L } = holding();
  bet(L, 'b1', 100);
  L.append({ type: 'unmetered', actor: 'runner', idem_key: 'um-1', company: 'acme', run_id: 'r9', session_id: 's9', grant_id: 'b1', reason: 'no result' });
  const i = holdingHealth(root).issues.find(x => x.code === 'UNMETERED_THIS_CYCLE');
  t.assert(!!i && i.message.includes('r9') && /suppressed/.test(i.message), 'unmetered this cycle reported with the run');
  closeCycle(L);
  t.eq(codes(holdingHealth(root)).includes('UNMETERED_THIS_CYCLE'), false, 'a new cycle starts clean');
}

// health never writes
{
  const { root, L, file } = holding();
  bet(L, 'b1', 100);
  const before = fs.readFileSync(file, 'utf8');
  holdingHealth(root);
  t.eq(fs.readFileSync(file, 'utf8'), before, 'the ledger is untouched');
  t.eq(fs.existsSync(`${file}.lock`), false, 'no lock left');
}

module.exports = t.done();
