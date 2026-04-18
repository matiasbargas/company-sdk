'use strict';

const path = require('path');
const fs = require('fs');
const os = require('os');
const { safePath, safeReadFile, safeExists } = require('../src/file-resolver');

let passed = 0;
let failed = 0;

function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}

console.log('\n  test-file-resolver.js');

// Create a temp directory for testing
const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-ctx-test-'));
const innerDir = path.join(tmpRoot, 'inner');
fs.mkdirSync(innerDir);
fs.writeFileSync(path.join(tmpRoot, 'safe.txt'), 'safe content');
fs.writeFileSync(path.join(innerDir, 'nested.txt'), 'nested content');

// Valid paths resolve
{
  const resolved = safePath(tmpRoot, 'safe.txt');
  assert(resolved.endsWith('safe.txt'), 'safe.txt resolves');
}

{
  const resolved = safePath(tmpRoot, 'inner/nested.txt');
  assert(resolved.endsWith('nested.txt'), 'inner/nested.txt resolves');
}

// Path traversal blocked — ../
{
  let threw = false;
  try {
    safePath(tmpRoot, '../../../etc/passwd');
  } catch (err) {
    threw = true;
    assert(err.message.includes('Path traversal blocked'), '../etc/passwd: correct error message');
  }
  assert(threw, '../etc/passwd: throws');
}

// Absolute path outside root blocked
{
  let threw = false;
  try {
    safePath(tmpRoot, '/etc/passwd');
  } catch (err) {
    threw = true;
  }
  assert(threw, 'Absolute path outside root: throws');
}

// safeReadFile returns content for valid file
{
  const content = safeReadFile(tmpRoot, 'safe.txt');
  assert(content === 'safe content', 'safeReadFile reads valid file');
}

// safeReadFile returns null for missing file
{
  const content = safeReadFile(tmpRoot, 'nonexistent.txt');
  assert(content === null, 'safeReadFile returns null for missing file');
}

// safeReadFile throws on traversal
{
  let threw = false;
  try {
    safeReadFile(tmpRoot, '../../../etc/passwd');
  } catch {
    threw = true;
  }
  assert(threw, 'safeReadFile throws on traversal');
}

// safeExists
{
  assert(safeExists(tmpRoot, 'safe.txt') === true, 'safeExists true for existing file');
  assert(safeExists(tmpRoot, 'nope.txt') === false, 'safeExists false for missing file');
  assert(safeExists(tmpRoot, '../../../etc/passwd') === false, 'safeExists false for traversal');
}

// Symlink escape (if possible on this OS)
{
  const outsideFile = path.join(os.tmpdir(), 'sdk-ctx-outside-' + Date.now() + '.txt');
  fs.writeFileSync(outsideFile, 'outside');
  const linkPath = path.join(tmpRoot, 'sneaky-link');
  try {
    fs.symlinkSync(outsideFile, linkPath);
    let threw = false;
    try {
      safePath(tmpRoot, 'sneaky-link');
    } catch {
      threw = true;
    }
    assert(threw, 'Symlink escape: throws');
  } catch {
    // Symlinks may not be supported — skip
    passed++;
  }
  try { fs.unlinkSync(outsideFile); } catch {}
}

// Cleanup
fs.rmSync(tmpRoot, { recursive: true, force: true });

console.log(`  ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
