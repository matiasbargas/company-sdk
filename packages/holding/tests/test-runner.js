'use strict';

// LocalRunner + landing hook conformance. Every claude process here is tests/fixtures/fake-claude.js:
// no tokens, no network. This suite is async; run.js awaits the exported promise.

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { createLocalRunner, RUNNER_CONTRACT_VERSION } = require('../src/runner');
const { openLedger } = require('../src/ledger');
const { createSuite, tmpDir } = require('./_helpers');
const { FIXED_NOW, grant, draw } = require('./_fixtures');

const t = createSuite('runner');
const FAKE = path.join(__dirname, 'fixtures', 'fake-claude.js');
const HOOK = path.join(__dirname, '..', 'src', 'landing-hook.js');
const PRICE = { version: 'test-2026-11-14', models: { 'claude-opus-5-5': { in: 1, out: 5, cw: 1.25, cr: 0.1 } } };
const FLOORS = { 'claude-opus-5-5': 0.08 }; // spike 1/2: ~16.7k cache-creation tokens ≈ $0.08 per bare Opus session
const OK_FU = 21136; // fake 'ok' turn: 3*1 + 50*5 + 16706*1.25 = 21135.5 → ceil
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const readJsonl = (f) => (fs.existsSync(f) ? fs.readFileSync(f, 'utf8').split('\n').filter(Boolean).map(l => JSON.parse(l)) : []);
const real = (p) => fs.realpathSync(p);

async function waitFor(pred, label, timeoutMs = 8000) {
  const end = Date.now() + timeoutMs;
  while (Date.now() < end) { if (pred()) return true; await sleep(20); }
  t.assert(false, `timed out waiting for: ${label}`);
  return false;
}

/** A holding with a ledger, one grant per company, and company clone dirs. */
function setup({ companies = ['acme'], tranche = 100000, scenario = 'ok', concurrency = 1, extraEnv = {}, runnerOpts = {} } = {}) {
  const holdingDir = tmpDir('holding-runner-');
  const ledgerFile = path.join(holdingDir, 'fuel', 'ledger.jsonl');
  const L = openLedger(ledgerFile, { limits: { envelopePerCycle: null }, now: FIXED_NOW });
  const log = path.join(holdingDir, 'fake.log');
  const hookOut = path.join(holdingDir, 'hook.log');
  const cos = companies.map((id) => {
    const p = tmpDir(`co-${id}-`);
    L.append(grant({ grant_id: `g-${id}`, idem_key: `grant-g-${id}`, company: id, mission_id: `m-${id}`, appetite_fu: tranche * 2,
      tranches: [{ size_fu: tranche, proof: { kind: 'verified_surface', ref: `${id}/S-1` } },
        { size_fu: tranche, proof: { kind: 'graduated_cycle', ref: `${id}/C-1` } }] }));
    return { id, path: p };
  });
  const mk = (extra = {}) => createLocalRunner({
    holdingDir, companies: cos, limits: { envelopePerCycle: null, concurrency }, priceTable: PRICE,
    pinnedVersion: '2.1.292', claudeBin: [process.execPath, FAKE], freezePollMs: 25, sessionFloorUsd: FLOORS,
    env: { FAKE_CLAUDE_SCENARIO: scenario, FAKE_CLAUDE_LOG: log, FAKE_CLAUDE_HOOK_OUT: hookOut, ...extraEnv },
    ...runnerOpts, ...extra,
  });
  return { holdingDir, ledgerFile, L, log, hookOut, cos, runner: mk(), mk };
}
const startOpts = (id, extra = {}) => ({ prompt: 'work', grantId: `g-${id}`, missionId: `m-${id}`, maxTurns: 5,
  model: 'claude-opus-5-5', maxBudgetUsd: 1, ...extra });
const starts = (log) => readJsonl(log).filter(e => e.event === 'start');

function hook(stateFile, toolName, toolInput) {
  const r = spawnSync(process.execPath, [HOOK, '--state', stateFile], {
    input: JSON.stringify({ hook_event_name: 'PreToolUse', tool_name: toolName, tool_input: toolInput, cwd: '/tmp' }), encoding: 'utf8' });
  const out = r.stdout.trim() ? JSON.parse(r.stdout) : null;
  const hso = out && out.hookSpecificOutput;
  return { status: r.status, decision: hso ? hso.permissionDecision : 'none', reason: hso ? hso.permissionDecisionReason : '' };
}

/** Probe: does the current fold accept a pre-freeze session's draw marked after_freeze? */
function foldAcceptsAfterFreeze() {
  const L = openLedger(path.join(tmpDir('probe-'), 'l.jsonl'), { limits: { envelopePerCycle: null }, now: FIXED_NOW });
  L.append(grant());
  const seq = L.read().length;
  L.append({ type: 'freeze', actor: 'holding-owner', idem_key: 'pf', reason: 'probe' });
  try { L.append(draw(1, { after_freeze: true, run_started_seq: seq })); return true; } catch { return false; }
}

function codeOf(fn) { try { fn(); } catch (e) { return e; } return null; }

async function main() {
  t.eq(RUNNER_CONTRACT_VERSION, 1, 'runner contract is versioned (C8/C9)');

  // @covers cap-po-fuel-001 — runner start→done: the runner (actor `runner`) appends a draw with modelUsage counts and a run record
  {
    const s = setup();
    const runId = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'k-1', maxTurns: 3 }));
    t.eq(typeof runId, 'string', 'start returns a runId');
    const st = await s.runner.wait(runId);
    t.eq(st.state, 'done', 'run ends done');
    t.eq(st.terminalReason, 'done', 'terminal reason done');
    const draws = s.L.read().filter(e => e.type === 'draw');
    t.eq(draws.length, 1, 'one draw appended');
    t.eq(draws[0].actor, 'runner', 'draw written as the runner');
    t.eq(draws[0].run_id, runId, 'draw names the run');
    t.eq(draws[0].fu, OK_FU, 'FU = modelUsage × price table');
    const r0 = draws[0].raw[0];
    t.deepEq([draws[0].raw.length, r0.model, r0.in, r0.out, r0.cw, r0.cr], [1, 'claude-opus-5-5', 3, 50, 16706, 0], 'raw counts from modelUsage');
    t.eq(draws[0].model_usage['claude-opus-5-5'].cacheCreationInputTokens, 16706, 'verbatim modelUsage stored');
    const rec = JSON.parse(fs.readFileSync(path.join(s.holdingDir, 'runs', `${runId}.json`), 'utf8'));
    t.eq(rec.terminal_reason, 'done', 'run record terminal reason');
    t.eq(rec.exit_code, 0, 'run record exit code');
    t.eq(rec.usage.fu_drawn, OK_FU, 'run record usage summary');
    const m = s.runner.meter(runId);
    t.eq(m.length, 1, 'meter returns one UsageEvent');
    t.eq(m[0].kind, 'usage', 'UsageEvent kind usage');
    t.eq(m[0].claude_code_version, '2.1.292', 'UsageEvent carries the pinned CLI version');
    const [st0] = starts(s.log);
    t.eq(real(st0.cwd), real(s.cos[0].path), 'session cwd is the company clone');
    const a = st0.argv;
    t.eq(a[a.indexOf('--max-turns') + 1], '3', '--max-turns passed');
    t.eq(a[a.indexOf('--output-format') + 1], 'stream-json', 'stream-json output');
    t.assert(a.includes('--verbose'), '--verbose passed');
    t.eq(a[a.indexOf('-p') + 1], 'work', 'prompt passed with -p');
    t.eq(fs.existsSync(path.join(s.holdingDir, 'runs', 'acme.lock')), false, 'company lock released after the run');
    t.eq(s.runner.status(runId).state, 'done', 'status after the fact');
  }

  // @covers cap-po-runner-001 — idempotent start (C9): the same idempotencyKey returns the same runId and never spawns twice
  {
    const s = setup();
    const r1 = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'same' }));
    const r2 = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'same' }));
    t.eq(r2, r1, 'same key → same runId');
    await s.runner.wait(r1);
    const r3 = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'same' }));
    t.eq(r3, r1, 'same key after completion → same runId');
    const fresh = s.mk(); // another runner process on the same holding
    t.eq(fresh.start('acme', startOpts('acme', { idempotencyKey: 'same' })), r1, 'idempotent across runner instances (run record on disk)');
    await sleep(100);
    t.eq(starts(s.log).length, 1, 'exactly one session spawned');
    t.eq(s.L.read().filter(e => e.type === 'draw').length, 1, 'exactly one draw');
    const e = codeOf(() => s.runner.start('acme', startOpts('acme', { idempotencyKey: 'same', prompt: 'other' })));
    t.eq(e && e.code, 'IDEM_CONFLICT', 'same key with different parameters is refused');
  }

  // @covers cap-po-killswitch-001 — a frozen ledger refuses start (pre-flight), no session spawns
  {
    const s = setup();
    s.L.append({ type: 'freeze', actor: 'holding-owner', idem_key: 'fz', reason: 'halt' });
    const e = codeOf(() => s.runner.start('acme', startOpts('acme')));
    t.eq(e && e.code, 'LEDGER_FROZEN', 'start refused while frozen');
    t.assert(fs.existsSync(path.join(s.holdingDir, 'runs', 'FROZEN')), 'runner writes the freeze flag for the hooks');
    s.L.append({ type: 'unfreeze', actor: 'holding-owner', idem_key: 'ufz', reason: 'resume' });
    const runId = s.runner.start('acme', startOpts('acme'));
    t.eq(fs.existsSync(path.join(s.holdingDir, 'runs', 'FROZEN')), false, 'freeze flag removed after unfreeze');
    await s.runner.wait(runId);
    t.eq(starts(s.log).length, 1, 'only the post-unfreeze run spawned');
  }

  // @covers cap-po-runner-001 — no open tranche FU (infinite fuel) → refusal naming the grant, no session starts
  {
    const s = setup({ tranche: 100 });
    s.L.append(draw(100, { grant_id: 'g-acme', mission_id: 'm-acme', company: 'acme', run_id: 'prior' }));
    const e = codeOf(() => s.runner.start('acme', startOpts('acme')));
    t.eq(e && e.code, 'TRANCHE_EXHAUSTED', 'exhausted tranche refuses start even with infinite fuel');
    t.assert(e && e.message.includes('g-acme'), 'refusal names the grant');
    const e2 = codeOf(() => s.runner.start('acme', startOpts('acme', { grantId: 'g-nope' })));
    t.eq(e2 && e2.code, 'NO_LIVE_GRANT', 'missing grant refused');
    const e3 = codeOf(() => s.runner.start('acme', startOpts('acme', { missionId: 'm-other' })));
    t.eq(e3 && e3.code, 'MISSION_MISMATCH', 'grant for another mission refused');
    const e4 = codeOf(() => s.runner.start('acme', startOpts('acme', { maxTurns: undefined })));
    t.eq(e4 && e4.code, 'MAX_TURNS_REQUIRED', 'a stop condition (maxTurns) is required');
    const e5 = codeOf(() => s.runner.start('ghost', startOpts('acme')));
    t.eq(e5 && e5.code, 'UNKNOWN_COMPANY', 'unregistered company refused');
    await sleep(100);
    t.eq(starts(s.log).length, 0, 'no session spawned for any refusal');
  }

  // @covers cap-po-budget-001 — runner records an overshoot (spike run-a stream) as draw up to the cap + overrun
  {
    const s = setup({ tranche: 10000, scenario: 'budget' });
    const runId = s.runner.start('acme', startOpts('acme'));
    const st = await s.runner.wait(runId);
    t.eq(st.terminalReason, 'budget', 'error_max_budget_usd → terminal reason budget');
    const evs = s.L.read();
    const d = evs.find(e => e.type === 'draw');
    const o = evs.find(e => e.type === 'overrun');
    t.eq(d && d.fu, 10000, 'draw capped at the open tranche FU');
    t.eq(o && o.fu, 20905 - 10000, 'overrun for the excess');
    t.eq(s.L.fold().grants['g-acme'].overrun_outstanding_fu, 10905, 'overrun to be recovered from the next tranche');
  }

  // @covers cap-po-fuel-001 — a session killed mid-run (no result line) is recorded as unmetered, never zero
  {
    const s = setup({ scenario: 'killed' });
    const runId = s.runner.start('acme', startOpts('acme'));
    const st = await s.runner.wait(runId);
    t.eq(st.state, 'interrupted', 'killed session → interrupted');
    t.eq(st.terminalReason, 'killed', 'terminal reason killed');
    const evs = s.L.read();
    t.eq(evs.filter(e => e.type === 'draw').length, 0, 'no draw');
    const u = evs.find(e => e.type === 'unmetered');
    t.assert(u && /no result/.test(u.reason), 'unmetered with the no-result reason');
    t.eq(u && u.run_id, runId, 'unmetered names the run');
  }

  // @covers cap-po-fuel-001 — unknown stream schema fails closed as unmetered (C5)
  {
    const s = setup({ scenario: 'unknown' });
    const runId = s.runner.start('acme', startOpts('acme'));
    await s.runner.wait(runId);
    const evs = s.L.read();
    t.eq(evs.filter(e => e.type === 'draw').length, 0, 'unknown schema: no draw');
    t.eq(evs.filter(e => e.type === 'unmetered').length, 1, 'unknown schema: unmetered');
    t.eq(s.runner.meter(runId)[0].kind, 'unmetered', 'meter() reports the unmetered record');
  }

  // @covers cap-po-fuel-001 — Claude Code version pin (C5): a binary that is not the pinned version never starts a session
  {
    const s = setup({ runnerOpts: { pinnedVersion: '9.9.9' } });
    const runId = s.runner.start('acme', startOpts('acme'));
    const st = await s.runner.wait(runId);
    t.eq(st.state, 'failed', 'version mismatch → failed');
    t.eq(st.terminalReason, 'error', 'terminal reason error');
    t.assert(/9\.9\.9/.test(st.error || ''), 'error names the pinned version');
    t.eq(starts(s.log).length, 0, 'no session spawned');
  }

  // @covers cap-po-killswitch-001 — stop modes (C9): hard kills now; landing flips the hook to landing and lets the session finish
  {
    const s = setup({ scenario: 'sleep', extraEnv: { FAKE_CLAUDE_SLEEP_MS: '4000' } });
    const r1 = s.runner.start('acme', startOpts('acme'));
    await waitFor(() => starts(s.log).length === 1, 'hard-stop session started');
    const t0 = Date.now();
    s.runner.stop(r1, { mode: 'hard' });
    const st = await s.runner.wait(r1);
    t.assert(Date.now() - t0 < 3500, 'hard stop does not wait for the session');
    t.eq(st.state, 'interrupted', 'hard stop → interrupted');
    t.eq(st.terminalReason, 'killed', 'hard stop → killed');
    t.assert(s.L.read().some(e => e.type === 'unmetered' && e.run_id === r1), 'hard-stopped session recorded unmetered');

    const s2 = setup({ scenario: 'sleep', extraEnv: { FAKE_CLAUDE_SLEEP_MS: '600' } });
    const r2 = s2.runner.start('acme', startOpts('acme'));
    await waitFor(() => starts(s2.log).length === 1, 'landing session started');
    s2.runner.stop(r2, { mode: 'landing' });
    t.eq(s2.runner.status(r2).state, 'landing', 'landing stop → state landing');
    const stateFile = path.join(s2.holdingDir, 'runs', `${r2}.state.json`);
    t.eq(hook(stateFile, 'Edit', { file_path: '/x/a.js' }).decision, 'deny', 'landing: hook denies Edit');
    t.eq(hook(stateFile, 'Bash', { command: 'git commit -m wip' }).decision, 'none', 'landing: hook allows git commit');
    const st2 = await s2.runner.wait(r2);
    t.eq(st2.state, 'done', 'landing stop lets the session end at a turn boundary');
    t.eq(st2.terminalReason, 'killed', 'landing stop → terminal reason killed (halted by the holding)');
    t.assert(s2.L.read().some(e => e.type === 'draw' && e.run_id === r2), 'landed session metered as a draw');

    const s3 = setup({ scenario: 'sleep', extraEnv: { FAKE_CLAUDE_SLEEP_MS: '5000' }, runnerOpts: { landingTimeoutMs: 150 } });
    const r3 = s3.runner.start('acme', startOpts('acme'));
    await waitFor(() => starts(s3.log).length === 1, 'landing-timeout session started');
    s3.runner.stop(r3, { mode: 'landing' });
    const st3 = await s3.runner.wait(r3);
    t.eq(st3.state, 'interrupted', 'landing that overruns its grace period escalates to hard');

    const s4 = setup({ scenario: 'sleep' });
    const q1 = s4.runner.start('acme', startOpts('acme', { idempotencyKey: 'q1' }));
    const q2 = s4.runner.start('acme', startOpts('acme', { idempotencyKey: 'q2' }));
    t.eq(s4.runner.status(q2).state, 'queued', 'second run queued');
    s4.runner.stop(q2, { mode: 'hard' });
    t.eq(s4.runner.status(q2).state, 'interrupted', 'stopping a queued run cancels it');
    await s4.runner.wait(q1);
    await sleep(100);
    t.eq(starts(s4.log).length, 1, 'cancelled queued run never spawned');
  }

  // @covers cap-po-killswitch-001 — freezing the ledger mid-run: flag written, session lands, burn still recorded
  {
    const tools = [{ name: 'Read', input: { file_path: 'a' } }, { name: 'Edit', input: { file_path: 'a.js' } },
      { name: 'Bash', input: { command: 'git stash' } }];
    const s = setup({ scenario: 'tools', extraEnv: { FAKE_CLAUDE_TOOLS: JSON.stringify(tools), FAKE_CLAUDE_TURN_DELAY_MS: '250' } });
    const runId = s.runner.start('acme', startOpts('acme'));
    await waitFor(() => starts(s.log).length === 1, 'tools session started');
    s.L.append({ type: 'freeze', actor: 'holding-owner', idem_key: 'fz-mid', reason: 'halt' });
    await waitFor(() => fs.existsSync(path.join(s.holdingDir, 'runs', 'FROZEN')), 'freeze flag written during the run');
    await waitFor(() => s.runner.status(runId).state !== 'running', 'run leaves running');
    t.eq(s.runner.status(runId).state, 'landing', 'frozen ledger → running session in landing');
    const st = await s.runner.wait(runId);
    t.eq(st.terminalReason, 'frozen', 'terminal reason frozen');
    const decisions = readJsonl(s.hookOut);
    t.eq(decisions.find(d => d.tool === 'Edit').decision, 'deny', 'frozen: Edit denied');
    t.eq(decisions.find(d => d.tool === 'Bash').decision, 'allow', 'frozen: git allowed');
    // Decision (Greg, 2026-11-14): a session that started before the freeze has its draw ACCEPTED,
    // marked after_freeze: true, counted against its grant. The runner always attempts that draw.
    // TODO(fold owner): until fold.js accepts after_freeze draws (see report), the ledger refuses it
    // and the runner falls back to `unmetered` with raw counts. When the fold change lands, the first
    // branch runs; then delete the fallback branch.
    const evs = s.L.read();
    const d = evs.find(e => e.type === 'draw');
    if (foldAcceptsAfterFreeze()) {
      t.assert(d && d.after_freeze === true, 'pre-freeze session: draw accepted with after_freeze: true');
      t.eq(d && d.run_id, runId, 'after_freeze draw names the run');
      t.assert(Number.isSafeInteger(d && d.run_started_seq), 'draw carries the ledger seq the run started at');
      t.eq(s.L.fold().grants['g-acme'].drawn_fu, d && d.fu, 'after_freeze draw counts against the grant');
    } else {
      t.eq(d, undefined, '(fold pending) no draw while frozen');
      const u = evs.find(e => e.type === 'unmetered');
      t.assert(u && /after_freeze/.test(u.reason) && /LEDGER_FROZEN/.test(u.reason) && Array.isArray(u.raw),
        '(fold pending) after_freeze draw attempted, spend kept as unmetered with raw counts');
    }
    const late = codeOf(() => s.runner.start('acme', startOpts('acme', { idempotencyKey: 'after-freeze' })));
    t.eq(late && late.code, 'LEDGER_FROZEN', 'a session that would start after the freeze is refused');
  }

  // @covers cap-po-runner-003 — concurrency 1 serializes two starts in different companies
  {
    const s = setup({ companies: ['acme', 'beta'], scenario: 'sleep', extraEnv: { FAKE_CLAUDE_SLEEP_MS: '300' } });
    const a = s.runner.start('acme', startOpts('acme'));
    const b = s.runner.start('beta', startOpts('beta'));
    t.eq(s.runner.status(b).state, 'queued', 'second start waits for the semaphore');
    await Promise.all([s.runner.wait(a), s.runner.wait(b)]);
    const ev = readJsonl(s.log);
    const [sa, sb] = ev.filter(e => e.event === 'start');
    const ea = ev.find(e => e.event === 'end' && e.pid === sa.pid);
    t.assert(ea && sb && ea.t <= sb.t, 'second session starts after the first ends');
    t.eq(s.runner.status(b).state, 'done', 'queued run completes');
  }

  // @covers cap-po-runner-003 — concurrency 2, three runs: at most two at once, never two in one company
  {
    const s = setup({ companies: ['acme', 'beta'], scenario: 'sleep', concurrency: 2, extraEnv: { FAKE_CLAUDE_SLEEP_MS: '400' } });
    const a1 = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'a1' }));
    const a2 = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'a2' }));
    const b1 = s.runner.start('beta', startOpts('beta', { idempotencyKey: 'b1' }));
    t.eq(s.runner.status(a2).state, 'queued', 'same company waits for its lock');
    t.eq(s.runner.status(b1).state, 'running', 'other company runs in the free slot');
    await Promise.all([a1, a2, b1].map(r => s.runner.wait(r)));
    const ev = readJsonl(s.log);
    const spans = ev.filter(e => e.event === 'start').map(st => ({ cwd: real(st.cwd), s: st.t, e: ev.find(x => x.event === 'end' && x.pid === st.pid).t }));
    let maxPar = 0;
    for (const x of spans) maxPar = Math.max(maxPar, spans.filter(y => y.s <= x.s && y.e > x.s).length);
    t.assert(maxPar <= 2, `at most two at once (saw ${maxPar})`);
    const acme = spans.filter(x => x.cwd === real(s.cos[0].path));
    t.eq(acme.length, 2, 'both acme runs ran');
    t.assert(acme[0].e <= acme[1].s || acme[1].e <= acme[0].s, 'acme runs never overlap');
  }

  // @covers cap-po-runner-003 — the company lock file holds across runner instances (one writer session per repository)
  {
    const s = setup({ scenario: 'sleep', extraEnv: { FAKE_CLAUDE_SLEEP_MS: '500' }, runnerOpts: { lockRetryMs: 30 } });
    const other = s.mk();
    const r1 = s.runner.start('acme', startOpts('acme', { idempotencyKey: 'x1' }));
    await waitFor(() => starts(s.log).length === 1, 'first session started');
    t.assert(fs.existsSync(path.join(s.holdingDir, 'runs', 'acme.lock')), 'company lock file present while running');
    const r2 = other.start('acme', startOpts('acme', { idempotencyKey: 'x2' }));
    const st2 = other.status(r2);
    t.eq(st2.state, 'queued', 'second runner instance cannot take the company');
    t.assert(/acme\.lock/.test(st2.waitingFor || ''), 'status names the lock it waits on');
    await s.runner.wait(r1);
    const fin = await other.wait(r2);
    t.eq(fin.state, 'done', 'second run proceeds after the lock is released');
    const ev = readJsonl(s.log).filter(e => e.event === 'start');
    const end1 = readJsonl(s.log).find(e => e.event === 'end' && e.pid === ev[0].pid);
    t.assert(end1.t <= ev[1].t, 'the two sessions in one company never overlapped');
  }

  // @covers cap-po-runner-003 — runner-owned settings never enable bypass; skip-permissions flags are refused
  {
    const s = setup();
    const runId = s.runner.start('acme', startOpts('acme'));
    await s.runner.wait(runId);
    const a = starts(s.log)[0].argv;
    t.assert(!a.some(x => /dangerously|bypassPermissions|permission-mode/i.test(x)), 'argv has no skip-permissions / bypass');
    const settingsFile = a[a.indexOf('--settings') + 1];
    t.assert(settingsFile.startsWith(s.holdingDir), 'settings file lives in the holding (runner-owned)');
    const raw = fs.readFileSync(settingsFile, 'utf8');
    const settings = JSON.parse(raw);
    t.assert(!raw.includes('bypassPermissions'), 'settings never mention bypassPermissions');
    t.eq(settings.permissions.disableBypassPermissionsMode, 'disable', 'bypass mode disabled');
    t.assert(settings.permissions.defaultMode !== 'bypassPermissions', 'default mode is not bypass');
    t.assert(settings.permissions.deny.some(r => r.includes(s.holdingDir.slice(1))), 'tools are denied the holding directory');
    t.assert(settings.hooks.PreToolUse[0].hooks[0].command.includes('landing-hook.js'), 'landing hook wired through PreToolUse');
    for (const bad of [['--dangerously-skip-permissions'], ['--permission-mode', 'bypassPermissions'], ['--allow-dangerously-skip-permissions'], ['--settings', '/tmp/x.json']]) {
      const e = codeOf(() => s.mk({ extraArgs: bad }));
      t.eq(e && e.code, 'UNSAFE_FLAG', `extraArgs ${bad.join(' ')} refused`);
    }
    const e = codeOf(() => s.mk({ pinnedVersion: undefined }));
    t.eq(e && e.code, 'PIN_REQUIRED', 'the Claude Code version must be pinned (C5)');
  }

  // @covers cap-po-runner-001 — landing hook: once the working budget is spent, Edit is denied and git commit allowed
  {
    const dir = tmpDir('hook-');
    const stateFile = path.join(dir, 'r.state.json');
    const freezeFlag = path.join(dir, 'FROZEN');
    const write = (st) => fs.writeFileSync(stateFile, JSON.stringify({ run_id: 'r', budget_fu: 100, landing: false, freeze_flag: freezeFlag, ...st }));
    write({ spent_fu: 50 });
    t.eq(hook(stateFile, 'Edit', { file_path: '/c/a.js' }).decision, 'none', 'budget left: hook stays silent (normal permissions apply, never auto-allow)');
    t.eq(hook(stateFile, 'Bash', { command: 'npm test' }).decision, 'none', 'budget left: Bash untouched');
    write({ spent_fu: 100 });
    const denied = hook(stateFile, 'Edit', { file_path: '/c/a.js' });
    t.eq(denied.decision, 'deny', 'budget spent: Edit denied');
    t.assert(/commit/i.test(denied.reason) && /stash/i.test(denied.reason) && /current-status\.md/.test(denied.reason) && /stop/i.test(denied.reason),
      'landing message: commit or stash, update current-status.md, stop');
    for (const tool of ['Write', 'NotebookEdit', 'MultiEdit', 'Task', 'WebFetch', 'mcp__x__y']) {
      t.eq(hook(stateFile, tool, { file_path: '/c/a.js' }).decision, 'deny', `budget spent: ${tool} denied`);
    }
    for (const cmd of ['git commit -m "wip"', 'git add -A && git commit -m wip', 'git stash', 'git -C /c status']) {
      t.eq(hook(stateFile, 'Bash', { command: cmd }).decision, 'none', `budget spent: \`${cmd}\` allowed`);
    }
    for (const cmd of ['rm -rf src', 'git status; rm x', 'git log $(rm x)', 'git log `rm x`', 'git diff > out.txt', 'npm test && git commit']) {
      t.eq(hook(stateFile, 'Bash', { command: cmd }).decision, 'deny', `budget spent: \`${cmd}\` denied`);
    }
    t.eq(hook(stateFile, 'Write', { file_path: '/c/current-status.md' }).decision, 'none', 'budget spent: status write allowed');
    t.eq(hook(stateFile, 'Read', { file_path: '/c/a.js' }).decision, 'none', 'budget spent: Read allowed (to write the status)');
    write({ spent_fu: 0, landing: true });
    t.eq(hook(stateFile, 'Edit', { file_path: '/c/a.js' }).decision, 'deny', 'operator landing: Edit denied');
    write({ spent_fu: 0 });
    fs.writeFileSync(freezeFlag, 'frozen');
    const fz = hook(stateFile, 'Read', { file_path: '/c/a.js' });
    t.eq(fz.decision, 'deny', 'frozen: every non-git tool denied, Read included');
    t.assert(/frozen/i.test(fz.reason), 'frozen message says so');
    t.eq(hook(stateFile, 'Write', { file_path: '/c/current-status.md' }).decision, 'deny', 'frozen: even status writes denied');
    t.eq(hook(stateFile, 'Bash', { command: 'git commit -m halt' }).decision, 'none', 'frozen: git allowed');
    fs.unlinkSync(freezeFlag);
    fs.unlinkSync(stateFile);
    t.eq(hook(stateFile, 'Edit', { file_path: '/c/a.js' }).decision, 'deny', 'missing state file: fail closed');
    t.eq(hook(stateFile, 'Bash', { command: 'git status' }).decision, 'none', 'missing state file: git still allowed');
  }

  // @covers cap-po-runner-001 — end to end: a session that spends its working budget is landed by the hook, then max-turns honoured
  {
    const tools = [{ name: 'Edit', input: { file_path: 'a.js' } }, { name: 'Bash', input: { command: 'git commit -am wip' } }];
    const s = setup({ tranche: 1000, scenario: 'tools', extraEnv: { FAKE_CLAUDE_TOOLS: JSON.stringify(tools), FAKE_CLAUDE_TURN_DELAY_MS: '300' } });
    const runId = s.runner.start('acme', startOpts('acme'));
    const st = await s.runner.wait(runId);
    const d = readJsonl(s.hookOut);
    t.eq(d.length, 2, 'hook ran for both tool calls');
    t.eq(d[0] && d[0].decision, 'deny', 'turn 1 spent the 1000 FU budget → Edit denied');
    t.assert(d[0] && /current-status\.md/.test(d[0].reason), 'denial carries the landing message');
    t.eq(d[1] && d[1].decision, 'allow', 'git commit still allowed');
    t.eq(st.terminalReason, 'budget', 'terminal reason budget');
    const evs = s.L.read();
    t.eq(evs.find(e => e.type === 'draw').fu, 1000, 'draw up to the tranche');
    t.assert(evs.some(e => e.type === 'overrun'), 'excess recorded as overrun');

    const many = Array.from({ length: 4 }, () => ({ name: 'Read', input: { file_path: 'a' } }));
    const s2 = setup({ scenario: 'tools', extraEnv: { FAKE_CLAUDE_TOOLS: JSON.stringify(many) } });
    const r2 = s2.runner.start('acme', startOpts('acme', { maxTurns: 2 }));
    const st2 = await s2.runner.wait(r2);
    t.eq(st2.terminalReason, 'max_turns', '--max-turns honoured → terminal reason max_turns');
  }

  // @covers cap-po-runner-004 — clean env: nothing ANTHROPIC_*/CLAUDE_* inherited from the Owner's shell; only the allowlist + opts.env
  {
    const saved = { ...process.env };
    Object.assign(process.env, { ANTHROPIC_MODEL: 'claude-haiku-4-5', ANTHROPIC_API_KEY: 'sk-owner', CLAUDE_CONFIG_DIR: '/tmp/owner', OWNER_SECRET: 'x' });
    try {
      const s = setup();
      const runId = s.runner.start('acme', startOpts('acme'));
      await s.runner.wait(runId);
      const st = starts(s.log)[0];
      t.assert(!st.envKeys.some(k => /^(ANTHROPIC|CLAUDE)_/.test(k)), `child env has no ANTHROPIC_*/CLAUDE_* (got ${st.envKeys.filter(k => /^(ANTHROPIC|CLAUDE)_/.test(k))})`);
      t.assert(!st.envKeys.includes('OWNER_SECRET'), 'arbitrary Owner env not inherited');
      for (const k of ['PATH', 'HOME']) t.assert(st.envKeys.includes(k), `${k} passed through the allowlist`);
      t.assert(st.envKeys.includes('FAKE_CLAUDE_SCENARIO'), 'variables the runner passes explicitly (opts.env) reach the child');
      const s2 = setup({ extraEnv: { ANTHROPIC_API_KEY: 'sk-company' } });
      const r2 = s2.runner.start('acme', startOpts('acme'));
      await s2.runner.wait(r2);
      t.eq(starts(s2.log)[0].anthropicApiKey, 'sk-company', 'a key the runner sets itself is passed (C14 seam)');
    } finally {
      for (const k of Object.keys(process.env)) if (!(k in saved)) delete process.env[k];
      Object.assign(process.env, saved);
    }
  }

  // @covers cap-po-runner-004 — model pinned in runner-owned settings and on the command line
  {
    const s = setup();
    const runId = s.runner.start('acme', startOpts('acme'));
    await s.runner.wait(runId);
    const a = starts(s.log)[0].argv;
    t.eq(a[a.indexOf('--model') + 1], 'claude-opus-5-5', '--model passed');
    t.eq(a[a.indexOf('--max-budget-usd') + 1], '1', '--max-budget-usd passed through');
    t.eq(a[a.indexOf('--setting-sources') + 1], 'project', 'user settings are never loaded (--setting-sources project)');
    const e3 = codeOf(() => s.mk({ extraArgs: ['--setting-sources', 'user'] }));
    t.eq(e3 && e3.code, 'UNSAFE_FLAG', 'extraArgs cannot re-enable user settings');
    const settings = JSON.parse(fs.readFileSync(a[a.indexOf('--settings') + 1], 'utf8'));
    t.eq(settings.model, 'claude-opus-5-5', 'settings pin the model');
    t.eq(JSON.parse(fs.readFileSync(path.join(s.holdingDir, 'runs', `${runId}.json`), 'utf8')).model, 'claude-opus-5-5', 'run record names the model');
    const e = codeOf(() => s.mk({ extraArgs: ['--model', 'x'] }));
    t.eq(e && e.code, 'UNSAFE_FLAG', 'extraArgs cannot override the model');
    const e2 = codeOf(() => s.runner.start('acme', startOpts('acme', { model: undefined })));
    t.eq(e2 && e2.code, 'MODEL_REQUIRED', 'a run must name its model');
  }

  // @covers cap-po-runner-004 — init reports another model (spike 2): hard stop at init, terminalReason model_mismatch, no draw
  {
    const s = setup({ scenario: 'sleep', extraEnv: { FAKE_CLAUDE_INIT_MODEL: 'claude-haiku-4-5', FAKE_CLAUDE_SLEEP_MS: '4000' } });
    const t0 = Date.now();
    const runId = s.runner.start('acme', startOpts('acme'));
    const st = await s.runner.wait(runId);
    t.assert(Date.now() - t0 < 3500, 'stopped at init, not after the session');
    t.eq(st.state, 'interrupted', 'model mismatch → interrupted');
    t.eq(st.terminalReason, 'model_mismatch', 'terminal reason model_mismatch');
    t.assert(/claude-haiku-4-5/.test(st.error || '') && /claude-opus-5-5/.test(st.error || ''), 'error names both models');
    const evs = s.L.read();
    t.eq(evs.filter(e => e.type === 'draw').length, 0, 'no draw');
    t.assert(evs.some(e => e.type === 'unmetered' && e.run_id === runId), 'whatever ran is still recorded (unmetered), never hidden');
  }

  // @covers cap-po-runner-005 — a per-run cap below the model's session floor is refused at start, naming the floor
  {
    const s = setup();
    const e = codeOf(() => s.runner.start('acme', startOpts('acme', { maxBudgetUsd: 0.02 })));
    t.eq(e && e.code, 'BUDGET_BELOW_FLOOR', '$0.02 cap under the $0.08 Opus floor refused');
    t.assert(e && /0\.08/.test(e.message) && /claude-opus-5-5/.test(e.message), 'refusal names the floor and the model');
    const e2 = codeOf(() => s.runner.start('acme', startOpts('acme', { model: 'claude-haiku-4-5' })));
    t.eq(e2 && e2.code, 'NO_SESSION_FLOOR', 'a model missing from sessionFloorUsd is refused (no invented default)');
    const e3 = codeOf(() => s.runner.start('acme', startOpts('acme', { maxBudgetUsd: undefined })));
    t.eq(e3 && e3.code, 'MAX_BUDGET_REQUIRED', 'a per-run budget is required');
    const e4 = codeOf(() => s.mk({ sessionFloorUsd: undefined }));
    t.eq(e4 && e4.code, 'SESSION_FLOOR_REQUIRED', 'the runner needs the session-floor map');
    const ok = s.runner.start('acme', startOpts('acme', { maxBudgetUsd: 0.08 }));
    await s.runner.wait(ok);
    t.eq(starts(s.log).length, 1, 'only the at-floor run spawned');
  }

  // @covers cap-po-reserve-001 — the runner itself (shared pre-flight, limits from the ledger) refuses a run once the overrun reserve is empty
  {
    const holdingDir = tmpDir('holding-reserve-');
    const ledgerFile = path.join(holdingDir, 'fuel', 'ledger.jsonl');
    const L = openLedger(ledgerFile, { now: FIXED_NOW }); // no genesis: every limit comes from the chain
    L.append({ type: 'limits', actor: 'holding-owner', idem_key: 'limits:1', limits: { envelopePerCycle: 1000000, reclaimCyclesWithoutProof: 1,
      smallBetReserve: 0, smallBetMax: null, overrunReserve: 0.05, proofRevertCommits: 10, concurrency: 1 } });
    L.append({ type: 'price_table', actor: 'holding-owner', idem_key: 'pt:1', price_table: PRICE });
    L.append({ type: 'runner_pin', actor: 'holding-owner', idem_key: 'pin:1', claude_code_version: '2.1.292', session_floor_usd: FLOORS });
    L.append({ type: 'fund', actor: 'holding-owner', idem_key: 'fund:1', amount_fu: 1000000 });
    L.append(grant({ grant_id: 'g-acme', idem_key: 'grant-g-acme', company: 'acme', mission_id: 'm-acme', appetite_fu: 200000,
      tranches: [{ size_fu: 200000, proof: { kind: 'verified_surface', ref: 'acme/S-1' } }] }));
    t.eq(L.fold().pool.reserves.overrun_fu, 50000, 'the ledger limits carve the overrun reserve');
    const co = tmpDir('co-reserve-');
    const log = path.join(holdingDir, 'fake.log');
    const runner = createLocalRunner({ holdingDir, companies: [{ id: 'acme', path: co }], claudeBin: [process.execPath, FAKE], model: 'claude-opus-5-5',
      env: { FAKE_CLAUDE_SCENARIO: 'ok', FAKE_CLAUDE_LOG: log } }); // no priceTable / pin / floors / limits options: all from the ledger
    const d = draw(10, { grant_id: 'g-acme', mission_id: 'm-acme', company: 'acme', run_id: 'prior', session_id: 'ps', result_uuid: 'pu',
      price_table_version: PRICE.version });
    L.append(d);
    L.append({ type: 'overrun', actor: 'runner', idem_key: `${d.idem_key}:overrun`, run_id: 'prior', session_id: 'ps', result_uuid: 'pu',
      fu: 50000, price_table_version: PRICE.version });
    t.eq(L.fold().pool.overrun_reserve_empty, true, 'the reserve is empty');
    const e = codeOf(() => runner.start('acme', startOpts('acme', { maxBudgetUsd: 1, model: 'claude-opus-5-5' })));
    t.eq(e && e.code, 'OVERRUN_RESERVE_EMPTY', 'the runner refuses: overruns stop when the reserve is empty');
    t.eq(starts(log).length, 0, 'no session spawned');
    const bad = codeOf(() => createLocalRunner({ holdingDir, companies: [{ id: 'acme', path: co }], priceTable: { ...PRICE, version: 'other' } }));
    t.eq(bad && bad.code, 'CONFIG_MISMATCH', 'a runner option that contradicts the ledger is refused (the ledger wins)');
    runner.close();
  }

  return t.done();
}

module.exports = main();
