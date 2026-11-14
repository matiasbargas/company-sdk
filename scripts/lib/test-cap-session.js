#!/usr/bin/env node

/**
 * test-cap-session.js — black-box conformance tests for the session & quality bins.
 * Spec: project/context/spec/sdk-session/claims.yaml (protocol.md §30, "Specs outlive implementations").
 *
 * Every test runs a CLI through child_process against a fixture project built in an
 * os.tmpdir() mkdtemp dir, and asserts only the public interface: args, exit codes,
 * files written, and stdout/stderr lines. HOME is redirected into the temp dir so
 * ~/.claude/kill-log.json and ~/.team-sdk/memory are never touched. No network.
 *
 * Lines marked `// DEFECT:` pin CURRENT behaviour that differs from what the tool's
 * help/docs promise; the matching claim has `status: defect` and a `defect_note`.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync, execFileSync } = require('child_process');

const SDK = path.resolve(__dirname, '..', '..');
const S = (name) => path.join(SDK, 'scripts', name);

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };

// ─── Fixture helpers ─────────────────────────────────────────────────────────

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-cap-sess-')));
const HOME = path.join(TMP, 'home');
fs.mkdirSync(HOME);
process.on('exit', () => fs.rmSync(TMP, { recursive: true, force: true }));
let seq = 0;
const mkdir = (name) => { const d = path.join(TMP, `${++seq}-${name}`); fs.mkdirSync(d, { recursive: true }); return d; };
const write = (dir, rel, content) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); return p; };
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const tmpl = (rel) => fs.readFileSync(path.join(SDK, 'project-template', rel), 'utf8');

const ENV = {
  ...process.env, HOME, USERPROFILE: HOME,
  GIT_AUTHOR_NAME: 't', GIT_AUTHOR_EMAIL: 't@t', GIT_COMMITTER_NAME: 't', GIT_COMMITTER_EMAIL: 't@t',
  GIT_CONFIG_NOSYSTEM: '1',
};
function run(script, args = [], opts = {}) {
  const r = spawnSync('node', [S(script), ...args], { encoding: 'utf8', cwd: opts.cwd || TMP, env: ENV, timeout: 60000 });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '', all: (r.stdout || '') + (r.stderr || '') };
}
const json = (s) => { try { return JSON.parse(s); } catch (_) { return null; } };

function gitInit(dir) {
  const g = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore', env: ENV });
  g('init', '-q'); g('config', 'user.email', 't@t'); g('config', 'user.name', 't'); g('config', 'commit.gpgsign', 'false');
  return {
    commit: (msg) => { g('add', '-A'); g('commit', '-q', '--no-verify', '--allow-empty', '-m', msg); },
  };
}

const STATUS = (o = {}) => `# ${o.name || 'Acme'} -- sdk-v3
**Last updated:** 2026-11-01 10:00
**Updated by:** Coordinator
**Release:** ${o.release || 'v2026.Q4.1'}

## Active Missions

| Mission | PM | Appetite remaining | Status | Next action |
|---|---|---|---|---|
${o.missions || '| Checkout flow | Ana | 2 weeks | Active | Build cart |'}

## Waiting On

${o.waiting || '- [ ] Legal review | From: CLO | Since: 2026-11-01 | Blocks: launch'}

## Completed Since Last Session

- Kickoff | By: PM | Completed: 2026-11-01

## Open Decisions (not yet logged to history.md)

${o.decisions || 'None.'}

## Next Agent To Activate

${o.next !== undefined ? o.next : `| Role | Activation phrase | Read first |
|---|---|---|
| ${o.role || 'CTO'} | "Hey CTO, design the checkout architecture" | engineering-requirements.md |`}

## Session Notes

Nothing pending.
`;

/** A project that passes every content check (validate, coherence, cohesion). */
function project(dir, o = {}) {
  write(dir, 'current-status.md', STATUS(o));
  write(dir, 'history.md', o.history || `# History\n\n## Release ${o.release || 'v2026.Q4.1'} kickoff\n**Date:** 2026-11-01\n**Made by:** Coordinator\n`);
  write(dir, 'product-requirements.md', o.product || '# Product\n\n## Pending\n\n- [ ] Checkout flow\n\n## Done\n\n');
  write(dir, 'engineering-requirements.md', o.engineering || '# Engineering\n\nService layout.\n');
  write(dir, 'general-requirements.md', '# General\n\nScope.\n');
  if (o.sdkrc !== null) write(dir, '.sdkrc', JSON.stringify(o.sdkrc || { sdkPath: SDK, releaseId: o.release || 'v2026.Q4.1' }));
  return dir;
}

const NON_GOALS = '## Explicit Non-Goals\n\n- No mobile app because web covers launch users\n- No payments because the PSP hosts checkout\n';
function filledCompliance() {
  return tmpl('compliance-requirements.md')
    .replace(/\| \[[^\]|]*\] \|$/gm, '| US |')
    .replace('| Legal | CLO | Pending', '| Legal | CLO | Done')
    .replace('| Security | CISO | Pending', '| Security | CISO | Done')
    .replace(/^- \[What adjacent.*$/m, '- No mobile app because web covers launch users')
    .replace(/^- \[What capability.*$/m, '- No payments because checkout is hosted by the PSP');
}
const PRE_MORTEM = (o = {}) => `# Pre-mortem

## Pre-Mortem

**Participants:** ${o.participants || 'PM, CTO'}

### 1. This mission will fail because
1. Users never find the feature
2. Latency kills conversion
${o.failureModes === 2 ? '' : '3. The PSP rejects our merchant category\n'}
### 2. We will know we are failing when
1. Week-one activation under 10%
2. p95 checkout over 3s

### 3. Non-goals drift
1. Someone adds a mobile app

### 4. The assumption that, if wrong, kills this
Users will pay at checkout without a trial.

${o.reviewed === false ? '- [ ] Owner reviewed pre-mortem' : '- [x] Owner reviewed pre-mortem'}
`;

// ═════════════════════════════════════════════════════════════════════════════
// sdk-pre-tag
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-pretag-001
{
  const h = run('pre-tag.js', ['--help']);
  assert(h.code === 0 && /Usage:/.test(h.out) && /--fix/.test(h.out) && /--json/.test(h.out), 'pre-tag --help prints usage, exit 0');
  const none = run('pre-tag.js', []);
  assert(none.code === 0 && /Usage:/.test(none.out), 'pre-tag with no args prints usage, exit 0');
  const missing = run('pre-tag.js', [path.join(TMP, 'does-not-exist')]);
  assert(missing.code === 2 && /project directory not found/.test(missing.err), 'pre-tag on a missing dir exits 2');
}

// @covers cap-sess-pretag-002
{
  const d = project(mkdir('pretag-relid'));
  const r = run('pre-tag.js', [d, '--release-id', 'v2026.Q4.9']);
  assert(r.code === 1 && /--release-id v2026\.Q4\.9 does not match canonical v2026\.Q4\.1/.test(r.err), '--release-id that disagrees with canonical exits 1 with an error');
  write(d, '.sdkrc', JSON.stringify({ sdkPath: SDK, releaseId: 'v2026.Q4.5' }));
  const r2 = run('pre-tag.js', [d, '--release-id', 'v2026.Q4.1']);
  assert(r2.code === 1 && /canonical v2026\.Q4\.5/.test(r2.err), 'canonical release comes from .sdkrc releaseId before current-status.md');
  const r3 = run('pre-tag.js', [d, '--release-id', 'v2026.Q4.5', '--json']);
  assert(json(r3.out) && json(r3.out).releaseId === 'v2026.Q4.5', 'a matching --release-id proceeds to the review');
}

// @covers cap-sess-pretag-003
{
  const d = project(mkdir('pretag-json'));
  const r = run('pre-tag.js', [d, '--json']);
  const j = json(r.out);
  assert(j !== null, 'pre-tag --json prints parseable JSON on stdout');
  assert(j && typeof j.clean === 'boolean' && j.releaseId === 'v2026.Q4.1' && typeof j.fixed === 'number' && typeof j.issues === 'number' && typeof j.byOwner === 'object', '--json has clean, releaseId, fixed, issues, byOwner');
  const all = j ? Object.values(j.byOwner).flat() : [];
  assert(all.length === j.issues && all.every(i => i.type && i.file && i.message), 'byOwner lists {type,file,message} and totals to issues');
  // Without context-manifest.json the only finding is the manifest one (fixture is otherwise clean).
  assert(j && j.clean === false && all.length === 1 && /context-manifest\.json not found/.test(all[0].message) && all[0].type === 'health', 'missing context-manifest.json is a health issue');
  assert(r.code === 1, 'issues remaining → exit 1');
}

// @covers cap-sess-pretag-004
{
  const d = project(mkdir('pretag-text'), { role: 'Wizard' });
  const r = run('pre-tag.js', [d]);
  assert(/── COHERENCE/.test(r.out) && /── HEALTH/.test(r.out) && /── TEAM DISPATCH/.test(r.out), 'text report groups issues by category and has a TEAM DISPATCH');
  assert(/⚠ {3}\[current-status\.md\]/.test(r.err), 'each issue line goes to stderr tagged with its file');
  assert(/Coordinator — 2 issues to resolve/.test(r.out), 'dispatch groups issues by responsible role with a count');
  assert(/2 issues require agent action before tagging\./.test(r.out) && r.code === 1, 'footer counts remaining issues; exit 1');
}

// @covers cap-sess-pretag-005
{
  const d = project(mkdir('pretag-c1'), { sdkrc: { sdkPath: SDK, releaseId: 'v2026.Q4.2' }, history: '# History\n\n## v2026.Q4.2 opened\n**Made by:** Coordinator\n' });
  const j = json(run('pre-tag.js', [d, '--json']).out);
  const msgs = Object.values(j.byOwner).flat();
  const c1 = msgs.find(i => /Release ID mismatch/.test(i.message));
  assert(c1 && c1.type === 'coherence' && /current-status\.md says "v2026\.Q4\.1", \.sdkrc says "v2026\.Q4\.2"/.test(c1.message), 'release drift between current-status.md and .sdkrc is a coherence issue');
  assert((j.byOwner.Coordinator || []).some(i => /Release ID mismatch/.test(i.message)), 'release drift is dispatched to the Coordinator');
}

// @covers cap-sess-pretag-006
{
  const d = project(mkdir('pretag-c2'), { product: '# Product\n\n## Pending\n\n- [ ] Something else\n' });
  const j = json(run('pre-tag.js', [d, '--json']).out);
  const pm = (j.byOwner.PM || []).find(i => /Mission "Checkout flow" is active in current-status\.md but has no corresponding entry in product-requirements\.md/.test(i.message));
  assert(pm && pm.type === 'coherence', 'an active mission missing from product-requirements.md is a coherence issue for the PM');
  const d2 = project(mkdir('pretag-c2-ok'), { product: '# Product\n\nWe build the checkout FLOW for merchants.\n' });
  const j2 = json(run('pre-tag.js', [d2, '--json']).out);
  assert(!Object.values(j2.byOwner).flat().some(i => /Mission "/.test(i.message)), 'a case-insensitive mention anywhere in product-requirements.md satisfies the mission check');
}

// @covers cap-sess-pretag-007
{
  const d = project(mkdir('pretag-c3'), { history: '# History\n\n## Kickoff\n**Made by:** CEO\n' });
  const j = json(run('pre-tag.js', [d, '--json']).out);
  const h = Object.values(j.byOwner).flat().find(i => /No history\.md entry found for release v2026\.Q4\.1/.test(i.message));
  assert(h && h.type === 'coherence' && h.file === 'history.md', 'history.md that never names the release is a coherence issue');
}

// @covers cap-sess-pretag-008
{
  const d = project(mkdir('pretag-c4'), { role: 'Wizard (Ana Lagos)' });
  const j = json(run('pre-tag.js', [d, '--json']).out);
  assert(Object.values(j.byOwner).flat().some(i => /"Next Agent To Activate" names "Wizard \(Ana Lagos\)" — not a recognized role/.test(i.message)), 'an unknown role in Next Agent To Activate is flagged');
  const d2 = project(mkdir('pretag-c4-ok'), { role: 'Staff Engineer (Tariq Bishkek)' });
  const j2 = json(run('pre-tag.js', [d2, '--json']).out);
  assert(!Object.values(j2.byOwner).flat().some(i => /not a recognized role/.test(i.message)), 'a known role with a parenthesised agent name passes');
}

// @covers cap-sess-pretag-009
{
  const d = project(mkdir('pretag-cohesion'), {
    missions: '| Checkout flow | Ana | 0 weeks | Done | — |',
    product: '# Product\n\n## Pending\n\n- [ ] Checkout flow\n\n## Done\n\n- [x] Checkout flow\n',
    history: '# History\n\n## Release v2026.Q4.1 kickoff\n**Made by:** Coordinator\n\n## Unsigned entry\nno attribution here\n',
  });
  const all = Object.values(json(run('pre-tag.js', [d, '--json']).out).byOwner).flat().filter(i => i.type === 'cohesion');
  assert(all.some(i => /Mission "Checkout flow" has status "Done" but is still listed in Active Missions/.test(i.message)), 'a Done mission still in Active Missions is a cohesion issue');
  assert(all.some(i => /Item "Checkout flow" appears in both Done and Pending sections/.test(i.message)), 'an item in both Done and Pending is a cohesion issue');
  assert(all.some(i => /History entry "Unsigned entry" is missing a "Made by:" attribution/.test(i.message)) && !all.some(i => /"Release v2026/.test(i.message)), 'only history entries without Made by are flagged');
}

// @covers cap-sess-pretag-010
{
  const d = project(mkdir('pretag-validate'));
  fs.writeFileSync(path.join(d, 'engineering-requirements.md'), '# Eng\n\nRelease: [RELEASE]\n');
  const v = Object.values(json(run('pre-tag.js', [d, '--json']).out).byOwner).flat().filter(i => i.type === 'validate');
  assert(v.length === 1 && /^WARN {2}engineering-requirements\.md.*unfilled placeholder on line 3/.test(v[0].message) && v[0].file === '_validate', 'sdk-validate warnings surface verbatim as validate issues');
}

// @covers cap-sess-pretag-011
{
  const root = mkdir('pretag-stale');
  const d = project(path.join(root, 'proj'), { sdkrc: { sdkPath: SDK, releaseId: 'v2026.Q4.1', limits: { statusStaleCommits: 2 } } });
  const git = gitInit(root);
  git.commit('init');
  const stale = () => Object.values(json(run('pre-tag.js', [d, '--json']).out).byOwner).flat().find(i => /commits behind/.test(i.message));
  for (let i = 0; i < 2; i++) { write(root, `other${i}.txt`, String(i)); git.commit(`o${i}`); }
  assert(!stale(), 'current-status.md within limits.statusStaleCommits is not flagged');
  write(root, 'other9.txt', '9'); git.commit('o9');
  const s = stale();
  assert(s && s.type === 'health' && /current-status\.md is 3 commits behind \(threshold: 2\)/.test(s.message), 'current-status.md more commits behind than statusStaleCommits is a health issue');
  const nogit = project(mkdir('pretag-nogit'));
  assert(!Object.values(json(run('pre-tag.js', [nogit, '--json']).out).byOwner).flat().some(i => /commits behind/.test(i.message)), 'outside git, staleness is not measured');
}

// @covers cap-sess-pretag-012
{
  const issuesFor = (sdkrc) => {
    const d = project(mkdir('pretag-sdkrc'), { sdkrc: null });
    if (sdkrc !== undefined) fs.writeFileSync(path.join(d, '.sdkrc'), sdkrc);
    return Object.values(json(run('pre-tag.js', [d, '--json']).out).byOwner).flat().filter(i => i.file === '.sdkrc').map(i => i.message);
  };
  assert(issuesFor(undefined).some(m => /\.sdkrc not found/.test(m)), 'missing .sdkrc is a health issue');
  assert(issuesFor('{nope').some(m => /\.sdkrc is malformed JSON/.test(m)), 'malformed .sdkrc is a health issue');
  assert(issuesFor('{"type":"product"}').some(m => /neither sdkPath nor releaseId/.test(m)), '.sdkrc without sdkPath and releaseId is a health issue');
  assert(issuesFor(JSON.stringify({ sdkPath: SDK })).length === 0, '.sdkrc with sdkPath is fine');
}

// @covers cap-sess-pretag-013
{
  const d = project(mkdir('pretag-fix-rel'), { sdkrc: { sdkPath: SDK, releaseId: 'v2026.Q4.2' }, history: '# History\n\n## v2026.Q4.2\n**Made by:** Coordinator\n' });
  const r = run('pre-tag.js', [d, '--fix', '--json']);
  const j = json(r.out);
  assert(/\*\*Release:\*\* v2026\.Q4\.2/.test(read(d, 'current-status.md')), '--fix rewrites current-status.md Release to the .sdkrc value');
  assert(j.fixed === 1 && !Object.values(j.byOwner).flat().some(i => /Release ID mismatch/.test(i.message)), 'the fixed drift is counted in fixed and no longer listed');
  const again = json(run('pre-tag.js', [d, '--json']).out);
  assert(!Object.values(again.byOwner).flat().some(i => /Release ID mismatch/.test(i.message)), 'a re-run after --fix finds no drift');
  const noFix = project(mkdir('pretag-nofix'), { sdkrc: { sdkPath: SDK, releaseId: 'v2026.Q4.2' } });
  run('pre-tag.js', [noFix]);
  assert(/\*\*Release:\*\* v2026\.Q4\.1/.test(read(noFix, 'current-status.md')), 'without --fix, files are never modified');
}

// @covers cap-sess-pretag-014
{
  const d = project(mkdir('pretag-fix-missing'));
  fs.rmSync(path.join(d, 'general-requirements.md'));
  const r = run('pre-tag.js', [d, '--fix']);
  assert(fs.existsSync(path.join(d, 'general-requirements.md')) && read(d, 'general-requirements.md') === tmpl('general-requirements.md'), '--fix creates a missing required file from project-template/');
  assert(/Auto-fixed 1 issue:/.test(r.out) && /Created from project-template\/general-requirements\.md/.test(r.out), 'the creation is reported as auto-fixed');
  // DEFECT: the created-from-template issue is still listed as unresolved (fixed copy ≠ original object),
  // so the footer says 2 issues while the exit code is computed from 1 remaining.
  assert(/general-requirements\.md is missing/.test(r.err) && /2 issues require agent action/.test(r.out), 'DEFECT: fixed missing-file issue is still reported as unresolved');
  const j = json(run('pre-tag.js', [project(mkdir('pretag-fix-missing-json')), '--json']).out);
  assert(j && j.fixed === 0, 'baseline: clean fixture has nothing to fix');
}

// @covers cap-sess-pretag-015
{
  const d = project(mkdir('pretag-manifest'));
  write(d, 'context-manifest.json', '{"generatedAt":"2026-11-01T00:00:00Z"}');
  const r = run('pre-tag.js', [d]);
  // Fixed 2026-11-14 (was a ReferenceError on `staleHours`; manifest staleness is now commit-based).
  assert(!/ReferenceError/.test(r.err), 'pre-tag does not crash when context-manifest.json exists');
  assert(r.code === 0 && /All checks passed/.test(r.out), `a clean project with a manifest gets a clean verdict (exit ${r.code}): ${(r.out + r.err).slice(-300)}`);
  const rj = run('pre-tag.js', [d, '--json']);
  assert(json(rj.out) !== null && !/ReferenceError/.test(rj.err), '--json returns JSON with a manifest present');
}

// @covers cap-sess-pretag-016
{
  const d = project(mkdir('pretag-json-relid'));
  const r = run('pre-tag.js', [d, '--release-id', 'v2026.Q4.9', '--json']);
  // DEFECT: --json promises machine-readable output, but the release-id mismatch path exits 1 with
  // empty stdout and empty stderr.
  assert(r.code === 1 && r.out.trim() === '' && r.err.trim() === '', 'DEFECT: --json release-id mismatch exits 1 with no output at all');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-status
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-status-001
{
  const r = run('status.js', [mkdir('status-empty')]);
  assert(r.code === 1 && /No current-status\.md found/.test(r.err), 'status without current-status.md exits 1 with a hint');
  const h = run('status.js', ['--help']);
  assert(h.code === 0 && /--cross-project/.test(h.out), 'status --help prints usage, exit 0');
  const d = project(mkdir('status-cwd'));
  const c = run('status.js', [], { cwd: d });
  assert(c.code === 0 && /Acme/.test(c.out), 'status defaults to the current directory');
}

// @covers cap-sess-status-002
{
  const d = project(mkdir('status-view'), {
    missions: '| Checkout flow | Ana | 2 weeks | Active | Build cart |\n| Old thing | Ana | 0 | Done | — |',
    decisions: '- Pick the DB | Owner: CTO',
  });
  const r = run('status.js', [d]);
  assert(r.code === 0, 'status exits 0');
  assert(/^ {2}Acme$/m.test(r.out) && /Release: v2026\.Q4\.1/.test(r.out) && /Updated: 2026-11-01 10:00/.test(r.out), 'header shows project name (suffix stripped), release, updated');
  assert(/MISSIONS \(1\)/.test(r.out) && /Checkout flow/.test(r.out) && !/Old thing/.test(r.out), 'Done missions are hidden; open ones are counted and listed');
  assert(/Status: Active/.test(r.out) && /Next: {3}Build cart/.test(r.out) && /Owner: {2}Ana/.test(r.out), 'each mission shows status, next action, owner');
  assert(/Waiting on:\n {4}- Legal review/.test(r.out), 'unchecked Waiting On items are listed');
  assert(/Open decisions:\n {4}- Pick the DB/.test(r.out), 'open decisions are listed');
  assert(/To resume — paste this:\n\n {2}Hey CTO, design the checkout architecture/.test(r.out), 'activation phrase is read from the Next Agent table');
  assert(/No framings to challenge\. No open disagreements\./.test(r.out), 'with nothing to challenge, says so');
}

// @covers cap-sess-status-003
{
  const d = project(mkdir('status-framings'), {
    product: '# Product\n\n- [ ] Checkout flow\n\n## Explicit Non-Goals\n\n- No mobile app this cycle\n- No loyalty points\n- No third item shown\n\n---\n\n### 4. The assumption that kills us\n\nMerchants will switch from their PSP\n',
  });
  write(d, 'bus-log.md', '[2026-11-02 10:00]\nFROM: CFO\nTO: CEO\nTAG: FRAMING-CHALLENGE\nMESSAGE: the market is smaller than the brief assumes\n');
  fs.appendFileSync(path.join(d, 'history.md'), '\n### [DISAGREE-001] Pricing model\nStatus: OPEN\n');
  const r = run('status.js', [d]);
  assert(/ACTIVE FRAMINGS/.test(r.out) && /\[Pre-mortem\] Merchants will switch from their PSP/.test(r.out), 'pre-mortem assumption is surfaced as a framing');
  assert(/\[Non-goal\] No mobile app this cycle/.test(r.out) && /\[Non-goal\] No loyalty points/.test(r.out) && !/No third item shown/.test(r.out), 'first two non-goals are surfaced');
  assert(/OPEN CHALLENGES/.test(r.out) && /2026-11-02 {2}CFO:/.test(r.out), 'FRAMING-CHALLENGE bus messages are surfaced with date and sender');
  assert(/Disagreement: Pricing model/.test(r.out), 'OPEN disagreements in history.md are surfaced');
}

// @covers cap-sess-status-004
{
  const d = project(mkdir('status-overdue'), { decisions: '- Pick the DB | DECISION BY: 2020-01-01' });
  const r = run('status.js', [d]);
  assert(/OVERDUE \(1\) — DECISION BY date has passed/.test(r.out) && /2020-01-01 {2}current-status\.md:/.test(r.out), 'passed DECISION BY dates are listed as OVERDUE with file:line');
  const d2 = project(mkdir('status-future'), { decisions: '- Pick the DB | DECISION BY: 2999-01-01' });
  assert(!/OVERDUE/.test(run('status.js', [d2]).out), 'future deadlines are not overdue');
}

// @covers cap-sess-status-005
{
  const d = project(mkdir('status-kills'));
  write(HOME, '.claude/kill-log.json', JSON.stringify([
    { date: '2026-10-01', killClass: 'FRAMING_WRONG', pod: 'mobile-pod', reason: 'users are on desktop', project: path.basename(d), projectDir: d },
    { date: '2026-10-02', killClass: 'SCOPE_OBSOLETE', pod: 'other-pod', reason: 'not ours', project: 'elsewhere', projectDir: '/nowhere' },
    { date: '2026-10-03', killClass: 'FRAMING_WRONG', pod: 'foreign-pod', reason: 'wrong bet', project: 'elsewhere', projectDir: '/nowhere' },
  ]));
  const r = run('status.js', [d]);
  assert(/KILL LOG\n/.test(r.out) && /mobile-pod/.test(r.out) && /users are on desktop/.test(r.out) && !/other-pod|foreign-pod/.test(r.out), 'kill log shows only this project\'s kills');
  const x = run('status.js', [d, '--cross-project']);
  assert(/KILL LOG \(FRAMING_WRONG — cross-project\)/.test(x.out) && /foreign-pod \[elsewhere\]/.test(x.out) && !/other-pod/.test(x.out), '--cross-project shows FRAMING_WRONG kills from every project');
  fs.rmSync(path.join(HOME, '.claude'), { recursive: true, force: true });
}

// @covers cap-sess-status-006
{
  const d = project(mkdir('status-nophrase'), { next: '| Role | Activation phrase | Read first |\n|---|---|---|\n| [Role name] | [e.g. "Hey Greg"] | [idea.md] |' });
  const r = run('status.js', [d]);
  assert(/No activation phrase found\./.test(r.out) && !/To resume — paste this/.test(r.out), 'template placeholder phrase → "No activation phrase found."');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-next
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-next-001
{
  const u = run('next.js', []);
  assert(u.code === 1 && /Usage: sdk-next <project-dir>/.test(u.err), 'next with no args exits 1 with usage');
  const m = run('next.js', [mkdir('next-empty')]);
  assert(m.code === 1 && /current-status\.md not found/.test(m.err), 'next without current-status.md exits 1');
}

// @covers cap-sess-next-002
{
  const d = project(mkdir('next-line'), { next: '**CTO (Tariq Bishkek)** — architecture\n\nActivation phrase: "Hey CTO, design the checkout"\n' });
  const r = run('next.js', [d]);
  assert(r.code === 0 && r.out === 'Project: Acme\nActive: Checkout flow\nWaiting on: Legal review\n\nTo resume, paste this:\nHey CTO, design the checkout\n', 'next prints the five-line block (project, active, waiting, phrase)');
  const e = project(mkdir('next-none'), { missions: '|---|---|---|---|---|', waiting: '- [x] done thing', next: '**CTO** — x\n' });
  const re = run('next.js', [e]);
  assert(/Active: None/.test(re.out) && /Waiting on: Nothing blocked/.test(re.out) && /No handoff phrase found/.test(re.out), 'empty sections fall back to None / Nothing blocked / no-handoff message');
}

// @covers cap-sess-next-003
{
  const d = project(mkdir('next-table'));
  const r = run('next.js', [d]);
  // DEFECT: the template's Next Agent section is a table; sdk-next prints its header row
  // instead of the phrase (sdk-status reads the same file correctly).
  assert(/To resume, paste this:\n\| Role \| Activation phrase \| Read first \|/.test(r.out), 'DEFECT: table-form Next Agent prints the table header as the phrase');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-resume
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-resume-001
{
  const a = run('resume.js', [path.join(TMP, 'nope')]);
  assert(a.code === 1 && /Project directory not found/.test(a.err), 'resume on a missing dir exits 1');
  const b = run('resume.js', [mkdir('resume-empty')]);
  assert(b.code === 1 && /current-status\.md not found/.test(b.err), 'resume without current-status.md exits 1');
}

// @covers cap-sess-resume-002
{
  const d = project(mkdir('resume'), { decisions: '- Pick DB | DECISION BY: 2020-01-01' });
  const r = run('resume.js', [d]);
  assert(r.code === 0, 'resume exits 0 (advisory)');
  for (const label of ['SDK:', 'Gates:', 'Drafts:', 'Sessions:', 'Manifest:', 'Index:', 'Overdue:']) {
    assert(new RegExp(`^${label}`, 'm').test(r.out), `resume prints the ${label} line`);
  }
  assert(/SDK: {6}✓ /.test(r.out), 'SDK line checks .sdkrc sdkPath exists');
  assert(fs.existsSync(path.join(d, 'context-manifest.json')) && fs.existsSync(path.join(d, 'context-index.json')), 'resume regenerates context-manifest.json and context-index.json');
  assert(/Manifest: ✓ refreshed/.test(r.out) && /Index: {4}✓ refreshed/.test(r.out), 'regeneration is reported');
  assert(/Overdue: {2}⚠ 1 DECISION BY date\(s\) passed/.test(r.out), 'overdue deadlines are surfaced');
  assert(/Project: Acme/.test(r.out) && /Ready\. Paste the activation phrase to resume your session\./.test(r.out), 'includes the sdk-next block and ends with Ready');
  const bad = project(mkdir('resume-badrc'), { sdkrc: null });
  write(bad, '.sdkrc', '{nope');
  assert(/SDK: {6}⚠ \.sdkrc malformed/.test(run('resume.js', [bad]).out), 'malformed .sdkrc is reported, not fatal');
}

// @covers cap-sess-resume-003
{
  const d = project(mkdir('resume-drafts'));
  write(d, 'agent-drafts/coordinator-2026-01-01.md', '# x\n- one\n- two\n');
  write(d, 'sessions/temp/s1.md', '---\ntitle: "Pricing spike"\n---\nbody\n');
  const r = run('resume.js', [d]);
  assert(/Drafts: {3}1 finding\(s\) in agent-drafts\/ — latest: coordinator-2026-01-01\.md \(2 items\)/.test(r.out), 'Night Watch drafts are counted with the latest file and item count');
  assert(/Sessions: 1 temp session\(s\) pending review/.test(r.out) && /s1\.md: "Pricing spike"/.test(r.out), 'temp sessions are listed with their frontmatter title');
  const e = project(mkdir('resume-nodrafts'));
  const re = run('resume.js', [e]);
  assert(/Drafts: {3}— Night Watch not initialized/.test(re.out) && /Sessions: — no sessions directory/.test(re.out), 'absent drafts/sessions dirs are reported as such');
}

// @covers cap-sess-resume-004
{
  const d = project(mkdir('resume-gates'));   // no compliance-requirements.md → sdk-gate-check --all is BLOCKED
  const g = run('gate-check.js', [d, '--all']);
  assert(g.code === 1 && /GATE BLOCKED/.test(g.err), 'precondition: gate-check --all is blocked');
  const r = run('resume.js', [d]);
  // DEFECT: gate-check writes GATE BLOCKED to stderr, but resume only scans stdout, so a blocked
  // gate is summarised as a green check with zero warnings.
  assert(/Gates: {4}✓ 0 warning\(s\)/.test(r.out), 'DEFECT: resume reports a blocked gate as "✓ 0 warning(s)"');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-health
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-health-001
{
  const h = run('health.js', ['--help']);
  assert(h.code === 0 && /--stale-commits/.test(h.out), 'health --help prints usage, exit 0');
  const d = project(mkdir('health-ok'));
  const r = run('health.js', [d, '--json']);
  const j = json(r.out);
  assert(j && j.healthy === true && Array.isArray(j.issues) && Array.isArray(j.notices) && r.code === 0, 'healthy project → {healthy:true} and exit 0');
  assert(j.notices.includes('sdk-validate: no issues ✓') && j.notices.some(n => /not tracked by git/.test(n)), 'notices include validate pass and untracked staleness');
  const t = run('health.js', [d]);
  assert(t.code === 0 && /Project is healthy\./.test(t.out), 'text mode says "Project is healthy."');
  const c = run('health.js', [], { cwd: d });
  assert(c.code === 0 && c.out.includes(`sdk-health: ${d}`), 'health defaults to the current directory');
}

// @covers cap-sess-health-002
{
  const d = project(mkdir('health-validate'));
  fs.rmSync(path.join(d, 'general-requirements.md'));
  const j = json(run('health.js', [d, '--json']).out);
  assert(j.healthy === false && j.issues.some(i => /^WARN {2}general-requirements\.md is missing/.test(i)), 'sdk-validate warnings are health issues');
  const t = run('health.js', [d]);
  assert(t.code === 1 && /⚠ {2}WARN/.test(t.err) && /1 issue found\. Fix before next session\./.test(t.out), 'text mode prints issues to stderr and counts them; exit 1');
}

// @covers cap-sess-health-003
{
  const root = mkdir('health-stale');
  const d = project(path.join(root, 'proj'));
  const git = gitInit(root); git.commit('init');
  for (let i = 0; i < 6; i++) { write(root, `n${i}.txt`, String(i)); git.commit(`n${i}`); }
  const j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /current-status\.md is 6 commits behind \(threshold: 5\)/.test(i)), 'current-status.md past limits.statusStaleCommits (default 5) is an issue');
  const j2 = json(run('health.js', [d, '--json', '--stale-commits', '10']).out);
  assert(!j2.issues.some(i => /commits behind/.test(i)) && j2.notices.some(n => /6 commit\(s\) behind ✓/.test(n)), '--stale-commits overrides the threshold');
  write(d, '.sdkrc', JSON.stringify({ sdkPath: SDK, releaseId: 'v2026.Q4.1', limits: { statusStaleCommits: 20 } }));
  const j3 = json(run('health.js', [d, '--json']).out);
  assert(!j3.issues.some(i => /commits behind/.test(i)), '.sdkrc limits.statusStaleCommits raises the threshold');
}

// @covers cap-sess-health-004
{
  const withRc = (rc) => { const d = project(mkdir('health-rc'), { sdkrc: null }); if (rc !== undefined) write(d, '.sdkrc', rc); return json(run('health.js', [d, '--json']).out); };
  const unknown = withRc(JSON.stringify({ sdkPath: SDK, limits: { bogus: 3 } }));
  assert(unknown.issues.some(i => /\.sdkrc: unknown limit "bogus"/.test(i) && /falling back to the default/.test(i)), 'unknown limit key is an issue');
  const retired = withRc(JSON.stringify({ sdkPath: SDK, limits: { surfaceStaleDays: 3 } }));
  assert(retired.issues.some(i => /limits\.surfaceStaleDays is retired — use surfaceStaleCommits/.test(i)), 'retired surfaceStaleDays is an issue with a pointer');
  const bad = withRc(JSON.stringify({ sdkPath: SDK, limits: { statusStaleCommits: 0, peerSpawns: null } }));
  assert(bad.issues.some(i => /limits\.statusStaleCommits must be a positive integer, got 0/.test(i)) && !bad.issues.some(i => /peerSpawns/.test(i)), 'non-positive limit is an issue; null is valid for nullable caps');
  const notObj = withRc(JSON.stringify({ sdkPath: SDK, limits: [1] }));
  assert(notObj.issues.some(i => /"limits" must be an object/.test(i)), 'non-object limits is an issue');
  assert(withRc('{nope').issues.some(i => /\.sdkrc is malformed JSON/.test(i)), 'malformed .sdkrc is an issue');
  const none = withRc(undefined);
  assert(none.healthy === true && none.notices.some(n => /\.sdkrc not found/.test(n)), 'missing .sdkrc is only a notice');
  assert(withRc(JSON.stringify({ releaseId: 'v2026.Q4.1' })).notices.some(n => /sdkPath not set/.test(n)), 'missing sdkPath is a notice');
}

// @covers cap-sess-health-005
{
  const d = project(mkdir('health-domains'), { history: '# History\n\n## Release v2026.Q4.1\n**Made by:** CTO\nDECISION: use Postgres\n' });
  let j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /domains\/ directory missing — project has decisions/.test(i)), 'decisions without domains/ is an issue');
  fs.mkdirSync(path.join(d, 'domains'));
  j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /domains\/ exists but is empty/.test(i)), 'empty domains/ is an issue');
  write(d, 'domains/billing/notes.md', 'x');
  j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /domains\/billing\/summary\.md missing/.test(i)), 'a domain without summary.md is an issue');
  write(d, 'domains/billing/summary.md', '[Describe the billing domain]');
  j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /1 domain\(s\) have placeholder summaries/.test(i)), 'placeholder summaries are an issue');
  write(d, 'domains/billing/summary.md', 'Billing owns invoices.');
  j = json(run('health.js', [d, '--json']).out);
  assert(!j.issues.some(i => /domain/.test(i)) && j.notices.some(n => /1 domain\(s\) with L0 summaries \+ L1 files ✓/.test(n)), 'filled summary + L1 file is healthy');
}

// @covers cap-sess-health-006
{
  const d = project(mkdir('health-drift'), { product: '# Product\n\n- [ ] Checkout flow\n' });
  write(d, 'idea.md', '# Idea\n\n## 4. Brief\n\nMerchants reconcile invoices manually across spreadsheets; we automate reconciliation with bank feeds.\n');
  const j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /^Framing drift: Brief → product-requirements: \d+% of original brief terms missing/.test(i)), 'brief terms missing from product-requirements is framing drift');
  const ok = project(mkdir('health-nodrift'), { product: '# Product\n\n- [ ] Checkout flow\nMerchants reconcile invoices manually across spreadsheets; automate reconciliation with bank feeds.\n' });
  write(ok, 'idea.md', '# Idea\n\n## 4. Brief\n\nMerchants reconcile invoices manually across spreadsheets; we automate reconciliation with bank feeds.\n');
  const j2 = json(run('health.js', [ok, '--json']).out);
  assert(j2.notices.includes('Framing drift: no significant drift detected ✓'), 'a brief reflected in product-requirements has no drift');
}

// @covers cap-sess-health-007
{
  const root = mkdir('health-docfirst');
  const d = project(path.join(root, 'proj'));
  const git = gitInit(root); git.commit('init with map');
  let j = json(run('health.js', [d, '--json']).out);
  assert(j.notices.includes('document-first: map is current with HEAD ✓'), 'no commits since the map → current');
  write(root, 'scripts/tool.js', '// x\n'); git.commit('material without map');
  write(root, 'scripts/tool2.js', '// y\n'); git.commit('material [map-exempt: test fixture]');
  write(root, 'notes.txt', 'z'); git.commit('not material');
  j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /^document-first drift: 1 material commit\(s\) since the last map update bypassed the gate/.test(i)), 'material commits without a map touch or [map-exempt] are drift; exempt and non-material are not');
  fs.appendFileSync(path.join(d, 'history.md'), '\nreconciled\n'); git.commit('map update');
  j = json(run('health.js', [d, '--json']).out);
  assert(!j.issues.some(i => /document-first drift/.test(i)), 'a map update resets the drift count');
}

// @covers cap-sess-health-008
{
  const root = mkdir('health-surfaces');
  const d = project(path.join(root, 'proj'), { sdkrc: { sdkPath: SDK, releaseId: 'v2026.Q4.1', limits: { surfaceStaleCommits: 2, statusStaleCommits: 50 } } });
  write(d, 'surfaces/SURFACE-1.md', '---\nstate: under-verification\n---\n');
  write(d, 'surfaces/SURFACE-2.md', '---\nstate: resolved\n---\n');
  write(d, 'surfaces/_template.md', '---\nstate: reconciling\n---\n');
  const git = gitInit(root); git.commit('init');
  for (let i = 0; i < 3; i++) { write(root, `n${i}.txt`, String(i)); git.commit(`n${i} [map-exempt: fixture]`); }
  const j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /^surface SURFACE-1\.md has been "under-verification" for 3 commits \(window: 2\)/.test(i)), 'a surface stuck mid-verification past surfaceStaleCommits is an issue');
  assert(!j.issues.some(i => /SURFACE-2|_template/.test(i)), 'resolved surfaces and _-prefixed templates are ignored');
}

// @covers cap-sess-health-009
{
  const d = project(mkdir('health-charter'), { sdkrc: { sdkPath: SDK, limits: { charterReviewEvery: 2 } } });
  write(d, 'CHARTER.md', '# Charter\n\n## Review log\n\n- Review 1 — 2026-01-01 — at iteration 1 — ok\n');
  write(d, 'iterations/discovery/iter-001.md', '---\nstatus: "graduated"\n---\n');
  write(d, 'record/loops/a/state.md', '## Open\nx\n## Terminate\n- Outcome: shipped\n');
  let j = json(run('health.js', [d, '--json']).out);
  assert(j.notices.some(n => /^CHARTER review: 1\/2 iterations since last review ✓/.test(n)), 'charter review not yet due shows progress');
  write(d, 'iterations/discovery/iter-002.md', '---\nstatus: graduated\n---\n');
  j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /^CHARTER review due: 2 agent iterations since the last review \(every 2; 1 loops \+ 2 cycles total\)/.test(i)), 'charter review becomes due after charterReviewEvery iterations');
  const nc = project(mkdir('health-nocharter'));
  assert(!json(run('health.js', [nc, '--json']).out).notices.some(n => /CHARTER/.test(n)), 'no CHARTER.md → no charter check');
}

// @covers cap-sess-health-010
{
  const root = mkdir('health-specs');
  const d = project(path.join(root, 'proj'), { sdkrc: { sdkPath: SDK, releaseId: 'v2026.Q4.1', limits: { refactorReviewLines: 10, refactorReviewGrowthPct: 25 } } });
  write(d, 'context/spec/x/claims.yaml', 'claims:\n  - id: cap-x-001\n    kind: capability\n    status: built\n    conformance: [cap-x-001]\n  - id: cap-x-002\n    kind: capability\n    status: defect\n  - id: cap-x-003\n    kind: capability\n    status: planned\n');
  write(root, 'scripts/big.js', '//\n'.repeat(19));      // 20 lines
  write(root, 'scripts/test-big.js', '//\n'.repeat(50)); // tests are not source
  gitInit(root).commit('init');
  let j = json(run('health.js', [d, '--json']).out);
  assert(j.notices.includes('capabilities: 1 of 2 existing pinned by tests; 1 planned or retired (context/spec)'), 'capability inventory notice counts built of existing');
  assert(j.issues.includes('capability defects (a test proved behaviour differs from spec): cap-x-002'), 'defect capabilities are issues');
  assert(j.issues.some(i => /^refactor discussion due: scripts\/big\.js is 20 lines \(over threshold, never discussed\)/.test(i)) && !j.issues.some(i => /test-big/.test(i)), 'a source file over refactorReviewLines with no acknowledgement is due');
  write(d, 'context/spec/_refactor-watch.json', JSON.stringify({ files: { 'scripts/big.js': { lines: 20, date: '2026-11-01' } } }));
  j = json(run('health.js', [d, '--json']).out);
  assert(!j.issues.some(i => /refactor discussion due/.test(i)), 'an acknowledged file is not due');
  write(root, 'scripts/big.js', '//\n'.repeat(29));      // 30 lines > 20 * 1.25
  j = json(run('health.js', [d, '--json']).out);
  assert(j.issues.some(i => /scripts\/big\.js is 30 lines \(grew past 25 \(acknowledged at 20 on 2026-11-01\)\)/.test(i)), 'growth past refactorReviewGrowthPct makes it due again');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-validate
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-validate-001
{
  assert(run('validate.js', []).code === 0 && /--strict/.test(run('validate.js', []).out), 'validate with no args prints usage, exit 0');
  assert(run('validate.js', [path.join(TMP, 'nope')]).code === 2, 'validate on a missing dir exits 2');
  const ok = run('validate.js', [project(mkdir('validate-ok'))]);
  assert(ok.code === 0 && /Project is clean\./.test(ok.out), 'clean project → "Project is clean.", exit 0');
  const bad = project(mkdir('validate-bad'));
  fs.rmSync(path.join(bad, 'history.md'));
  const adv = run('validate.js', [bad]);
  assert(adv.code === 0 && /1 issue found\./.test(adv.out) && /Advisory mode/.test(adv.out), 'advisory mode reports and exits 0');
  const strict = run('validate.js', [bad, '--strict']);
  assert(strict.code === 1 && /Strict mode — exiting 1\./.test(strict.out), '--strict exits 1 on any issue');
}

// @covers cap-sess-validate-002
{
  const d = project(mkdir('validate-checks'), { next: '' });
  fs.rmSync(path.join(d, 'history.md'));
  write(d, 'engineering-requirements.md', '# Eng\n\n## Release\n\nTarget: [RELEASE]\nDocs mention `[PLACEHOLDER]` syntax.\n> TODO: write this\n');
  const r = run('validate.js', [d]);
  assert(/WARN {2}history\.md is missing — create it with: sdk-doc append history\.md/.test(r.err), 'missing required file names the fix command');
  assert(/engineering-requirements\.md in section 'Release' has unfilled placeholder on line 5/.test(r.err), 'placeholders report file, section and line');
  assert(!/line 6/.test(r.err) && /line 7/.test(r.err), 'placeholders inside inline code are ignored; "> TODO:" is a placeholder');
  assert(/current-status\.md section 'Next Agent To Activate' is empty/.test(r.err), 'an empty required section is reported');
  const d2 = project(mkdir('validate-nosection'));
  write(d2, 'current-status.md', read(d2, 'current-status.md').replace('## Active Missions', '## Missions'));
  assert(/current-status\.md is missing required section 'Active Missions'/.test(run('validate.js', [d2]).err), 'a missing required section is reported');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-gate-check (CLO+CISO placeholder/status rules are cap-sdk-gate-001 in sdk-core)
// ═════════════════════════════════════════════════════════════════════════════

function gateProject(name, o = {}) {
  const d = project(mkdir(name), {
    product: o.product !== undefined ? o.product : `# Product\n\n- [ ] Checkout flow\n\n${NON_GOALS}`,
    engineering: o.engineering !== undefined ? o.engineering : `# Engineering\n\n${NON_GOALS}`,
    history: o.history !== undefined ? o.history : '# History\n\n## Release v2026.Q4.1\n**Made by:** Coordinator\n\n## Mario Gate — irreversible review\n**Made by:** Mario\n**Status:** COMPLETED\n',
    sdkrc: o.sdkrc,
  });
  write(d, 'compliance-requirements.md', filledCompliance());
  if (o.preMortem !== false) write(d, 'pre-mortem.md', PRE_MORTEM(o.pm || {}));
  return d;
}

// @covers cap-sess-gate-001
{
  const h = run('gate-check.js', ['--help']);
  assert(h.code === 0 && /--pre-mortem/.test(h.out) && /--all/.test(h.out), 'gate-check --help lists --mario, --pre-mortem, --all');
  const ok = run('gate-check.js', [gateProject('gate-mario-ok'), '--mario']);
  assert(ok.code === 0 && /GATE CLEARED/.test(ok.out) && /✓ {2}Mario \(Chief Engineer\) sign-off: Logged/.test(ok.out) && /—  Discovery gate \(not checked\)/.test(ok.out) && /Sprint 1 can now start\./.test(ok.out), '--mario clears on a COMPLETED Mario Gate entry and skips discovery');
  const cleared = run('gate-check.js', [gateProject('gate-mario-cleared', { history: '# H\n\n## Mario Gate\nStatus: CLEARED\n' }), '--mario']);
  assert(cleared.code === 0, 'Status: CLEARED also clears the Mario gate');
  const none = run('gate-check.js', [gateProject('gate-mario-none', { history: '# H\n\n## Release\n**Made by:** CEO\n' }), '--mario']);
  assert(none.code === 1 && /Mario gate sign-off not found in history\.md/.test(none.err) && /Sprint 1 cannot start until this gate is cleared\./.test(none.err), 'no Mario Gate entry blocks Sprint 1');
  const pend = run('gate-check.js', [gateProject('gate-mario-pend', { history: '# H\n\n## Mario Gate\n**Status:** In review\n' }), '--mario']);
  assert(pend.code === 1 && /Mario gate status is "In review" — must be COMPLETED/.test(pend.err), 'a non-COMPLETED Mario status blocks');
  const nostat = run('gate-check.js', [gateProject('gate-mario-nostat', { history: '# H\n\n## Mario Gate\nlooked at it\n' }), '--mario']);
  assert(nostat.code === 0 && /WARNING: Mario Gate entry found in history\.md but no Status field detected/.test(nostat.err), 'a Mario Gate entry without Status warns but does not block');
}

// @covers cap-sess-gate-002
{
  const one = run('gate-check.js', [gateProject('gate-ng-one', { product: '# Product\n\n## Explicit Non-Goals\n\n- Only one exclusion here\n  - sub-bullet does not count\n- [What adjacent problem we ignore]\n' }), '--mario']);
  assert(one.code === 1 && /Explicit Non-Goals section in product-requirements\.md has 1 item\(s\) — minimum 2 required/.test(one.err), 'non-goals need ≥2 top-level non-placeholder items');
  const missing = run('gate-check.js', [gateProject('gate-ng-missing', { engineering: '# Eng\n\nNo section.\n' }), '--mario']);
  assert(missing.code === 1 && /Explicit Non-Goals section missing in engineering-requirements\.md/.test(missing.err), '--mario requires non-goals in engineering-requirements.md');
  const d = gateProject('gate-ng-discovery');
  write(d, 'compliance-requirements.md', filledCompliance().replace(/## Explicit Non-Goals[\s\S]*?(?=\n---|\n## )/, '## Explicit Non-Goals\n\n- [What adjacent problem we are deliberately ignoring and why]\n'));
  const disc = run('gate-check.js', [d]);
  assert(disc.code === 1 && /Explicit Non-Goals section in compliance-requirements\.md has 0 item\(s\)/.test(disc.err) && /CTO cannot be activated/.test(disc.err), 'the discovery gate requires non-goals in compliance-requirements.md');
}

// @covers cap-sess-gate-003
{
  const ok = run('gate-check.js', [gateProject('gate-pm-ok'), '--pre-mortem']);
  assert(ok.code === 0 && /✓ {2}Pre-mortem: Reviewed by Owner/.test(ok.out) && /—  Mario gate \(not checked\)/.test(ok.out), '--pre-mortem clears a complete, Owner-reviewed pre-mortem');
  const none = run('gate-check.js', [gateProject('gate-pm-none', { preMortem: false }), '--pre-mortem']);
  assert(none.code === 1 && /Pre-mortem section not found/.test(none.err) && /Sprint 1 cannot start until the pre-mortem gate is cleared\./.test(none.err), 'missing pre-mortem blocks');
  const weak = run('gate-check.js', [gateProject('gate-pm-weak', { pm: { failureModes: 2, participants: 'PM', reviewed: false } }), '--pre-mortem']);
  assert(weak.code === 1 && /Section 1 has 2 failure mode\(s\) — minimum 3 required/.test(weak.err), 'fewer than 3 failure modes blocks');
  assert(/has 1 participant\(s\) — minimum 2/.test(weak.err) && /Owner has not reviewed the pre-mortem/.test(weak.err), 'one participant and an unchecked Owner review block');
  const inProduct = gateProject('gate-pm-product', { preMortem: false });
  fs.appendFileSync(path.join(inProduct, 'product-requirements.md'), '\n' + PRE_MORTEM().replace('# Pre-mortem\n\n', ''));
  assert(run('gate-check.js', [inProduct, '--pre-mortem']).code === 0, 'a Pre-Mortem section inside product-requirements.md also counts');
}

// @covers cap-sess-gate-004
{
  const ok = run('gate-check.js', [gateProject('gate-all'), '--all']);
  assert(ok.code === 0 && /✓ {2}CLO \(Legal\) \+ CISO \(Security\): Done/.test(ok.out) && /Mario \(Chief Engineer\) sign-off: Logged/.test(ok.out) && /Pre-mortem: Reviewed by Owner/.test(ok.out), '--all runs discovery, Mario and pre-mortem gates');
  const bad = run('gate-check.js', [gateProject('gate-all-bad', { preMortem: false, history: '# H\n\n## R\n**Made by:** CEO\n' }), '--all']);
  assert(bad.code === 1 && /1\. /.test(bad.err) && /2\. /.test(bad.err) && /Mario gate sign-off not found/.test(bad.err) && /Pre-mortem section not found/.test(bad.err), '--all lists every failure, numbered');
  const content = gateProject('gate-content', { history: '# H\n\n## R\n**Made by:** CEO\n', sdkrc: { type: 'content' } });
  const c = run('gate-check.js', [content, '--mario']);
  assert(c.code === 0 && /—  Mario gate \(not required for this project type\)/.test(c.out), 'project type from .sdkrc decides which gates apply (content: no Mario gate)');
  const cd = run('gate-check.js', [content]);
  assert(cd.code === 0 && /✓ {2}CLO \(Legal\): Done/.test(cd.out) && !/CISO \(Security\): Done/.test(cd.out), 'content type requires only the CLO pre-CTO gate');
  const miss = run('gate-check.js', [path.join(TMP, 'nope')]);
  assert(miss.code === 1 && /Project directory not found/.test(miss.err), 'a missing project dir blocks with exit 1');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-ops
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-ops-001
{
  const h = run('ops.js', []);
  assert(h.code === 0 && /Available checks: decision-deadlines/.test(h.out), 'ops with no args prints usage and the check list, exit 0');
  const l = run('ops.js', [TMP, '--list']);
  const names = l.out.split('\n').map(s => s.trim()).filter(Boolean);
  assert(l.code === 0 && names.length === 14 && names.includes('clo-ciso-gate') && names.includes('bu-aggregation-assist'), '--list prints the 14 registered checks');
  const d = project(mkdir('ops'), { waiting: '- [ ] Legal review | Since: 2020-01-01' });
  const one = run('ops.js', [d, '--check', 'waiting-on-age', '--json']);
  const j = json(one.out);
  assert(j && j.results.length === 1 && j.results[0].name === 'waiting-on-age' && j.results[0].status === 'fail' && /Waiting On item stale \(\d+h\): Legal review/.test(j.issues[0]) && one.code === 1, '--check runs one check; --json emits {results,issues,notices}; issues → exit 1');
  const fresh = project(mkdir('ops-fresh'), { waiting: '- [ ] Legal review | Since: 2999-01-01' });
  assert(run('ops.js', [fresh, '--check', 'waiting-on-age']).code === 0, 'no issues → exit 0');
  const all = run('ops.js', [d]);
  assert(/sdk-ops — 14 checks on /.test(all.out) && /✗ waiting-on-age/.test(all.out) && /check\(s\) with issues/.test(all.out), 'default runs every check with a ✓/✗ line each');
}

// @covers cap-sess-ops-002
{
  const d = mkdir('ops-template');
  write(d, 'current-status.md', tmpl('current-status.md'));
  const j = json(run('ops.js', [d, '--check', 'session-close-validation', '--json']).out);
  // DEFECT: the template's own headings are "## Completed Since Last Session" and
  // "## Open Decisions (not yet logged to history.md)"; the check wants exact names, so a
  // freshly scaffolded project always fails session-close validation.
  assert(j.issues.includes('Missing required section: Completed') && j.issues.includes('Missing required section: Open Decisions'), 'DEFECT: session-close-validation rejects the template\'s own headings');
  assert(!j.issues.includes('Missing required section: Active Missions') && !j.issues.some(i => /Last updated/.test(i)), 'the sections/fields that do match are accepted');
}

// @covers cap-sess-ops-003
{
  const d = mkdir('ops-clo');
  write(d, 'compliance-requirements.md', filledCompliance());
  assert(run('gate-check.js', [d]).code === 0, 'precondition: sdk-gate-check clears this compliance file');
  const j = json(run('ops.js', [d, '--check', 'clo-ciso-gate', '--json']).out);
  // DEFECT: clo-ciso-gate looks for "CLO ...: Done"; the template's Gate Status table has no colon,
  // so sdk-ops (and the Night Watch CLO agent) report both gates not Done when sdk-gate-check clears.
  assert(j.issues.includes('CLO gate not Done — CTO cannot activate') && j.issues.includes('CISO gate not Done — CTO cannot activate'), 'DEFECT: ops clo-ciso-gate disagrees with sdk-gate-check');
}

// @covers cap-sess-ops-004
{
  const r = run('ops.js', [project(mkdir('ops-unknown')), '--check', 'bogus']);
  // DEFECT: an unknown check is an issue (exit 1) but the summary line still says "All checks passed".
  assert(r.code === 1 && /\? bogus/.test(r.out) && /Unknown check: bogus/.test(r.out) && /✓ All checks passed \(1 issues/.test(r.out), 'DEFECT: unknown --check prints "All checks passed" while exiting 1');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-daemon (Night Watch)
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-daemon-001
{
  const h = run('daemon.js', []);
  assert(h.code === 0 && /Agents: coordinator, cto, clo/.test(h.out), 'daemon with no project prints usage with the agent list, exit 0');
  const d = project(mkdir('daemon'));
  assert(/Night Watch not initialized/.test(run('daemon.js', [d, '--status']).out), '--status before --init says not initialized');
  const i = run('daemon.js', [d, '--init']);
  const st = json(read(d, 'agent-state.json'));
  assert(i.code === 0 && st && st.schemaVersion === '1.0' && ['coordinator', 'cto', 'clo'].every(r => st[r] && st[r].status === 'idle' && st[r].lastRun === null), '--init writes agent-state.json with every agent idle');
  assert(fs.existsSync(path.join(d, 'agent-drafts')) && /cron="17 \*\/2 \* \* \*" prompt="Run: node scripts\/daemon\.js .* --run coordinator"/.test(i.out), '--init creates agent-drafts/ and prints CronCreate prompts');
  assert(run('daemon.js', [d]).code === 1 && /--run requires a role name/.test(run('daemon.js', [d, '--run']).err) && /Unknown agent role: nobody/.test(run('daemon.js', [d, '--run', 'nobody']).err), 'no mode, missing role, or unknown role → exit 1');
}

// @covers cap-sess-daemon-002
{
  const d = project(mkdir('daemon-run'), { waiting: '- [ ] Legal review | Since: 2020-01-01' });
  run('daemon.js', [d, '--init']);
  const r1 = run('daemon.js', [d, '--run', 'coordinator']);
  const today = new Date().toISOString().slice(0, 10);
  const draft = path.join(d, 'agent-drafts', `coordinator-${today}.md`);
  assert(r1.code === 0 && fs.existsSync(draft) && /^---\nrole: coordinator\n/.test(fs.readFileSync(draft, 'utf8')), '--run writes agent-drafts/<role>-<date>.md with frontmatter');
  const body = fs.readFileSync(draft, 'utf8');
  assert(/# Coordinator health sweep — /.test(body) && /\*\*Trigger:\*\* files changed: current-status\.md/.test(body) && /## Issues Found\n\n- Waiting On item stale/.test(body) && /## Recommended Actions/.test(body), 'the draft records trigger, issues, and recommended actions from the role\'s checks');
  const r2 = run('daemon.js', [d, '--run', 'coordinator']);
  assert(/coordinator: no changes detected, skipping/.test(r2.out), 'a second run with no watched-file change is skipped');
  const events = read(d, 'agent-events.jsonl').trim().split('\n').map(json);
  assert(events.length === 2 && events[0].event === 'run-complete' && events[0].issuesFound >= 1 && events[1].event === 'skip-no-change', 'agent-events.jsonl records run-complete then skip-no-change');
  const s = run('daemon.js', [d, '--status']);
  assert(/coordinator +idle +last run /.test(s.out) && /cto +idle +never run/.test(s.out) && /Recent Events:/.test(s.out) && /Drafts \(1 files\):/.test(s.out), '--status shows agent states, recent events and drafts');
  const fresh = project(mkdir('daemon-noinit'));
  run('daemon.js', [fresh, '--run', 'cto']);
  assert(fs.existsSync(path.join(fresh, 'agent-state.json')) && /state-reconstructed/.test(read(fresh, 'agent-events.jsonl')), '--run without state reconstructs it and logs state-reconstructed');
}

// @covers cap-sess-daemon-003
{
  const d = project(mkdir('daemon-stuck'));
  run('daemon.js', [d, '--init']);
  const st = json(read(d, 'agent-state.json'));
  st.coordinator.status = 'working'; st.coordinator.startedAt = new Date(Date.now() - 10 * 60000).toISOString();
  st.cto.status = 'working'; st.cto.startedAt = new Date().toISOString();
  write(d, 'agent-state.json', JSON.stringify(st));
  const r = run('daemon.js', [d, '--run', 'coordinator']);
  assert(/coordinator: \d+ issues/.test(r.out) && /"event":"recovery","reason":"stuck-timeout"/.test(read(d, 'agent-events.jsonl')), 'an agent working past the stuck timeout is recovered and runs');
  assert(/cto: already working, skipping/.test(run('daemon.js', [d, '--run', 'cto']).out), 'an agent working within the timeout is not re-entered');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-consult
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-consult-001
{
  const all = json(run('consult.js', ['--list-roles']).out);
  assert(Array.isArray(all) && all.length > 20 && all.every(r => r.key && r.title && r.domain && r.group) && all.some(r => r.key === 'cto'), '--list-roles prints a JSON array of {key,title,domain,group}');
  const strat = json(run('consult.js', ['--list-roles', '--group', 'strategic']).out);
  assert(strat.length > 0 && strat.length < all.length && strat.every(r => r.group === 'strategic'), '--group filters by group');
  const bogus = json(run('consult.js', ['--list-roles', '--group', 'no-such-group']).out);
  assert(bogus.length === all.length, 'an unknown --group falls back to the full list');
}

// @covers cap-sess-consult-002
{
  assert(json(run('consult.js', ['--suggest', 'Is this GDPR compliant?']).out).suggestedRole === 'clo', '--suggest routes a GDPR question to the CLO');
  assert(json(run('consult.js', ['--suggest', 'what database should we use for scale?']).out).suggestedRole === 'cto', '--suggest routes a database question to the CTO');
  const s = run('consult.js', ['--suggest']);
  assert(s.code === 1 && /Usage: --suggest/.test(s.err), '--suggest without a question exits 1');
  const info = json(run('consult.js', ['--role-info', 'cto']).out);
  assert(info && info.key === 'cto' && fs.existsSync(info.filePath) && info.capability && info.capability.answers && info.hasConsultation === true, '--role-info prints role metadata with capability and role file path');
  const unk = run('consult.js', ['--role-info', 'nobody']);
  assert(unk.code === 1 && /Unknown role: nobody/.test(unk.err), '--role-info unknown role exits 1');
}

// @covers cap-sess-consult-003
{
  const r = run('consult.js', ['--role', 'cto', '--question', 'Which DB?']);
  const j = json(r.out);
  assert(r.code === 0 && j && j.question === 'Which DB?' && j.role.key === 'cto' && j.roleError === null && j.context.available === false, '--role --question prints a consultation payload; no project → context unavailable');
  assert(/^FROM: Owner\nTO: CTO\n/.test(j.busTrace) && /TAG: CONSULTATION/.test(j.busTrace), 'payload carries a Bus-format trace');
  const cp = project(mkdir('consult'));
  const raw = json(run('consult.js', ['--role', 'cto', '--question', 'x', '--project', cp]).out);
  assert(raw.context.available === false && /Context index not found/.test(raw.context.indexError), 'without generated context files, project context is unavailable and says why');
  run('doc.js', ['manifest', cp]); run('doc.js', ['index', cp]);
  const p = json(run('consult.js', ['--role', 'cto', '--question', 'x', '--project', cp]).out);
  assert(p.context.available === true && p.context.release === 'v2026.Q4.1' && p.relevantFiles.includes('engineering-requirements.md'), '--project loads project context and role-relevant files');
  const u = json(run('consult.js', ['--role', 'nobody', '--question', 'x']).out);
  assert(u.role === null && /Unknown role: 'nobody'/.test(u.roleError), 'unknown --role is reported in roleError (exit 0)');
  const usage = run('consult.js', []);
  assert(usage.code === 0 && /Usage:/.test(usage.out), 'no args prints usage, exit 0');
}

// ═════════════════════════════════════════════════════════════════════════════
// sdk-memory (store lives under $HOME/.team-sdk/memory — HOME is the temp dir here)
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-sess-memory-001
{
  const d = mkdir('memory-proj');
  write(d, 'history.md', '# History\n\n## [DECISION] Use Postgres for storage\n**Date:** 2026-10-01\n**Made by:** CTO\n**Rationale:** Relational data and auth needs.\n\n## Kill: mobile pod\n**Date:** 2026-10-05\n**Made by:** CEO\nFRAMING_WRONG — users are on desktop\n');
  assert(/No projects ingested yet/.test(run('memory.js', ['list']).out), 'list on an empty corpus says so');
  const i1 = run('memory.js', ['ingest', d]);
  assert(i1.code === 0 && /Added: 2, Skipped: 0, Total corpus: 2/.test(i1.out), 'ingest adds decisions and kills from history.md');
  assert(/Added: 0, Skipped: 2, Total corpus: 2/.test(run('memory.js', ['ingest', d]).out), 're-ingest is idempotent');
  assert(fs.existsSync(path.join(HOME, '.team-sdk', 'memory', 'decisions.json')) && fs.existsSync(path.join(HOME, '.team-sdk', 'memory', 'kill-log.md')), 'the corpus is written under $HOME/.team-sdk/memory');
  const st = run('memory.js', ['stats']).out;
  assert(/Memory Corpus: 2 entries across 1 project/.test(st) && /By type: decision: 1, kill: 1/.test(st), 'stats summarises entries by type and project');
  assert(new RegExp(`${path.basename(d)} — 2 entries`).test(run('memory.js', ['list']).out), 'list shows ingested projects with entry counts');
  assert(/Found 1 match/.test(run('memory.js', ['query', 'postgres']).out) && /No matches found\./.test(run('memory.js', ['query', 'zzqqxx']).out), 'query searches the corpus');
  assert(/1 decision:/.test(run('memory.js', ['decisions']).out), 'decisions lists decisions');
  assert(/1 kill:/.test(run('memory.js', ['kills', '--class', 'FRAMING_WRONG']).out) && /0 kills:/.test(run('memory.js', ['kills', '--class', 'SCOPE_OBSOLETE']).out), 'kills filters by --class');
  assert(run('memory.js', ['query']).code === 1 && run('memory.js', ['ingest']).code === 1, 'query/ingest without an argument exit 1');
  assert(/sdk-memory — Cross-project decision corpus/.test(run('memory.js', []).out), 'no command prints help');
}

// ─── Done ────────────────────────────────────────────────────────────────────

console.log(`  session capabilities: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
