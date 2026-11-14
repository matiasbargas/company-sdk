#!/usr/bin/env node

/**
 * test-capability-coverage.js — capabilities cannot be lost silently across versions.
 * @covers cap-sdk-capabilities-001  (project/context/spec/sdk-core/claims.yaml)
 *
 * Rules (protocol.md §30, "Specs outlive implementations"):
 *   1. Every `status: built` capability lists ≥1 conformance id.
 *   2. Every conformance id of a built capability appears as `@covers <id>` in a file that runs
 *      in `npm test` (a script named in package.json "test", or a packages/<pkg>/tests file).
 *   3. Every `@covers` names a capability that exists (no orphan tags after a rename).
 *   4. `planned` capabilities are listed, not failed; they are the build backlog.
 *   5. `unpinned` = the behaviour exists but no test pins it yet (the inventory's honest debt);
 *      `defect` = a test proved the behaviour differs from the spec (a known bug to fix).
 *      Both are reported, not failed, so the denominator stays true.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { loadCapabilities, findCovers } = require('./capabilities');

const root = path.resolve(__dirname, '..', '..');
const specRoot = path.join(root, 'project', 'context', 'spec');
const testScript = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8')).scripts.test;

let passed = 0;
const failures = [];
const check = (c, n) => { if (c) passed++; else failures.push(n); };

const caps = loadCapabilities(specRoot);
const known = new Set(caps.map(c => c.id));
const covers = findCovers([path.join(root, 'scripts'), path.join(root, 'packages')]);
const runsInNpmTest = (file) => {
  const rel = path.relative(root, file).split(path.sep).join('/');
  return testScript.includes(rel) || /^packages\/[^/]+\/tests\//.test(rel);
};

check(caps.length > 0, 'at least one capability spec exists under project/context/spec');
for (const c of caps.filter(c => c.status === 'built')) {
  check(c.conformance.length > 0, `${c.id} (built) lists at least one conformance id`);
  for (const id of c.conformance) {
    const files = (covers.get(id) || []).filter(runsInNpmTest);
    check(files.length > 0, `${c.id}: conformance "${id}" is covered by a test that runs in npm test`);
  }
}
for (const [id, files] of covers) {
  const isConformanceId = caps.some(c => c.conformance.includes(id));
  check(known.has(id) || isConformanceId, `@covers ${id} (in ${path.relative(root, files[0])}) names an existing capability`);
}

const pinned = caps.filter(c => c.status === 'built').length;
const existing = caps.filter(c => ['built', 'unpinned', 'defect'].includes(c.status)).length;
console.log(`  behaviour coverage: ${pinned} of ${existing} existing capabilities pinned by tests (${existing ? Math.round(100 * pinned / existing) : 0}%)`);
const byStatus = caps.reduce((m, c) => (m[c.status] = (m[c.status] || 0) + 1, m), {});
for (const f of failures) console.log(`  ✗  ${f}`);
console.log(`  capability coverage: ${passed} passed, ${failures.length} failed  (${Object.entries(byStatus).map(([k, v]) => `${v} ${k}`).join(', ')})`);
process.exit(failures.length ? 1 : 0);
