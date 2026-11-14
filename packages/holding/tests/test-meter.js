'use strict';

// Meter conformance on the recorded 2026-11-13 spike fixtures (C4 asks for recorded-fixture
// contract tests). No network, no claude process.

const fs = require('fs');
const path = require('path');
const { meterStream, priceFu, toLedgerEvents, METER_CONTRACT_VERSION } = require('../src/meter');
const { openLedger } = require('../src/ledger');
const { createSuite } = require('./_helpers');
const { FIXED_NOW, ledgerFile, fund, grant, proof, release } = require('./_fixtures');

const t = createSuite('meter');
const runA = fs.readFileSync(path.join(__dirname, 'fixtures', 'run-a.stream.jsonl'), 'utf8');
const runB = fs.readFileSync(path.join(__dirname, 'fixtures', 'run-b.stream.jsonl'), 'utf8');
const resultOf = (text) => text.split('\n').filter(Boolean).map(JSON.parse).find(m => m.type === 'result');
const PRICE = { version: 'test-2026-11-14', models: { 'claude-opus-5-5': { in: 1, out: 5, cw: 1.25, cr: 0.1 } } };
const ctx = (extra = {}) => ({ runId: 'run-a', grantId: 'g1', missionId: 'm1', company: 'acme', priceTable: PRICE, ...extra });

// @covers cap-po-fuel-001 — raw counts come from result.modelUsage per model; top-level usage (all zeros) is ignored
{
  const res = resultOf(runA);
  t.eq(res.usage.input_tokens + res.usage.output_tokens + res.usage.cache_creation_input_tokens, 0, 'fixture: top-level usage is all zeros');
  const [u] = meterStream(runA);
  t.eq(u.kind, 'usage', 'fixture meters as usage');
  t.eq(u.contract_version, METER_CONTRACT_VERSION, 'usage carries the contract version (C8)');
  t.deepEq(u.raw, [{ model: 'claude-opus-5-5', in: 2, out: 4, cw: 16706, cr: 0 }], 'normalized raw from modelUsage, not zero');
  t.deepEq(u.model_usage, res.modelUsage, 'modelUsage stored verbatim (C3)');
  t.eq(u.session_id, 'e719f5f0-1256-4857-8601-ab37272be6e1', 'session id');
  t.eq(u.result_uuid, res.uuid, 'result uuid');
  t.eq(u.claude_code_version, '2.1.292', 'Claude Code version from the init message (C5)');
  t.eq(u.terminal_reason, 'budget_exhausted', 'terminal reason kept');
  t.eq(u.subtype, 'error_max_budget_usd', 'result subtype kept');
}

// @covers cap-po-fuel-001 — FU = raw x priceTable (session floor counted), price table version recorded on the draw
{
  const [u] = meterStream(runA);
  const p = priceFu(u.raw, PRICE);
  // 2*1 + 4*5 + 16706*1.25 + 0*0.1 = 20904.5 -> ceil -> 20905 (the ~16.7k cache-creation floor dominates)
  t.eq(p.fu, 20905, 'FU = ceil(raw x price ratios)');
  t.eq(p.price_table_version, 'test-2026-11-14', 'price table version recorded');
  const evs = toLedgerEvents(u, ctx());
  t.eq(evs.length, 1, 'one draw, no cap');
  const [d] = evs;
  t.eq(d.type, 'draw', 'draw event');
  t.eq(d.fu, 20905, 'draw FU');
  t.eq(d.price_table_version, 'test-2026-11-14', 'draw records price table version');
  t.deepEq(d.raw, u.raw, 'draw stores raw counts');
  t.deepEq(d.model_usage, u.model_usage, 'draw stores verbatim modelUsage');
  t.eq(d.idem_key, `draw:run-a:${u.session_id}:${u.result_uuid}`, 'C2 idem key');
  t.eq(priceFu(d.raw, PRICE).fu, d.fu, 'FU is recomputable from the stored raw');
}

// @covers cap-po-fuel-001 — two spike runs ingest as two draws; re-ingesting one is idempotent end to end
{
  const L = openLedger(ledgerFile(), { limits: { envelopePerCycle: null }, now: FIXED_NOW });
  L.append(grant({ appetite_fu: 100000, tranches: [{ size_fu: 100000, proof: { kind: 'verified_surface', ref: 'acme/S' } }] }));
  for (const [text, runId] of [[runA, 'run-a'], [runB, 'run-b'], [runA, 'run-a']]) {
    for (const e of toLedgerEvents(meterStream(text)[0], ctx({ runId }))) L.append(e);
  }
  t.eq(L.read().filter(e => e.type === 'draw').length, 2, 'run-a twice + run-b = 2 draws');
  t.eq(L.fold().grants.g1.drawn_fu, 2 * 20905, 'balances reflect each session once');
}

// @covers cap-po-fuel-001 — no usage record / unknown schema fails closed as `unmetered`, never zero (C5)
{
  const res = resultOf(runA);
  const asStream = (r) => JSON.stringify(r) + '\n';
  const cases = [
    ['', 'empty stream'],
    [runA.split('\n').filter(l => !l.includes('"type":"result"')).join('\n'), 'stream without a result message'],
    [asStream({ ...res, modelUsage: undefined, usage: { input_tokens: 9, output_tokens: 9 } }), 'top-level usage only, no modelUsage'],
    [asStream({ ...res, modelUsage: {} }), 'empty modelUsage'],
    [asStream({ ...res, modelUsage: { 'claude-opus-5-5': { inputTokens: '2', outputTokens: 4, cacheReadInputTokens: 0, cacheCreationInputTokens: 1 } } }), 'non-numeric count'],
    [asStream({ ...res, modelUsage: { 'claude-opus-5-5': { outputTokens: 4 } } }), 'missing count fields'],
    ['{"type":"result", broken json\n', 'unparseable result line'],
  ];
  for (const [text, label] of cases) {
    const out = meterStream(text);
    t.eq(out.length, 1, `${label}: one record`);
    t.eq(out[0].kind, 'unmetered', `${label}: unmetered`);
    t.assert(typeof out[0].reason === 'string' && out[0].reason.length > 0, `${label}: reason given`);
    const evs = toLedgerEvents(out[0], ctx());
    t.deepEq(evs.map(e => e.type), ['unmetered'], `${label}: ledger gets an unmetered event, never a zero draw`);
  }
  const pinned = meterStream(runA, { pinnedVersion: '2.1.300' });
  t.eq(pinned[0].kind, 'unmetered', 'Claude Code version other than the pinned one fails closed');
  t.assert(pinned[0].reason.includes('2.1.292'), 'reason names the observed version');
  t.eq(meterStream(runA, { pinnedVersion: '2.1.292' })[0].kind, 'usage', 'pinned version matches');
  const unpriced = toLedgerEvents(meterStream(runA)[0], ctx({ priceTable: { version: 'v0', models: {} } }));
  t.eq(unpriced[0].type, 'unmetered', 'a model missing from the price table is unmetered (fail closed)');
  t.deepEq(unpriced[0].raw, [{ model: 'claude-opus-5-5', in: 2, out: 4, cw: 16706, cr: 0 }], 'raw is still kept on the unmetered record');
}

// @covers cap-po-budget-001 — single turn above the cap: draw up to the cap + overrun for the excess; next tranche reduced
{
  const [u] = meterStream(runA);
  const evs = toLedgerEvents(u, ctx({ capFu: 10000 }));
  t.deepEq(evs.map(e => [e.type, e.fu]), [['draw', 10000], ['overrun', 10905]], 'draw = cap, overrun = excess');
  t.eq(evs[1].idem_key, `${evs[0].idem_key}:overrun`, 'overrun idem key derives from the draw');
  t.eq(toLedgerEvents(u, ctx({ capFu: 30000 })).length, 1, 'under the cap: no overrun');

  const L = openLedger(ledgerFile(), { limits: { envelopePerCycle: 100000 }, now: FIXED_NOW });
  L.append(fund(100000));
  L.append(grant({ appetite_fu: 30000, tranches: [
    { size_fu: 10000, proof: { kind: 'verified_surface', ref: 'acme/SURFACE-1' } },
    { size_fu: 20000, proof: { kind: 'verified_surface', ref: 'acme/SURFACE-2' } },
  ] }));
  t.throwsCode(() => L.append(evs[1]), 'OVERRUN_WITHOUT_DRAW', 'an overrun must follow its draw');
  for (const e of evs) L.append(e);
  let g = L.fold().grants.g1;
  t.eq(g.drawn_fu, 10000, 'drawn up to the cap');
  t.eq(g.overrun_fu, 10905, 'overrun recorded on the grant');
  t.eq(L.fold().pool.balance_fu, 100000 - 10000 - 10905, 'overrun is paid from the pool (reserve) now');
  L.append(proof(1, 'acme/SURFACE-1'));
  L.append(release(2));
  g = L.fold().grants.g1;
  t.eq(g.tranches[1].effective_fu, 20000 - 10905, 'next tranche reduced by the overrun');
  t.eq(g.overrun_outstanding_fu, 0, 'overrun recovered');
  t.eq(L.fold().pool.balance_fu, 100000 - 10000 - 10905 - (20000 - 10905), 'pool outflow equals tranche sizes in total');
}

module.exports = t.done();
