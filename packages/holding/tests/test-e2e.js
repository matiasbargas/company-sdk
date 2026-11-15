'use strict';

// Single-company v0 acceptance, end to end through the real CLI (bin/sdk-holding.js spawned as a
// child process) against a temp holding and a temp company repo scaffolded by scripts/init.js.
// Every claude session is tests/fixtures/fake-claude.js, configured through settings.json
// `runner.claudeBin` (the CLI spreads settings.runner into createLocalRunner). No tokens, no network.
//
// Bugs found are pinned by failing assertions marked `// E2E-BUG:` (none open: E2E-BUG #1, the
// missing --max-budget-usd/--model on `run`, is fixed and its library bridge removed).
// The D7 sandbox user is not provisioned on test machines, so the runner is configured with
// `allowUnsandboxed: true` (tests only); the sandbox launch itself is pinned in test-runner.js.
//
// Standalone: node packages/holding/tests/test-e2e.js

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync, execFileSync } = require('child_process');
const { openLedger } = require('../src/ledger');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('e2e');
const SDK_ROOT = path.resolve(__dirname, '..', '..', '..');
const CLI = path.join(__dirname, '..', 'bin', 'sdk-holding.js');
const FAKE = path.join(__dirname, 'fixtures', 'fake-claude.js');
const MODEL = 'claude-opus-5-5';
const PRICE = { version: 'e2e-2026-11-14', models: { [MODEL]: { in: 1, out: 5, cw: 1.25, cr: 0.1 } } };
const OK_FU = 21136;      // fake 'ok' session: 3 in, 50 out, 16706 cache-creation → ceil(21135.5)
const SPIKE_A_FU = 20905; // spike run-a (overshoot): 2 in, 4 out, 16706 cache-creation → ceil(20904.5)
const OWNER = 'M';
const GIT_ENV = { GIT_AUTHOR_NAME: 'E2E', GIT_AUTHOR_EMAIL: 'e2e@example.invalid', GIT_COMMITTER_NAME: 'E2E',
  GIT_COMMITTER_EMAIL: 'e2e@example.invalid' };
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const readJsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []);

const base = tmpDir('e2e-');
const root = path.join(base, 'holding-root');
const co = path.join(base, 'acme');
const fakeLog = path.join(base, 'fake.log');
const H = ['--holding', root];
const ledgerFile = path.join(root, 'holding', 'fuel', 'ledger.jsonl');
const settingsFile = path.join(root, 'holding', 'settings.json');

function cli(args) {
  const r = spawnSync(process.execPath, [CLI, ...args], { encoding: 'utf8', env: { ...process.env, ...GIT_ENV }, timeout: 60000 });
  return { code: r.status, out: r.stdout, err: r.stderr };
}
function cliAsync(args) {
  return new Promise((resolve) => {
    const c = spawn(process.execPath, [CLI, ...args], { env: { ...process.env, ...GIT_ENV } });
    let out = ''; let err = '';
    c.stdout.on('data', d => { out += d; });
    c.stderr.on('data', d => { err += d; });
    c.on('close', code => resolve({ code, out, err }));
  });
}
const git = (...a) => execFileSync('git', ['-C', co, ...a], { encoding: 'utf8', env: { ...process.env, ...GIT_ENV } });
const events = () => readJsonl(ledgerFile);
const fold = () => openLedger(ledgerFile, { limits: JSON.parse(fs.readFileSync(settingsFile, 'utf8')).limits.fuel }).fold();
const sessions = () => readJsonl(fakeLog).filter(e => e.event === 'start').length;

/** Point the holding's runner at fake-claude with a scenario. */
function configureRunner(scenario, extraEnv = {}) {
  const s = JSON.parse(fs.readFileSync(settingsFile, 'utf8'));
  s.priceTable = PRICE;
  s.claude = { pinnedVersion: '2.1.292' };
  s.runner = {
    claudeBin: [process.execPath, FAKE], model: MODEL, sessionFloorUsd: { [MODEL]: 0.08 }, freezePollMs: 50, allowUnsandboxed: true,
    env: { FAKE_CLAUDE_SCENARIO: scenario, FAKE_CLAUDE_LOG: fakeLog, ...extraEnv },
  };
  fs.writeFileSync(settingsFile, JSON.stringify(s, null, 2));
}

/** `sdk-holding run` with a per-run budget; `during` runs while the CLI process is alive. */
async function runStep(label, grant, mission, { during } = {}) {
  const args = ['run', 'acme', '--grant', grant, '--mission', mission, '--prompt', `e2e ${label}`, '--max-turns', '5',
    '--max-budget-usd', '1', '--model', MODEL, ...H];
  const p = cliAsync(args);
  if (during) await during();
  const r = await p;
  t.assert(r.code === 0, `${label}: \`sdk-holding run\` exits 0 (code ${r.code}: ${r.err.trim().split('\n')[0]})`);
  return r;
}

async function main() {
  // @covers cap-po-registry-001 cap-po-grant-001 cap-po-grant-002 cap-po-fuel-002 — 1. init holding, add company, grant, ratify
  {
    const init = cli(['init', root, '--owner', OWNER]);
    t.eq(init.code, 0, `init holding (${init.err})`);
    t.assert(/infinite/.test(init.out), 'holding starts with infinite fuel');
    const sc = spawnSync(process.execPath, [path.join(SDK_ROOT, 'scripts', 'init.js'), 'acme', '--output', co, '--idea', 'e2e company'],
      { encoding: 'utf8', env: { ...process.env, ...GIT_ENV }, timeout: 120000 });
    t.eq(sc.status, 0, `company scaffolded by scripts/init.js (${(sc.stderr || '').slice(0, 200)})`);
    const unsigned = cli(['add-company', co, '--id', 'acme', '--owner', OWNER, ...H]);
    t.eq(unsigned.code, 1, 'company with an unratified CHARTER refused');
    const charter = path.join(co, 'CHARTER.md');
    fs.writeFileSync(charter, fs.readFileSync(charter, 'utf8').replace(/Ratified by:\s*_+\s*\(Owner\)\s*on\s*_+/, `Ratified by: ${OWNER} (Owner) on 2026-11-14`));
    git('commit', '-qam', 'ratify CHARTER');
    const add = cli(['add-company', co, '--id', 'acme', '--owner', OWNER, ...H]);
    t.eq(add.code, 0, `add-company (${add.err})`);
    const noKill = cli(['grant', '--company', 'acme', '--mission', 'm1', '--appetite', '31136', '--tranches', `${OK_FU},10000`,
      '--proofs', 'surface:SURFACE-E2E-1,cycle:discovery/1', '--kill', '', ...H]);
    t.assert(noKill.code !== 0, 'grant without a kill condition refused');
    const g = cli(['grant', '--company', 'acme', '--mission', 'm1', '--appetite', '31136', '--tranches', `${OK_FU},10000`,
      '--proofs', 'surface:SURFACE-E2E-1,cycle:discovery/1', '--kill', 'no verified surface in 2 cycles', '--id', 'G1', ...H]);
    t.eq(g.code, 0, `grant proposed (${g.err})`);
    t.eq(fold().grants.G1.status, 'proposed', 'an agent grant is a proposal');
    configureRunner('ok');
    const early = await cliAsync(['run', 'acme', '--grant', 'G1', '--mission', 'm1', '--prompt', 'x', '--max-turns', '5', ...H]);
    t.eq(early.code, 1, 'run on an unratified grant refused');
    const r = cli(['ratify', 'G1', ...H]);
    t.eq(r.code, 0, `ratify (${r.err})`);
    const st = fold().grants.G1;
    t.eq(st.status, 'open', 'ratified grant is open');
    t.eq(st.released_fu, OK_FU, 'only tranche 1 is drawable');
    t.eq(sessions(), 0, 'no session so far');
  }

  // @covers cap-po-fuel-001 cap-po-metric-001 — 2. run → fake session → draw with modelUsage counts; report shows the burn
  {
    const r = await runStep('first run', 'G1', 'm1');
    t.assert(/done/.test(r.out), `run reports done (${r.out.trim()})`);
    const d = events().filter(e => e.type === 'draw');
    t.eq(d.length, 1, 'one draw');
    t.eq(d[0] && d[0].actor, 'runner', 'drawn by the runner');
    t.eq(d[0] && d[0].fu, OK_FU, 'FU from modelUsage × price table');
    t.eq(d[0] && d[0].model_usage[MODEL].cacheCreationInputTokens, 16706, 'verbatim modelUsage counts in the ledger');
    t.eq(sessions(), 1, 'one session spawned');
    const rep = cli(['report', '--json', ...H]);
    t.eq(rep.code, 0, `report (${rep.err})`);
    const acme = JSON.parse(rep.out).companies.find(c => c.id === 'acme');
    t.eq(acme && acme.fu_loaded, OK_FU, 'report shows the burn for acme');
  }

  // @covers cap-po-runner-001 cap-po-proof-001 — 3. tranche 2 locked before proof; verified surface committed → proof → release
  {
    const before = sessions();
    const r = await cliAsync(['run', 'acme', '--grant', 'G1', '--mission', 'm1', '--prompt', 'more', '--max-turns', '5', '--max-budget-usd', '1', ...H]);
    t.eq(r.code, 1, 'run refused: tranche 1 spent, tranche 2 not released');
    t.assert(/no FU left|TRANCHE_EXHAUSTED/.test(r.err), `refusal says the tranche is spent (${r.err.trim()})`);
    t.eq(sessions(), before, 'no session started');
    const miss = cli(['proof', 'G1', '1', ...H]);
    t.eq(miss.code, 1, 'proof refused while the surface is not committed');
    fs.mkdirSync(path.join(co, 'surfaces'), { recursive: true });
    fs.writeFileSync(path.join(co, 'surfaces', 'SURFACE-E2E-1.md'), '---\nid: SURFACE-E2E-1\nstate: verified\n---\n# E2E surface\n');
    git('add', '-A'); git('commit', '-qm', 'verify SURFACE-E2E-1');
    const sha = git('rev-parse', 'HEAD').trim();
    const p = cli(['proof', 'G1', '1', ...H]);
    t.eq(p.code, 0, `proof recorded (${p.err})`);
    t.assert(p.out.includes(sha) && /tranche 2 released/.test(p.out), 'proof names the commit SHA and releases tranche 2');
    t.eq(fold().grants.G1.released_fu, OK_FU + 10000, 'tranche 2 released');
  }

  // @covers cap-po-budget-001 — 4. overshoot (spike run-a stream) → draw up to the open tranche + overrun
  {
    configureRunner('budget');
    const r = await runStep('overshoot', 'G1', 'm1');
    t.assert(/budget/.test(r.out), `run reports budget (${r.out.trim()})`);
    const d = events().filter(e => e.type === 'draw');
    const o = events().filter(e => e.type === 'overrun');
    t.eq(d.length, 2, 'second draw');
    t.eq(d[1] && d[1].fu, 10000, 'draw capped at the open tranche');
    t.eq(o.length, 1, 'one overrun');
    t.eq(o[0] && o[0].fu, SPIKE_A_FU - 10000, 'overrun for the excess');
  }

  // @covers cap-po-killswitch-001 — 5. freeze mid-run: the session lands, its draw is accepted with after_freeze; unfreeze
  {
    const g2 = cli(['grant', '--company', 'acme', '--mission', 'm2', '--appetite', '200000', '--tranches', '100000,100000',
      '--proofs', 'surface:SURFACE-E2E-2,cycle:discovery/2', '--kill', 'no surface in 2 cycles', '--id', 'G2', ...H]);
    t.eq(g2.code, 0, `second grant (${g2.err})`);
    t.eq(cli(['ratify', 'G2', ...H]).code, 0, 'ratify G2');
    configureRunner('sleep', { FAKE_CLAUDE_SLEEP_MS: '1500' });
    const before = sessions();
    let frozeOk = false;
    const r = await runStep('freeze mid-run', 'G2', 'm2', {
      during: async () => {
        const end = Date.now() + 5000;
        while (Date.now() < end && sessions() === before) await sleep(20);
        if (sessions() === before) return;
        frozeOk = (await cliAsync(['freeze', '--reason', 'e2e halt', ...H])).code === 0;
      },
    });
    t.assert(frozeOk, '`sdk-holding freeze` from another process while the session runs');
    t.eq(fold().frozen, true, 'ledger frozen');
    t.assert(/frozen/.test(r.out), `run reports frozen (${r.out.trim()})`);
    const af = events().filter(e => e.type === 'draw' && e.after_freeze === true);
    t.eq(af.length, 1, 'the pre-freeze session\'s draw is accepted, marked after_freeze');
    t.eq(af[0] && af[0].grant_id, 'G2', 'after_freeze draw counts against its grant');
    t.eq(fold().grants.G2.drawn_fu, af[0] && af[0].fu, 'grant G2 carries the after_freeze FU');
    const late = await cliAsync(['run', 'acme', '--grant', 'G2', '--mission', 'm2', '--prompt', 'x', '--max-turns', '5', '--max-budget-usd', '1', ...H]);
    t.eq(late.code, 1, 'a run started after the freeze is refused');
    t.eq(cli(['unfreeze', ...H]).code, 0, 'unfreeze');
    t.eq(fold().frozen, false, 'ledger unfrozen');
    // G2's tranche-1 proof, so cycle 1 has proof for every open grant
    fs.writeFileSync(path.join(co, 'surfaces', 'SURFACE-E2E-2.md'), '---\nid: SURFACE-E2E-2\nstate: verified\n---\n# E2E surface 2\n');
    git('add', '-A'); git('commit', '-qm', 'verify SURFACE-E2E-2');
    t.eq(cli(['proof', 'G2', '1', ...H]).code, 0, 'G2 tranche-1 proof');
  }

  // @covers cap-po-judgment-001 cap-po-grant-003 — 6. judge, cycle close with proof → no reclaim; a dry cycle → reclaim
  {
    const j = cli(['judge', 'G1', 'advanced', ...H]);
    t.eq(j.code, 0, `judge (${j.err})`);
    const rep = JSON.parse(cli(['report', '--json', ...H]).out);
    t.eq((rep.bets.find(b => b.grant_id === 'G1') || {}).judgment, 'advanced', 'report shows the Owner rating beside the bet');
    const c1 = cli(['cycle', 'close', ...H]);
    t.eq(c1.code, 0, `cycle 1 close (${c1.err})`);
    t.assert(/0 grant\(s\) reclaimed/.test(c1.out), `no reclaim when the cycle had proof (${c1.out.split('\n')[0]})`);
    t.eq(fold().grants.G1.status, 'open', 'G1 stays open');
    const c2 = cli(['cycle', 'close', ...H]);
    t.eq(c2.code, 0, `cycle 2 close (${c2.err})`);
    t.assert(/2 grant\(s\) reclaimed/.test(c2.out), `dry cycle reclaims (${c2.out.split('\n')[0]})`);
    const f = fold();
    t.eq(f.grants.G1.status, 'reclaimed', 'G1 reclaimed after a cycle without proof');
    t.eq(f.grants.G2.status, 'reclaimed', 'G2 reclaimed after a cycle without proof');
    t.eq(f.grants.G2.returned_fu, f.grants.G2.released_fu - f.grants.G2.drawn_fu, 'undrawn G2 FU returned');
  }

  // @covers cap-po-ledger-001 — 7. verify passes; one corrupted line fails verify at that line
  {
    const v = cli(['verify', ...H]);
    t.eq(v.code, 0, `verify passes (${v.err})`);
    const original = fs.readFileSync(ledgerFile, 'utf8');
    const lines = original.split('\n');
    const e = JSON.parse(lines[2]);
    e.reason = 'tampered';
    lines[2] = JSON.stringify(e);
    fs.writeFileSync(ledgerFile, lines.join('\n'));
    const bad = cli(['verify', ...H]);
    t.eq(bad.code, 1, 'verify fails on a corrupted ledger');
    t.assert(/line 3\b/.test(bad.err), `verify names line 3 (${bad.err.trim().split('\n')[1] || bad.err})`);
    fs.writeFileSync(ledgerFile, original);
    t.eq(cli(['verify', ...H]).code, 0, 'restored ledger verifies again');
  }

  // @covers cap-po-grant-003 cap-po-runner-001 — 8. kill a grant → undrawn FU returns to the pool; further runs refused
  {
    t.eq(cli(['grant', '--company', 'acme', '--mission', 'm3', '--appetite', '5000', '--tranches', '5000',
      '--proofs', 'surface:SURFACE-E2E-3', '--kill', 'one cycle', '--id', 'G3', ...H]).code, 0, 'grant G3');
    t.eq(cli(['ratify', 'G3', ...H]).code, 0, 'ratify G3');
    const k = cli(['kill', 'G3', '--reason', 'e2e kill', ...H]);
    t.eq(k.code, 0, `kill (${k.err})`);
    const g = fold().grants.G3;
    t.eq(g.status, 'returned', 'killed grant is returned');
    t.eq(g.returned_fu, 5000, 'its undrawn FU goes back to the pool');
    configureRunner('ok');
    const before = sessions();
    const r = await cliAsync(['run', 'acme', '--grant', 'G3', '--mission', 'm3', '--prompt', 'x', '--max-turns', '5', '--max-budget-usd', '1', ...H]);
    t.eq(r.code, 1, 'run on a killed grant refused');
    t.eq(sessions(), before, 'no session started');
    t.eq(cli(['verify', ...H]).code, 0, 'final ledger verifies');
  }

  return t.done();
}

module.exports = main().catch((err) => { console.error(`  CRASH [e2e]: ${err.stack || err}`); return { passed: t.passed, failed: t.failed + 1 }; });

if (require.main === module) {
  module.exports.then(({ passed, failed }) => {
    console.log(`  e2e: ${passed} passed, ${failed} failed`);
    process.exitCode = failed ? 1 : 0;
  });
}
