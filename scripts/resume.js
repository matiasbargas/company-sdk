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
const { readStatus } = require('./lib/project-state');

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
  // A non-zero exit from gate-check means a gate is blocked. GATE BLOCKED goes to stderr,
  // so read both streams, and never report a failing exit as a green check.
  const output = `${e.stdout || ''}${e.stderr || ''}`;
  const blocked = (output.match(/^\s*\d+\.\s/gm) || []).length;
  if (typeof e.status === 'number' && e.status !== 0) {
    const n = blocked ? ` (${blocked} failure${blocked > 1 ? 's' : ''})` : '';
    console.log(`Gates:    ✗ BLOCKED${n} — run sdk-gate-check ${projectDir} --all for details`);
  } else {
    console.log(`Gates:    ⚠ gate check could not run — run sdk-gate-check ${projectDir} for details`);
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

// ─── 3b. Overdue deadlines (protocol.md §2 timing) ────────────────────────
const overdue = require('./lib/overdue').findOverdue(projectDir);
if (overdue.length) {
  console.log(`Overdue:  ⚠ ${overdue.length} DECISION BY date(s) passed — escalate one step (§2)`);
  for (const o of overdue.slice(0, 5)) console.log(`          - ${o.due}  ${o.file}:${o.line}  ${o.context}`);
} else {
  console.log('Overdue:  ✓ no passed DECISION BY dates');
}

// ─── 4. Next agent ────────────────────────────────────────────────────────
const nextScript = path.join(__dirname, 'next.js');
let nextRole = 'Coordinator';
try {
  const output = execSync(`node "${nextScript}" "${projectDir}"`, { encoding: 'utf8' });
  console.log('');
  console.log(output.trim());
  // Role comes from the shared reader (table or line form), not from next.js's printed output.
  const next = readStatus(projectDir).nextAgent;
  const roleMatch = next && next.role && next.role.replace(/\*\*/g, '').match(/^\s*([A-Za-z][\w\s]*?)\s*(?:\(|—|-|$)/);
  if (roleMatch && roleMatch[1]) nextRole = roleMatch[1].trim();
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
