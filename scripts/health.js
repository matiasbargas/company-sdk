#!/usr/bin/env node

/**
 * health.js — sdk-health: project health check (Iteration 5 — The Last Picture)
 *
 * Checks:
 *   1. current-status.md staleness (warn if not updated within threshold)
 *   2. sdk-validate advisory pass (all required files + no placeholders)
 *   3. context-manifest.json freshness
 *   4. .sdkrc presence and validity
 *
 * Usage:
 *   sdk-health [project-dir]           # defaults to current directory
 *   sdk-health [project-dir] --stale-commits 8  # current-status.md threshold (default: limits.statusStaleCommits)
 *   sdk-health [project-dir] --json    # machine-readable output
 *
 * Exit codes:
 *   0 — healthy
 *   1 — issues found
 */

'use strict';

const fs   = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { validate } = require('./validate');
const { classify, hasExemptTag } = require('./lib/map-gate-lib');
const { validateLimits, readLimits } = require('./lib/limits');
const { commitsSince, countIterations, lastCharterReviewAt } = require('./lib/activity');
const { refactorDue } = require('./lib/complexity');
const { loadCapabilities } = require('./lib/capabilities');

const args         = process.argv.slice(2);
const jsonMode     = args.includes('--json');
const staleCommitsArg = args.find((a, i) => args[i - 1] === '--stale-commits');
const projectArg   = args.find(a => !a.startsWith('--'));
const projectDir   = path.resolve(projectArg || process.cwd());

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  sdk-health [project-dir]
  sdk-health [project-dir] --stale-commits 8
  sdk-health [project-dir] --json

Checks project file health: staleness, missing files, placeholders, manifest freshness.
Exit 0 if healthy, exit 1 if issues found.
`);
  process.exit(0);
}

// ─── Checks ───────────────────────────────────────────────────────────────────

const issues  = [];
const notices = [];

// 1. current-status.md staleness
const statusFile = path.join(projectDir, 'current-status.md');
if (!fs.existsSync(statusFile)) {
  issues.push('current-status.md is missing — run sdk-init or sdk-doc to create it');
} else {
  // Work-based staleness (§2 timing): commits that landed since the file last changed.
  const threshold = staleCommitsArg ? +staleCommitsArg : readLimits(projectDir).statusStaleCommits;
  const behind = commitsSince(statusFile);
  if (behind === null) {
    notices.push('current-status.md: not tracked by git — staleness not measured');
  } else if (behind > threshold) {
    issues.push(`current-status.md is ${behind} commits behind (threshold: ${threshold}) — ask the Coordinator to reconcile it`);
  } else {
    notices.push(`current-status.md is ${behind} commit(s) behind ✓`);
  }
}

// 2. sdk-validate advisory check
if (fs.existsSync(projectDir)) {
  const { warnings, clean } = validate(projectDir);
  if (!clean) {
    for (const w of warnings) issues.push(w);
  } else {
    notices.push('sdk-validate: no issues ✓');
  }
}

// 3. context-manifest.json freshness
const manifestFile = path.join(projectDir, 'context-manifest.json');
if (!fs.existsSync(manifestFile)) {
  notices.push('context-manifest.json not found — run sdk-doc manifest to generate');
} else {
  const behind = commitsSince(manifestFile);
  const generatedAt = (() => { try { return JSON.parse(fs.readFileSync(manifestFile, 'utf8')).generatedAt || null; } catch (_) { return null; } })();
  notices.push(behind === null
    ? `context-manifest.json present${generatedAt ? ` (generated ${generatedAt})` : ''} — regenerate with sdk-doc manifest after material changes`
    : `context-manifest.json is ${behind} commit(s) behind${behind > 0 ? ' — consider sdk-doc manifest' : ' ✓'}`);
}

// 4. Domain health
const sdkrcPath = path.join(projectDir, '.sdkrc');
const domainsDir = path.join(projectDir, 'domains');
const sdkrcForDomains = fs.existsSync(sdkrcPath) ? (() => { try { return JSON.parse(fs.readFileSync(sdkrcPath, 'utf8')); } catch (_) { return {}; } })() : {};

if (!fs.existsSync(domainsDir)) {
  // Only flag if project has been through Discovery (history.md has decisions)
  const historyPath = path.join(projectDir, 'history.md');
  if (fs.existsSync(historyPath)) {
    const histContent = fs.readFileSync(historyPath, 'utf8');
    if (histContent.includes('DECISION:') && !histContent.includes('[Project Start]')) {
      issues.push('domains/ directory missing — project has decisions but no domain structure. Run: sdk-doc domain . add --name <domain> --lead <role>');
    }
  }
} else {
  const domainDirs = fs.readdirSync(domainsDir).filter(d => fs.statSync(path.join(domainsDir, d)).isDirectory());
  if (domainDirs.length === 0) {
    issues.push('domains/ exists but is empty — add at least one domain: sdk-doc domain . add --name <domain> --lead <role>');
  } else {
    let emptySummaries = 0;
    let missingL1 = 0;
    for (const dd of domainDirs) {
      const summaryPath = path.join(domainsDir, dd, 'summary.md');
      if (!fs.existsSync(summaryPath)) {
        issues.push(`domains/${dd}/summary.md missing — every domain needs a summary`);
      } else {
        const content = fs.readFileSync(summaryPath, 'utf8');
        if (content.includes('[Describe the')) {
          emptySummaries++;
        }
      }
      const l1Files = fs.readdirSync(path.join(domainsDir, dd)).filter(f => f.endsWith('.md') && f !== 'summary.md');
      if (l1Files.length === 0) missingL1++;
    }
    if (emptySummaries > 0) {
      issues.push(`${emptySummaries} domain(s) have placeholder summaries — fill them after Discovery decisions are made`);
    }
    if (missingL1 > 0) {
      notices.push(`${missingL1} of ${domainDirs.length} domain(s) have no L1 detail files — add as domain understanding deepens`);
    } else {
      notices.push(`${domainDirs.length} domain(s) with L0 summaries + L1 files ✓`);
    }
  }
}

// 5. context-index.json version check
const indexFile = path.join(projectDir, 'context-index.json');
if (fs.existsSync(indexFile)) {
  try {
    const idx = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
    if (idx.schemaVersion === '1.0' && fs.existsSync(domainsDir)) {
      issues.push('context-index.json is schema 1.0 but domains/ exists — regenerate: sdk-doc index .');
    }
    if (!idx.opsMap) {
      notices.push('context-index.json missing opsMap — regenerate for v4 features: sdk-doc index .');
    }
    if (idx.projectDomains && Object.keys(idx.projectDomains).length === 0 && fs.existsSync(domainsDir)) {
      const dCount = fs.readdirSync(domainsDir).filter(d => fs.statSync(path.join(domainsDir, d)).isDirectory()).length;
      if (dCount > 0) {
        issues.push(`${dCount} domain(s) exist but context-index.json has 0 projectDomains — regenerate: sdk-doc index .`);
      }
    }
  } catch (_) {}
} else {
  notices.push('context-index.json not found — run sdk-doc index . to generate');
}

// 6. bus-log.md presence (after first session with Bus messages)
const busLogPath = path.join(projectDir, 'bus-log.md');
if (!fs.existsSync(busLogPath)) {
  const historyPath2 = path.join(projectDir, 'history.md');
  if (fs.existsSync(historyPath2)) {
    const h = fs.readFileSync(historyPath2, 'utf8');
    const decisionCount = (h.match(/DECISION:/g) || []).length;
    if (decisionCount >= 3) {
      notices.push('bus-log.md not found — consider using sdk-doc bus for inter-agent messages');
    }
  }
}

// 7. .sdkrc validity
if (!fs.existsSync(sdkrcPath)) {
  notices.push('.sdkrc not found — SDK path may not be set (run sdk-init)');
} else {
  try {
    const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
    if (!sdkrc.sdkPath) notices.push('.sdkrc: sdkPath not set — run sdk-init to configure');
    else notices.push('.sdkrc: sdkPath set ✓');
    for (const p of validateLimits(sdkrc.limits)) issues.push(`.sdkrc: ${p} — falling back to the default (protocol.md §16.1)`);
  } catch (_) {
    issues.push('.sdkrc is malformed JSON — run sdk-init to recreate');
  }
}

// 8. Framing drift detection (--framing-drift or included in default checks)
const checkDrift = args.includes('--framing-drift') || !args.some(a => a.startsWith('--') && a !== '--json' && a !== '--stale-commits');

if (checkDrift) {
  const ideaPath = path.join(projectDir, 'idea.md');
  const historyPath3 = path.join(projectDir, 'history.md');
  const productPath = path.join(projectDir, 'product-requirements.md');

  if (fs.existsSync(ideaPath)) {
    const ideaContent = fs.readFileSync(ideaPath, 'utf8');

    // Extract original brief keywords from idea.md Section 4
    const sec4Match = ideaContent.match(/## 4[\s\S]*?\n\n([\s\S]*?)(?:\n## |\s*$)/i);
    if (sec4Match) {
      const briefText = sec4Match[1].trim();
      if (briefText && !briefText.startsWith('[') && !briefText.startsWith('```') && briefText.length > 30) {
        // Extract significant words (4+ chars, not common words)
        const stopWords = new Set(['this', 'that', 'with', 'from', 'they', 'been', 'have', 'will', 'what', 'when', 'where', 'which', 'their', 'about', 'would', 'could', 'should', 'other', 'these', 'those', 'than', 'then', 'each', 'make', 'more', 'some', 'into', 'also', 'does', 'need', 'very']);
        const briefWords = new Set(
          briefText.toLowerCase()
            .replace(/[^a-z\s]/g, '')
            .split(/\s+/)
            .filter(w => w.length >= 4 && !stopWords.has(w))
        );

        // Check product-requirements for current framing
        let driftSignals = [];

        if (fs.existsSync(productPath)) {
          const prodContent = fs.readFileSync(productPath, 'utf8');
          const prodWords = new Set(
            prodContent.toLowerCase()
              .replace(/[^a-z\s]/g, '')
              .split(/\s+/)
              .filter(w => w.length >= 4 && !stopWords.has(w))
          );

          // Words in brief not in current product requirements
          const lostWords = [...briefWords].filter(w => !prodWords.has(w));
          // Words in product requirements not in brief (potential drift)
          const newWords = [...prodWords].filter(w => !briefWords.has(w) && w.length >= 5);

          const lostRatio = lostWords.length / Math.max(briefWords.size, 1);

          if (lostRatio > 0.5) {
            driftSignals.push(`Brief → product-requirements: ${Math.round(lostRatio * 100)}% of original brief terms missing from current scope`);
          }
        }

        // Check history.md for scope-changing decisions without logged rationale
        if (fs.existsSync(historyPath3)) {
          const histContent = fs.readFileSync(historyPath3, 'utf8');
          const scopeChanges = (histContent.match(/scope|pivot|reframe|redirect|changed direction/gi) || []).length;
          const loggedDecisions = (histContent.match(/### Decision:/g) || []).length;

          if (scopeChanges > 0 && loggedDecisions === 0) {
            driftSignals.push(`${scopeChanges} scope-related term(s) in history.md but no structured decisions logged`);
          }
        }

        if (driftSignals.length > 0) {
          for (const signal of driftSignals) {
            issues.push(`Framing drift: ${signal}`);
          }
        } else {
          notices.push('Framing drift: no significant drift detected ✓');
        }
      }
    }
  }
}

// 9. Document-first drift (protocol.md §35 backstop)
//    Counts material-path commits since the last map update that neither touched the map
//    nor carried [map-exempt: <reason>]. These are the commits that bypassed the gate
//    (--no-verify) or landed before the hook was installed. This is the on-demand backstop
//    the §35 enforcement text is allowed to cite — it exists in code here.
function gitOut(args, cwd) {
  try { return execSync(`git ${args}`, { cwd, encoding: 'utf8' }); } catch (_) { return null; }
}
(function documentFirstDrift() {
  const root = (gitOut('rev-parse --show-toplevel', projectDir) || '').trim();
  if (!root) return; // not a git repo → skip silently
  const relPrefix = path.relative(root, projectDir).replace(/\\/g, '/');
  const mapDirRel = relPrefix && relPrefix !== '.' ? relPrefix + '/' : '';
  const mapFiles  = [mapDirRel + 'current-status.md', mapDirRel + 'history.md'];

  // Last commit that touched the map.
  const lastMap = (gitOut(`log -1 --format=%H -- "${mapFiles[0]}" "${mapFiles[1]}"`, root) || '').trim();
  const range   = lastMap ? `${lastMap}..HEAD` : 'HEAD';
  const hashes  = (gitOut(`log ${range} --format=%H`, root) || '').split('\n').map(s => s.trim()).filter(Boolean);
  if (hashes.length === 0) { notices.push('document-first: map is current with HEAD ✓'); return; }

  let drift = 0;
  for (const h of hashes) {
    const files = (gitOut(`show --name-only --format= ${h}`, root) || '').split('\n').map(s => s.trim()).filter(Boolean);
    const c = classify(files, root, mapDirRel);
    if (!c.applies || c.materialStaged.length === 0 || c.mapTouched) continue;
    const msg = gitOut(`log -1 --format=%B ${h}`, root) || '';
    if (hasExemptTag(msg)) continue; // explicit waiver, not drift
    drift++;
  }
  if (drift > 0) {
    issues.push(`document-first drift: ${drift} material commit(s) since the last map update bypassed the gate (--no-verify or uninstalled hook) — reconcile the map (run the Status Reconcile ritual) and run \`node scripts/install-hooks.js\``);
  } else {
    notices.push(`document-first: ${hashes.length} commit(s) since last map update, all mapped or waived ✓`);
  }
})();

// 10. Collaboration Surfaces stuck mid-verification (protocol.md §34)
//     A surface sitting in under-verification / reconciling while the repo moved on is a stalled
//     multi-role decision. Measured in commits since the surface last changed (§2 timing).
(function stuckSurfaces() {
  const surfacesDir = path.join(projectDir, 'surfaces');
  if (!fs.existsSync(surfacesDir)) return;
  const window = readLimits(projectDir).surfaceStaleCommits;
  for (const f of fs.readdirSync(surfacesDir).filter(n => n.endsWith('.md') && !n.startsWith('_'))) {
    const file = path.join(surfacesDir, f);
    const state = (fs.readFileSync(file, 'utf8').match(/^\s*state:\s*([a-z-]+)/m) || [])[1];
    if (state !== 'under-verification' && state !== 'reconciling') continue;
    const behind = commitsSince(file);
    if (behind !== null && behind > window) {
      issues.push(`surface ${f} has been "${state}" for ${behind} commits (window: ${window}) — chase the open verifier slots or resolve the no-go (§34)`);
    }
  }
})();

// 11. CHARTER review cadence — every limits.charterReviewEvery agent iterations
//     (closed §32 loops + graduated §31 cycles). Review log lives in CHARTER.md.
(function charterReviewDue() {
  const charter = [path.join(projectDir, 'CHARTER.md'), path.join(projectDir, '..', 'CHARTER.md')].find(p => fs.existsSync(p));
  if (!charter) return;
  const every = readLimits(projectDir).charterReviewEvery;
  const { total, loops, cycles } = countIterations(projectDir);
  const since = total - (lastCharterReviewAt(charter) || 0);
  if (since >= every) {
    issues.push(`CHARTER review due: ${since} agent iterations since the last review (every ${every}; ${loops} loops + ${cycles} cycles total) — run the charter-review skill`);
  } else {
    notices.push(`CHARTER review: ${since}/${every} iterations since last review ✓`);
  }
})();

// 12. Specs outlive implementations (protocol.md §30)
//     - capability inventory: built vs planned capabilities in context/spec
//     - refactor discussion due: source files over limits.refactorReviewLines that were never
//       discussed, or that grew limits.refactorReviewGrowthPct past their acknowledged size
(function specsOutliveImplementations() {
  const specRoot = path.join(projectDir, 'context', 'spec');
  if (!fs.existsSync(specRoot)) return;
  const caps = loadCapabilities(specRoot);
  if (caps.length) {
    const built = caps.filter(c => c.status === 'built').length;
    const existing = caps.filter(c => ['built', 'unpinned', 'defect'].includes(c.status)).length;
    const defects = caps.filter(c => c.status === 'defect').map(c => c.id);
    notices.push(`capabilities: ${built} of ${existing} existing pinned by tests; ${caps.length - existing} planned or retired (context/spec)`);
    if (defects.length) issues.push(`capability defects (a test proved behaviour differs from spec): ${defects.join(', ')}`);
  }
  let codeRoot = projectDir;
  try { codeRoot = require('child_process').execFileSync('git', ['rev-parse', '--show-toplevel'], { cwd: projectDir, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim() || projectDir; } catch (_) { /* not a repo */ }
  for (const d of refactorDue(codeRoot, path.join(specRoot, '_refactor-watch.json'), readLimits(projectDir))) {
    issues.push(`refactor discussion due: ${d.file} is ${d.lines} lines (${d.reason}) — run the refactor-review skill; spec its capabilities first`);
  }
})();

// 13. Portfolio holding (packages/holding): chain integrity, unfilled judgment column,
//     accepted-risk revisit trigger, unmetered spend. Runs only where a holding exists:
//     .sdkrc "holdingPath", or <project>/holding.
(function holding() {
  let holdingDir = path.join(projectDir, 'holding');
  try { const rc = JSON.parse(fs.readFileSync(path.join(projectDir, '.sdkrc'), 'utf8')); if (rc.holdingPath) holdingDir = path.resolve(projectDir, rc.holdingPath); } catch (_) { /* default */ }
  if (!fs.existsSync(holdingDir)) return;
  let holdingHealth;
  try { ({ holdingHealth } = require('../packages/holding/src/health')); } catch (_) { return; }
  const res = holdingHealth(holdingDir);
  const list = Array.isArray(res) ? res : (res && res.issues) || [];
  for (const i of list) {
    const line = `holding: ${i.code || 'ISSUE'} — ${i.message || ''}${i.capability ? ` (${i.capability})` : ''}`;
    if ((i.severity || 'error') === 'info' || i.code === 'NO_HOLDING') notices.push(line); else issues.push(line);
  }
  if (!list.length) notices.push('holding: ledger chain verified, no open holding issues ✓');
})();

// ─── Output ───────────────────────────────────────────────────────────────────

const healthy = issues.length === 0;

if (jsonMode) {
  console.log(JSON.stringify({ healthy, issues, notices }, null, 2));
  process.exit(healthy ? 0 : 1);
}

console.log('');
console.log(`  sdk-health: ${projectDir}`);
console.log('');

for (const n of notices) {
  console.log(`  ✓  ${n}`);
}

if (issues.length) {
  console.log('');
  for (const issue of issues) {
    console.error(`  ⚠  ${issue}`);
  }
  console.log('');
  console.log(`  ${issues.length} issue${issues.length > 1 ? 's' : ''} found. Fix before next session.`);
} else {
  console.log('');
  console.log(`  Project is healthy.`);
}
console.log('');

process.exit(healthy ? 0 : 1);
