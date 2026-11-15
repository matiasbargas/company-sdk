'use strict';

/**
 * runner/landing.js — landing a session and the deadline that bounds it (cap-po-killswitch-001,
 * cap-po-firstrun-001; Guardian carry-forward N3).
 *
 * Any landing (budget, freeze, stop, hook failure) flips the hook's state file to landing and arms a
 * deadline; if the session has not ended when it expires, its process group is hard-killed
 * (landing_forced). That bounds a hook that never runs: fail closed.
 *
 * The deadline for one run, first match wins:
 *   1. run      — start({ landingTimeoutSec }) (`sdk-holding run --landing-timeout <s>`): the Owner chose it;
 *   2. first_run — the company has no completed real run yet: the ledger limit firstRunLandingTimeoutSec
 *                 (default 60 s), never longer than the runner's own deadline;
 *   3. default  — opts.landingTimeoutMs, else 5 minutes.
 * A completed real run is a run record of the company in state `done` with at least one meter record
 * (the session ran and was metered). Interrupted, failed or never-started runs do not count.
 */

const fs = require('fs');
const path = require('path');
const { fail, readJson, writeRunState } = require('./state');
const { killGroup } = require('./spawn');

const DEFAULT_LANDING_TIMEOUT_MS = 5 * 60 * 1000;
const DEFAULT_FIRST_RUN_LANDING_TIMEOUT_SEC = 60;

const MAX_LANDING_TIMEOUT_SEC = 24 * 60 * 60; // setTimeout fires at once past ~24.8 days; a day is already generous

/** start({ landingTimeoutSec }) must be a positive number of seconds, at most a day, when given. */
function checkLandingTimeoutSec(v) {
  if (v !== undefined && (typeof v !== 'number' || !Number.isFinite(v) || v <= 0 || v > MAX_LANDING_TIMEOUT_SEC)) {
    fail('INVALID_OPTION', `landingTimeoutSec must be a positive number of seconds (at most ${MAX_LANDING_TIMEOUT_SEC}), got ${JSON.stringify(v)}`);
  }
}

/** Pure: the deadline in ms and where it came from ('run' | 'first_run' | 'default'). */
function resolveLandingTimeout({ runSec, firstRun, limitSec, normalMs = DEFAULT_LANDING_TIMEOUT_MS }) {
  if (runSec !== undefined) return { ms: runSec * 1000, source: 'run' };
  const firstMs = (limitSec ?? DEFAULT_FIRST_RUN_LANDING_TIMEOUT_SEC) * 1000;
  if (firstRun && firstMs < normalMs) return { ms: firstMs, source: 'first_run' };
  return { ms: normalMs, source: 'default' };
}

/** True once <runsDir> holds a completed real run of this company (see the header). */
function hasCompletedRealRun(runsDir, company) {
  let names;
  try { names = fs.readdirSync(runsDir); } catch { return false; }
  for (const f of names) {
    if (!f.startsWith('run-') || !f.endsWith('.json')) continue;
    let rec;
    try { rec = readJson(path.join(runsDir, f)); } catch { continue; }
    if (rec && rec.company === company && rec.state === 'done' && rec.usage && rec.usage.records > 0) return true;
  }
  return false;
}

/**
 * The landing controls for one runner: enterLanding(run, reason) and hardKill(run).
 * ctx: { setState(run, state), stateCtx(run), hardKillGraceMs }. Each run carries run.landingTimeoutMs.
 */
function createLandingControl({ setState, stateCtx, hardKillGraceMs }) {
  function hardKill(run) {
    run.stopRequested = 'hard';
    if (!run.finalized) killGroup(run.child, 'SIGTERM');
    run.killTimer = setTimeout(() => { if (!run.finalized) killGroup(run.child, 'SIGKILL'); }, hardKillGraceMs);
    run.killTimer.unref();
  }

  function enterLanding(run, reason) {
    if (!run.landing) { run.landing = true; run.landingReason = reason; writeRunState(run, stateCtx(run)); }
    if (run.record.state === 'running') setState(run, 'landing');
    if (!run.landingTimer && !run.finalized) {
      run.landingTimer = setTimeout(() => { run.landingForced = true; hardKill(run); }, run.landingTimeoutMs);
      run.landingTimer.unref();
    }
  }

  return { enterLanding, hardKill };
}

module.exports = {
  DEFAULT_LANDING_TIMEOUT_MS, MAX_LANDING_TIMEOUT_SEC, DEFAULT_FIRST_RUN_LANDING_TIMEOUT_SEC, checkLandingTimeoutSec, resolveLandingTimeout,
  hasCompletedRealRun, createLandingControl,
};
