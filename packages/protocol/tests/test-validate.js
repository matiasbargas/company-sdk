'use strict';

/**
 * Contract test suite for validateBusMessage.
 * Valid passes, invalid fails with correct error, schema edge cases.
 */

const { validateBusMessage } = require('../src/validate');

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

console.log('\n  test-validate.js');

// ── Valid INFO message (from PM — no SOLUTION_CLASS required) ───────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    message: 'Status update.',
  });
  assert(result.valid === true, 'Valid INFO: passes');
  assert(result.errors.length === 0, 'Valid INFO: no errors');
}

// ── Valid INFO message from CTO (with SOLUTION_CLASS) ───────────────────
{
  const result = validateBusMessage({
    from: 'CTO',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    solutionClass: 'KNOWN',
    message: 'Status update.',
  });
  assert(result.valid === true, 'Valid INFO from CTO with SC: passes');
}

// ── Valid DECISION NEEDED ───────────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'CEO',
    release: 'v2026.Q2.2',
    priority: 'DECISION NEEDED',
    message: 'Should we defer?',
    decisionBy: '2026-04-20',
    escalation: 'CEO',
  });
  assert(result.valid === true, 'Valid DECISION NEEDED: passes');
}

// ── DECISION NEEDED missing decisionBy ─────────────────────────────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'CEO',
    release: 'v2026.Q2.2',
    priority: 'DECISION NEEDED',
    message: 'Should we defer?',
    escalation: 'CEO',
  });
  assert(result.valid === false, 'DECISION NEEDED missing decisionBy: fails');
  assert(result.errors.some(e => e.includes('DECISION BY')), 'DECISION NEEDED missing decisionBy: correct error');
}

// ── DECISION NEEDED missing escalation ─────────────────────────────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'CEO',
    release: 'v2026.Q2.2',
    priority: 'DECISION NEEDED',
    message: 'Should we defer?',
    decisionBy: '2026-04-20',
  });
  assert(result.valid === false, 'DECISION NEEDED missing escalation: fails');
  assert(result.errors.some(e => e.includes('ESCALATION')), 'DECISION NEEDED missing escalation: correct error');
}

// ── BLOCKER missing escalation ──────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'Engineer',
    to: 'CTO',
    release: 'v2026.Q2.2',
    priority: 'BLOCKER',
    message: 'Blocked on dependency.',
  });
  assert(result.valid === false, 'BLOCKER missing escalation: fails');
  assert(result.errors.some(e => e.includes('ESCALATION')), 'BLOCKER missing escalation: correct error');
}

// ── Missing required fields ─────────────────────────────────────────────
{
  const r1 = validateBusMessage({});
  assert(r1.valid === false, 'Empty object: fails');

  const r2 = validateBusMessage({ from: 'CTO' });
  assert(r2.valid === false, 'Only from: fails');

  const r3 = validateBusMessage(null);
  assert(r3.valid === false, 'null: fails');

  const r4 = validateBusMessage('string');
  assert(r4.valid === false, 'string: fails');
}

// ── Invalid release format ──────────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'CTO',
    to: 'ALL',
    release: '2026-Q2-1',
    priority: 'INFO',
    message: 'Bad release.',
  });
  assert(result.valid === false, 'Bad release format: fails');
  assert(result.errors.some(e => e.includes('vYYYY.QN.N')), 'Bad release format: correct error');
}

// ── Invalid priority ────────────────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'CTO',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'URGENT',
    message: 'Bad priority.',
  });
  assert(result.valid === false, 'Bad priority: fails');
  assert(result.errors.some(e => e.includes('priority')), 'Bad priority: correct error');
}

// ── Invalid solutionClass ───────────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'CTO',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    solutionClass: 'MAYBE',
    message: 'Bad SC.',
  });
  assert(result.valid === false, 'Bad solutionClass: fails');
}

// ── SOLUTION_CLASS required for CTO ─────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'CTO',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    message: 'Missing SC from CTO.',
  });
  assert(result.valid === false, 'CTO without SOLUTION_CLASS: fails');
  assert(result.errors.some(e => e.includes('SOLUTION_CLASS required')), 'CTO without SC: correct error');
}

// ── SOLUTION_CLASS required for Mario ───────────────────────────────────
{
  const result = validateBusMessage({
    from: 'Mario (Chief Engineer)',
    to: 'CTO',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    message: 'Missing SC from Mario.',
  });
  assert(result.valid === false, 'Mario without SOLUTION_CLASS: fails');
}

// ── SOLUTION_CLASS NOT required for PM ──────────────────────────────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'ALL',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    message: 'PM does not need SC.',
  });
  assert(result.valid === true, 'PM without SOLUTION_CLASS: passes');
}

// ── FRAMING-CHALLENGE with INFO forbidden ───────────────────────────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'CEO',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    tags: ['FRAMING-CHALLENGE'],
    message: 'Challenge.',
    solutionClass: '',
  });
  assert(result.valid === false, 'FRAMING-CHALLENGE with INFO: fails');
  assert(result.errors.some(e => e.includes('FRAMING-CHALLENGE')), 'FRAMING-CHALLENGE with INFO: correct error');
}

// ── RATCHET-CANDIDATE requires INFO ─────────────────────────────────────
{
  const r1 = validateBusMessage({
    from: 'Mario (Chief Engineer)',
    to: 'CTO',
    release: 'v2026.Q2.2',
    priority: 'INFO',
    solutionClass: 'KNOWN',
    tags: ['RATCHET-CANDIDATE'],
    message: 'Ratchet flag.',
  });
  assert(r1.valid === true, 'RATCHET-CANDIDATE with INFO: passes');

  const r2 = validateBusMessage({
    from: 'Mario (Chief Engineer)',
    to: 'CTO',
    release: 'v2026.Q2.2',
    priority: 'BLOCKER',
    solutionClass: 'KNOWN',
    tags: ['RATCHET-CANDIDATE'],
    message: 'Ratchet flag.',
    escalation: 'CEO',
  });
  assert(r2.valid === false, 'RATCHET-CANDIDATE with BLOCKER: fails');
}

// ── Invalid decisionBy format ───────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'PM',
    to: 'CEO',
    release: 'v2026.Q2.2',
    priority: 'DECISION NEEDED',
    message: 'When?',
    decisionBy: 'next Tuesday',
    escalation: 'CEO',
  });
  assert(result.valid === false, 'Bad decisionBy format: fails');
}

// ── allErrors option ────────────────────────────────────────────────────
{
  const result = validateBusMessage({
    from: 'CTO',
    to: 'ALL',
    release: 'bad-release',
    priority: 'WRONG',
    message: 'Multiple errors.',
  }, { allErrors: true });
  assert(result.valid === false, 'allErrors: fails');
  assert(result.errors.length >= 2, `allErrors: returns multiple errors (got ${result.errors.length})`);
}

console.log(`  ${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
