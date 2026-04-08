#!/usr/bin/env node

/**
 * gate-check.js — Enforce phase gates before CTO activation and Sprint 1
 *
 * Usage:
 *   node scripts/gate-check.js <project-dir>                  # CLO + CISO gate (pre-CTO)
 *   node scripts/gate-check.js <project-dir> --mario          # Mario gate (pre-Sprint 1)
 *   node scripts/gate-check.js <project-dir> --all            # Run all gates
 *
 * Gates:
 *   CLO + CISO gate: discovery-requirements.md must show both Done before CTO activates.
 *   Mario gate:      history.md must contain a Mario sign-off entry before Sprint 1 starts.
 */

const fs   = require('fs');
const path = require('path');
const { printNextStub } = require('./lib/next-stub');

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node scripts/gate-check.js <project-dir>           # CLO + CISO gate (default)
  node scripts/gate-check.js <project-dir> --mario   # Mario gate only
  node scripts/gate-check.js <project-dir> --all     # All gates

Gates:
  CLO + CISO  — discovery-requirements.md must show both Done before CTO activates.
  Mario       — history.md must contain a Mario sign-off entry before Sprint 1 starts.

Gate behavior is controlled by the project type config (team/types/{type}.json).
If .sdkrc is absent or has no type field, defaults to full product-type gate behavior.
`);
  process.exit(0);
}

const projectDir    = path.resolve(args[0]);
const runMario      = args.includes('--mario') || args.includes('--all');
const runDiscovery  = !args.includes('--mario') || args.includes('--all');
const discoveryFile = path.join(projectDir, 'discovery-requirements.md');
const historyFile   = path.join(projectDir, 'history.md');

// ─── Load type config for this project ───────────────────────────────────────

function loadProjectTypeConfig(projectDir) {
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  let typeName = 'product';

  if (fs.existsSync(sdkrcPath)) {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (sdkrc.type) typeName = sdkrc.type;
      if (sdkrc.sdkPath) {
        const typePath = path.join(sdkrc.sdkPath, 'team', 'types', `${typeName}.json`);
        if (fs.existsSync(typePath)) {
          return JSON.parse(fs.readFileSync(typePath, 'utf8'));
        }
      }
    } catch (_) {
      // malformed .sdkrc — fall through to default
    }
  }

  // Fallback: resolve relative to this script's SDK root
  const sdkRoot  = path.resolve(__dirname, '..');
  const typePath = path.join(sdkRoot, 'team', 'types', `${typeName}.json`);
  if (fs.existsSync(typePath)) {
    try { return JSON.parse(fs.readFileSync(typePath, 'utf8')); } catch (_) {}
  }

  // Hard fallback: full product-type gates
  return {
    type:  'product',
    gates: { 'pre-cto': ['clo', 'ciso'], 'pre-sprint1': ['mario'] },
  };
}

const typeConfig    = loadProjectTypeConfig(projectDir);
const preCtoGates   = (typeConfig.gates && typeConfig.gates['pre-cto'])    || [];
const preSprint1Gates = (typeConfig.gates && typeConfig.gates['pre-sprint1']) || [];

const gateRunClo   = preCtoGates.includes('clo');
const gateRunCiso  = preCtoGates.includes('ciso');
const gateRunMario = preSprint1Gates.includes('mario');

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

const errors   = [];
const warnings = [];

// ─── CLO + CISO Discovery Gate ───────────────────────────────────────────────

if (runDiscovery && (gateRunClo || gateRunCiso)) {
  if (!fs.existsSync(discoveryFile)) {
    errors.push(`discovery-requirements.md not found in ${projectDir}\n    Has this project been bootstrapped? Run: node scripts/init.js <name>\n    To clear: run sdk-init <project-name> to scaffold the project, or create discovery-requirements.md manually.`);
  } else {
    const content = fs.readFileSync(discoveryFile, 'utf8');

    const gateTableMatch = content.match(/\|\s*Legal\s*\|\s*CLO\s*\|\s*(\w+)/i);
    const secTableMatch  = content.match(/\|\s*Security\s*\|\s*CISO\s*\|\s*(\w+)/i);
    const legalStatus    = gateTableMatch ? gateTableMatch[1].trim() : null;
    const secStatus      = secTableMatch  ? secTableMatch[1].trim()  : null;

    const hasJurisdictions = /## Jurisdictions/i.test(content) ||
                             /\*\*Jurisdictions declared\*\*/i.test(content) ||
                             /Jurisdiction.*:/i.test(content);

    const legalPending    = (content.match(/## Legal \(CLO\)[\s\S]*?### Pending([\s\S]*?)### In Progress/i) || [])[1] || '';
    const hasPendingLegal = /- \[ \]/.test(legalPending);
    const secPending      = (content.match(/## Security \(CISO\)[\s\S]*?### Pending([\s\S]*?)### In Progress/i) || [])[1] || '';
    const hasPendingSec   = /- \[ \]/.test(secPending);

    if (gateRunClo) {
      if (!legalStatus) {
        errors.push('CLO (Legal) gate status not found in Gate Status table.\n    To clear: activate CLO — "Camila, we need a regulatory map for [project]. Read discovery-requirements.md."');
      } else if (legalStatus.toLowerCase() !== 'done') {
        errors.push(`CLO (Legal) gate is "${legalStatus}" — must be "Done" before CTO activates.\n    To clear: activate CLO — "Camila, we need a regulatory map for [project]. Read discovery-requirements.md."`);
      }
      if (!hasJurisdictions) {
        errors.push('No jurisdictions declared in discovery-requirements.md.\n    Add a "## Jurisdictions" section listing: incorporation, employee locations, user locations, data processing locations, money handling locations.\n    To clear: add a "## Jurisdictions" section to discovery-requirements.md listing incorporation location, user locations, and data handling locations.');
      }
      if (hasPendingLegal) warnings.push('CLO section still has pending items. Confirm all are intentionally deferred before marking Done.');
    }

    if (gateRunCiso) {
      if (!secStatus) {
        errors.push('CISO (Security) gate status not found in Gate Status table.\n    To clear: activate CISO — "CISO, run a threat model for [project]. Read security-requirements.md."');
      } else if (secStatus.toLowerCase() !== 'done') {
        errors.push(`CISO (Security) gate is "${secStatus}" — must be "Done" before CTO activates.\n    To clear: activate CISO — "CISO, run a threat model for [project]. Read security-requirements.md."`);
      }
      if (hasPendingSec) warnings.push('CISO section still has pending items. Confirm all are intentionally deferred before marking Done.');
    }
  }
}

// ─── Mario Gate ──────────────────────────────────────────────────────────────
//
// Looks for a Mario sign-off entry in history.md.
// Expected format (any heading containing "Mario Gate"):
//   ## Mario Gate ...
//   ...
//   Status: COMPLETED
//
// The check fails if no such entry exists or if the status is not COMPLETED.

if (runMario && gateRunMario) {
  if (!fs.existsSync(historyFile)) {
    errors.push(`history.md not found in ${projectDir}\n    Mario sign-off must be logged there before Sprint 1 starts.\n    Run: sdk-doc decision history.md --decision "Mario gate" --context "..." --made-by "Mario"\n    To clear: run sdk-doc decision history.md --decision "Initial" --context "Project start" --made-by Coordinator`);
  } else {
    const history = fs.readFileSync(historyFile, 'utf8');

    // Find any section headed with "Mario Gate" (case-insensitive)
    const marioMatch = history.match(/##\s+Mario Gate[^\n]*([\s\S]*?)(?=\n##\s|\n---|\s*$)/i);

    if (!marioMatch) {
      errors.push(
        'Mario gate sign-off not found in history.md.\n' +
        '    Mario (Chief Engineer) must review irreversible architectural decisions before Sprint 1.\n' +
        '    Activate Mario with: "Hey Mario, review the irreversible decisions in engineering-requirements.md and log sign-off to history.md."\n' +
        '    To clear: activate Mario — "Hey Mario, review the irreversible architectural decisions in engineering-requirements.md and log sign-off to history.md."'
      );
    } else {
      const marioSection = marioMatch[0];
      const statusMatch  = marioSection.match(/\*\*Status:\*\*\s*([^\n]+)/i) ||
                           marioSection.match(/Status:\s*([^\n]+)/i);
      const status       = statusMatch ? statusMatch[1].trim() : null;

      if (!status) {
        warnings.push('Mario Gate entry found in history.md but no Status field detected. Confirm sign-off is complete.');
      } else if (!status.toUpperCase().includes('COMPLETED') && !status.toUpperCase().includes('CLEARED')) {
        errors.push(`Mario gate status is "${status}" — must be COMPLETED before Sprint 1 starts.\n    To clear: Mario must update the gate entry in history.md with Status: COMPLETED.`);
      }
    }
  }
}

// ─── Output ───────────────────────────────────────────────────────────────────

if (errors.length > 0) {
  const lines = errors.map((e, i) => `    ${i + 1}. ${e}`).join('\n\n');
  fail(`Gate not cleared:\n\n${lines}`);
}

for (const w of warnings) {
  warn(w);
}

let discoveryPassed;
if (!runDiscovery) {
  discoveryPassed = '—  Discovery gate (not checked)';
} else if (!gateRunClo && !gateRunCiso) {
  discoveryPassed = '—  CLO + CISO gate (not required for this project type)';
} else {
  const parts = [];
  if (gateRunClo)  parts.push('CLO (Legal)');
  if (gateRunCiso) parts.push('CISO (Security)');
  discoveryPassed = `✓  ${parts.join(' + ')}: Done`;
}

let marioPassed;
if (!runMario) {
  marioPassed = '—  Mario gate (not checked)';
} else if (!gateRunMario) {
  marioPassed = '—  Mario gate (not required for this project type)';
} else {
  marioPassed = '✓  Mario (Chief Engineer) sign-off: Logged';
}

console.log(`
✅  GATE CLEARED

    ${discoveryPassed}
    ${marioPassed}

    Project: ${projectDir}
`);

if (runDiscovery && !runMario) {
  if (gateRunClo || gateRunCiso) {
    console.log(`    CTO can now be activated.
    Architecture decisions will be grounded in the legal and security constraints above.

    Next gate: run with --mario before Sprint 1 starts.\n`);
  } else {
    console.log(`    CTO can now be activated (no pre-CTO gates required for type "${typeConfig.type}").\n`);
  }
}

if (runMario && !runDiscovery) {
  console.log(`    Sprint 1 can now start.\n`);
}

printNextStub(projectDir);
process.exit(0);
