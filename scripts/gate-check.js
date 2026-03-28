#!/usr/bin/env node

/**
 * gate-check.js — Enforce the CLO + CISO discovery gate before CTO activation
 *
 * Usage:
 *   node scripts/gate-check.js <project-dir>
 *
 * Exits 0 if both CLO and CISO sections in discovery-requirements.md are Done.
 * Exits 1 with a clear message if either gate is not cleared.
 *
 * CTO agents and the Coordinator reference this check before activating CTO.
 * It is also safe to run manually at any time.
 */

const fs   = require('fs');
const path = require('path');

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node scripts/gate-check.js <project-dir>

Checks that discovery-requirements.md shows both CLO (Legal) and CISO (Security)
sections as Done before CTO architecture begins.

Run this before activating the CTO agent. CTO cannot produce useful architecture
output without knowing the legal and security constraints. Skipping this gate is
the most expensive mistake in the activation sequence.
`);
  process.exit(0);
}

const projectDir    = path.resolve(args[0]);
const discoveryFile = path.join(projectDir, 'discovery-requirements.md');

// ─── Checks ──────────────────────────────────────────────────────────────────

function fail(message) {
  console.error(`\n🔴  GATE BLOCKED\n`);
  console.error(`    ${message}\n`);
  console.error(`    CTO cannot be activated until this gate is cleared.`);
  console.error(`    File: ${discoveryFile}\n`);
  process.exit(1);
}

function warn(message) {
  console.warn(`\n🟡  WARNING: ${message}`);
}

if (!fs.existsSync(projectDir)) {
  fail(`Project directory not found: ${projectDir}`);
}

if (!fs.existsSync(discoveryFile)) {
  fail(`discovery-requirements.md not found in ${projectDir}\n    Has this project been bootstrapped? Run: node scripts/init.js <name>`);
}

const content = fs.readFileSync(discoveryFile, 'utf8');

// ─── Gate Status table check ─────────────────────────────────────────────────

const gateTableMatch = content.match(/\|\s*Legal\s*\|\s*CLO\s*\|\s*(\w+)/i);
const secTableMatch  = content.match(/\|\s*Security\s*\|\s*CISO\s*\|\s*(\w+)/i);

const legalStatus = gateTableMatch  ? gateTableMatch[1].trim()  : null;
const secStatus   = secTableMatch   ? secTableMatch[1].trim()   : null;

// ─── Jurisdiction check ───────────────────────────────────────────────────────

const hasJurisdictions = /## Jurisdictions/i.test(content) ||
                         /\*\*Jurisdictions declared\*\*/i.test(content) ||
                         /Jurisdiction.*:/i.test(content);

// ─── Pending items check ──────────────────────────────────────────────────────

const legalPending = (content.match(/## Legal \(CLO\)[\s\S]*?### Pending([\s\S]*?)### In Progress/i) || [])[1] || '';
const hasPendingLegal = /- \[ \]/.test(legalPending);

const secPending = (content.match(/## Security \(CISO\)[\s\S]*?### Pending([\s\S]*?)### In Progress/i) || [])[1] || '';
const hasPendingSec = /- \[ \]/.test(secPending);

// ─── Evaluate ────────────────────────────────────────────────────────────────

const errors   = [];
const warnings = [];

if (!legalStatus) {
  errors.push('CLO (Legal) gate status not found in Gate Status table.');
} else if (legalStatus.toLowerCase() !== 'done') {
  errors.push(`CLO (Legal) gate is "${legalStatus}" — must be "Done" before CTO activates.`);
}

if (!secStatus) {
  errors.push('CISO (Security) gate status not found in Gate Status table.');
} else if (secStatus.toLowerCase() !== 'done') {
  errors.push(`CISO (Security) gate is "${secStatus}" — must be "Done" before CTO activates.`);
}

if (hasPendingLegal) {
  warnings.push('CLO section still has pending items. Confirm all are intentionally deferred before marking Done.');
}

if (hasPendingSec) {
  warnings.push('CISO section still has pending items. Confirm all are intentionally deferred before marking Done.');
}

if (!hasJurisdictions) {
  errors.push('No jurisdictions declared in discovery-requirements.md.\n    Jurisdiction declaration is required (GDPR, CCPA, EU AI Act, and other frameworks depend on it).\n    Add a "## Jurisdictions" section listing: incorporation, employee locations, user locations, data processing locations, money handling locations.');
}

// ─── Output ───────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  const lines = errors.map((e, i) => `    ${i + 1}. ${e}`).join('\n');
  fail(`Gate not cleared:\n\n${lines}`);
}

for (const w of warnings) {
  warn(w);
}

console.log(`
✅  GATE CLEARED

    CLO (Legal):    Done
    CISO (Security): Done
    Jurisdictions:   Declared

    CTO can now be activated.
    Architecture decisions will be grounded in the legal and security constraints above.

    Reminder: Mario (Chief Engineer) reviews irreversible architectural decisions
    before Sprint 1 begins. That is the second gate.

    Project: ${projectDir}
`);

process.exit(0);
