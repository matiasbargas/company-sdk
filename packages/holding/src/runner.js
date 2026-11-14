'use strict';

/**
 * runner.js — LocalRunner, the v0 Runner contract (cap-po-runner-001, cap-po-runner-003, cap-po-killswitch-001;
 * Mario gate C2, C5, C8, C9).
 *
 * Contract (RUNNER_CONTRACT_VERSION):
 *   start(companyId, { prompt, grantId, missionId, maxTurns, idempotencyKey? }) → runId   (throws RunnerError on refusal)
 *   stop(runId, { mode: 'landing' | 'hard' })
 *   status(runId) → { runId, company, state, terminalReason, waitingFor?, error? }
 *     state:          queued | running | landing | done | interrupted | failed
 *     terminalReason: done | budget | tranche_exhausted | killed | frozen | error | max_turns
 *   meter(runId)  → UsageEvent[]  (meter.js records for the session)
 *   wait(runId)   → Promise<status> once terminal (convenience, not part of the cloud seam)
 *
 * The runner is the only pre-flight and metering authority:
 *   - pre-flight folds the ledger on start and again when a queued run is dequeued: refuse when the
 *     ledger is frozen, the grant is not an open grant of this company and mission, or the open
 *     tranche has no FU left (tranche gating applies even with infinite fuel);
 *   - start is idempotent on the caller's key (C9): runId = hash(company, key), and the run record
 *     <holding>/runs/<runId>.json is created exclusively, so a second start (any process) never spawns;
 *   - concurrency: an in-process semaphore (limits.concurrency, default 1) plus a per-company lock file
 *     <holding>/runs/<company>.lock that holds across runner processes (one writer session per repo).
 *     A lock left by a crashed runner is never broken automatically; status names it (waitingFor);
 *   - each session gets a runner-owned settings file (bypass disabled, holding/ denied to file tools,
 *     the landing hook wired on PreToolUse) and a state file the hook reads. The runner updates the
 *     state file's spent_fu live from assistant-message usage, so the hook lands the session at the
 *     next tool call once the working budget (the open tranche's FU) is spent;
 *   - the kill switch: while runs are active the runner polls the ledger and mirrors `frozen` into
 *     <holding>/runs/FROZEN; the hook then denies every non-git tool;
 *   - after exit the stream is metered (meter.js, version pinned per runner, C5) and appended as the
 *     `runner` actor: draw (+ overrun above the cap), or unmetered. A draw the ledger refuses (e.g.
 *     frozen mid-run) is recorded as `unmetered` carrying the raw counts: burn is never hidden.
 * Never passes --dangerously-skip-permissions / bypassPermissions; extraArgs that would are refused.
 *
 * Iteration 2 (spike 2, cap-po-runner-004/005):
 *   - clean child env: only ENV_ALLOWLIST from the Owner's process plus what the runner passes in
 *     opts.env (spike 2: an inherited ANTHROPIC_MODEL overrode --model and the run went to Opus);
 *   - the model is pinned twice (runner-owned settings `model` and --model) and verified at the
 *     session's system:init; a different resolved model is hard-stopped → terminalReason model_mismatch,
 *     no draw (whatever ran is recorded as unmetered);
 *   - start refuses a maxBudgetUsd below opts.sessionFloorUsd[model] (no defaults: a model missing
 *     from the map is refused); --max-budget-usd is passed through as the soft ceiling;
 *   - a session that started before a freeze still owes its draw: the runner retries a draw refused
 *     with LEDGER_FROZEN as { after_freeze: true, run_started_seq }.
 *
 * Iteration 2 (config in the chain): fuel limits (concurrency, reserves), the price table, the
 * Claude Code pin and the session floors are read from the folded ledger (`limits`, `price_table`,
 * `runner_pin` events) at every pre-flight. Constructor opts priceTable / pinnedVersion /
 * sessionFloorUsd / limits are a legacy fallback used only while the ledger lacks the event; when
 * both exist they must agree (CONFIG_MISMATCH). Pre-flight is preflight.js, shared with sdk-holding,
 * so reserve and overrun enforcement (OVERRUN_RESERVE_EMPTY) live in one place.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawn, execFileSync } = require('child_process');
const { openLedger, LedgerError } = require('./ledger');
const { preflightRun } = require('./preflight');
const { canonicalize } = require('./canonical');
const { meterStream, priceFu, toLedgerEvents } = require('./meter');
const { hashCanonical } = require('./canonical');

const RUNNER_CONTRACT_VERSION = 1;
const RECORD_SCHEMA_VERSION = 1;
const STATES = ['queued', 'running', 'landing', 'done', 'interrupted', 'failed'];
const TERMINAL_REASONS = ['done', 'budget', 'tranche_exhausted', 'killed', 'frozen', 'error', 'max_turns', 'model_mismatch'];
// The only variables a session inherits from the Owner's process. Everything else (ANTHROPIC_*,
// CLAUDE_*, keys, model overrides) reaches the child only if the runner passes it in opts.env.
const ENV_ALLOWLIST = ['PATH', 'HOME', 'LANG', 'TMPDIR'];
const TERMINAL_STATES = new Set(['done', 'interrupted', 'failed']);
const HOOK_SCRIPT = path.join(__dirname, 'landing-hook.js');
// Flags the runner owns or must never pass through extraArgs.
const RUNNER_OWNED_FLAGS = new Set(['-p', '--print', '--output-format', '--max-turns', '--settings', '--permission-mode', '--verbose',
  '--model', '--max-budget-usd', '--setting-sources']);
const UNSAFE_RE = /dangerously|bypass/i;

class RunnerError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new RunnerError(code, message); };

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');
const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

function writeJsonAtomic(file, obj, mode = 0o600) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', { mode });
  fs.renameSync(tmp, file);
}
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

function reasonForRefusal(code) {
  if (code === 'LEDGER_FROZEN') return 'frozen';
  if (code === 'TRANCHE_EXHAUSTED') return 'tranche_exhausted';
  return 'error';
}

function checkExtraArgs(extraArgs) {
  if (!Array.isArray(extraArgs) || !extraArgs.every(a => typeof a === 'string')) fail('INVALID_OPTION', 'extraArgs must be an array of strings');
  for (const a of extraArgs) {
    const flag = a.split('=')[0];
    if (UNSAFE_RE.test(a) || RUNNER_OWNED_FLAGS.has(flag)) fail('UNSAFE_FLAG', `extraArgs may not contain ${a} (runner-owned or skip-permissions)`);
  }
}

/**
 * opts: { holdingDir, companies: [{ id, path }], model?,
 *         legacy fallback while the ledger lacks the event: limits (genesis), priceTable, pinnedVersion, sessionFloorUsd, claudeBin?: string | [cmd, ...prefixArgs], extraArgs?, env?, now?,
 *         freezePollMs?, lockRetryMs?, landingTimeoutMs?, hardKillGraceMs?, statusFiles?, ledgerFile?, runsDir? }
 */
function createLocalRunner(opts = {}) {
  if (!isNonEmptyString(opts.holdingDir)) fail('INVALID_OPTION', 'holdingDir is required');
  if (!Array.isArray(opts.companies)) fail('INVALID_OPTION', 'companies [{ id, path }] is required');
  const extraArgs = opts.extraArgs || [];
  checkExtraArgs(extraArgs);
  const legacyLimits = opts.limits && 'envelopePerCycle' in opts.limits ? opts.limits : undefined;
  if (opts.limits && opts.limits.concurrency !== undefined && (!Number.isSafeInteger(opts.limits.concurrency) || opts.limits.concurrency < 1)) {
    fail('INVALID_OPTION', 'limits.concurrency must be a positive integer');
  }

  const holdingDir = path.resolve(opts.holdingDir);
  const runsDir = opts.runsDir || path.join(holdingDir, 'runs');
  const ledgerFile = opts.ledgerFile || path.join(holdingDir, 'fuel', 'ledger.jsonl');
  let ledger;
  try { ledger = openLedger(ledgerFile, { limits: legacyLimits, now: opts.now }); } catch (err) {
    if (err instanceof LedgerError) fail('INVALID_OPTION', err.message);
    throw err;
  }

  /** Runner config from the folded ledger, legacy opts only where the ledger has nothing. */
  function resolveConfig(state) {
    const pt = state.config.price_table;
    const pin = state.config.runner_pin;
    if (pt && opts.priceTable && opts.priceTable.version !== pt.version) {
      fail('CONFIG_MISMATCH', `runner opts priceTable ${opts.priceTable.version} differs from the ledger's ${pt.version}; the ledger wins — drop the option`);
    }
    if (pin && opts.pinnedVersion && opts.pinnedVersion !== pin.claude_code_version) {
      fail('CONFIG_MISMATCH', `runner opts pinnedVersion ${opts.pinnedVersion} differs from the ledger's ${pin.claude_code_version}`);
    }
    if (pin && opts.sessionFloorUsd && canonicalize(opts.sessionFloorUsd) !== canonicalize(pin.session_floor_usd)) {
      fail('CONFIG_MISMATCH', 'runner opts sessionFloorUsd differs from the ledger\'s runner pin');
    }
    const cfg = {
      priceTable: pt ? { version: pt.version, models: pt.models } : opts.priceTable,
      pinnedVersion: pin ? pin.claude_code_version : opts.pinnedVersion,
      floors: pin ? pin.session_floor_usd : opts.sessionFloorUsd,
      concurrency: (state.limits && state.limits.concurrency) || 1,
      fromLedger: { priceTable: !!pt, runnerPin: !!pin },
    };
    if (!isNonEmptyString(cfg.pinnedVersion)) fail('PIN_REQUIRED', 'pinnedVersion (the Claude Code version this runner meters) is required (C5): record a runner_pin');
    if (!cfg.priceTable) fail('INVALID_OPTION', 'priceTable is required: record a price_table');
    const f = cfg.floors;
    if (!f || typeof f !== 'object' || Array.isArray(f) || !Object.values(f).every(v => typeof v === 'number' && Number.isFinite(v) && v >= 0)) {
      fail('SESSION_FLOOR_REQUIRED', 'sessionFloorUsd { [model]: usd } is required (the fixed per-session cost; no defaults)');
    }
    return cfg;
  }
  const foldOrFail = () => { try { return ledger.fold(); } catch (err) { fail('LEDGER_INVALID', `cannot fold the fuel ledger: ${err.message}`); } };
  let cfg = resolveConfig(foldOrFail());
  const freezeFlag = path.join(runsDir, 'FROZEN');
  const claudeBin = Array.isArray(opts.claudeBin) ? opts.claudeBin : [opts.claudeBin || 'claude'];
  const env = {};
  for (const k of ENV_ALLOWLIST) if (process.env[k] !== undefined) env[k] = process.env[k];
  Object.assign(env, opts.env || {});
  const freezePollMs = opts.freezePollMs ?? 1000;
  const lockRetryMs = opts.lockRetryMs ?? 1000;
  const landingTimeoutMs = opts.landingTimeoutMs ?? 10 * 60 * 1000;
  const hardKillGraceMs = opts.hardKillGraceMs ?? 2000;
  const statusFiles = opts.statusFiles || ['current-status.md'];
  const now = opts.now || (() => new Date().toISOString());
  const companies = new Map(opts.companies.map(c => [c.id, c]));
  fs.mkdirSync(runsDir, { recursive: true, mode: 0o755 });

  const runs = new Map();     // runId -> in-process run
  const queue = [];           // queued runs, FIFO
  const active = new Set();   // running/landing runs
  const busy = new Set();     // companies with an active run in this process
  let versionOk = null; // the pinned version last verified against `claude --version`
  let retryTimer = null;
  let pollTimer = null;

  const recFile = (runId) => path.join(runsDir, `${runId}.json`);
  const lockFile = (company) => path.join(runsDir, `${company}.lock`);

  function persist(run) { writeJsonAtomic(recFile(run.id), run.record); }

  function setState(run, state, extra = {}) {
    Object.assign(run.record, { state, ...extra });
    persist(run);
  }

  function syncFreezeFlag(frozen) {
    const exists = fs.existsSync(freezeFlag);
    if (frozen && !exists) fs.writeFileSync(freezeFlag, `frozen (mirrored from the ledger at ${now()})\n`, { mode: 0o644 });
    if (!frozen && exists) fs.unlinkSync(freezeFlag);
  }

  // The shared pre-flight (preflight.js) over the folded ledger; refreshes the runner config too.
  function preflight(companyId, grantId, missionId, model, maxBudgetUsd) {
    const state = foldOrFail();
    syncFreezeFlag(state.frozen);
    cfg = resolveConfig(state);
    let availableFu;
    try { ({ availableFu } = preflightRun(state, { companyId, grantId, missionId, model, maxBudgetUsd })); } catch (err) {
      if (err instanceof LedgerError) fail(err.code, err.message.replace(`${err.code}: `, ''));
      throw err;
    }
    const company = companies.get(companyId);
    if (!fs.existsSync(company.path)) fail('COMPANY_PATH_MISSING', `company ${companyId} clone ${company.path} does not exist`);
    return { availableFu, cfg };
  }

  function checkVersion() {
    if (versionOk === cfg.pinnedVersion) return;
    let out;
    try {
      out = execFileSync(claudeBin[0], [...claudeBin.slice(1), '--version'], { encoding: 'utf8', timeout: 15000, env });
    } catch (err) { fail('VERSION_CHECK_FAILED', `could not run ${claudeBin.join(' ')} --version: ${err.message}`); }
    const m = String(out).match(/\d+\.\d+\.\d+/);
    const v = m ? m[0] : 'unknown';
    if (v !== cfg.pinnedVersion) fail('VERSION_MISMATCH', `claude reports ${v}; this runner is pinned to ${cfg.pinnedVersion} (C5)`);
    versionOk = cfg.pinnedVersion;
  }

  function settingsFor(run) {
    const roots = [...new Set([holdingDir, fs.realpathSync(holdingDir)])];
    const deny = [];
    for (const r of roots) for (const tool of ['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit']) deny.push(`${tool}(/${r}/**)`);
    return {
      model: run.model,
      permissions: { defaultMode: 'default', disableBypassPermissionsMode: 'disable', deny },
      hooks: { PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', timeout: 10,
        command: `${shq(process.execPath)} ${shq(HOOK_SCRIPT)} --state ${shq(run.stateFile)}` }] }] },
    };
  }

  function writeRunState(run) {
    writeJsonAtomic(run.stateFile, {
      run_id: run.id, budget_fu: run.capFu, spent_fu: run.spentFu, landing: run.landing, landing_reason: run.landingReason,
      freeze_flag: freezeFlag, status_files: statusFiles,
    }, 0o644);
  }

  function enterLanding(run, reason) {
    if (!run.landing) { run.landing = true; run.landingReason = reason; writeRunState(run); }
    if (run.record.state === 'running') setState(run, 'landing');
  }

  // Live working-budget estimate from assistant-message usage (deduped by message id). The
  // authoritative figure is result.modelUsage, metered after exit.
  function onLine(run, line) {
    let m;
    try { m = JSON.parse(line); } catch { return; }
    if (m && m.type === 'system' && m.subtype === 'init' && !run.modelMismatch && m.model !== run.model) {
      run.modelMismatch = `session resolved model ${m.model || 'unknown'}, but the run is pinned to ${run.model}`;
      hardKill(run);
      return;
    }
    if (!m || m.type !== 'assistant' || !m.message || !m.message.usage || !m.message.id) return;
    const u = m.message.usage;
    run.usageById.set(m.message.id, { model: m.message.model, in: u.input_tokens || 0, out: u.output_tokens || 0,
      cw: u.cache_creation_input_tokens || 0, cr: u.cache_read_input_tokens || 0 });
    const byModel = new Map();
    for (const r of run.usageById.values()) {
      const acc = byModel.get(r.model) || { model: r.model, in: 0, out: 0, cw: 0, cr: 0 };
      for (const k of ['in', 'out', 'cw', 'cr']) acc[k] += r[k];
      byModel.set(r.model, acc);
    }
    let spent;
    try { spent = priceFu([...byModel.values()], run.cfg.priceTable).fu; } catch {
      spent = run.capFu; // unpriced model: fail closed into landing
    }
    if (spent === run.spentFu) return;
    run.spentFu = spent;
    writeRunState(run);
    if (spent >= run.capFu) { run.budgetSpent = true; enterLanding(run, `the working budget is spent (${spent} of ${run.capFu} FU)`); }
  }

  function startPolling() {
    if (pollTimer) return;
    pollTimer = setInterval(() => {
      if (active.size === 0) { clearInterval(pollTimer); pollTimer = null; return; }
      let frozen;
      try { frozen = ledger.fold().frozen; } catch { return; }
      syncFreezeFlag(frozen);
      if (!frozen) return;
      for (const run of active) {
        if (!run.frozenSeen) { run.frozenSeen = true; enterLanding(run, 'the holding Owner froze the fuel ledger'); }
      }
    }, freezePollMs);
    pollTimer.unref();
  }

  function acquireLock(run) {
    try {
      const fd = fs.openSync(lockFile(run.company), 'wx', 0o600);
      fs.writeSync(fd, JSON.stringify({ run_id: run.id, pid: process.pid, since: now() }));
      fs.closeSync(fd);
      return true;
    } catch (err) {
      if (err.code === 'EEXIST') return false;
      throw err;
    }
  }

  function releaseLock(run) {
    const f = lockFile(run.company);
    try { if (readJson(f).run_id === run.id) fs.unlinkSync(f); } catch { /* not ours or already gone */ }
  }

  function settle(run) {
    const st = statusOf(run.record);
    for (const w of run.waiters.splice(0)) w(st);
  }

  function finishWithoutSpawn(run, state, terminalReason, error) {
    const i = queue.indexOf(run);
    if (i >= 0) queue.splice(i, 1);
    setState(run, state, { terminal_reason: terminalReason, error: error || null, waiting_for: null, ended_at: now() });
    settle(run);
  }

  function pump() {
    let waitingForLock = false;
    for (const run of [...queue]) {
      if (active.size >= cfg.concurrency) break;
      if (busy.has(run.company)) { run.record.waiting_for = `company ${run.company} has an active run in this runner`; continue; }
      let pf;
      try { pf = preflight(run.company, run.record.grant_id, run.record.mission_id, run.model, run.record.max_budget_usd); checkVersion(); } catch (err) {
        if (!(err instanceof RunnerError)) throw err;
        finishWithoutSpawn(run, 'failed', reasonForRefusal(err.code), err.message);
        continue;
      }
      if (!acquireLock(run)) {
        waitingForLock = true;
        if (run.record.waiting_for !== lockFile(run.company)) setState(run, 'queued', { waiting_for: lockFile(run.company) });
        continue;
      }
      queue.splice(queue.indexOf(run), 1);
      run.cfg = pf.cfg; // the price table and pin this session is metered with
      launch(run, pf.availableFu);
    }
    if (waitingForLock && !retryTimer) retryTimer = setTimeout(() => { retryTimer = null; pump(); }, lockRetryMs);
  }

  function launch(run, availableFu) {
    const company = companies.get(run.company);
    run.capFu = availableFu;
    run.spentFu = 0;
    run.stateFile = path.join(runsDir, `${run.id}.state.json`);
    run.settingsFile = path.join(runsDir, `${run.id}.settings.json`);
    run.streamFile = path.join(runsDir, `${run.id}.stream.jsonl`);
    try { run.startedSeq = ledger.verify().count; } catch { run.startedSeq = undefined; }
    writeRunState(run);
    writeJsonAtomic(run.settingsFile, settingsFor(run), 0o644);
    const args = ['-p', run.prompt, '--output-format', 'stream-json', '--verbose', '--max-turns', String(run.record.max_turns),
      '--model', run.model, '--max-budget-usd', String(run.record.max_budget_usd), '--settings', run.settingsFile,
      // Never load the Owner's user settings (spike 2: user `model` overrode --model). Only the
      // company's committed project settings plus the runner-owned --settings apply.
      '--setting-sources', 'project', ...extraArgs];
    run.streamFd = fs.openSync(run.streamFile, 'a', 0o600);
    active.add(run);
    busy.add(run.company);
    let child;
    try {
      child = spawn(claudeBin[0], [...claudeBin.slice(1), ...args], {
        cwd: company.path, env: { ...env, HOLDING_RUN_ID: run.id }, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
    } catch (err) { finalize(run, null, null, err); return; }
    run.child = child;
    setState(run, 'running', { waiting_for: null, started_at: now(), pid: child.pid, cap_fu: run.capFu, run_started_seq: run.startedSeq ?? null,
      settings_file: run.settingsFile, state_file: run.stateFile, stream_file: run.streamFile });
    let buf = '';
    child.stdout.on('data', (chunk) => {
      fs.writeSync(run.streamFd, chunk);
      buf += chunk.toString('utf8');
      let nl;
      while ((nl = buf.indexOf('\n')) >= 0) { onLine(run, buf.slice(0, nl)); buf = buf.slice(nl + 1); }
    });
    child.stderr.on('data', (chunk) => { if (run.stderr.length < 64 * 1024) run.stderr += chunk.toString('utf8'); });
    child.on('error', (err) => finalize(run, null, null, err));
    child.on('close', (code, signal) => { if (buf) onLine(run, buf); finalize(run, code, signal, null); });
    startPolling();
  }

  function killGroup(run, signal) {
    if (!run.child || run.finalized) return;
    try { process.kill(-run.child.pid, signal); } catch { try { run.child.kill(signal); } catch { /* gone */ } }
  }

  function hardKill(run) {
    run.stopRequested = 'hard';
    killGroup(run, 'SIGTERM');
    run.killTimer = setTimeout(() => killGroup(run, 'SIGKILL'), hardKillGraceMs);
    run.killTimer.unref();
  }

  function terminalOf(run, code, signal, result) {
    if (run.modelMismatch) return ['interrupted', 'model_mismatch'];
    if (run.stopRequested === 'hard') return ['interrupted', 'killed'];
    if (!result) return signal ? ['interrupted', 'killed'] : ['failed', 'error'];
    if (run.frozenSeen) return ['done', 'frozen'];
    if (run.stopRequested === 'landing') return ['done', 'killed'];
    if (result.subtype === 'error_max_turns' || result.terminal_reason === 'max_turns') return ['done', 'max_turns'];
    if (result.subtype === 'error_max_budget_usd' || result.terminal_reason === 'budget_exhausted' || run.budgetSpent) return ['done', 'budget'];
    if (result.is_error || result.subtype !== 'success') return ['failed', 'error'];
    return ['done', 'done'];
  }

  /** Append the session's meter records as the runner. Returns { usage, pending, warnings }. */
  function recordUsage(run, records) {
    const usage = { fu_drawn: 0, fu_overrun: 0, unmetered: 0, records: records.length };
    const pending = [];
    const warnings = [];
    const ctx = { runId: run.id, grantId: run.record.grant_id, missionId: run.record.mission_id, company: run.company, priceTable: run.cfg.priceTable };
    let remainingCap = run.capFu;
    const append = (e) => {
      try { ledger.append(e); return null; } catch (err) {
        if (err instanceof LedgerError && !['LOCK_TIMEOUT', 'CHAIN_BROKEN'].includes(err.code)) return err;
        pending.push(e);
        warnings.push(`ledger write deferred (${err.message}); event kept in ledger_pending`);
        return 'pending';
      }
    };
    for (const original of records) {
      // A session on the wrong model is never charged as a draw; its usage is kept as unmetered.
      const rec = run.modelMismatch && original.kind === 'usage'
        ? { ...original, kind: 'unmetered', reason: `model_mismatch: ${run.modelMismatch}` } : original;
      const evs = toLedgerEvents(rec, { ...ctx, capFu: remainingCap });
      const [first, ...rest] = evs;
      if (first.type === 'draw' && Number.isSafeInteger(run.startedSeq)) first.run_started_seq = run.startedSeq;
      if (first.type !== 'draw') {
        const r = append(first);
        if (r === null) usage.unmetered++;
        else if (r !== 'pending') warnings.push(`unmetered refused: ${r.message}`);
        continue;
      }
      let refused = append(first);
      let afterFreeze = false;
      if (refused && refused !== 'pending' && refused.code === 'LEDGER_FROZEN' && Number.isSafeInteger(run.startedSeq)) {
        // The session started before the freeze: its spend is owed to its grant (decision 2026-11-14).
        afterFreeze = true;
        refused = append({ ...first, after_freeze: true });
      }
      if (refused === 'pending') { pending.push(...rest); continue; }
      if (refused) {
        // The burn happened; a refused draw (frozen, exhausted) must not hide it.
        const priced = first.fu + rest.reduce((s, o) => s + o.fu, 0);
        const um = {
          type: 'unmetered', actor: 'runner', idem_key: `unmetered:${run.id}:${first.session_id}:${first.result_uuid}`,
          company: run.company, grant_id: ctx.grantId, mission_id: ctx.missionId, run_id: run.id,
          session_id: first.session_id, result_uuid: first.result_uuid,
          reason: `draw refused${afterFreeze ? ' (after_freeze draw attempted)' : ''}: ${refused.message}`,
          raw: first.raw, model_usage: first.model_usage, fu_priced: priced, price_table_version: first.price_table_version,
        };
        if (first.claude_code_version) um.claude_code_version = first.claude_code_version;
        const r = append(um);
        if (r === null) usage.unmetered++;
        else if (r !== 'pending') warnings.push(`unmetered refused: ${r.message}`);
        continue;
      }
      usage.fu_drawn += first.fu;
      remainingCap = Math.max(0, remainingCap - first.fu);
      for (const o of rest) {
        const r = append(o);
        if (r === null) usage.fu_overrun += o.fu;
        else if (r !== 'pending') warnings.push(`overrun refused: ${r.message}`);
      }
    }
    return { usage, pending, warnings };
  }

  function finalize(run, code, signal, spawnErr) {
    if (run.finalized) return;
    run.finalized = true;
    clearTimeout(run.killTimer);
    clearTimeout(run.landingTimer);
    if (run.streamFd !== undefined) { try { fs.closeSync(run.streamFd); } catch { /* closed */ } }
    active.delete(run);
    busy.delete(run.company);
    releaseLock(run);
    const text = run.streamFile && fs.existsSync(run.streamFile) ? fs.readFileSync(run.streamFile, 'utf8') : '';
    let result = null;
    for (const l of text.split('\n')) { try { const m = JSON.parse(l); if (m && m.type === 'result') result = m; } catch { /* meter decides */ } }
    const warnings = [];
    let records = [];
    let usage = { fu_drawn: 0, fu_overrun: 0, unmetered: 0, records: 0 };
    let pending = [];
    if (!spawnErr) {
      records = meterStream(text, { pinnedVersion: run.cfg.pinnedVersion });
      const r = recordUsage(run, records);
      usage = r.usage; pending = r.pending; warnings.push(...r.warnings);
    }
    const companyPath = companies.get(run.company).path;
    if (fs.existsSync(path.join(companyPath, '.git', 'index.lock'))) warnings.push(`${companyPath}/.git/index.lock remains after the session`);
    const [state, terminalReason] = spawnErr ? ['failed', 'error'] : terminalOf(run, code, signal, result);
    setState(run, state, {
      terminal_reason: terminalReason, exit_code: code, signal: signal || null, ended_at: now(),
      error: spawnErr ? spawnErr.message : run.modelMismatch ? `MODEL_MISMATCH: ${run.modelMismatch}` : (state === 'failed' && run.stderr ? run.stderr.slice(-2000) : null),
      usage, usage_events: records, ledger_pending: pending, warnings,
    });
    settle(run);
    pump();
  }

  function statusOf(rec) {
    const st = { runId: rec.run_id, company: rec.company, state: rec.state, terminalReason: rec.terminal_reason || null };
    if (rec.waiting_for) st.waitingFor = rec.waiting_for;
    if (rec.error) st.error = rec.error;
    return st;
  }

  function loadRecord(runId) {
    const run = runs.get(runId);
    if (run) return run.record;
    try { return readJson(recFile(runId)); } catch { return null; }
  }

  function start(companyId, o = {}) {
    if (!companies.has(companyId)) fail('UNKNOWN_COMPANY', `company ${JSON.stringify(companyId)} is not registered with this runner`);
    if (!isNonEmptyString(o.prompt)) fail('PROMPT_REQUIRED', 'start needs a prompt');
    if (!isNonEmptyString(o.grantId)) fail('GRANT_REQUIRED', 'start needs a grantId');
    if (!isNonEmptyString(o.missionId)) fail('MISSION_REQUIRED', 'start needs a missionId');
    if (!Number.isSafeInteger(o.maxTurns) || o.maxTurns < 1) fail('MAX_TURNS_REQUIRED', 'start needs maxTurns (a positive integer stop condition)');
    if (o.idempotencyKey !== undefined && !isNonEmptyString(o.idempotencyKey)) fail('INVALID_OPTION', 'idempotencyKey must be a non-empty string');
    const model = o.model || opts.model;
    if (!isNonEmptyString(model)) fail('MODEL_REQUIRED', 'start needs a model (opts.model or runner opts.model); it is pinned for the session');
    if (typeof o.maxBudgetUsd !== 'number' || !Number.isFinite(o.maxBudgetUsd) || o.maxBudgetUsd <= 0) {
      fail('MAX_BUDGET_REQUIRED', 'start needs maxBudgetUsd (a positive number, passed as --max-budget-usd)');
    }
    cfg = resolveConfig(foldOrFail());
    const floors = cfg.floors;
    if (!Object.prototype.hasOwnProperty.call(floors, model)) {
      fail('NO_SESSION_FLOOR', `sessionFloorUsd has no floor for model ${model}; record one before running it`);
    }
    if (o.maxBudgetUsd < floors[model]) {
      fail('BUDGET_BELOW_FLOOR', `maxBudgetUsd $${o.maxBudgetUsd} is below the $${floors[model]} session floor of ${model}; `
        + 'the first turn alone would overshoot it');
    }
    const key = o.idempotencyKey || crypto.randomUUID();
    const runId = `run-${sha256(`${companyId}\0${key}`).slice(0, 24)}`;
    const params = hashCanonical({ company: companyId, prompt: o.prompt, grantId: o.grantId, missionId: o.missionId, maxTurns: o.maxTurns,
      model, maxBudgetUsd: o.maxBudgetUsd });
    const same = (rec) => {
      if (rec.params_sha256 !== params) fail('IDEM_CONFLICT', `idempotencyKey ${JSON.stringify(key)} already started ${runId} with different parameters`);
      return runId;
    };
    const existing = loadRecord(runId);
    if (existing) return same(existing);

    preflight(companyId, o.grantId, o.missionId, model, o.maxBudgetUsd);

    const record = {
      schema_version: RECORD_SCHEMA_VERSION, runner_contract_version: RUNNER_CONTRACT_VERSION, run_id: runId,
      company: companyId, grant_id: o.grantId, mission_id: o.missionId, max_turns: o.maxTurns, idempotency_key: key,
      model, max_budget_usd: o.maxBudgetUsd,
      params_sha256: params, prompt_sha256: sha256(o.prompt), claude_code_version_pinned: cfg.pinnedVersion,
      price_table_version: cfg.priceTable.version,
      state: 'queued', terminal_reason: null, waiting_for: null, created_at: now(),
    };
    try {
      const fd = fs.openSync(recFile(runId), 'wx', 0o600);
      fs.writeSync(fd, JSON.stringify(record, null, 2) + '\n');
      fs.closeSync(fd);
    } catch (err) {
      if (err.code === 'EEXIST') return same(readJson(recFile(runId)));
      throw err;
    }
    const run = { id: runId, company: companyId, prompt: o.prompt, model, record, waiters: [], usageById: new Map(), stderr: '',
      landing: false, landingReason: null, finalized: false };
    runs.set(runId, run);
    queue.push(run);
    pump();
    return runId;
  }

  function stop(runId, o = {}) {
    const mode = o.mode;
    if (mode !== 'landing' && mode !== 'hard') fail('INVALID_STOP_MODE', 'stop mode must be "landing" or "hard"');
    const run = runs.get(runId);
    if (!run) {
      const rec = loadRecord(runId) || fail('UNKNOWN_RUN', `no run ${runId}`);
      if (TERMINAL_STATES.has(rec.state)) return statusOf(rec);
      fail('NOT_OWNED', `run ${runId} is owned by another runner process`);
    }
    if (TERMINAL_STATES.has(run.record.state)) return statusOf(run.record);
    if (run.record.state === 'queued') { finishWithoutSpawn(run, 'interrupted', 'killed', `stopped (${mode}) before it started`); return statusOf(run.record); }
    if (mode === 'hard') { hardKill(run); return statusOf(run.record); }
    if (run.stopRequested !== 'hard') run.stopRequested = 'landing';
    enterLanding(run, 'the holding asked this run to land');
    if (!run.landingTimer) { run.landingTimer = setTimeout(() => hardKill(run), landingTimeoutMs); run.landingTimer.unref(); }
    return statusOf(run.record);
  }

  function status(runId) {
    const rec = loadRecord(runId) || fail('UNKNOWN_RUN', `no run ${runId}`);
    return statusOf(rec);
  }

  function meter(runId) {
    const rec = loadRecord(runId) || fail('UNKNOWN_RUN', `no run ${runId}`);
    return rec.usage_events || [];
  }

  function wait(runId) {
    const run = runs.get(runId);
    if (run) {
      if (TERMINAL_STATES.has(run.record.state)) return Promise.resolve(statusOf(run.record));
      return new Promise(resolve => run.waiters.push(resolve));
    }
    return new Promise((resolve, reject) => {
      const tick = () => {
        const rec = loadRecord(runId);
        if (!rec) return reject(new RunnerError('UNKNOWN_RUN', `no run ${runId}`));
        if (TERMINAL_STATES.has(rec.state)) return resolve(statusOf(rec));
        setTimeout(tick, 100);
      };
      tick();
    });
  }

  function close() {
    clearTimeout(retryTimer);
    if (pollTimer) clearInterval(pollTimer);
  }

  return { version: RUNNER_CONTRACT_VERSION, start, stop, status, meter, wait, close };
}

module.exports = { createLocalRunner, RunnerError, RUNNER_CONTRACT_VERSION, STATES, TERMINAL_REASONS, ENV_ALLOWLIST };
