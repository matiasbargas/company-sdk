#!/usr/bin/env node

/**
 * status.js — sdk-status: human-readable project status
 *
 * Reads current-status.md and prints a clean summary:
 *   - Active missions and their next actions
 *   - What the team is waiting on
 *   - Open decisions
 *   - Next activation phrase
 *
 * No gate check. No SDK health check. Pure project state.
 * Target user: Maya — opens terminal Monday morning, types one command.
 *
 * Usage:
 *   sdk-status [project-dir]   # defaults to current directory
 *   sdk-status --help
 *
 * Exit codes:
 *   0 — always (informational command)
 */

'use strict';

const fs   = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  sdk-status [project-dir]

Prints current project state from current-status.md in plain English.
No gate check. No file health check. Just where you are and what's next.

Defaults to current directory if no argument given.
`);
  process.exit(0);
}

const projectDir = path.resolve(args[0] || process.cwd());
const statusFile = path.join(projectDir, 'current-status.md');

if (!fs.existsSync(statusFile)) {
  console.error(`\nNo current-status.md found in ${projectDir}`);
  console.error(`Run sdk-init to scaffold a new project, or navigate to a project directory.\n`);
  process.exit(1);
}

const content = fs.readFileSync(statusFile, 'utf8');

// ─── Parsers ─────────────────────────────────────────────────────────────────

function parseRelease(content) {
  const m = content.match(/^\*\*Release:\*\*\s*(.+)$/m)
    || content.match(/^Release:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function parseUpdated(content) {
  const m = content.match(/^\*\*Last updated:\*\*\s*(.+)$/m)
    || content.match(/^Last updated:\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function parseLoopStatus(content) {
  const m = content.match(/\*\*Iteration:\*\*\s*(.+)$/m);
  return m ? m[1].trim() : null;
}

function parseMissions(content) {
  // Find Active Missions table
  const tableMatch = content.match(/##\s+Active Missions\s*\n([\s\S]*?)(?:\n##|\n---)/);
  if (!tableMatch) return [];

  const rows = tableMatch[1]
    .split('\n')
    .filter(l => l.startsWith('|') && !/^\|\s*[-:]+/.test(l)); // skip separator rows

  const missions = [];
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 6) continue;
    if (/^mission$/i.test(cells[0])) continue; // skip header row
    // columns: Mission | Pod | Owner | Appetite | Status | Next action
    missions.push({
      name:       cells[0],
      pod:        cells[1],
      owner:      cells[2],
      appetite:   cells[3],
      status:     cells[4].replace(/\*\*/g, ''),
      nextAction: cells[5],
    });
  }
  return missions;
}

function parseWaiting(content) {
  const m = content.match(/##\s+Waiting On\s*\n([\s\S]*?)(?:\n##|\n---)/);
  if (!m) return [];
  return m[1].split('\n')
    .filter(l => /^- \[/.test(l))
    .map(l => l.replace(/^- \[.\]\s*/, '').trim());
}

function parseOpenDecisions(content) {
  const m = content.match(/##\s+Open Decisions\s*\n([\s\S]*?)(?:\n##|\n---)/);
  if (!m) return null;
  const body = m[1].trim();
  if (!body || body.toLowerCase() === 'none.' || body.toLowerCase() === 'none') return null;
  return body;
}

function parseNextAgent(content) {
  const m = content.match(/##\s+Next Agent To Activate\s*\n([\s\S]*?)(?:\n##|\n---|\s*$)/);
  if (!m) return null;

  const block = m[1];

  // Try table format: | Role | Pod | Reads first |
  const tableRows = block.split('\n').filter(l => l.startsWith('|') && !/^\|\s*[-:]/.test(l));
  let role = null;
  if (tableRows.length >= 2) { // header row + at least one data row
    const cells = tableRows[1].split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length >= 1) role = cells[0];
  }

  // Activation phrase
  const phraseMatch = block.match(/\*\*Activation phrase:\*\*\s*"([^"]+)"/m)
    || block.match(/Activation phrase:\s*"([^"]+)"/m)
    || block.match(/Activation phrase:\s*(.+)$/m);
  const phrase = phraseMatch ? phraseMatch[1].trim() : null;

  return { role, phrase };
}

// ─── Render ───────────────────────────────────────────────────────────────────

const release  = parseRelease(content);
const updated  = parseUpdated(content);
const loop     = parseLoopStatus(content);
const missions = parseMissions(content);
const waiting  = parseWaiting(content);
const openDec  = parseOpenDecisions(content);
const next     = parseNextAgent(content);

const projectName = (() => {
  const m = content.match(/^#\s+(.+)$/m);
  if (!m) return path.basename(projectDir);
  return m[1].replace(/\s+[-–—]+\s+\S.*$/, '').trim();
})();

console.log('');
console.log(`  ${projectName}`);
if (release) console.log(`  Release: ${release}`);
if (updated) console.log(`  Updated: ${updated}`);
if (loop)    console.log(`  Loop:    ${loop}`);
console.log('');

// Active missions
if (missions.length) {
  console.log(`  Active missions (${missions.length})`);
  for (const m of missions) {
    console.log(`  ─────────────────────────────────────────`);
    console.log(`  ${m.name}  [${m.pod}]`);
    console.log(`  Status: ${m.status}`);
    console.log(`  Next:   ${m.nextAction}`);
    if (m.owner && m.owner !== 'n/a') console.log(`  Owner:  ${m.owner}`);
  }
  console.log(`  ─────────────────────────────────────────`);
} else {
  console.log(`  Active missions: None`);
}

// Waiting on
if (waiting.length) {
  console.log('');
  console.log(`  Waiting on:`);
  for (const item of waiting) {
    console.log(`    - ${item}`);
  }
}

// Open decisions
if (openDec) {
  console.log('');
  console.log(`  Open decisions:`);
  openDec.split('\n').filter(Boolean).forEach(l => console.log(`    ${l.trim()}`));
}

// Next agent
console.log('');
if (next && next.phrase) {
  console.log(`  To resume — paste this:`);
  console.log('');
  console.log(`  ${next.phrase}`);
} else {
  console.log(`  No activation phrase found.`);
  console.log(`  Ask the Coordinator to close the session with a handoff phrase.`);
}
console.log('');
