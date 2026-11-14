'use strict';

/**
 * meter.js — Claude Code stream-json → UsageEvent → ledger events (cap-po-fuel-001, cap-po-budget-001).
 *
 * Contract (Mario gate C3, C5, C8), version METER_CONTRACT_VERSION:
 *   UsageEvent = { kind: 'usage', contract_version, source, claude_code_version, session_id, result_uuid,
 *                  raw: [{ model, in, out, cw, cr }],   // normalized, variables.yaml `raw`
 *                  model_usage: <result.modelUsage verbatim>, terminal_reason, subtype, is_error, cost_usd_list }
 *              | { kind: 'unmetered', contract_version, reason, session_id?, result_uuid?, claude_code_version?, raw?, model_usage? }
 *
 * Counts come from `result.modelUsage` (per model) only. The 2026-11-13 spike showed top-level
 * `result.usage` all zeros while modelUsage carried the real counts, so `usage` is never read.
 * Anything unexpected (no result, unparseable line, missing/non-integer counts, unpinned CLI
 * version, model missing from the price table) fails closed as `unmetered`, never as zero.
 *
 * FU = Σ per model ceil(in·r.in + out·r.out + cw·r.cw + cr·r.cr) with r = priceTable.models[model].
 * Integer FU keeps ledger arithmetic exact; ceil means fractional burn is never rounded away.
 * Every session's fixed cache-creation overhead is part of `cw`, so it counts against the grant.
 */

const { drawIdemKey, overrunIdemKey } = require('./fold');

const METER_CONTRACT_VERSION = 1;
const SOURCE = 'claude-code-stream-json';
const COUNT_FIELDS = { in: 'inputTokens', out: 'outputTokens', cw: 'cacheCreationInputTokens', cr: 'cacheReadInputTokens' };

class MeterError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}

const isPlainObject = (v) => !!v && typeof v === 'object' && !Array.isArray(v);
const isCount = (v) => Number.isSafeInteger(v) && v >= 0;

function unmetered(reason, extra = {}) {
  const rec = { kind: 'unmetered', contract_version: METER_CONTRACT_VERSION, reason };
  for (const [k, v] of Object.entries(extra)) if (v !== undefined && v !== null) rec[k] = v;
  return rec;
}

function normalizeModelUsage(modelUsage) {
  if (!isPlainObject(modelUsage)) return { error: 'result has no modelUsage object' };
  const models = Object.keys(modelUsage).sort();
  if (models.length === 0) return { error: 'result.modelUsage is empty' };
  const raw = [];
  for (const model of models) {
    const m = modelUsage[model];
    if (!isPlainObject(m)) return { error: `modelUsage[${model}] is not an object` };
    const row = { model };
    for (const [k, field] of Object.entries(COUNT_FIELDS)) {
      if (!isCount(m[field])) return { error: `modelUsage[${model}].${field} is missing or not a non-negative integer` };
      row[k] = m[field];
    }
    raw.push(row);
  }
  return { raw };
}

/**
 * Meter one session's stream-json text. Returns one record per `result` message, or a single
 * `unmetered` record when the stream cannot be trusted. opts.pinnedVersion pins Claude Code (C5).
 */
function meterStream(text, opts = {}) {
  const lines = String(text || '').split('\n').filter(l => l.trim().length > 0);
  const messages = [];
  for (let i = 0; i < lines.length; i++) {
    try { messages.push(JSON.parse(lines[i])); } catch {
      return [unmetered(`stream line ${i + 1} is not JSON; the stream schema is unknown`)];
    }
  }
  const init = messages.find(m => m && m.type === 'system' && m.subtype === 'init') || {};
  const version = typeof init.claude_code_version === 'string' ? init.claude_code_version : undefined;
  if (opts.pinnedVersion && version !== opts.pinnedVersion) {
    return [unmetered(`Claude Code version ${version || 'unknown'} is not the pinned ${opts.pinnedVersion}`,
      { session_id: init.session_id, claude_code_version: version })];
  }
  const results = messages.filter(m => m && m.type === 'result');
  if (results.length === 0) {
    return [unmetered('stream has no result message (no usage record)', { session_id: init.session_id, claude_code_version: version })];
  }
  return results.map((r) => {
    const ids = { session_id: r.session_id || init.session_id, result_uuid: r.uuid, claude_code_version: version };
    if (typeof ids.session_id !== 'string' || typeof r.uuid !== 'string') {
      return unmetered('result message lacks session_id or uuid', ids);
    }
    const { raw, error } = normalizeModelUsage(r.modelUsage);
    if (error) return unmetered(error, ids);
    return {
      kind: 'usage', contract_version: METER_CONTRACT_VERSION, source: SOURCE, ...ids,
      raw, model_usage: r.modelUsage,
      terminal_reason: r.terminal_reason, subtype: r.subtype, is_error: r.is_error === true,
      cost_usd_list: typeof r.total_cost_usd === 'number' ? r.total_cost_usd : undefined,
    };
  });
}

/** Price normalized raw rows. Throws MeterError UNPRICED_MODEL / PRICE_TABLE_INVALID. */
function priceFu(raw, priceTable) {
  if (!priceTable || typeof priceTable.version !== 'string' || !isPlainObject(priceTable.models)) {
    throw new MeterError('PRICE_TABLE_INVALID', 'priceTable needs { version: string, models: { [model]: { in, out, cw, cr } } }');
  }
  const by_model = raw.map((row) => {
    const r = priceTable.models[row.model];
    if (!r || !['in', 'out', 'cw', 'cr'].every(k => typeof r[k] === 'number' && r[k] >= 0)) {
      throw new MeterError('UNPRICED_MODEL', `price table ${priceTable.version} has no rates for ${row.model}`);
    }
    const exact = row.in * r.in + row.out * r.out + row.cw * r.cw + row.cr * r.cr;
    return { model: row.model, fu: Math.ceil(exact - 1e-9) }; // epsilon: 0.1+0.2 must not become an extra FU
  });
  return { fu: by_model.reduce((s, m) => s + m.fu, 0), by_model, price_table_version: priceTable.version };
}

function dropUndefined(o) {
  for (const k of Object.keys(o)) if (o[k] === undefined) delete o[k];
  return o;
}

/**
 * Turn one meter record into ledger events for the runner to append.
 * ctx: { runId, grantId, missionId, company, priceTable, capFu? }. capFu is the run's soft budget
 * in FU: spend above it becomes an `overrun` (draw up to the cap, overrun for the excess).
 */
function toLedgerEvents(rec, ctx) {
  for (const f of ['runId', 'grantId', 'missionId', 'company']) {
    if (typeof ctx[f] !== 'string' || !ctx[f]) throw new MeterError('METER_CONTEXT', `ctx.${f} is required`);
  }
  if (ctx.capFu !== undefined && !isCount(ctx.capFu)) throw new MeterError('METER_CONTEXT', 'ctx.capFu must be a non-negative integer');
  const base = { actor: 'runner', company: ctx.company, grant_id: ctx.grantId, mission_id: ctx.missionId, run_id: ctx.runId };
  const asUnmetered = (r, reason) => [dropUndefined({
    type: 'unmetered', ...base,
    idem_key: `unmetered:${ctx.runId}:${r.session_id || 'no-session'}:${r.result_uuid || 'no-result'}`,
    session_id: r.session_id || 'no-session', reason,
    result_uuid: r.result_uuid, claude_code_version: r.claude_code_version,
    raw: r.raw, model_usage: r.model_usage, meter_contract_version: METER_CONTRACT_VERSION,
  })];

  if (rec.kind !== 'usage') return asUnmetered(rec, rec.reason);
  let priced;
  try { priced = priceFu(rec.raw, ctx.priceTable); } catch (err) {
    if (err.code === 'UNPRICED_MODEL' || err.code === 'PRICE_TABLE_INVALID') return asUnmetered(rec, err.message);
    throw err;
  }
  const capped = ctx.capFu !== undefined && priced.fu > ctx.capFu;
  const drawFu = capped ? ctx.capFu : priced.fu;
  const ids = { session_id: rec.session_id, result_uuid: rec.result_uuid };
  const events = [dropUndefined({
    type: 'draw', ...base, ...ids, idem_key: drawIdemKey(ctx.runId, rec.session_id, rec.result_uuid),
    fu: drawFu, cap_fu: ctx.capFu, raw: rec.raw, model_usage: rec.model_usage,
    price_table_version: priced.price_table_version, meter_contract_version: METER_CONTRACT_VERSION,
    claude_code_version: rec.claude_code_version, terminal_reason: rec.terminal_reason,
  })];
  if (capped) {
    events.push({
      type: 'overrun', actor: 'runner', company: ctx.company, grant_id: ctx.grantId, run_id: ctx.runId, ...ids,
      idem_key: overrunIdemKey(ctx.runId, rec.session_id, rec.result_uuid),
      fu: priced.fu - ctx.capFu, cap_fu: ctx.capFu, price_table_version: priced.price_table_version,
    });
  }
  return events;
}

module.exports = { meterStream, priceFu, toLedgerEvents, METER_CONTRACT_VERSION, MeterError };
