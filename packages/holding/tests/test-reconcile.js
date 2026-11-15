'use strict';

// Spend that leaks past gating (Guardian finding 3) and its visibility (finding 5):
// provisional debits for unmetered sessions, the blocked next tranche, Owner reconciliation against
// provider evidence, and report / health surfacing provisional FU, unreconciled periods, the
// live-estimate caveat and runs whose tools were denied. Async; run.js awaits the promise.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { main } = require('../bin/sdk-holding');
const { openLedger } = require('../src/ledger');
const { buildReport, formatReport } = require('../src/report');
const { holdingHealth } = require('../src/health');
const { createSuite, tmpDir } = require('./_helpers');
const { FIXED_NOW, ledgerFile, grant, draw } = require('./_fixtures');

const t = createSuite('reconcile');
const MODEL = 'claude-opus-5-5';
const PRICE = { version: 'p1', models: { [MODEL]: { in: 1, out: 5, cw: 1.25, cr: 0.1 } }, usd_per_fu: 0.00001 }; // $0.08 floor = 8000 FU
const priceEv = (pt = PRICE, idem = 'pt1') => ({ type: 'price_table', actor: 'holding-owner', idem_key: idem, price_table: pt });
const pinEv = { type: 'runner_pin', actor: 'holding-owner', idem_key: 'pin1', claude_code_version: '2.1.292', session_floor_usd: { [MODEL]: 0.08, 'claude-haiku': 0.01 } };
let n = 0;
const unmetered = (o = {}) => ({ type: 'unmetered', actor: 'runner', idem_key: `um-${++n}`, company: 'acme', grant_id: 'g1', run_id: `r-${n}`,
  session_id: `s-${n}`, reason: 'session killed before a result', model: MODEL, ...o });
const big = () => grant({ tranches: [{ size_fu: 100000, proof: { kind: 'verified_surface', ref: 'acme/S-1' } },
  { size_fu: 100000, proof: { kind: 'graduated_cycle', ref: 'acme/discovery/1' } }], appetite_fu: 200000 });
const proof1 = { type: 'proof', actor: 'holding-owner', idem_key: 'pf1', grant_id: 'g1', tranche: 1, proof: { kind: 'verified_surface', ref: 'acme/S-1', sha: 'abc1234' } };
const release2 = (idem = 'rel2') => ({ type: 'release', actor: 'holding-owner', idem_key: idem, grant_id: 'g1', tranche: 2 });
const reconcileEv = (o = {}) => ({ type: 'reconcile', actor: 'holding-owner', idem_key: `rc-${++n}`, company: 'acme', period: 1, provider_usd: 1,
  provider_fu: 100000, metered_fu: 0, provisional_fu: 0, difference_fu: 100000, ...o });

async function run() {
  // @covers cap-po-reconcile-001 — an unmetered session takes a provisional debit: max(live estimate, session floor)
  {
    const L = openLedger(ledgerFile(), { limits: { envelopePerCycle: null }, now: FIXED_NOW });
    L.append(priceEv()); L.append(pinEv); L.append(big());
    L.append(unmetered({ estimate_fu: 3000 }));
    let g = L.fold().grants.g1;
    t.eq(g.drawn_fu, 8000, 'floor ($0.08 ÷ $0.00001/FU = 8000 FU) beats a 3000 FU live estimate');
    t.eq(g.provisional_fu, 8000, 'charged as provisional');
    const p = L.fold().provisional[0];
    t.deepEq([p.estimate_fu, p.floor_fu, p.fu, p.charged_fu, p.uncharged_fu, p.settled], [3000, 8000, 8000, 8000, 0, false], 'provisional record');
    L.append(unmetered({ estimate_fu: 50000 }));
    t.eq(L.fold().grants.g1.drawn_fu, 58000, 'a larger live estimate wins over the floor');
    L.append(unmetered({ model: 'unknown-model' }));
    t.eq(L.fold().provisional[2].floor_fu, 8000, 'an unknown model takes the largest floor (conservative)');
    L.append(unmetered({ estimate_fu: 90000 }));
    g = L.fold().grants.g1;
    t.eq(g.drawn_fu, 100000, 'the tranche is exhausted by provisional debits (gating no longer leaks)');
    const last = L.fold().provisional[3];
    t.deepEq([last.charged_fu, last.uncharged_fu], [34000, 56000], 'beyond the tranche the rest is recorded as uncharged');
    t.throwsCode(() => L.append(draw(1)), 'PRICE_TABLE_MISMATCH', '(sanity: draws still checked)');
    t.throwsCode(() => L.append(draw(1, { price_table_version: 'p1' })), 'TRANCHE_EXHAUSTED', 'no further draw on the exhausted tranche');
    L.append(proof1);
    t.throwsCode(() => L.append(release2()), 'PROVISIONAL_UNRECONCILED', 'the next tranche is blocked while provisional debits are unreconciled');
    L.append(reconcileEv({ metered_fu: 0, provisional_fu: 156000, provider_fu: 150000, difference_fu: 150000, evidence: 'console:acme:2026-11' }));
    const st = L.fold();
    t.assert(st.provisional.every(x => x.settled), 'reconcile settles the period\'s provisional debits');
    t.eq(st.grants.g1.provisional_open, 0, 'the grant has nothing open');
    t.eq(st.grants.g1.drawn_fu, 100000, 'charged FU stays drawn (conservative)');
    t.eq(L.append(release2()).appended, true, 'tranche 2 releases after reconciliation');
    t.eq(st.reconciliations[0].evidence, 'console:acme:2026-11', 'evidence kept with the reconciliation');
  }

  // @covers cap-po-reconcile-001 — without usd_per_fu the floor is 0 but the debit still blocks; only the Owner records differences
  {
    const L = openLedger(ledgerFile(), { limits: { envelopePerCycle: null }, now: FIXED_NOW });
    L.append(priceEv({ version: 'p0', models: PRICE.models }, 'pt0')); L.append(pinEv); L.append(big());
    L.append(unmetered());
    t.eq(L.fold().provisional[0].fu, 0, 'no usd_per_fu: the floor cannot be priced');
    L.append(proof1);
    t.throwsCode(() => L.append(release2()), 'PROVISIONAL_UNRECONCILED', 'but the next tranche is still blocked');
    t.throwsCode(() => L.append(unmetered({ actor: 'holding-owner' })), 'UNMETERED_INVALID', 'the Owner writes only reconciliation differences');
    t.throwsCode(() => L.append(unmetered({ source: 'reconcile', fu: 5, period: 1 })), 'UNMETERED_INVALID', 'the runner cannot write a reconciliation difference');
    t.throwsCode(() => L.append(reconcileEv({ actor: 'runner' })), 'OWNER_ONLY', 'only the holding Owner reconciles');
    t.throwsCode(() => L.append(reconcileEv({ period: 9 })), 'RECONCILE_INVALID', 'a future period is refused');
    t.throwsCode(() => L.append(unmetered({ estimate_fu: -1 })), 'UNMETERED_INVALID', 'a negative estimate is refused');
  }

  // @covers cap-po-reconcile-001 — `sdk-holding reconcile`: provider usage above the ledger → an unmetered event with the evidence reference
  const base = tmpDir('rc-');
  const root = path.join(base, 'h');
  const H = ['--holding', root];
  const io = async (args, deps = {}) => {
    const out = []; const err = [];
    const code = await main(args, { stdout: (s) => out.push(s), stderr: (s) => err.push(s), env: {}, ...deps });
    return { code, out: out.join('\n'), err: err.join('\n') };
  };
  const file = path.join(root, 'holding/fuel/ledger.jsonl');
  {
    const repo = tmpDir('rc-co-');
    execFileSync('git', ['-C', repo, 'init', '-q']);
    fs.writeFileSync(path.join(repo, 'CHARTER.md'), '- **Ratified by: Ada (Owner) on 2026-11-15**\n');
    await io(['init', root, '--owner', 'Ada']);
    await io(['add-company', repo, '--id', 'acme', '--owner', 'Ada', ...H]);
    const ptFile = path.join(base, 'pt.json');
    fs.writeFileSync(ptFile, JSON.stringify({ version: 'p0', models: PRICE.models }));
    await io(['price-table', 'set', ptFile, ...H]);
    await io(['runner-pin', 'set', '--claude-version', '2.1.292', '--session-floor', `${MODEL}=0.08`, ...H]);
    t.eq((await io(['grant', '--company', 'acme', '--mission', 'm1', '--appetite', '200000', '--tranches', '100000,100000',
      '--proofs', 'surface:S-1,cycle:discovery/1', '--kill', 'k', '--id', 'g1', '--by', 'holding-owner', ...H])).code, 0, 'grant');
    const L = openLedger(file, {});
    L.append(draw(20000, { price_table_version: 'p0', run_id: 'run-ok', session_id: 'sx', result_uuid: 'ux' }));
    L.append(unmetered({ estimate_fu: 12000, run_id: 'run-killed' }));
    const noRate = await io(['reconcile', '--company', 'acme', '--provider-usd', '0.5', '--period', '1', ...H]);
    t.eq(noRate.code, 1, 'reconcile refused without usd_per_fu');
    t.assert(/usd_per_fu/.test(noRate.err) && /price-table set/.test(noRate.err), 'refusal names the missing rate and the fix');
    fs.writeFileSync(ptFile, JSON.stringify(PRICE));
    t.eq((await io(['price-table', 'set', ptFile, ...H])).code, 0, 'price table with usd_per_fu');
    const r = await io(['reconcile', '--company', 'acme', '--provider-usd', '0.5', '--period', '1', '--evidence', 'console.anthropic.com/usage#2026-11-15', ...H]);
    t.eq(r.code, 0, `reconcile (${r.err})`);
    const evs = L.read();
    const rc = evs.find(e => e.type === 'reconcile');
    t.deepEq([rc.provider_fu, rc.metered_fu, rc.provisional_fu, rc.difference_fu], [50000, 20000, 12000, 30000], 'provider 50000 FU vs 20000 metered → 30000 FU difference');
    const um = evs.filter(e => e.type === 'unmetered').pop();
    t.deepEq([um.actor, um.source, um.fu, um.evidence], ['holding-owner', 'reconcile', 30000, 'console.anthropic.com/usage#2026-11-15'],
      'the difference is an unmetered event carrying the evidence reference');
    t.assert(/settled/.test(r.out) && /burn the runner never saw/.test(r.out), 'output explains the settlement and the difference');
    t.eq(L.fold().provisional.every(p => p.settled), true, 'provisional debits settled');
    const rep = buildReport(L.fold(), {});
    t.eq(rep.reconciliations[0].difference_fu, 30000, 'report lists the reconciliation');
    t.deepEq(rep.provisional.unreconciled, [], 'nothing left unreconciled');
  }

  // @covers cap-po-runner-006 — report and health surface denials per run (permission_denials, no_work_denied), provisional FU and the caveat
  {
    const L = openLedger(file, {});
    L.append(unmetered({ estimate_fu: 1000, run_id: 'run-late' }));
    const runs = path.join(root, 'holding/runs');
    fs.mkdirSync(runs, { recursive: true });
    fs.writeFileSync(path.join(runs, 'run-denied.json'), JSON.stringify({ run_id: 'run-denied', company: 'acme', grant_id: 'g1', state: 'done',
      terminal_reason: 'no_work_denied', permission_denials: [{ tool_name: 'Edit' }, { tool_name: 'Bash' }, { tool_name: 'Edit' }] }));
    fs.writeFileSync(path.join(runs, 'run-some.json'), JSON.stringify({ run_id: 'run-some', company: 'acme', state: 'done', terminal_reason: 'done',
      permission_denials: [{ tool_name: 'WebFetch' }] }));
    fs.writeFileSync(path.join(runs, 'run-clean.json'), JSON.stringify({ run_id: 'run-clean', state: 'done', terminal_reason: 'done', permission_denials: [] }));
    fs.writeFileSync(path.join(runs, 'run-denied.state.json'), JSON.stringify({ run_id: 'x', permission_denials: [1, 2] }));
    const rep = JSON.parse((await io(['report', '--json', ...H])).out);
    t.deepEq(rep.runs.map(r => [r.run_id, r.denials, r.no_work]), [['run-denied', 3, true], ['run-some', 1, false]], 'runs with denials, side files ignored');
    t.deepEq(rep.runs[0].denied_tools, ['Edit', 'Bash'], 'denied tools named');
    const acme = rep.companies.find(c => c.id === 'acme');
    t.deepEq([acme.provisional_fu, acme.uncharged_fu, acme.reconciled], [12000 + 8000, 0, true],
      'company: provisional FU charged this cycle (12000 settled + 8000 new: floor 8000 beats the 1000 estimate)');
    t.eq(rep.provisional.unreconciled.length, 1, 'the new unmetered session is unreconciled');
    t.assert(/undercount/.test(rep.provisional.caveat), 'live-estimate caveat present');
    t.eq(rep.bets.find(b => b.grant_id === 'g1').provisional_open, 1, 'bet shows its open provisional debit');
    const txt = formatReport(buildReport(L.fold(), { runs: [JSON.parse(fs.readFileSync(path.join(runs, 'run-denied.json'), 'utf8'))] }));
    t.assert(/ACHIEVED NOTHING \(no_work_denied\)/.test(txt), 'text report: no_work_denied called out');
    t.assert(/Unreconciled unmetered spend/.test(txt) && /sdk-holding reconcile --company acme/.test(txt), 'text report: unreconciled spend with the fix');
    t.assert(/provisional FU is an estimate/.test(txt), 'text report: caveat');
    const health = holdingHealth(root);
    const codes = health.issues.map(i => i.code);
    t.assert(codes.includes('RUN_NO_WORK_DENIED') && codes.includes('RUN_DENIALS'), 'health: denial issues');
    const pu = health.issues.find(i => i.code === 'PROVISIONAL_UNRECONCILED');
    t.assert(pu && pu.capability === 'cap-po-reconcile-001' && /undercount/.test(pu.message) && /--period 1/.test(pu.message), 'health: unreconciled period with caveat and fix');
    t.eq(health.ok, true, 'warnings, not errors');
  }

  return t.done();
}

module.exports = run();
