#!/usr/bin/env node

/**
 * daemon.js — Night Watch: autonomous agent scheduler for team-sdk
 *
 * Manages agent state, dispatches analysis loops, writes findings to
 * agent-drafts/ for human review. Designed to run inside a Claude Code
 * session using CronCreate for scheduling.
 *
 * Modes:
 *   --init              Initialize state + print CronCreate instructions
 *   --run <role>        Execute one agent loop (invoked by CronCreate)
 *   --status            Print current agent states and recent events
 *
 * Usage:
 *   node scripts/daemon.js <project-dir> --init
 *   node scripts/daemon.js <project-dir> --run coordinator
 *   node scripts/daemon.js <project-dir> --status
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const config = require('./daemon-config');
const { runChecks } = require('./ops');

// ── Args ────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const projectArg = args.find(a => !a.startsWith('--'));

if (!projectArg || args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  node scripts/daemon.js <project-dir> --init         # initialize + print cron instructions
  node scripts/daemon.js <project-dir> --run <role>    # execute one agent loop
  node scripts/daemon.js <project-dir> --status        # print agent states + recent events

Agents: ${Object.keys(config.agents).join(', ')}
`);
  process.exit(0);
}

const projectDir = path.resolve(projectArg);
const statePath  = path.join(projectDir, config.paths.agentState);
const eventsPath = path.join(projectDir, config.paths.agentEvents);
const draftsDir  = path.join(projectDir, config.paths.agentDrafts);

// ── State helpers ───────────────────────────────────────────────────────────

function loadState() {
  if (!fs.existsSync(statePath)) return null;
  try { return JSON.parse(fs.readFileSync(statePath, 'utf8')); }
  catch { return null; }
}

function saveState(state) {
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
}

function appendEvent(event) {
  fs.appendFileSync(eventsPath, JSON.stringify(event) + '\n');
}

function initState() {
  const state = { schemaVersion: '1.0' };
  for (const role of Object.keys(config.agents)) {
    state[role] = {
      status: 'idle',
      lastRun: null,
      startedAt: null,
      inbox: [],
      lastMtimes: {},
    };
  }
  return state;
}

function recoverStuckAgents(state) {
  const recovered = [];
  for (const [role, agentState] of Object.entries(state)) {
    if (role === 'schemaVersion') continue;
    if (agentState.status === 'working' && agentState.startedAt) {
      const elapsed = Date.now() - new Date(agentState.startedAt).getTime();
      if (elapsed > config.recovery.stuckTimeout) {
        agentState.status = 'idle';
        agentState.startedAt = null;
        recovered.push(role);
        appendEvent({
          ts: new Date().toISOString(),
          role,
          event: 'recovery',
          reason: 'stuck-timeout',
        });
      }
    }
  }
  return recovered;
}

// ── Mode: --init ────────────────────────────────────────────────────────────

function modeInit() {
  let state = loadState();
  if (!state) {
    state = initState();
    console.log('  Created agent-state.json');
  } else {
    const recovered = recoverStuckAgents(state);
    if (recovered.length) console.log(`  Recovered stuck agents: ${recovered.join(', ')}`);
  }
  saveState(state);

  // Ensure drafts directory
  if (!fs.existsSync(draftsDir)) {
    fs.mkdirSync(draftsDir, { recursive: true });
    console.log('  Created agent-drafts/');
  }

  console.log(`\n  Night Watch initialized for: ${projectDir}\n`);
  console.log('  Registered schedules:');
  for (const [role, cfg] of Object.entries(config.agents)) {
    console.log(`    ${role.padEnd(14)} ${cfg.cron.padEnd(16)} ${cfg.label}`);
  }
  console.log('\n  CronCreate prompts (paste into Claude Code):');
  for (const [role, cfg] of Object.entries(config.agents)) {
    console.log(`    cron="${cfg.cron}" prompt="Run: node scripts/daemon.js ${path.relative(process.cwd(), projectDir)} --run ${role}"`);
  }
  console.log('\n  Note: Crons are session-scoped and expire after 7 days.\n');
}

// ── Mode: --run <role> ──────────────────────────────────────────────────────

function modeRun(role) {
  if (!config.agents[role]) {
    console.error(`Unknown agent role: ${role}`);
    process.exit(1);
  }

  const agentConfig = config.agents[role];
  let state = loadState();
  if (!state) {
    state = initState();
    appendEvent({ ts: new Date().toISOString(), role, event: 'state-reconstructed' });
  }

  // Recovery sweep
  recoverStuckAgents(state);

  const agentState = state[role];

  // Skip if already working (and not stuck)
  if (agentState.status === 'working') {
    console.log(`  ${role}: already working, skipping`);
    return;
  }

  // Set working
  const runStart = new Date();
  agentState.status = 'working';
  agentState.startedAt = runStart.toISOString();
  saveState(state);

  // Check for changes in watched files
  const changedFiles = [];
  for (const watchFile of agentConfig.watchFiles) {
    const fp = path.join(projectDir, watchFile);
    if (!fs.existsSync(fp)) continue;
    const mtime = fs.statSync(fp).mtime.toISOString();
    const lastMtime = agentState.lastMtimes[watchFile];
    if (mtime !== lastMtime) {
      changedFiles.push(watchFile);
      agentState.lastMtimes[watchFile] = mtime;
    }
  }

  // Skip if no changes and empty inbox
  if (changedFiles.length === 0 && agentState.inbox.length === 0) {
    agentState.status = 'idle';
    agentState.lastRun = runStart.toISOString();
    agentState.startedAt = null;
    saveState(state);
    appendEvent({
      ts: runStart.toISOString(),
      role,
      event: 'skip-no-change',
      duration: Date.now() - runStart.getTime(),
    });
    console.log(`  ${role}: no changes detected, skipping`);
    return;
  }

  // Run domain-scoped checks
  const { results, issues, notices } = runChecks(projectDir, { checks: agentConfig.checks });

  // Write draft
  const today = runStart.toISOString().slice(0, 10);
  const draftFile = path.join(draftsDir, `${role}-${today}.md`);
  const timestamp = runStart.toISOString().slice(0, 19).replace('T', ' ');

  let draftContent = '';
  if (fs.existsSync(draftFile)) {
    draftContent = fs.readFileSync(draftFile, 'utf8') + '\n---\n\n';
  } else {
    draftContent = `---\nrole: ${role}\ndate: ${today}\n---\n\n`;
  }

  draftContent += `# ${agentConfig.label} — ${timestamp}\n\n`;
  draftContent += `**Trigger:** ${changedFiles.length > 0 ? `files changed: ${changedFiles.join(', ')}` : 'inbox'}\n\n`;

  if (issues.length > 0) {
    draftContent += `## Issues Found\n\n`;
    for (const i of issues) draftContent += `- ${i}\n`;
    draftContent += '\n';
  }

  if (notices.length > 0) {
    draftContent += `## Notices\n\n`;
    for (const n of notices) draftContent += `- ${n}\n`;
    draftContent += '\n';
  }

  if (issues.length > 0) {
    draftContent += `## Recommended Actions\n\n`;
    for (const i of issues) draftContent += `- Resolve: ${i}\n`;
    draftContent += '\n';
  }

  if (issues.length === 0 && notices.length === 0) {
    draftContent += `No issues or notices. All checks passed.\n\n`;
  }

  fs.writeFileSync(draftFile, draftContent);

  // Update state
  agentState.status = 'idle';
  agentState.lastRun = runStart.toISOString();
  agentState.startedAt = null;
  agentState.inbox = [];
  saveState(state);

  // Log event
  const duration = Date.now() - runStart.getTime();
  appendEvent({
    ts: runStart.toISOString(),
    role,
    event: 'run-complete',
    duration,
    issuesFound: issues.length,
    noticesFound: notices.length,
    changedFiles,
    draftFile: path.relative(projectDir, draftFile),
  });

  console.log(`  ${role}: ${issues.length} issues, ${notices.length} notices → ${path.relative(process.cwd(), draftFile)} (${duration}ms)`);
}

// ── Mode: --status ──────────────────────────────────────────────────────────

function modeStatus() {
  const state = loadState();
  if (!state) {
    console.log('  Night Watch not initialized. Run: node scripts/daemon.js <project-dir> --init');
    return;
  }

  console.log(`\n  Night Watch — ${projectDir}\n`);
  console.log('  Agent States:');
  for (const [role, agentState] of Object.entries(state)) {
    if (role === 'schemaVersion') continue;
    const lastRun = agentState.lastRun
      ? `last run ${agentState.lastRun.slice(0, 19).replace('T', ' ')}`
      : 'never run';
    console.log(`    ${role.padEnd(14)} ${agentState.status.padEnd(10)} ${lastRun}`);
  }

  // Show last 5 events
  if (fs.existsSync(eventsPath)) {
    const lines = fs.readFileSync(eventsPath, 'utf8').trim().split('\n').filter(Boolean);
    const recent = lines.slice(-5).reverse();
    console.log('\n  Recent Events:');
    for (const line of recent) {
      try {
        const ev = JSON.parse(line);
        const ts = ev.ts ? ev.ts.slice(0, 19).replace('T', ' ') : '?';
        console.log(`    ${ts}  ${ev.role.padEnd(14)} ${ev.event}${ev.issuesFound != null ? ` (${ev.issuesFound} issues)` : ''}`);
      } catch { /* skip malformed */ }
    }
  }

  // Show drafts
  if (fs.existsSync(draftsDir)) {
    const files = fs.readdirSync(draftsDir).filter(f => f.endsWith('.md')).sort().reverse();
    if (files.length > 0) {
      console.log(`\n  Drafts (${files.length} files):`);
      for (const f of files.slice(0, 5)) console.log(`    ${f}`);
      if (files.length > 5) console.log(`    ... and ${files.length - 5} more`);
    }
  }
  console.log();
}

// ── Dispatch ────────────────────────────────────────────────────────────────

if (args.includes('--init')) {
  modeInit();
} else if (args.includes('--run')) {
  const runIdx = args.indexOf('--run');
  const role = args[runIdx + 1];
  if (!role) { console.error('--run requires a role name'); process.exit(1); }
  modeRun(role);
} else if (args.includes('--status')) {
  modeStatus();
} else {
  console.error('Specify --init, --run <role>, or --status');
  process.exit(1);
}
