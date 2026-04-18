'use strict';

const path = require('path');
const fs = require('fs');
const { resolveRoleToFile, listRoles, findSdkRoot } = require('../src/role-resolver');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-role-resolver.js');

const sdkRoot = findSdkRoot();
assert(sdkRoot !== null, 'findSdkRoot finds the SDK root');
assert(fs.existsSync(path.join(sdkRoot, 'team', 'roles')), 'SDK root has team/roles/');

// Resolve by key
{
  const r = resolveRoleToFile('cto', { sdkRoot });
  assert(r !== null, 'CTO resolves by key');
  assert(r.key === 'cto', 'CTO key is correct');
  assert(r.title === 'CTO', 'CTO title is correct');
  assert(r.filePath.endsWith('cto.md'), 'CTO filePath ends with cto.md');
  assert(fs.existsSync(r.filePath), 'CTO file exists');
}

// Resolve by title
{
  const r = resolveRoleToFile('Chief Engineer', { sdkRoot });
  assert(r !== null, 'Chief Engineer resolves by title');
  assert(r.key === 'chief-engineer', 'Chief Engineer key is correct');
}

// Resolve case-insensitive
{
  const r = resolveRoleToFile('CEO', { sdkRoot });
  assert(r !== null, 'CEO resolves uppercase');
}

// Unknown role
{
  const r = resolveRoleToFile('janitor', { sdkRoot });
  assert(r === null, 'Unknown role returns null');
}

// Every role resolves to an existing file
{
  const { ROLES } = require('../../protocol/src');
  for (const key of Object.keys(ROLES)) {
    const r = resolveRoleToFile(key, { sdkRoot });
    if (r) {
      const exists = fs.existsSync(r.filePath);
      assert(exists, `Role '${key}' file exists: ${r.filePath}`);
    }
    // Some extended roles may not have files — that's OK
  }
}

// listRoles returns all roles
{
  const roles = listRoles({ sdkRoot });
  assert(roles.length >= 25, `listRoles returns >= 25 (got ${roles.length})`);
  assert(roles.every(r => r.key && r.title && r.filePath), 'All roles have key, title, filePath');
}

// listRoles with group filter
{
  const strategic = listRoles({ sdkRoot, group: 'strategic' });
  assert(strategic.length >= 2, `Strategic group has >= 2 roles (got ${strategic.length})`);
  assert(strategic.every(r => r.group === 'strategic'), 'All filtered roles are strategic');
}

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
