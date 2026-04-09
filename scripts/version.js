#!/usr/bin/env node

/**
 * version.js — sdk-version: versioning CLI
 *
 * Usage:
 *   sdk-version <project-dir>                        # print current version
 *   sdk-version <project-dir> bump patch|minor|major # increment and log
 *   sdk-version <project-dir> set v2026.Q3.1         # manual set
 *
 * Version format: vYYYY.QN.N (e.g. v2026.Q2.3)
 *   patch  → increment .N  (v2026.Q2.1 → v2026.Q2.2)
 *   minor  → increment Q   (v2026.Q2.1 → v2026.Q3.1)
 *   major  → increment year (v2026.Q2.1 → v2027.Q1.1)
 *
 * Reads/writes: <project-dir>/.sdkrc (cloud.releaseId or top-level releaseId)
 * Also updates: current-status.md Release field
 * Logs to:      history.md via appended version-bump entry
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const RELEASE_RE = /^v(\d{4})\.Q([1-4])\.(\d+)$/;

// ─── Helpers ─────────────────────────────────────────────────────────────────

function parseVersion(id) {
  const m = id.match(RELEASE_RE);
  if (!m) return null;
  return { year: +m[1], quarter: +m[2], increment: +m[3], raw: id };
}

function formatVersion(year, quarter, increment) {
  return `v${year}.Q${quarter}.${increment}`;
}

function bumpVersion(current, kind) {
  const v = parseVersion(current);
  if (!v) throw new Error(`Cannot parse current version: "${current}"`);
  switch (kind) {
    case 'patch': return formatVersion(v.year, v.quarter, v.increment + 1);
    case 'minor': {
      const q = v.quarter < 4 ? v.quarter + 1 : 1;
      const y = v.quarter < 4 ? v.year : v.year + 1;
      return formatVersion(y, q, 1);
    }
    case 'major': return formatVersion(v.year + 1, 1, 1);
    default: throw new Error(`Unknown bump kind: "${kind}". Use patch, minor, or major.`);
  }
}

function readSdkrc(projectDir) {
  const p = path.join(projectDir, '.sdkrc');
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return {}; }
}

function writeSdkrc(projectDir, data) {
  fs.writeFileSync(path.join(projectDir, '.sdkrc'), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readCurrentRelease(projectDir) {
  // 1. Try .sdkrc releaseId
  const sdkrc = readSdkrc(projectDir);
  if (sdkrc.releaseId && parseVersion(sdkrc.releaseId)) return sdkrc.releaseId;
  // 2. Try current-status.md **Release:** field
  const statusFile = path.join(projectDir, 'current-status.md');
  if (fs.existsSync(statusFile)) {
    const m = fs.readFileSync(statusFile, 'utf8').match(/^\*\*Release:\*\*\s*(.+)$/m);
    if (m && parseVersion(m[1].trim())) return m[1].trim();
  }
  return null;
}

function updateCurrentStatus(projectDir, newVersion) {
  const statusFile = path.join(projectDir, 'current-status.md');
  if (!fs.existsSync(statusFile)) return false;
  const content = fs.readFileSync(statusFile, 'utf8');
  const updated = content.replace(
    /^(\*\*Release:\*\*\s*).+$/m,
    `$1${newVersion}`
  );
  if (updated === content) return false;
  fs.writeFileSync(statusFile, updated, 'utf8');
  return true;
}

function appendHistoryEntry(projectDir, oldVersion, newVersion, kind) {
  const historyFile = path.join(projectDir, 'history.md');
  if (!fs.existsSync(historyFile)) return;

  const date  = new Date().toISOString().slice(0, 10);
  const entry = [
    ``,
    `## Version Bump — ${oldVersion} → ${newVersion}`,
    `Date: ${date}`,
    `Made by: Owner (sdk-version ${kind})`,
    ``,
    `${kind} bump. New release cycle: ${newVersion}.`,
    ``,
  ].join('\n');

  fs.appendFileSync(historyFile, entry, 'utf8');
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  sdk-version <project-dir>                         # print current version
  sdk-version <project-dir> bump patch|minor|major  # increment version
  sdk-version <project-dir> set <version-id>        # manual set

Version format: vYYYY.QN.N  (e.g. v2026.Q2.1)
  patch  — increment .N  (v2026.Q2.1 → v2026.Q2.2)
  minor  — next quarter  (v2026.Q2.1 → v2026.Q3.1)
  major  — next year     (v2026.Q2.1 → v2027.Q1.1)
`);
  process.exit(0);
}

const projectDir = path.resolve(args[0]);
const command    = args[1]; // undefined | 'bump' | 'set'

if (!fs.existsSync(projectDir)) {
  console.error(`Error: project directory not found: ${projectDir}`);
  process.exit(2);
}

// ── Print ──────────────────────────────────────────────────────────────────

if (!command) {
  const current = readCurrentRelease(projectDir);
  if (!current) {
    console.log('No version set. Use: sdk-version <project-dir> set v2026.Q1.1');
  } else {
    console.log(current);
  }
  process.exit(0);
}

// ── Bump ──────────────────────────────────────────────────────────────────

if (command === 'bump') {
  const kind = args[2];
  if (!kind || !['patch', 'minor', 'major'].includes(kind)) {
    console.error(`Error: specify bump kind: patch | minor | major`);
    process.exit(2);
  }

  const current = readCurrentRelease(projectDir);
  if (!current) {
    console.error(`Error: no version found in .sdkrc or current-status.md`);
    console.error(`Set one first: sdk-version ${args[0]} set v2026.Q1.1`);
    process.exit(1);
  }

  let next;
  try { next = bumpVersion(current, kind); }
  catch (e) { console.error(`Error: ${e.message}`); process.exit(1); }

  const sdkrc = readSdkrc(projectDir);
  sdkrc.releaseId = next;
  writeSdkrc(projectDir, sdkrc);
  updateCurrentStatus(projectDir, next);
  appendHistoryEntry(projectDir, current, next, kind);

  console.log(`${current} → ${next}`);
  console.log(`Updated: .sdkrc, current-status.md, history.md`);
  process.exit(0);
}

// ── Set ───────────────────────────────────────────────────────────────────

if (command === 'set') {
  const newVersion = args[2];
  if (!newVersion) {
    console.error('Error: provide a version ID, e.g. sdk-version . set v2026.Q3.1');
    process.exit(2);
  }
  if (!parseVersion(newVersion)) {
    console.error(`Error: invalid version format: "${newVersion}"`);
    console.error(`Expected: vYYYY.QN.N (e.g. v2026.Q3.1)`);
    process.exit(2);
  }

  const current = readCurrentRelease(projectDir) || '(none)';
  const sdkrc   = readSdkrc(projectDir);
  sdkrc.releaseId = newVersion;
  writeSdkrc(projectDir, sdkrc);
  updateCurrentStatus(projectDir, newVersion);
  if (current !== '(none)') appendHistoryEntry(projectDir, current, newVersion, 'set');

  console.log(`${current} → ${newVersion}`);
  console.log(`Updated: .sdkrc, current-status.md${current !== '(none)' ? ', history.md' : ''}`);
  process.exit(0);
}

console.error(`Unknown command: "${command}". Use bump or set.`);
process.exit(2);
