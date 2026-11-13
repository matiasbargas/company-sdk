#!/usr/bin/env node

/**
 * session-start.js — Claude Code SessionStart hook: a compact session brief.
 *
 * Prints (stdout → added to Claude's context) the project's release/phase header, the
 * Next Agent section, and any overdue DECISION BY dates (protocol.md §2 timing). Read-only
 * and fast: it does NOT regenerate the manifest/index (that is `sdk-resume`'s job).
 * Always exits 0. Output is capped well under the 10k-char hook limit.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = process.env.CLAUDE_PROJECT_DIR || process.cwd();
const candidates = [path.join(root, 'project'), root];
const projectDir = candidates.find(d => fs.existsSync(path.join(d, 'current-status.md')));
if (!projectDir) process.exit(0);

const MAX = 2500;
const status = fs.readFileSync(path.join(projectDir, 'current-status.md'), 'utf8');
const header = status.split('\n').filter(l => /^\*\*(Last updated|Release)/.test(l)).join('\n');
const nextMatch = status.match(/^## Next Agent[^\n]*\n([\s\S]*?)(?=^## |(?![\s\S]))/m);
const next = nextMatch ? nextMatch[1].trim().split('\n').slice(0, 12).join('\n') : '';

let overdue = [];
try { overdue = require('../lib/overdue').findOverdue(projectDir); } catch (_) { /* advisory */ }

const rel = path.relative(root, projectDir) || '.';
let out = `team-sdk session brief (${rel}/current-status.md)\n${header}\n`;
if (overdue.length) {
  out += `\nOVERDUE (${overdue.length}) — DECISION BY passed; escalate one step (protocol.md §2):\n`;
  out += overdue.slice(0, 5).map(o => `- ${o.due} ${o.file}:${o.line} ${o.context}`).join('\n') + '\n';
}
if (next) out += `\nNext agent:\n${next}\n`;
out += `\nFull cockpit: sdk-resume ${rel}/  (or node scripts/resume.js ${rel}/)\n`;

process.stdout.write(out.length > MAX ? out.slice(0, MAX) + '\n…(truncated)\n' : out);
process.exit(0);
