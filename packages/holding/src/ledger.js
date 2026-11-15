'use strict';

/**
 * ledger.js — the append-only, hash-chained, idempotent fuel ledger (holding/fuel/ledger.jsonl).
 *
 * Format (Mario gate C1–C3), one canonical-JSON object per line:
 *   { schema_version: 1, seq, prev_sha256, sha256, idem_key, type, actor, ts, ...payload }
 *   sha256      = sha256(canonical(event without `sha256`))      — editing line k breaks line k
 *   prev_sha256 = the previous line's sha256 (GENESIS for line 1) — deleting/reordering breaks the chain
 *
 * Writes (C2): every append takes an exclusive lock file (`<ledger>.lock`, open 'wx' + retry),
 * re-reads and verifies the whole chain, folds it, applies the new event through the same
 * reducer (fold.js), and only then writes one line + fsync. A broken chain refuses every append
 * and every fold (fail closed). A foreign lock is never broken automatically: a crashed writer's
 * lock times out with LOCK_TIMEOUT naming the file, and a human removes it.
 *
 * Authority: the actor field is checked per event type (only `holding-owner` may fund, ratify,
 * freeze, unfreeze, close a cycle; `agent`/`company-owner` may propose a grant; only
 * `company-owner` may rate (judgment); only `runner` may draw, overrun, unmetered). The actor string is declared by
 * the caller; the real barrier is the OS (D7: holding/ is 0700 under the Owner's user), so this
 * check stops honest mistakes inside the trusted writer, not a hostile process.
 */

const fs = require('fs');
const path = require('path');
const { canonicalize, hashCanonical } = require('./canonical');
const { GENESIS_SHA256, LedgerError, createFoldContext, applyEvent, drawIdemKey, overrunIdemKey } = require('./fold');

const SCHEMA_VERSION = 1;
const EVENT_TYPES = ['fund', 'grant', 'release', 'draw', 'proof', 'proof_revert', 'overrun', 'reclaim',
  'return', 'close', 'freeze', 'unfreeze', 'unmetered', 'checkpoint', 'ratify', 'judgment', 'cycle_close',
  'limits', 'price_table', 'runner_pin', 'sandbox', 'reconcile'];
const HOLDING_OWNER = 'holding-owner';
const RUNNER = 'runner';
const ACTORS_BY_TYPE = {
  fund: [HOLDING_OWNER], freeze: [HOLDING_OWNER], unfreeze: [HOLDING_OWNER],
  ratify: [HOLDING_OWNER], cycle_close: [HOLDING_OWNER],
  limits: [HOLDING_OWNER], price_table: [HOLDING_OWNER], runner_pin: [HOLDING_OWNER], // replay inputs live in the chain
  sandbox: [HOLDING_OWNER], reconcile: [HOLDING_OWNER],
  // anyone in the company may propose a grant; only the holding Owner's own grant is ratified on entry
  grant: [HOLDING_OWNER, 'agent', 'company-owner'],
  judgment: ['company-owner'], // the judgment column is the company Owner's rating
  draw: [RUNNER], overrun: [RUNNER],
  unmetered: [RUNNER, HOLDING_OWNER], // the holding Owner only for reconciliation differences (fold checks source)
  release: [HOLDING_OWNER, RUNNER], proof: [HOLDING_OWNER, RUNNER], proof_revert: [HOLDING_OWNER, RUNNER],
  close: [HOLDING_OWNER, RUNNER], return: [HOLDING_OWNER, RUNNER], reclaim: [HOLDING_OWNER, RUNNER],
  checkpoint: [HOLDING_OWNER, RUNNER],
};
// Fields the ledger writes itself; a caller may not supply them.
const ENVELOPE = ['schema_version', 'seq', 'prev_sha256', 'sha256', 'ts'];
const DERIVED = { checkpoint: ['head_sha256', 'count'] };

const fail = (code, message) => { throw new LedgerError(code, message); };

const sleepSync = (ms) => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);

function readLines(file) {
  if (!fs.existsSync(file)) return [];
  return fs.readFileSync(file, 'utf8').split('\n').filter(l => l.length > 0);
}

/** Verify raw ledger lines. Returns { ok: true, count } or { ok: false, line, reason } (1-based line). */
function verifyLines(lines) {
  let prev = GENESIS_SHA256;
  for (let i = 0; i < lines.length; i++) {
    const line = i + 1;
    let e;
    try { e = JSON.parse(lines[i]); } catch { return { ok: false, line, reason: 'unparseable JSON' }; }
    if (!e || typeof e !== 'object' || Array.isArray(e)) return { ok: false, line, reason: 'not an event object' };
    if (e.schema_version !== SCHEMA_VERSION) return { ok: false, line, reason: `unknown schema_version ${e.schema_version}` };
    if (e.seq !== line) return { ok: false, line, reason: `seq ${e.seq} where ${line} was expected (missing or reordered line)` };
    if (e.prev_sha256 !== prev) return { ok: false, line, reason: 'prev_sha256 does not match the previous line' };
    const { sha256, ...body } = e;
    let actual;
    try { actual = hashCanonical(body); } catch (err) { return { ok: false, line, reason: err.message }; }
    if (sha256 !== actual) return { ok: false, line, reason: 'content does not match its sha256 (line edited)' };
    if (e.type === 'checkpoint' && (e.head_sha256 !== prev || e.count !== line - 1)) {
      return { ok: false, line, reason: 'checkpoint does not match the chain before it' };
    }
    prev = sha256;
  }
  return { ok: true, count: lines.length };
}

/** Fold verified events into a context (internal: carries the idem index). */
function replay(events, limits) {
  const ctx = createFoldContext(limits);
  for (const e of events) {
    try { applyEvent(ctx, e); } catch (err) {
      if (err instanceof LedgerError) fail('LEDGER_INVALID', `seq ${e.seq} does not apply: ${err.message}`);
      throw err;
    }
    ctx.head = e.sha256;
  }
  return ctx;
}

function checkShape(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) fail('INVALID_EVENT', 'an event must be an object');
  if (!EVENT_TYPES.includes(input.type)) fail('UNKNOWN_TYPE', `unknown event type ${JSON.stringify(input.type)}`);
  if (typeof input.idem_key !== 'string' || input.idem_key.length === 0) fail('MISSING_IDEM_KEY', `${input.type} event needs an idem_key`);
  const allowed = ACTORS_BY_TYPE[input.type];
  if (!allowed.includes(input.actor)) {
    if (input.type === 'fund') fail('FUND_NOT_OWNER', `only ${HOLDING_OWNER} can fund the pool (actor: ${JSON.stringify(input.actor)})`);
    if (allowed.length === 1 && allowed[0] === HOLDING_OWNER) fail('OWNER_ONLY', `only ${HOLDING_OWNER} can write ${input.type}`);
    fail('ACTOR_NOT_ALLOWED', `${JSON.stringify(input.actor)} cannot write ${input.type} (allowed: ${allowed.join(', ')})`);
  }
  for (const f of [...ENVELOPE, ...(DERIVED[input.type] || [])]) {
    if (f in input) fail('RESERVED_FIELD', `${f} is written by the ledger, not the caller`);
  }
  canonicalize(input); // throws CANONICAL_* for anything that is not plain JSON
}

/** Caller-visible payload of a stored event, for idempotency comparison. */
function payloadOf(e) {
  const out = { ...e };
  for (const f of [...ENVELOPE, ...(DERIVED[e.type] || [])]) delete out[f];
  return canonicalize(out);
}

/**
 * Open a ledger file. Fuel limits come from the ledger's own `limits` events. opts.limits, when
 * given, is only the default before the first `limits` event (tests, pre-iteration-2 ledgers);
 * it must name envelopePerCycle explicitly (number, or null = infinite fuel).
 * opts.now() → ISO timestamp (injectable for tests); opts.lockTimeoutMs (default 5000).
 */
function openLedger(file, opts = {}) {
  const limits = opts.limits;
  createFoldContext(limits); // validates genesis limits up front (when given)
  const now = opts.now || (() => new Date().toISOString());
  const lockTimeoutMs = opts.lockTimeoutMs ?? 5000;
  const lockFile = `${file}.lock`;

  function withLock(fn) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const deadline = Date.now() + lockTimeoutMs;
    let fd;
    for (;;) {
      try { fd = fs.openSync(lockFile, 'wx', 0o600); break; } catch (err) {
        if (err.code !== 'EEXIST') throw err;
        if (Date.now() >= deadline) {
          let holder = '';
          try { holder = fs.readFileSync(lockFile, 'utf8'); } catch { /* released meanwhile */ }
          fail('LOCK_TIMEOUT', `${lockFile} is held (${holder || 'unknown holder'}); if no writer is running, remove it by hand`);
        }
        sleepSync(5 + Math.floor(Math.random() * 20));
      }
    }
    try {
      fs.writeSync(fd, JSON.stringify({ pid: process.pid, since: new Date().toISOString() }));
      return fn();
    } finally {
      fs.closeSync(fd);
      fs.unlinkSync(lockFile);
    }
  }

  function loadVerified() {
    const lines = readLines(file);
    const v = verifyLines(lines);
    if (!v.ok) fail('CHAIN_BROKEN', `${file} line ${v.line}: ${v.reason}`);
    return lines.map(l => JSON.parse(l));
  }

  function append(input) {
    checkShape(input);
    return withLock(() => {
      const events = loadVerified();
      const ctx = replay(events, limits);
      const existing = ctx.idem.get(input.idem_key);
      if (existing) {
        const same = existing.type === input.type && (input.type === 'checkpoint' || payloadOf(existing) === payloadOf(input));
        if (!same) fail('IDEM_CONFLICT', `idem_key ${input.idem_key} was already used for a different event (seq ${existing.seq})`);
        return { appended: false, duplicate: true, event: existing };
      }
      const record = { ...input, schema_version: SCHEMA_VERSION, seq: events.length + 1, prev_sha256: ctx.head, ts: now() };
      if (input.type === 'checkpoint') { record.head_sha256 = ctx.head; record.count = events.length; }
      applyEvent(ctx, record); // throws on any rule violation; nothing has been written yet
      record.sha256 = hashCanonical(record);
      const fd = fs.openSync(file, 'a', 0o600);
      try {
        fs.writeSync(fd, canonicalize(record) + '\n');
        fs.fsyncSync(fd);
      } finally {
        fs.closeSync(fd);
      }
      return { appended: true, event: record };
    });
  }

  return {
    file,
    append,
    read: () => loadVerified(),
    verify: () => verifyLines(readLines(file)),
    fold: () => JSON.parse(JSON.stringify(replay(loadVerified(), limits).state)),
  };
}

module.exports = {
  openLedger, verifyLines, drawIdemKey, overrunIdemKey, LedgerError,
  GENESIS_SHA256, SCHEMA_VERSION, EVENT_TYPES, ACTORS_BY_TYPE, HOLDING_OWNER, RUNNER,
};
