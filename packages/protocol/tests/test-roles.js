'use strict';

/**
 * Contract test suite for roles.
 * Mario condition: test every role resolves — no silent fallthrough.
 */

const { ROLES, ROLE_GROUPS, ACTIVATION_ORDER, resolveRole, inferDomain, inferLogFile } = require('../src/roles');

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
  const match = a === b;
  if (!match) {
    console.error(`  FAIL: ${label}\n    expected: ${JSON.stringify(b)}\n    got:      ${JSON.stringify(a)}`);
    failed++;
  } else {
    passed++;
  }
}

console.log('\n  test-roles.js');

// ── Every role key resolves ─────────────────────────────────────────────
{
  const roleKeys = Object.keys(ROLES);
  assert(roleKeys.length >= 25, `At least 25 roles defined (got ${roleKeys.length})`);

  for (const key of roleKeys) {
    const resolved = resolveRole(key);
    assert(resolved !== null, `Role '${key}' resolves by key`);
    assert(resolved.domain && resolved.domain.length > 0, `Role '${key}' has a domain`);
    assert(resolved.logFile && resolved.logFile.endsWith('.md'), `Role '${key}' has a logFile`);
    assert(resolved.group && resolved.group.length > 0, `Role '${key}' has a group`);
    assert(resolved.bu && resolved.bu.length > 0, `Role '${key}' has a BU`);
  }
}

// ── Every role resolves by title ────────────────────────────────────────
{
  for (const [key, role] of Object.entries(ROLES)) {
    const resolved = resolveRole(role.title);
    assert(resolved !== null, `Role '${role.title}' resolves by title`);
    eq(resolved.key, key, `Role '${role.title}' resolves to correct key '${key}'`);
  }
}

// ── inferDomain matches ROLES data ──────────────────────────────────────
{
  for (const [key, role] of Object.entries(ROLES)) {
    eq(inferDomain(key), role.domain, `inferDomain('${key}') = '${role.domain}'`);
  }
}

// ── inferLogFile matches ROLES data ─────────────────────────────────────
{
  for (const [key, role] of Object.entries(ROLES)) {
    eq(inferLogFile(key), role.logFile, `inferLogFile('${key}') = '${role.logFile}'`);
  }
}

// ── Unknown role falls back to engineering ───────────────────────────────
{
  eq(inferDomain('unknown-role'), 'engineering', 'Unknown role domain fallback');
  eq(inferLogFile('unknown-role'), 'engineering-log.md', 'Unknown role logFile fallback');
}

// ── Null/empty input handling ───────────────────────────────────────────
{
  assert(resolveRole(null) === null, 'null resolves to null');
  assert(resolveRole('') === null, 'empty string resolves to null');
  assert(resolveRole(undefined) === null, 'undefined resolves to null');
}

// ── Case-insensitive resolution ─────────────────────────────────────────
{
  assert(resolveRole('CTO') !== null, 'CTO (uppercase) resolves');
  assert(resolveRole('cto') !== null, 'cto (lowercase) resolves');
  assert(resolveRole('Cto') !== null, 'Cto (mixed case) resolves');
}

// ── Named agent resolution (e.g., "Mario") ──────────────────────────────
{
  const mario = resolveRole('Chief Engineer');
  assert(mario !== null, 'Chief Engineer resolves');
  eq(mario.key, 'chief-engineer', 'Chief Engineer maps to chief-engineer key');
}

// ── ROLE_GROUPS cover all roles ─────────────────────────────────────────
{
  const allGrouped = Object.values(ROLE_GROUPS).flat();
  const allKeys = Object.keys(ROLES);
  for (const key of allKeys) {
    assert(allGrouped.includes(key), `Role '${key}' is in a group`);
  }
}

// ── ACTIVATION_ORDER contains no duplicates ─────────────────────────────
{
  const seen = new Set();
  for (const role of ACTIVATION_ORDER) {
    assert(!seen.has(role), `ACTIVATION_ORDER: '${role}' is not duplicated`);
    seen.add(role);
  }
}

// ── ACTIVATION_ORDER roles exist in ROLES ───────────────────────────────
{
  for (const role of ACTIVATION_ORDER) {
    assert(ROLES[role] !== undefined, `ACTIVATION_ORDER: '${role}' exists in ROLES`);
  }
}

console.log(`  ${passed} passed, ${failed} failed`);

module.exports = { passed, failed };
