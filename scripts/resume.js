#!/usr/bin/env node
'use strict';

/**
 * sdk-resume <project-dir>
 * Single command to start a session: health check + next agent + activation phrase.
 */

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { getNextAgentStub } = require('./lib/next-stub');

const projectDir = path.resolve(process.argv[2] || process.cwd());

if (!fs.existsSync(projectDir)) {
  console.error(`Project directory not found: ${projectDir}`);
  process.exit(1);
}

const statusFile = path.join(projectDir, 'current-status.md');
if (!fs.existsSync(statusFile)) {
  console.error(`current-status.md not found in ${projectDir}`);
  console.error(`Run: sdk-doc manifest ${projectDir}`);
  process.exit(1);
}

console.log('');

// ─── 1. SDK path check ────────────────────────────────────────────────────────
const sdkrcPath = path.join(projectDir, '.sdkrc');
if (fs.existsSync(sdkrcPath)) {
  try {
    const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
    const sdkExists = sdkrc.sdkPath && fs.existsSync(sdkrc.sdkPath);
    console.log(`SDK:     ${sdkExists ? '✓' : '⚠'} ${sdkrc.sdkPath || 'not set'}${sdkExists ? '' : ' (path not found)'}`);
  } catch (_) {
    console.log('SDK:     ⚠ .sdkrc malformed — run sdk-init to recreate');
  }
} else {
  console.log('SDK:     — .sdkrc not found (run sdk-init to persist SDK path)');
}

// ─── 2. Gate check (advisory — no blocking) ───────────────────────────────────
try {
  const gateCheckScript = path.join(__dirname, 'gate-check.js');
  execSync(`node "${gateCheckScript}" "${projectDir}" --all`, { stdio: 'pipe' });
  console.log('Gates:   ✓ all clear');
} catch (e) {
  const output = (e.stdout || e.stderr || '').toString().slice(0, 300);
  const warningCount = (output.match(/warning/gi) || []).length;
  const errorCount   = (output.match(/GATE BLOCKED|error/gi) || []).length;
  if (errorCount > 0) {
    console.log(`Gates:   ⚠ issues found — run sdk-gate-check ${projectDir} for details`);
  } else {
    console.log(`Gates:   ✓ ${warningCount} warning(s) — run sdk-gate-check ${projectDir} for details`);
  }
}

// ─── 3. Next agent ────────────────────────────────────────────────────────────
// Run sdk-next for the full session brief
const nextScript = path.join(__dirname, 'next.js');
try {
  const output = execSync(`node "${nextScript}" "${projectDir}"`, { encoding: 'utf8' });
  console.log('');
  console.log(output.trim());
} catch (e) {
  console.log('\nCould not read session state — check current-status.md manually.');
}

console.log('');
console.log('Ready. Paste the phrase above to resume your session.');
console.log('');
