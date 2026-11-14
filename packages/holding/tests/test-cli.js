'use strict';

// sdk-holding CLI end to end on temp dirs with a stub runner: no network, no claude.
// This suite is async; run.js awaits the exported promise.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { main } = require('../bin/sdk-holding');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('cli');

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

  // run → injected runner
  {
    const r = await cli(['run', 'acme', '--grant', grantId, '--mission', 'm1', '--prompt', 'build it', '--max-turns', '7', ...H], { runner });
    t.eq(r.code, 0, `run succeeds (${r.err})`);
    const start = runner.calls.find(c => c[0] === 'start');
    t.eq(start[1], 'acme', 'runner.start(companyId)');
    t.deepEq([start[2].grantId, start[2].missionId, start[2].prompt, start[2].maxTurns], [grantId, 'm1', 'build it', 7], 'runner opts');
    t.assert(fs.existsSync(path.join(root, 'holding/runs/run-1.json')), 'run record written');
    t.assert(/done/.test(r.out), 'terminal status printed');
    const wrong = await cli(['run', 'acme', '--grant', grantId, '--mission', 'other', '--prompt', 'x', ...H], { runner });
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

  // @covers cap-po-killswitch-001 — CLI freeze: the holding Owner halts; runs refuse; unfreeze resumes
  {
    t.eq((await cli(['freeze', '--by', 'agent', ...H])).code, 1, 'only the holding Owner freezes');
    const g = await cli(['grant', '--company', 'acme', '--mission', 'm2', '--appetite', '100', '--tranches', '100',
      '--proofs', 'ship:ship-v1', '--kill', 'k', '--by', 'holding-owner', ...H]);
    const g2 = (/grant (\S+) /.exec(g.out) || [])[1];
    t.eq(g.code, 0, `holding-Owner grant is ratified on entry (${g.err})`);
    const f = await cli(['freeze', '--reason', 'halt', ...H], { runner });
    t.eq(f.code, 0, 'freeze succeeds');
    const r = await cli(['run', 'acme', '--grant', g2, '--mission', 'm2', '--prompt', 'x', ...H], { runner });
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
    lines[0] = lines[0].replace('"amount_fu":1000', '"amount_fu":9999');
    fs.writeFileSync(file, lines.join('\n'));
    const bad = await cli(['verify', ...H]);
    t.eq(bad.code, 1, 'verify fails on an edited line');
    t.assert(/line 1/.test(bad.err), 'failure names the line');
    t.eq((await cli(['bogus', ...H])).code, 2, 'unknown command is a usage error');
    t.eq((await cli(['report', '--holding', tmpDir('cli-empty-')])).code, 1, 'no holding here: refused with a message');
  }

  // init with a finite envelope
  {
    const root2 = path.join(tmpDir('cli-holding2-'), 'h');
    await cli(['init', root2, '--owner', 'Ada', '--envelope', '5000']);
    const s = JSON.parse(fs.readFileSync(path.join(root2, 'holding/settings.json'), 'utf8'));
    t.eq(s.limits.fuel.envelopePerCycle, 5000, '--envelope sets a finite envelope');
    t.eq((await cli(['fund', '--infinite', '--by', 'holding-owner', '--holding', root2])).code, 0, 'fund --infinite switches to infinite fuel');
    t.eq(JSON.parse(fs.readFileSync(path.join(root2, 'holding/settings.json'), 'utf8')).limits.fuel.envelopePerCycle, null, 'envelope now null');
  }

  return t.done();
}

module.exports = run();
