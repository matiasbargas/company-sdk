#!/usr/bin/env node

/**
 * pre-tag.js — sdk-pre-tag: full team review before a release tag
 *
 * Runs coherence + cohesion + validation checks across all project documents,
 * maps every issue to the responsible agent role, and (optionally) auto-fixes
 * what is deterministically resolvable.
 *
 * Usage:
 *   sdk-pre-tag <project-dir>                     # full review, report only
 *   sdk-pre-tag <project-dir> --fix               # review + auto-fix safe issues
 *   sdk-pre-tag <project-dir> --release-id v2026.Q2.1  # assert release ID
 *   sdk-pre-tag <project-dir> --json              # machine-readable output
 *
 * Exit codes:
 *   0 — clean (all checks pass, or all issues resolved by --fix)
 *   1 — issues remain that require agent action
 *
 * Check categories:
 *   Coherence — cross-document consistency (release IDs, missions, role references)
 *   Cohesion  — intra-document consistency (no contradictions within a file)
 *   Validate  — structural requirements (files present, placeholders filled, sections present)
 *   Health    — project health (staleness, manifest freshness, .sdkrc validity)
 *
 * Auto-fixable:
 *   - Missing required files (created from project-template/ stubs)
 *   - Release ID mismatch across documents (synced to canonical value)
 *   - Empty required sections (stubbed with agent attribution note)
 *
 * Not auto-fixable (requires agent dispatch):
 *   - Unfilled placeholder tokens
 *   - Mission/requirement content gaps
 *   - Stale documents older than threshold
 *   - Coherence breaks requiring judgment
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { validate }  = require('./validate');
const {
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  ALLOWED_EMPTY_SECTIONS,
} = require('./lib/validate-config');

// ─── File → responsible agent owner ──────────────────────────────────────────

const FILE_OWNER = {
  'current-status.md':           'Coordinator',
  'history.md':                  'Coordinator',
  'product-requirements.md':     'PM',
  'engineering-requirements.md': 'CTO',
  'general-requirements.md':     'Coordinator',
  'compliance-requirements.md':   'CLO + CISO',
  'business-requirements.md':    'CFO',
  'design-requirements.md':      'Designer',
  'project-map.md':              'CEO',
  'idea.md':                     'CEO',
  'team.md':                     'Coordinator',
  '.sdkrc':                      'Coordinator',
  '_coherence':                  'Coordinator',
  '_cohesion':                   'Coordinator',
  '_health':                     'Coordinator',
};

function ownerFor(file) {
  return FILE_OWNER[file] || 'Coordinator';
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function readFile(p) {
  try { return fs.readFileSync(p, 'utf8'); } catch (_) { return null; }
}

function readSdkrc(projectDir) {
  const p = path.join(projectDir, '.sdkrc');
  if (!fs.existsSync(p)) return {};
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch (_) { return {}; }
}

function writeSdkrc(projectDir, data) {
  fs.writeFileSync(path.join(projectDir, '.sdkrc'), JSON.stringify(data, null, 2) + '\n', 'utf8');
}

/** Extract `**Release:** vYYYY.QN.N` from current-status.md */
function extractReleaseFromStatus(content) {
  if (!content) return null;
  const m = content.match(/\*\*Release:\*\*\s*(v\d{4}\.Q[1-4]\.\d+)/);
  return m ? m[1] : null;
}

/** Parse sections from markdown (bare heading names, no ## prefix) */
function parseSections(content) {
  const map   = new Map();
  const lines = content.split('\n');
  let current = null;
  let body    = [];
  for (const line of lines) {
    if (/^#{1,3} /.test(line)) {
      if (current !== null) map.set(current, body.join('\n'));
      current = line.replace(/^#+\s*/, '').trim();
      body    = [];
    } else if (current !== null) {
      body.push(line);
    }
  }
  if (current !== null) map.set(current, body.join('\n'));
  return map;
}

/** Extract mission names from current-status.md Active Missions table */
function extractActiveMissions(content) {
  if (!content) return [];
  const sections = parseSections(content);
  const body     = sections.get('Active Missions') || '';
  const missions = [];
  for (const line of body.split('\n')) {
    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
    if (cells.length < 2) continue;
    if (/^mission$/i.test(cells[0])) continue;   // header row
    if (/^[-:]+$/.test(cells[0])) continue;      // separator row
    missions.push(cells[0]);
  }
  return missions;
}

/** Extract all `- [ ]` and `- [x]` items from a requirements file */
function extractRequirementItems(content) {
  if (!content) return [];
  const items = [];
  for (const line of content.split('\n')) {
    const m = line.match(/^- \[[ xX]\] (.+)$/);
    if (m) items.push(m[1].trim());
  }
  return items;
}

/** Read project-template stub for a file, returning null if absent */
function templateStubFor(rel) {
  const scriptDir  = path.join(__dirname, '..', 'project-template');
  const stubPath   = path.join(scriptDir, rel);
  if (fs.existsSync(stubPath)) return fs.readFileSync(stubPath, 'utf8');
  return null;
}

/** Find the canonical release ID: .sdkrc → current-status.md → fallback null */
function canonicalReleaseId(projectDir) {
  const sdkrc    = readSdkrc(projectDir);
  if (sdkrc.releaseId) return sdkrc.releaseId;
  const statusContent = readFile(path.join(projectDir, 'current-status.md'));
  return extractReleaseFromStatus(statusContent) || null;
}

// ─── Issue model ──────────────────────────────────────────────────────────────

/**
 * issue({ type, file, message, fixable, fix })
 * type: 'coherence' | 'cohesion' | 'validate' | 'health'
 * file: relative file path (owner lookup key)
 * message: human-readable description
 * fixable: boolean — can sdk-pre-tag resolve this automatically?
 * fix: function(projectDir) → void — applied when --fix is set
 */
function issue(type, file, message, fixable = false, fix = null) {
  return { type, file, message, fixable, fix };
}

// ─── Checks ───────────────────────────────────────────────────────────────────

/**
 * Coherence checks — cross-document consistency
 */
function checkCoherence(projectDir) {
  const issues = [];
  const sdkrc          = readSdkrc(projectDir);
  const statusContent  = readFile(path.join(projectDir, 'current-status.md'));
  const historyContent = readFile(path.join(projectDir, 'history.md'));
  const productContent = readFile(path.join(projectDir, 'product-requirements.md'));
  const engContent     = readFile(path.join(projectDir, 'engineering-requirements.md'));

  // ── C1: Release ID consistency ────────────────────────────────────────────
  const releaseInStatus = extractReleaseFromStatus(statusContent);
  const releaseInSdkrc  = sdkrc.releaseId || null;

  if (releaseInStatus && releaseInSdkrc && releaseInStatus !== releaseInSdkrc) {
    issues.push(issue(
      'coherence', '_coherence',
      `Release ID mismatch: current-status.md says "${releaseInStatus}", .sdkrc says "${releaseInSdkrc}". ` +
      `Canonical source: .sdkrc. Run: sdk-version <project-dir> set ${releaseInSdkrc}`,
      true,
      (dir) => {
        // Sync current-status.md Release field to .sdkrc value
        const content = readFile(path.join(dir, 'current-status.md'));
        if (!content) return;
        const updated = content.replace(
          /(\*\*Release:\*\*\s*)(v\d{4}\.Q[1-4]\.\d+)/,
          `$1${releaseInSdkrc}`
        );
        fs.writeFileSync(path.join(dir, 'current-status.md'), updated, 'utf8');
      }
    ));
  }

  // ── C2: Active missions exist in product-requirements.md ─────────────────
  const activeMissions  = extractActiveMissions(statusContent);
  const productItems    = extractRequirementItems(productContent || '');
  const productItemsLow = productItems.map(s => s.toLowerCase());
  const productBody     = (productContent || '').toLowerCase();

  for (const mission of activeMissions) {
    const missionLow = mission.toLowerCase();
    // Check if any product-requirements line mentions the mission title (substring match)
    const mentioned = productItemsLow.some(item => item.includes(missionLow))
      || productBody.includes(missionLow);
    if (!mentioned && mission !== '[Mission name]') {
      issues.push(issue(
        'coherence', 'product-requirements.md',
        `Mission "${mission}" is active in current-status.md but has no corresponding entry in product-requirements.md. ` +
        `PM should add it to the Pending or In Progress section.`
      ));
    }
  }

  // ── C3: history.md entry exists for current release ID ───────────────────
  const releaseId = releaseInSdkrc || releaseInStatus;
  if (releaseId && historyContent) {
    const escapedId = releaseId.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
    const hasEntry  = new RegExp(escapedId).test(historyContent);
    if (!hasEntry) {
      issues.push(issue(
        'coherence', 'history.md',
        `No history.md entry found for release ${releaseId}. ` +
        `Coordinator must log the release decision before tagging. ` +
        `Run: sdk-doc decision history.md --decision "Release ${releaseId}" --context "..." --made-by Coordinator`
      ));
    }
  }

  // ── C4: Next Agent To Activate section references a real role ────────────
  const knownRoles = new Set([
    'coordinator', 'ceo', 'cto', 'clo', 'ciso', 'cfo', 'cmo', 'cro', 'cdo',
    'coo', 'chro', 'pm', 'designer', 'ux researcher', 'mario', 'em', 'liaison',
    'staff engineer', 'caio', 'cao', 'cpoprot', 'engineer',
    'greg', 'camila', 'pablo', 'diana', 'gabriela',
  ]);
  if (statusContent) {
    const sections  = parseSections(statusContent);
    const nextBody  = sections.get('Next Agent To Activate') || '';
    for (const line of nextBody.split('\n')) {
      if (!line.startsWith('|')) continue; // skip non-table lines (activation phrases, bold headers)
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 1) continue;
      if (/^role$/i.test(cells[0])) continue;
      if (/^[-:]+$/.test(cells[0])) continue;
      // Strip agent name in parentheses: "CTO (Tariq Bishkek)" → "CTO"
      const roleName = cells[0].replace(/\([^)]*\)/g, '').replace(/[*_]/g, '').toLowerCase().trim();
      if (roleName && roleName !== '[role name]' && !knownRoles.has(roleName) && !roleName.startsWith('[')) {
        issues.push(issue(
          'coherence', 'current-status.md',
          `"Next Agent To Activate" names "${cells[0]}" — not a recognized role. ` +
          `Verify the role name or update to a valid role.`
        ));
      }
    }
  }

  return issues;
}

/**
 * Cohesion checks — intra-document consistency
 */
function checkCohesion(projectDir) {
  const issues = [];

  // ── H1: current-status.md: missions marked DONE/✅ still in Active section
  const statusContent = readFile(path.join(projectDir, 'current-status.md'));
  if (statusContent) {
    const sections   = parseSections(statusContent);
    const activeBody = sections.get('Active Missions') || '';
    for (const line of activeBody.split('\n')) {
      const cells = line.split('|').map(c => c.trim()).filter(Boolean);
      if (cells.length < 4) continue;
      if (/^mission$/i.test(cells[0])) continue;
      if (/^[-:]+$/.test(cells[0])) continue;
      const status = cells[3] || '';
      if (/done|✅|complete|shipped/i.test(status)) {
        issues.push(issue(
          'cohesion', 'current-status.md',
          `Mission "${cells[0]}" has status "${status}" but is still listed in Active Missions. ` +
          `Move it to Completed Since Last Session or remove it.`
        ));
      }
    }
  }

  // ── H2: product-requirements.md: items in Done that also appear in Pending
  const productContent = readFile(path.join(projectDir, 'product-requirements.md'));
  if (productContent) {
    const sections = parseSections(productContent);
    const pending  = (sections.get('Pending') || '').toLowerCase();
    const done     = sections.get('Done') || '';
    for (const line of done.split('\n')) {
      const m = line.match(/^- \[[ xX]\] (.+)$/);
      if (m) {
        const text = m[1].trim().toLowerCase();
        if (pending.includes(text)) {
          issues.push(issue(
            'cohesion', 'product-requirements.md',
            `Item "${m[1].trim()}" appears in both Done and Pending sections. ` +
            `Remove it from Pending.`
          ));
        }
      }
    }
  }

  // ── H3: history.md: entries missing made-by attribution ─────────────────
  const historyContent = readFile(path.join(projectDir, 'history.md'));
  if (historyContent) {
    const lines = historyContent.split('\n');
    let inEntry = false;
    let entryHeading = null;
    let hasMadeBy  = false;

    for (const line of lines) {
      if (/^## /.test(line)) {
        // Check previous entry
        if (inEntry && !hasMadeBy && entryHeading) {
          issues.push(issue(
            'cohesion', 'history.md',
            `History entry "${entryHeading}" is missing a "Made by:" attribution. ` +
            `Add: **Made by:** [Role]`
          ));
        }
        inEntry      = true;
        entryHeading = line.replace(/^##\s*/, '').trim();
        hasMadeBy    = false;
      } else if (inEntry) {
        if (/made by|made-by/i.test(line)) hasMadeBy = true;
      }
    }
    // Check last entry
    if (inEntry && !hasMadeBy && entryHeading) {
      issues.push(issue(
        'cohesion', 'history.md',
        `History entry "${entryHeading}" is missing a "Made by:" attribution. ` +
        `Add: **Made by:** [Role]`
      ));
    }
  }

  return issues;
}

/**
 * Validate checks — structural requirements (delegates to validate.js)
 */
function checkValidate(projectDir) {
  const { warnings } = validate(projectDir);
  return warnings.map(w => issue('validate', '_validate', w, false));
}

/**
 * Health checks — staleness, manifest, .sdkrc
 */
function checkHealth(projectDir, staleHours = 48) {
  const issues = [];

  // Staleness: current-status.md
  const statusPath = path.join(projectDir, 'current-status.md');
  if (fs.existsSync(statusPath)) {
    const stat = fs.statSync(statusPath);
    const ageH = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (ageH > staleHours) {
      issues.push(issue(
        'health', 'current-status.md',
        `current-status.md is ${Math.round(ageH)}h stale (threshold: ${staleHours}h). ` +
        `Coordinator must update it to reflect current team state before tagging.`
      ));
    }
  }

  // Manifest freshness
  const manifestPath = path.join(projectDir, 'context-manifest.json');
  if (!fs.existsSync(manifestPath)) {
    issues.push(issue(
      'health', '_health',
      `context-manifest.json not found. Run: sdk-doc manifest ${projectDir}`
    ));
  } else {
    const stat = fs.statSync(manifestPath);
    const ageH = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
    if (ageH > staleHours * 3) {
      issues.push(issue(
        'health', '_health',
        `context-manifest.json is ${Math.round(ageH)}h old. Regenerate: sdk-doc manifest ${projectDir}`
      ));
    }
  }

  // .sdkrc validity
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  if (!fs.existsSync(sdkrcPath)) {
    issues.push(issue(
      'health', '.sdkrc',
      `.sdkrc not found. Run: sdk-init or sdk-bootstrap to create it.`
    ));
  } else {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (!sdkrc.sdkPath && !sdkrc.releaseId) {
        issues.push(issue(
          'health', '.sdkrc',
          `.sdkrc has neither sdkPath nor releaseId. Run: sdk-init to configure.`
        ));
      }
    } catch (_) {
      issues.push(issue(
        'health', '.sdkrc',
        `.sdkrc is malformed JSON. Run: sdk-init to recreate.`
      ));
    }
  }

  return issues;
}

// ─── Auto-fix ─────────────────────────────────────────────────────────────────

function applyFixes(projectDir, allIssues) {
  const fixed   = [];
  const unfixed = [];

  for (const iss of allIssues) {
    if (iss.fixable && typeof iss.fix === 'function') {
      try {
        iss.fix(projectDir);
        fixed.push(iss);
      } catch (e) {
        iss.fixError = e.message;
        unfixed.push(iss);
      }
    } else {
      // Check if it's a missing-file issue from validate (auto-create from template)
      const missingMatch = iss.message.match(/^WARN\s+(\S+)\s+is missing/);
      if (missingMatch) {
        const rel  = missingMatch[1];
        const dest = path.join(projectDir, rel);
        const stub = templateStubFor(rel);
        if (stub) {
          try {
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.writeFileSync(dest, stub, 'utf8');
            fixed.push({ ...iss, fixNote: `Created from project-template/${rel}` });
          } catch (e) {
            iss.fixError = e.message;
            unfixed.push(iss);
          }
        } else {
          unfixed.push(iss);
        }
      } else {
        unfixed.push(iss);
      }
    }
  }

  return { fixed, unfixed };
}

// ─── Output formatting ────────────────────────────────────────────────────────

function groupByOwner(issues) {
  const groups = new Map();
  for (const iss of issues) {
    const owner = ownerFor(iss.file);
    if (!groups.has(owner)) groups.set(owner, []);
    groups.get(owner).push(iss);
  }
  return groups;
}

function printReport({ projectDir, allIssues, fixedIssues, releaseId, jsonMode }) {
  const unfixed = allIssues.filter(i => !fixedIssues.find(f => f === i));

  if (jsonMode) {
    const byOwner = {};
    for (const [owner, issues] of groupByOwner(unfixed)) {
      byOwner[owner] = issues.map(i => ({ type: i.type, file: i.file, message: i.message }));
    }
    console.log(JSON.stringify({
      clean:    unfixed.length === 0,
      releaseId,
      fixed:    fixedIssues.length,
      issues:   unfixed.length,
      byOwner,
    }, null, 2));
    return;
  }

  console.log('');
  console.log(`  sdk-pre-tag: ${projectDir}`);
  if (releaseId) console.log(`  Release:    ${releaseId}`);
  console.log('');

  if (fixedIssues.length > 0) {
    console.log(`  ✓  Auto-fixed ${fixedIssues.length} issue${fixedIssues.length > 1 ? 's' : ''}:`);
    for (const f of fixedIssues) {
      console.log(`     ${f.fixNote || f.message.substring(0, 80)}`);
    }
    console.log('');
  }

  if (unfixed.length === 0) {
    console.log(`  ✅  All checks passed. Ready to tag.\n`);
    return;
  }

  // Group by type
  const byType = { coherence: [], cohesion: [], validate: [], health: [] };
  for (const i of unfixed) (byType[i.type] || byType.validate).push(i);

  const typeLabels = {
    coherence: 'COHERENCE — cross-document consistency',
    cohesion:  'COHESION  — intra-document consistency',
    validate:  'VALIDATE  — structural requirements',
    health:    'HEALTH    — project health',
  };

  let printed = 0;
  for (const [type, label] of Object.entries(typeLabels)) {
    const group = byType[type] || [];
    if (!group.length) continue;
    console.log(`  ── ${label}`);
    for (const i of group) {
      console.error(`  ⚠   [${i.file}]  ${i.message}`);
      printed++;
    }
    console.log('');
  }

  // Team dispatch: group by owner
  console.log(`  ── TEAM DISPATCH\n`);
  const ownerGroups = groupByOwner(unfixed);
  for (const [owner, ownerIssues] of ownerGroups) {
    console.log(`  ${owner} — ${ownerIssues.length} issue${ownerIssues.length > 1 ? 's' : ''} to resolve`);
    for (const i of ownerIssues) {
      // Trim to first sentence for the dispatch
      const brief = i.message.split(/\.\s/)[0] + '.';
      console.log(`    · ${brief}`);
    }
    console.log('');
  }

  console.log(`  ${unfixed.length} issue${unfixed.length > 1 ? 's' : ''} require agent action before tagging.`);
  console.log(`  Re-run after agents update their files: sdk-pre-tag ${projectDir}\n`);
}

// ─── CLI entrypoint ───────────────────────────────────────────────────────────

const args       = process.argv.slice(2);
const fixMode    = args.includes('--fix');
const jsonMode   = args.includes('--json');
const staleFlag  = (() => {
  const idx = args.indexOf('--stale-hours');
  return idx !== -1 ? +args[idx + 1] : 48;
})();
const releaseFlag = (() => {
  const idx = args.indexOf('--release-id');
  return idx !== -1 ? args[idx + 1] : null;
})();
const projectArg = args.find(a => !a.startsWith('--'));

if (!args.length || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Usage:
  sdk-pre-tag <project-dir>                      # full review — report only
  sdk-pre-tag <project-dir> --fix                # review + auto-fix safe issues
  sdk-pre-tag <project-dir> --release-id v2026.Q2.1  # assert release ID
  sdk-pre-tag <project-dir> --stale-hours 72     # custom staleness threshold (default: 48h)
  sdk-pre-tag <project-dir> --json               # machine-readable output

Checks:
  Coherence — cross-document consistency (release IDs, missions, role references)
  Cohesion  — intra-document consistency (no contradictions within a file)
  Validate  — structural requirements (files, placeholders, sections)
  Health    — staleness, manifest freshness, .sdkrc validity

Auto-fixable with --fix:
  - Missing required files (created from project-template/)
  - Release ID mismatch (synced to .sdkrc canonical value)

Exit 0 if clean, exit 1 if issues remain after --fix.
`);
  process.exit(0);
}

if (!projectArg) {
  console.error('Error: project directory required.');
  console.error('Usage: sdk-pre-tag <project-dir>');
  process.exit(2);
}

const projectDir = path.resolve(projectArg);

if (!fs.existsSync(projectDir)) {
  console.error(`Error: project directory not found: ${projectDir}`);
  process.exit(2);
}

// Verify release ID assertion if provided
const canonical = canonicalReleaseId(projectDir);
const releaseId = releaseFlag || canonical;

if (releaseFlag && canonical && releaseFlag !== canonical) {
  if (!jsonMode) {
    console.error(`\nError: --release-id ${releaseFlag} does not match canonical ${canonical}`);
    console.error(`Run: sdk-version ${projectDir} set ${releaseFlag} to update first.\n`);
  }
  process.exit(1);
}

// Run all checks
const allIssues = [
  ...checkCoherence(projectDir),
  ...checkCohesion(projectDir),
  ...checkValidate(projectDir),
  ...checkHealth(projectDir, staleFlag),
];

// Apply fixes if requested
const fixedIssues = fixMode ? applyFixes(projectDir, allIssues).fixed : [];

// Print report
printReport({ projectDir, allIssues, fixedIssues, releaseId, jsonMode });

// Exit code
const remaining = allIssues.length - fixedIssues.length;
process.exit(remaining > 0 ? 1 : 0);
