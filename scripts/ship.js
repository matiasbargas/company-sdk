#!/usr/bin/env node

/**
 * ship.js — sdk-ship: atomic release command
 *
 * Usage:
 *   sdk-ship <project-dir> <release-id>
 *   sdk-ship <project-dir> <release-id> --dry-run
 *
 * What it does (in order):
 *   1. Validates the release ID format (vYYYY.QN.N)
 *   2. Checks working tree is clean
 *   3. Parses history.md for the release entry (fails if missing)
 *   4. Creates an annotated git tag
 *   5. Pushes the tag to origin
 *   6. Prints the release notes that would go in the GitHub release
 *
 * What it does NOT do (yet — GR-04):
 *   - Create a GitHub release via API (deferred to GR-04)
 *
 * Atomic guarantee:
 *   If tag push fails, the local tag is rolled back.
 *   No partial state is left behind.
 *
 * Examples:
 *   sdk-ship . v2026.Q2.1
 *   sdk-ship /path/to/project v2026.Q2.1 --dry-run
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { createAndPushTag, assertCleanTree } = require('./lib/git');
const { parseHistoryForRelease }            = require('./lib/release-notes');
const { printNextStub }                     = require('./lib/next-stub');
const { validate }                          = require('./validate');

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  sdk-ship <project-dir> <release-id> [--dry-run]

Arguments:
  <project-dir>   Directory containing the project (must be a git repo root or inside one)
  <release-id>    Release ID in vYYYY.QN.N format (e.g. v2026.Q2.1)

Options:
  --dry-run       Validate and print release notes without creating a tag or pushing

Examples:
  sdk-ship . v2026.Q2.1
  sdk-ship /path/to/project v2026.Q2.1 --dry-run
`);
  process.exit(0);
}

const dryRun    = args.includes('--dry-run');
const positional = args.filter(a => !a.startsWith('--'));

if (positional.length < 2) {
  console.error('\nError: Both <project-dir> and <release-id> are required.');
  console.error('Usage: sdk-ship <project-dir> <release-id> [--dry-run]\n');
  process.exit(1);
}

const projectDir = path.resolve(positional[0]);
const releaseId  = positional[1];

// ─── Validation ───────────────────────────────────────────────────────────────

if (!fs.existsSync(projectDir)) {
  console.error(`\nError: Project directory not found: ${projectDir}\n`);
  process.exit(1);
}

const RELEASE_ID_RE = /^v\d{4}\.Q[1-4]\.\d+$/;
if (!RELEASE_ID_RE.test(releaseId)) {
  console.error(`\nError: Invalid release ID format: "${releaseId}"`);
  console.error(`Expected: vYYYY.QN.N (e.g. v2026.Q2.1)\n`);
  process.exit(1);
}

// ─── Pre-flight: history.md must have an entry ────────────────────────────────

const historyFile = path.join(projectDir, 'history.md');
if (!fs.existsSync(historyFile)) {
  console.error(`\n🔴  SHIP BLOCKED\n`);
  console.error(`    history.md not found in ${projectDir}`);
  console.error(`    Add a release entry before shipping:`);
  console.error(`    sdk-doc decision history.md --decision "Release ${releaseId}" --context "..." --made-by Coordinator\n`);
  process.exit(1);
}

const releaseNotes = parseHistoryForRelease(historyFile, releaseId);

// Check if it's a fallback (no real entry found)
if (releaseNotes.includes('No history.md entry found')) {
  console.error(`\n🔴  SHIP BLOCKED\n`);
  console.error(`    No history.md entry found for ${releaseId}.`);
  console.error(`    Add one before shipping:`);
  console.error(`    sdk-doc decision history.md --decision "Release ${releaseId}" --context "..." --made-by Coordinator\n`);
  process.exit(1);
}

// ─── Pre-flight: sdk-validate doc check ──────────────────────────────────────

const { warnings: docWarnings, clean: docClean } = validate(projectDir);

if (!docClean) {
  if (dryRun) {
    // In dry-run: show warnings but do not block
    console.log(`\n⚠️   Documentation warnings (would block without --dry-run):\n`);
    for (const w of docWarnings) console.warn(`    ${w}`);
    console.log('');
  } else {
    console.error(`\n🔴  SHIP BLOCKED — documentation issues found\n`);
    for (const w of docWarnings) console.error(`    ${w}`);
    console.error(`\nFix the issues above, then re-run sdk-ship.\n`);
    console.error(`Run \`sdk-validate ${positional[0]}\` to see full details.\n`);
    process.exit(1);
  }
}

// ─── Pre-flight: clean working tree ──────────────────────────────────────────

if (!dryRun) {
  try {
    assertCleanTree(projectDir);
  } catch (e) {
    console.error(`\n🔴  SHIP BLOCKED\n`);
    console.error(`    ${e.message}\n`);
    process.exit(1);
  }
}

// ─── Dry run output ──────────────────────────────────────────────────────────

if (dryRun) {
  console.log(`\n(dry run) sdk-ship — no changes will be made\n`);
  console.log(`  Project:    ${projectDir}`);
  console.log(`  Release ID: ${releaseId}`);
  console.log(`  history.md: entry found ✓`);
  console.log(`  sdk-validate: ${docClean ? 'clean ✓' : `${docWarnings.length} warning(s) — would block`}`);
  console.log(`\n─── Release notes preview ─────────────────────────────────────────────\n`);
  console.log(releaseNotes);
  console.log(`───────────────────────────────────────────────────────────────────────\n`);
  console.log(`Run without --dry-run to create and push the tag.\n`);
  printNextStub(projectDir);
  process.exit(0);
}

// ─── Ship ─────────────────────────────────────────────────────────────────────

console.log(`\nsdk-ship`);
console.log(`  Project:    ${projectDir}`);
console.log(`  Release ID: ${releaseId}\n`);

try {
  console.log(`  [1/2] Creating and pushing tag...`);
  const result = createAndPushTag(releaseId, projectDir);
  console.log(`  [1/2] ✓ Tag ${result.tag} pushed to origin\n`);

  console.log(`  [2/2] Release notes:\n`);
  console.log(`─── Release notes ──────────────────────────────────────────────────────\n`);
  console.log(releaseNotes);
  console.log(`───────────────────────────────────────────────────────────────────────\n`);

  console.log(`✅  ${releaseId} shipped\n`);
  console.log(`    Tag pushed. Copy the release notes above into your GitHub release.\n`);
  console.log(`    Next: sdk-doc decision history.md --decision "Sealed ${releaseId}" --context "..." --made-by Coordinator\n`);

} catch (e) {
  console.error(`\n🔴  SHIP FAILED\n`);
  console.error(`    ${e.message}\n`);
  process.exit(1);
}

printNextStub(projectDir);
