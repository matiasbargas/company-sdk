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
 *   sdk-health [project-dir] --stale-hours 48   # custom staleness threshold (default: 24h)
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

const args         = process.argv.slice(2);
const jsonMode     = args.includes('--json');
const staleHoursArg = args.find((a, i) => args[i - 1] === '--stale-hours');
const staleHours   = staleHoursArg ? +staleHoursArg : 24;
const projectArg   = args.find(a => !a.startsWith('--'));
const projectDir   = path.resolve(projectArg || process.cwd());

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Usage:
  sdk-health [project-dir]
  sdk-health [project-dir] --stale-hours 48
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
  const stat = fs.statSync(statusFile);
  const ageH  = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
  if (ageH > staleHours) {
    issues.push(`current-status.md is stale (${Math.round(ageH)}h since last update, threshold: ${staleHours}h) — ask the Coordinator to update it`);
  } else {
    notices.push(`current-status.md updated ${Math.round(ageH)}h ago ✓`);
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
  const stat = fs.statSync(manifestFile);
  const ageH = (Date.now() - stat.mtimeMs) / (1000 * 60 * 60);
  if (ageH > staleHours * 2) {
    notices.push(`context-manifest.json is ${Math.round(ageH)}h old — consider regenerating with sdk-doc manifest`);
  } else {
    notices.push(`context-manifest.json fresh (${Math.round(ageH)}h old) ✓`);
  }
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
  } catch (_) {
    issues.push('.sdkrc is malformed JSON — run sdk-init to recreate');
  }
}

// 8. Framing drift detection (--framing-drift or included in default checks)
const checkDrift = args.includes('--framing-drift') || !args.some(a => a.startsWith('--') && a !== '--json' && a !== '--stale-hours');

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
//     A surface sitting in under-verification / reconciling past the window is a stalled
//     multi-role decision. Window: .sdkrc "surfaceStaleDays" (default 3).
(function stuckSurfaces() {
  const surfacesDir = path.join(projectDir, 'surfaces');
  if (!fs.existsSync(surfacesDir)) return;
  const windowDays = Number(sdkrcForDomains.surfaceStaleDays) > 0 ? Number(sdkrcForDomains.surfaceStaleDays) : 3;
  for (const f of fs.readdirSync(surfacesDir).filter(n => n.endsWith('.md') && !n.startsWith('_'))) {
    const file = path.join(surfacesDir, f);
    const state = (fs.readFileSync(file, 'utf8').match(/^\s*state:\s*([a-z-]+)/m) || [])[1];
    if (state !== 'under-verification' && state !== 'reconciling') continue;
    const ageDays = (Date.now() - fs.statSync(file).mtimeMs) / 86400000;
    if (ageDays > windowDays) {
      issues.push(`surface ${f} has been "${state}" for ${Math.floor(ageDays)}d (window: ${windowDays}d) — chase the open verifier slots or resolve the no-go (§34)`);
    }
  }
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
