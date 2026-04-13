'use strict';

/**
 * executor.js — Runs SDK actions with permission checks.
 *
 * Key constraint: consultation-spawned agents cannot invoke write actions.
 * Every execution produces a visible result (success or failure).
 */

const { execSync } = require('child_process');
const path = require('path');
const { actions } = require('./action-registry');

/**
 * Execute a resolved action.
 *
 * @param {object} resolution — from intent-resolver.resolve()
 * @param {string} projectDir — project directory
 * @param {object} opts — { spawnType: 'consultation'|'full', dryRun: false }
 * @returns {{ executed: boolean, action?: string, output?: string, reason?: string }}
 */
function execute(resolution, projectDir, opts = {}) {
  if (!resolution || !resolution.action || !resolution.definition) {
    return { executed: false, reason: 'no-action' };
  }

  const def = resolution.definition;

  // Write guard: consultation spawns cannot invoke write actions
  if (opts.spawnType === 'consultation' && def.writes) {
    return { executed: false, reason: 'write-denied-consultation-spawn', action: resolution.action };
  }

  // Dry run — return what would be executed without executing
  if (opts.dryRun) {
    return { executed: false, reason: 'dry-run', action: resolution.action, params: resolution.params, wouldWrite: def.writes };
  }

  // Build command from action definition + params
  const scriptsDir = path.resolve(__dirname, '..');
  const scriptPath = path.join(scriptsDir, def.script);
  const cmdParts = [`node "${scriptPath}"`];

  // Add positional args from definition
  for (const arg of (def.args || [])) {
    if (arg === null) {
      cmdParts.push(`"${projectDir}"`);
    } else {
      cmdParts.push(arg);
    }
  }

  // Add named params as flags
  for (const [key, value] of Object.entries(resolution.params || {})) {
    if (key === 'project-dir' || key === 'file') {
      // file goes as first positional after command
      if (key === 'file') cmdParts.splice(2, 0, `"${path.join(projectDir, value)}"`);
    } else {
      cmdParts.push(`--${key} "${value}"`);
    }
  }

  const cmd = cmdParts.join(' ');

  try {
    const stdout = execSync(cmd, { encoding: 'utf8', cwd: projectDir, timeout: 30000 });
    return { executed: true, action: resolution.action, output: stdout.trim(), command: cmd };
  } catch (e) {
    const errMsg = (e.stderr || e.stdout || e.message || '').toString().split('\n')[0];
    return { executed: false, reason: 'execution-error', action: resolution.action, error: errMsg, command: cmd };
  }
}

module.exports = { execute };
