'use strict';

/**
 * activity.js — measure staleness in work done, not in calendar time.
 *
 * Agents do not experience days (protocol.md §2, "Timing for session-bound agents"), and file
 * mtimes reset on every clone. A thing is stale when work moved on around it, so the units are:
 *   - commits:    commits that landed since the file last changed (git history survives clones)
 *   - iterations: closed §32 loops + graduated §31 Guardian cycles, the agents' improvement
 *                 iterations (used for the CHARTER review cadence)
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

function git(args, cwd) {
  try {
    return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  } catch (_) {
    return null;
  }
}

/**
 * Commits on HEAD since `file` last changed. Returns 0 for uncommitted edits (they are newer than
 * HEAD) and null outside a git repo or for a file git has never seen.
 */
function commitsSince(file) {
  file = path.resolve(file);
  const dir = path.dirname(file);
  if (git(['rev-parse', '--is-inside-work-tree'], dir) !== 'true') return null;
  if (git(['status', '--porcelain', '--', file], dir)) return 0;
  const last = git(['log', '-1', '--format=%H', '--', file], dir);
  if (!last) return null;
  const n = git(['rev-list', '--count', `${last}..HEAD`], dir);
  return n === null ? null : parseInt(n, 10);
}

function walk(dir, match, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, match, out);
    else if (match(e.name)) out.push(p);
  }
  return out;
}

/** A §32 loop is closed when its state.md Terminate section records an outcome or cause. */
function isClosedLoop(stateFile) {
  const text = fs.readFileSync(stateFile, 'utf8');
  const m = text.match(/^## Terminate\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!m) return false;
  return m[1].split('\n').some(l => /^\s*[-*]?\s*(Outcome|Termination cause|Terminator)\s*:\s*(?!<|\[|$)\S/i.test(l));
}

/** Agent improvement iterations: closed §32 loops + graduated §31 Guardian cycles. */
function countIterations(projectDir) {
  const loops = walk(path.join(projectDir, 'record', 'loops'), n => n === 'state.md').filter(isClosedLoop).length;
  const cycles = walk(path.join(projectDir, 'iterations'), n => /^iter-\d+\.md$/.test(n))
    .filter(f => /^status:\s*"?graduated"?/m.test(fs.readFileSync(f, 'utf8'))).length;
  return { loops, cycles, total: loops + cycles };
}

/**
 * CHARTER.md "## Review log" lines look like:
 *   - Review 1 — 2026-11-13 — at iteration 3 — <outcome>
 * Returns the iteration count at the most recent review (0 if never reviewed).
 */
function lastCharterReviewAt(charterFile) {
  if (!fs.existsSync(charterFile)) return null;
  const text = fs.readFileSync(charterFile, 'utf8');
  const log = text.match(/^## Review log\s*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
  if (!log) return 0;
  const at = [...log[1].matchAll(/at iteration (\d+)/gi)].map(m => parseInt(m[1], 10));
  return at.length ? Math.max(...at) : 0;
}

module.exports = { commitsSince, countIterations, isClosedLoop, lastCharterReviewAt };
