'use strict';

/**
 * runner/state.js — the runner's files on disk: run records, the per-run state file the landing
 * hook reads, the freeze flag, and the per-company lock. Pure fs helpers; no process handling.
 */

const fs = require('fs');
const crypto = require('crypto');

const RECORD_SCHEMA_VERSION = 1;
const STATES = ['queued', 'running', 'landing', 'done', 'interrupted', 'failed'];
const TERMINAL_REASONS = ['done', 'budget', 'tranche_exhausted', 'killed', 'frozen', 'error', 'max_turns', 'model_mismatch', 'no_work_denied', 'hook_failed'];
const TERMINAL_STATES = new Set(['done', 'interrupted', 'failed']);

class RunnerError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new RunnerError(code, message); };
const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const sha256 = (s) => crypto.createHash('sha256').update(s, 'utf8').digest('hex');

function writeJsonAtomic(file, obj, mode = 0o600) {
  const tmp = `${file}.${process.pid}.${crypto.randomBytes(4).toString('hex')}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', { mode });
  fs.chmodSync(tmp, mode); // the umask must not make a 0644 session file unreadable to the sandbox user
  fs.renameSync(tmp, file);
}
const readJson = (file) => JSON.parse(fs.readFileSync(file, 'utf8'));

/** Create a run record exclusively. Returns true, or false when it already exists (idempotent start). */
function createRecordExclusive(file, record) {
  try {
    const fd = fs.openSync(file, 'wx', 0o600);
    fs.writeSync(fd, JSON.stringify(record, null, 2) + '\n');
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err.code === 'EEXIST') return false;
    throw err;
  }
}

// Spike 2: assistant-event usage is a streaming snapshot (out 16 vs result.modelUsage 73).
const ESTIMATE_CAVEAT = 'live estimate from assistant-event usage snapshots, which undercount (spike 2: 16 vs 73 output tokens); '
  + 'the authoritative burn is result.modelUsage, metered after the session ends';

/** The landing hook's input. Written by the runner only; readable by the session (0644). */
function writeRunState(run, { freezeFlag, statusFiles }) {
  writeJsonAtomic(run.stateFile, {
    run_id: run.id, budget_fu: run.capFu, spent_fu: run.spentFu, estimate: true, estimate_caveat: ESTIMATE_CAVEAT,
    landing: run.landing, landing_reason: run.landingReason, freeze_flag: freezeFlag, status_files: statusFiles,
  }, 0o644);
}

/**
 * A session directory the sandbox user may read but never write: created 0755 by the runner, and
 * refused (SESSION_DIR_INSECURE) when it is writable by group/others or not owned by the runner's uid.
 */
function ensureSecureDir(dir) {
  if (!fs.existsSync(dir)) {
    try { fs.mkdirSync(dir, { recursive: true, mode: 0o755 }); fs.chmodSync(dir, 0o755); } catch (err) {
      fail('SESSION_DIR_UNAVAILABLE', `cannot create session directory ${dir} (${err.code || err.message}); `
        + 'create it as the runner\'s user with mode 0755, or configure sessionDir');
    }
  }
  const st = fs.statSync(dir);
  if (!st.isDirectory()) fail('SESSION_DIR_INSECURE', `${dir} is not a directory`);
  if ((st.mode & 0o022) !== 0) fail('SESSION_DIR_INSECURE', `${dir} has mode ${(st.mode & 0o777).toString(8)}; group/others must not write it (want 0755)`);
  if (typeof process.getuid === 'function' && st.uid !== process.getuid()) {
    fail('SESSION_DIR_INSECURE', `${dir} is owned by uid ${st.uid}, not the runner's uid ${process.getuid()}`);
  }
  return dir;
}

function syncFreezeFlag(freezeFlag, frozen, now) {
  const exists = fs.existsSync(freezeFlag);
  if (frozen && !exists) fs.writeFileSync(freezeFlag, `frozen (mirrored from the ledger at ${now()})\n`, { mode: 0o644 });
  if (!frozen && exists) fs.unlinkSync(freezeFlag);
}

/** Per-company lock (one writer session per repository, across runner processes). Never broken automatically. */
function acquireLock(lockFile, runId, now) {
  try {
    const fd = fs.openSync(lockFile, 'wx', 0o600);
    fs.writeSync(fd, JSON.stringify({ run_id: runId, pid: process.pid, since: now() }));
    fs.closeSync(fd);
    return true;
  } catch (err) {
    if (err.code === 'EEXIST') return false;
    throw err;
  }
}

function releaseLock(lockFile, runId) {
  try { if (readJson(lockFile).run_id === runId) fs.unlinkSync(lockFile); } catch { /* not ours or already gone */ }
}

/** The terminal reason of a run refused at (re-)pre-flight, before it spawned. */
function reasonForRefusal(code) {
  if (code === 'LEDGER_FROZEN') return 'frozen';
  if (code === 'TRANCHE_EXHAUSTED') return 'tranche_exhausted';
  return 'error';
}

/** Wait on a run another process owns: poll its record until terminal. */
function pollUntilTerminal(load, runId, everyMs = 100) {
  return new Promise((resolve, reject) => {
    const tick = () => {
      const rec = load();
      if (!rec) return reject(new RunnerError('UNKNOWN_RUN', `no run ${runId}`));
      if (TERMINAL_STATES.has(rec.state)) return resolve(statusOf(rec));
      setTimeout(tick, everyMs);
    };
    tick();
  });
}

function statusOf(rec) {
  const st = { runId: rec.run_id, company: rec.company, state: rec.state, terminalReason: rec.terminal_reason || null };
  if (rec.waiting_for) st.waitingFor = rec.waiting_for;
  if (rec.error) st.error = rec.error;
  return st;
}

module.exports = {
  RECORD_SCHEMA_VERSION, ESTIMATE_CAVEAT, STATES, TERMINAL_REASONS, TERMINAL_STATES, RunnerError, fail, isNonEmptyString, sha256,
  writeJsonAtomic, readJson, createRecordExclusive, writeRunState, ensureSecureDir, syncFreezeFlag, acquireLock, releaseLock, statusOf,
  reasonForRefusal, pollUntilTerminal,
};
