'use strict';

/**
 * runner/stream.js — reading a session's stream-json: the live working-budget estimate, the
 * terminal-reason classification, and turning the metered session into ledger events as the
 * `runner` actor (draw / overrun / unmetered; after_freeze retry; refused draws kept as unmetered).
 */

const { LedgerError } = require('../ledger');
const { priceFu, toLedgerEvents } = require('../meter');

/**
 * Fold one assistant message into the run's live usage (deduped by message id) and return the
 * priced estimate in FU, or null when the line carries no usage. Unpriced model → capFu (fail closed).
 */
function liveEstimate(run, m, priceTable) {
  if (!m || m.type !== 'assistant' || !m.message || !m.message.usage || !m.message.id) return null;
  const u = m.message.usage;
  run.usageById.set(m.message.id, { model: m.message.model, in: u.input_tokens || 0, out: u.output_tokens || 0,
    cw: u.cache_creation_input_tokens || 0, cr: u.cache_read_input_tokens || 0 });
  const byModel = new Map();
  for (const r of run.usageById.values()) {
    const acc = byModel.get(r.model) || { model: r.model, in: 0, out: 0, cw: 0, cr: 0 };
    for (const k of ['in', 'out', 'cw', 'cr']) acc[k] += r[k];
    byModel.set(r.model, acc);
  }
  try { return priceFu([...byModel.values()], priceTable).fu; } catch { return run.capFu; }
}

/** Record tool_use ids from an assistant message (for the no-work classification). */
function trackToolUses(run, m) {
  if (!m || m.type !== 'assistant' || !m.message || !Array.isArray(m.message.content)) return;
  for (const b of m.message.content) if (b && b.type === 'tool_use' && b.id) run.toolUseIds.add(b.id);
}

/** { permission_denials, tool_uses: { attempted, denied, succeeded } } from the result + tracked tool uses. */
function denialSummary(run, result) {
  const denials = result && Array.isArray(result.permission_denials) ? result.permission_denials : [];
  const deniedIds = new Set(denials.map(d => d && d.tool_use_id).filter(Boolean));
  const attempted = run.toolUseIds.size;
  const denied = Math.max(deniedIds.size, denials.length);
  return { permission_denials: denials, tool_uses: { attempted, denied, succeeded: Math.max(0, attempted - denied) } };
}

/** The last `result` message in a stream text, or null. */
function lastResult(text) {
  let result = null;
  for (const l of text.split('\n')) { try { const m = JSON.parse(l); if (m && m.type === 'result') result = m; } catch { /* meter decides */ } }
  return result;
}

/**
 * A hook that failed to execute (exit not 0/2) is NON-blocking in Claude Code: the tool runs anyway.
 * Recognised shapes: { type:'system', subtype:'hook_error', ... } and a hook_response with such an exit
 * code. ASSUMPTION: the real CLI's event shape is unverified until the first real run (C4).
 */
function hookErrorOf(m) {
  if (!m || m.type !== 'system') return null;
  const failed = m.subtype === 'hook_error'
    || (m.subtype === 'hook_response' && Number.isInteger(m.exit_code) && m.exit_code !== 0 && m.exit_code !== 2);
  if (!failed) return null;
  return { hook_event_name: m.hook_event_name || null, tool_name: m.tool_name || null,
    exit_code: Number.isInteger(m.exit_code) ? m.exit_code : null, stderr: String(m.stderr || m.error || '').slice(0, 500) };
}

/** [state, terminalReason] for a finished session. denials = denialSummary(run, result). */
function terminalOf(run, code, signal, result, denials) {
  if (run.modelMismatch) return ['interrupted', 'model_mismatch'];
  if (run.landingForced) {
    return ['interrupted', run.frozenSeen ? 'frozen' : run.budgetSpent ? 'budget' : run.hookErrors.length ? 'hook_failed' : 'killed'];
  }
  if (run.stopRequested === 'hard') return ['interrupted', 'killed'];
  if (!result) return signal ? ['interrupted', 'killed'] : ['failed', 'error'];
  if (run.frozenSeen) return ['done', 'frozen'];
  if (run.stopRequested === 'landing') return ['done', 'killed'];
  // Denied tools and nothing achieved: not `done` (headless sessions deny every unallowed tool).
  if (!run.budgetSpent && denials && denials.permission_denials.length > 0 && denials.tool_uses.succeeded === 0) return ['failed', 'no_work_denied'];
  if (result.subtype === 'error_max_turns' || result.terminal_reason === 'max_turns') return ['done', 'max_turns'];
  if (result.subtype === 'error_max_budget_usd' || result.terminal_reason === 'budget_exhausted' || run.budgetSpent) return ['done', 'budget'];
  if (result.is_error || result.subtype !== 'success') return ['failed', 'error'];
  return ['done', 'done'];
}

/** Append the session's meter records as the runner. Returns { usage, pending, warnings }. */
function recordUsage(ledger, run, records) {
  const usage = { fu_drawn: 0, fu_overrun: 0, unmetered: 0, records: records.length };
  const pending = [];
  const warnings = [];
  const ctx = { runId: run.id, grantId: run.record.grant_id, missionId: run.record.mission_id, company: run.company, priceTable: run.cfg.priceTable };
  let remainingCap = run.capFu;
  const append = (e) => {
    try { ledger.append(e); return null; } catch (err) {
      if (err instanceof LedgerError && !['LOCK_TIMEOUT', 'CHAIN_BROKEN'].includes(err.code)) return err;
      pending.push(e);
      warnings.push(`ledger write deferred (${err.message}); event kept in ledger_pending`);
      return 'pending';
    }
  };
  const appendUnmetered = (e) => {
    // The provisional debit (fold/spend-events) needs the model and the live estimate to size
    // max(estimate_fu, session floor); a killed session may have no usage at all (spike 2).
    if (e.model === undefined) e.model = run.model || null;
    if (e.estimate_fu === undefined) e.estimate_fu = Number.isFinite(run.spentFu) ? Math.max(0, Math.round(run.spentFu)) : 0;
    const r = append(e);
    if (r === null) usage.unmetered++;
    else if (r !== 'pending') warnings.push(`unmetered refused: ${r.message}`);
  };
  for (const original of records) {
    // A session on the wrong model is never charged as a draw; its usage is kept as unmetered.
    const rec = run.modelMismatch && original.kind === 'usage'
      ? { ...original, kind: 'unmetered', reason: `model_mismatch: ${run.modelMismatch}` } : original;
    const [first, ...rest] = toLedgerEvents(rec, { ...ctx, capFu: remainingCap });
    if (first.type !== 'draw') { appendUnmetered(first); continue; }
    if (Number.isSafeInteger(run.startedSeq)) first.run_started_seq = run.startedSeq;
    let refused = append(first);
    let afterFreeze = false;
    if (refused && refused !== 'pending' && refused.code === 'LEDGER_FROZEN' && Number.isSafeInteger(run.startedSeq)) {
      // The session started before the freeze: its spend is owed to its grant (decision 2026-11-14).
      afterFreeze = true;
      refused = append({ ...first, after_freeze: true });
    }
    if (refused === 'pending') { pending.push(...rest); continue; }
    if (refused) {
      // The burn happened; a refused draw (frozen, exhausted) must not hide it.
      const um = {
        type: 'unmetered', actor: 'runner', idem_key: `unmetered:${run.id}:${first.session_id}:${first.result_uuid}`,
        company: run.company, grant_id: ctx.grantId, mission_id: ctx.missionId, run_id: run.id,
        session_id: first.session_id, result_uuid: first.result_uuid,
        reason: `draw refused${afterFreeze ? ' (after_freeze draw attempted)' : ''}: ${refused.message}`,
        raw: first.raw, model_usage: first.model_usage, fu_priced: first.fu + rest.reduce((s, o) => s + o.fu, 0),
        price_table_version: first.price_table_version,
      };
      if (first.claude_code_version) um.claude_code_version = first.claude_code_version;
      appendUnmetered(um);
      continue;
    }
    usage.fu_drawn += first.fu;
    remainingCap = Math.max(0, remainingCap - first.fu);
    for (const o of rest) {
      const r = append(o);
      if (r === null) usage.fu_overrun += o.fu;
      else if (r !== 'pending') warnings.push(`overrun refused: ${r.message}`);
    }
  }
  return { usage, pending, warnings };
}

module.exports = { liveEstimate, trackToolUses, hookErrorOf, denialSummary, lastResult, terminalOf, recordUsage };
