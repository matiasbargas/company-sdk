#!/usr/bin/env node

/**
 * bootstrap.js — Scaffold a new project from the company-sdk template
 *
 * Usage:
 *   node scripts/bootstrap.js <project-name> [--output <dir>] [--squad <type>]
 *
 * Options:
 *   --output <dir>    Output directory (default: ./projects/<project-name>)
 *   --squad <type>    Squad type: website | mvp | feature | startup (default: startup)
 *
 * Example:
 *   node scripts/bootstrap.js my-saas --squad mvp
 *   node scripts/bootstrap.js landing-page --squad website --output ./projects/landing
 */

const fs = require('fs');
const path = require('path');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node scripts/bootstrap.js <project-name> [--output <dir>] [--squad <type>]

Options:
  --output <dir>    Output directory (default: ./projects/<project-name>)
  --squad <type>    Squad type: website | mvp | feature | startup (default: startup)

Example:
  node scripts/bootstrap.js my-saas --squad mvp
  node scripts/bootstrap.js landing-page --squad website --output ./projects/landing
`);
  process.exit(0);
}

const projectName = args[0];
let outputDir = null;
let squadType = 'startup';

for (let i = 1; i < args.length; i++) {
  if (args[i] === '--output' && args[i + 1]) {
    outputDir = args[++i];
  } else if (args[i] === '--squad' && args[i + 1]) {
    squadType = args[++i];
  }
}

const VALID_SQUADS = ['website', 'mvp', 'feature', 'startup'];
if (!VALID_SQUADS.includes(squadType)) {
  console.error(`Invalid squad type: "${squadType}". Valid types: ${VALID_SQUADS.join(', ')}`);
  process.exit(1);
}

const sdkRoot = path.resolve(__dirname, '..');
const templateDir = path.join(sdkRoot, 'project-template');
const squadsDir = path.join(sdkRoot, 'squads');
outputDir = outputDir
  ? path.resolve(outputDir)
  : path.resolve(process.cwd(), 'projects', projectName);

// ─── Helpers ─────────────────────────────────────────────────────────────────

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function replacePlaceholders(content, vars) {
  let result = content;
  for (const [key, value] of Object.entries(vars)) {
    result = result.split(`{{${key}}}`).join(value);
    result = result.split(`[${key}]`).join(value);
  }
  return result;
}

function copyAndProcess(src, dest, vars) {
  const content = fs.readFileSync(src, 'utf8');
  const processed = replacePlaceholders(content, vars);
  fs.writeFileSync(dest, processed, 'utf8');
}

// ─── Date utilities ──────────────────────────────────────────────────────────

const now = new Date();
const year = now.getFullYear();
const quarter = Math.ceil((now.getMonth() + 1) / 3);
const releaseId = `v${year}.Q${quarter}.1`;
const dateStr = now.toISOString().split('T')[0];

// ─── Variables ───────────────────────────────────────────────────────────────

const vars = {
  PROJECT_NAME: projectName,
  PROJECT_DIR: outputDir,
  RELEASE: releaseId,
  DATE: dateStr,
  YEAR: String(year),
  SQUAD: squadType,
  COMPANY: projectName,
};

// ─── Run ─────────────────────────────────────────────────────────────────────

console.log(`\nBootstrapping project: ${projectName}`);
console.log(`  Squad:   ${squadType}`);
console.log(`  Output:  ${outputDir}`);
console.log(`  Release: ${releaseId}\n`);

// Check source exists
if (!fs.existsSync(templateDir)) {
  console.error(`Template directory not found: ${templateDir}`);
  process.exit(1);
}

// Check output doesn't already exist
if (fs.existsSync(outputDir)) {
  console.error(`Output directory already exists: ${outputDir}`);
  console.error('Remove it first or use a different --output path.');
  process.exit(1);
}

// Create output directory
ensureDir(outputDir);

// Copy all template files
const templateFiles = fs.readdirSync(templateDir);
let count = 0;

for (const file of templateFiles) {
  const src = path.join(templateDir, file);
  const dest = path.join(outputDir, file);
  const stat = fs.statSync(src);

  if (stat.isFile()) {
    copyAndProcess(src, dest, vars);
    console.log(`  ✓ ${file}`);
    count++;
  }
}

// Copy squad file as SQUAD.md
const squadSrc = path.join(squadsDir, `${squadType}.md`);
if (fs.existsSync(squadSrc)) {
  const squadDest = path.join(outputDir, 'SQUAD.md');
  copyAndProcess(squadSrc, squadDest, vars);
  console.log(`  ✓ SQUAD.md  ← ${squadType}.md`);
  count++;
}

// Copy protocol, AGENTS, and STRATEGY
const extras = ['protocol.md', 'AGENTS.md', 'STRATEGY.md'];
for (const extra of extras) {
  const src = path.join(sdkRoot, extra);
  if (fs.existsSync(src)) {
    const dest = path.join(outputDir, extra);
    copyAndProcess(src, dest, vars);
    console.log(`  ✓ ${extra}`);
    count++;
  }
}

console.log(`\n✅ Project "${projectName}" bootstrapped (${count} files)`);
console.log(`   Path: ${outputDir}`);
console.log(`   Release: ${releaseId}`);
console.log(`\nNext steps:`);
console.log(`  1. Open ${outputDir}/idea.md — fill in your raw idea and iterate with AI`);
console.log(`  2. When ready: copy the brief from idea.md Section 4 and say "Hey Greg" to start Discovery`);
console.log(`  3. Check ${outputDir}/current-status.md — your session continuity file (read this first on every resume)`);
console.log(`  4. Read ${outputDir}/STRATEGY.md — align on the 4 success themes before the team activates`);
console.log(`  5. Activate agents in the order defined in SQUAD.md`);
console.log(`\nUseful doc commands:`);
console.log(`  sdk-doc status ${outputDir}                          # Resume from where you left off`);
console.log(`  sdk-doc log engineering-log.md --role EM --level M1 --goal "..." # Write area log entry`);
console.log(`  sdk-doc pod-update current-status.md --mission "..." --status Active --next "..." # Track mission`);
console.log(`  sdk-doc decision history.md --decision "..." --context "..." --made-by [Role]\n`);
