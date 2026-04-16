#!/usr/bin/env node

/**
 * kill.js — sdk-kill: Kill a pod/mission and log to Kill Log
 *
 * Usage:
 *   sdk-kill <project-dir> <pod-name> --reason "..." --class <kill_class> [--assumption "..."] [--killed-by "..."]
 *
 * Kill classes:
 *   FRAMING_WRONG     — The bet was wrong (compounds in cross-project judgment corpus)
 *   SCOPE_OBSOLETE    — External change made the work irrelevant
 *   PRIORITY_SHIFT    — Higher-priority work displaced this
 *   EXECUTION_STALLED — Pod couldn't execute
 *
 * Writes to:
 *   1. ~/.claude/kill-log.json (cross-project structured store)
 *   2. ~/.claude/kill-log.md   (cross-project human-readable view)
 *   3. <project>/history.md    (per-project record)
 *   4. Sends INFO Bus message to ALL via bus-log.md
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');

const VALID_CLASSES = ['FRAMING_WRONG', 'SCOPE_OBSOLETE', 'PRIORITY_SHIFT', 'EXECUTION_STALLED'];

const args = process.argv.slice(2);

if (args.length < 2 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  sdk-kill <project-dir> <pod-name> --reason "..." --class <kill_class> [--assumption "..."] [--killed-by "..."]

Kill classes:
  FRAMING_WRONG      The bet was wrong (feeds cross-project judgment corpus)
  SCOPE_OBSOLETE     External change made the work irrelevant
  PRIORITY_SHIFT     Higher-priority work displaced this
  EXECUTION_STALLED  Pod couldn't execute

Options:
  --reason       Required. One-sentence rationale.
  --class        Required. One of: ${VALID_CLASSES.join(', ')}
  --assumption   Required when --class is FRAMING_WRONG. The falsifiable claim that was wrong.
  --killed-by    Optional. Defaults to "Owner".

Examples:
  sdk-kill . auth-v2 --reason "Users don't want SSO for MVP" --class FRAMING_WRONG --assumption "Enterprise users need SSO before trying the product"
  sdk-kill . notif-push --reason "Payments corridor took priority" --class PRIORITY_SHIFT
`);
  process.exit(0);
}

// ─── Parse args ─────────────────────────────────────────────────────────────

const projectDir = path.resolve(args[0]);
const podName    = args[1];
const opts       = {};

for (let i = 2; i < args.length; i++) {
  if (args[i].startsWith('--') && args[i + 1]) {
    opts[args[i].slice(2)] = args[++i];
  }
}

const reason     = opts.reason;
const killClass  = opts.class;
const assumption = opts.assumption || '';
const killedBy   = opts['killed-by'] || 'Owner';

// ─── Validate ───────────────────────────────────────────────────────────────

if (!reason) {
  console.error('Error: --reason is required.');
  process.exit(1);
}

if (!killClass || !VALID_CLASSES.includes(killClass)) {
  console.error(`Error: --class is required. Must be one of: ${VALID_CLASSES.join(', ')}`);
  process.exit(1);
}

if (killClass === 'FRAMING_WRONG' && !assumption) {
  console.error('Error: --assumption is required when --class is FRAMING_WRONG.');
  process.exit(1);
}

if (!fs.existsSync(projectDir)) {
  console.error(`Error: Project directory not found: ${projectDir}`);
  process.exit(1);
}

// ─── Read release ID ────────────────────────────────────────────────────────

let release = 'unknown';
const sdkrcPath = path.join(projectDir, '.sdkrc');
if (fs.existsSync(sdkrcPath)) {
  try {
    const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
    if (sdkrc.releaseId) release = sdkrc.releaseId;
  } catch (_) {}
}

// ─── Generate kill entry ────────────────────────────────────────────────────

const now       = new Date();
const dateStr   = now.toISOString().slice(0, 10);
const timestamp = now.toISOString().replace('T', ' ').slice(0, 16);
const projectName = path.basename(projectDir) === '.' ? path.basename(process.cwd()) : path.basename(projectDir);

// ─── Cross-project Kill Log (JSON) ──────────────────────────────────────────

const claudeDir = path.join(os.homedir(), '.claude');
if (!fs.existsSync(claudeDir)) {
  fs.mkdirSync(claudeDir, { recursive: true });
}

const jsonPath = path.join(claudeDir, 'kill-log.json');
let killLog = [];
if (fs.existsSync(jsonPath)) {
  try {
    killLog = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  } catch (_) {
    killLog = [];
  }
}

// Sequential ID: count kills on this date
const todayKills = killLog.filter(k => k.date === dateStr);
const seqId = todayKills.length + 1;
const killId = `KILL-${dateStr}-${seqId}`;

const entry = {
  id:         killId,
  project:    projectName,
  projectDir: projectDir,
  release:    release,
  pod:        podName,
  date:       dateStr,
  timestamp:  now.toISOString(),
  killedBy:   killedBy,
  killClass:  killClass,
  reason:     reason,
  assumption: assumption || null,
};

killLog.push(entry);
fs.writeFileSync(jsonPath, JSON.stringify(killLog, null, 2), 'utf8');

// ─── Cross-project Kill Log (Markdown view) ─────────────────────────────────

const mdPath = path.join(claudeDir, 'kill-log.md');
const mdEntry = `
### ${killId}
Project: ${projectName}
Release: ${release}
Pod: ${podName}
Date: ${dateStr}
Killed by: ${killedBy}
Kill class: ${killClass}
Reason: ${reason}${assumption ? `\nAssumption that failed: ${assumption}` : ''}
`;

if (!fs.existsSync(mdPath)) {
  fs.writeFileSync(mdPath, `# Kill Log\n\n> Cross-project judgment corpus. Append-only. Do not edit.\n> Only FRAMING_WRONG kills feed the judgment read path.\n${mdEntry}`, 'utf8');
} else {
  fs.appendFileSync(mdPath, mdEntry, 'utf8');
}

// ─── Per-project history.md entry ───────────────────────────────────────────

const historyPath = path.join(projectDir, 'history.md');
const historyEntry = `
---

## Pod Kill: ${podName}
**Date:** ${dateStr}
**Release:** ${release}
**Killed by:** ${killedBy}
**Kill class:** ${killClass}
**Reason:** ${reason}${assumption ? `\n**Assumption that failed:** ${assumption}` : ''}
**Coverage:** [To be filled by EM — who absorbs this pod's domain responsibilities]
**Gate impact:** [To be filled — if killed agent held a gate role, state waiver or reassignment]
`;

if (fs.existsSync(historyPath)) {
  fs.appendFileSync(historyPath, historyEntry, 'utf8');
} else {
  console.warn(`Warning: history.md not found in ${projectDir}. Kill logged to cross-project log only.`);
}

// ─── Bus message to ALL ─────────────────────────────────────────────────────

const busLogPath = path.join(projectDir, 'bus-log.md');
const busEntry = `\n---\n[${timestamp}] FROM: ${killedBy} → TO: ALL | PRIORITY: INFO | TAG: POD-KILL | RELEASE: ${release}\nPOD KILLED: ${podName}\nClass: ${killClass}\nReason: ${reason}${assumption ? `\nAssumption: ${assumption}` : ''}\n`;

if (fs.existsSync(busLogPath)) {
  fs.appendFileSync(busLogPath, busEntry, 'utf8');
} else if (fs.existsSync(projectDir)) {
  fs.writeFileSync(busLogPath, `# Bus Log\n\n> Append-only record of all inter-agent communication. Do not edit — only append.\n${busEntry}`, 'utf8');
}

// ─── Output ─────────────────────────────────────────────────────────────────

const compounds = killClass === 'FRAMING_WRONG';
console.log(`
  POD KILLED: ${podName}
  ──────────────────────────────────────
  ID:         ${killId}
  Class:      ${killClass}${compounds ? ' (feeds judgment corpus)' : ''}
  Reason:     ${reason}${assumption ? `\n  Assumption: ${assumption}` : ''}
  Killed by:  ${killedBy}
  Release:    ${release}

  Logged to:
    ✓ ~/.claude/kill-log.json (cross-project)
    ✓ ~/.claude/kill-log.md   (human-readable)${fs.existsSync(historyPath) ? '\n    ✓ history.md             (per-project)' : ''}
    ✓ bus-log.md              (Bus message)

  Next: EM to fill Coverage and Gate impact in history.md
`);
