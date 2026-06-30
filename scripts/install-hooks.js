#!/usr/bin/env node

/**
 * install-hooks.js — sdk-install-hooks: activate the Document-First Gate (protocol.md §35).
 *
 * Points git at the committed, versioned hooks directory (scripts/hooks) via
 * `core.hooksPath`, so the commit-msg gate updates with `git pull` and can never drift
 * from its own logic. Run once per clone.
 *
 * Honest limit (stated in §35): cloning does NOT set core.hooksPath — a fresh clone has
 * no active git gate until this runs. The Claude Code Stop hook (.claude/settings.json)
 * and `sdk-health` are the backstops in the meantime.
 *
 * Usage:  node scripts/install-hooks.js        # from anywhere inside the repo
 * Exit:   0 installed/already-installed · 1 not a git repo / failure
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function git(args) {
  return execSync(`git ${args}`, { encoding: 'utf8' }).trim();
}

let root;
try {
  root = git('rev-parse --show-toplevel');
} catch (_) {
  console.error('  ✖ not a git repository — run this from inside the repo.');
  process.exit(1);
}

const hooksRel = 'scripts/hooks';
const hooksAbs = path.join(root, hooksRel);
const commitMsgHook = path.join(hooksAbs, 'commit-msg');

if (!fs.existsSync(commitMsgHook)) {
  console.error(`  ✖ ${hooksRel}/commit-msg not found — is this the company-sdk repo?`);
  process.exit(1);
}

// Make the hook + runner executable (no-ops on filesystems that ignore the bit).
try {
  fs.chmodSync(commitMsgHook, 0o755);
  fs.chmodSync(path.join(hooksAbs, 'map-gate.js'), 0o755);
} catch (_) {}

try {
  git(`config core.hooksPath ${hooksRel}`);
} catch (e) {
  console.error(`  ✖ failed to set core.hooksPath: ${e.message}`);
  process.exit(1);
}

console.log('');
console.log('  ✓ Document-First Gate installed (protocol.md §35).');
console.log(`    core.hooksPath → ${hooksRel}`);
console.log('    Commits that change material files now require a map update');
console.log('    (project/current-status.md or history.md) or [map-exempt: <reason>].');
console.log('');
process.exit(0);
