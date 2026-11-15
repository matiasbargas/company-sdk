'use strict';

/**
 * runner — LocalRunner, the v0 Runner contract (cap-po-runner-001…005, cap-po-killswitch-001; Mario gate C2, C5, C8, C9).
 *
 * Contract (RUNNER_CONTRACT_VERSION):
 *   start(companyId, { prompt, grantId, missionId, maxTurns, model?, maxBudgetUsd, idempotencyKey? }) → runId
 *     (throws RunnerError on refusal)
 *   stop(runId, { mode: 'landing' | 'hard' })
 *   status(runId) → { runId, company, state, terminalReason, waitingFor?, error? }
 *     state:          queued | running | landing | done | interrupted | failed
 *     terminalReason: see state.js TERMINAL_REASONS
 *   meter(runId) → UsageEvent[];  wait(runId) → Promise<status> once terminal (convenience, not the cloud seam)
 *
 * The runner is the only pre-flight and metering authority:
 *   - pre-flight (preflight.js, shared with sdk-holding) folds the ledger on start and again when a
 *     queued run is dequeued; limits, price table, Claude Code pin and session floors come from the
 *     ledger, constructor opts are a legacy fallback that must agree (CONFIG_MISMATCH);
 *   - start is idempotent on the caller's key (C9): runId = hash(company, key), and the run record
 *     <runs>/<runId>.json is created exclusively, so a second start (any process) never spawns;
 *   - concurrency: an in-process semaphore (ledger limits.concurrency, default 1) plus a per-company
 *     lock file <runs>/<company>.lock across processes; a stale lock is never broken automatically;
 *   - each session gets runner-owned settings (settings.js) and a state file the landing hook reads;
 *     the runner updates the state file's live burn estimate so the hook lands the session once the
 *     working budget (the open tranche's FU) is spent; the ledger's `frozen` is mirrored into
 *     <runs>/FROZEN while runs are active (kill switch);
 *   - clean env, model pinned and checked at system:init (model_mismatch → hard stop, no draw);
 *     with state.sandbox set the session runs as the D7 sandbox user (spawn.js: sudo --preserve-env,
 *     key in env only); without one, start refuses SANDBOX_REQUIRED unless opts.allowUnsandboxed (tests);
 *   - runner-owned settings carry an explicit permission profile (settings.js); permission_denials
 *     are recorded, and denials with no successful tool use end as no_work_denied;
 *   - after exit the stream is metered (meter.js, pinned version, C5) and appended as the `runner`
 *     (stream.js): draw (+ overrun above the cap) or unmetered; a pre-freeze session's draw is
 *     retried as after_freeze; burn is never hidden.
 * Modules: config, state (files), settings (permissions + argv), spawn (process), stream (metering), index (lifecycle).
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { openLedger, LedgerError } = require('../ledger');
const { preflightRun } = require('../preflight');
const { hashCanonical } = require('../canonical');
const { meterStream } = require('../meter');
const S = require('./state');
const { resolveRunnerConfig, validateStart } = require('./config');
const { checkExtraArgs, buildSettings, buildArgs } = require('./settings');
const { ENV_ALLOWLIST, baseEnv, checkVersion, checkSandbox, readCompanyKey, buildLaunch, spawnSession, killGroup } = require('./spawn');
const { liveEstimate, trackToolUses, denialSummary, lastResult, terminalOf, recordUsage } = require('./stream');

const { RunnerError, fail, isNonEmptyString, sha256, TERMINAL_STATES } = S;
const RUNNER_CONTRACT_VERSION = 1;

function reasonForRefusal(code) {
  if (code === 'LEDGER_FROZEN') return 'frozen';
  if (code === 'TRANCHE_EXHAUSTED') return 'tranche_exhausted';
  return 'error';
}

/**
 * opts: { holdingDir, companies: [{ id, path }], model?, claudeBin?: string | [cmd, ...prefixArgs], extraArgs?, env?,
 *         now?, freezePollMs?, lockRetryMs?, landingTimeoutMs?, hardKillGraceMs?, statusFiles?, ledgerFile?, runsDir?,
 *         spawn? (injectable child_process.spawn), allowUnsandboxed? (tests only), sessionDir? (where state/settings/FROZEN
 *         live; sandboxed runs use <sessionDir or sandbox.home/../sdkco-sessions>/<runId>, 0755 + 0644 files, Owner-owned:
 *         the sandbox user reads its settings and budget state but cannot change them), readSandbox? (state → sandbox; seam until the
 *         fold's `sandbox` event lands — default state.sandbox),
 *         legacy fallback while the ledger lacks the event: limits (genesis), priceTable, pinnedVersion, sessionFloorUsd }
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

  const resolveConfig = (state) => resolveRunnerConfig(state, opts);
  const foldOrFail = () => { try { return ledger.fold(); } catch (err) { fail('LEDGER_INVALID', `cannot fold the fuel ledger: ${err.message}`); } };
  let cfg = resolveConfig(foldOrFail());
  const sessionDir = opts.sessionDir || runsDir;
  const freezeFlag = path.join(sessionDir, 'FROZEN');
  const readSandbox = opts.readSandbox || ((state) => state.sandbox || null);
  const claudeBin = Array.isArray(opts.claudeBin) ? opts.claudeBin : [opts.claudeBin || 'claude'];
  const env = baseEnv(opts.env || {});
  const freezePollMs = opts.freezePollMs ?? 1000;
  const lockRetryMs = opts.lockRetryMs ?? 1000;
  const landingTimeoutMs = opts.landingTimeoutMs ?? 10 * 60 * 1000;
  const hardKillGraceMs = opts.hardKillGraceMs ?? 2000;
  const statusFiles = opts.statusFiles || ['current-status.md'];
  const now = opts.now || (() => new Date().toISOString());
  const companies = new Map(opts.companies.map(c => [c.id, c]));
  const stateCtx = (run) => ({ freezeFlag: run.freezeFlag || freezeFlag, statusFiles });
  // Sandboxed sessions get their own Owner-owned, sandbox-readable directory (never inside holding/, which is 0700).
  const sandboxSessionBase = (sandbox) => opts.sessionDir || path.resolve(sandbox.home, '..', 'sdkco-sessions');
  fs.mkdirSync(runsDir, { recursive: true, mode: 0o755 });
  fs.mkdirSync(sessionDir, { recursive: true, mode: 0o755 });

  const runs = new Map();     // runId -> in-process run
  const queue = [];           // queued runs, FIFO
  const active = new Set();   // running/landing runs
  const busy = new Set();     // companies with an active run in this process
  let versionOk = null;       // the pinned version last verified against `claude --version`
  let retryTimer = null;
  let pollTimer = null;

  const recFile = (runId) => path.join(runsDir, `${runId}.json`);
  const lockFile = (company) => path.join(runsDir, `${company}.lock`);
  const persist = (run) => S.writeJsonAtomic(recFile(run.id), run.record);
  const setState = (run, state, extra = {}) => { Object.assign(run.record, { state, ...extra }); persist(run); };
  const syncFreezeFlag = (frozen) => {
    S.syncFreezeFlag(freezeFlag, frozen, now);
    for (const run of active) if (run.freezeFlag && run.freezeFlag !== freezeFlag) S.syncFreezeFlag(run.freezeFlag, frozen, now);
  };

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
    const sb = readSandbox(state);
    if (!sb && !opts.allowUnsandboxed) {
      fail('SANDBOX_REQUIRED', 'no sandbox user is configured (holding-owner `sandbox` event); sessions do not run as the Owner\'s user');
    }
    const sandbox = sb ? checkSandbox(sb) : null;
    const key = sandbox ? readCompanyKey(holdingDir, companyId) : null;
    if (sandbox) S.ensureSecureDir(sandboxSessionBase(sandbox)); // refuse early: SESSION_DIR_INSECURE / _UNAVAILABLE
    return { availableFu, cfg, sandbox, key };
  }

  function ensureVersion() {
    if (versionOk === cfg.pinnedVersion) return;
    checkVersion(claudeBin, env, cfg.pinnedVersion);
    versionOk = cfg.pinnedVersion;
  }

  function enterLanding(run, reason) {
    if (!run.landing) { run.landing = true; run.landingReason = reason; S.writeRunState(run, stateCtx(run)); }
    if (run.record.state === 'running') setState(run, 'landing');
  }

  function hardKill(run) {
    run.stopRequested = 'hard';
    if (!run.finalized) killGroup(run.child, 'SIGTERM');
    run.killTimer = setTimeout(() => { if (!run.finalized) killGroup(run.child, 'SIGKILL'); }, hardKillGraceMs);
    run.killTimer.unref();
  }

  function onLine(run, line) {
    let m;
    try { m = JSON.parse(line); } catch { return; }
    if (m && m.type === 'system' && m.subtype === 'init' && !run.modelMismatch && m.model !== run.model) {
      run.modelMismatch = `session resolved model ${m.model || 'unknown'}, but the run is pinned to ${run.model}`;
      hardKill(run);
      return;
    }
    const spent = liveEstimate(run, m, run.cfg.priceTable);
    trackToolUses(run, m);
    if (spent === null || spent === run.spentFu) return;
    run.spentFu = spent;
    S.writeRunState(run, stateCtx(run));
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

  function settle(run) {
    const st = S.statusOf(run.record);
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
      try {
        pf = preflight(run.company, run.record.grant_id, run.record.mission_id, run.model, run.record.max_budget_usd);
        ensureVersion();
        pf.sessionDir = pf.sandbox ? S.ensureSecureDir(path.join(sandboxSessionBase(pf.sandbox), run.id)) : sessionDir;
      } catch (err) {
        if (!(err instanceof RunnerError)) throw err;
        finishWithoutSpawn(run, 'failed', reasonForRefusal(err.code), err.message);
        continue;
      }
      if (!S.acquireLock(lockFile(run.company), run.id, now)) {
        waitingForLock = true;
        if (run.record.waiting_for !== lockFile(run.company)) setState(run, 'queued', { waiting_for: lockFile(run.company) });
        continue;
      }
      queue.splice(queue.indexOf(run), 1);
      run.cfg = pf.cfg; // the price table and pin this session is metered with
      launch(run, pf);
    }
    if (waitingForLock && !retryTimer) retryTimer = setTimeout(() => { retryTimer = null; pump(); }, lockRetryMs);
  }

  function launch(run, { availableFu, sandbox, key, sessionDir: dir }) {
    const company = companies.get(run.company);
    run.capFu = availableFu;
    run.spentFu = 0;
    run.freezeFlag = path.join(dir, 'FROZEN');
    if (fs.existsSync(freezeFlag)) S.syncFreezeFlag(run.freezeFlag, true, now);
    run.stateFile = path.join(dir, `${run.id}.state.json`);
    run.settingsFile = path.join(dir, `${run.id}.settings.json`);
    run.streamFile = path.join(runsDir, `${run.id}.stream.jsonl`);
    try { run.startedSeq = ledger.verify().count; } catch { run.startedSeq = undefined; }
    S.writeRunState(run, stateCtx(run));
    S.writeJsonAtomic(run.settingsFile, buildSettings({ holdingDir, companyPath: company.path, model: run.model, stateFile: run.stateFile,
      testCommand: run.record.test_command || undefined, statusFiles }), 0o644);
    const args = buildArgs({ prompt: run.prompt, maxTurns: run.record.max_turns, model: run.model,
      maxBudgetUsd: run.record.max_budget_usd, settingsFile: run.settingsFile, extraArgs });
    run.streamFd = fs.openSync(run.streamFile, 'a', 0o600);
    active.add(run);
    busy.add(run.company);
    let child;
    try {
      const l = buildLaunch({ sandbox, key, claudeBin, args, env, runId: run.id });
      child = spawnSession({ spawnFn: opts.spawn, command: l.command, args: l.args, cwd: company.path, env: l.env });
    } catch (err) { finalize(run, null, null, err); return; }
    run.child = child;
    setState(run, 'running', { waiting_for: null, started_at: now(), pid: child.pid, cap_fu: run.capFu, run_started_seq: run.startedSeq ?? null,
      sandbox_user: sandbox ? sandbox.user : null,
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

  function finalize(run, code, signal, spawnErr) {
    if (run.finalized) return;
    run.finalized = true;
    clearTimeout(run.killTimer);
    clearTimeout(run.landingTimer);
    if (run.streamFd !== undefined) { try { fs.closeSync(run.streamFd); } catch { /* closed */ } }
    active.delete(run);
    busy.delete(run.company);
    S.releaseLock(lockFile(run.company), run.id);
    const text = run.streamFile && fs.existsSync(run.streamFile) ? fs.readFileSync(run.streamFile, 'utf8') : '';
    const result = lastResult(text);
    const warnings = [];
    let records = [];
    let usage = { fu_drawn: 0, fu_overrun: 0, unmetered: 0, records: 0 };
    let pending = [];
    if (!spawnErr) {
      records = meterStream(text, { pinnedVersion: run.cfg.pinnedVersion });
      const r = recordUsage(ledger, run, records);
      usage = r.usage; pending = r.pending; warnings.push(...r.warnings);
    }
    const companyPath = companies.get(run.company).path;
    if (fs.existsSync(path.join(companyPath, '.git', 'index.lock'))) warnings.push(`${companyPath}/.git/index.lock remains after the session`);
    const denials = denialSummary(run, result);
    const [state, terminalReason] = spawnErr ? ['failed', 'error'] : terminalOf(run, code, signal, result, denials);
    setState(run, state, {
      terminal_reason: terminalReason, exit_code: code, signal: signal || null, ended_at: now(),
      error: spawnErr ? spawnErr.message : run.modelMismatch ? `MODEL_MISMATCH: ${run.modelMismatch}` : (state === 'failed' && run.stderr ? run.stderr.slice(-2000) : null),
      usage, usage_events: records, ledger_pending: pending, warnings, ...denials,
      live_estimate: { spent_fu: run.spentFu ?? null, estimate: true, caveat: S.ESTIMATE_CAVEAT },
    });
    settle(run);
    pump();
  }

  function loadRecord(runId) {
    const run = runs.get(runId);
    if (run) return run.record;
    try { return S.readJson(recFile(runId)); } catch { return null; }
  }

  function start(companyId, o = {}) {
    if (!companies.has(companyId)) fail('UNKNOWN_COMPANY', `company ${JSON.stringify(companyId)} is not registered with this runner`);
    cfg = resolveConfig(foldOrFail());
    const model = validateStart(o, opts, cfg);
    const key = o.idempotencyKey || crypto.randomUUID();
    const runId = `run-${sha256(`${companyId}\0${key}`).slice(0, 24)}`;
    const params = hashCanonical({ company: companyId, prompt: o.prompt, grantId: o.grantId, missionId: o.missionId, maxTurns: o.maxTurns,
      model, maxBudgetUsd: o.maxBudgetUsd, ...(o.testCommand ? { testCommand: o.testCommand } : {}) });
    const same = (rec) => {
      if (rec.params_sha256 !== params) fail('IDEM_CONFLICT', `idempotencyKey ${JSON.stringify(key)} already started ${runId} with different parameters`);
      return runId;
    };
    const existing = loadRecord(runId);
    if (existing) return same(existing);

    preflight(companyId, o.grantId, o.missionId, model, o.maxBudgetUsd);

    const record = {
      schema_version: S.RECORD_SCHEMA_VERSION, runner_contract_version: RUNNER_CONTRACT_VERSION, run_id: runId,
      company: companyId, grant_id: o.grantId, mission_id: o.missionId, max_turns: o.maxTurns, idempotency_key: key,
      model, max_budget_usd: o.maxBudgetUsd, test_command: o.testCommand || null,
      params_sha256: params, prompt_sha256: sha256(o.prompt), claude_code_version_pinned: cfg.pinnedVersion,
      price_table_version: cfg.priceTable.version,
      state: 'queued', terminal_reason: null, waiting_for: null, created_at: now(),
    };
    if (!S.createRecordExclusive(recFile(runId), record)) return same(S.readJson(recFile(runId)));
    const run = { id: runId, company: companyId, prompt: o.prompt, model, record, waiters: [], usageById: new Map(), toolUseIds: new Set(), stderr: '',
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
      if (TERMINAL_STATES.has(rec.state)) return S.statusOf(rec);
      fail('NOT_OWNED', `run ${runId} is owned by another runner process`);
    }
    if (TERMINAL_STATES.has(run.record.state)) return S.statusOf(run.record);
    if (run.record.state === 'queued') { finishWithoutSpawn(run, 'interrupted', 'killed', `stopped (${mode}) before it started`); return S.statusOf(run.record); }
    if (mode === 'hard') { hardKill(run); return S.statusOf(run.record); }
    if (run.stopRequested !== 'hard') run.stopRequested = 'landing';
    enterLanding(run, 'the holding asked this run to land');
    if (!run.landingTimer) { run.landingTimer = setTimeout(() => hardKill(run), landingTimeoutMs); run.landingTimer.unref(); }
    return S.statusOf(run.record);
  }

  const recordOrFail = (runId) => loadRecord(runId) || fail('UNKNOWN_RUN', `no run ${runId}`);
  const status = (runId) => S.statusOf(recordOrFail(runId));
  const meter = (runId) => recordOrFail(runId).usage_events || [];

  function wait(runId) {
    const run = runs.get(runId);
    if (run) {
      if (TERMINAL_STATES.has(run.record.state)) return Promise.resolve(S.statusOf(run.record));
      return new Promise(resolve => run.waiters.push(resolve));
    }
    return new Promise((resolve, reject) => {
      const tick = () => {
        const rec = loadRecord(runId);
        if (!rec) return reject(new RunnerError('UNKNOWN_RUN', `no run ${runId}`));
        if (TERMINAL_STATES.has(rec.state)) return resolve(S.statusOf(rec));
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

module.exports = { createLocalRunner, RunnerError, RUNNER_CONTRACT_VERSION, STATES: S.STATES, TERMINAL_REASONS: S.TERMINAL_REASONS, ENV_ALLOWLIST };
