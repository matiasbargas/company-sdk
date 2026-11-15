'use strict';

/**
 * runner/spawn.js — launching and killing a session process: the clean environment, the Claude
 * Code version check (C5), the D7 sandbox launch (cap-po-sandbox-001), the spawn itself
 * (injectable for tests) and process-group kills.
 *
 * Sandbox launch (when the ledger's state.sandbox = { user, home } is set):
 *   argv: sudo -n -u <user> -H --preserve-env=ANTHROPIC_API_KEY,HOLDING_RUN_ID <claudeBin...> <args>
 *   env:  { PATH, ANTHROPIC_API_KEY, HOLDING_RUN_ID } — nothing else
 * The key is never on any argv (argv is visible to `ps`). sudo's env_reset starts the session from a
 * clean env, and the generated sudoers rule env_keeps exactly those two variables for that command;
 * -H sets HOME to the sandbox user's home. The key is read by the runner (Owner's user) from
 * <holding>/keys/<company>.key, refused unless mode 0600 and owned by the runner's uid.
 */

const fs = require('fs');
const path = require('path');
const { spawn: nodeSpawn, execFileSync } = require('child_process');
const { fail } = require('./state');

// The only variables a session inherits from the Owner's process. Everything else (ANTHROPIC_*,
// CLAUDE_*, keys, model overrides) reaches the child only if the runner passes it in opts.env.
const ENV_ALLOWLIST = ['PATH', 'HOME', 'LANG', 'TMPDIR'];

function baseEnv(extra = {}) {
  const env = {};
  for (const k of ENV_ALLOWLIST) if (process.env[k] !== undefined) env[k] = process.env[k];
  return Object.assign(env, extra);
}

/** Throws VERSION_CHECK_FAILED / VERSION_MISMATCH unless `claude --version` reports `pinned`. */
function checkVersion(claudeBin, env, pinned) {
  let out;
  try {
    out = execFileSync(claudeBin[0], [...claudeBin.slice(1), '--version'], { encoding: 'utf8', timeout: 15000, env });
  } catch (err) { fail('VERSION_CHECK_FAILED', `could not run ${claudeBin.join(' ')} --version: ${err.message}`); }
  const m = String(out).match(/\d+\.\d+\.\d+/);
  const v = m ? m[0] : 'unknown';
  if (v !== pinned) fail('VERSION_MISMATCH', `claude reports ${v}; this runner is pinned to ${pinned} (C5)`);
}

/** Spawn a session in its own process group. spawnFn(cmd, args, options) is child_process.spawn by default. */
function spawnSession({ spawnFn = nodeSpawn, command, args, cwd, env }) {
  return spawnFn(command, args, { cwd, env, stdio: ['ignore', 'pipe', 'pipe'], detached: true });
}

const USER_RE = /^[a-z_][a-z0-9_-]{0,31}$/i;

/** Validate state.sandbox. Returns { user, home } or throws SANDBOX_INVALID. */
function checkSandbox(sb) {
  if (!sb || typeof sb !== 'object' || !USER_RE.test(sb.user || '') || typeof sb.home !== 'string' || !path.isAbsolute(sb.home)) {
    fail('SANDBOX_INVALID', `the sandbox must name a plain OS user and an absolute home, got ${JSON.stringify(sb)}`);
  }
  return { user: sb.user, home: sb.home };
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

/**
 * Compose the process launch. Unsandboxed: claude directly with the clean env + HOLDING_RUN_ID.
 * Sandboxed: through sudo/env -i so nothing of the Owner's environment crosses except what is listed.
 */
function buildLaunch({ sandbox, key, claudeBin, args, env, runId }) {
  if (!sandbox) {
    return { command: claudeBin[0], args: [...claudeBin.slice(1), ...args], env: { ...env, HOLDING_RUN_ID: runId } };
  }
  return {
    command: 'sudo',
    args: ['-n', '-u', sandbox.user, '-H', '--preserve-env=ANTHROPIC_API_KEY,HOLDING_RUN_ID', ...claudeBin, ...args],
    env: { PATH: env.PATH || '', ANTHROPIC_API_KEY: key, HOLDING_RUN_ID: runId },
  };
}

function killGroup(child, signal) {
  if (!child) return;
  try { process.kill(-child.pid, signal); } catch { try { child.kill(signal); } catch { /* gone */ } }
}

module.exports = { ENV_ALLOWLIST, baseEnv, checkVersion, checkSandbox, readCompanyKey, buildLaunch, spawnSession, killGroup };
