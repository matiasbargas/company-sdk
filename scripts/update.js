#!/usr/bin/env node

/**
 * update.js — Sync a project's local team-sdk/ copy with the latest SDK source
 *
 * Usage (run from the project folder that contains team-sdk/):
 *   node team-sdk/scripts/update.js <sdk-source-path>
 *
 * Or if installed globally as sdk-update:
 *   sdk-update <sdk-source-path>
 *
 * Example:
 *   node team-sdk/scripts/update.js /Users/me/dev/team-sdk
 *   node team-sdk/scripts/update.js ../team-sdk
 *
 * What it syncs:
 *   team/roles/            All agent prompts
 *   scripts/          CLI scripts
 *   team/levels/           Skill ladder
 *   project-template/ Bootstrap template files
 *   team/squads/           Squad definitions
 *   protocol.md       Inter-agent communication standard
 *   AGENTS.md         Agent manifest and dependency graph
 *   STRATEGY.md       Corporate strategy layer
 *   CLAUDE.md         SDK-level Claude instructions
 *   README.md         SDK documentation
 *   HOW_IT_WORKS.md   Narrative walkthrough
 *   SQUADS.md         Squad comparison guide
 *   DISCLAIMER.md     AI agent liability disclaimer
 *
 * What it does NOT sync (project-specific, never overwritten):
 *   project.md        Decision log and source of truth
 *   history.md        Decision log
 *   current-status.md Session continuity
 *   idea.md           Raw idea brief
 *   *-log.md          Area logs (engineering, product, design, etc.)
 *   *-requirements.md Domain requirements (your team filled these in)
 *   .claude/          Claude project settings
 *   CLAUDE.md         In the project root (project-level, not SDK-level)
 */

const fs   = require('fs');
const path = require('path');

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node team-sdk/scripts/update.js <sdk-source-path>

Run from the project folder that contains a team-sdk/ subdirectory.

Arguments:
  <sdk-source-path>   Path to the team-sdk source to sync from

Example:
  node team-sdk/scripts/update.js /Users/me/dev/team-sdk
  node team-sdk/scripts/update.js ../team-sdk
`);
  process.exit(0);
}

const sourcePath = path.resolve(args[0]);
const dryRun = args.includes('--dry-run');

// ─── Locate target team-sdk ───────────────────────────────────────────────────

// This script runs from within <project>/team-sdk/scripts/
// The target team-sdk/ is two levels up from this script
const targetSdk = path.resolve(__dirname, '..');
const projectDir = path.resolve(targetSdk, '..');

// ─── Validation ───────────────────────────────────────────────────────────────

if (!fs.existsSync(sourcePath)) {
  console.error(`\nError: Source path not found: ${sourcePath}`);
  process.exit(1);
}

const sourcePackage = path.join(sourcePath, 'package.json');
const sourceAgents  = path.join(sourcePath, 'AGENTS.md');
if (!fs.existsSync(sourceAgents)) {
  console.error(`\nError: "${sourcePath}" does not look like a team-sdk directory (AGENTS.md not found).`);
  process.exit(1);
}

if (path.resolve(sourcePath) === path.resolve(targetSdk)) {
  console.error('\nError: Source and target are the same directory. Nothing to do.');
  process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function readFile(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function syncFile(src, dest) {
  const srcContent  = readFile(src);
  if (srcContent === null) return { status: 'missing' };

  const destContent = readFile(dest);
  if (srcContent === destContent) return { status: 'unchanged' };

  if (!dryRun) {
    ensureDir(path.dirname(dest));
    fs.writeFileSync(dest, srcContent, 'utf8');
  }
  return { status: destContent === null ? 'added' : 'updated' };
}

function syncDir(srcDir, destDir) {
  const results = [];
  if (!fs.existsSync(srcDir)) return results;

  const entries = fs.readdirSync(srcDir);
  for (const entry of entries) {
    const src  = path.join(srcDir, entry);
    const dest = path.join(destDir, entry);
    const stat = fs.statSync(src);

    if (stat.isFile()) {
      const rel    = path.relative(targetSdk, dest);
      const result = syncFile(src, dest);
      results.push({ file: rel, ...result });
    } else if (stat.isDirectory()) {
      const sub = syncDir(src, path.join(destDir, entry));
      results.push(...sub);
    }
  }
  return results;
}

// ─── Files and directories to sync ───────────────────────────────────────────

const TOP_LEVEL_FILES = [
  'protocol.md',
  'AGENTS.md',
  'STRATEGY.md',
  'CLAUDE.md',
  'README.md',
  'DISCLAIMER.md',
  'package.json',
];

const DIRECTORIES = [
  'team',
  'scripts',
  'project-template',
];

// ─── Run ─────────────────────────────────────────────────────────────────────

console.log(`\nteam-sdk update`);
console.log(`  Source: ${sourcePath}`);
console.log(`  Target: ${targetSdk}`);
console.log(`  Project: ${projectDir}`);
if (dryRun) console.log('  Mode: DRY RUN (no files written)\n');
else console.log('');

const allResults = [];

// Sync top-level files
for (const file of TOP_LEVEL_FILES) {
  const src    = path.join(sourcePath, file);
  const dest   = path.join(targetSdk, file);
  const result = syncFile(src, dest);
  allResults.push({ file, ...result });
}

// Sync directories
for (const dir of DIRECTORIES) {
  const srcDir  = path.join(sourcePath, dir);
  const destDir = path.join(targetSdk, dir);
  const results = syncDir(srcDir, destDir);
  allResults.push(...results);
}

// ─── Remove obsolete files ────────────────────────────────────────────────────
// Files that exist in target but not in source (inside tracked dirs)

const SKIP_REMOVE = new Set(['CLAUDE.md']); // project-level CLAUDE.md should never be touched

for (const dir of DIRECTORIES) {
  const destDir = path.join(targetSdk, dir);
  if (!fs.existsSync(destDir)) continue;

  const walk = (d) => {
    for (const entry of fs.readdirSync(d)) {
      const fullPath = path.join(d, entry);
      const rel      = path.relative(targetSdk, fullPath);
      const stat     = fs.statSync(fullPath);

      if (stat.isDirectory()) {
        walk(fullPath);
      } else {
        const srcPath = path.join(sourcePath, rel);
        if (!fs.existsSync(srcPath) && !SKIP_REMOVE.has(entry)) {
          if (!dryRun) fs.unlinkSync(fullPath);
          allResults.push({ file: rel, status: 'removed' });
        }
      }
    }
  };
  walk(destDir);
}

// ─── Report ───────────────────────────────────────────────────────────────────

const added     = allResults.filter(r => r.status === 'added');
const updated   = allResults.filter(r => r.status === 'updated');
const removed   = allResults.filter(r => r.status === 'removed');
const unchanged = allResults.filter(r => r.status === 'unchanged');
const missing   = allResults.filter(r => r.status === 'missing');

if (added.length)   { console.log(`  + ${added.length} added`);     added.forEach(r   => console.log(`      + ${r.file}`)); }
if (updated.length) { console.log(`  ~ ${updated.length} updated`);  updated.forEach(r => console.log(`      ~ ${r.file}`)); }
if (removed.length) { console.log(`  - ${removed.length} removed`);  removed.forEach(r => console.log(`      - ${r.file}`)); }
if (missing.length) { console.log(`  ? ${missing.length} not in source`); missing.forEach(r => console.log(`      ? ${r.file}`)); }

const changed = added.length + updated.length + removed.length;

if (changed === 0) {
  console.log('\n✅ Already up to date. No changes.\n');
} else {
  const verb = dryRun ? 'Would change' : 'Done';
  console.log(`\n${dryRun ? '(dry run) ' : ''}✅ ${verb}: ${changed} file${changed === 1 ? '' : 's'} (${added.length} added, ${updated.length} updated, ${removed.length} removed)\n`);
}

// ─── Version note ─────────────────────────────────────────────────────────────

const srcProtocol  = readFile(path.join(sourcePath, 'protocol.md'));
const destProtocol = readFile(path.join(targetSdk, 'protocol.md'));

const versionMatch = (content) => {
  if (!content) return null;
  const m = content.match(/\*\*Version:\*\*\s*([\d.]+)/);
  return m ? m[1] : null;
};

const srcVer  = versionMatch(srcProtocol);
const destVer = versionMatch(dryRun ? destProtocol : readFile(path.join(targetSdk, 'protocol.md')));

if (srcVer && destVer && srcVer !== destVer) {
  console.log(`  Protocol version: ${destVer} → ${srcVer}\n`);
} else if (srcVer) {
  console.log(`  Protocol version: ${srcVer}\n`);
}
