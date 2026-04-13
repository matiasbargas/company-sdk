#!/usr/bin/env node
'use strict';

/**
 * sdk-resume <project-dir>
 * Single command to start a session: health + gates + sessions + cockpit.
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
    console.log(`SDK:      ${sdkExists ? '✓' : '⚠'} ${sdkrc.sdkPath || 'not set'}${sdkExists ? '' : ' (path not found)'}`);
  } catch (_) {
    console.log('SDK:      ⚠ .sdkrc malformed — run sdk-init to recreate');
  }
} else {
  console.log('SDK:      — .sdkrc not found (run sdk-init to persist SDK path)');
}

// ─── 2. Gate check (advisory — no blocking) ───────────────────────────────────
try {
  const gateCheckScript = path.join(__dirname, 'gate-check.js');
  execSync(`node "${gateCheckScript}" "${projectDir}" --all`, { stdio: 'pipe' });
  console.log('Gates:    ✓ all clear');
} catch (e) {
  const output = (e.stdout || e.stderr || '').toString().slice(0, 300);
  const warningCount = (output.match(/warning/gi) || []).length;
  const errorCount   = (output.match(/GATE BLOCKED|error/gi) || []).length;
  if (errorCount > 0) {
    console.log(`Gates:    ⚠ issues found — run sdk-gate-check ${projectDir} for details`);
  } else {
    console.log(`Gates:    ✓ ${warningCount} warning(s) — run sdk-gate-check ${projectDir} for details`);
  }
}

// ─── 2.5 Agent drafts (Night Watch findings) ─────────────────────────────────
const nightWatchConfig = require('./daemon-config');
const draftsDir = path.join(projectDir, nightWatchConfig.paths.agentDrafts);
if (fs.existsSync(draftsDir)) {
  const draftFiles = fs.readdirSync(draftsDir).filter(f => f.endsWith('.md')).sort().reverse();
  if (draftFiles.length > 0) {
    const latest = draftFiles[0];
    const content = fs.readFileSync(path.join(draftsDir, latest), 'utf8');
    const issueLines = (content.match(/^- .+/gm) || []).length;
    console.log(`Drafts:   ${draftFiles.length} finding(s) in agent-drafts/ — latest: ${latest} (${issueLines} items)`);
    console.log(`          Review: cat ${path.join(draftsDir, latest)}`);
  } else {
    console.log('Drafts:   — no pending findings');
  }
} else {
  console.log('Drafts:   — Night Watch not initialized');
}

// ─── 2.7 Temp session review ──────────────────────────────────────────────
const tempSessionsDir = path.join(projectDir, 'sessions', 'temp');
if (fs.existsSync(tempSessionsDir)) {
  const { parseFrontmatter } = require('./lib/frontmatter');
  const tempFiles = fs.readdirSync(tempSessionsDir).filter(f => f.endsWith('.md')).sort().reverse();
  if (tempFiles.length > 0) {
    console.log(`Sessions: ${tempFiles.length} temp session(s) pending review`);
    for (const tf of tempFiles.slice(0, 5)) {
      const content = fs.readFileSync(path.join(tempSessionsDir, tf), 'utf8');
      const fm = parseFrontmatter(content);
      const title = fm.title || tf.replace(/\.md$/, '');
      console.log(`          - ${tf}: "${title}"`);
    }
    if (tempFiles.length > 5) console.log(`          ... and ${tempFiles.length - 5} more`);
    console.log(`          Promote: sdk-doc session ${projectDir} promote <filename>`);
    console.log(`          Clean:   sdk-doc session ${projectDir} clean --confirm`);
  } else {
    console.log('Sessions: — no pending sessions');
  }
} else {
  console.log('Sessions: — no sessions directory');
}

// ─── 3. Regenerate context files ──────────────────────────────────────────
const docScript = path.join(__dirname, 'doc.js');
try {
  execSync(`node "${docScript}" manifest "${projectDir}"`, { stdio: 'pipe' });
  console.log('Manifest: ✓ refreshed');
} catch (_) {
  console.log('Manifest: ⚠ generation failed');
}
try {
  execSync(`node "${docScript}" index "${projectDir}"`, { stdio: 'pipe' });
  console.log('Index:    ✓ refreshed');
} catch (_) {
  console.log('Index:    ⚠ generation failed');
}

// ─── 4. Next agent ────────────────────────────────────────────────────────
const nextScript = path.join(__dirname, 'next.js');
let nextRole = 'Coordinator';
try {
  const output = execSync(`node "${nextScript}" "${projectDir}"`, { encoding: 'utf8' });
  console.log('');
  console.log(output.trim());
  // Extract role from output
  const roleMatch = output.match(/\*\*(\w[\w\s]*?)[\s]*[(\*]/);
  if (roleMatch) nextRole = roleMatch[1].trim();
} catch (e) {
  console.log('\nCould not read session state — check current-status.md manually.');
}

// ─── 5. Cockpit for next agent ────────────────────────────────────────────
console.log('');
try {
  const cockpitOutput = execSync(`node "${docScript}" cockpit "${projectDir}" --role "${nextRole}"`, { encoding: 'utf8' });
  console.log('─'.repeat(60));
  console.log(cockpitOutput.trim());
  console.log('─'.repeat(60));
} catch (_) {
  // Cockpit is advisory — if it fails, resume still works
}

console.log('');
console.log('Ready. Paste the activation phrase to resume your session.');
console.log('');
