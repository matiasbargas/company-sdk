'use strict';

/**
 * runner/sandbox.js — the D7 sandbox pre-flight (cap-po-sandbox-001). From the ledger's
 * state.sandbox = { user, home, sessionDir, nodePath, hookPath, runtimeDir? }:
 *   - every path field is required and absolute (nodePath/hookPath: the landing hook runtime the
 *     sandbox user can exec — never the Owner's node or a repo path, which a 0750 home hides);
 *   - the company key is read from <holding>/keys/<company>.key (0600, owned by the runner's uid);
 *   - sessionDir is Owner-owned and not group/other-writable;
 *   - src/sandbox-access.js must confirm the sandbox user (uid and groups resolved with `id`) can reach
 *     nodePath (x), hookPath (r), the claude binary (x), the company clone (rwx) and sessionDir (rx),
 *     through every parent directory. Every failing check refuses the run with SANDBOX_ACCESS naming
 *     its path; an unknown user or a missing checker refuses too (fail closed).
 * Injectable seam (tests): opts.checkSandboxAccess(user, [{ label, path, need }]) → { ok, problems: [...] }.
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { fail, ensureSecureDir } = require('./state');

const USER_RE = /^_?[a-z][a-z0-9_-]{0,30}$/i;
const PATH_FIELDS = ['home', 'sessionDir', 'nodePath', 'hookPath'];
const isAbs = (p) => typeof p === 'string' && path.isAbsolute(p) && !p.split('/').includes('..');

/** Validate state.sandbox. Returns the normalized sandbox or throws SANDBOX_INVALID naming every bad field. */
function checkSandbox(sb) {
  if (!sb || typeof sb !== 'object' || !USER_RE.test(sb.user || '')) {
    fail('SANDBOX_INVALID', `the sandbox must name a plain OS user, got ${JSON.stringify(sb && sb.user)}`);
  }
  const bad = PATH_FIELDS.filter(f => !isAbs(sb[f]));
  if (bad.length) {
    fail('SANDBOX_INVALID', `the sandbox event needs absolute ${bad.join(', ')} (the hook runtime and session dir the sandbox user can reach); `
      + 'record them with sdk-holding sandbox');
  }
  return { user: sb.user, home: sb.home, sessionDir: sb.sessionDir, nodePath: sb.nodePath, hookPath: sb.hookPath };
}

/** The company's provider key: <holdingDir>/keys/<company>.key, mode 0600, owned by this process's uid. */
function readCompanyKey(holdingDir, company) {
  const file = path.join(holdingDir, 'keys', `${company}.key`);
  let st;
  try { st = fs.statSync(file); } catch { fail('SANDBOX_KEY_MISSING', `no key for ${company} at ${file} (mode 0600, owned by the runner's user)`); }
  if ((st.mode & 0o777) !== 0o600) fail('SANDBOX_KEY_INSECURE', `${file} has mode ${(st.mode & 0o777).toString(8)}; it must be 0600`);
  if (typeof process.getuid === 'function' && st.uid !== process.getuid()) {
    fail('SANDBOX_KEY_INSECURE', `${file} is owned by uid ${st.uid}, not the runner's uid ${process.getuid()}`);
  }
  const key = fs.readFileSync(file, 'utf8').trim();
  if (!key || /\s/.test(key)) fail('SANDBOX_KEY_INVALID', `${file} must hold exactly one key`);
  return key;
}

/** Adapter over src/sandbox-access.js to the seam's (user, checks) → { ok, problems } shape. */
function moduleChecker() {
  let mod;
  try { mod = require('../sandbox-access'); } catch { return null; }
  return (user, checks) => {
    const exec = (cmd, args) => spawnSync(cmd, args, { encoding: 'utf8' });
    const uid = mod.resolveUserUid(user, exec);
    const groups = mod.resolveUserGroups(user, exec);
    if (uid === null || groups === null) {
      return { ok: false, problems: [{ label: 'user', path: user, need: 'an OS account', reason: `no OS user ${user} (id -u / id -G failed)` }] };
    }
    const results = mod.checkSandboxAccess({ user, uid, userGroups: groups, checks });
    const problems = results.map((r, i) => ({ ...r, label: checks[i].label })).filter(r => !r.ok);
    return { ok: problems.length === 0, problems };
  };
}

const loadChecker = (injected) => injected || moduleChecker();

/** The paths the sandbox user must reach, with the access each needs. */
function accessChecks(sandbox, claudeBin, companyPath) {
  return [
    { label: 'nodePath', path: sandbox.nodePath, need: 'x' },
    { label: 'hookPath', path: sandbox.hookPath, need: 'r' },
    { label: 'claude', path: claudeBin[0], need: 'x' },
    { label: 'company clone', path: companyPath, need: 'rwx' },
    { label: 'sessionDir', path: sandbox.sessionDir, need: 'rx' },
  ];
}

function verifyAccess(checker, sandbox, checks) {
  if (typeof checker !== 'function') {
    fail('SANDBOX_ACCESS', `cannot verify what sandbox user ${sandbox.user} can reach (checkSandboxAccess unavailable); refusing (fail closed)`);
  }
  const r = checker(sandbox.user, checks);
  const problems = Array.isArray(r) ? r : (r && Array.isArray(r.problems) ? r.problems : []);
  if (!Array.isArray(r) && !(r && (r.ok === true || problems.length))) {
    fail('SANDBOX_ACCESS', `checkSandboxAccess returned no verdict for ${sandbox.user}; refusing (fail closed)`);
  }
  if (problems.length) {
    fail('SANDBOX_ACCESS', `sandbox user ${sandbox.user} cannot reach: ${problems.map(p =>
      `${p.label ? `${p.label} ` : ''}${p.path} (needs ${p.need}${p.reason ? `: ${p.reason}` : ''})`).join('; ')}`);
  }
}

/**
 * The sandbox for one run, or null (tests only, allowUnsandboxed). Throws SANDBOX_REQUIRED, SANDBOX_INVALID,
 * SANDBOX_KEY_*, SESSION_DIR_*, SANDBOX_ACCESS. Returns { sandbox, key }.
 */
function resolveSandbox({ state, readSandbox, allowUnsandboxed, holdingDir, companyId, companyPath, claudeBin, checkAccess }) {
  const sb = readSandbox(state);
  if (!sb) {
    if (!allowUnsandboxed) fail('SANDBOX_REQUIRED', 'no sandbox user is configured (holding-owner `sandbox` event); sessions do not run as the Owner\'s user');
    return { sandbox: null, key: null };
  }
  const sandbox = checkSandbox(sb);
  const key = readCompanyKey(holdingDir, companyId);
  ensureSecureDir(sandbox.sessionDir);
  verifyAccess(loadChecker(checkAccess), sandbox, accessChecks(sandbox, claudeBin, companyPath));
  return { sandbox, key };
}

module.exports = { checkSandbox, readCompanyKey, accessChecks, verifyAccess, resolveSandbox };
