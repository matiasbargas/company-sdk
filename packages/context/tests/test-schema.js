'use strict';

const {
  SUPPORTED_INDEX_VERSIONS, CURRENT_INDEX_VERSION,
  SUPPORTED_MANIFEST_VERSIONS, CURRENT_MANIFEST_VERSION,
  checkSchemaVersion,
} = require('../src/schema');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-schema.js');

// Constants exist
assert(Array.isArray(SUPPORTED_INDEX_VERSIONS), 'SUPPORTED_INDEX_VERSIONS is array');
assert(SUPPORTED_INDEX_VERSIONS.includes('2.0'), 'Supports index v2.0');
assert(SUPPORTED_INDEX_VERSIONS.includes('3.0'), 'Supports index v3.0');
assert(CURRENT_INDEX_VERSION === '3.0', 'Current index version is 3.0');
assert(CURRENT_MANIFEST_VERSION === '1.0', 'Current manifest version is 1.0');

// checkSchemaVersion — valid current
{
  const r = checkSchemaVersion('3.0', SUPPORTED_INDEX_VERSIONS);
  assert(r.valid === true, 'v3.0 is valid');
  assert(r.deprecated === false, 'v3.0 is not deprecated');
}

// checkSchemaVersion — valid but deprecated
{
  const r = checkSchemaVersion('2.0', SUPPORTED_INDEX_VERSIONS);
  assert(r.valid === true, 'v2.0 is valid');
  assert(r.deprecated === true, 'v2.0 is deprecated');
}

// checkSchemaVersion — unsupported
{
  const r = checkSchemaVersion('1.0', SUPPORTED_INDEX_VERSIONS);
  assert(r.valid === false, 'v1.0 is not valid for index');
  assert(r.error.includes('Unsupported'), 'v1.0 error message');
}

// checkSchemaVersion — missing
{
  const r = checkSchemaVersion(undefined, SUPPORTED_INDEX_VERSIONS);
  assert(r.valid === false, 'undefined version is invalid');
  assert(r.error.includes('Missing'), 'Missing version error');
}

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
