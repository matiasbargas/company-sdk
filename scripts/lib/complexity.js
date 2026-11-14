'use strict';

/**
 * complexity.js — the "refactor discussion due" signal (protocol.md §30, "Specs outlive
 * implementations").
 *
 * A source file over `limits.refactorReviewLines` is a discussion candidate. Once discussed,
 * it is acknowledged in context/spec/_refactor-watch.json with its size at the time. It comes
 * back as due only when it grows another `limits.refactorReviewGrowthPct` percent past that
 * acknowledgement. Complexity growth starts a conversation; it never forces a rewrite.
 */

const fs = require('fs');
const path = require('path');

const SOURCE_DIRS = ['scripts', 'packages'];   // workflows/ holds sealed run records, not maintained code
// Maintained source only: no tests, fixtures, or dependencies.
function isSource(rel) {
  if (!/\.(js|mjs|cjs|ts)$/.test(rel)) return false;
  if (/(^|\/)(tests?|node_modules)\//.test(rel)) return false;
  return !/^test-/.test(path.basename(rel));
}

function walk(dir, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

function sourceSizes(codeRoot) {
  const sizes = {};
  for (const d of SOURCE_DIRS) {
    for (const f of walk(path.join(codeRoot, d))) {
      const rel = path.relative(codeRoot, f).split(path.sep).join('/');
      if (!isSource(rel)) continue;
      sizes[rel] = fs.readFileSync(f, 'utf8').split('\n').length;
    }
  }
  return sizes;
}

function readWatch(watchFile) {
  try { return JSON.parse(fs.readFileSync(watchFile, 'utf8')); } catch (_) { return { files: {} }; }
}

/** Files whose size makes a refactor discussion due. */
function refactorDue(codeRoot, watchFile, { refactorReviewLines, refactorReviewGrowthPct }) {
  const watch = readWatch(watchFile).files || {};
  const due = [];
  for (const [file, lines] of Object.entries(sourceSizes(codeRoot))) {
    if (lines <= refactorReviewLines) continue;
    const ack = watch[file];
    if (!ack) { due.push({ file, lines, reason: 'over threshold, never discussed' }); continue; }
    const ceiling = Math.round(ack.lines * (1 + refactorReviewGrowthPct / 100));
    if (lines > ceiling) due.push({ file, lines, reason: `grew past ${ceiling} (acknowledged at ${ack.lines} on ${ack.date})` });
  }
  return due.sort((a, b) => b.lines - a.lines);
}

module.exports = { sourceSizes, refactorDue, readWatch };
