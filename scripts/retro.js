#!/usr/bin/env node

/**
 * retro.js — sdk-retro: prompted retrospective writer
 *
 * Prompts for retrospective inputs and writes a structured entry to strategy-log.md.
 * Two modes:
 *   Interactive: prompts step-by-step in the terminal
 *   Flag mode:   all inputs via CLI flags (good for scripting/agent use)
 *
 * Usage:
 *   sdk-retro <project-dir>                              # interactive prompts
 *   sdk-retro <project-dir> --release v2026.Q2.1 \
 *     --what-worked "..." --what-slowed "..." \
 *     --change "..." [--note "..."]                      # flag mode
 *
 * Writes to: <project-dir>/strategy-log.md
 */

'use strict';

const fs       = require('fs');
const path     = require('path');
const readline = require('readline');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function readArg(args, flag) {
  const idx = args.indexOf(flag);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

function currentDate() {
  return new Date().toISOString().slice(0, 10);
}

function buildEntry({ release, whatWorked, whatSlowed, change, note }) {
  const lines = [
    ``,
    `## Retrospective — ${release}`,
    `Date: ${currentDate()}`,
    ``,
    `### What worked`,
    whatWorked,
    ``,
    `### What slowed us down`,
    whatSlowed,
    ``,
    `### One thing to change next cycle`,
    change,
  ];
  if (note && note.trim()) {
    lines.push(``, `### Additional notes`, note);
  }
  lines.push(``);
  return lines.join('\n');
}

function appendToStrategyLog(projectDir, entry) {
  const logFile = path.join(projectDir, 'strategy-log.md');
  if (!fs.existsSync(logFile)) {
    fs.writeFileSync(logFile,
      `# Strategy Log\n**Project:** ${path.basename(projectDir)}\n\n---\n${entry}`,
      'utf8'
    );
    return true;
  }
  fs.appendFileSync(logFile, entry, 'utf8');
  return true;
}

function readCurrentRelease(projectDir) {
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  if (fs.existsSync(sdkrcPath)) {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (sdkrc.releaseId) return sdkrc.releaseId;
    } catch (_) {}
  }
  const statusFile = path.join(projectDir, 'current-status.md');
  if (fs.existsSync(statusFile)) {
    const m = fs.readFileSync(statusFile, 'utf8').match(/^\*\*Release:\*\*\s*(.+)$/m);
    if (m) return m[1].trim();
  }
  return null;
}

// ─── CLI ─────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  sdk-retro <project-dir>                         # interactive mode
  sdk-retro <project-dir> \\
    --release v2026.Q2.1 \\
    --what-worked "shipped 4 missions on time" \\
    --what-slowed "gate-check took 2 sessions" \\
    --change "write VS tickets before sprint opens" \\
    [--note "optional extra context"]              # flag mode

Appends a structured retrospective entry to strategy-log.md.
`);
  process.exit(0);
}

const projectDir = path.resolve(args[0]);

if (!fs.existsSync(projectDir)) {
  console.error(`Error: project directory not found: ${projectDir}`);
  process.exit(2);
}

// ─── Flag mode ────────────────────────────────────────────────────────────────

const release    = readArg(args, '--release');
const whatWorked = readArg(args, '--what-worked');
const whatSlowed = readArg(args, '--what-slowed');
const change     = readArg(args, '--change');
const note       = readArg(args, '--note');

const flagMode = release && whatWorked && whatSlowed && change;

if (flagMode) {
  const entry = buildEntry({ release, whatWorked, whatSlowed, change, note });
  appendToStrategyLog(projectDir, entry);
  console.log(`Retrospective appended to strategy-log.md`);
  console.log(`  Release: ${release}`);
  process.exit(0);
}

// ─── Interactive mode ─────────────────────────────────────────────────────────

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

function ask(prompt) {
  return new Promise(resolve => {
    rl.question(prompt, answer => resolve(answer.trim()));
  });
}

async function runInteractive() {
  console.log('\nsdk-retro — sprint retrospective\n');

  const suggestedRelease = readCurrentRelease(projectDir);
  const releasePrompt = suggestedRelease
    ? `Release ID [${suggestedRelease}]: `
    : `Release ID (e.g. v2026.Q2.1): `;

  const releaseInput = await ask(releasePrompt) || suggestedRelease;
  if (!releaseInput) {
    console.error('\nRelease ID is required.\n');
    rl.close();
    process.exit(1);
  }

  console.log('\nAnswer each question in one or two sentences. Press Enter to submit.\n');

  const whatWorkedInput = await ask('What worked well this sprint?\n> ');
  if (!whatWorkedInput) { console.error('Required.'); rl.close(); process.exit(1); }

  const whatSlowedInput = await ask('\nWhat slowed us down?\n> ');
  if (!whatSlowedInput) { console.error('Required.'); rl.close(); process.exit(1); }

  const changeInput = await ask('\nOne thing to change next cycle:\n> ');
  if (!changeInput) { console.error('Required.'); rl.close(); process.exit(1); }

  const noteInput = await ask('\nAny additional notes? (Enter to skip)\n> ');

  rl.close();

  const entry = buildEntry({
    release:    releaseInput,
    whatWorked: whatWorkedInput,
    whatSlowed: whatSlowedInput,
    change:     changeInput,
    note:       noteInput || null,
  });

  appendToStrategyLog(projectDir, entry);

  console.log(`\nRetrospective written to strategy-log.md`);
  console.log(`  Release: ${releaseInput}\n`);
}

runInteractive().catch(err => {
  console.error(err.message);
  process.exit(1);
});
