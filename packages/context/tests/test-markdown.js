'use strict';

const { findSectionIndex, getSectionLevel, findSectionEnd, findSection } = require('../src/markdown');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-markdown.js');

const doc = `# Title
Some intro.

## Section A
Content A line 1.
Content A line 2.

## Section B
Content B.

### Subsection B1
Sub content.

## Section C
Content C.
`.split('\n');

// findSectionIndex
assert(findSectionIndex(doc, 'Section A') === 3, 'Finds Section A');
assert(findSectionIndex(doc, '## Section A') === 3, 'Finds with # prefix');
assert(findSectionIndex(doc, 'section a') === 3, 'Case insensitive');
assert(findSectionIndex(doc, 'Nonexistent') === -1, 'Returns -1 for missing');

// getSectionLevel
assert(getSectionLevel('# Title') === 1, 'H1 level');
assert(getSectionLevel('## Section') === 2, 'H2 level');
assert(getSectionLevel('### Sub') === 3, 'H3 level');
assert(getSectionLevel('Not a heading') === 0, 'Non-heading = 0');

// findSectionEnd
assert(findSectionEnd(doc, 3) === 7, 'Section A ends before Section B');
assert(findSectionEnd(doc, 7) === 13, 'Section B includes subsection');
assert(findSectionEnd(doc, 13) === doc.length, 'Last section ends at EOF');

// findSection
{
  const section = findSection(doc.join('\n'), 'Section A');
  assert(section !== null, 'findSection returns result');
  assert(section.start === 3, 'findSection start');
  assert(section.end === 7, 'findSection end');
  assert(section.content.includes('Content A line 1'), 'findSection content');
}

{
  const missing = findSection(doc.join('\n'), 'Missing');
  assert(missing === null, 'findSection returns null for missing');
}

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
