'use strict';

/**
 * Contract test suite for parseBusMessage.
 * Mario condition: every field, every priority, malformed input, edge cases.
 */

const { parseBusMessage, buildBusMessage } = require('../src/bus-parser');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) {
    passed++;
  } else {
    failed++;
    console.error(`  FAIL: ${label}`);
  }
}

function eq(a, b, label) {
  const match = JSON.stringify(a) === JSON.stringify(b);
  if (!match) {
    console.error(`  FAIL: ${label}\n    expected: ${JSON.stringify(b)}\n    got:      ${JSON.stringify(a)}`);
    failed++;
  } else {
    passed++;
  }
}

console.log('\n  test-bus-parser.js');

// ── Complete INFO message ──────────────────────────────────────────────────
{
  const raw = `FROM: Tariq Bishkek (CTO)
TO: ALL
RELEASE: v2026.Q2.2
PRIORITY: INFO
SOLUTION_CLASS: KNOWN
MESSAGE:
  Architecture brief complete. Protocol schema extraction approved.`;

  const msg = parseBusMessage(raw);
  eq(msg.from, 'Tariq Bishkek (CTO)', 'INFO: from');
  eq(msg.to, 'ALL', 'INFO: to');
  eq(msg.release, 'v2026.Q2.2', 'INFO: release');
  eq(msg.priority, 'INFO', 'INFO: priority');
  eq(msg.solutionClass, 'KNOWN', 'INFO: solutionClass');
  assert(msg.message.includes('Architecture brief complete'), 'INFO: message body');
}

// ── DECISION NEEDED with all fields ─────────────────────────────────────
{
  const raw = `FROM: PM
TO: CEO
RELEASE: v2026.Q2.2
PRIORITY: DECISION NEEDED
TAG: FRAMING-CHALLENGE
COST_SIGNAL: HIGH
TIME_SIGNAL: 48h
MESSAGE:
  Should we defer the knowledge graph to next cycle?
  Option A: defer and ship protocol-only.
  Option B: ship both, accept timeline risk.
DECISION BY: 2026-04-20
ESCALATION: CEO`;

  const msg = parseBusMessage(raw);
  eq(msg.from, 'PM', 'DECISION NEEDED: from');
  eq(msg.to, 'CEO', 'DECISION NEEDED: to');
  eq(msg.priority, 'DECISION NEEDED', 'DECISION NEEDED: priority');
  eq(msg.tags, ['FRAMING-CHALLENGE'], 'DECISION NEEDED: tags');
  eq(msg.costSignal, 'HIGH', 'DECISION NEEDED: costSignal');
  eq(msg.timeSignal, '48h', 'DECISION NEEDED: timeSignal');
  eq(msg.decisionBy, '2026-04-20', 'DECISION NEEDED: decisionBy');
  eq(msg.escalation, 'CEO', 'DECISION NEEDED: escalation');
  assert(msg.message.includes('Option A'), 'DECISION NEEDED: message includes options');
}

// ── BLOCKER ──────────────────────────────────────────────────────────────
{
  const raw = `FROM: Engineer
TO: CTO
RELEASE: v2026.Q2.2
PRIORITY: BLOCKER
SOLUTION_CLASS: HYBRID
MESSAGE:
  doc.js extraction blocked. Circular dependency between manifest generation and context loading.
ESCALATION: Mario`;

  const msg = parseBusMessage(raw);
  eq(msg.priority, 'BLOCKER', 'BLOCKER: priority');
  eq(msg.solutionClass, 'HYBRID', 'BLOCKER: solutionClass');
  eq(msg.escalation, 'Mario', 'BLOCKER: escalation');
  assert(msg.message.includes('Circular dependency'), 'BLOCKER: message body');
}

// ── Multiple tags ─────────────────────────────────────────────────────────
{
  const raw = `FROM: Mario (Chief Engineer)
TO: CTO
RELEASE: v2026.Q2.2
PRIORITY: INFO
TAG: RATCHET-CANDIDATE, SDK-CHANGE
MESSAGE:
  Observed exploratory reasoning on a known sorting problem.`;

  const msg = parseBusMessage(raw);
  eq(msg.tags, ['RATCHET-CANDIDATE', 'SDK-CHANGE'], 'Multiple tags parsed');
}

// ── Empty / malformed input ──────────────────────────────────────────────
{
  const msg1 = parseBusMessage('');
  eq(msg1.from, '', 'Empty string: from is empty');
  eq(msg1.message, '', 'Empty string: message is empty');

  const msg2 = parseBusMessage(null);
  eq(msg2.from, '', 'null input: returns empty fields');

  const msg3 = parseBusMessage(undefined);
  eq(msg3.from, '', 'undefined input: returns empty fields');

  const msg4 = parseBusMessage(42);
  eq(msg4.from, '', 'number input: returns empty fields');
}

// ── Missing optional fields ─────────────────────────────────────────────
{
  const raw = `FROM: Coordinator
TO: ALL
RELEASE: v2026.Q2.2
PRIORITY: INFO
MESSAGE:
  Status update.`;

  const msg = parseBusMessage(raw);
  eq(msg.solutionClass, '', 'Missing SOLUTION_CLASS: empty string');
  eq(msg.tags, [], 'Missing TAG: empty array');
  eq(msg.costSignal, '', 'Missing COST_SIGNAL: empty string');
  eq(msg.timeSignal, '', 'Missing TIME_SIGNAL: empty string');
  eq(msg.decisionBy, '', 'Missing DECISION BY: empty string');
  eq(msg.escalation, '', 'Missing ESCALATION: empty string');
}

// ── Multi-line message body ──────────────────────────────────────────────
{
  const raw = `FROM: CTO
TO: PM
RELEASE: v2026.Q2.2
PRIORITY: INFO
MESSAGE:
  Line one of the message.
  Line two continues.
  Line three ends.`;

  const msg = parseBusMessage(raw);
  assert(msg.message.includes('Line one'), 'Multi-line: first line');
  assert(msg.message.includes('Line three'), 'Multi-line: last line');
}

// ── buildBusMessage round-trip ──────────────────────────────────────────
{
  const fields = {
    from: 'CTO',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    solutionClass: 'KNOWN',
    tags: ['SDK-CHANGE'],
    message: 'Test round-trip.',
  };
  const built = buildBusMessage(fields);
  const parsed = parseBusMessage(built);
  eq(parsed.from, 'CTO', 'Round-trip: from');
  eq(parsed.to, 'ALL', 'Round-trip: to');
  eq(parsed.release, 'v2026.Q2.2', 'Round-trip: release');
  eq(parsed.priority, 'INFO', 'Round-trip: priority');
  eq(parsed.solutionClass, 'KNOWN', 'Round-trip: solutionClass');
  eq(parsed.tags, ['SDK-CHANGE'], 'Round-trip: tags');
  assert(parsed.message.includes('Test round-trip'), 'Round-trip: message');
}

console.log(`  ${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
