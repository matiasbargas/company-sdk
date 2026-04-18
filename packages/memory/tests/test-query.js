'use strict';

const { queryEntries, filterEntries, getDecisions, getKills, getChallenges, corpusStats } = require('../src/query');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// Sample corpus
const ENTRIES = [
  { id: 'a1', type: 'decision', project: 'axecap', date: '2026-04-10', summary: 'Use Postgres for portfolio data', rationale: 'Relational model fits investment tracking', madeBy: 'CTO', reversible: true, affects: ['engineering'], tags: ['architecture'], release: 'v2026.Q2.1' },
  { id: 'a2', type: 'decision', project: 'axecap', date: '2026-04-11', summary: 'MIT license for all packages', rationale: 'Standard open source license', madeBy: 'CLO', reversible: false, affects: ['legal'], tags: [], release: 'v2026.Q2.1' },
  { id: 'b1', type: 'decision', project: 'profit', date: '2026-04-12', summary: 'Monorepo with npm workspaces', rationale: 'Single CI pipeline', madeBy: 'CTO', reversible: true, affects: ['engineering'], tags: ['infrastructure'], release: 'v2026.Q2.2' },
  { id: 'b2', type: 'kill', project: 'profit', date: '2026-04-13', summary: 'Killed auth-v2 pod', killClass: 'FRAMING_WRONG', assumption: 'Users want SSO', madeBy: 'Owner', affects: ['product', 'security'], tags: [], release: 'v2026.Q2.2' },
  { id: 'c1', type: 'challenge', project: 'nuchain', date: '2026-04-14', summary: 'Mario challenged CTO on parser approach', challenger: 'Mario', outcome: 'accepted', madeBy: 'Mario', affects: ['engineering'], tags: [], release: 'v2026.Q2.2' },
  { id: 'c2', type: 'decision', project: 'nuchain', date: '2026-04-15', summary: 'Arbitrum for chain deployment', rationale: 'Lower gas fees, sufficient security', madeBy: 'CTO', reversible: false, affects: ['engineering', 'strategy'], tags: ['blockchain'], release: 'v2026.Q2.1' },
];

// --- queryEntries (keyword search) ---

// Basic keyword match
{
  const results = queryEntries(ENTRIES, 'postgres');
  assert(results.length >= 1, 'postgres query finds results');
  eq(results[0].id, 'a1', 'postgres query returns correct entry');
}

// Multi-word query
{
  const results = queryEntries(ENTRIES, 'monorepo npm');
  assert(results.length >= 1, 'monorepo npm query finds results');
  eq(results[0].id, 'b1', 'monorepo query returns correct entry');
}

// No match
{
  const results = queryEntries(ENTRIES, 'xyznonexistent');
  eq(results.length, 0, 'non-matching query returns empty');
}

// Empty query returns all (no filter)
{
  const results = queryEntries(ENTRIES, '');
  eq(results.length, ENTRIES.length, 'empty query returns all entries');
}

// Query with project filter
{
  const results = queryEntries(ENTRIES, 'CTO', { project: 'axecap' });
  assert(results.every(r => r.project === 'axecap'), 'project filter limits to axecap');
  assert(results.length >= 1, 'finds CTO decisions in axecap');
}

// Query with type filter
{
  const results = queryEntries(ENTRIES, '', { type: 'kill' });
  eq(results.length, 1, 'type kill filter returns 1 entry');
  eq(results[0].id, 'b2', 'type filter returns correct kill');
}

// Query with limit
{
  const results = queryEntries(ENTRIES, '', { limit: 2 });
  eq(results.length, 2, 'limit caps results');
}

// Query with domain filter
{
  const results = queryEntries(ENTRIES, '', { domain: 'legal' });
  eq(results.length, 1, 'domain filter returns legal entries');
  eq(results[0].id, 'a2', 'domain filter returns MIT license entry');
}

// Query with reversible filter
{
  const results = queryEntries(ENTRIES, '', { reversible: false });
  assert(results.length >= 2, 'irreversible filter returns multiple entries');
  assert(results.every(r => r.reversible === false), 'all results are irreversible');
}

// Query with date range
{
  const results = queryEntries(ENTRIES, '', { dateFrom: '2026-04-13', dateTo: '2026-04-14' });
  eq(results.length, 2, 'date range filter returns correct count');
}

// Query with release filter
{
  const results = queryEntries(ENTRIES, '', { release: 'v2026.Q2.2' });
  assert(results.length >= 3, 'release filter returns Q2.2 entries');
  assert(results.every(r => r.release === 'v2026.Q2.2'), 'all results match release');
}

// Summary match gets higher score
{
  const results = queryEntries(ENTRIES, 'arbitrum');
  eq(results[0].id, 'c2', 'summary match ranks higher');
}

// --- filterEntries ---
{
  const results = filterEntries(ENTRIES, { project: 'profit' });
  assert(results.length >= 2, 'filterEntries by project');
  assert(results.every(r => r.project === 'profit'), 'all filtered to profit');
}

// --- getDecisions ---
{
  const results = getDecisions(ENTRIES);
  assert(results.length === 4, `getDecisions returns only decisions (got ${results.length})`);
  assert(results.every(r => r.type === 'decision'), 'all are decisions');
}

{
  const results = getDecisions(ENTRIES, { madeBy: 'CTO' });
  assert(results.length >= 2, 'getDecisions filtered by CTO');
  assert(results.every(r => r.madeBy.includes('CTO')), 'all made by CTO');
}

// --- getKills ---
{
  const results = getKills(ENTRIES);
  eq(results.length, 1, 'getKills returns 1 kill');
  eq(results[0].killClass, 'FRAMING_WRONG', 'kill has correct class');
}

{
  const results = getKills(ENTRIES, { killClass: 'SCOPE_OBSOLETE' });
  eq(results.length, 0, 'getKills with non-matching class returns empty');
}

// --- getChallenges ---
{
  const results = getChallenges(ENTRIES);
  eq(results.length, 1, 'getChallenges returns 1 challenge');
  eq(results[0].challenger, 'Mario', 'challenge by Mario');
}

// --- corpusStats ---
{
  const stats = corpusStats(ENTRIES);
  eq(stats.totalEntries, 6, 'stats total entries');
  eq(stats.projectCount, 3, 'stats project count');
  assert(stats.projects.includes('axecap'), 'stats includes axecap');
  assert(stats.projects.includes('profit'), 'stats includes profit');
  assert(stats.projects.includes('nuchain'), 'stats includes nuchain');
  eq(stats.byType.decision, 4, 'stats 4 decisions');
  eq(stats.byType.kill, 1, 'stats 1 kill');
  eq(stats.byType.challenge, 1, 'stats 1 challenge');
  eq(stats.dateRange.earliest, '2026-04-10', 'stats earliest date');
  eq(stats.dateRange.latest, '2026-04-15', 'stats latest date');
}

// Empty corpus stats
{
  const stats = corpusStats([]);
  eq(stats.totalEntries, 0, 'empty corpus stats');
  eq(stats.projectCount, 0, 'empty corpus project count');
  eq(stats.dateRange, null, 'empty corpus no date range');
}

console.log(`  test-query: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
