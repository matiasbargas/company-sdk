'use strict';

const path = require('path');
const { loadSquad, listSquads, parseSquadFile } = require('../src/squad-loader');
const { validateSquad } = require('../src/squad-validator');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}

const sdkRoot = path.resolve(__dirname, '../../../');

// --- parseSquadFile ---

// Parse startup squad
{
  const { readFileSync } = require('fs');
  const content = readFileSync(path.join(sdkRoot, 'team/squads/startup.md'), 'utf8');
  const squad = parseSquadFile(content, 'startup.md');

  assert(squad.name.includes('Startup'), `squad name includes Startup (got ${squad.name})`);
  assert(squad.roles.length > 10, `startup has 10+ roles (got ${squad.roles.length})`);
  assert(squad.purpose.length > 20, 'startup has purpose text');
  assert(squad.useWhen.length > 5, 'startup has useWhen');
  assert(squad.size.includes('Large'), `startup size is Large (got ${squad.size})`);
  eq(typeof squad.raw, 'string', 'raw content preserved');

  // Check specific roles
  const roleNames = squad.roles.map(r => r.role);
  assert(roleNames.includes('CEO'), 'startup has CEO role');
  assert(roleNames.includes('CTO'), 'startup has CTO role');
  assert(roleNames.includes('CLO'), 'startup has CLO role');
  assert(roleNames.includes('PM'), 'startup has PM role');
  assert(roleNames.includes('Mario'), 'startup has Mario role');
  assert(roleNames.includes('Designer'), 'startup has Designer role');
}

// Parse template (empty roles)
{
  const { readFileSync } = require('fs');
  const content = readFileSync(path.join(sdkRoot, 'team/squads/_template.md'), 'utf8');
  const squad = parseSquadFile(content, '_template.md');
  eq(squad.roles.length, 0, 'template has 0 roles');
}

// Parse minimal content
{
  const content = `# Squad: Test

> **Use this squad when:** Testing
> **Size:** S
> **Roles:** 2 activated

## Purpose

A test squad.

## Role Roster

| Role | Level | Layer | Owns |
|------|-------|-------|------|
| CEO | M4 | Strategic | Direction |
| CTO | M4 | Execution | Architecture |
`;
  const squad = parseSquadFile(content, 'test.md');
  eq(squad.name, 'Test', 'parsed name from title');
  eq(squad.size, 'S', 'parsed size');
  eq(squad.useWhen, 'Testing', 'parsed useWhen');
  eq(squad.roles.length, 2, 'parsed 2 roles');
  eq(squad.roles[0].role, 'CEO', 'first role is CEO');
  eq(squad.roles[1].role, 'CTO', 'second role is CTO');
}

// --- loadSquad ---

// Load built-in squad
{
  const result = loadSquad('startup', { sdkRoot });
  assert(result !== null, 'startup squad found');
  eq(result.source, 'built-in', 'startup source is built-in');
  assert(result.squad.name.includes('Startup'), 'startup squad name correct');
}

// Load all built-in squads
{
  for (const name of ['startup', 'mvp', 'website', 'feature']) {
    const result = loadSquad(name, { sdkRoot });
    assert(result !== null, `${name} squad found`);
    eq(result.source, 'built-in', `${name} source is built-in`);
  }
}

// Non-existent squad
{
  const result = loadSquad('nonexistent', { sdkRoot });
  eq(result, null, 'nonexistent squad returns null');
}

// Template is skipped (starts with _)
{
  const result = loadSquad('_template', { sdkRoot });
  eq(result, null, 'template is not loadable (starts with _)');
}

// --- listSquads ---

// List built-in squads
{
  const squads = listSquads({ sdkRoot });
  assert(squads.length >= 4, `at least 4 built-in squads (got ${squads.length})`);
  const names = squads.map(s => s.source);
  assert(names.every(s => s === 'built-in'), 'all are built-in');

  // Verify all known squads present
  const squadNames = squads.map(s => s.filePath);
  assert(squadNames.some(n => n.includes('startup')), 'list includes startup');
  assert(squadNames.some(n => n.includes('mvp')), 'list includes mvp');
  assert(squadNames.some(n => n.includes('website')), 'list includes website');
  assert(squadNames.some(n => n.includes('feature')), 'list includes feature');
}

// Template not in list
{
  const squads = listSquads({ sdkRoot });
  assert(!squads.some(s => s.filePath && s.filePath.includes('_template')), 'template not in list');
}

// --- validateSquad ---

// Valid squad
{
  const squad = {
    name: 'Test Squad',
    purpose: 'For testing',
    roles: [{ role: 'CEO' }, { role: 'CTO' }],
  };
  const result = validateSquad(squad);
  eq(result.valid, true, 'valid squad passes');
  eq(result.errors.length, 0, 'no errors on valid squad');
}

// Null squad
{
  const result = validateSquad(null);
  eq(result.valid, false, 'null squad is invalid');
}

// Missing name
{
  const result = validateSquad({ purpose: 'test' });
  eq(result.valid, false, 'squad without name is invalid');
  assert(result.errors.some(e => e.includes('name')), 'error mentions name');
}

// Unknown role produces warning (not error)
{
  const squad = {
    name: 'test',
    roles: [{ role: 'Treasury Manager' }],
  };
  const result = validateSquad(squad);
  eq(result.valid, true, 'unknown role is valid (warning only)');
  assert(result.warnings.length > 0, 'unknown role produces warning');
}

// Known roles are valid
{
  const squad = {
    name: 'test',
    purpose: 'testing',
    roles: [{ role: 'CEO' }, { role: 'CTO' }, { role: 'CLO' }, { role: 'PM' }],
  };
  const result = validateSquad(squad);
  eq(result.valid, true, 'known roles are valid');
  eq(result.warnings.length, 0, 'no warnings for known roles');
}

// npm squad validation
{
  const squad = {
    name: 'fintech',
    purpose: 'Fintech squad',
    teamSdk: { type: 'squad', version: '1.0' },
    roles: ['ceo', 'cto'],
    customRoles: [
      { key: 'treasury', file: 'roles/treasury.md', domain: 'finance' },
    ],
  };
  const result = validateSquad(squad);
  eq(result.valid, true, 'npm squad with custom roles valid');
}

// npm squad wrong type
{
  const squad = {
    name: 'bad',
    teamSdk: { type: 'plugin' },
  };
  const result = validateSquad(squad);
  eq(result.valid, false, 'npm squad with wrong type is invalid');
  assert(result.errors.some(e => e.includes('squad')), 'error mentions squad type');
}

// Custom role missing file
{
  const squad = {
    name: 'test',
    teamSdk: { type: 'squad' },
    customRoles: [{ key: 'custom' }],
  };
  const result = validateSquad(squad);
  eq(result.valid, false, 'custom role without file is invalid');
}

// Validate a real built-in squad
{
  const result = loadSquad('startup', { sdkRoot });
  if (result) {
    const validation = validateSquad(result.squad);
    eq(validation.valid, true, 'real startup squad is valid');
    eq(validation.errors.length, 0, `startup has no errors (got: ${validation.errors.join(', ')})`);
  }
}

console.log(`  test-squad: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
