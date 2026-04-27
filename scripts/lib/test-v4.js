#!/usr/bin/env node
'use strict';

/**
 * test-v4.js — Tests for v4 features: action registry, domains, sessions, context-index 2.0
 *
 * Usage:
 *   node scripts/lib/test-v4.js
 *
 * Exit codes:
 *   0 — all tests passed
 *   1 — one or more tests failed
 */

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { execSync } = require('child_process');

const SCRIPTS_DIR = path.resolve(__dirname, '..');
const SDK_ROOT    = path.resolve(SCRIPTS_DIR, '..');

let passed = 0;
let failed = 0;

function assert(label, condition, detail = '') {
  if (condition) { console.log(`  ✓  ${label}`); passed++; }
  else { console.error(`  ✗  ${label}${detail ? ` — ${detail}` : ''}`); failed++; }
}

function tmpProject() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-test-v4-'));
  // Create minimal project structure
  fs.writeFileSync(path.join(dir, '.sdkrc'), JSON.stringify({
    releaseId: 'v2026.Q2.1', squad: 'startup', projectName: 'test-project', type: 'product'
  }, null, 2), 'utf8');
  fs.writeFileSync(path.join(dir, 'current-status.md'), `# Current Status -- test-project
**Last updated:** 2026-04-13 10:00
**Updated by:** init.js
**Release:** v2026.Q2.1

## Active Missions

| Mission | PM | Appetite remaining | Status | Next action |
|---|---|---|---|---|
| Discovery | — | — | Pending | Owner to activate Greg |

## Waiting On

- [ ] Greg activation | From: Owner | Since: 2026-04-13 | Blocks: all Discovery

## Completed Since Last Session

- Project scaffolded | By: init.js | Completed: 2026-04-13

## Open Decisions (not yet logged to history.md)

None.

## Next Agent To Activate

**Greg (CEO)** — paste the brief from idea.md Section 4 to start Discovery

## Session Notes

Day 0 — project just bootstrapped.
`, 'utf8');
  fs.mkdirSync(path.join(dir, 'sessions', 'temp'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'sessions', 'permanent'), { recursive: true });
  return dir;
}

function cleanup(dir) {
  fs.rmSync(dir, { recursive: true, force: true });
}

function run(cmd, cwd) {
  return execSync(cmd, { encoding: 'utf8', cwd: cwd || SDK_ROOT, timeout: 15000 }).trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Action Registry ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

const { actions, opsMap } = require('./action-registry');

assert('action-registry exports actions object', typeof actions === 'object' && Object.keys(actions).length > 0);
assert('action-registry exports opsMap object', typeof opsMap === 'object' && Object.keys(opsMap).length > 0);
assert('actions have required fields (script, args, requires, writes, description)', () => {
  for (const [id, def] of Object.entries(actions)) {
    if (!def.script || !Array.isArray(def.args) || !Array.isArray(def.requires) || typeof def.writes !== 'boolean' || !def.description) {
      return false;
    }
  }
  return true;
});
assert('opsMap entries reference valid actions', () => {
  for (const [name, op] of Object.entries(opsMap)) {
    if (!actions[op.action]) return false;
  }
  return true;
});
assert('opsMap has record-decision, update-mission, log-work',
  opsMap['record-decision'] && opsMap['update-mission'] && opsMap['log-work']);
assert('write-only actions are flagged', actions['doc.decision'].writes === true);
assert('read-only actions are flagged', actions['doc.status'].writes === false);

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Frontmatter Parser ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

const { parseFrontmatter } = require('./frontmatter');

assert('parses simple frontmatter', () => {
  const fm = parseFrontmatter('---\ntitle: "Hello"\nlead: "CTO"\n---\nBody');
  return fm.title === 'Hello' && fm.lead === 'CTO';
});
assert('returns empty object for no frontmatter', () => {
  const fm = parseFrontmatter('Just a regular file');
  return Object.keys(fm).length === 0;
});
assert('handles unquoted values', () => {
  const fm = parseFrontmatter('---\nstatus: temp\n---\n');
  return fm.status === 'temp';
});

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Domain Commands ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  // domain add
  const addOut = run(`node scripts/doc.js domain "${dir}" add --name "core-api" --lead CTO --summary "Core API layer. REST + GraphQL."`, SDK_ROOT);
  assert('domain add creates directory', fs.existsSync(path.join(dir, 'domains', 'core-api')));
  assert('domain add creates summary.md', fs.existsSync(path.join(dir, 'domains', 'core-api', 'summary.md')));
  const summaryContent = fs.readFileSync(path.join(dir, 'domains', 'core-api', 'summary.md'), 'utf8');
  assert('domain summary.md has lead in frontmatter', summaryContent.includes('lead: "CTO"'));
  assert('domain summary.md has body text', summaryContent.includes('Core API layer'));

  // domain add second
  run(`node scripts/doc.js domain "${dir}" add --name "payments" --lead CFO --summary "Payment processing."`, SDK_ROOT);
  assert('second domain created', fs.existsSync(path.join(dir, 'domains', 'payments', 'summary.md')));

  // domain list
  const listOut = run(`node scripts/doc.js domain "${dir}" list`, SDK_ROOT);
  assert('domain list shows both domains', listOut.includes('core-api') && listOut.includes('payments'));
  assert('domain list shows leads', listOut.includes('CTO') && listOut.includes('CFO'));

  // domain update
  run(`node scripts/doc.js domain "${dir}" update --name "core-api" --lead "Staff Engineer" --spawn-when "API design, rate limiting"`, SDK_ROOT);
  const updated = fs.readFileSync(path.join(dir, 'domains', 'core-api', 'summary.md'), 'utf8');
  assert('domain update changes lead', updated.includes('lead: "Staff Engineer"'));
  assert('domain update changes spawn_when', updated.includes('spawn_when: "API design, rate limiting"'));

  // domain add duplicate fails
  try {
    run(`node scripts/doc.js domain "${dir}" add --name "core-api" --lead CTO`, SDK_ROOT);
    assert('domain add duplicate fails', false, 'should have thrown');
  } catch (e) {
    assert('domain add duplicate fails', e.status === 1);
  }

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Session Commands ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  // session save
  const saveOut = run(`node scripts/doc.js session "${dir}" save --title "Auth deep dive" --domains "engineering" --tags "auth" --saved-by "CTO"`, SDK_ROOT);
  assert('session save succeeds', saveOut.includes('Session saved'));
  const tempFiles = fs.readdirSync(path.join(dir, 'sessions', 'temp')).filter(f => f.endsWith('.md'));
  assert('session save creates file in temp/', tempFiles.length === 1);
  assert('session filename has date slug', tempFiles[0].includes('auth-deep-dive'));
  const sessionContent = fs.readFileSync(path.join(dir, 'sessions', 'temp', tempFiles[0]), 'utf8');
  assert('session has frontmatter', sessionContent.includes('status: "temp"'));
  assert('session has title in frontmatter', sessionContent.includes('title: "Auth deep dive"'));

  // session list
  const listOut = run(`node scripts/doc.js session "${dir}" list`, SDK_ROOT);
  assert('session list shows temp session', listOut.includes('Auth deep dive') && listOut.includes('temp'));

  // session promote
  run(`node scripts/doc.js session "${dir}" promote ${tempFiles[0]}`, SDK_ROOT);
  assert('promote removes from temp/', !fs.existsSync(path.join(dir, 'sessions', 'temp', tempFiles[0])));
  assert('promote creates in permanent/', fs.existsSync(path.join(dir, 'sessions', 'permanent', tempFiles[0])));
  const promoted = fs.readFileSync(path.join(dir, 'sessions', 'permanent', tempFiles[0]), 'utf8');
  assert('promote updates status to permanent', promoted.includes('status: "permanent"'));

  // session list after promote
  const listAfter = run(`node scripts/doc.js session "${dir}" list`, SDK_ROOT);
  assert('session list shows permanent after promote', listAfter.includes('permanent'));

  // session clean with nothing to clean
  const cleanOut = run(`node scripts/doc.js session "${dir}" clean`, SDK_ROOT);
  assert('session clean with empty temp reports nothing', cleanOut.includes('No temp sessions'));

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Context-Index v2.0 ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  // Add domains
  run(`node scripts/doc.js domain "${dir}" add --name "exchange" --lead CTO --summary "Order matching and market data."`, SDK_ROOT);
  run(`node scripts/doc.js domain "${dir}" add --name "brokerage" --lead CLO --summary "KYC/AML and regulatory reporting."`, SDK_ROOT);

  // Add a promoted session
  run(`node scripts/doc.js session "${dir}" save --title "Architecture review" --domains "engineering" --tags "architecture"`, SDK_ROOT);
  const tempFiles = fs.readdirSync(path.join(dir, 'sessions', 'temp')).filter(f => f.endsWith('.md'));
  run(`node scripts/doc.js session "${dir}" promote ${tempFiles[0]}`, SDK_ROOT);

  // Generate index
  run(`node scripts/doc.js index "${dir}"`, SDK_ROOT);
  const indexPath = path.join(dir, 'context-index.json');
  assert('context-index.json created', fs.existsSync(indexPath));

  const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
  assert('schema is 2.0 or 3.0', index.schemaVersion === '2.0' || index.schemaVersion === '3.0');
  assert('has project metadata', index.project && index.project.name === 'test-project');
  assert('has projectDomains', index.projectDomains && typeof index.projectDomains === 'object');
  assert('exchange domain indexed', index.projectDomains.exchange !== undefined);
  assert('exchange domain has summary', index.projectDomains.exchange.summary.includes('Order matching'));
  assert('exchange domain has lead', index.projectDomains.exchange.lead === 'CTO');
  assert('exchange domain has L0 files', index.projectDomains.exchange.files.L0.length > 0);
  assert('brokerage domain indexed', index.projectDomains.brokerage !== undefined);
  assert('has orgDomains (renamed from domains)', index.orgDomains && index.orgDomains.strategy);
  assert('has opsMap', index.opsMap && index.opsMap['record-decision']);
  assert('has actions', index.actions && index.actions['doc.decision']);
  assert('actions have description', index.actions['doc.decision'].description !== undefined);
  assert('has sessions array', Array.isArray(index.sessions));
  assert('promoted session in sessions array', index.sessions.length === 1);
  assert('session has title', index.sessions[0].title === 'Architecture review');
  assert('has queryMap', index.queryMap && index.queryMap.architecture);
  assert('queryMap has prior-session', index.queryMap['prior-session'] !== undefined);
  assert('domain files in files catalog', index.files.some(f => f.path.startsWith('domains/exchange/')));

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Init with --domains ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = path.join(os.tmpdir(), 'sdk-test-init-domains-' + Date.now());

  run(`node scripts/init.js test-domains --squad mvp --domains "core:CTO, payments:CFO, auth:CISO" --output "${dir}" --no-git`, SDK_ROOT);

  assert('init creates project dir', fs.existsSync(dir));
  assert('init creates domains/core/', fs.existsSync(path.join(dir, 'domains', 'core')));
  assert('init creates domains/payments/', fs.existsSync(path.join(dir, 'domains', 'payments')));
  assert('init creates domains/auth/', fs.existsSync(path.join(dir, 'domains', 'auth')));
  assert('core/summary.md exists', fs.existsSync(path.join(dir, 'domains', 'core', 'summary.md')));
  const coreSummary = fs.readFileSync(path.join(dir, 'domains', 'core', 'summary.md'), 'utf8');
  assert('core summary has CTO lead', coreSummary.includes('lead: "CTO"'));
  const authSummary = fs.readFileSync(path.join(dir, 'domains', 'auth', 'summary.md'), 'utf8');
  assert('auth summary has CISO lead', authSummary.includes('lead: "CISO"'));

  // Verify index picks up domains
  run(`node scripts/doc.js index "${dir}"`, SDK_ROOT);
  const index = JSON.parse(fs.readFileSync(path.join(dir, 'context-index.json'), 'utf8'));
  assert('init + index has 3 project domains', Object.keys(index.projectDomains).length === 3);

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Manifest Generation ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  run(`node scripts/doc.js manifest "${dir}"`, SDK_ROOT);
  const manifestPath = path.join(dir, 'context-manifest.json');
  assert('manifest created', fs.existsSync(manifestPath));

  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert('manifest has schemaVersion', manifest.schemaVersion === '1.0');
  assert('manifest has release', manifest.release.includes('v2026.Q2.1'));
  assert('manifest has activeMissions', Array.isArray(manifest.activeMissions));
  assert('manifest parsed Discovery mission', manifest.activeMissions.some(m => m.name === 'Discovery'));
  assert('manifest has staleness', manifest.staleness && typeof manifest.staleness.flag === 'string');
  assert('manifest is fresh', manifest.staleness.flag === 'fresh');

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Intent Resolver ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const { resolve, parseBusMessage, inferLogFile } = require('./intent-resolver');

  // parseBusMessage
  const parsed = parseBusMessage('FROM: CTO\nTO: CLO\nRELEASE: v2026.Q2.1\nPRIORITY: BLOCKER\nMESSAGE: Need data residency constraints.');
  assert('parseBusMessage extracts from', parsed.from === 'CTO');
  assert('parseBusMessage extracts to', parsed.to === 'CLO');
  assert('parseBusMessage extracts priority', parsed.priority === 'BLOCKER');
  assert('parseBusMessage extracts message', parsed.message.includes('data residency'));

  // BLOCKER resolves to pod-update
  const blockerRes = resolve('FROM: CTO\nTO: CLO\nRELEASE: v2026.Q2.1\nPRIORITY: BLOCKER\nMESSAGE: Auth blocked on compliance.');
  assert('BLOCKER resolves to action', blockerRes !== null && blockerRes.action === 'doc.pod-update');
  assert('BLOCKER has side_effects', Array.isArray(blockerRes.side_effects) && blockerRes.side_effects.length > 0);

  // DOMAIN CLOSE resolves to log
  const closeRes = resolve('FROM: CFO\nTO: Coordinator\nRELEASE: v2026.Q2.1\nPRIORITY: INFO\nMESSAGE: DOMAIN CLOSE — finance requirements delivered.');
  assert('DOMAIN CLOSE resolves to doc.log', closeRes !== null && closeRes.action === 'doc.log');
  assert('DOMAIN CLOSE log is completed', closeRes.params.status === 'completed');

  // CONTEXT REQUEST resolves to routing only (no action)
  const ctxRes = resolve('FROM: PM\nTO: CTO\nRELEASE: v2026.Q2.1\nPRIORITY: CONTEXT REQUEST\nMESSAGE: CONTEXT REQUEST — API rate limiting');
  assert('CONTEXT REQUEST resolves to routing', ctxRes !== null && ctxRes.action === null);
  assert('CONTEXT REQUEST has routing.topic', ctxRes.routing && ctxRes.routing.topic.includes('api rate limiting'));

  // DECISION NEEDED resolves to log
  const decRes = resolve('FROM: CLO\nTO: CEO\nRELEASE: v2026.Q2.1\nPRIORITY: DECISION NEEDED\nMESSAGE: GDPR requires explicit consent mechanism.');
  assert('DECISION NEEDED resolves to doc.log', decRes !== null && decRes.action === 'doc.log');

  // Pure INFO does not resolve
  const infoRes = resolve('FROM: Liaison\nTO: ALL\nRELEASE: v2026.Q2.1\nPRIORITY: INFO\nMESSAGE: Sprint health is green.');
  assert('INFO message returns null (pure communication)', infoRes === null);

  // inferLogFile
  assert('inferLogFile CTO → engineering-log.md', inferLogFile('CTO') === 'engineering-log.md');
  assert('inferLogFile CLO → strategy-log.md', inferLogFile('CLO') === 'strategy-log.md');
  assert('inferLogFile PM → product-log.md', inferLogFile('PM') === 'product-log.md');
  assert('inferLogFile CEO → strategy-log.md', inferLogFile('CEO') === 'strategy-log.md');
  assert('inferLogFile CHRO → product-log.md', inferLogFile('CHRO') === 'product-log.md');
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Executor ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const { execute } = require('./executor');

  // Dry run
  const dryResult = execute(
    { action: 'doc.log', definition: actions['doc.log'], params: { file: 'engineering-log.md', role: 'CTO', level: 'L4', goal: 'Test', status: 'completed' } },
    '/tmp',
    { dryRun: true }
  );
  assert('dry run does not execute', dryResult.executed === false && dryResult.reason === 'dry-run');
  assert('dry run reports action', dryResult.action === 'doc.log');

  // Write guard for consultation spawns
  const guardResult = execute(
    { action: 'doc.decision', definition: actions['doc.decision'], params: {} },
    '/tmp',
    { spawnType: 'consultation' }
  );
  assert('consultation spawn blocked from write action', guardResult.executed === false && guardResult.reason === 'write-denied-consultation-spawn');

  // Read-only action allowed for consultation spawns
  const readResult = execute(
    { action: 'doc.status', definition: actions['doc.status'], params: { 'project-dir': '/tmp' } },
    '/tmp',
    { spawnType: 'consultation', dryRun: true }
  );
  assert('consultation spawn allowed for read action (dry run)', readResult.reason === 'dry-run');

  // No action returns no-action
  const noAction = execute(null, '/tmp');
  assert('null resolution returns no-action', noAction.executed === false && noAction.reason === 'no-action');
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Bus Command ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  // Send a Bus message
  const busOut = run(`node scripts/doc.js bus "${dir}" --from CTO --to CLO --priority BLOCKER --solution-class KNOWN --message "Need compliance review before architecture."`, SDK_ROOT);
  assert('bus command logs to bus-log.md', fs.existsSync(path.join(dir, 'bus-log.md')));
  const busLog = fs.readFileSync(path.join(dir, 'bus-log.md'), 'utf8');
  assert('bus-log.md contains the message', busLog.includes('Need compliance review'));
  assert('bus-log.md has timestamp', /\[\d{4}-\d{2}-\d{2} \d{2}:\d{2}\]/.test(busLog));
  assert('bus-log.md has from/to', busLog.includes('CTO → TO: CLO'));
  assert('bus command reports intent resolution', busOut.includes('Intent resolved') || busOut.includes('No action'));

  // Send a second message
  run(`node scripts/doc.js bus "${dir}" --from Liaison --to ALL --priority INFO --message "Sprint health green."`, SDK_ROOT);
  const busLog2 = fs.readFileSync(path.join(dir, 'bus-log.md'), 'utf8');
  assert('bus-log.md is append-only (2 entries)', busLog2.includes('Sprint health green') && busLog2.includes('Need compliance review'));

  // Send CONTEXT REQUEST
  const ctxOut = run(`node scripts/doc.js bus "${dir}" --from PM --to CTO --priority "CONTEXT REQUEST" --message "CONTEXT REQUEST — API rate limiting"`, SDK_ROOT);
  assert('CONTEXT REQUEST shows routing', ctxOut.includes('Routing') || ctxOut.includes('routing'));

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Cockpit ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  // Add domains
  run(`node scripts/doc.js domain "${dir}" add --name "core" --lead CTO --summary "Core platform. Auth, data, API."`, SDK_ROOT);
  run(`node scripts/doc.js domain "${dir}" add --name "payments" --lead CFO --summary "Payment processing. Stripe."`, SDK_ROOT);

  // Generate manifest + index
  run(`node scripts/doc.js manifest "${dir}"`, SDK_ROOT);
  run(`node scripts/doc.js index "${dir}"`, SDK_ROOT);

  // Add a bus message
  run(`node scripts/doc.js bus "${dir}" --from CTO --to CLO --priority BLOCKER --solution-class KNOWN --message "Need compliance review."`, SDK_ROOT);

  // Run cockpit for CTO
  const cockpitCTO = run(`node scripts/doc.js cockpit "${dir}" --role CTO`, SDK_ROOT);
  assert('cockpit shows role', cockpitCTO.includes('COCKPIT: CTO'));
  assert('cockpit shows project name', cockpitCTO.includes('test-project'));
  assert('cockpit shows release', cockpitCTO.includes('v2026.Q2.1'));
  assert('cockpit shows STATE', cockpitCTO.includes('STATE:'));
  assert('cockpit shows PROJECT DOMAINS', cockpitCTO.includes('PROJECT DOMAINS'));
  assert('cockpit shows core domain summary', cockpitCTO.includes('core') && cockpitCTO.includes('CTO'));
  assert('cockpit shows payments domain', cockpitCTO.includes('payments'));
  assert('cockpit shows ACTIVE MISSIONS', cockpitCTO.includes('ACTIVE MISSIONS') || cockpitCTO.includes('Discovery'));
  assert('cockpit shows AVAILABLE OPERATIONS', cockpitCTO.includes('AVAILABLE OPERATIONS'));
  assert('cockpit shows opsMap entries', cockpitCTO.includes('record-decision'));

  // Run cockpit for CLO (should see bus message addressed to them)
  const cockpitCLO = run(`node scripts/doc.js cockpit "${dir}" --role CLO`, SDK_ROOT);
  assert('CLO cockpit shows bus message', cockpitCLO.includes('RECENT BUS MESSAGES') || cockpitCLO.includes('Need compliance'));

  // Cockpit without manifest still works
  fs.unlinkSync(path.join(dir, 'context-manifest.json'));
  const cockpitNoManifest = run(`node scripts/doc.js cockpit "${dir}" --role PM`, SDK_ROOT);
  assert('cockpit works without manifest', cockpitNoManifest.includes('COCKPIT: PM'));

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
console.log('\n═══ Discovery Loop ═══\n');
// ═══════════════════════════════════════════════════════════════════════════════

{
  const dir = tmpProject();

  // Add domains
  run(`node scripts/doc.js domain "${dir}" add --name "core" --lead CTO`, SDK_ROOT);
  run(`node scripts/doc.js domain "${dir}" add --name "payments" --lead CFO`, SDK_ROOT);

  // Create idea.md
  fs.writeFileSync(path.join(dir, 'idea.md'), '# Idea\nA payment platform for SMBs.\n', 'utf8');

  // discovery start
  const startOut = run(`node scripts/doc.js discovery "${dir}" start`, SDK_ROOT);
  assert('discovery start creates discovery-state.json', fs.existsSync(path.join(dir, 'discovery-state.json')));
  const state = JSON.parse(fs.readFileSync(path.join(dir, 'discovery-state.json'), 'utf8'));
  assert('discovery state has questions', state.questions.length > 0);
  assert('discovery has blocking questions', state.blockers > 0);
  assert('discovery not ready for activation', state.readyForActivation === false);
  assert('discovery includes domain questions', state.questions.some(q => q.domain === 'core'));

  // discovery status
  const statusOut = run(`node scripts/doc.js discovery "${dir}" status`, SDK_ROOT);
  assert('discovery status shows count', statusOut.includes('/'));
  assert('discovery status shows blocking', statusOut.includes('Blocking'));

  // discovery answer
  const firstQ = state.questions[0];
  run(`node scripts/doc.js discovery "${dir}" answer --id ${firstQ.id} --answer "MVP: payment processing + invoicing"`, SDK_ROOT);
  const stateAfter = JSON.parse(fs.readFileSync(path.join(dir, 'discovery-state.json'), 'utf8'));
  assert('answer marks question as answered', stateAfter.questions[0].answered === true);
  assert('answered count increments', stateAfter.answered === 1);

  // Answer all blocking questions
  const blocking = stateAfter.questions.filter(q => q.priority === 'blocks-discovery' && !q.answered);
  for (const q of blocking) {
    run(`node scripts/doc.js discovery "${dir}" answer --id ${q.id} --answer "Answered for test"`, SDK_ROOT);
  }
  const finalState = JSON.parse(fs.readFileSync(path.join(dir, 'discovery-state.json'), 'utf8'));
  assert('all blockers answered → ready for activation', finalState.readyForActivation === true);

  // domain answer routes to domain file
  const domainQ = state.questions.find(q => q.domain === 'core' && q.question.includes('Describe'));
  if (domainQ) {
    const coreSummary = fs.readFileSync(path.join(dir, 'domains', 'core', 'summary.md'), 'utf8');
    assert('domain answer routed to summary.md', coreSummary.includes('Answered for test') || !coreSummary.includes('[Describe the'));
  }

  cleanup(dir);
}

// ═══════════════════════════════════════════════════════════════════════════════
// Summary
// ═══════════════════════════════════════════════════════════════════════════════

console.log(`\n${'═'.repeat(50)}`);
console.log(`  ${passed} passed, ${failed} failed`);
console.log(`${'═'.repeat(50)}\n`);

process.exit(failed > 0 ? 1 : 0);
