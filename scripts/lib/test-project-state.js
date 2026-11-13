#!/usr/bin/env node

/**
 * test-project-state.js — the single markdown-state reader (scripts/lib/project-state.js).
 * Pins the two silent bugs it replaced: positional mission columns, and gate headings
 * that no longer matched the template.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { parseStatus, parseCompliance, tables } = require('./project-state');

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };
const tmpl = (f) => fs.readFileSync(path.join(__dirname, '..', '..', 'project-template', f), 'utf8');

// Template status: placeholders are not data
const empty = parseStatus(tmpl('current-status.md'));
assert(empty.missions.length === 0, 'template placeholder mission is ignored');
assert(empty.release === '[RELEASE]', 'raw release placeholder is surfaced, not invented');

// Columns are read by header, not position
const filled = tmpl('current-status.md').replace(/^\| \[Mission name\].*$/m, '| Checkout v2 | Ana | 2 weeks | Blocked | CFO approves PSP |')
  .replace('**Release:** [RELEASE]', '**Release:** v2026.Q4.2 · **Protocol:** v4.8');
const s = parseStatus(filled);
assert(s.missions.length === 1 && s.missions[0].status === 'Blocked', 'Status column read by header');
assert(s.missions[0].owner === 'Ana' && s.missions[0].nextAction === 'CFO approves PSP', 'PM → owner, Next action → nextAction');
assert(s.release === 'v2026.Q4.2', 'release ID extracted from a decorated header line');

// A differently ordered table still parses
const reordered = '## Active Missions\n\n| Status | Mission | Owner |\n|---|---|---|\n| DONE | Ship it | CTO |\n';
const r = parseStatus(reordered);
assert(r.missions[0].name === 'Ship it' && r.missions[0].status === 'DONE', 'column order does not matter');

// Compliance gates against the real template
const c = parseCompliance(tmpl('compliance-requirements.md'));
assert(c.gates.legal === 'Pending' && c.gates.security === 'Pending', 'gate statuses read from Gate Status table');
assert(c.jurisdictions.present && !c.jurisdictions.filled, 'placeholder jurisdictions are present but not filled');
assert(c.pending.legal && c.pending.security, 'pending items found under the real CLO/CISO headings');

// tables(): header keys are normalized
const t = tables('| **Domain** | Owner |\n|---|---|\n| Legal | CLO |\n')[0];
assert(t.headers[0] === 'domain' && t.rows[0].owner === 'CLO', 'tables() lower-cases headers and strips bold');

console.log(`  project-state: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
