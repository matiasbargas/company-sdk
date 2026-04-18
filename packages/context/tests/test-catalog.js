'use strict';

const { CATALOG, CATALOG_VERSION, validateCatalog } = require('../src/catalog');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-catalog.js');

// CATALOG_VERSION exists
assert(typeof CATALOG_VERSION === 'string', 'CATALOG_VERSION is a string');
assert(CATALOG_VERSION === '1.0', 'CATALOG_VERSION is 1.0');

// CATALOG has entries
assert(Array.isArray(CATALOG), 'CATALOG is an array');
assert(CATALOG.length >= 20, `CATALOG has >= 20 entries (got ${CATALOG.length})`);

// Every entry has required fields
for (const entry of CATALOG) {
  assert(typeof entry.path === 'string' && entry.path.length > 0, `Entry '${entry.path}': has path`);
  assert(typeof entry.domain === 'string' && entry.domain.length > 0, `Entry '${entry.path}': has domain`);
  assert(typeof entry.owner === 'string' && entry.owner.length > 0, `Entry '${entry.path}': has owner`);
  assert(typeof entry.purpose === 'string' && entry.purpose.length > 0, `Entry '${entry.path}': has purpose`);
  assert(Array.isArray(entry.load_when) && entry.load_when.length > 0, `Entry '${entry.path}': has load_when`);
}

// No duplicate paths
const paths = CATALOG.map(e => e.path);
const uniquePaths = new Set(paths);
assert(paths.length === uniquePaths.size, 'No duplicate paths in CATALOG');

// validateCatalog passes on the real catalog
const errors = validateCatalog(CATALOG);
assert(errors.length === 0, `validateCatalog passes (${errors.length} errors)`);

// validateCatalog catches bad entries
const badCatalog = [{ path: '', domain: '', owner: '', purpose: '', load_when: [] }];
const badErrors = validateCatalog(badCatalog);
assert(badErrors.length > 0, 'validateCatalog catches bad entries');

// CATALOG is frozen
assert(Object.isFrozen(CATALOG), 'CATALOG is frozen');

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
