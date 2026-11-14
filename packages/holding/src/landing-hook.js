#!/usr/bin/env node
'use strict';

/**
 * landing-hook.js — the runner-owned PreToolUse hook (cap-po-runner-001, cap-po-killswitch-001).
 *
 * Wired by runner.js through the per-run settings file:
 *   node landing-hook.js --state <holding>/runs/<runId>.state.json
 * The state file is written only by the runner: { run_id, budget_fu, spent_fu, landing, landing_reason,
 * freeze_flag, status_files }. The runner updates spent_fu live from the session's assistant usage.
 *
 * Modes:
 *   normal   budget left, no landing, no freeze → print nothing, exit 0. The hook never answers
 *            "allow": that would skip Claude Code's own permission rules.
 *   landing  spent_fu ≥ budget_fu, or the runner set landing (stop {mode:'landing'}) → only read-only
 *            tools, `git` commands and writes to the status file(s) pass; everything else is denied
 *            with the landing message (commit or stash, update current-status.md, stop).
 *   frozen   the freeze flag file exists (the runner mirrors a frozen ledger) → every tool except
 *            `git` is denied.
 * Fail closed: an unreadable or missing state file is treated as landing.
 *
 * Under D7 this runs as the sandbox user, so the state file and freeze flag must be readable by it
 * but writable only by the Owner's user.
 */

const fs = require('fs');
const path = require('path');

const READ_ONLY_TOOLS = new Set(['Read', 'Glob', 'Grep', 'LS', 'TodoWrite']);
const STATUS_WRITE_TOOLS = new Set(['Edit', 'Write', 'MultiEdit']);
const DEFAULT_STATUS_FILES = ['current-status.md'];

/**
 * True when every segment of a shell command is a plain `git ...` invocation.
 * Refuses command substitution, process substitution and redirection, so `git log $(rm x)` or
 * `git diff > f` cannot smuggle work through the git exception.
 */
function isGitOnly(command) {
  if (typeof command !== 'string' || !command.trim()) return false;
  if (/[`<>]|\$\(/.test(command)) return false;
  const segments = command.split(/&&|\|\||;|\||\n/).map(s => s.trim()).filter(Boolean);
  return segments.length > 0 && segments.every(s => /^git(\s|$)/.test(s));
}

function readState(file) {
  try {
    const st = JSON.parse(fs.readFileSync(file, 'utf8'));
    return st && typeof st === 'object' ? st : null;
  } catch { return null; }
}

/** Decide for one tool call. Returns null (stay silent) or { reason } to deny. Pure apart from fs reads. */
function decide(state, toolName, toolInput = {}) {
  const isGit = toolName === 'Bash' && isGitOnly(toolInput.command);
  if (isGit) return null;

  if (state && typeof state.freeze_flag === 'string' && fs.existsSync(state.freeze_flag)) {
    return { reason: 'HOLDING FROZEN: the holding Owner froze the fuel ledger. Only git is allowed now: '
      + 'commit or stash your changes with git, then stop. Do not start any other work.' };
  }

  let why = null;
  if (!state) why = 'the run state is unavailable (failing closed)';
  else if (state.landing === true) why = state.landing_reason || 'the holding asked this run to land';
  else if (!Number.isFinite(state.budget_fu) || !Number.isFinite(state.spent_fu)) why = 'the run budget is unreadable (failing closed)';
  else if (state.spent_fu >= state.budget_fu) why = `the working budget is spent (${state.spent_fu} of ${state.budget_fu} FU)`;
  if (!why) return null;

  if (READ_ONLY_TOOLS.has(toolName)) return null;
  const statusFiles = (state && Array.isArray(state.status_files) && state.status_files.length) ? state.status_files : DEFAULT_STATUS_FILES;
  if (STATUS_WRITE_TOOLS.has(toolName) && typeof toolInput.file_path === 'string'
    && statusFiles.includes(path.basename(toolInput.file_path))) return null;

  return { reason: `LANDING MODE: ${why}. Do not start new work. Land now: commit your changes with git `
    + `(or git stash them), update current-status.md with where you stopped and what comes next, then stop.` };
}

function main() {
  const i = process.argv.indexOf('--state');
  const stateFile = i >= 0 ? process.argv[i + 1] : process.env.HOLDING_RUN_STATE;
  let input = {};
  try { input = JSON.parse(fs.readFileSync(0, 'utf8') || '{}'); } catch { input = {}; }
  const verdict = decide(stateFile ? readState(stateFile) : null, input.tool_name, input.tool_input || {});
  if (verdict) {
    process.stdout.write(JSON.stringify({ hookSpecificOutput: {
      hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: verdict.reason } }));
  }
  process.exit(0);
}

if (require.main === module) main();

module.exports = { decide, isGitOnly, READ_ONLY_TOOLS };
