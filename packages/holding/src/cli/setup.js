'use strict';

/** cli/setup.js — holding setup: init, add-company, limits, price-table, runner-pin, config. */

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

/** The ledger shape of a price table file: { version, models, usd_per_fu? }. */
const tableOf = (pt) => {
  const out = { version: pt && pt.version, models: pt && pt.models };
  if (pt && pt.usd_per_fu !== undefined) out.usd_per_fu = pt.usd_per_fu;
  return out;
};

const commands = {
  init({ pos, flags }, io) {
    const dirArg = pos[0] || usage('init needs <holdingDir>');
    const owner = need(flags, 'owner', 'init');
    const root = path.resolve(dirArg);
    const dir = path.join(root, 'holding');
    if (fs.existsSync(path.join(dir, 'portfolio.json'))) refuse(`a holding already exists at ${root}; nothing changed`);
    const envelope = flags.envelope === undefined ? null : posInt(flags.envelope, '--envelope');
    fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
    fs.chmodSync(dir, 0o700);
    for (const sub of ['fuel', 'runs', 'commons']) fs.mkdirSync(path.join(dir, sub), { recursive: true, mode: 0o700 });
    const ledgerFile = path.join(dir, 'fuel', 'ledger.jsonl');
    fs.writeFileSync(ledgerFile, '', { mode: 0o600, flag: 'wx' });
    const limits = validateLimits({ ...DEFAULT_FUEL_LIMITS, envelopePerCycle: envelope });
    openLedger(ledgerFile, {}).append({ type: 'limits', actor: 'holding-owner', idem_key: 'limits:1', limits });
    writeJson(path.join(dir, 'portfolio.json'), {
      schema_version: 1, holding: { owner },
      second_owner_gates: { os_isolation: false, multi_owner_charter_amendment: false, clo_gate_items: false },
      companies: [],
    });
    writeJson(path.join(dir, 'settings.json'), {
      schema_version: 1,
      limits: { fuel: { ...limits }, _note: 'display copy only; the ledger `limits` events are authoritative' },
      priceTable: null,                // input form: recorded as a `price_table` ledger event before use
      claude: { pinnedVersion: null }, // input form: recorded with runner.sessionFloorUsd as a `runner_pin` event (C5)
      runner: {},                      // LocalRunner options (claudeBin, model, sessionFloorUsd, env, ...)
    });
    io.out(`holding created at ${root} (Owner: ${owner}; fuel: ${envelope === null ? 'infinite, every draw metered' : `${envelope} FU per cycle`}; concurrency 1)`);
    io.out(`next: sdk-holding add-company <path> --id <id> --owner ${owner} --holding ${root}`);
    io.out('before any run: sdk-holding price-table set <file.json> and runner-pin set --claude-version <x.y.z> --session-floor "<model>=<usd>"');
  },

  'add-company'({ pos, flags }, io, h) {
    const p = pos[0] || usage('add-company needs <path>');
    const company = { id: need(flags, 'id', 'add-company'), owner: need(flags, 'owner', 'add-company'), path: path.resolve(p),
      sdkPath: path.resolve(flags['sdk-path'] || SDK_ROOT), runner: 'local' };
    if (flags.name) company.name = flags.name;
    const next = { ...h.portfolio, companies: [...(h.portfolio.companies || []), company] };
    const r = validatePortfolio(next, { holdingDir: h.root });
    if (!r.ok) refuse(`company ${company.id} not registered:\n${r.errors.map(e => `  - ${e.message}`).join('\n')}`);
    writeJson(h.files.portfolio, next);
    io.out(`company ${company.id} registered (Owner ${company.owner}, ${company.path})`);
  },

  limits({ pos, flags }, io, h) {
    const L = h.ledger();
    const current = L.fold().limits;
    if (pos[0] === 'show' || pos[0] === undefined) { io.out(JSON.stringify({ limits: current, source: L.fold().limits_source }, null, 2)); return; }
    if (pos[0] !== 'set') usage('limits supports: limits show | limits set --<key> <value>');
    if (!current) refuse('the ledger has no limits yet (sdk-holding init writes the first)');
    const changes = {};
    for (const k of LIMIT_KEYS) if (flags[k] !== undefined) changes[k] = parseLimitValue(k, flags[k]);
    if (Object.keys(changes).length === 0) usage(`limits set needs at least one --<key> <value> (${LIMIT_KEYS_DOC})`);
    const by = flags.by || 'holding-owner';
    const next = writeLimits(h, L, { ...current, ...changes }, by);
    io.out(`limits recorded in the ledger: ${Object.entries(changes).map(([k, v]) => `${k}=${v}`).join(', ')} (in force from this event on)`);
    if (next.envelopePerCycle !== null && current.envelopePerCycle === null) io.out('note: fuel is finite now; fund the pool before releasing tranches');
  },

  'price-table'({ pos, flags }, io, h) {
    if (pos[0] !== 'set' || !pos[1]) usage('price-table set <file.json>');
    let pt;
    try { pt = JSON.parse(fs.readFileSync(path.resolve(pos[1]), 'utf8')); } catch (e) { refuse(`cannot read ${pos[1]}: ${e.message}`); }
    const L = h.ledger();
    L.append({ type: 'price_table', actor: flags.by || 'holding-owner', idem_key: `price_table:${pt && pt.version}:${(L.fold().counts.price_table || 0) + 1}`,
      price_table: tableOf(pt) });
    io.out(`price table ${pt.version} recorded in the ledger; every later draw must be priced with it`);
  },

  'runner-pin'({ pos, flags }, io, h) {
    if (pos[0] !== 'set') usage('runner-pin set --claude-version <x.y.z> --session-floor "<model>=<usd>[,...]"');
    const version = need(flags, 'claude-version', 'runner-pin set');
    const floors = {};
    for (const part of need(flags, 'session-floor', 'runner-pin set').split(',').map(x => x.trim()).filter(Boolean)) {
      const m = /^([A-Za-z0-9._:-]+)=([0-9.]+)$/.exec(part);
      if (!m || !Number.isFinite(Number(m[2]))) usage(`--session-floor entry "${part}" must be <model>=<usd>`);
      floors[m[1]] = Number(m[2]);
    }
    const L = h.ledger();
    L.append({ type: 'runner_pin', actor: flags.by || 'holding-owner', idem_key: `runner_pin:${version}:${(L.fold().counts.runner_pin || 0) + 1}`,
      claude_code_version: version, session_floor_usd: floors });
    io.out(`runner pinned to Claude Code ${version}; session floors ${Object.entries(floors).map(([k, v]) => `${k}=$${v}`).join(', ')}`);
  },

  config({ pos }, io, h) {
    if (pos[0] !== 'import-settings') usage('config supports: config import-settings');
    const notes = importSettingsConfig(h, h.ledger());
    io.out(notes.length ? notes.join('\n') : 'nothing to import: the ledger already matches settings.json');
    const missing = readiness(h.ledger().fold(), h.settings.runner && h.settings.runner.model);
    if (missing.length) io.out(`still missing before a run: ${missing.join('; ')}`);
  },
};

module.exports = commands;
