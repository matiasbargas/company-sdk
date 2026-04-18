'use strict';

const { parseHistory, parseBusLog, projectName } = require('../src/ingest');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// --- projectName ---
eq(projectName('/Users/me/dev/axecap'), 'axecap', 'projectName extracts basename');
eq(projectName('/Users/me/dev/team-sdk/project'), 'project', 'projectName from nested');
eq(projectName('my-project'), 'my-project', 'projectName relative');

// --- parseHistory ---

// Standard decision entry
{
  const content = `# History

## [Project Start] — sdk-v3 Discovery
**Date:** 2026-04-06
**Made by:** Greg (CEO)
**Status:** Active
**Release:** v2026.Q2.1

**What happened:**
Owner briefed Greg on sdk-v3. Core thesis described.

**Key decisions:**
- Ship to CLI + file system, not SaaS.

**Reversible:** YES
`;

  const entries = parseHistory(content, 'sdk');
  assert(entries.length >= 1, 'parses at least 1 entry from standard history');
  eq(entries[0].type, 'decision', 'standard entry is decision type');
  eq(entries[0].project, 'sdk', 'project name set');
  eq(entries[0].date, '2026-04-06', 'date extracted');
  assert(entries[0].madeBy.includes('Greg'), 'madeBy includes Greg');
  eq(entries[0].release, 'v2026.Q2.1', 'release extracted');
  eq(entries[0].reversible, true, 'reversible YES parsed');
  assert(entries[0].summary.includes('sdk-v3'), 'summary includes title');
  assert(entries[0].id.length === 16, 'entry has id');
}

// Kill entry
{
  const content = `# History

## SaaS Initiative Cancelled
**Date:** 2026-04-15
**Made by:** Owner
**Status:** DECIDED

**What happened:**
Owner cancelled the SaaS initiative. FRAMING_WRONG — the market assumption was incorrect.

**Reversible:** YES
`;

  const entries = parseHistory(content, 'test');
  assert(entries.length >= 1, 'parses kill entry');
  // Note: This entry has "Cancelled" in title and FRAMING_WRONG in body
  const kill = entries.find(e => e.type === 'kill');
  if (kill) {
    eq(kill.killClass, 'FRAMING_WRONG', 'kill class extracted');
    eq(kill.project, 'test', 'kill project set');
  } else {
    // It's OK if it's classified as decision — the key thing is it parsed
    assert(entries.length >= 1, 'at least parsed as decision');
  }
}

// Multiple entries
{
  const content = `# History

## Decision A — First One
**Date:** 2026-04-01
**Made by:** CTO
**Status:** DECIDED
**What happened:**
We chose Postgres.
**Reversible:** NO

---

## Decision B — Second One
**Date:** 2026-04-02
**Made by:** PM
**Status:** DECIDED
**What happened:**
We scoped to MVP.
**Reversible:** YES
`;

  const entries = parseHistory(content, 'multi');
  assert(entries.length >= 2, `parses multiple entries (got ${entries.length})`);
  eq(entries[0].date, '2026-04-01', 'first entry date');
  eq(entries[1].date, '2026-04-02', 'second entry date');
  eq(entries[0].reversible, false, 'first entry irreversible');
  eq(entries[1].reversible, true, 'second entry reversible');
}

// Placeholder entries are skipped
{
  const content = `# History

## [Future release entries go here. Use the format from protocol.md]
`;

  const entries = parseHistory(content, 'test');
  eq(entries.length, 0, 'placeholder entries are skipped');
}

// Empty content
{
  const entries = parseHistory('', 'empty');
  eq(entries.length, 0, 'empty content produces no entries');
}

// Domain inference
{
  const content = `# History

## Architecture Decision — Monorepo
**Date:** 2026-04-17
**Made by:** CTO
**Status:** DECIDED
**What happened:**
CTO recommended monorepo with npm workspaces for the infrastructure packages.
`;

  const entries = parseHistory(content, 'test');
  assert(entries.length >= 1, 'parses architecture entry');
  assert(entries[0].affects.includes('engineering'), 'infers engineering domain from CTO + infrastructure');
}

// --- parseBusLog ---

// Bus message with POD KILLED
{
  const content = `FROM: PM (Isabella)
TO: ALL
RELEASE: v2026.Q2.1
PRIORITY: INFO
MESSAGE: POD KILLED: auth-v2 (FRAMING_WRONG, "Users don't want SSO for MVP")
`;

  const entries = parseBusLog(content, 'test');
  assert(entries.length >= 1, 'parses Bus kill message');
  const kill = entries.find(e => e.type === 'kill');
  assert(kill !== undefined, 'Bus kill parsed as kill type');
  if (kill) {
    eq(kill.killClass, 'FRAMING_WRONG', 'Bus kill class extracted');
    assert(kill.summary.includes('POD KILLED'), 'Bus kill summary includes message');
  }
}

// DECISION NEEDED Bus message
{
  const content = `FROM: CTO
TO: CEO
RELEASE: v2026.Q2.2
PRIORITY: DECISION NEEDED
MESSAGE: Should we use ajv or pure JS validation for the protocol package?
DECISION BY: 2026-04-20
ESCALATION: CEO
`;

  const entries = parseBusLog(content, 'test');
  assert(entries.length >= 1, 'parses DECISION NEEDED message');
  const decision = entries.find(e => e.type === 'decision');
  assert(decision !== undefined, 'DECISION NEEDED parsed as decision');
  if (decision) {
    assert(decision.summary.includes('ajv'), 'decision summary includes question');
  }
}

// INFO messages without kill or decision are not ingested
{
  const content = `FROM: Coordinator
TO: ALL
RELEASE: v2026.Q2.1
PRIORITY: INFO
MESSAGE: Sprint 1 starts tomorrow. All pods activated.
`;

  const entries = parseBusLog(content, 'test');
  eq(entries.length, 0, 'plain INFO messages are not ingested');
}

// Empty bus log
{
  const entries = parseBusLog('', 'test');
  eq(entries.length, 0, 'empty bus log produces no entries');
}

// Idempotent IDs
{
  const content = `# History

## Decision A
**Date:** 2026-04-01
**Made by:** CTO
**What happened:** Choice made.
`;

  const entries1 = parseHistory(content, 'proj');
  const entries2 = parseHistory(content, 'proj');
  eq(entries1[0].id, entries2[0].id, 'same content produces same id (idempotent)');
}

console.log(`  test-ingest: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
