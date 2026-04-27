'use strict';

const { queryContext } = require('../src/query');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-query.js');

// Mock index
const mockIndex = {
  files: [
    { path: 'engineering-requirements.md', domain: 'engineering', owner: 'CTO',       load_when: ['architecture-review', 'sprint-planning'] },
    { path: 'product-requirements.md',     domain: 'product',     owner: 'PM',        load_when: ['mission-shaping', 'sprint-planning'] },
    { path: 'compliance-requirements.md',   domain: 'security',    owner: 'CISO',      load_when: ['security-review'] },
    { path: 'product-log.md',              domain: 'people',      owner: 'CHRO',      load_when: ['people-domain', 'hiring'] },
    { path: 'engineering-log.md',          domain: 'engineering', owner: 'CTO',       load_when: ['engineering-domain'] },
  ],
};

// Filter by domain
{
  const results = queryContext(mockIndex, { domain: 'engineering' });
  assert(results.length === 2, `Domain engineering: 2 results (got ${results.length})`);
  assert(results.every(r => r.domain === 'engineering'), 'All results are engineering');
}

// Filter by owner
{
  const results = queryContext(mockIndex, { owner: 'CTO' });
  assert(results.length === 2, `Owner CTO: 2 results (got ${results.length})`);
}

// Filter by loadWhen
{
  const results = queryContext(mockIndex, { loadWhen: 'sprint-planning' });
  assert(results.length === 2, `loadWhen sprint-planning: 2 results (got ${results.length})`);
}

// Combined filters
{
  const results = queryContext(mockIndex, { domain: 'engineering', loadWhen: 'sprint-planning' });
  assert(results.length === 1, `Combined: 1 result (got ${results.length})`);
  assert(results[0].path === 'engineering-requirements.md', 'Combined: correct file');
}

// Custom predicate
{
  const results = queryContext(mockIndex, { predicate: f => f.path.endsWith('-log.md') });
  assert(results.length === 2, `Predicate logs: 2 results (got ${results.length})`);
}

// No filters — returns all
{
  const results = queryContext(mockIndex);
  assert(results.length === 5, `No filters: all 5 results (got ${results.length})`);
}

// Empty index
{
  const results = queryContext({});
  assert(results.length === 0, 'Empty index: 0 results');
}

// Null index
{
  const results = queryContext(null);
  assert(results.length === 0, 'Null index: 0 results');
}

// Case-insensitive domain
{
  const results = queryContext(mockIndex, { domain: 'Engineering' });
  assert(results.length === 2, 'Case-insensitive domain works');
}

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
