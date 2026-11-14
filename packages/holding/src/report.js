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
 */

const WEIGHTS = Object.freeze({ verified_surface: 1, graduated_cycle: 2, owner_approved_ship: 3 });
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
    };
  });

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
    warnings: [...(state.warnings || [])],
  };
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
    L.push(`  ${c.id}: ${c.bets} bet(s), ${c.fu_loaded} FU, weight ${c.weight}, VOF ${fmtVof(c.vof, c.vof_suppressed)}${c.credit_fu ? `, credit ${c.credit_fu} FU` : ''}`);
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

module.exports = { buildReport, formatReport, WEIGHTS, MIN_CLASS };
