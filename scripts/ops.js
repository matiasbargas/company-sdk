#!/usr/bin/env node

/**
 * ops.js — Operational checks for team-sdk projects
 *
 * Automates the manual friction in the agent protocol: deadline enforcement,
 * gate validation, staleness detection, and BU aggregation assist.
 *
 * Usage:
 *   node scripts/ops.js <project-dir>                    # run all checks
 *   node scripts/ops.js <project-dir> --check <name>     # run one check
 *   node scripts/ops.js <project-dir> --json             # machine-readable output
 *
 * Exit codes:
 *   0 — no issues
 *   1 — issues found
 *
 * Also importable: const { runChecks } = require('./ops');
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const config = require('./daemon-config');
const { safeReadFile, findSection: ctxFindSection, calculateStaleness } = require('../packages/context/src');

// ── Utilities (delegating to @team-sdk/context) ──────────────────────────────

function safeRead(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function fileAgeHours(filePath) {
  const result = calculateStaleness(filePath);
  return result ? result.ageHours : -1;
}

function findSection(content, heading) {
  if (!content) return '';
  const result = ctxFindSection(content, heading);
  if (!result) return '';
  // Return content without the heading line itself
  const lines = result.content.split('\n');
  return lines.slice(1).join('\n').trim();
}

function parseChecklistItems(sectionContent) {
  const items = [];
  for (const line of sectionContent.split('\n')) {
    const m = line.match(/^-\s+\[(.)\]\s+(.*)/);
    if (m) items.push({ checked: m[1] === 'x', text: m[2].trim() });
  }
  return items;
}

function parseDate(text) {
  const m = text.match(/(\d{4}-\d{2}-\d{2})/);
  return m ? new Date(m[1]) : null;
}

function hoursSince(date) {
  if (!date) return Infinity;
  return (Date.now() - date.getTime()) / (1000 * 60 * 60);
}

// ── Check registry ──────────────────────────────────────────────────────────

const CHECKS = {};

function registerCheck(name, fn) { CHECKS[name] = fn; }

// ── Temporal checks ─────────────────────────────────────────────────────────

registerCheck('decision-deadlines', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'current-status.md'));
  const section = findSection(content, 'Open Decisions');
  if (!section || section === 'None.' || section === 'None') {
    notices.push('No open decisions.');
    return { name: 'decision-deadlines', status: 'pass', issues, notices };
  }
  for (const line of section.split('\n')) {
    const dateMatch = parseDate(line);
    if (dateMatch && dateMatch < new Date()) {
      issues.push(`Past-due decision: ${line.trim()}`);
    }
  }
  return { name: 'decision-deadlines', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('waiting-on-age', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'current-status.md'));
  const section = findSection(content, 'Waiting On');
  if (!section) { notices.push('No Waiting On section.'); return { name: 'waiting-on-age', status: 'pass', issues, notices }; }
  const items = parseChecklistItems(section);
  for (const item of items) {
    if (item.checked) continue;
    const d = parseDate(item.text);
    if (d && hoursSince(d) > config.thresholds.waitingOnDefault) {
      issues.push(`Waiting On item stale (${Math.round(hoursSince(d))}h): ${item.text}`);
    }
  }
  return { name: 'waiting-on-age', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('blocker-age', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'current-status.md'));
  if (!content) return { name: 'blocker-age', status: 'pass', issues: [], notices: ['current-status.md missing'] };
  const lines = content.split('\n');
  for (const line of lines) {
    if (/BLOCKER/i.test(line) && !/PRIORITY.*BLOCKER/.test(line)) {
      const d = parseDate(line);
      if (d && hoursSince(d) > config.thresholds.blockerUnresolved) {
        issues.push(`BLOCKER unresolved > ${config.thresholds.blockerUnresolved}h: ${line.trim()}`);
      }
    }
  }
  return { name: 'blocker-age', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('decision-needed-age', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'current-status.md'));
  const section = findSection(content, 'Open Decisions');
  if (!section || section === 'None.' || section === 'None') {
    return { name: 'decision-needed-age', status: 'pass', issues, notices };
  }
  for (const line of section.split('\n')) {
    if (/DECISION NEEDED/i.test(line)) {
      const d = parseDate(line);
      if (d && hoursSince(d) > config.thresholds.decisionNeeded) {
        issues.push(`DECISION NEEDED unresolved > ${config.thresholds.decisionNeeded}h: ${line.trim()}`);
      }
    }
  }
  return { name: 'decision-needed-age', status: issues.length ? 'fail' : 'pass', issues, notices };
});

// ── Gate checks ─────────────────────────────────────────────────────────────

registerCheck('clo-ciso-gate', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'discovery-requirements.md'));
  if (!content) { notices.push('discovery-requirements.md not found.'); return { name: 'clo-ciso-gate', status: 'pass', issues, notices }; }
  const cloMatch = content.match(/CLO.*?:\s*(Done|Pending|In Progress|Blocked)/i);
  const cisoMatch = content.match(/CISO.*?:\s*(Done|Pending|In Progress|Blocked)/i);
  const cloDone = cloMatch && /done/i.test(cloMatch[1]);
  const cisoDone = cisoMatch && /done/i.test(cisoMatch[1]);
  if (!cloDone) issues.push('CLO gate not Done — CTO cannot activate');
  if (!cisoDone) issues.push('CISO gate not Done — CTO cannot activate');
  if (cloDone && cisoDone) notices.push('CLO + CISO gate: CLEAR');
  return { name: 'clo-ciso-gate', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('sprint0-gate', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'project.md'));
  if (!content) { notices.push('project.md not found.'); return { name: 'sprint0-gate', status: 'pass', issues, notices }; }
  const section = findSection(content, 'Sprint 0 Gate');
  if (!section) { notices.push('No Sprint 0 Gate section.'); return { name: 'sprint0-gate', status: 'pass', issues, notices }; }
  const items = parseChecklistItems(section);
  const unchecked = items.filter(i => !i.checked);
  if (unchecked.length > 0) {
    issues.push(`Sprint 0 gate: ${unchecked.length}/${items.length} items unchecked`);
    for (const i of unchecked) issues.push(`  - [ ] ${i.text}`);
  } else {
    notices.push(`Sprint 0 gate: ${items.length}/${items.length} items checked — CLEAR`);
  }
  return { name: 'sprint0-gate', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('mario-review-gate', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'history.md'));
  if (!content) { notices.push('history.md not found.'); return { name: 'mario-review-gate', status: 'pass', issues, notices }; }
  const hasMarioReview = /Mario|Chief Engineer/i.test(content) && /review|sign-off|approved/i.test(content);
  if (!hasMarioReview) {
    const engReqs = safeRead(path.join(projectDir, 'engineering-requirements.md'));
    if (engReqs && /irreversible/i.test(engReqs)) {
      issues.push('Irreversible decisions found in engineering-requirements.md but no Mario sign-off in history.md');
    } else {
      notices.push('No irreversible decisions requiring Mario review detected.');
    }
  } else {
    notices.push('Mario review: found sign-off in history.md');
  }
  return { name: 'mario-review-gate', status: issues.length ? 'fail' : 'pass', issues, notices };
});

// ── Session checks ──────────────────────────────────────────────────────────

registerCheck('session-close-validation', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'current-status.md'));
  if (!content) { issues.push('current-status.md missing'); return { name: 'session-close-validation', status: 'fail', issues, notices }; }

  const required = ['Active Missions', 'Waiting On', 'Completed', 'Open Decisions', 'Next Agent To Activate'];
  for (const section of required) {
    if (!findSection(content, section)) {
      issues.push(`Missing required section: ${section}`);
    }
  }
  if (!/\*\*Last updated:\*\*/i.test(content)) issues.push('Missing "Last updated" field');
  if (!/\*\*Updated by:\*\*/i.test(content)) issues.push('Missing "Updated by" field');
  if (issues.length === 0) notices.push('Session close checklist: all sections present');
  return { name: 'session-close-validation', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('ceo-validation-pending', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'project-map.md'));
  if (!content) { notices.push('project-map.md not found.'); return { name: 'ceo-validation-pending', status: 'pass', issues, notices }; }
  if (/Section 11.*validated|CEO.*validated|validated.*CEO/i.test(content)) {
    notices.push('CEO project-map validation: found');
  } else {
    const age = fileAgeHours(path.join(projectDir, 'project-map.md'));
    if (age > config.thresholds.ceoValidationPending) {
      issues.push(`project-map.md not validated by CEO and ${Math.round(age)}h old (threshold: ${config.thresholds.ceoValidationPending}h)`);
    }
  }
  return { name: 'ceo-validation-pending', status: issues.length ? 'fail' : 'pass', issues, notices };
});

// ── Staleness checks ────────────────────────────────────────────────────────

registerCheck('current-status-staleness', (projectDir) => {
  const issues = [], notices = [];
  const fp = path.join(projectDir, 'current-status.md');
  const age = fileAgeHours(fp);
  if (age < 0) { issues.push('current-status.md missing'); }
  else if (age > config.thresholds.currentStatusStale) {
    issues.push(`current-status.md is ${Math.round(age)}h old (threshold: ${config.thresholds.currentStatusStale}h)`);
  } else {
    notices.push(`current-status.md: fresh (${Math.round(age)}h old)`);
  }
  return { name: 'current-status-staleness', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('requirements-staleness', (projectDir) => {
  const issues = [], notices = [];
  const reqFiles = [
    'general-requirements.md', 'discovery-requirements.md', 'security-requirements.md',
    'engineering-requirements.md', 'product-requirements.md', 'design-requirements.md',
    'business-requirements.md', 'research-requirements.md',
  ];
  for (const f of reqFiles) {
    const age = fileAgeHours(path.join(projectDir, f));
    if (age < 0) continue; // file doesn't exist, skip
    if (age > config.thresholds.requirementsStale) {
      issues.push(`${f} is ${Math.round(age)}h old (>${config.thresholds.requirementsStale}h)`);
    }
  }
  if (issues.length === 0) notices.push('All requirements files within freshness threshold');
  return { name: 'requirements-staleness', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('research-backlog-aging', (projectDir) => {
  const issues = [], notices = [];
  const content = safeRead(path.join(projectDir, 'research-requirements.md'));
  if (!content) { notices.push('research-requirements.md not found.'); return { name: 'research-backlog-aging', status: 'pass', issues, notices }; }
  const pending = findSection(content, 'Pending');
  if (!pending) { notices.push('No Pending section in research backlog.'); return { name: 'research-backlog-aging', status: 'pass', issues, notices }; }
  const items = parseChecklistItems(pending);
  const old = items.filter(i => {
    const d = parseDate(i.text);
    return d && hoursSince(d) > config.thresholds.researchBacklogAging;
  });
  if (old.length > 0) {
    issues.push(`${old.length} research request(s) pending > ${config.thresholds.researchBacklogAging}h`);
    for (const i of old) issues.push(`  - ${i.text}`);
  } else {
    notices.push(`Research backlog: ${items.filter(i => !i.checked).length} pending, none stale`);
  }
  return { name: 'research-backlog-aging', status: issues.length ? 'fail' : 'pass', issues, notices };
});

registerCheck('research-blocking-decisions', (projectDir) => {
  const issues = [], notices = [];
  const status = safeRead(path.join(projectDir, 'current-status.md'));
  const research = safeRead(path.join(projectDir, 'research-requirements.md'));
  if (!status || !research) return { name: 'research-blocking-decisions', status: 'pass', issues, notices: ['Files missing, skipped.'] };
  const openDecisions = findSection(status, 'Open Decisions');
  const inProgress = findSection(research, 'In Progress');
  if (openDecisions && inProgress) {
    const pendingStudies = parseChecklistItems(inProgress).filter(i => !i.checked);
    for (const study of pendingStudies) {
      for (const line of openDecisions.split('\n')) {
        if (line.toLowerCase().includes('research') || line.toLowerCase().includes('study')) {
          issues.push(`Decision may be blocked by in-progress study: ${study.text}`);
        }
      }
    }
  }
  if (issues.length === 0) notices.push('No studies blocking open decisions');
  return { name: 'research-blocking-decisions', status: issues.length ? 'fail' : 'pass', issues, notices };
});

// ── BU Assist ───────────────────────────────────────────────────────────────

registerCheck('bu-aggregation-assist', (projectDir) => {
  const issues = [], notices = [];
  const buMap = {
    'Engineering':       { reqs: 'engineering-requirements.md', log: 'engineering-log.md' },
    'Product':           { reqs: 'product-requirements.md',     log: 'product-log.md' },
    'Legal & Security':  { reqs: 'discovery-requirements.md',   log: 'operations-log.md' },
    'Finance & Revenue': { reqs: 'business-requirements.md',    log: 'operations-log.md' },
    'Research':          { reqs: 'research-requirements.md',    log: 'research-log.md' },
  };
  for (const [bu, files] of Object.entries(buMap)) {
    const reqs = safeRead(path.join(projectDir, files.reqs));
    if (!reqs) continue;
    const pending = (reqs.match(/- \[ \]/g) || []).length;
    const done = (reqs.match(/- \[x\]/g) || []).length;
    const inProg = (reqs.match(/- \[>\]/g) || []).length;
    const blocked = (reqs.match(/- \[!\]/g) || []).length;
    notices.push(`BU ${bu}: ${pending} pending, ${inProg} in-progress, ${done} done, ${blocked} blocked (${files.reqs})`);
  }
  return { name: 'bu-aggregation-assist', status: 'pass', issues, notices };
});

// ── Runner ──────────────────────────────────────────────────────────────────

function runChecks(projectDir, options = {}) {
  const checkNames = options.checks || Object.keys(CHECKS);
  const results = [];
  for (const name of checkNames) {
    if (!CHECKS[name]) { results.push({ name, status: 'error', issues: [`Unknown check: ${name}`], notices: [] }); continue; }
    results.push(CHECKS[name](projectDir));
  }
  const allIssues = results.flatMap(r => r.issues);
  const allNotices = results.flatMap(r => r.notices);
  return { results, issues: allIssues, notices: allNotices };
}

// ── CLI ─────────────────────────────────────────────────────────────────────

if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    console.log(`
Usage:
  node scripts/ops.js <project-dir>                  # run all checks
  node scripts/ops.js <project-dir> --check <name>   # run one check
  node scripts/ops.js <project-dir> --json            # JSON output
  node scripts/ops.js <project-dir> --list            # list available checks

Available checks: ${Object.keys(CHECKS).join(', ')}
`);
    process.exit(0);
  }

  const projectDir = path.resolve(args[0]);
  const jsonMode = args.includes('--json');
  const listMode = args.includes('--list');

  if (listMode) {
    for (const name of Object.keys(CHECKS)) console.log(`  ${name}`);
    process.exit(0);
  }

  const checkIdx = args.indexOf('--check');
  const checkFilter = checkIdx >= 0 ? [args[checkIdx + 1]] : undefined;
  const { results, issues, notices } = runChecks(projectDir, { checks: checkFilter });

  if (jsonMode) {
    console.log(JSON.stringify({ results, issues, notices }, null, 2));
  } else {
    console.log(`\n  sdk-ops — ${results.length} checks on ${path.basename(projectDir)}/\n`);
    for (const r of results) {
      const icon = r.status === 'pass' ? '✓' : r.status === 'fail' ? '✗' : '?';
      console.log(`  ${icon} ${r.name}`);
      for (const i of r.issues) console.log(`    ⚠ ${i}`);
      for (const n of r.notices) console.log(`    · ${n}`);
    }
    const failCount = results.filter(r => r.status === 'fail').length;
    console.log(`\n  ${failCount === 0 ? '✓ All checks passed' : `✗ ${failCount} check(s) with issues`} (${issues.length} issues, ${notices.length} notices)\n`);
  }

  process.exit(issues.length > 0 ? 1 : 0);
}

module.exports = { runChecks, CHECKS };
