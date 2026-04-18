'use strict';

const path = require('path');
const { loadRole, parseSections, parseCapability } = require('../src/role-loader');
const { findSdkRoot } = require('../src/role-resolver');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-role-loader.js');

const sdkRoot = findSdkRoot();

// Load CTO role
{
  const ctoPath = path.join(sdkRoot, 'team', 'roles', 'cto.md');
  const role = loadRole(ctoPath);
  assert(!role.error, 'CTO loads without error');
  assert(role.sections['Role'] !== undefined, 'CTO has Role section');
  assert(role.sections['Capability'] !== undefined, 'CTO has Capability section');
  assert(role.sections['Task'] !== undefined, 'CTO has Task section');
  assert(role.hasConsultation, 'CTO has Consultation section');
  assert(role.hasChallenge, 'CTO has Challenge section');
  assert(role.raw.length > 100, 'CTO raw content is substantial');
}

// Capability parsing
{
  const ctoPath = path.join(sdkRoot, 'team', 'roles', 'cto.md');
  const role = loadRole(ctoPath);
  assert(role.capability.answers.length > 0, 'CTO capability.answers is populated');
  assert(role.capability.owns.length > 0, 'CTO capability.owns is populated');
}

// Placeholder resolution
{
  const ctoPath = path.join(sdkRoot, 'team', 'roles', 'cto.md');
  const role = loadRole(ctoPath, { agentName: 'Nicolas Oslo' });
  assert(!role.raw.includes('{{name}}'), 'Placeholders resolved');
}

// Load CEO role
{
  const ceoPath = path.join(sdkRoot, 'team', 'roles', 'ceo.md');
  const role = loadRole(ceoPath);
  assert(!role.error, 'CEO loads without error');
  assert(role.hasConsultation, 'CEO has Consultation');
}

// Missing file
{
  const role = loadRole('/nonexistent/path/fake.md');
  assert(role.error !== undefined, 'Missing file returns error');
}

// Load every role file that exists
{
  const { ROLES } = require('../../protocol/src');
  const fs = require('fs');
  let loadedCount = 0;
  for (const key of Object.keys(ROLES)) {
    const filePath = path.join(sdkRoot, 'team', 'roles', `${key}.md`);
    if (fs.existsSync(filePath)) {
      const role = loadRole(filePath);
      assert(!role.error, `Role '${key}' loads without error`);
      assert(role.sections['Role'] !== undefined || role.sections['_preamble'] !== undefined, `Role '${key}' has content`);
      loadedCount++;
    }
  }
  assert(loadedCount >= 20, `Loaded >= 20 role files (got ${loadedCount})`);
}

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
