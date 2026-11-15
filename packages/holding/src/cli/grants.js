'use strict';

/** cli/grants.js — fuel and grants: fund, grant, ratify, proof, judge, close, kill. */

const fs = require('fs');
const path = require('path');
const { openLedger } = require('../ledger');
const { validatePortfolio, loadPortfolio } = require('../portfolio');
const { recordProof, scanReverts } = require('../proofs');
const { closeCycle, endGrant } = require('../cycle');
const { buildReport, formatReport } = require('../report');
const { preflightRun, readiness } = require('../preflight');
const { LIMIT_KEYS, validateLimits } = require('../fold');
const { canonicalize } = require('../canonical');
const {
  SDK_ROOT, KIND_ALIASES, BOOLEAN_FLAGS, DEFAULT_FUEL_LIMITS, TERMINAL, LIMIT_KEYS_DOC, DEFAULT_MAX_TURNS, USAGE, Refusal, usage, refuse, parseArgs, need, posInt, writeJson, openHolding, writeLimits, parseLimitValue, importSettingsConfig, companyMap, qualify, grantOrRefuse, scanAll,
} = require('./common');

const commands = {
  fund({ pos, flags }, io, h) {
    const by = need(flags, 'by', 'fund');
    if (flags.infinite) {
      const L = h.ledger();
      const current = L.fold().limits || refuse('the ledger has no limits yet');
      writeLimits(h, L, { ...current, envelopePerCycle: null }, by);
      io.out('fuel is now infinite: no pool limit; every draw is still metered, tranche gating and kill conditions still apply');
      return;
    }
    const amount = posInt(pos[0] || usage('fund needs <fu> or --infinite'), 'fund amount');
    const L = h.ledger();
    const n = (L.fold().counts.fund || 0) + 1;
    L.append({ type: 'fund', actor: by, idem_key: `fund:cli:${n}`, amount_fu: amount });
    io.out(`pool funded with ${amount} FU (balance ${L.fold().pool.balance_fu} FU)`);
  },

  grant({ flags }, io, h) {
    const company = need(flags, 'company', 'grant');
    if (!(h.portfolio.companies || []).some(c => c.id === company)) refuse(`company ${company} is not registered`);
    const sizes = need(flags, 'tranches', 'grant').split(',').map(s => posInt(s.trim(), 'tranche size'));
    const proofs = need(flags, 'proofs', 'grant').split(',').map(s => s.trim()).filter(Boolean);
    const kill = need(flags, 'kill', 'grant');
    if (proofs.length !== sizes.length) usage(`${sizes.length} tranche(s) need ${sizes.length} named proof(s); got ${proofs.length}`);
    const tranches = sizes.map((size_fu, i) => {
      const m = /^([a-z_]+):(.+)$/.exec(proofs[i]);
      if (!m || !KIND_ALIASES[m[1]]) usage(`proof "${proofs[i]}" must be surface:<ID>, cycle:<loop>/<N> or ship:<id>`);
      return { size_fu, proof: { kind: KIND_ALIASES[m[1]], ref: qualify(company, m[2]) } };
    });
    const L = h.ledger();
    const state = L.fold();
    const grantId = flags.id || `G${Object.keys(state.grants).length + 1}-${company}`;
    const by = flags.by || 'agent';
    const ev = { type: 'grant', actor: by, idem_key: `grant:${grantId}`, grant_id: grantId, company,
      mission_id: need(flags, 'mission', 'grant'), appetite_fu: posInt(need(flags, 'appetite', 'grant'), '--appetite'),
      tranches, kill_condition: kill };
    if (flags.class) ev.bet_class = flags.class;
    L.append(ev);
    const g = L.fold().grants[grantId];
    if (g.status === 'proposed') {
      io.out(`grant ${grantId} proposed (${sizes.join(' + ')} FU, kill: ${kill}); not drawable until the holding Owner runs: sdk-holding ratify ${grantId}`);
    } else {
      io.out(`grant ${grantId} ratified on entry by the holding Owner; tranche 1 (${sizes[0]} FU) is drawable`);
    }
  },

  ratify({ pos, flags }, io, h) {
    const id = pos[0] || usage('ratify needs <grantId>');
    const L = h.ledger();
    L.append({ type: 'ratify', actor: flags.by || 'holding-owner', idem_key: `ratify:${id}`, grant_id: id });
    io.out(`grant ${id} ratified; tranche 1 is drawable`);
  },

  proof({ pos, flags }, io, h) {
    const grantId = pos[0] || usage('proof needs <grantId> <tranche>');
    const tranche = posInt(pos[1] || usage('proof needs <grantId> <tranche>'), 'tranche');
    const L = h.ledger();
    const g = grantOrRefuse(L.fold(), grantId);
    const kind = flags.kind ? (KIND_ALIASES[flags.kind] || usage(`unknown --kind ${flags.kind}`)) : undefined;
    const ref = flags.ref ? qualify(g.company, flags.ref) : undefined;
    const r = recordProof(L, { grantId, tranche, companies: companyMap(h.portfolio), rev: flags.sha || 'HEAD', kind, ref });
    io.out(`proof recorded: ${r.event.proof.kind} ${r.event.proof.ref} @ ${r.event.proof.sha} (tranche ${tranche} of ${grantId})`);
    if (r.released) io.out(`tranche ${r.released} released`);
    else if (r.release_refused) io.out(`next tranche not released: ${r.release_refused}`);
  },

  judge({ pos, flags }, io, h) {
    const grantId = pos[0] || usage('judge needs <grantId> <rating>');
    const rating = pos[1] || usage('judge needs a rating: advanced | flat | regressed');
    const L = h.ledger();
    const cycle = flags.cycle ? posInt(flags.cycle, '--cycle') : L.fold().cycle;
    const n = (L.fold().counts.judgment || 0) + 1;
    L.append({ type: 'judgment', actor: flags.by || 'company-owner', idem_key: `judgment:${grantId}:${cycle}:${n}`, grant_id: grantId, cycle, rating });
    io.out(`${grantId} rated ${rating} for cycle ${cycle}`);
  },

  close({ pos, flags }, io, h) {
    const id = pos[0] || usage('close needs <grantId>');
    const L = h.ledger();
    endGrant(L, id, { actor: flags.by, reason: flags.reason });
    io.out(`grant ${id} closed; ${L.fold().grants[id].returned_fu} FU returned to the pool and credited to ${L.fold().grants[id].company}`);
  },

  kill({ pos, flags }, io, h) {
    const id = pos[0] || usage('kill needs <grantId>');
    const reason = need(flags, 'reason', 'kill');
    const L = h.ledger();
    endGrant(L, id, { kill: true, actor: flags.by, reason });
    io.out(`grant ${id} killed (${reason}); ${L.fold().grants[id].returned_fu} FU returned`);
  },
};

module.exports = commands;
