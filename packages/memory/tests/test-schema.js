'use strict';

const { validateEntry, normalizeEntry, entryId, ENTRY_TYPES, KILL_CLASSES, CHALLENGE_OUTCOMES } = require('../src/schema');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

// --- ENTRY_TYPES ---
assert(ENTRY_TYPES.includes('decision'), 'ENTRY_TYPES includes decision');
assert(ENTRY_TYPES.includes('kill'), 'ENTRY_TYPES includes kill');
assert(ENTRY_TYPES.includes('challenge'), 'ENTRY_TYPES includes challenge');
eq(ENTRY_TYPES.length, 3, 'ENTRY_TYPES has 3 types');

// --- KILL_CLASSES ---
assert(KILL_CLASSES.includes('FRAMING_WRONG'), 'KILL_CLASSES includes FRAMING_WRONG');
assert(KILL_CLASSES.includes('SCOPE_OBSOLETE'), 'KILL_CLASSES includes SCOPE_OBSOLETE');
assert(KILL_CLASSES.includes('PRIORITY_SHIFT'), 'KILL_CLASSES includes PRIORITY_SHIFT');
assert(KILL_CLASSES.includes('EXECUTION_STALLED'), 'KILL_CLASSES includes EXECUTION_STALLED');
eq(KILL_CLASSES.length, 4, 'KILL_CLASSES has 4 classes');

// --- CHALLENGE_OUTCOMES ---
assert(CHALLENGE_OUTCOMES.includes('accepted'), 'CHALLENGE_OUTCOMES includes accepted');
assert(CHALLENGE_OUTCOMES.includes('overridden'), 'CHALLENGE_OUTCOMES includes overridden');

// --- validateEntry ---

// Valid decision
{
  const errors = validateEntry({
    type: 'decision', project: 'test', date: '2026-04-17', summary: 'Use monorepo',
  });
  eq(errors.length, 0, 'valid decision has no errors');
}

// Missing required fields
{
  const errors = validateEntry({});
  assert(errors.length > 0, 'empty object has errors');
  assert(errors.some(e => e.includes('type')), 'missing type error');
  assert(errors.some(e => e.includes('project')), 'missing project error');
  assert(errors.some(e => e.includes('date')), 'missing date error');
  assert(errors.some(e => e.includes('summary')), 'missing summary error');
}

// Invalid type
{
  const errors = validateEntry({ type: 'nonsense', project: 'x', date: '2026-01-01', summary: 's' });
  assert(errors.some(e => e.includes('type')), 'invalid type error');
}

// Invalid date format
{
  const errors = validateEntry({ type: 'decision', project: 'x', date: 'April 17', summary: 's' });
  assert(errors.some(e => e.includes('date')), 'invalid date format error');
}

// Kill without killClass
{
  const errors = validateEntry({ type: 'kill', project: 'x', date: '2026-01-01', summary: 'killed pod' });
  assert(errors.some(e => e.includes('killClass')), 'kill without killClass has error');
}

// Valid kill
{
  const errors = validateEntry({
    type: 'kill', project: 'x', date: '2026-01-01', summary: 'killed pod', killClass: 'FRAMING_WRONG',
  });
  eq(errors.length, 0, 'valid kill has no errors');
}

// Challenge without challenger
{
  const errors = validateEntry({ type: 'challenge', project: 'x', date: '2026-01-01', summary: 'challenge' });
  assert(errors.some(e => e.includes('challenger')), 'challenge without challenger has error');
}

// Valid challenge
{
  const errors = validateEntry({
    type: 'challenge', project: 'x', date: '2026-01-01', summary: 'challenge',
    challenger: 'Mario', outcome: 'accepted',
  });
  eq(errors.length, 0, 'valid challenge has no errors');
}

// Invalid outcome
{
  const errors = validateEntry({
    type: 'challenge', project: 'x', date: '2026-01-01', summary: 'c',
    challenger: 'Mario', outcome: 'ignored',
  });
  assert(errors.some(e => e.includes('outcome')), 'invalid outcome has error');
}

// Optional typed fields validation
{
  const errors = validateEntry({
    type: 'decision', project: 'x', date: '2026-01-01', summary: 's',
    madeBy: 123,
  });
  assert(errors.some(e => e.includes('madeBy')), 'non-string madeBy has error');
}

{
  const errors = validateEntry({
    type: 'decision', project: 'x', date: '2026-01-01', summary: 's',
    affects: 'engineering',
  });
  assert(errors.some(e => e.includes('affects')), 'non-array affects has error');
}

{
  const errors = validateEntry({
    type: 'decision', project: 'x', date: '2026-01-01', summary: 's',
    reversible: 'yes',
  });
  assert(errors.some(e => e.includes('reversible')), 'non-boolean reversible has error');
}

// --- entryId ---
{
  const id1 = entryId({ project: 'a', date: '2026-01-01', summary: 'test' });
  const id2 = entryId({ project: 'a', date: '2026-01-01', summary: 'test' });
  eq(id1, id2, 'same input produces same id (deterministic)');
  eq(id1.length, 16, 'id is 16 chars');
}

{
  const id1 = entryId({ project: 'a', date: '2026-01-01', summary: 'test' });
  const id2 = entryId({ project: 'b', date: '2026-01-01', summary: 'test' });
  assert(id1 !== id2, 'different project produces different id');
}

// --- normalizeEntry ---
{
  const entry = normalizeEntry({ type: 'decision', project: 'x', date: '2026-01-01', summary: 's' });
  assert(typeof entry.id === 'string' && entry.id.length === 16, 'normalizeEntry adds id');
  assert(Array.isArray(entry.affects), 'normalizeEntry defaults affects to []');
  assert(Array.isArray(entry.tags), 'normalizeEntry defaults tags to []');
  assert(typeof entry.ingestedAt === 'string', 'normalizeEntry adds ingestedAt');
}

// Non-object entry
{
  const errors = validateEntry(null);
  assert(errors.length > 0, 'null entry has errors');
  assert(errors[0].includes('object'), 'null entry says must be object');
}

{
  const errors = validateEntry('string');
  assert(errors.length > 0, 'string entry has errors');
}

console.log(`  test-schema: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
