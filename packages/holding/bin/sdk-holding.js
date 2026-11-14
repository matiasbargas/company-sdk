#!/usr/bin/env node
'use strict';

/**
 * sdk-holding — the holding Owner's command line for the Portfolio Orchestrator.
 *
 * Layout (created by `init`, holding/ is 0700 under the Owner's user, D7):
 *   <holdingDir>/holding/portfolio.json      registry (portfolio.js)
 *   <holdingDir>/holding/settings.json       runner options + input form (see "Authority" below)
 *   <holdingDir>/holding/fuel/ledger.jsonl   the fuel ledger (ledger.js)
 *   <holdingDir>/holding/runs/               run records (owned by the runner)
 *   <holdingDir>/holding/commons/            commons (not yet built)
 *
 * The holding dir comes from --holding, else $SDK_HOLDING, else the current directory.
 * Exit codes: 0 done · 1 refused (the reason is printed) · 2 usage error.
 * `--by` names the actor: fund requires it; ratify/freeze/unfreeze/cycle/close/kill default to
 * holding-owner, grant to agent (a proposal), judge to company-owner. The ledger enforces who may
 * write what; the OS (D7) is the real barrier — this CLI stops honest mistakes.
 *
 *
 * Authority (iteration 2): everything that changes how the ledger replays or how a draw is priced
 * lives in the hash chain. Fuel limits are `limits` events, written by `init`, `limits set` and
 * `fund --infinite`; settings.json keeps a display copy (limits.fuel) that nothing reads. The price
 * table and Claude Code pin are `price_table` / `runner_pin` events (a full event, not a hash in
 * each draw: a hash proves a table changed but cannot recompute a draw's FU; the event can). The
 * Owner may type them into settings.json (priceTable, claude.pinnedVersion, runner.sessionFloorUsd)
 * as an input form: `run` and `config import-settings` record any new or changed value as a
 * ledger event first and say so; the runner and replay only ever read the ledger.
 *
 * main(argv, deps) is exported for tests: deps = { runner?, stdout?, stderr?, env?, cwd? }.
 * Without deps.runner, `run` builds the LocalRunner from settings (src/runner.js).
 */

const fs = require('fs');
const path = require('path');
const { openLedger } = require('../src/ledger');
const { validatePortfolio, loadPortfolio } = require('../src/portfolio');
const { recordProof, scanReverts } = require('../src/proofs');
const { closeCycle, endGrant } = require('../src/cycle');
const { buildReport, formatReport } = require('../src/report');
const { preflightRun, readiness } = require('../src/preflight');
const { LIMIT_KEYS, validateLimits } = require('../src/fold');
const { canonicalize } = require('../src/canonical');

const SDK_ROOT = path.resolve(__dirname, '..', '..', '..');
const KIND_ALIASES = { surface: 'verified_surface', cycle: 'graduated_cycle', ship: 'owner_approved_ship',
  verified_surface: 'verified_surface', graduated_cycle: 'graduated_cycle', owner_approved_ship: 'owner_approved_ship' };
const BOOLEAN_FLAGS = new Set(['json', 'infinite']);
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
  verify`;

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
  if (pt && (!state.config.price_table || canonicalize({ version: pt.version, models: pt.models })
    !== canonicalize({ version: state.config.price_table.version, models: state.config.price_table.models }))) {
    L.append({ type: 'price_table', actor: by, idem_key: `price_table:${pt.version}:${(state.counts.price_table || 0) + 1}`, price_table: { version: pt.version, models: pt.models } });
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

// ── commands ──────────────────────────────────────────────────────────────────

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
      price_table: { version: pt && pt.version, models: pt && pt.models } });
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

  ratify({ pos, flags }, io, h) {
    const id = pos[0] || usage('ratify needs <grantId>');
    const L = h.ledger();
    L.append({ type: 'ratify', actor: flags.by || 'holding-owner', idem_key: `ratify:${id}`, grant_id: id });
    io.out(`grant ${id} ratified; tranche 1 is drawable`);
  },

  async run({ pos, flags }, io, h, deps) {
    const company = pos[0] || usage('run needs <company>');
    const grantId = need(flags, 'grant', 'run');
    const missionId = need(flags, 'mission', 'run');
    const prompt = need(flags, 'prompt', 'run');
    const maxTurns = flags['max-turns'] === undefined ? DEFAULT_MAX_TURNS : posInt(flags['max-turns'], '--max-turns');
    const co = (h.portfolio.companies || []).find(c => c.id === company) || refuse(`company ${company} is not registered`);
    const L = h.ledger();
    // 1. The ledger's answer first (frozen, ratified, mission, tranche, reserves): the same
    //    pre-flight the runner runs (preflight.js); the runner stays the authority at start.
    preflightRun(L.fold(), { companyId: company, grantId, missionId });
    // 2. The per-run budget and the model this session is pinned to.
    if (flags['max-budget-usd'] === undefined) refuse('run needs --max-budget-usd <usd> (the per-run soft ceiling, cap-po-runner-005)');
    const maxBudgetUsd = Number(flags['max-budget-usd']);
    if (!Number.isFinite(maxBudgetUsd) || maxBudgetUsd <= 0) usage(`--max-budget-usd must be a positive number, got ${JSON.stringify(flags['max-budget-usd'])}`);
    const model = flags.model || (h.settings.runner && h.settings.runner.model);
    if (!model) refuse('run needs --model <id> (or settings.json runner.model): the session is pinned to one model');
    // 3. Readiness: price table, Claude Code pin and session floor are in the ledger (recorded from
    //    the settings.json input form when it carries new values).
    for (const note of importSettingsConfig(h, L)) io.out(note);
    preflightRun(L.fold(), { companyId: company, grantId, missionId, model, maxBudgetUsd, requireConfig: true });
    const left = (() => { const g = L.fold().grants[grantId]; return g.released_fu - g.drawn_fu; })();
    const runner = deps.runner || makeRunner(h);
    const runId = await runner.start(co.id, { grantId, missionId, prompt, maxTurns, model, maxBudgetUsd });
    io.out(`run ${runId} started for ${company} (grant ${grantId}, ${left} FU open)`);
    let status = null;
    if (typeof runner.wait === 'function') status = await runner.wait(runId);
    else if (typeof runner.status === 'function') status = await runner.status(runId);
    const rec = path.join(h.files.runs, `${runId}.json`);
    if (!fs.existsSync(rec)) { // the LocalRunner writes its own record; never overwrite it
      writeJson(rec, { run_id: runId, company, grant_id: grantId, mission_id: missionId, max_turns: maxTurns, model, max_budget_usd: maxBudgetUsd,
        state: status ? status.state : null, terminal_reason: status ? status.terminalReason || null : null, recorded_by: 'sdk-holding' });
    }
    if (status) io.out(`run ${runId}: ${status.state}${status.terminalReason ? ` (${status.terminalReason})` : ''}`);
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

  async freeze({ flags }, io, h, deps) {
    const L = h.ledger();
    const n = (L.fold().counts.freeze || 0) + 1;
    L.append({ type: 'freeze', actor: flags.by || 'holding-owner', idem_key: `freeze:${n}`, reason: flags.reason || 'kill switch' });
    io.out('ledger frozen: no draws, grants or releases; running sessions land at the next turn boundary');
    if (deps.runner && typeof deps.runner.stop === 'function') {
      for (const f of fs.existsSync(h.files.runs) ? fs.readdirSync(h.files.runs).filter(x => x.endsWith('.json')) : []) {
        let rec; try { rec = JSON.parse(fs.readFileSync(path.join(h.files.runs, f), 'utf8')); } catch { continue; }
        const state = rec.state;
        const runId = rec.run_id || f.replace(/\.json$/, '');
        if (state && !TERMINAL.has(state)) {
          try { await deps.runner.stop(runId, { mode: 'landing' }); io.out(`run ${runId}: landing requested`); } catch (e) { io.err(`run ${runId}: stop failed: ${e.message}`); }
        }
      }
    }
  },

  unfreeze({ flags }, io, h) {
    const L = h.ledger();
    const n = (L.fold().counts.unfreeze || 0) + 1;
    L.append({ type: 'unfreeze', actor: flags.by || 'holding-owner', idem_key: `unfreeze:${n}`, reason: flags.reason || 'resume' });
    io.out('ledger unfrozen');
  },

  report({ flags }, io, h) {
    const L = h.ledger();
    scanAll(L, h, io);
    const r = buildReport(L.fold(), { cycle: flags.cycle ? posInt(flags.cycle, '--cycle') : undefined, portfolio: h.portfolio });
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

function makeRunner(h) {
  let mod;
  try { mod = require('../src/runner'); } catch (e) { refuse(`the LocalRunner is not available (${e.message})`); }
  // Limits, price table, pin and floors come from the ledger; settings.runner carries process options.
  const { limits, priceTable, pinnedVersion, ...runnerOpts } = h.settings.runner || {};
  return mod.createLocalRunner({
    ...runnerOpts,
    holdingDir: h.files.dir,
    companies: (h.portfolio.companies || []).map(c => ({ id: c.id, path: c.path })),
  });
}

async function main(argv, deps = {}) {
  const io = {
    out: deps.stdout || ((s) => process.stdout.write(`${s}\n`)),
    err: deps.stderr || ((s) => process.stderr.write(`${s}\n`)),
  };
  try {
    const [cmd, ...rest] = argv;
    if (!cmd || cmd === '--help' || cmd === 'help') { io.out(USAGE); return cmd ? 0 : 2; }
    const fn = commands[cmd] || usage(`unknown command ${JSON.stringify(cmd)}`);
    const args = parseArgs(rest);
    if (cmd === 'init') { await fn(args, io); return 0; }
    const env = deps.env || process.env;
    const root = path.resolve(args.flags.holding || env.SDK_HOLDING || deps.cwd || process.cwd());
    const h = openHolding(root);
    await fn(args, io, h, deps);
    return 0;
  } catch (err) {
    if (err instanceof Refusal) { io.err(err.message); return err.exitCode; }
    if (err && typeof err.code === 'string') { io.err(`refused: ${err.message}`); return 1; }
    io.err(`error: ${err && err.stack ? err.stack : err}`);
    return 1;
  }
}

module.exports = { main, USAGE };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
