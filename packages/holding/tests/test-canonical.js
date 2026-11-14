'use strict';

// C1 (Mario gate): the hash chain is computed over RFC 8785-style canonical JSON + SHA-256.
// These pin the byte format; a rewrite that changes it breaks every existing ledger.

const { canonicalize, sha256Hex, hashCanonical } = require('../src/canonical');
const { createSuite } = require('./_helpers');

const t = createSuite('canonical');

// @covers cap-po-ledger-001 — sorted keys, no whitespace, nested
{
  t.eq(canonicalize({ b: 1, a: [true, null, { d: 'x', c: 2 }] }), '{"a":[true,null,{"c":2,"d":"x"}],"b":1}', 'keys sorted recursively, no whitespace');
  t.eq(canonicalize({}), '{}', 'empty object');
  t.eq(canonicalize([]), '[]', 'empty array');
  t.eq(canonicalize('é\n"'), '"é\\n\\""', 'string escaping follows JSON rules, non-ASCII kept literal');
  t.eq(canonicalize({ 'é': 1, z: 2, 'Z': 3, '10': 4, '9': 5 }), '{"10":4,"9":5,"Z":3,"z":2,"é":1}', 'keys sorted by UTF-16 code units');
}

// @covers cap-po-ledger-001 — number rules (ECMAScript shortest round-trip)
{
  t.eq(canonicalize(1.0), '1', 'integral float has no fraction');
  t.eq(canonicalize(-0), '0', 'negative zero serializes as 0');
  t.eq(canonicalize(1e21), '1e+21', 'large exponent form');
  t.eq(canonicalize(0.1 + 0.2), '0.30000000000000004', 'shortest round-trip digits');
  for (const bad of [NaN, Infinity, -Infinity]) {
    t.throwsCode(() => canonicalize({ x: bad }), 'CANONICAL_NON_FINITE', `rejects ${bad}`);
  }
}

// @covers cap-po-ledger-001 — values JSON cannot represent are rejected, never silently dropped
{
  t.throwsCode(() => canonicalize({ x: undefined }), 'CANONICAL_UNSUPPORTED', 'undefined rejected');
  t.throwsCode(() => canonicalize({ x: () => 1 }), 'CANONICAL_UNSUPPORTED', 'function rejected');
  t.throwsCode(() => canonicalize({ x: 1n }), 'CANONICAL_UNSUPPORTED', 'bigint rejected');
  t.throwsCode(() => canonicalize({ x: new Date(0) }), 'CANONICAL_UNSUPPORTED', 'Date rejected (no implicit toJSON)');
}

// @covers cap-po-ledger-001 — sha256 over the canonical form is key-order independent
{
  t.eq(sha256Hex('abc'), 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad', 'sha256 known vector');
  t.eq(hashCanonical({ a: 1, b: 2 }), hashCanonical({ b: 2, a: 1 }), 'hash independent of key order');
  t.assert(/^[0-9a-f]{64}$/.test(hashCanonical({ a: 1 })), 'hash is 64 lowercase hex');
}

module.exports = t.done();
