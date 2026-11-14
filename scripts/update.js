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
const { printNextStub } = require('./lib/next-stub');

// ─── Args ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node team-sdk/scripts/update.js [<sdk-source-path>]

Run from the project folder that contains a team-sdk/ subdirectory.
If no path is given, reads .sdkrc in the current directory for the SDK path.
For an sdk-init / sdk-bootstrap project (no team-sdk/ copy; .sdkrc sdkPath is the SDK),
run sdk-update from the project folder: it syncs the SDK docs, protocol/, team/ and the
.claude harness that init copied into the project root.

Arguments:
  <sdk-source-path>   Path to the team-sdk source to sync from (optional if .sdkrc exists)

Example:
  node team-sdk/scripts/update.js /Users/me/dev/team-sdk
  node team-sdk/scripts/update.js ../team-sdk
  node team-sdk/scripts/update.js
`);
  process.exit(0);
}

const dryRun = args.includes('--dry-run');

let sourcePath;
if (args[0] && !args[0].startsWith('--')) {
  sourcePath = path.resolve(args[0]);
} else {
  const sdkrcFile = path.join(process.cwd(), '.sdkrc');
  if (!fs.existsSync(sdkrcFile)) {
    console.error('No SDK path provided and .sdkrc not found in current directory.\nPass the SDK path explicitly: sdk-update <sdk-source-path>');
    process.exit(1);
  }
  let sdkrc;
  try {
    sdkrc = JSON.parse(fs.readFileSync(sdkrcFile, 'utf8'));
  } catch (e) {
    console.error('No SDK path provided and .sdkrc not found in current directory.\nPass the SDK path explicitly: sdk-update <sdk-source-path>');
    process.exit(1);
  }
  if (!sdkrc.sdkPath) {
    console.error('No SDK path provided and .sdkrc not found in current directory.\nPass the SDK path explicitly: sdk-update <sdk-source-path>');
    process.exit(1);
  }
  sourcePath = path.resolve(sdkrc.sdkPath);
}

// ─── Locate target team-sdk ───────────────────────────────────────────────────

// Vendored mode: this script runs from within <project>/team-sdk/scripts/, so the target
// team-sdk/ is one level up and the project is the folder above it.
// Linked mode: sdk-init / sdk-bootstrap projects carry no team-sdk/ copy; their .sdkrc sdkPath
// IS the SDK this script lives in. Then the target is the project in the cwd, and only the
// harness files those commands copied into it are synced (see LINKED_* below).
const scriptSdk  = path.resolve(__dirname, '..');
const cwd        = path.resolve(process.cwd());
const linkedMode = path.resolve(sourcePath) === scriptSdk
  && cwd !== scriptSdk
  && fs.existsSync(path.join(cwd, '.sdkrc'));
const targetSdk  = linkedMode ? cwd : scriptSdk;
const projectDir = linkedMode ? cwd : path.resolve(targetSdk, '..');

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

function syncFile(src, dest, transform) {
  const raw         = readFile(src);
  if (raw === null) return { status: 'missing' };
  const srcContent  = transform ? transform(raw) : raw;

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
  'protocol-core.md',
  'protocol-reference.md',
  'SDK.md',
  'CHARTER.md',
  'AGENTS.md',
  'STRATEGY.md',
  'CLAUDE.md',
  'README.md',
  'DISCLAIMER.md',
  'package.json',
];

const DIRECTORIES = [
  'protocol',
  'team',
  'scripts',
  'project-template',
];

// Linked mode: exactly what sdk-init copies from the SDK into the project root. Project-owned
// files (CLAUDE.md, history.md, current-status.md, .claude/settings.json, ...) are never touched.
const LINKED_TOP_LEVEL_FILES = ['SDK.md', 'protocol.md', 'protocol-core.md', 'protocol-reference.md', 'AGENTS.md', 'STRATEGY.md', 'CHARTER.md'];
const LINKED_DIRECTORIES     = ['protocol', 'team'];
const LINKED_REMOVE_DIRS     = ['protocol']; // generated views only; team/ may hold project-added roles

// Law docs and generated views are synced verbatim, exactly as sdk-init copies them: their
// [YEAR] / [YYYY-MM-DD] tokens are format templates, not fill-ins.
const linkedTransform = null;

const topLevelFiles = linkedMode ? LINKED_TOP_LEVEL_FILES : TOP_LEVEL_FILES;
const syncDirs      = linkedMode ? LINKED_DIRECTORIES : DIRECTORIES;
const removeDirs    = linkedMode ? LINKED_REMOVE_DIRS : DIRECTORIES;

// ─── Run ─────────────────────────────────────────────────────────────────────

// Legacy .claude/commands/ paths (commands are skills now; see the harness sync below)
// (these live at the project root, not inside team-sdk/)
const sourceCommandsDir = path.join(sourcePath, '.claude', 'commands');
const destCommandsDir   = path.join(projectDir, '.claude', 'commands');

console.log(`\nteam-sdk update`);
console.log(`  Source: ${sourcePath}`);
console.log(`  Target: ${targetSdk}`);
console.log(`  Project: ${projectDir}`);
if (linkedMode) console.log('  Mode: linked project (.sdkrc sdkPath is this SDK; syncing copied harness files)');
if (dryRun) console.log('  Mode: DRY RUN (no files written)\n');
else console.log('');

const allResults = [];

// Sync top-level files
for (const file of topLevelFiles) {
  const src    = path.join(sourcePath, file);
  const dest   = path.join(targetSdk, file);
  const result = syncFile(src, dest, linkedTransform);
  allResults.push({ file, ...result });
}

// Sync directories
for (const dir of syncDirs) {
  const srcDir  = path.join(sourcePath, dir);
  const destDir = path.join(targetSdk, dir);
  const results = syncDir(srcDir, destDir);
  allResults.push(...results);
}

// Sync the .claude harness into the project root (not inside team-sdk/):
// skills (incl. /ask), generated agents, output styles, and legacy commands if present.
for (const sub of ['skills', 'agents', 'output-styles', 'commands']) {
  const srcDir = sub === 'commands' ? sourceCommandsDir : path.join(sourcePath, '.claude', sub);
  const dstDir = sub === 'commands' ? destCommandsDir : path.join(projectDir, '.claude', sub);
  if (!fs.existsSync(srcDir)) continue;
  for (const r of syncDir(srcDir, dstDir)) {
    // syncDir labels files relative to targetSdk; relabel them relative to .claude/<sub>.
    r.file = path.join('.claude', sub, path.relative(path.relative(targetSdk, dstDir), r.file));
    allResults.push(r);
  }
}

// ─── Remove obsolete files ────────────────────────────────────────────────────
// Files that exist in target but not in source (inside tracked dirs)

const SKIP_REMOVE = new Set(['CLAUDE.md']); // project-level CLAUDE.md should never be touched

for (const dir of removeDirs) {
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

printNextStub(projectDir);
