'use strict';

/**
 * cli/common.js — argument parsing, holding access and helpers shared by the sdk-holding command groups.
 */

const fs = require('fs');
const path = require('path');
const { openLedger } = require('../ledger');
const { scanReverts } = require('../proofs');
const { LIMIT_KEYS, validateLimits } = require('../fold');
const { canonicalize } = require('../canonical');

const SDK_ROOT = path.resolve(__dirname, '..', '..', '..', '..');
const KIND_ALIASES = { surface: 'verified_surface', cycle: 'graduated_cycle', ship: 'owner_approved_ship',
  verified_surface: 'verified_surface', graduated_cycle: 'graduated_cycle', owner_approved_ship: 'owner_approved_ship' };
const BOOLEAN_FLAGS = new Set(['json', 'infinite', 'from-stdin', 'help']);
const DEFAULT_FUEL_LIMITS = {
  envelopePerCycle: null, trancheSize: null, tranchesPerGrant: null, reclaimCyclesWithoutProof: 1,
  smallBetReserve: 0.2, smallBetMax: null, overrunReserve: 0.05, proofRevertCommits: 10, concurrency: 1,
};
const TERMINAL = new Set(['done', 'interrupted', 'failed']); // the runner's terminal states (runner.js STATES)

const LIMIT_KEYS_DOC = 'envelopePerCycle, reclaimCyclesWithoutProof, smallBetReserve, smallBetMax, overrunReserve, proofRevertCommits, concurrency';
const DEFAULT_MAX_TURNS = 30;
const USAGE = `usage: sdk-holding <command> [--holding <dir>]
  init <holdingDir> --owner <name> [--envelope <fu>]
  add-company <path> --id <id> --owner <name> [--name <n>] [--sdk-path <abs>]
  fund <fu> --by holding-owner          | fund --infinite --by holding-owner
  limits show | limits set --<key> <value> [--<key> <value> ...]   (keys: ${LIMIT_KEYS_DOC}; "null" = no cap)
  price-table set <file.json>           runner-pin set --claude-version <x.y.z> --session-floor "<model>=<usd>[,...]"
  config import-settings                 (record settings.json priceTable / claude.pinnedVersion / runner.sessionFloorUsd)
  grant --company <id> --mission <id> --appetite <fu> --tranches "100,200"
        --proofs "surface:<ID>,cycle:discovery/1,ship:<id>" --kill "<condition>" [--class <c>] [--id <g>] [--by agent]
  ratify <grantId>
  run <company> --grant <id> --mission <id> --prompt "<text>" --max-budget-usd <usd> [--model <id>] [--max-turns <n>]
  proof <grantId> <tranche> [--kind surface|cycle|ship] [--ref <id>] [--sha <rev>]
  judge <grantId> advanced|flat|regressed [--cycle <n>]
  close <grantId> | kill <grantId> --reason "<why>"
  cycle close
  freeze [--reason "<why>"] | unfreeze
  report [--json] [--cycle <n>]
  verify
  reconcile --company <id> --provider-usd <usd> --period <cycle> [--evidence <ref>]
  sandbox setup --user <name> --home <abs> [--session-dir <abs>] [--runtime-dir <abs>] [--node <abs>] [--company <id>] [--claude-bin <abs>] | sandbox doctor | sandbox show
  key set <company> --from-stdin
Owner commands refuse with RUN_CONTEXT when HOLDING_RUN_ID is set (inside a session).`;

class Refusal extends Error { constructor(message, code = 1) { super(message); this.exitCode = code; } }
const usage = (msg) => { throw new Refusal(`${msg}\n\n${USAGE}`, 2); };
const refuse = (msg) => { throw new Refusal(msg, 1); };

function parseArgs(argv) {
  const pos = []; const flags = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const name = a.slice(2);
      if (BOOLEAN_FLAGS.has(name)) { flags[name] = true; continue; }
      if (i + 1 >= argv.length) usage(`--${name} needs a value`);
      flags[name] = argv[++i];
    } else pos.push(a);
  }
  return { pos, flags };
}

const need = (flags, name, cmd) => (flags[name] !== undefined && flags[name] !== '' ? flags[name] : usage(`${cmd} needs --${name}`));
function posInt(v, what) {
  if (!/^[0-9]+$/.test(String(v)) || !Number.isSafeInteger(Number(v)) || Number(v) <= 0) usage(`${what} must be a positive integer, got ${JSON.stringify(v)}`);
  return Number(v);
}

function writeJson(file, obj, mode = 0o600) {
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(obj, null, 2) + '\n', { mode });
  fs.renameSync(tmp, file);
}

/** Paths and loaded state of an existing holding. */
function openHolding(root) {
  const dir = path.join(root, 'holding');
  const files = { dir, portfolio: path.join(dir, 'portfolio.json'), settings: path.join(dir, 'settings.json'),
    ledger: path.join(dir, 'fuel', 'ledger.jsonl'), runs: path.join(dir, 'runs') };
  if (!fs.existsSync(files.portfolio) || !fs.existsSync(files.settings)) {
    refuse(`no holding at ${root} (expected holding/portfolio.json and holding/settings.json); run: sdk-holding init <dir> --owner <name>`);
  }
  const settings = JSON.parse(fs.readFileSync(files.settings, 'utf8'));
  const portfolio = JSON.parse(fs.readFileSync(files.portfolio, 'utf8'));
  // No genesis limits: the ledger's own `limits` events are the only fuel policy (init writes the first).
  return { root, files, settings, portfolio, ledger: () => openLedger(files.ledger, {}) };
}

/** Write a full `limits` event and refresh settings.json's display copy. */
function writeLimits(h, L, limits, by) {
  const clean = validateLimits(limits);
  const n = (L.fold().counts.limits || 0) + 1;
  L.append({ type: 'limits', actor: by, idem_key: `limits:${n}`, limits: clean });
  h.settings.limits = { fuel: { ...clean }, _note: 'display copy only; the ledger `limits` events are authoritative' };
  writeJson(h.files.settings, h.settings);
  return clean;
}

function parseLimitValue(key, raw) {
  if (raw === 'null') return null;
  const n = Number(raw);
  if (raw === '' || !Number.isFinite(n)) usage(`--${key} must be a number or null, got ${JSON.stringify(raw)}`);
  return n;
}

/** Settings.json input form → ledger events, only where new or changed. Returns notices. */
function importSettingsConfig(h, L, by = 'holding-owner') {
  const notes = [];
  const state = L.fold();
  const pt = h.settings.priceTable;
  const shape = (x) => (x.usd_per_fu !== undefined ? { version: x.version, models: x.models, usd_per_fu: x.usd_per_fu } : { version: x.version, models: x.models });
  if (pt && (!state.config.price_table || canonicalize(shape(pt)) !== canonicalize(shape(state.config.price_table)))) {
    L.append({ type: 'price_table', actor: by, idem_key: `price_table:${pt.version}:${(state.counts.price_table || 0) + 1}`, price_table: shape(pt) });
    notes.push(`recorded price table ${pt.version} from settings.json in the ledger`);
  }
  const version = h.settings.claude && h.settings.claude.pinnedVersion;
  const floors = (h.settings.runner && h.settings.runner.sessionFloorUsd) || (h.settings.claude && h.settings.claude.sessionFloorUsd);
  const pin = state.config.runner_pin;
  if (version && floors && (!pin || pin.claude_code_version !== version || canonicalize(pin.session_floor_usd) !== canonicalize(floors))) {
    L.append({ type: 'runner_pin', actor: by, idem_key: `runner_pin:${version}:${(state.counts.runner_pin || 0) + 1}`, claude_code_version: version, session_floor_usd: floors });
    notes.push(`recorded runner pin ${version} (session floors ${Object.entries(floors).map(([m, u]) => `${m}=$${u}`).join(', ')}) from settings.json in the ledger`);
  }
  return notes;
}

const companyMap = (portfolio) => Object.fromEntries((portfolio.companies || []).map(c => [c.id, c.path]));
const qualify = (company, ref) => (ref.startsWith(`${company}/`) ? ref : `${company}/${ref}`);

function grantOrRefuse(state, id) {
  const g = state.grants[id];
  if (!g) refuse(`no grant ${id}`);
  return g;
}

/** Revert scan over companies whose clone exists; returns the number of reverts recorded. */
function scanAll(L, h, io) {
  const companies = {};
  for (const c of h.portfolio.companies || []) {
    if (fs.existsSync(path.join(c.path, '.git'))) companies[c.id] = c.path;
    else io.err(`warning: ${c.id} clone not found at ${c.path}; its proofs were not re-checked for reverts`);
  }
  const limits = L.fold().limits;
  const evs = scanReverts(L, { companies, windowCommits: (limits && limits.proofRevertCommits) || 10 });
  for (const e of evs) io.err(`proof reverted: ${e.grant_id} tranche ${e.tranche} — ${e.reason}`);
  return evs.length;
}

module.exports = { SDK_ROOT, KIND_ALIASES, BOOLEAN_FLAGS, DEFAULT_FUEL_LIMITS, TERMINAL, LIMIT_KEYS_DOC, DEFAULT_MAX_TURNS, USAGE, Refusal, usage, refuse, parseArgs, need, posInt, writeJson, openHolding, writeLimits, parseLimitValue, importSettingsConfig, companyMap, qualify, grantOrRefuse, scanAll };
