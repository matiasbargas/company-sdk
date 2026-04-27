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
 *   CLO + CISO gate: compliance-requirements.md must show both Done before CTO activates.
 *   Mario gate:      history.md must contain a Mario sign-off entry before Sprint 1 starts.
 */

const fs   = require('fs');
const path = require('path');
const { printNextStub } = require('./lib/next-stub');

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  node scripts/gate-check.js <project-dir>                # CLO + CISO gate (default)
  node scripts/gate-check.js <project-dir> --mario        # Mario gate only
  node scripts/gate-check.js <project-dir> --pre-mortem   # Pre-mortem gate only
  node scripts/gate-check.js <project-dir> --all          # All gates

Gates:
  CLO + CISO    — compliance-requirements.md must show both Done before CTO activates.
  Mario         — history.md must contain a Mario sign-off entry before Sprint 1 starts.
  Neg. Scope    — Explicit Non-Goals section required (checked with discovery + mario gates).
  Pre-mortem    — Pre-mortem section with 3 failure modes, 2 indicators, Owner review.

Gate behavior is controlled by the project type config (team/types/{type}.json).
If .sdkrc is absent or has no type field, defaults to full product-type gate behavior.
`);
  process.exit(0);
}

const projectDir    = path.resolve(args[0]);
const runMario      = args.includes('--mario') || args.includes('--all');
const runPreMortem  = args.includes('--pre-mortem') || args.includes('--all');
const runDiscovery  = (!args.includes('--mario') && !args.includes('--pre-mortem')) || args.includes('--all');
const discoveryFile = path.join(projectDir, 'compliance-requirements.md');
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
  if (runPreMortem && !runDiscovery && !runMario) {
    console.error(`    Sprint 1 cannot start until the pre-mortem gate is cleared.`);
  } else if (runMario && !runDiscovery) {
    console.error(`    Sprint 1 cannot start until this gate is cleared.`);
  } else {
    console.error(`    CTO cannot be activated until this gate is cleared.`);
  }
  console.error(`    Project: ${projectDir}\n`);
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
    errors.push(`compliance-requirements.md not found in ${projectDir}\n    Has this project been bootstrapped? Run: node scripts/init.js <name>\n    To clear: run sdk-init <project-name> to scaffold the project, or create compliance-requirements.md manually.`);
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
        errors.push('CLO (Legal) gate status not found in Gate Status table.\n    To clear: activate CLO — "Camila, we need a regulatory map for [project]. Read compliance-requirements.md."');
      } else if (legalStatus.toLowerCase() !== 'done') {
        errors.push(`CLO (Legal) gate is "${legalStatus}" — must be "Done" before CTO activates.\n    To clear: activate CLO — "Camila, we need a regulatory map for [project]. Read compliance-requirements.md."`);
      }
      if (!hasJurisdictions) {
        errors.push('No jurisdictions declared in compliance-requirements.md.\n    Add a "## Jurisdictions" section listing: incorporation, employee locations, user locations, data processing locations, money handling locations.\n    To clear: add a "## Jurisdictions" section to compliance-requirements.md listing incorporation location, user locations, and data handling locations.');
      }
      if (hasPendingLegal) warnings.push('CLO section still has pending items. Confirm all are intentionally deferred before marking Done.');
    }

    if (gateRunCiso) {
      if (!secStatus) {
        errors.push('CISO (Security) gate status not found in Gate Status table.\n    To clear: activate CISO — "CISO, run a threat model for [project]. Read compliance-requirements.md."');
      } else if (secStatus.toLowerCase() !== 'done') {
        errors.push(`CISO (Security) gate is "${secStatus}" — must be "Done" before CTO activates.\n    To clear: activate CISO — "CISO, run a threat model for [project]. Read compliance-requirements.md."`);
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

// ─── Negative Scope Gate ─────────────────────────────────────────────────────
// Checks for Explicit Non-Goals section with at least 2 top-level items.
// Applied to compliance-requirements.md (pre-CTO) and product/engineering-requirements.md (pre-Sprint1).

function checkNegativeScope(filePath, label) {
  if (!fs.existsSync(filePath)) return; // file not present — don't add error for missing file here

  const content = fs.readFileSync(filePath, 'utf8');
  const sectionMatch = content.match(/## Explicit Non-Goals\s*\n([\s\S]*?)(?:\n---|\n## |\s*$)/);

  if (!sectionMatch) {
    errors.push(`Explicit Non-Goals section missing in ${label}.\n    Every gate-crossing artifact must name at least 2 things this project is NOT doing and why.\n    Add a "## Explicit Non-Goals" section with at least 2 items.`);
    return;
  }

  const sectionBody = sectionMatch[1];
  // Count top-level bullet items (lines starting with "- " but not "  - ")
  // Exclude template placeholder lines containing brackets [...]
  const items = sectionBody.split('\n').filter(line => {
    const trimmed = line.trimStart();
    if (!trimmed.startsWith('- ')) return false;
    if (line.startsWith('  ')) return false; // sub-bullet
    if (/^\s*- \[/.test(line) && /\]$/.test(trimmed)) return false; // template placeholder
    return true;
  });

  if (items.length < 2) {
    errors.push(`Explicit Non-Goals section in ${label} has ${items.length} item(s) — minimum 2 required.\n    Each item must name what is excluded AND why. Template placeholders don't count.`);
  }
}

if (runDiscovery) {
  checkNegativeScope(discoveryFile, 'compliance-requirements.md');
}

if (runMario) {
  const productFile = path.join(projectDir, 'product-requirements.md');
  const engineeringFile = path.join(projectDir, 'engineering-requirements.md');
  checkNegativeScope(productFile, 'product-requirements.md');
  checkNegativeScope(engineeringFile, 'engineering-requirements.md');
}

// ─── Pre-Mortem Gate ─────────────────────────────────────────────────────────
// Checks for Pre-Mortem section in product-requirements.md or mission brief.
// Required before Sprint 1 (Phase 2.5).

if (runPreMortem) {
  const productFile = path.join(projectDir, 'product-requirements.md');
  let preMortemFound = false;
  let preMortemContent = '';

  // Search product-requirements.md first, then any file with pre-mortem
  const filesToCheck = [productFile];
  // Also check for standalone pre-mortem files
  const preMortemFile = path.join(projectDir, 'pre-mortem.md');
  if (fs.existsSync(preMortemFile)) filesToCheck.unshift(preMortemFile);

  for (const f of filesToCheck) {
    if (!fs.existsSync(f)) continue;
    const content = fs.readFileSync(f, 'utf8');
    const match = content.match(/## Pre-Mortem\s*\n([\s\S]*?)(?:\n## [^P]|\s*$)/);
    if (match) {
      preMortemFound = true;
      preMortemContent = match[1];
      break;
    }
  }

  if (!preMortemFound) {
    errors.push('Pre-mortem section not found.\n    A Pre-Mortem section is required before Sprint 1 starts.\n    Add a "## Pre-Mortem" section to product-requirements.md or create pre-mortem.md.\n    See specs/wave-1/03-pre-mortem.md for the template.');
  } else {
    // Check structural requirements
    const section1Match = preMortemContent.match(/### 1\.\s+This mission will fail because[\s\S]*?(?=### 2|$)/i);
    const section2Match = preMortemContent.match(/### 2\.\s+We will know we are failing[\s\S]*?(?=### 3|$)/i);
    const section3Match = preMortemContent.match(/### 3\.\s+Non-goals[\s\S]*?(?=### 4|$)/i);
    const section4Match = preMortemContent.match(/### 4\.\s+The assumption[\s\S]*?(?=### |$)/i);

    // Count numbered items in each section
    const countItems = (text) => {
      if (!text) return 0;
      return (text.match(/^\d+\.\s+/gm) || []).length;
    };

    const failureModes = section1Match ? countItems(section1Match[0]) : 0;
    const indicators   = section2Match ? countItems(section2Match[0]) : 0;
    const nonGoalItems = section3Match ? countItems(section3Match[0]) : 0;
    const assumptions  = section4Match ? 1 : 0; // section 4 exists = 1 assumption

    if (failureModes < 3) {
      errors.push(`Pre-mortem Section 1 has ${failureModes} failure mode(s) — minimum 3 required.`);
    }
    if (indicators < 2) {
      errors.push(`Pre-mortem Section 2 has ${indicators} leading indicator(s) — minimum 2 required.`);
    }
    if (nonGoalItems < 1) {
      errors.push('Pre-mortem Section 3 (Non-goals drift) has no items — minimum 1 required.');
    }
    if (!section4Match) {
      errors.push('Pre-mortem Section 4 (falsifiable assumption) is missing.');
    }

    // Check participants
    const participantsMatch = preMortemContent.match(/\*\*Participants:\*\*\s*(.+)/i);
    if (!participantsMatch) {
      errors.push('Pre-mortem Participants field is missing. At least 2 participants from distinct domains required.');
    } else {
      const participants = participantsMatch[1].split(/[,·]/).map(p => p.trim()).filter(Boolean);
      if (participants.length < 2) {
        errors.push(`Pre-mortem has ${participants.length} participant(s) — minimum 2 from distinct domains required.`);
      }
    }

    // Check Owner review checkbox
    const ownerReviewed = /- \[x\]\s*Owner reviewed pre-mortem/i.test(preMortemContent);
    if (!ownerReviewed) {
      errors.push('Owner has not reviewed the pre-mortem.\n    Check the "Owner reviewed pre-mortem" checkbox after review: - [x] Owner reviewed pre-mortem');
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

const negativeScopePassed = '✓  Negative Scope: Explicit Non-Goals present';

let preMortemPassed;
if (!runPreMortem) {
  preMortemPassed = '—  Pre-mortem gate (not checked)';
} else {
  preMortemPassed = '✓  Pre-mortem: Reviewed by Owner';
}

console.log(`
✅  GATE CLEARED

    ${discoveryPassed}
    ${marioPassed}
    ${negativeScopePassed}
    ${preMortemPassed}

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
