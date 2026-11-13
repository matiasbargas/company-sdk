#!/usr/bin/env node

/**
 * status.js — sdk-status: framing-first project status
 *
 * Redesigned to surface what the Owner needs to challenge, not just where things are.
 * Order: framing assumptions → disagreement queue → kill log → status → next action
 *
 * Target user: Owner who opens a session to challenge framings and kill bad pods.
 * If nothing needs challenging, the session is 30 seconds.
 *
 * Usage:
 *   sdk-status [project-dir]                    # full framing-first view
 *   sdk-status [project-dir] --kills            # current project kills only
 *   sdk-status [project-dir] --cross-project    # FRAMING_WRONG kills across all projects
 *   sdk-status --help
 *
 * Exit codes:
 *   0 — always (informational command)
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { safeReadFile, findSection: ctxFindSection } = require('../packages/context/src');

const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  sdk-status [project-dir]                    # framing-first view
  sdk-status [project-dir] --kills            # project kill log
  sdk-status [project-dir] --cross-project    # FRAMING_WRONG kills across projects

Shows what needs the Owner's judgment right now:
  1. Active framings (the bet each pod is making)
  2. Open challenges and disagreements
  3. Recent kills
  4. Mission status
  5. Next activation phrase

Defaults to current directory if no argument given.
`);
  process.exit(0);
}

const projectDir = path.resolve(args.filter(a => !a.startsWith('--'))[0] || process.cwd());
const statusFile = path.join(projectDir, 'current-status.md');

if (!fs.existsSync(statusFile)) {
  console.error(`\nNo current-status.md found in ${projectDir}`);
  console.error(`Run sdk-init to scaffold a new project, or navigate to a project directory.\n`);
  process.exit(1);
}

const content = fs.readFileSync(statusFile, 'utf8');

// ─── Parsers ─────────────────────────────────────────────────────────────────
// current-status.md is read through scripts/lib/project-state.js (header-aware tables).

const { parseStatus } = require('./lib/project-state');

// ─── Framing extraction ─────────────────────────────────────────────────────

function parseFramingAssumptions(projectDir) {
  const assumptions = [];

  // Extract from product-requirements.md pre-mortem section 4
  const prodContent = safeReadFile(projectDir, 'product-requirements.md');
  if (prodContent) {

    // Falsifiable assumption from pre-mortem
    const sec4Match = prodContent.match(/### 4\.\s+The assumption[\s\S]*?\n\n(.+)/i);
    if (sec4Match && !sec4Match[1].startsWith('[')) {
      assumptions.push({ source: 'Pre-mortem', assumption: sec4Match[1].trim() });
    }

    // Non-goals (first 2)
    const nonGoalMatch = prodContent.match(/## Explicit Non-Goals\s*\n([\s\S]*?)(?:\n---|\n## )/);
    if (nonGoalMatch) {
      const items = nonGoalMatch[1].split('\n')
        .filter(l => l.startsWith('- ') && !l.includes('['))
        .slice(0, 2)
        .map(l => l.replace(/^- /, '').trim());
      for (const item of items) {
        assumptions.push({ source: 'Non-goal', assumption: item });
      }
    }
  }

  // Extract from idea.md section 4 if it has content
  const ideaContent = safeReadFile(projectDir, 'idea.md');
  if (ideaContent) {
    const sec4Match = ideaContent.match(/## 4\.\s+Brief[\s\S]*?\n\n([\s\S]*?)(?:\n## |\s*$)/i);
    if (sec4Match) {
      const brief = sec4Match[1].trim();
      // Skip template placeholders, code blocks, and short entries
      if (brief && !brief.startsWith('[') && !brief.startsWith('```') && brief.length > 20) {
        // Extract first sentence as the bet
        const firstSentence = brief.split(/\.\s/)[0];
        if (firstSentence.length > 10 && firstSentence.length < 200) {
          assumptions.push({ source: 'Brief', assumption: firstSentence.trim() });
        }
      }
    }
  }

  return assumptions;
}

// ─── Disagreement / challenge queue ─────────────────────────────────────────

function parseOpenChallenges(projectDir) {
  const challenges = [];

  // Check bus-log.md for FRAMING-CHALLENGE tags
  const busContent = safeReadFile(projectDir, 'bus-log.md');
  if (busContent) {
    const entries = busContent.split(/\n---\n/).filter(Boolean);

    for (const entry of entries) {
      if (/TAG:\s*FRAMING-CHALLENGE/i.test(entry)) {
        const fromMatch = entry.match(/FROM:\s*(\S+)/);
        const dateMatch = entry.match(/\[(\d{4}-\d{2}-\d{2})/);
        const msgLines = entry.split('\n').filter(l => !l.startsWith('[') && !l.startsWith('#') && !l.startsWith('>') && l.trim());
        const summary = msgLines.slice(1, 3).join(' ').trim().slice(0, 120);

        challenges.push({
          from: fromMatch ? fromMatch[1] : 'Unknown',
          date: dateMatch ? dateMatch[1] : 'Unknown',
          summary: summary || 'Framing challenge (see bus-log.md)',
        });
      }
    }
  }

  // Check history.md for open disagreements (DISAGREE-NNN with Status: OPEN)
  const histContent = safeReadFile(projectDir, 'history.md');
  if (histContent) {
    const disagreeMatches = histContent.match(/### \[DISAGREE-\d+\].*\n[\s\S]*?Status:\s*OPEN/gi);
    if (disagreeMatches) {
      for (const match of disagreeMatches) {
        const topicMatch = match.match(/### \[DISAGREE-\d+\]\s*(.+)/);
        challenges.push({
          from: 'Disagreement',
          date: '',
          summary: topicMatch ? topicMatch[1].trim() : 'Open disagreement',
        });
      }
    }
  }

  return challenges;
}

// ─── Kill log ───────────────────────────────────────────────────────────────

function parseKills(projectDir) {
  const killLogPath = path.join(os.homedir(), '.claude', 'kill-log.json');
  if (!fs.existsSync(killLogPath)) return { kills: [], crossProject: false };

  try {
    const allKills = JSON.parse(fs.readFileSync(killLogPath, 'utf8'));
    const crossProject = args.includes('--cross-project') || args.includes('--kills');

    if (crossProject) {
      return { kills: allKills.filter(k => k.killClass === 'FRAMING_WRONG').slice(-5), crossProject: true };
    }

    const kills = allKills.filter(k => {
      const resolvedProject = path.resolve(k.projectDir || '');
      return resolvedProject === projectDir || k.project === path.basename(projectDir);
    }).slice(-5);

    return { kills, crossProject: false };
  } catch (_) {
    return { kills: [], crossProject: false };
  }
}

// ─── Render ──────────────────────────────────────────────────────────────────

const state    = parseStatus(content);
const release  = state.releaseRaw;
const updated  = state.updated;
const loop     = state.iteration;
// Done missions stay in the file as record; the status view shows only open ones.
const missions = state.missions.filter(m => !/^done$/i.test(m.status));
const waiting  = state.waiting;
const openDec  = state.openDecisions;
const next     = state.nextAgent;
const framings = parseFramingAssumptions(projectDir);
const challenges = parseOpenChallenges(projectDir);
const killData = parseKills(projectDir);

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

// ─── 1. CHALLENGE SURFACE (framing assumptions + open challenges) ────────────

const needsAttention = framings.length > 0 || challenges.length > 0;

if (framings.length > 0) {
  console.log('');
  console.log('  ACTIVE FRAMINGS — challenge or confirm');
  console.log('  ─────────────────────────────────────────');
  for (const f of framings) {
    console.log(`    [${f.source}] ${f.assumption}`);
  }
}

if (challenges.length > 0) {
  console.log('');
  console.log('  OPEN CHALLENGES — needs your judgment');
  console.log('  ─────────────────────────────────────────');
  for (const c of challenges) {
    const dateStr = c.date ? `${c.date}  ` : '';
    console.log(`    ${dateStr}${c.from}: ${c.summary}`);
  }
}

if (!needsAttention) {
  console.log('');
  console.log('  No framings to challenge. No open disagreements.');
}

// ─── 2. KILL LOG ─────────────────────────────────────────────────────────────

const { kills, crossProject } = killData;
if (kills.length > 0) {
  console.log('');
  console.log(crossProject ? '  KILL LOG (FRAMING_WRONG — cross-project)' : '  KILL LOG');
  for (const k of kills) {
    const classLabel = k.killClass === 'FRAMING_WRONG' ? 'FRAMING' : k.killClass.replace('_', ' ');
    const projectLabel = crossProject ? ` [${k.project}]` : '';
    console.log(`    ${k.date}  ${classLabel.padEnd(16)}  ${k.pod}${projectLabel}`);
    console.log(`    ${' '.repeat(10)}${' '.repeat(16)}  ${k.reason}`);
  }
}

// ─── 3. STATUS ───────────────────────────────────────────────────────────────

console.log('');
if (missions.length) {
  console.log(`  MISSIONS (${missions.length})`);
  for (const m of missions) {
    console.log(`  ─────────────────────────────────────────`);
    console.log(`  ${m.name}  [${m.pod || 'no pod'}]`);
    console.log(`  Status: ${m.status}`);
    console.log(`  Next:   ${m.nextAction || (m.dependsOn && m.dependsOn !== '—' ? `after ${m.dependsOn}` : '—')}`);
    if (m.owner && m.owner !== 'n/a') console.log(`  Owner:  ${m.owner}`);
  }
  console.log(`  ─────────────────────────────────────────`);
} else {
  console.log(`  MISSIONS: None active`);
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


// Overdue DECISION BY deadlines (protocol.md §2 timing) — calendar backstop for session-bound agents
const overdue = require('./lib/overdue').findOverdue(projectDir);
if (overdue.length) {
  console.log('');
  console.log(`  OVERDUE (${overdue.length}) — DECISION BY date has passed; escalate one step (§2)`);
  for (const o of overdue) console.log(`    ${o.due}  ${o.file}:${o.line}  ${o.context}`);
}

// ─── 4. NEXT ACTION ─────────────────────────────────────────────────────────

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
