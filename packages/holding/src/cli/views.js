'use strict';

/** cli/views.js — ledger views: cycle close, report, verify. */

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
const { readRunRecords } = require('../health');
const {
  SDK_ROOT, KIND_ALIASES, BOOLEAN_FLAGS, DEFAULT_FUEL_LIMITS, TERMINAL, LIMIT_KEYS_DOC, DEFAULT_MAX_TURNS, USAGE, Refusal, usage, refuse, parseArgs, need, posInt, writeJson, openHolding, writeLimits, parseLimitValue, importSettingsConfig, companyMap, qualify, grantOrRefuse, scanAll,
} = require('./common');

const commands = {
  cycle({ pos, flags }, io, h) {
    if (pos[0] !== 'close') usage('cycle supports: cycle close');
    if (flags.by && flags.by !== 'holding-owner') refuse(`only holding-owner closes a Betting cycle (by: ${flags.by})`);
    const L = h.ledger();
    const reverts = scanAll(L, h, io);
    const res = closeCycle(L);
    io.out(`cycle ${res.closed_cycle} closed: ${res.reclaims.length} grant(s) reclaimed${res.reclaims.map(r => ` ${r.grant_id} (${r.undrawn_fu} FU)`).join(',')}` +
      `, ${reverts} proof revert(s)${res.funded_fu ? `, pool topped up by ${res.funded_fu} FU for cycle ${res.closed_cycle + 1}` : ''}`);
    io.out(formatReport(buildReport(L.fold(), { cycle: res.closed_cycle, portfolio: h.portfolio })));
  },

  report({ flags }, io, h) {
    const L = h.ledger();
    scanAll(L, h, io);
    const r = buildReport(L.fold(), { cycle: flags.cycle ? posInt(flags.cycle, '--cycle') : undefined, portfolio: h.portfolio,
      runs: readRunRecords(h.files.dir) });
    io.out(flags.json ? JSON.stringify(r, null, 2) : formatReport(r));
  },

  verify(_args, io, h) {
    const v = h.ledger().verify();
    const p = loadPortfolio(h.files.portfolio, { holdingDir: h.root });
    const problems = [];
    if (!v.ok) problems.push(`ledger ${h.files.ledger} line ${v.line}: ${v.reason}`);
    if (!p.ok) problems.push(...p.errors.map(e => `portfolio: ${e.message}`));
    if (problems.length) refuse(`verify failed:\n${problems.map(x => `  - ${x}`).join('\n')}`);
    io.out(`ledger verified (${v.count} events, hash chain intact); portfolio valid`);
  },
};

module.exports = commands;
