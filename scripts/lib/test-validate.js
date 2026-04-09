#!/usr/bin/env node

/**
 * test-validate.js — Unit + integration tests for sdk-validate (VS-01 + VS-02)
 *
 * Usage:
 *   node scripts/lib/test-validate.js
 *
 * Exit codes:
 *   0 — all tests passed
 *   1 — one or more tests failed
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { validate } = require('../validate');
const { REQUIRED_FILES, PLACEHOLDER_PATTERNS } = require('./validate-config');

// ─── Helpers ─────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) {
    console.log(`  ✓  ${label}`);
    passed++;
  } else {
    console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function makeProject(tmpDir, files = {}) {
  // files: { 'current-status.md': 'content', ... }
  for (const [name, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(tmpDir, name), content, 'utf8');
  }
}

const MINIMAL_VALID_FILES = {
  'current-status.md': `# Current Status\n\n## Active Missions\n\nNo active missions.\n\n## Next Agent To Activate\n\nSee Coordinator.\n`,
  'history.md': `# History\n\nNo entries yet.\n`,
  'product-requirements.md': `# Product Requirements\n\n## Mission 1\n\n### Pending\n\n- [ ] Task A\n`,
  'engineering-requirements.md': `# Engineering Requirements\n\n## Architecture\n\n### Pending\n\n- [ ] Design review\n`,
  'general-requirements.md': `# General Requirements\n\n## Status\n\nAll good.\n`,
};

// ─── Test suite ───────────────────────────────────────────────────────────────

let tmpDir;

try {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-validate-test-'));

  console.log('\nsdk-validate tests\n');

  // ── VS-01: Missing file detection ─────────────────────────────────────────
  console.log('VS-01: missing file detection');
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'missing-'));
    // Write no files
    const { warnings, clean } = validate(dir);
    assert('empty project → not clean', !clean);
    assert(`warns for each required file (${REQUIRED_FILES.length} files)`,
      warnings.length >= REQUIRED_FILES.length,
      `got ${warnings.length} warnings`
    );
    for (const f of REQUIRED_FILES) {
      const hasWarn = warnings.some(w => w.includes(f) && w.includes('missing'));
      assert(`warns for missing ${f}`, hasWarn, warnings.join('\n'));
    }
  }

  // ── VS-01: Clean project → exit 0 behavior ────────────────────────────────
  console.log('\nVS-01: clean project');
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'clean-'));
    makeProject(dir, MINIMAL_VALID_FILES);
    const { warnings, clean } = validate(dir);
    assert('valid project → clean', clean, warnings.join('\n'));
    assert('valid project → 0 warnings', warnings.length === 0, `got: ${warnings.join('\n')}`);
  }

  // ── VS-02: Placeholder detection — [PLACEHOLDER] token ───────────────────
  console.log('\nVS-02: placeholder detection');
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'placeholder-'));
    makeProject(dir, {
      ...MINIMAL_VALID_FILES,
      'current-status.md': `# Current Status\n\n## Active Missions\n\n[PLACEHOLDER]\n\n## Next Agent To Activate\n\nSee Coordinator.\n`,
    });
    const { warnings, clean } = validate(dir);
    assert('[PLACEHOLDER] token → not clean', !clean);
    assert('[PLACEHOLDER] token → warning includes file name',
      warnings.some(w => w.includes('current-status.md')),
      warnings.join('\n')
    );
    assert('[PLACEHOLDER] token → warning includes line number',
      warnings.some(w => /line \d+/.test(w)),
      warnings.join('\n')
    );
    assert('[PLACEHOLDER] token → warning includes sdk-doc fix command',
      warnings.some(w => w.includes('sdk-doc append')),
      warnings.join('\n')
    );
  }

  // ── VS-02: [RELEASE] placeholder detection ────────────────────────────────
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'release-placeholder-'));
    makeProject(dir, {
      ...MINIMAL_VALID_FILES,
      'history.md': `# History\n\n**Release:** [RELEASE]\n\nNo entries.\n`,
    });
    const { warnings, clean } = validate(dir);
    assert('[RELEASE] token → not clean', !clean);
    assert('[RELEASE] token → warning targets history.md',
      warnings.some(w => w.includes('history.md')),
      warnings.join('\n')
    );
  }

  // ── VS-02: Multiple placeholders → multiple warnings ─────────────────────
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'multi-placeholder-'));
    makeProject(dir, {
      ...MINIMAL_VALID_FILES,
      'current-status.md': `# Current Status\n\n## Active Missions\n\n[PLACEHOLDER]\n\n## Next Agent To Activate\n\n[PLACEHOLDER]\n`,
      'history.md': `# History\n\n[PLACEHOLDER]\n`,
    });
    const { warnings } = validate(dir);
    assert('3 placeholder lines → at least 3 warnings', warnings.length >= 3,
      `got ${warnings.length}: ${warnings.join(' | ')}`
    );
  }

  // ── VS-02: [project] literal placeholder ─────────────────────────────────
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'project-literal-'));
    makeProject(dir, {
      ...MINIMAL_VALID_FILES,
      'general-requirements.md': `# General Requirements\n\nProject: [project]\n`,
    });
    const { warnings, clean } = validate(dir);
    assert('[project] literal → not clean', !clean);
    assert('[project] literal → warning targets general-requirements.md',
      warnings.some(w => w.includes('general-requirements.md')),
      warnings.join('\n')
    );
  }

  // ── VS-01: Required section missing ───────────────────────────────────────
  console.log('\nVS-01: required sections');
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'missing-section-'));
    makeProject(dir, {
      ...MINIMAL_VALID_FILES,
      'current-status.md': `# Current Status\n\nNo sections here.\n`,
    });
    const { warnings, clean } = validate(dir);
    assert('missing required section → not clean', !clean);
    assert('missing section → warning names the section heading',
      warnings.some(w => w.includes('Active Missions') || w.includes('Next Agent')),
      warnings.join('\n')
    );
    assert('missing section → warning includes sdk-doc fix command',
      warnings.some(w => w.includes('sdk-doc append')),
      warnings.join('\n')
    );
  }

  // ── VS-01: Empty required section ─────────────────────────────────────────
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'empty-section-'));
    makeProject(dir, {
      ...MINIMAL_VALID_FILES,
      'current-status.md': `# Current Status\n\n## Active Missions\n\n## Next Agent To Activate\n\nSee Coordinator.\n`,
    });
    const { warnings, clean } = validate(dir);
    assert('empty required section → not clean', !clean);
    assert('empty section → warning says "is empty"',
      warnings.some(w => w.includes('is empty')),
      warnings.join('\n')
    );
  }

  // ── VS-01: Advisory mode always exits 0 (validate() returns, does not throw) ──
  console.log('\nVS-01: advisory mode contract');
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'advisory-'));
    // Completely empty dir — maximum failures
    let threw = false;
    try { validate(dir); } catch (_) { threw = true; }
    assert('validate() never throws — callers decide exit code', !threw);
  }

  // ── VS-01: validate() is importable as a module ───────────────────────────
  {
    const mod = require('../validate');
    assert('validate.js exports validate function', typeof mod.validate === 'function');
  }

  // ── VS-02: Warning messages are specific (no generic "validation failed") ──
  console.log('\nVS-02: warning message quality');
  {
    const dir = fs.mkdtempSync(path.join(tmpDir, 'quality-'));
    // Missing all files
    const { warnings } = validate(dir);
    const generic = warnings.filter(w =>
      w.toLowerCase().includes('validation failed') ||
      w.toLowerCase() === 'warn' ||
      !w.includes(' ')
    );
    assert('no generic "validation failed" messages', generic.length === 0,
      `found generic: ${generic.join(' | ')}`
    );
    const hasFixHint = warnings.every(w => w.includes('sdk-doc') || w.includes('create'));
    assert('every warning includes a fix hint', hasFixHint, warnings.join('\n'));
  }

  // ─── Summary ────────────────────────────────────────────────────────────────

  console.log(`\n${passed + failed} tests: ${passed} passed, ${failed} failed\n`);
  if (failed > 0) process.exit(1);

} finally {
  if (tmpDir) {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}
  }
}
