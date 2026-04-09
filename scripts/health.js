#!/usr/bin/env node

/**
 * health.js — sdk-health: project health check (Iteration 5 — The Last Picture)
 *
 * Checks:
 *   1. current-status.md staleness (warn if not updated within threshold)
 *   2. sdk-validate advisory pass (all required files + no placeholders)
 *   3. context-manifest.json freshness
 *   4. .sdkrc presence and validity
 *
 * Usage:
 *   sdk-health [project-dir]           # defaults to current directory
 *   sdk-health [project-dir] --stale-hours 48   # custom staleness threshold (default: 24h)
 *   sdk-health [project-dir] --json    # machine-readable output
 *
 * Exit codes:
 *   0 — healthy
 *   1 — issues found
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { validate } = require('./validate');

const args         = process.argv.slice(2);
const jsonMode     = args.includes('--json');
const staleHoursArg = args.find((a, i) => args[i - 1] === '--stale-hours');
const staleHours   = staleHoursArg ? +staleHoursArg : 24;
const projectArg   = args.find(a => !a.startsWith('--'));
const projectDir   = path.resolve(projectArg || process.cwd());

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  sdk-health [project-dir]
  sdk-health [project-dir] --stale-hours 48
  sdk-health [project-dir] --json

Checks project file health: staleness, missing files, placeholders, manifest freshness.
Exit 0 if healthy, exit 1 if issues found.
`);
  process.exit(0);
}

// ─── Checks ───────────────────────────────────────────────────────────────────

const issues  = [];
const notices = [];

// 1. current-status.md staleness
const statusFile = path.join(projectDir, 'current-status.md');
if (!fs.existsSync(statusFile)) {
  issues.push('current-status.md is missing — run sdk-init or sdk-doc to create it');
} else {
  const stat = fs.statSync(statusFile);
  const ageH  = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
  if (ageH > staleHours) {
    issues.push(`current-status.md is stale (${Math.round(ageH)}h since last update, threshold: ${staleHours}h) — ask the Coordinator to update it`);
  } else {
    notices.push(`current-status.md updated ${Math.round(ageH)}h ago ✓`);
  }
}

// 2. sdk-validate advisory check
if (fs.existsSync(projectDir)) {
  const { warnings, clean } = validate(projectDir);
  if (!clean) {
    for (const w of warnings) issues.push(w);
  } else {
    notices.push('sdk-validate: no issues ✓');
  }
}

// 3. context-manifest.json freshness
const manifestFile = path.join(projectDir, 'context-manifest.json');
if (!fs.existsSync(manifestFile)) {
  notices.push('context-manifest.json not found — run sdk-doc manifest to generate');
} else {
  const stat = fs.statSync(manifestFile);
  const ageH = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
  if (ageH > staleHours * 2) {
    notices.push(`context-manifest.json is ${Math.round(ageH)}h old — consider regenerating with sdk-doc manifest`);
  } else {
    notices.push(`context-manifest.json fresh (${Math.round(ageH)}h old) ✓`);
  }
}

// 4. .sdkrc validity
const sdkrcPath = path.join(projectDir, '.sdkrc');
if (!fs.existsSync(sdkrcPath)) {
  notices.push('.sdkrc not found — SDK path may not be set (run sdk-init)');
} else {
  try {
    const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
    if (!sdkrc.sdkPath) notices.push('.sdkrc: sdkPath not set — run sdk-init to configure');
    else notices.push('.sdkrc: sdkPath set ✓');
  } catch (_) {
    issues.push('.sdkrc is malformed JSON — run sdk-init to recreate');
  }
}

// ─── Output ───────────────────────────────────────────────────────────────────

const healthy = issues.length === 0;

if (jsonMode) {
  console.log(JSON.stringify({ healthy, issues, notices }, null, 2));
  process.exit(healthy ? 0 : 1);
}

console.log('');
console.log(`  sdk-health: ${projectDir}`);
console.log('');

for (const n of notices) {
  console.log(`  ✓  ${n}`);
}

if (issues.length) {
  console.log('');
  for (const issue of issues) {
    console.error(`  ⚠  ${issue}`);
  }
  console.log('');
  console.log(`  ${issues.length} issue${issues.length > 1 ? 's' : ''} found. Fix before next session.`);
} else {
  console.log('');
  console.log(`  Project is healthy.`);
}
console.log('');

process.exit(healthy ? 0 : 1);
