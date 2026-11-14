'use strict';

/**
 * canonical.js — RFC 8785 (JCS) style canonical JSON + SHA-256 (Mario gate C1).
 *
 * The ledger hash chain is computed over these bytes, so this format is a persisted contract:
 * changing it invalidates every existing ledger. Rules:
 *   - object keys sorted by UTF-16 code units (JS default string sort), recursively;
 *   - no insignificant whitespace;
 *   - strings and numbers serialized as ECMAScript JSON.stringify does (RFC 8785 §3.2.2–3.2.3:
 *     shortest round-trip numbers, -0 → 0, minimal string escaping);
 *   - only JSON values are accepted: plain objects, arrays, strings, finite numbers, booleans,
 *     null. Anything else (undefined, functions, BigInt, Date, NaN/Infinity) throws instead of
 *     being silently dropped or coerced, because a silently changed value would hash "fine".
 */

const crypto = require('crypto');

class CanonicalError extends Error {
  constructor(code, message) { super(message); this.code = code; }
}

function isPlainObject(v) {
  if (v === null || typeof v !== 'object') return false;
  const proto = Object.getPrototypeOf(v);
  return proto === Object.prototype || proto === null;
}

function canonicalize(value, where = '$') {
  if (value === null) return 'null';
  switch (typeof value) {
    case 'boolean': return value ? 'true' : 'false';
    case 'string': return JSON.stringify(value);
    case 'number':
      if (!Number.isFinite(value)) throw new CanonicalError('CANONICAL_NON_FINITE', `${where}: ${value} is not a JSON number`);
      return JSON.stringify(value); // ES Number serialization; JSON.stringify(-0) === '0'
    case 'object':
      if (Array.isArray(value)) return `[${value.map((v, i) => canonicalize(v, `${where}[${i}]`)).join(',')}]`;
      if (isPlainObject(value)) {
        const keys = Object.keys(value).sort();
        return `{${keys.map(k => `${JSON.stringify(k)}:${canonicalize(value[k], `${where}.${k}`)}`).join(',')}}`;
      }
      throw new CanonicalError('CANONICAL_UNSUPPORTED', `${where}: ${Object.prototype.toString.call(value)} is not a plain JSON value`);
    default:
      throw new CanonicalError('CANONICAL_UNSUPPORTED', `${where}: ${typeof value} is not a JSON value`);
  }
}

function sha256Hex(text) {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

/** sha256 hex of the canonical form of a JSON value. */
function hashCanonical(value) {
  return sha256Hex(canonicalize(value));
}

module.exports = { canonicalize, sha256Hex, hashCanonical, CanonicalError };
