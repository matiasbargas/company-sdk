'use strict';

// Ledger conformance: append-only, hash-chained (C1), idempotent + serialized (C2), event set (C3),
// owner-only funding, frozen-ledger refusal, infinite fuel at the pool level.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { openLedger, drawIdemKey, GENESIS_SHA256, EVENT_TYPES } = require('../src/ledger');
const { hashCanonical } = require('../src/canonical');
const { createSuite } = require('./_helpers');
const { FIXED_NOW, ledgerFile, fund, grant, draw } = require('./_fixtures');

const t = createSuite('ledger');
const open = (file, limits = { envelopePerCycle: 1000 }, extra = {}) =>
  openLedger(file, { limits, now: FIXED_NOW, ...extra });
const lines = (file) => fs.existsSync(file) ? fs.readFileSync(file, 'utf8').split('\n').filter(Boolean) : [];

// @covers cap-po-ledger-001 — event envelope: schema_version, seq, prev_sha256 chain, own sha256
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  L.append(grant());
  const [e1, e2] = L.read();
  t.eq(e1.schema_version, 1, 'schema_version on every event');
  t.eq(e1.seq, 1, 'seq starts at 1');
  t.eq(e2.seq, 2, 'seq increments');
  t.eq(e1.prev_sha256, GENESIS_SHA256, 'first event chains to genesis');
  t.eq(e2.prev_sha256, e1.sha256, 'second event chains to first');
  const { sha256, ...body } = e2;
  t.eq(sha256, hashCanonical(body), 'sha256 = sha256(canonical(event without sha256))');
  t.eq(e1.ts, FIXED_NOW(), 'timestamp comes from the injected clock');
  t.deepEq(EVENT_TYPES, ['fund', 'grant', 'release', 'draw', 'proof', 'proof_revert', 'overrun', 'reclaim',
    'return', 'close', 'freeze', 'unfreeze', 'unmetered', 'checkpoint', 'ratify', 'judgment', 'cycle_close',
    'limits', 'price_table', 'runner_pin', 'sandbox', 'reconcile', 'commons_publish', 'commons_admit', 'commons_revoke'],
    'C3 event set + ratify (cap-po-grant-002), judgment (cap-po-judgment-001), cycle_close (cap-po-grant-003)');
  t.deepEq(L.verify(), { ok: true, count: 2 }, 'fresh ledger verifies');
}

// @covers cap-po-ledger-001 — same draw ingested twice: N+1 events, balances equal a single ingestion
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  L.append(grant());
  const d = draw(30);
  const n = L.read().length;
  const first = L.append(d);
  const once = JSON.stringify(L.fold());
  const second = L.append({ ...d });
  t.eq(first.appended, true, 'first ingestion appends');
  t.eq(second.appended, false, 'second ingestion does not append');
  t.eq(second.duplicate, true, 'second ingestion reported as duplicate');
  t.eq(second.event.seq, first.event.seq, 'duplicate returns the original event');
  t.eq(L.read().length, n + 1, 'ledger has N+1 events');
  t.eq(JSON.stringify(L.fold()), once, 'balances equal a single ingestion');
  t.eq(L.fold().grants.g1.drawn_fu, 30, 'drawn once');
  // a reopened ledger (a new process) folds to the same state: replay is deterministic
  t.eq(JSON.stringify(open(file).fold()), once, 'replay from disk yields the same balances');
}

// @covers cap-po-ledger-001 — same idem_key with a different payload is a conflict, never a silent overwrite
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  L.append(grant());
  const d = draw(30);
  L.append(d);
  const before = fs.readFileSync(file, 'utf8');
  t.throwsCode(() => L.append({ ...d, fu: 31 }), 'IDEM_CONFLICT', 'conflicting replay rejected');
  t.eq(fs.readFileSync(file, 'utf8'), before, 'nothing written on conflict');
}

// @covers cap-po-ledger-001 — C2: draw idem_key = runId + session_id + result uuid
{
  t.eq(drawIdemKey('r1', 's1', 'u1'), 'draw:r1:s1:u1', 'draw idem key format');
  const L = open(ledgerFile());
  L.append(fund(500));
  L.append(grant());
  t.throwsCode(() => L.append({ ...draw(5), idem_key: 'whatever' }), 'DRAW_IDEM_KEY', 'draw with a non-derived idem_key rejected');
  t.throwsCode(() => L.append({ type: 'fund', actor: 'holding-owner', amount_fu: 1 }), 'MISSING_IDEM_KEY', 'event without idem_key rejected');
  t.throwsCode(() => L.append({ type: 'mint', actor: 'holding-owner', idem_key: 'x' }), 'UNKNOWN_TYPE', 'unknown event type rejected');
}

// @covers cap-po-ledger-001 — a ledger whose line k was edited fails verification at line k
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  L.append(grant());
  L.append(draw(10));
  L.append(draw(20));
  const ls = lines(file);
  ls[2] = ls[2].replace('"fu":10', '"fu":1');
  fs.writeFileSync(file, ls.join('\n') + '\n');
  const v = L.verify();
  t.eq(v.ok, false, 'edited ledger fails verification');
  t.eq(v.line, 3, 'verification fails at the edited line');
  t.throwsCode(() => L.append(draw(1)), 'CHAIN_BROKEN', 'append refused on a broken chain (fail closed)');
  t.throwsCode(() => L.fold(), 'CHAIN_BROKEN', 'fold refused on a broken chain');
}

// @covers cap-po-ledger-001 — a deleted middle line fails at the first line after the gap
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  L.append(fund(1, 'f2'));
  L.append(fund(2, 'f3'));
  const ls = lines(file);
  fs.writeFileSync(file, [ls[0], ls[2]].join('\n') + '\n');
  const v = L.verify();
  t.eq(v.ok, false, 'gap fails verification');
  t.eq(v.line, 2, 'reported at the line after the gap');
}

// @covers cap-po-ledger-001 — checkpoint records the head hash and count it was written against
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  const head = L.read()[0].sha256;
  const { event } = L.append({ type: 'checkpoint', actor: 'holding-owner', idem_key: 'cp-1' });
  t.eq(event.head_sha256, head, 'checkpoint carries head sha');
  t.eq(event.count, 1, 'checkpoint carries event count before it');
  t.eq(L.verify().ok, true, 'ledger with checkpoint verifies');
}

// @covers cap-po-ledger-001 — C2 single writer: an exclusive lock serializes appends
{
  const file = ledgerFile();
  const L = open(file, { envelopePerCycle: 1000 }, { lockTimeoutMs: 60 });
  L.append(fund(500));
  t.eq(fs.existsSync(`${file}.lock`), false, 'lock released after append');
  fs.writeFileSync(`${file}.lock`, 'held by test');
  t.throwsCode(() => L.append(fund(1, 'f2')), 'LOCK_TIMEOUT', 'append waits then fails while another writer holds the lock');
  t.eq(lines(file).length, 1, 'nothing written while locked');
  t.eq(fs.readFileSync(`${file}.lock`, 'utf8'), 'held by test', "a foreign lock is never broken");
  fs.unlinkSync(`${file}.lock`);
  L.append(fund(1, 'f2'));
  t.eq(lines(file).length, 2, 'append succeeds once the lock is free');
}

// @covers cap-po-ledger-001 — concurrent writers from separate processes never fork the chain
{
  const file = ledgerFile();
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const worker = path.join(__dirname, 'fixtures', 'append-worker.js');
  const procs = 4, each = 15;
  const cmd = Array.from({ length: procs }, (_, i) => `"${process.execPath}" "${worker}" "${file}" w${i} ${each} &`).join(' ') + ' wait';
  execFileSync('/bin/sh', ['-c', cmd], { stdio: 'inherit' });
  const L = open(file);
  t.deepEq(L.verify(), { ok: true, count: procs * each }, `${procs} processes x ${each} appends verify as one chain`);
  t.eq(L.fold().pool.funded_fu, procs * each, 'every concurrent fund counted exactly once');
}

// @covers cap-po-ledger-002 — a fund event by any actor other than the holding Owner is rejected; nothing written
{
  const file = ledgerFile();
  const L = open(file);
  for (const actor of ['runner', 'company-owner', 'Greg (CEO)', 'acme/CFO', undefined]) {
    t.throwsCode(() => L.append({ ...fund(100), actor }), 'FUND_NOT_OWNER', `fund by ${actor} rejected`);
  }
  t.eq(fs.existsSync(file) ? lines(file).length : 0, 0, 'nothing written');
  L.append(fund(100));
  t.eq(L.fold().pool.balance_fu, 100, 'holding-owner funds the pool');
  t.throwsCode(() => L.append({ ...fund(0, 'z') }), 'INVALID_AMOUNT', 'fund amount must be a positive integer');
  t.throwsCode(() => L.append({ ...fund(1.5, 'h') }), 'INVALID_AMOUNT', 'fractional FU rejected');
}

// @covers cap-po-killswitch-001 — ledger part: a frozen ledger refuses every draw (only the holding Owner freezes)
{
  const file = ledgerFile();
  const L = open(file);
  L.append(fund(500));
  L.append(grant());
  t.throwsCode(() => L.append({ type: 'freeze', actor: 'runner', idem_key: 'fz', reason: 'x' }), 'OWNER_ONLY', 'only the holding Owner freezes');
  L.append({ type: 'freeze', actor: 'holding-owner', idem_key: 'fz-1', reason: 'halt' });
  t.eq(L.fold().frozen, true, 'ledger is frozen');
  const n = lines(file).length;
  t.throwsCode(() => L.append(draw(5)), 'LEDGER_FROZEN', 'draw refused while frozen');
  t.eq(lines(file).length, n, 'nothing written');
  L.append({ type: 'unmetered', actor: 'runner', idem_key: 'um-1', company: 'acme', run_id: 'r', session_id: 's', reason: 'no result' });
  t.eq(lines(file).length, n + 1, 'records of spend already incurred (unmetered) are still accepted while frozen');
  L.append({ type: 'unfreeze', actor: 'holding-owner', idem_key: 'uf-1', reason: 'resume' });
  t.eq(L.append(draw(5)).appended, true, 'draw accepted after unfreeze');
}

// @covers cap-po-ledger-001 — every draw names a live grant and its mission
{
  const L = open(ledgerFile());
  L.append(fund(500));
  t.throwsCode(() => L.append(draw(5)), 'NO_LIVE_GRANT', 'draw without a grant refused');
  L.append(grant());
  t.throwsCode(() => L.append(draw(5, { mission_id: 'other' })), 'MISSION_MISMATCH', 'draw for another mission refused');
  L.append({ type: 'close', actor: 'holding-owner', idem_key: 'close-g1', grant_id: 'g1' });
  t.throwsCode(() => L.append(draw(5)), 'NO_LIVE_GRANT', 'draw on a closed grant refused');
  t.eq(L.fold().pool.balance_fu, 500, 'close returns undrawn fuel to the pool');
}

// @covers cap-po-fuel-002 — infinite fuel (envelopePerCycle null): no pool refusal, every draw metered, gating still applies
{
  const file = ledgerFile();
  const L = open(file, { envelopePerCycle: null });
  const huge = 4e15;
  L.append(grant({ appetite_fu: huge * 2, tranches: [
    { size_fu: huge, proof: { kind: 'verified_surface', ref: 'acme/SURFACE-1' } },
    { size_fu: huge, proof: { kind: 'verified_surface', ref: 'acme/SURFACE-2' } },
  ] }));
  for (let i = 0; i < 4; i++) L.append(draw(1e15));
  const s = L.fold();
  t.eq(s.pool.infinite, true, 'pool reports infinite');
  t.eq(s.grants.g1.drawn_fu, 4e15, 'draws far beyond any funded amount accepted (nothing was ever funded)');
  t.eq(L.read().filter(e => e.type === 'draw').length, 4, 'every draw is in the ledger');
  t.throwsCode(() => L.append(draw(1)), 'TRANCHE_EXHAUSTED', 'a draw beyond the unproven tranche is still refused');
  const { kill_condition, ...noKill } = grant({ grant_id: 'g2', idem_key: 'grant-g2' });
  t.throwsCode(() => L.append(noKill), 'GRANT_MALFORMED', 'a grant without a kill condition is still malformed');
}

// @covers cap-po-fuel-002 — the finite counterpart: a tranche larger than the pool balance is refused
{
  const L = open(ledgerFile(), { envelopePerCycle: 1000 });
  L.append(fund(50));
  t.throwsCode(() => L.append(grant()), 'POOL_INSUFFICIENT', 'finite pool refuses an unfunded tranche');
}

module.exports = t.done();
