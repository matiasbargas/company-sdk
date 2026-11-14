'use strict';

// Shared assertion helpers for @team-sdk/holding tests. Not a test file (no `test-` prefix).

const fs = require('fs');
const os = require('os');
const path = require('path');

function createSuite(name) {
  const s = { name, passed: 0, failed: 0 };
  s.assert = (cond, label) => {
    if (cond) s.passed++; else { s.failed++; console.error(`  FAIL [${name}]: ${label}`); }
  };
  s.eq = (a, b, label) => s.assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  s.deepEq = (a, b, label) => s.assert(JSON.stringify(a) === JSON.stringify(b),
    `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
  // Expects fn to throw an error whose .code equals `code`; returns the error.
  s.throwsCode = (fn, code, label) => {
    try { fn(); } catch (e) {
      s.assert(e.code === code, `${label} — expected code ${code}, got ${e.code}: ${e.message}`);
      return e;
    }
    s.assert(false, `${label} — expected throw with code ${code}, nothing thrown`);
    return null;
  };
  s.done = () => ({ passed: s.passed, failed: s.failed });
  return s;
}

function tmpDir(prefix = 'holding-test-') {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

module.exports = { createSuite, tmpDir };
