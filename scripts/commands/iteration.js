'use strict';

const fs = require('fs');
const path = require('path');
const { parseFrontmatter } = require('../lib/frontmatter');
const { readLimits } = require('../lib/limits');

/**
 * cmdIteration — Iteration Loop cycles in iterations/ (protocol.md Section 31).
 *
 * Restored after b5ca556 dropped it during the file-name consolidation; the
 * three Guardian role files depend on it.
 */

const VALID_LOOPS = ['discovery', 'architecture', 'implementation'];

// Mirrors protocol.md §31.2 — keep the two in sync.
const LOOP_EXIT_CRITERIA = {
  discovery: [
    'Problem statement is falsifiable (can be proven wrong with evidence)',
    'Target user is specific enough to exclude someone',
    'Regulatory constraints are mapped with confidence levels (HIGH/MED/LOW)',
    'At least one core assumption has been tested, not just stated',
    'Non-goals are explicit and reasoned (not deferred — excluded with rationale)',
    'The brief could survive a FRAMING-CHALLENGE without collapsing',
  ],
  architecture: [
    'Architecture serves at 10x current scale without fundamental redesign',
    'Every irreversible decision has a named alternative and documented rejection reason',
    'Interface contracts are complete enough for independent pod execution',
    'Make/buy/partner decisions have cost projections beyond year 1',
    "Security model satisfies CISO's non-negotiables (not deferred)",
    'The design traces back to the graduated Discovery output (not a drifted version)',
  ],
  implementation: [
    'Deliverables match the spec from the graduated Architecture output (not a drifted interpretation)',
    'No security shortcuts taken (auth, data handling, secrets management)',
    'Code is maintainable by a team that did not write it',
    'Edge cases from the pre-mortem are handled or explicitly deferred with reason',
    'Instrumentation covers the friction points PM identified in product-requirements.md',
    'The output creates user capability, not dependency (Constraint 1 check)',
  ],
};

const USAGE = [
  'Usage: sdk-doc iteration <project-dir> create|review|list|graduate [options]',
  '',
  '  create    --loop <type> [--pod <name>] [--guardian <name>]',
  '  review    --loop <type> --cycle <N> [--pod <name>] --verdict graduate|iterate --feedback "..."',
  '  list      [--loop <type>] [--status draft|in-review|rework|graduated]',
  '  graduate  --loop <type> --cycle <N> [--pod <name>]',
].join('\n');

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

// Pod names become directory names — slug them so a name can never escape iterations/.
function slug(s) {
  return String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// lib/frontmatter does not unescape, so drop characters that would break a quoted value.
function yamlString(s) {
  return '"' + String(s).replace(/["\\\r\n]/g, ' ').trim() + '"';
}

function loopDirFor(projectDir, loop, pod) {
  return pod
    ? path.join(projectDir, 'iterations', loop, slug(pod))
    : path.join(projectDir, 'iterations', loop);
}

function iterFileName(cycle) {
  return `iter-${String(cycle).padStart(3, '0')}.md`;
}

function requireLoop(o) {
  if (!o.loop || !VALID_LOOPS.includes(o.loop)) fail(`--loop is required. Valid: ${VALID_LOOPS.join(', ')}`);
  if (o.loop === 'implementation' && !o.pod) fail('--pod is required for implementation loop iterations');
  if (o.pod !== undefined && !slug(o.pod)) fail('--pod must contain at least one letter or digit');
}

function requireExistingCycle(projectDir, o) {
  requireLoop(o);
  const cycle = parseInt(o.cycle, 10);
  if (!cycle || isNaN(cycle)) fail('--cycle <N> is required');
  const iterPath = path.join(loopDirFor(projectDir, o.loop, o.pod), iterFileName(cycle));
  if (!fs.existsSync(iterPath)) fail(`Iteration file not found: ${iterPath}`);
  return { cycle, iterPath };
}

function replaceSection(content, heading, body) {
  const re = new RegExp(`(^## ${heading}\\n)[\\s\\S]*?(?=^## |$(?![\\s\\S]))`, 'm');
  return re.test(content)
    ? content.replace(re, `$1\n${body}\n\n`)
    : content.trimEnd() + `\n\n## ${heading}\n\n${body}\n`;
}

function listIterations(projectDir, o) {
  const iterDir = path.join(projectDir, 'iterations');
  if (!fs.existsSync(iterDir)) {
    console.log('No iterations directory found. Run `sdk-doc iteration <project-dir> create --loop <type>` to open the first cycle.');
    return;
  }
  if (o.loop && !VALID_LOOPS.includes(o.loop)) fail(`Unknown loop "${o.loop}". Valid: ${VALID_LOOPS.join(', ')}`);

  const rows = [];
  for (const loop of o.loop ? [o.loop] : VALID_LOOPS) {
    const loopDir = path.join(iterDir, loop);
    if (!fs.existsSync(loopDir)) continue;
    const dirs = [{ dir: loopDir, pod: null }];
    for (const e of fs.readdirSync(loopDir)) {
      if (fs.statSync(path.join(loopDir, e)).isDirectory()) dirs.push({ dir: path.join(loopDir, e), pod: e });
    }
    for (const { dir, pod } of dirs) {
      for (const file of fs.readdirSync(dir).filter(f => /^iter-\d+\.md$/.test(f)).sort()) {
        const fm = parseFrontmatter(fs.readFileSync(path.join(dir, file), 'utf8'));
        if (o.status && fm.status !== o.status) continue;
        rows.push([loop, String(fm.cycle || parseInt(file.slice(5), 10)), fm.status || 'draft', fm.guardian || '—', fm.pod || pod || '—']);
      }
    }
  }

  console.log('\n  Iteration Loops\n');
  console.log('  ' + 'Loop'.padEnd(18) + 'Cycle'.padEnd(8) + 'Status'.padEnd(14) + 'Guardian'.padEnd(22) + 'Pod');
  console.log('  ' + '─'.repeat(72));
  if (rows.length === 0) console.log('  No iterations found.');
  for (const r of rows) console.log('  ' + r[0].padEnd(18) + r[1].padEnd(8) + r[2].padEnd(14) + r[3].padEnd(22) + r[4]);
  console.log('');
}

function createIteration(projectDir, o, dryRun) {
  requireLoop(o);
  const guardian = o.guardian || 'unassigned';
  const loopDir = loopDirFor(projectDir, o.loop, o.pod);
  const existing = fs.existsSync(loopDir) ? fs.readdirSync(loopDir).filter(f => /^iter-\d+\.md$/.test(f)) : [];
  const cycle = existing.reduce((max, f) => Math.max(max, parseInt(f.slice(5), 10)), 0) + 1;
  const today = new Date().toISOString().slice(0, 10);

  const content = `---
loop: ${yamlString(o.loop)}
cycle: ${cycle}
${o.pod ? `pod: ${yamlString(o.pod)}\n` : ''}guardian: ${yamlString(guardian)}
status: "draft"
created: "${today}"
graduated: ""
---

## Input

[What the team produced this cycle]

## Guardian Review

[Guardian's assessment — one row per exit criterion]

| Criterion | PASS/FAIL | Evidence (file:section) | Required change |
|---|---|---|---|

## Exit Criteria

${LOOP_EXIT_CRITERIA[o.loop].map(c => `- [ ] ${c}`).join('\n')}

## Verdict

[GRADUATE | ITERATE — reason]

## Feedback

[Specific items to address in next cycle, if ITERATE]
`;

  const destPath = path.join(loopDir, iterFileName(cycle));
  if (dryRun) {
    console.log(`[DRY RUN] Would create: ${destPath}\n`);
    console.log(content);
    return;
  }
  fs.mkdirSync(loopDir, { recursive: true });
  fs.writeFileSync(destPath, content, 'utf8');
  console.log(`✓  Created iteration: ${path.relative(process.cwd(), destPath)}`);
  console.log(`   Loop: ${o.loop} | Cycle: ${cycle} | Guardian: ${guardian}${o.pod ? ' | Pod: ' + o.pod : ''}`);
  const escalateAt = readLimits(projectDir).guardianCyclesBeforeEscalation;
  if (cycle > escalateAt) console.log(`   ⚠  Cycle ${cycle}: past ${escalateAt} cycles without graduation — Guardian escalates to CEO (protocol.md §31.6).`);
}

function reviewIteration(projectDir, o, dryRun) {
  const { cycle, iterPath } = requireExistingCycle(projectDir, o);
  if (!o.verdict || !['graduate', 'iterate'].includes(o.verdict)) fail('--verdict graduate|iterate is required');
  if (o.verdict === 'iterate' && !o.feedback) fail('--feedback is required when --verdict iterate');

  const today = new Date().toISOString().slice(0, 10);
  let content = fs.readFileSync(iterPath, 'utf8');
  content = content.replace(/^status:\s*.*$/m, `status: "${o.verdict === 'graduate' ? 'graduated' : 'rework'}"`);
  if (o.verdict === 'graduate') content = content.replace(/^graduated:\s*.*$/m, `graduated: "${today}"`);
  content = replaceSection(content, 'Verdict', o.verdict === 'graduate'
    ? 'GRADUATE — All exit criteria passed. Output ready for canonical docs.'
    : `ITERATE — ${o.feedback}`);
  if (o.verdict === 'iterate') content = replaceSection(content, 'Feedback', `- ${o.feedback}`);

  if (dryRun) {
    console.log(`[DRY RUN] Would update: ${iterPath}\n`);
    console.log(content);
    return;
  }
  fs.writeFileSync(iterPath, content, 'utf8');
  console.log(`${o.verdict === 'graduate' ? '✓' : '↻'}  Iteration reviewed: ${path.relative(process.cwd(), iterPath)}`);
  console.log(`   Verdict: ${o.verdict.toUpperCase()}${o.feedback ? ' — ' + o.feedback : ''}`);
  if (o.verdict === 'iterate' && cycle >= readLimits(projectDir).guardianCyclesBeforeEscalation) {
    console.log(`   ⚠  Cycle ${cycle} did not graduate — Guardian escalates to CEO before cycle ${cycle + 1} (protocol.md §31.6).`);
  }
}

function graduateIteration(projectDir, o, dryRun) {
  const { cycle, iterPath } = requireExistingCycle(projectDir, o);
  const today = new Date().toISOString().slice(0, 10);
  let content = fs.readFileSync(iterPath, 'utf8');
  content = content.replace(/^status:\s*.*$/m, 'status: "graduated"');
  content = content.replace(/^graduated:\s*.*$/m, `graduated: "${today}"`);

  if (dryRun) {
    console.log(`[DRY RUN] Would graduate: ${iterPath}`);
    return;
  }
  fs.writeFileSync(iterPath, content, 'utf8');
  console.log(`✓  Iteration graduated: ${path.relative(process.cwd(), iterPath)}`);
  console.log(`   Loop: ${o.loop} | Cycle: ${cycle} | Graduated: ${today}`);
  console.log('   Next: Coordinator triggers canonical doc flow (protocol.md §31.4)');
}

module.exports = function cmdIteration({ args, filePath, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const subcommand = args[2];
  if (!['create', 'review', 'list', 'graduate'].includes(subcommand)) fail(USAGE);

  // Re-parse options from args[3]; args[2] is the subcommand.
  const o = {};
  for (let i = 3; i < args.length; i++) {
    if (args[i] === '--dry-run') continue;
    if (args[i].startsWith('--') && args[i + 1] !== undefined) o[args[i].slice(2)] = args[++i];
  }

  if (subcommand === 'list') return listIterations(projectDir, o);
  if (subcommand === 'create') return createIteration(projectDir, o, dryRun);
  if (subcommand === 'review') return reviewIteration(projectDir, o, dryRun);
  return graduateIteration(projectDir, o, dryRun);
};

module.exports.LOOP_EXIT_CRITERIA = LOOP_EXIT_CRITERIA;
