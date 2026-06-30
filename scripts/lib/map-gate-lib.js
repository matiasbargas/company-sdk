'use strict';

/**
 * map-gate-lib.js — the single authoritative classifier for the Document-First Gate
 * (protocol.md §35). Pure logic, no process.exit, no git calls — unit-testable.
 *
 * The Document-First principle: every MATERIAL change must travel through the map
 * (project/current-status.md and/or project/history.md) in the same commit, or carry
 * an explicit `[map-exempt: <reason>]` in the commit message.
 *
 * This file is the ONE place the material/exempt lists live. protocol.md §35 points
 * here rather than re-enumerating them in prose (prose drifts from code). Because this
 * file lives under scripts/ and ends in .js, it is itself MATERIAL — editing it without
 * a map touch trips the gate it defines. scripts/lib/test-map-gate.js pins this logic
 * so a silent change to what "material" means fails `npm test`.
 *
 * Exports:
 *   classify(paths, repoRoot) → { applies, mapDirRel, mapFiles, materialStaged, mapTouched }
 *   hasExemptTag(commitMessage) → boolean      // [map-exempt: <non-empty reason>]
 *   MATERIAL / EXEMPT rule descriptors (for tests + the block message)
 */

const fs   = require('fs');
const path = require('path');

// ─── Material / exempt rules ──────────────────────────────────────────────────
// Rules are { label, test } where test(relPosixPath, ctx) → boolean.
// ctx = { base, ext, mapDirRel } with base = basename, ext = lowercased extension.

const MATERIAL_RULES = [
  { label: 'root governance doc', test: (p) =>
      /^protocol(-core|-reference)?\.md$/.test(p) ||
      ['CHARTER.md', 'STRATEGY.md', 'AGENTS.md', 'CLAUDE.md', 'SDK.md', 'README.md'].includes(p) },
  { label: 'team/**',            test: (p) => p.startsWith('team/') },
  { label: 'workflows/**',       test: (p) => p.startsWith('workflows/') },
  { label: 'scripts/**',         test: (p) => p.startsWith('scripts/') },
  { label: 'packages/**',        test: (p) => p.startsWith('packages/') },
  { label: 'foundation/**',      test: (p) => p.startsWith('foundation/') },
  { label: 'intent-spec/**',     test: (p) => p.startsWith('intent-spec/') },
  { label: 'generated-spec/**',  test: (p) => p.startsWith('generated-spec/') },
  { label: 'loops/**',           test: (p) => p.startsWith('loops/') },
  { label: 'metrics/**',         test: (p) => p.startsWith('metrics/') },
  { label: 'project-template/**',test: (p) => p.includes('project-template/') },
  { label: 'source file',        test: (p, c) => ['.js', '.ts', '.mjs', '.cjs', '.json'].includes(c.ext) },
];

// EXEMPT wins over MATERIAL. The map files themselves are exempt (they ARE the map);
// artifacts with their own write rules (logs §17, requirements, §34 surfaces) are exempt.
const EXEMPT_RULES = [
  { label: 'the map files',     test: (p, c) => c.mapFiles.includes(p) },
  { label: 'surfaces/**',       test: (p, c) => p.startsWith(c.mapDirRel + 'surfaces/') },
  { label: 'area log',          test: (p) => /(^|\/)[^/]*-log\.md$/.test(p) || /(^|\/)bus-log\.md$/.test(p) },
  { label: 'requirements file', test: (p) => /(^|\/)[^/]*-requirements\.md$/.test(p) },
  { label: 'LOOP.md',           test: (p, c) => c.base === 'LOOP.md' },
  { label: 'lockfile',          test: (p, c) => c.ext === '.lock' || c.base === 'package-lock.json' },
  { label: 'repo meta',         test: (p, c) => ['.gitignore', 'LICENSE', '.DS_Store'].includes(c.base) },
];

/**
 * Locate the directory that holds the map (current-status.md), relative to repoRoot.
 * Checks <repoRoot>/project/ then <repoRoot>/. Returns a posix prefix ('project/' or '')
 * or null if no map exists in this repo (→ gate is a no-op).
 */
function findMapDirRel(repoRoot) {
  const candidates = ['project', '']; // SDK self-dev keeps the map under project/
  for (const dir of candidates) {
    const probe = path.join(repoRoot, dir, 'current-status.md');
    if (fs.existsSync(probe)) return dir ? dir + '/' : '';
  }
  return null;
}

/**
 * classify(paths, repoRoot)
 *   paths: array of repo-relative posix paths (e.g. from `git diff --cached --name-only`)
 * Returns:
 *   applies        — false if this repo has no map (no-op safety for unrelated repos)
 *   mapDirRel      — 'project/' | '' when applies
 *   mapFiles       — the two map paths
 *   materialStaged — material paths that are NOT exempt (the ones that demand a map touch)
 *   mapTouched     — whether any map file is in `paths`
 */
function classify(paths, repoRoot, mapDirRelOverride) {
  const mapDirRel = mapDirRelOverride != null ? mapDirRelOverride : findMapDirRel(repoRoot);
  if (mapDirRel == null) {
    return { applies: false, mapDirRel: null, mapFiles: [], materialStaged: [], mapTouched: false };
  }
  const mapFiles = [mapDirRel + 'current-status.md', mapDirRel + 'history.md'];

  const norm = (paths || []).map(p => String(p).replace(/\\/g, '/').replace(/^\.\//, '')).filter(Boolean);

  const isExempt = (p) => {
    const c = { base: p.split('/').pop(), ext: path.extname(p).toLowerCase(), mapDirRel, mapFiles };
    return EXEMPT_RULES.some(r => r.test(p, c));
  };
  const isMaterial = (p) => {
    const c = { base: p.split('/').pop(), ext: path.extname(p).toLowerCase(), mapDirRel, mapFiles };
    return MATERIAL_RULES.some(r => r.test(p, c));
  };

  const materialStaged = norm.filter(p => !isExempt(p) && isMaterial(p));
  const mapTouched = norm.some(p => mapFiles.includes(p));

  return { applies: true, mapDirRel, mapFiles, materialStaged, mapTouched };
}

/** [map-exempt: <reason>] with a non-empty reason. Empty `[map-exempt:]` is rejected. */
function hasExemptTag(commitMessage) {
  return /\[map-exempt:\s*\S[^\]]*\]/i.test(String(commitMessage || ''));
}

module.exports = { classify, hasExemptTag, findMapDirRel, MATERIAL_RULES, EXEMPT_RULES };
