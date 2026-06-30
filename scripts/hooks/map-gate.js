#!/usr/bin/env node

/**
 * map-gate.js — the Document-First Gate runner (protocol.md §35).
 *
 * Two modes off the one shared classifier (scripts/lib/map-gate-lib.js):
 *
 *   --commit-msg <file>   Layer 1, the REAL gate. Invoked by the git commit-msg hook.
 *                         Exit 1 (BLOCK) when staged files are material and neither the
 *                         map is touched nor [map-exempt: <reason>] is present.
 *
 *   --stop                Layer 2, the in-session reminder. Invoked by the Claude Code
 *                         Stop hook. Reminds (stderr) on uncommitted material drift and
 *                         ALWAYS exits 0 — it never blocks a turn.
 *
 * Honest limits (also stated in §35): `git commit --no-verify` bypasses Layer 1 entirely;
 * a fresh clone has no git gate until `node scripts/install-hooks.js` runs. The on-demand
 * backstop for both is `sdk-health` (material-commits-since-last-map-update drift check).
 */

'use strict';

const fs   = require('fs');
const { execSync } = require('child_process');
const { classify, hasExemptTag } = require('../lib/map-gate-lib');

function git(args, cwd) {
  try {
    return execSync(`git ${args}`, { cwd, encoding: 'utf8' });
  } catch (_) {
    return '';
  }
}

function repoRoot() {
  const r = git('rev-parse --show-toplevel', process.cwd()).trim();
  return r || process.cwd();
}

function stagedFiles(root) {
  return git('diff --cached --name-only --diff-filter=ACMR', root).split('\n').map(s => s.trim()).filter(Boolean);
}

function workingTreeFiles(root) {
  const tracked  = git('diff --name-only', root);          // unstaged, tracked
  const staged   = git('diff --cached --name-only', root); // staged
  const others   = git('ls-files --others --exclude-standard', root); // new untracked
  return [...new Set((tracked + '\n' + staged + '\n' + others).split('\n').map(s => s.trim()).filter(Boolean))];
}

const blockMessage = (material, mapFiles) => `
  ✖ map-gate: material change without a map update.

    Material staged:
${material.map(f => `      • ${f}`).join('\n')}

    Document-first principle (protocol.md §35, CHARTER): the map travels with the change.
    Satisfy ONE of:
      1. Stage a map update in this commit —
           ${mapFiles[0]}   (session state)
           ${mapFiles[1]}   (decision record, §6 format)
      2. Record an exemption in the commit message —
           [map-exempt: <reason>]      (reason required, permanently auditable)

    Honest limit: \`git commit --no-verify\` bypasses this gate; nothing logs that.
    sdk-health + the Status Reconcile ritual are the only backstops if you do.
`;

const reminderMessage = (material, mapFiles) => `
  ↪ map-gate (reminder): material changes in the tree without a map update this session —
${material.map(f => `      • ${f}`).join('\n')}
    Update ${mapFiles[0]} (and ${mapFiles[1]} if a decision was made) before you finish,
    or the commit-msg gate (§35) will block the commit.
`;

// ─── --commit-msg <file> : Layer 1, hard gate ─────────────────────────────────
function runCommitMsg(msgFile) {
  const root = repoRoot();

  // Skip merges/reverts — they restore already-documented state.
  if (fs.existsSync(`${root}/.git/MERGE_HEAD`)) process.exit(0);

  const msg = msgFile && fs.existsSync(msgFile) ? fs.readFileSync(msgFile, 'utf8') : '';
  if (/^\s*(Merge|Revert)\b/m.test(msg)) process.exit(0);

  const c = classify(stagedFiles(root), root);
  if (!c.applies || c.materialStaged.length === 0) process.exit(0); // nothing material
  if (c.mapTouched) process.exit(0);                                // map travels with it ✓
  if (hasExemptTag(msg)) process.exit(0);                           // explicit, reasoned waiver

  process.stderr.write(blockMessage(c.materialStaged, c.mapFiles));
  process.exit(1);
}

// ─── --stop : Layer 2, reminder only (never blocks) ───────────────────────────
function runStop() {
  const root = repoRoot();
  const c = classify(workingTreeFiles(root), root);
  if (c.applies && c.materialStaged.length > 0 && !c.mapTouched) {
    process.stderr.write(reminderMessage(c.materialStaged, c.mapFiles));
  }
  process.exit(0); // Stop hook must never fail the turn.
}

// ─── dispatch ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
if (argv[0] === '--commit-msg') {
  runCommitMsg(argv[1]);
} else if (argv[0] === '--stop') {
  runStop();
} else {
  process.stderr.write('usage: map-gate.js --commit-msg <file> | --stop\n');
  process.exit(2);
}
