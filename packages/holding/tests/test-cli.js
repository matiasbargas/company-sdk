'use strict';

// sdk-holding CLI end to end on temp dirs with a stub runner: no network, no claude.
// This suite is async; run.js awaits the exported promise.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { main } = require('../bin/sdk-holding');
const { openLedger } = require('../src/ledger');
const { createLocalRunner } = require('../src/runner');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('cli');
const MODEL = 'claude-opus-5-5';
const FAKE = path.join(__dirname, 'fixtures', 'fake-claude.js');
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const RUN = ['--max-budget-usd', '1', '--model', MODEL];

function git(repo, ...args) {
  return execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', ...args],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function companyRepo(owner = 'Ada') {
  const repo = tmpDir('cli-co-');
  git(repo, 'init', '-q');
  fs.writeFileSync(path.join(repo, 'CHARTER.md'), `# Charter\n\n- **Ratified by: ${owner} (Owner) on 2026-11-14**\n`);
  git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', 'charter');
  return repo;
}
function commitSurface(repo, id, state) {
  fs.mkdirSync(path.join(repo, 'surfaces'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'surfaces', `${id}.md`),
    `---\nsurface:\n  id: ${id}\n  kind: decision\n  title: t\n  author_roles: [CTO]\n  verifier_roster: [Mario]\n  state: ${state}\n  irreversible: false\n---\n`);
  git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', `surface ${state}`);
}

function stubRunner() {
  const calls = [];
  let n = 0;
  return {
    calls,
    start(companyId, opts) { calls.push(['start', companyId, opts]); n++; return `run-${n}`; },
    async wait(runId) { calls.push(['wait', runId]); return { runId, state: 'done', terminalReason: 'done' }; },
    status(runId) { return { runId, state: 'done', terminalReason: 'done' }; },
    stop(runId, mode) { calls.push(['stop', runId, mode]); return true; },
  };
}

async function cli(args, deps = {}) {
  const out = []; const err = [];
  const code = await main(args, { stdout: (s) => out.push(s), stderr: (s) => err.push(s), env: {}, ...deps });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

async function run() {
  const root = path.join(tmpDir('cli-holding-'), 'h');
  const H = ['--holding', root];
  const runner = stubRunner();

  // init: holding/ layout, limits, concurrency 1, infinite fuel by default
  {
    const r = await cli(['init', root, '--owner', 'Ada']);
    t.eq(r.code, 0, `init succeeds (${r.err})`);
    for (const rel of ['holding/portfolio.json', 'holding/settings.json', 'holding/fuel/ledger.jsonl', 'holding/runs', 'holding/commons']) {
      t.assert(fs.existsSync(path.join(root, rel)), `init creates ${rel}`);
    }
    t.eq(fs.statSync(path.join(root, 'holding')).mode & 0o777, 0o700, 'holding/ is 0700 (D7)');
    const s = JSON.parse(fs.readFileSync(path.join(root, 'holding/settings.json'), 'utf8'));
    t.eq(s.limits.fuel.envelopePerCycle, null, 'no --envelope: infinite fuel');
    t.eq(s.limits.fuel.concurrency, 1, 'concurrency 1 (one company for now)');
    t.eq(s.limits.fuel.reclaimCyclesWithoutProof, 1, 'reclaim default 1');
    t.eq(JSON.parse(fs.readFileSync(path.join(root, 'holding/portfolio.json'), 'utf8')).holding.owner, 'Ada', 'holding Owner recorded');
    const first = JSON.parse(fs.readFileSync(path.join(root, 'holding/fuel/ledger.jsonl'), 'utf8').split('\n')[0]);
    t.eq(first.type, 'limits', 'init writes the first `limits` ledger event');
    t.eq(first.actor, 'holding-owner', 'limits written by the holding Owner');
    t.eq(first.limits.envelopePerCycle, null, 'the ledger carries the envelope (null = infinite)');
    t.eq(first.limits.concurrency, 1, 'the ledger carries concurrency');
    t.eq((await cli(['init', root, '--owner', 'Ada'])).code, 1, 'init refuses an existing holding');
    t.eq((await cli(['init', path.join(root, '..', 'x')])).code, 2, 'init without --owner is a usage error');
  }

  // add-company
  const repo = companyRepo();
  {
    const bare = tmpDir('cli-nocharter-');
    const bad = await cli(['add-company', bare, '--id', 'nope', '--owner', 'Ada', ...H]);
    t.eq(bad.code, 1, 'company without a ratified CHARTER refused');
    t.assert(/CHARTER/.test(bad.err), 'refusal explains the CHARTER problem');
    const r = await cli(['add-company', repo, '--id', 'acme', '--owner', 'Ada', ...H]);
    t.eq(r.code, 0, `add-company succeeds (${r.err})`);
    const co = JSON.parse(fs.readFileSync(path.join(root, 'holding/portfolio.json'), 'utf8')).companies[0];
    t.eq(co.id, 'acme', 'company registered');
    t.assert(path.isAbsolute(co.sdkPath), 'sdkPath pinned absolute (C7)');
  }

  // fund: holding Owner only
  {
    const r = await cli(['fund', '1000', '--by', 'agent', ...H]);
    t.eq(r.code, 1, 'fund by an agent refused');
    t.assert(/holding-owner/.test(r.err), 'refusal names who may fund');
    t.eq((await cli(['fund', '1000', ...H])).code, 2, 'fund without --by is a usage error');
    t.eq((await cli(['fund', '1000', '--by', 'holding-owner', ...H])).code, 0, 'holding Owner funds');
  }

  // @covers cap-po-grant-002 — CLI: a proposed grant is not drawable; agents cannot ratify; the holding Owner can
  let grantId;
  {
    const g = await cli(['grant', '--company', 'acme', '--mission', 'm1', '--appetite', '300', '--tranches', '100,200',
      '--proofs', 'surface:SURFACE-1,cycle:discovery/1', '--kill', 'no verified surface in 2 cycles', ...H]);
    t.eq(g.code, 0, `grant proposal accepted (${g.err})`);
    grantId = (/grant (\S+) proposed/.exec(g.out) || [])[1];
    t.assert(!!grantId, 'grant id printed');
    const bad = await cli(['grant', '--company', 'acme', '--mission', 'm1', '--appetite', '300', '--tranches', '100,200',
      '--proofs', 'surface:SURFACE-1', '--kill', 'k', ...H]);
    t.eq(bad.code, 2, 'one proof per tranche is required');
    const noKill = await cli(['grant', '--company', 'acme', '--mission', 'm1', '--appetite', '300', '--tranches', '100',
      '--proofs', 'surface:S-2', ...H]);
    t.eq(noKill.code, 2, 'a grant without --kill is refused');
    const pre = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'go', ...H], { runner });
    t.eq(pre.code, 1, 'run on an unratified grant refused');
    t.assert(/not ratified|ratif/.test(pre.err), 'refusal says it is not ratified');
    t.eq(runner.calls.length, 0, 'no session started');
    const agent = await cli(['ratify', grantId, '--by', 'agent', ...H]);
    t.eq(agent.code, 1, 'an agent cannot ratify');
    t.eq((await cli(['ratify', grantId, ...H])).code, 0, 'the holding Owner ratifies');
  }

  // readiness: no run until priceTable, pinnedVersion and sessionFloorUsd are in the ledger
  {
    const noBudget = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'x', '--model', MODEL, ...H], { runner });
    t.eq(noBudget.code, 1, 'run without --max-budget-usd refused');
    t.assert(/--max-budget-usd/.test(noBudget.err), 'refusal names --max-budget-usd');
    const noModel = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'x', '--max-budget-usd', '1', ...H], { runner });
    t.eq(noModel.code, 1, 'run without --model (and no settings.runner.model) refused');
    t.assert(/--model/.test(noModel.err), 'refusal names --model');
    const r = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'x', ...RUN, ...H], { runner });
    t.eq(r.code, 1, 'run refused before the price table and pin are recorded');
    for (const item of ['priceTable', 'pinnedVersion', 'sessionFloorUsd']) t.assert(r.err.includes(item), `refusal names ${item}`);
    t.eq(runner.calls.length, 0, 'no session started while not ready');
    const ptFile = path.join(tmpDir('cli-pt-'), 'prices.json');
    fs.writeFileSync(ptFile, JSON.stringify({ version: 'cli-test-1', models: { [MODEL]: { in: 1, out: 5, cw: 1.25, cr: 0.1 } } }));
    t.eq((await cli(['price-table', 'set', ptFile, ...H])).code, 0, 'price-table set');
    const half = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'x', ...RUN, ...H], { runner });
    t.assert(!half.err.includes('priceTable') && half.err.includes('pinnedVersion'), 'only the pin is still missing');
    t.eq((await cli(['runner-pin', 'set', '--claude-version', '2.1.292', '--session-floor', `${MODEL}=0.08`, ...H])).code, 0, 'runner-pin set');
    const low = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'x', '--max-budget-usd', '0.01', '--model', MODEL, ...H], { runner });
    t.eq(low.code, 1, 'a budget below the session floor is refused');
    const types = fs.readFileSync(path.join(root, 'holding/fuel/ledger.jsonl'), 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l).type);
    t.assert(types.includes('price_table') && types.includes('runner_pin'), 'price table and pin are ledger events');
  }

  // run → injected runner
  {
    const r = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'build it', '--max-turns', '7', ...RUN, ...H], { runner });
    t.eq(r.code, 0, `run succeeds (${r.err})`);
    const start = runner.calls.find(c => c[0] === 'start');
    t.eq(start[1], 'acme', 'runner.start(companyId)');
    t.deepEq([start[2].grantId, start[2].missionId, start[2].prompt, start[2].maxTurns, start[2].model, start[2].maxBudgetUsd],
      [grantId, 'm1', 'build it', 7, MODEL, 1], 'runner opts carry model and maxBudgetUsd (E2E-BUG #1)');
    t.assert(fs.existsSync(path.join(root, 'holding/runs/run-1.json')), 'run record written');
    t.assert(/done/.test(r.out), 'terminal status printed');
    const wrong = await cli(['run', 'acme', '--grant', grantId, '--mission', 'other', '--prompt', 'x', ...RUN, ...H], { runner });
    t.eq(wrong.code, 1, 'run for another mission refused');
  }

  // proof from the company repo + automatic release
  {
    commitSurface(repo, 'SURFACE-1', 'under-verification');
    const no = await cli(['proof', grantId, '1', ...H]);
    t.eq(no.code, 1, 'a surface under verification is refused as proof');
    t.assert(/under-verification/.test(no.err), 'refusal names the state');
    commitSurface(repo, 'SURFACE-1', 'verified');
    const ok = await cli(['proof', grantId, '1', '--kind', 'surface', '--ref', 'SURFACE-1', ...H]);
    t.eq(ok.code, 0, `verified surface recorded (${ok.err})`);
    t.assert(/tranche 2 released/.test(ok.out), 'next tranche released');
  }

  // judgment + report
  {
    t.eq((await cli(['judge', grantId, 'great', ...H])).code, 1, 'invalid rating refused');
    t.eq((await cli(['judge', grantId, 'advanced', ...H])).code, 0, 'company Owner rates the bet');
    const r = await cli(['report', '--json', ...H]);
    t.eq(r.code, 0, 'report runs');
    const rep = JSON.parse(r.out);
    t.eq(rep.bets[0].judgment, 'advanced', 'judgment in the report');
    t.eq(rep.bets[0].proofs.length, 1, 'proof in the report');
    const txt = await cli(['report', ...H]);
    t.assert(/Betting cycle 1/.test(txt.out), 'text report');
  }

  // @covers cap-po-proof-003 — CLI report detects a revert in the company repo and records it
  {
    commitSurface(repo, 'SURFACE-1', 'reconciling');
    const rep = JSON.parse((await cli(['report', '--json', ...H])).out);
    t.eq(rep.bets[0].proofs[0].reverted, true, 'report recorded the reversal');
    t.eq(rep.bets[0].weight, 0, 'weight clawed back');
    const ledger = fs.readFileSync(path.join(root, 'holding/fuel/ledger.jsonl'), 'utf8');
    t.assert(ledger.includes('"proof_revert"'), 'proof_revert event in the ledger');
  }

  // cycle close
  {
    const r = await cli(['cycle', 'close', ...H]);
    t.eq(r.code, 0, `cycle close (${r.err})`);
    t.assert(/cycle 1 closed/i.test(r.out), 'close reported');
    const rep = JSON.parse((await cli(['report', '--json', ...H])).out);
    t.eq(rep.cycle, 2, 'cycle 2 is open');
  }

  // @covers cap-po-killswitch-001 — CLI freeze with the in-process LocalRunner: stop(runId, { mode: 'landing' }) on live runs (E2E-BUG #2)
  {
    t.eq((await cli(['freeze', '--by', 'agent', ...H])).code, 1, 'only the holding Owner freezes');
    const g = await cli(['grant', '--company', 'acme', '--mission', 'm2', '--appetite', '100000', '--tranches', '100000',
      '--proofs', 'ship:ship-v1', '--kill', 'k', '--by', 'holding-owner', ...H]);
    const g2 = (/grant (\S+) /.exec(g.out) || [])[1];
    t.eq(g.code, 0, `holding-Owner grant is ratified on entry (${g.err})`);
    const live = createLocalRunner({ holdingDir: path.join(root, 'holding'), companies: [{ id: 'acme', path: repo }], model: MODEL,
      allowUnsandboxed: true, // tests only: no sandbox user here (runner contract, iteration 3)
      claudeBin: [process.execPath, FAKE], freezePollMs: 5000, env: { FAKE_CLAUDE_SCENARIO: 'sleep', FAKE_CLAUDE_SLEEP_MS: '4000' } });
    const stops = [];
    const spy = { ...live, stop: (id, o) => { stops.push([id, o]); return live.stop(id, o); } };
    const runId = live.start('acme', { prompt: 'long', grantId: g2, missionId: 'm2', maxTurns: 5, model: MODEL, maxBudgetUsd: 1 });
    const end = Date.now() + 5000;
    while (Date.now() < end && live.status(runId).state !== 'running') await sleep(20);
    t.eq(live.status(runId).state, 'running', 'in-process session running');
    const f = await cli(['freeze', '--reason', 'halt', ...H], { runner: spy });
    t.eq(f.code, 0, `freeze succeeds (${f.err})`);
    t.deepEq(stops, [[runId, { mode: 'landing' }]], 'freeze calls stop(runId, { mode: "landing" }) on the live run only');
    t.assert(!/stop failed/.test(f.err), 'the runner accepted the stop');
    const st = await live.wait(runId);
    t.assert(['done', 'interrupted'].includes(st.state), `the run reached a terminal runner state (${st.state}/${st.terminalReason})`);
    live.close();
    const again = await cli(['freeze', '--reason', 'again', ...H], { runner: spy });
    t.eq(again.code, 0, 'a second freeze is accepted');
    t.eq(stops.length, 1, 'terminal runs (done|interrupted|failed) are not stopped again');
    const r = await cli(['run', 'acme', '--grant', g2, '--mission', 'm2', '--prompt', 'x', ...RUN, ...H], { runner });
    t.eq(r.code, 1, 'run refused while frozen');
    t.assert(/frozen/i.test(r.err), 'refusal says frozen');
    t.eq((await cli(['unfreeze', ...H])).code, 0, 'unfreeze');
    t.eq((await cli(['kill', g2, '--reason', 'kill condition met', ...H])).code, 0, 'kill returns the grant');
  }

  // verify + errors
  {
    const v = await cli(['verify', ...H]);
    t.eq(v.code, 0, `verify passes (${v.err})`);
    const file = path.join(root, 'holding/fuel/ledger.jsonl');
    const lines = fs.readFileSync(file, 'utf8').split('\n');
    const k = lines.findIndex(l => l.includes('"amount_fu":1000'));
    lines[k] = lines[k].replace('"amount_fu":1000', '"amount_fu":9999');
    fs.writeFileSync(file, lines.join('\n'));
    const bad = await cli(['verify', ...H]);
    t.eq(bad.code, 1, 'verify fails on an edited line');
    t.assert(new RegExp(`line ${k + 1}\\b`).test(bad.err), `failure names line ${k + 1}`);
    t.eq((await cli(['bogus', ...H])).code, 2, 'unknown command is a usage error');
    t.eq((await cli(['report', '--holding', tmpDir('cli-empty-')])).code, 1, 'no holding here: refused with a message');
  }

  // limits live in the hash chain: editing settings.json changes nothing about replay
  {
    const file = path.join(root, 'holding/fuel/ledger.jsonl');
    const repaired = fs.readFileSync(file, 'utf8').split('\n');
    const k = repaired.findIndex(l => l.includes('"amount_fu":9999'));
    repaired[k] = repaired[k].replace('"amount_fu":9999', '"amount_fu":1000'); // undo the tamper above
    fs.writeFileSync(file, repaired.join('\n'));
    t.eq((await cli(['verify', ...H])).code, 0, 'ledger verifies again');
    const before = JSON.stringify(openLedger(file, {}).fold());
    const reportBefore = (await cli(['report', '--json', ...H])).out;
    const sf = path.join(root, 'holding/settings.json');
    const s = JSON.parse(fs.readFileSync(sf, 'utf8'));
    s.limits.fuel = { ...s.limits.fuel, envelopePerCycle: 1, smallBetReserve: 0.5, overrunReserve: 0.4, reclaimCyclesWithoutProof: 99, concurrency: 7 };
    fs.writeFileSync(sf, JSON.stringify(s));
    t.eq(JSON.stringify(openLedger(file, {}).fold()), before, 'fold output unchanged after editing settings.json');
    t.eq((await cli(['report', '--json', ...H])).out, reportBefore, 'CLI report unchanged after editing settings.json');
    const show = JSON.parse((await cli(['limits', 'show', ...H])).out);
    t.eq(show.limits.concurrency, 1, 'limits show reads the ledger, not settings.json');
    const set = await cli(['limits', 'set', '--overrunReserve', '0.1', '--proofRevertCommits', '5', ...H]);
    t.eq(set.code, 0, `limits set (${set.err})`);
    const after = openLedger(file, {}).fold();
    t.eq(after.limits.overrunReserve, 0.1, 'new limits in force');
    t.eq(after.limits.proofRevertCommits, 5, 'every key settable');
    t.eq(JSON.parse(fs.readFileSync(sf, 'utf8')).limits.fuel.proofRevertCommits, 5, 'settings display copy refreshed');
    t.eq((await cli(['limits', 'set', '--concurrency', '0', ...H])).code, 1, 'invalid limits refused');
    t.eq((await cli(['limits', 'set', '--concurrency', '2', '--by', 'agent', ...H])).code, 1, 'only the holding Owner sets limits');
  }

  // init with a finite envelope
  {
    const root2 = path.join(tmpDir('cli-holding2-'), 'h');
    await cli(['init', root2, '--owner', 'Ada', '--envelope', '5000']);
    const s = JSON.parse(fs.readFileSync(path.join(root2, 'holding/settings.json'), 'utf8'));
    t.eq(s.limits.fuel.envelopePerCycle, 5000, '--envelope sets a finite envelope');
    t.eq((await cli(['fund', '--infinite', '--by', 'holding-owner', '--holding', root2])).code, 0, 'fund --infinite switches to infinite fuel');
    t.eq(openLedger(path.join(root2, 'holding/fuel/ledger.jsonl'), {}).fold().limits.envelopePerCycle, null, 'the ledger says infinite now');
    // settings.json input form → ledger events, recorded explicitly and only when changed
    const sf2 = path.join(root2, 'holding/settings.json');
    const s2 = JSON.parse(fs.readFileSync(sf2, 'utf8'));
    s2.priceTable = { version: 'p-1', models: { [MODEL]: { in: 1, out: 5, cw: 1.25, cr: 0.1 } } };
    s2.claude = { pinnedVersion: '2.1.292' };
    s2.runner = { model: MODEL, sessionFloorUsd: { [MODEL]: 0.08 } };
    fs.writeFileSync(sf2, JSON.stringify(s2));
    const imp = await cli(['config', 'import-settings', '--holding', root2]);
    t.assert(/price table p-1/.test(imp.out) && /runner pin 2\.1\.292/.test(imp.out), 'import records both from settings.json');
    t.assert(/nothing to import/.test((await cli(['config', 'import-settings', '--holding', root2])).out), 'unchanged settings import nothing');
  }

  return t.done();
}

module.exports = run();
