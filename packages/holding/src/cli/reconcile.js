'use strict';

/**
 * cli/reconcile.js — cap-po-reconcile-001, minimal and manual: the holding Owner types the
 * provider console's spend for one company and one Betting cycle. No provider API is called.
 *
 *   reconcile --company <id> --provider-usd <amount> --period <cycle> [--evidence <ref>]
 *
 * provider FU = round(provider_usd ÷ price_table.usd_per_fu); metered FU = the company's draws +
 * overruns in that cycle. A `reconcile` event settles the period's provisional debits (unblocking
 * the next tranche); a non-zero difference is recorded as an `unmetered` event (source: reconcile)
 * carrying the evidence reference — positive means the provider saw burn the ledger did not.
 */

const { refuse, usage, need, posInt } = require('./common');

const commands = {
  reconcile({ flags }, io, h) {
    const company = need(flags, 'company', 'reconcile');
    if (!(h.portfolio.companies || []).some(c => c.id === company)) refuse(`company ${company} is not registered`);
    const usd = Number(need(flags, 'provider-usd', 'reconcile'));
    if (!Number.isFinite(usd) || usd < 0) usage(`--provider-usd must be a non-negative number, got ${JSON.stringify(flags['provider-usd'])}`);
    const period = posInt(need(flags, 'period', 'reconcile'), '--period');
    const L = h.ledger();
    const st = L.fold();
    if (period > st.cycle) refuse(`cycle ${period} has not started (the open cycle is ${st.cycle})`);
    const pt = st.config.price_table;
    if (!pt || !pt.usd_per_fu) {
      refuse('reconcile needs the price table in force to carry usd_per_fu (list-price USD per FU) to compare provider dollars with ledger FU; '
        + 'record one with: sdk-holding price-table set <file.json>  ({ version, models, usd_per_fu })');
    }
    const key = String(period);
    let metered = 0;
    for (const g of Object.values(st.grants)) {
      if (g.company !== company) continue;
      metered += ((g.fu_by_cycle || {})[key] || 0) + ((g.overrun_by_cycle || {})[key] || 0);
    }
    const open = st.provisional.filter(p => !p.settled && p.company === company && p.cycle === period);
    const provisional = open.reduce((s, p) => s + p.fu, 0);
    const providerFu = Math.round(usd / pt.usd_per_fu);
    const difference = providerFu - metered;
    const n = (st.counts.reconcile || 0) + 1;
    const ev = { type: 'reconcile', actor: 'holding-owner', idem_key: `reconcile:${company}:${period}:${n}`, company, period,
      provider_usd: usd, provider_fu: providerFu, metered_fu: metered, provisional_fu: provisional, difference_fu: difference,
      usd_per_fu: pt.usd_per_fu, price_table_version: pt.version };
    if (flags.evidence) ev.evidence = flags.evidence;
    L.append(ev);
    if (difference !== 0) {
      const um = { type: 'unmetered', actor: 'holding-owner', source: 'reconcile', idem_key: `unmetered:reconcile:${company}:${period}:${n}`,
        company, run_id: `reconcile:${company}:${period}`, session_id: 'provider', period, fu: difference,
        reason: `provider usage $${usd} (${providerFu} FU) vs ${metered} FU metered in cycle ${period}: ${difference > 0 ? 'unmetered burn' : 'ledger above provider'} of ${Math.abs(difference)} FU` };
      if (flags.evidence) um.evidence = flags.evidence;
      L.append(um);
    }
    io.out(`reconciled ${company} cycle ${period}: provider $${usd} = ${providerFu} FU, metered ${metered} FU, difference ${difference} FU`
      + `${flags.evidence ? ` (evidence ${flags.evidence})` : ''}; ${open.length} provisional debit(s) settled (${provisional} FU)`);
    if (difference !== 0) io.out(`recorded the difference as unmetered (source: reconcile)${difference > 0 ? ' — burn the runner never saw' : ''}`);
  },
};

module.exports = commands;
