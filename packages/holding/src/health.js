'use strict';

/**
 * health.js — holdingHealth(holdingDir): read-only health of a holding, for scripts/health.js.
 * cap-po-judgment-001 (unfilled judgment column), cap-po-proof-002 (revisit trigger),
 * cap-po-metric-001 (unmetered sessions this cycle), cap-po-ledger-001 (chain).
 *
 * Pure in effect: it reads portfolio.json and the ledger and never writes (no revert scan, no
 * lock). `holdingDir` is the holding root (the directory holding `holding/`) or `holding/` itself.
 * Returns { ok, holding, cycle, issues: [{ severity: 'error' | 'warn', code, capability, message }] };
 * ok is false when any issue is an error.
 */

const fs = require('fs');
const path = require('path');
const { openLedger } = require('./ledger');
const { buildReport } = require('./report');

function locate(dir) {
  const root = path.resolve(dir);
  for (const h of [path.join(root, 'holding'), root]) {
    if (fs.existsSync(path.join(h, 'portfolio.json')) && fs.existsSync(path.join(h, 'fuel', 'ledger.jsonl'))) return h;
  }
  return null;
}

function holdingHealth(holdingDir) {
  const issues = [];
  const add = (severity, code, capability, message) => issues.push({ severity, code, capability, message });
  const h = locate(holdingDir);
  if (!h) {
    add('error', 'NO_HOLDING', null, `no holding at ${holdingDir} (expected holding/portfolio.json and holding/fuel/ledger.jsonl)`);
    return { ok: false, holding: null, cycle: null, issues };
  }
  let portfolio = null;
  try { portfolio = JSON.parse(fs.readFileSync(path.join(h, 'portfolio.json'), 'utf8')); } catch (err) {
    add('error', 'PORTFOLIO_UNREADABLE', 'cap-po-registry-001', `portfolio.json: ${err.message}`);
  }
  const ledgerFile = path.join(h, 'fuel', 'ledger.jsonl');
  const L = openLedger(ledgerFile, {});
  const v = L.verify();
  if (!v.ok) {
    add('error', 'CHAIN_BROKEN', 'cap-po-ledger-001', `${ledgerFile} line ${v.line}: ${v.reason}`);
    return { ok: false, holding: h, cycle: null, issues };
  }
  let state;
  try { state = L.fold(); } catch (err) {
    add('error', 'LEDGER_INVALID', 'cap-po-ledger-001', err.message);
    return { ok: false, holding: h, cycle: null, issues };
  }

  const lastClosed = state.closed_cycles.length ? state.closed_cycles[state.closed_cycles.length - 1] : null;
  if (lastClosed !== null) {
    const closed = buildReport(state, { cycle: lastClosed, portfolio });
    if (closed.unrated.length) {
      add('warn', 'JUDGMENT_UNFILLED', 'cap-po-judgment-001',
        `cycle ${lastClosed} closed with the judgment column unfilled for ${closed.unrated.join(', ')} (unrated counts as divergent); `
        + 'the company Owner rates with: sdk-holding judge <grantId> advanced|flat|regressed --cycle ' + lastClosed);
    }
  }
  const current = buildReport(state, { portfolio });
  if (current.revisit_trigger.due) {
    add('warn', 'REVISIT_TRIGGER', 'cap-po-proof-002',
      `outside-verifier decision due (proof self-verification risk): ${current.revisit_trigger.reasons.join('; ')}`);
  }
  const unmetered = state.unmetered.filter(u => u.cycle === state.cycle);
  if (unmetered.length) {
    const byCo = {};
    for (const u of unmetered) (byCo[u.company] = byCo[u.company] || []).push(u.run_id);
    add('warn', 'UNMETERED_THIS_CYCLE', 'cap-po-metric-001',
      `${unmetered.length} unmetered session(s) in cycle ${state.cycle}: ${Object.entries(byCo).map(([c, r]) => `${c} (runs ${r.join(', ')})`).join('; ')}; `
      + 'their VOF is suppressed for the cycle');
  }
  return { ok: !issues.some(i => i.severity === 'error'), holding: h, cycle: state.cycle, issues };
}

module.exports = { holdingHealth };
