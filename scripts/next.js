#!/usr/bin/env node

'use strict';

const fs = require('fs');
const path = require('path');

// --- helpers ---

function die(msg) {
  process.stderr.write(msg + '\n');
  process.exit(1);
}

function extractProjectName(content) {
  const match = content.match(/^#\s+(.+)$/m);
  if (!match) return path.basename(projectDir);
  // strip trailing suffixes like " -- sdk-v3" or " - sdk-v3"
  return match[1].replace(/\s+[-–—]+\s+\S.*$/, '').trim();
}

function extractActiveMissions(content) {
  // Find the Active Missions table
  const tableMatch = content.match(/##\s+Active Missions[\s\S]*?\n((?:\|.+\n)+)/);
  if (!tableMatch) return [];

  const rows = tableMatch[1]
    .split('\n')
    .filter(line => line.startsWith('|'))
    .slice(1); // skip header separator row

  const missions = [];
  for (const row of rows) {
    const cells = row.split('|').map(c => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    // skip divider rows (---|---|...)
    if (/^[-:]+$/.test(cells[0])) continue;
    if (cells[0]) missions.push(cells[0]);
  }
  return missions;
}

function extractWaitingOn(content) {
  const sectionMatch = content.match(/##\s+Waiting On\s*\n([\s\S]*?)(?:\n##|\n---|\s*$)/);
  if (!sectionMatch) return null;

  const lines = sectionMatch[1].split('\n');
  for (const line of lines) {
    const m = line.match(/^-\s+\[\s*\]\s+(.+)/);
    if (m) return m[1].split('|')[0].trim(); // strip trailing "| From: ..." notes
  }
  return null;
}

function extractActivationPhrase(content) {
  // Find the "Next Agent To Activate" section heading
  const sectionMatch = content.match(/##\s+Next Agent To Activate\s*\n([\s\S]*?)(?:\n##|\n---|\s*$)/);
  if (!sectionMatch) return null;

  const block = sectionMatch[1];

  // Try: line starting with "Activation phrase:" and grab quoted text
  const phraseMatch = block.match(/^\**Activation phrase:\**\s+"([^"]+)"/m)
    || block.match(/^Activation phrase:\s+"([^"]+)"/m)
    || block.match(/^Activation phrase:\s+(.+)$/m);

  if (phraseMatch) return phraseMatch[1].trim();

  // Fallback: first non-empty, non-bold-role line in the section
  const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
  for (const line of lines) {
    // skip lines that are just role declarations (e.g. "**Lena Tbilisi (EM)** — ...")
    if (/^\*\*[^*]+\*\*/.test(line)) continue;
    if (/^After EM:/.test(line)) continue;
    return line.replace(/^["']|["']$/g, '');
  }

  return null;
}

// --- main ---

const args = process.argv.slice(2);
if (!args.length) {
  die('Usage: sdk-next <project-dir>');
}

const projectDir = path.resolve(args[0]);
const statusFile = path.join(projectDir, 'current-status.md');

if (!fs.existsSync(statusFile)) {
  die(`current-status.md not found in ${projectDir}. Run: sdk-doc status ${projectDir}`);
}

const content = fs.readFileSync(statusFile, 'utf8');

const projectName = extractProjectName(content);
const missions    = extractActiveMissions(content);
const waitingOn   = extractWaitingOn(content);
const phrase      = extractActivationPhrase(content);

const activeStr  = missions.length ? missions.join(', ') : 'None';
const waitingStr = waitingOn || 'Nothing blocked';
const phraseStr  = phrase
  ? phrase
  : 'No handoff phrase found — ask the Coordinator to close the session properly.';

process.stdout.write(
  `Project: ${projectName}\n` +
  `Active: ${activeStr}\n` +
  `Waiting on: ${waitingStr}\n` +
  `\n` +
  `To resume, paste this:\n` +
  `${phraseStr}\n`
);
