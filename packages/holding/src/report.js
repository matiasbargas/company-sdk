'use strict';

/**
 * report.js — the ledger report (cap-po-metric-001, cap-po-judgment-001, cap-po-proof-002).
 *
 * A pure function of the folded ledger state (plus the portfolio for Owner identity). Per Betting
 * cycle c (default: the open cycle):
 *   bet      = a grant funded in c (ratified at or before c, not ended before c)
 *   FU       = drawn + overrun in c (fully loaded: every draw counts, killed bets included)
 *   weight   = Σ WEIGHTS[kind] of proofs recorded in c and not reverted
 *   VOF      = weight ÷ FU × 1e6 (null when no FU was drawn in c)
 *   suppress = a company with any unmetered session in c shows VOF null + the reason, for the
 *              company and each of its bets (an unmetered session makes the denominator false)
 *   judgment = the company Owner's rating for c (advanced | flat | regressed | unrated)
 * VOF is compared only within a bet class. Divergence for a class in c is computed only when the
 * class has ≥ 3 funded bets: ≥ 50% of the bets whose VOF is above the class median are rated flat,
 * regressed, or left unrated. Bets with suppressed or null VOF cannot be ranked and are left out of
 * the median (the report says how many). The revisit trigger (outside-verifier decision due) fires
 * on divergence in 2 consecutive *closed* cycles, or when a company Owner differs from the holding
 * Owner. VOF guides the Betting Table; it never decides alone.
 *
 * Visibility (Guardian finding 5): provisional debits for unmetered sessions (charged and
 * uncharged FU, per company and cycle), periods not yet reconciled against the provider, the
 * provider-vs-ledger differences, and runs whose tools were denied (opts.runs = run records with
 * `permission_denials` and terminal_reason `no_work_denied`). Provisional FU rests on the runner's
 * live estimate, which undercounts (spike 2: 16 vs 73 output tokens), or the session floor: it is
 * an estimate until reconciled, and the report says so (LIVE_ESTIMATE_CAVEAT).
 */

const WEIGHTS = Object.freeze({ verified_surface: 1, graduated_cycle: 2, owner_approved_ship: 3 });
const LIVE_ESTIMATE_CAVEAT = 'provisional FU is an estimate: the runner\'s live estimate undercounts (assistant-event snapshots; '
  + 'spike 2 saw 16 of 73 output tokens) and the session floor is a minimum; reconcile against the provider console '
  + '(sdk-holding reconcile) before reading these numbers as true';
const MIN_CLASS = 3;

const round2 = (x) => Math.round(x * 100) / 100;
const num = (o, k) => (o && o[k]) || 0;

function fundedIn(g, c) {
  return g.ratified_cycle !== null && g.ratified_cycle !== undefined && g.ratified_cycle <= c &&
    (g.ended_cycle === null || g.ended_cycle === undefined || g.ended_cycle >= c);
}

function median(xs) {
  const s = [...xs].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

function betRow(g, c, weights, suppressedReason) {
  const key = String(c);
  const fu = num(g.fu_by_cycle, key) + num(g.overrun_by_cycle, key);
  const proofs = g.tranches.filter(t => t.proven && t.proof_cycle === c).map(t => ({
    tranche: t.index, kind: t.proof.kind, ref: t.proof.ref, sha: t.proof.sha, weight: weights[t.proof.kind] || 0, reverted: t.reverted,
  }));
  const weight = proofs.filter(p => !p.reverted).reduce((s, p) => s + p.weight, 0);
  const raw = fu > 0 ? weight / fu * 1e6 : null;
  const lifetimeFu = Object.values(g.fu_by_cycle || {}).reduce((s, v) => s + v, 0) + Object.values(g.overrun_by_cycle || {}).reduce((s, v) => s + v, 0);
  const lifetimeWeight = g.tranches.filter(t => t.proven && !t.reverted && t.proof).reduce((s, t) => s + (weights[t.proof.kind] || 0), 0);
  return {
    grant_id: g.grant_id, company: g.company, mission_id: g.mission_id, bet_class: g.bet_class || 'default', status: g.status,
    fu_loaded: fu, proofs, weight,
    provisional_fu: num(g.provisional_by_cycle, key), provisional_open: g.provisional_open || 0,
    vof: suppressedReason ? null : (raw === null ? null : round2(raw)),
    vof_suppressed: suppressedReason || null,
    judgment: (g.judgments && g.judgments[key]) || 'unrated',
    lifetime: { fu_loaded: lifetimeFu, weight: lifetimeWeight },
    _raw: suppressedReason ? null : raw,
  };
}

function classDivergence(bets) {
  if (bets.length < MIN_CLASS) {
    return { computed: false, flagged: false, reason: `${bets.length} funded bet(s); divergence needs at least ${MIN_CLASS}` };
  }
  const ranked = bets.filter(b => b._raw !== null);
  if (ranked.length === 0) return { computed: false, flagged: false, reason: 'no bet in the class has a VOF this cycle (no FU drawn or suppressed)' };
  const med = median(ranked.map(b => b._raw));
  const above = ranked.filter(b => b._raw > med).sort((a, b) => b._raw - a._raw || a.grant_id.localeCompare(b.grant_id));
  const divergent = above.filter(b => b.judgment !== 'advanced');
  return {
    computed: true,
    median_vof: round2(med),
    unranked: bets.length - ranked.length,
    above_median: above.map(b => b.grant_id),
    divergent: divergent.map(b => b.grant_id),
    flagged: above.length > 0 && divergent.length / above.length >= 0.5,
  };
}

function cycleView(state, c, weights) {
  const unmeteredBy = {};
  for (const u of state.unmetered || []) {
    if (u.cycle === c) (unmeteredBy[u.company] = unmeteredBy[u.company] || []).push(u);
  }
  const reasonFor = (company) => {
    const us = unmeteredBy[company];
    if (!us) return null;
    return `${us.length} unmetered session${us.length > 1 ? 's' : ''} in cycle ${c} (runs ${us.map(u => u.run_id).join(', ')}): FU is incomplete`;
  };
  const bets = Object.values(state.grants).filter(g => fundedIn(g, c)).map(g => betRow(g, c, weights, reasonFor(g.company)))
    .sort((a, b) => a.grant_id.localeCompare(b.grant_id));
  const byClass = {};
  for (const b of bets) (byClass[b.bet_class] = byClass[b.bet_class] || []).push(b);
  const classes = Object.keys(byClass).sort().map(k => ({ bet_class: k, funded: byClass[k].length, divergence: classDivergence(byClass[k]) }));
  return { bets, classes, unmeteredBy, reasonFor };
}

/** opts: { cycle?, portfolio?, weights? } */
function buildReport(state, opts = {}) {
  const weights = opts.weights || WEIGHTS;
  const c = opts.cycle ?? state.cycle;
  const closed = (state.closed_cycles || []).includes(c);
  const view = cycleView(state, c, weights);

  const companyIds = new Set(view.bets.map(b => b.company));
  for (const id of Object.keys(view.unmeteredBy)) companyIds.add(id);
  const portfolio = opts.portfolio || null;
  if (portfolio && Array.isArray(portfolio.companies)) for (const co of portfolio.companies) companyIds.add(co.id);
  const companies = [...companyIds].sort().map(id => {
    const mine = view.bets.filter(b => b.company === id);
    const fu = mine.reduce((s, b) => s + b.fu_loaded, 0);
    const weight = mine.reduce((s, b) => s + b.weight, 0);
    const suppressed = view.reasonFor(id);
    return {
      id, bets: mine.length, fu_loaded: fu, weight,
      vof: suppressed ? null : (fu > 0 ? round2(weight / fu * 1e6) : null),
      vof_suppressed: suppressed,
      unmetered: (view.unmeteredBy[id] || []).map(u => ({ run_id: u.run_id, session_id: u.session_id, reason: u.reason })),
      credit_fu: num(state.credits, id),
      provisional_fu: (state.provisional || []).filter(p => p.company === id && p.cycle === c).reduce((s, p) => s + p.charged_fu, 0),
      uncharged_fu: (state.provisional || []).filter(p => p.company === id && p.cycle === c).reduce((s, p) => s + p.uncharged_fu, 0),
      reconciled: (state.reconciliations || []).some(r => r.company === id && r.period === c),
    };
  });
  const unreconciled = unreconciledPeriods(state);
  const runs = runVisibility(opts.runs || []);

  const divergenceByCycle = (state.closed_cycles || []).map(cc => ({
    cycle: cc, flagged: cycleView(state, cc, weights).classes.some(k => k.divergence.flagged),
  }));
  const reasons = [];
  for (let i = 1; i < divergenceByCycle.length; i++) {
    const a = divergenceByCycle[i - 1]; const b = divergenceByCycle[i];
    if (a.flagged && b.flagged && b.cycle === a.cycle + 1) reasons.push(`divergence in cycles ${a.cycle} and ${b.cycle} (consecutive)`);
  }
  if (portfolio && portfolio.holding && Array.isArray(portfolio.companies)) {
    for (const co of portfolio.companies) {
      if (co.owner && co.owner !== portfolio.holding.owner) reasons.push(`second Owner registered: ${co.owner} (company ${co.id})`);
    }
  }

  const bets = view.bets.map(({ _raw, ...b }) => b);
  return {
    cycle: c,
    cycle_closed: closed,
    provisional: !closed,
    weights,
    pool: { ...state.pool },
    frozen: !!state.frozen,
    companies,
    bets,
    classes: view.classes.map(k => ({ ...k })),
    unrated: bets.filter(b => b.judgment === 'unrated').map(b => b.grant_id),
    divergence_by_cycle: divergenceByCycle,
    revisit_trigger: {
      due: reasons.length > 0,
      reasons,
      decision: reasons.length ? 'outside-verifier decision for fuel proofs is due (proof self-verification risk, cap-po-proof-002)' : null,
    },
    provisional: {
      open_fu: (state.provisional || []).filter(p => !p.settled).reduce((s, p) => s + p.fu, 0),
      unreconciled,
      caveat: (state.provisional || []).length ? LIVE_ESTIMATE_CAVEAT : null,
    },
    reconciliations: (state.reconciliations || []).map(r => ({ ...r })),
    runs,
    warnings: [...(state.warnings || [])],
  };
}

/** Company × cycle groups of unsettled provisional debits. */
function unreconciledPeriods(state) {
  const by = new Map();
  for (const p of state.provisional || []) {
    if (p.settled) continue;
    const k = `${p.company}\u0000${p.cycle}`;
    const g = by.get(k) || { company: p.company, cycle: p.cycle, sessions: 0, fu: 0, charged_fu: 0, uncharged_fu: 0, runs: [] };
    g.sessions++; g.fu += p.fu; g.charged_fu += p.charged_fu; g.uncharged_fu += p.uncharged_fu; g.runs.push(p.run_id);
    by.set(k, g);
  }
  return [...by.values()].sort((a, b) => a.company.localeCompare(b.company) || a.cycle - b.cycle);
}

/** Runs whose tools were denied: count per run, and `no_work_denied` (achieved nothing). */
function runVisibility(records) {
  const out = [];
  for (const r of records) {
    const pd = r.permission_denials;
    const denials = Array.isArray(pd) ? pd.length : (Number.isSafeInteger(pd) ? pd : 0);
    const noWork = r.terminal_reason === 'no_work_denied';
    if (!denials && !noWork) continue;
    const tools = Array.isArray(pd) ? [...new Set(pd.map(d => (d && (d.tool_name || d.tool)) || 'unknown'))] : [];
    out.push({ run_id: r.run_id, company: r.company || null, grant_id: r.grant_id || null, state: r.state || null,
      terminal_reason: r.terminal_reason || null, denials, denied_tools: tools, no_work: noWork });
  }
  return out.sort((a, b) => String(a.run_id).localeCompare(String(b.run_id)));
}

const fmtVof = (v, why) => (why ? `suppressed (${why})` : v === null ? 'n/a (no FU drawn)' : String(v));

function formatReport(r) {
  const L = [];
  L.push(`Ledger report — Betting cycle ${r.cycle} (${r.cycle_closed ? 'closed' : 'open, provisional'})${r.frozen ? ' — LEDGER FROZEN' : ''}`);
  const p = r.pool;
  L.push(`Pool: ${p.infinite ? 'infinite fuel (every draw metered)' : `${p.balance_fu} FU`}` +
    (p.reserves ? ` | general ${p.general_fu} · small-bet reserve ${p.reserves.small_bet_fu} · overrun reserve ${p.reserves.overrun_fu}${p.overrun_reserve_empty ? ' (EMPTY: overruns stop)' : ''}` : ''));
  L.push('');
  L.push('Companies (VOF = Σ proof weight ÷ FU × 1e6, fully loaded):');
  for (const c of r.companies) {
    L.push(`  ${c.id}: ${c.bets} bet(s), ${c.fu_loaded} FU, weight ${c.weight}, VOF ${fmtVof(c.vof, c.vof_suppressed)}${c.credit_fu ? `, credit ${c.credit_fu} FU` : ''}` +
      (c.provisional_fu || c.uncharged_fu ? `, provisional ${c.provisional_fu} FU charged + ${c.uncharged_fu} FU uncharged${c.reconciled ? ' (reconciled)' : ' (UNRECONCILED)'}` : ''));
  }
  if (r.provisional.unreconciled.length) {
    L.push('');
    L.push('Unreconciled unmetered spend (next tranche blocked until reconciled):');
    for (const u of r.provisional.unreconciled) {
      L.push(`  ${u.company} cycle ${u.cycle}: ${u.sessions} session(s), ${u.fu} FU provisional (${u.charged_fu} charged, ${u.uncharged_fu} uncharged); runs ${u.runs.join(', ')}`);
      L.push(`    sdk-holding reconcile --company ${u.company} --provider-usd <from the provider console> --period ${u.cycle} --evidence <ref>`);
    }
  }
  if (r.provisional.caveat) L.push(`note: ${r.provisional.caveat}`);
  for (const x of r.reconciliations) {
    L.push(`reconciled ${x.company} cycle ${x.period}: provider $${x.provider_usd} = ${x.provider_fu} FU vs metered ${x.metered_fu} FU → difference ${x.difference_fu} FU${x.evidence ? ` (evidence ${x.evidence})` : ''}`);
  }
  if (r.runs.length) {
    L.push('');
    L.push('Runs with denied tools:');
    for (const x of r.runs) {
      L.push(`  ${x.run_id} [${x.company || '?'}] ${x.terminal_reason || x.state || ''}: ${x.denials} denial(s)${x.denied_tools.length ? ` (${x.denied_tools.join(', ')})` : ''}${x.no_work ? ' — ACHIEVED NOTHING (no_work_denied)' : ''}`);
    }
  }
  for (const k of r.classes) {
    L.push('');
    const d = k.divergence;
    L.push(`Class ${k.bet_class} (${k.funded} funded) — ${d.computed ? (d.flagged ? `DIVERGENCE: ${d.divergent.join(', ')} of above-median ${d.above_median.join(', ')}` : `no divergence (median VOF ${d.median_vof})`) : `divergence not computed: ${d.reason}`}`);
    for (const b of r.bets.filter(x => x.bet_class === k.bet_class)) {
      const proofs = b.proofs.map(pr => `${pr.kind}:${pr.ref}@${pr.sha.slice(0, 8)}${pr.reverted ? ' REVERTED' : ''}`).join('; ') || '—';
      L.push(`  ${b.grant_id} [${b.company}/${b.mission_id}, ${b.status}] FU ${b.fu_loaded} | proofs ${proofs} | VOF ${fmtVof(b.vof, b.vof_suppressed)} | Owner: ${b.judgment}`);
    }
  }
  if (r.unrated.length) { L.push(''); L.push(`Judgment column unfilled for: ${r.unrated.join(', ')} (unrated counts as divergent)`); }
  if (r.revisit_trigger.due) {
    L.push(''); L.push('OUTSIDE-VERIFIER DECISION DUE:');
    for (const x of r.revisit_trigger.reasons) L.push(`  - ${x}`);
  }
  for (const w of r.warnings) L.push(`warning: ${w}`);
  L.push('');
  L.push('VOF guides the Betting Table; it never decides alone. Compare only within a class, beside the Owner\'s judgment.');
  return L.join('\n');
}

module.exports = { buildReport, formatReport, WEIGHTS, MIN_CLASS, LIVE_ESTIMATE_CAVEAT };
