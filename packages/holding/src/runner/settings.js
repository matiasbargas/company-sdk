'use strict';

/**
 * runner/settings.js — what a session is allowed to do: the runner-owned settings file and the
 * claude command line. Never bypass, never skip-permissions; the runner owns its flags.
 */

const fs = require('fs');
const path = require('path');
const { fail } = require('./state');

const HOOK_SCRIPT = path.join(__dirname, '..', 'landing-hook.js');
// Flags the runner owns or must never pass through extraArgs.
const RUNNER_OWNED_FLAGS = new Set(['-p', '--print', '--output-format', '--max-turns', '--settings', '--permission-mode', '--verbose',
  '--model', '--max-budget-usd', '--setting-sources']);
const UNSAFE_RE = /dangerously|bypass/i;

const shq = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

function checkExtraArgs(extraArgs) {
  if (!Array.isArray(extraArgs) || !extraArgs.every(a => typeof a === 'string')) fail('INVALID_OPTION', 'extraArgs must be an array of strings');
  for (const a of extraArgs) {
    const flag = a.split('=')[0];
    if (UNSAFE_RE.test(a) || RUNNER_OWNED_FLAGS.has(flag)) fail('UNSAFE_FLAG', `extraArgs may not contain ${a} (runner-owned or skip-permissions)`);
  }
}

const SDK_HOLDING_BIN = path.join(__dirname, '..', '..', 'bin', 'sdk-holding.js');
// The landing set: git commands a session needs to leave the repository committed or clean.
const GIT_LANDING = ['add', 'commit', 'stash', 'status', 'diff', 'log'];

const realRoots = (p) => [...new Set([p, fs.realpathSync(p)])];

/**
 * Runner-owned settings for one session (cap-po-runner-006). In headless -p mode every tool that
 * is not allowed is denied, so the session gets an explicit profile:
 *   allow: Read/Glob/Grep; Edit/Write/MultiEdit inside the company root; the status file(s);
 *          Bash for git add|commit|stash|status|diff|log and the run's test command (if named).
 *   deny:  file tools on the holding directory; Bash naming the holding path or sdk-holding
 *          (defence in depth — a tripwire, not a barrier: D7's OS user is the barrier).
 * defaultMode stays `default`; bypass is disabled; the landing hook runs on every PreToolUse.
 */
function buildSettings({ holdingDir, companyPath, model, stateFile, testCommand, statusFiles = ['current-status.md'] }) {
  const allow = ['Read', 'Glob', 'Grep'];
  for (const co of realRoots(companyPath)) {
    for (const tool of ['Edit', 'Write', 'MultiEdit']) allow.push(`${tool}(/${co}/**)`);
    for (const f of statusFiles) allow.push(`Edit(/${co}/${f})`);
  }
  for (const g of GIT_LANDING) allow.push(`Bash(git ${g}:*)`);
  if (testCommand) allow.push(`Bash(${testCommand}:*)`);
  const deny = [];
  for (const r of realRoots(holdingDir)) {
    for (const tool of ['Read', 'Edit', 'Write', 'MultiEdit', 'NotebookEdit']) deny.push(`${tool}(/${r}/**)`);
    deny.push(`Bash(*${r}*)`);
  }
  deny.push('Bash(sdk-holding:*)', `Bash(node ${SDK_HOLDING_BIN}:*)`, 'Bash(*sdk-holding*)');
  return {
    model,
    permissions: { defaultMode: 'default', disableBypassPermissionsMode: 'disable', allow, deny },
    hooks: { PreToolUse: [{ matcher: '*', hooks: [{ type: 'command', timeout: 10,
      command: `${shq(process.execPath)} ${shq(HOOK_SCRIPT)} --state ${shq(stateFile)}` }] }] },
  };
}

/** The claude arguments for one session (after the binary and its prefix args). */
function buildArgs({ prompt, maxTurns, model, maxBudgetUsd, settingsFile, extraArgs }) {
  return ['-p', prompt, '--output-format', 'stream-json', '--verbose', '--max-turns', String(maxTurns),
    '--model', model, '--max-budget-usd', String(maxBudgetUsd), '--settings', settingsFile,
    // Never load the Owner's user settings (spike 2: user `model` overrode --model). Only the
    // company's committed project settings plus the runner-owned --settings apply.
    '--setting-sources', 'project', ...extraArgs];
}

module.exports = { HOOK_SCRIPT, SDK_HOLDING_BIN, GIT_LANDING, RUNNER_OWNED_FLAGS, checkExtraArgs, buildSettings, buildArgs, shq };
