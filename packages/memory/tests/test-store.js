'use strict';

const { createMemoryStore } = require('../src/store');
const { mkdirSync, rmSync, existsSync, readFileSync } = require('fs');
const path = require('path');
const os = require('os');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// Use a temp directory for tests
const testStoreDir = path.join(os.tmpdir(), `team-sdk-memory-test-${Date.now()}`);

function cleanup() {
  try { rmSync(testStoreDir, { recursive: true, force: true }); } catch {}
}

// Clean before
cleanup();

// --- createMemoryStore ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  assert(existsSync(testStoreDir), 'store creates directory');
  eq(store.getStoreDir(), testStoreDir, 'getStoreDir returns correct path');
}

// --- stats on empty store ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const stats = store.stats();
  eq(stats.totalEntries, 0, 'empty store has 0 entries');
  eq(stats.projectCount, 0, 'empty store has 0 projects');
}

// --- listProjects on empty store ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const projects = store.listProjects();
  eq(projects.length, 0, 'empty store has no projects');
}

// --- ingestKill ---
{
  cleanup();
  const store = createMemoryStore({ storeDir: testStoreDir });
  const result = store.ingestKill({
    project: 'test-project',
    date: '2026-04-17',
    summary: 'Killed auth pod',
    killClass: 'FRAMING_WRONG',
    assumption: 'Users want SSO',
    madeBy: 'Owner',
  });
  eq(result.added, 1, 'ingestKill adds 1 entry');

  const stats = store.stats();
  eq(stats.totalEntries, 1, 'store has 1 entry after kill ingest');
  eq(stats.byType.kill, 1, 'store has 1 kill');
}

// --- ingestKill duplicate ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const result = store.ingestKill({
    project: 'test-project',
    date: '2026-04-17',
    summary: 'Killed auth pod',
    killClass: 'FRAMING_WRONG',
  });
  assert(result.added === 0, 'duplicate kill not added');
  assert(result.duplicate === true, 'duplicate flag set');
}

// --- ingestKill with invalid entry ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const result = store.ingestKill({
    project: 'x',
    date: 'bad-date',
    summary: 'test',
    killClass: 'INVALID',
  });
  eq(result.added, 0, 'invalid kill not added');
  assert(result.errors && result.errors.length > 0, 'errors returned for invalid kill');
}

// --- query ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const results = store.query('auth');
  assert(results.length >= 1, 'query finds auth-related entries');
  assert(results[0].summary.includes('auth'), 'query result matches');
}

// --- query no results ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const results = store.query('xyznonexistent');
  eq(results.length, 0, 'query with no match returns empty');
}

// --- getKills ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const kills = store.getKills();
  assert(kills.length >= 1, 'getKills returns kills');
  assert(kills.every(k => k.type === 'kill'), 'all are kills');
}

// --- getKills with filter ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const kills = store.getKills({ killClass: 'SCOPE_OBSOLETE' });
  eq(kills.length, 0, 'getKills with non-matching class returns empty');
}

// --- kill-log.md generation ---
{
  const killMdPath = path.join(testStoreDir, 'kill-log.md');
  assert(existsSync(killMdPath), 'kill-log.md generated');
  const content = readFileSync(killMdPath, 'utf8');
  assert(content.includes('Kill Log'), 'kill-log.md has title');
  assert(content.includes('FRAMING_WRONG'), 'kill-log.md has kill class');
  assert(content.includes('test-project'), 'kill-log.md has project name');
}

// --- index.json generation ---
{
  const indexPath = path.join(testStoreDir, 'index.json');
  assert(existsSync(indexPath), 'index.json generated');
  const index = JSON.parse(readFileSync(indexPath, 'utf8'));
  eq(index.version, '1.0', 'index version is 1.0');
  assert(index.totalEntries >= 1, 'index has entries');
  assert(index.projects['test-project'] !== undefined, 'index has project');
}

// --- ingest from real project (team-sdk itself) ---
{
  cleanup();
  const store = createMemoryStore({ storeDir: testStoreDir });
  const sdkProjectDir = path.resolve(__dirname, '../../../');
  // team-sdk has project/history.md
  const result = store.ingest(sdkProjectDir);
  assert(result.added > 0, `ingest from team-sdk added entries (got ${result.added})`);
  assert(result.total > 0, 'total corpus has entries');

  // Verify we can query the real data
  const archResults = store.query('architecture');
  assert(archResults.length > 0, 'query "architecture" finds results from team-sdk');

  const stats = store.stats();
  assert(stats.projects.includes('team-sdk'), 'stats includes team-sdk project');
}

// --- idempotent ingest ---
{
  const store = createMemoryStore({ storeDir: testStoreDir });
  const before = store.stats().totalEntries;
  const sdkProjectDir = path.resolve(__dirname, '../../../');
  const result = store.ingest(sdkProjectDir);
  eq(result.added, 0, 'second ingest adds 0 (idempotent)');
  eq(result.total, before, 'total unchanged after idempotent ingest');
}

// Cleanup
cleanup();

console.log(`  test-store: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
