#!/usr/bin/env node

/**
 * test-map-gate.js — pins the Document-First Gate classifier (protocol.md §35).
 *
 * This is the guard that stops the gate from silently rotting: if someone changes what
 * counts as "material" or "exempt" in map-gate-lib.js, these assertions fail in `npm test`
 * unless the change is deliberate (and updates these expectations).
 *
 * Exit: 0 all passed · 1 any failed
 */

'use strict';

const { classify, hasExemptTag } = require('./map-gate-lib');

let passed = 0, failed = 0;
function assert(label, cond, detail = '') {
  if (cond) { console.log(`  ✓  ${label}`); passed++; }
  else { console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

// Map lives under project/ — pass the prefix explicitly so the test is filesystem-independent.
const ROOT = '/repo';
const MD = 'project/';
const cls = (paths) => classify(paths, ROOT, MD);

// ── No-op safety: a repo with no map → gate does not apply ─────────────────────
assert('no map (null mapDirRel) → applies:false',
  classify(['scripts/x.js'], ROOT, null).applies === false);

// ── Material detection ─────────────────────────────────────────────────────────
const MATERIAL = [
  'protocol.md', 'protocol-core.md', 'CHARTER.md', 'AGENTS.md', 'CLAUDE.md', 'SDK.md',
  'README.md', 'STRATEGY.md',
  'scripts/health.js', 'scripts/hooks/map-gate.js', 'scripts/hooks/commit-msg',
  'team/roles/ceo.md', 'workflows/office-day-v0.1.js', 'packages/protocol/index.js',
  'project/context/intent/foo/bar.md',        // Layer C task intent
  'project/context/spec/foo/claims.yaml',      // Layer B claims
  'project/context/foundation/README.md',      // Layer A pointer
  'project-template/surface-template.md', 'lib/anything.ts', 'some/dir/config.json',
  '.claude/settings.json',
];
for (const p of MATERIAL) {
  assert(`material: ${p}`, cls([p]).materialStaged.includes(p));
}

// ── Exempt detection (exempt wins over material) ───────────────────────────────
const EXEMPT = [
  'project/current-status.md', 'project/history.md',          // the map itself
  'project/surfaces/SURFACE-1.md',                            // §34 own provenance
  'project/engineering-log.md', 'project/bus-log.md',         // area logs (§17)
  'project/product-requirements.md',                          // requirements files
  'project/LOOP.md',
  'project/record/metrics/_signals.jsonl',    // run exhaust (was material as metrics/**)
  'project/record/loops/L1/state.md',          // loop state exhaust
  'project/record/specs/wave-1/01-kill-log.md',// historical spec records
  'package-lock.json', 'yarn.lock', '.gitignore', 'LICENSE', '.DS_Store',
];
for (const p of EXEMPT) {
  assert(`exempt: ${p}`, cls([p]).materialStaged.length === 0, JSON.stringify(cls([p]).materialStaged));
}

// ── mapTouched ─────────────────────────────────────────────────────────────────
assert('mapTouched true when current-status.md staged', cls(['project/current-status.md']).mapTouched === true);
assert('mapTouched true when history.md staged',        cls(['project/history.md']).mapTouched === true);
assert('mapTouched false when only code staged',        cls(['scripts/health.js']).mapTouched === false);

// ── The gate-relevant combinations ─────────────────────────────────────────────
const codeOnly = cls(['scripts/health.js']);
assert('code only → would BLOCK (material, no map touch)',
  codeOnly.materialStaged.length > 0 && !codeOnly.mapTouched);

const codePlusMap = cls(['scripts/health.js', 'project/current-status.md']);
assert('code + map → would PASS (mapTouched)',
  codePlusMap.materialStaged.length > 0 && codePlusMap.mapTouched);

const exemptOnly = cls(['project/engineering-log.md']);
assert('exempt only → would PASS (no material)', exemptOnly.materialStaged.length === 0);

// ── Escape tag parsing ─────────────────────────────────────────────────────────
assert('exempt tag with reason → true',  hasExemptTag('fix x\n\n[map-exempt: trivial rename]') === true);
assert('exempt tag empty reason → false', hasExemptTag('fix x [map-exempt:]') === false);
assert('exempt tag whitespace-only → false', hasExemptTag('fix x [map-exempt:   ]') === false);
assert('no tag → false', hasExemptTag('ordinary commit message') === false);
assert('exempt tag case-insensitive → true', hasExemptTag('[MAP-EXEMPT: ci config]') === true);

// ── Result ─────────────────────────────────────────────────────────────────────
console.log('');
console.log(`  map-gate classifier: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
