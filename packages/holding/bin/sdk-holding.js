#!/usr/bin/env node
'use strict';

/**
 * sdk-holding — the holding Owner's command line for the Portfolio Orchestrator.
 *
 * Layout (created by `init`, holding/ is 0700 under the Owner's user, D7):
 *   <holdingDir>/holding/portfolio.json      registry (portfolio.js)
 *   <holdingDir>/holding/settings.json       limits.fuel.*, priceTable, claude.pinnedVersion, runner options
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

const SDK_ROOT = path.resolve(__dirname, '..', '..', '..');
const KIND_ALIASES = { surface: 'verified_surface', cycle: 'graduated_cycle', ship: 'owner_approved_ship',
  verified_surface: 'verified_surface', graduated_cycle: 'graduated_cycle', owner_approved_ship: 'owner_approved_ship' };
const BOOLEAN_FLAGS = new Set(['json', 'infinite']);
const DEFAULT_FUEL_LIMITS = {
  envelopePerCycle: null, trancheSize: null, tranchesPerGrant: null, reclaimCyclesWithoutProof: 1,
  smallBetReserve: 0.2, smallBetMax: null, overrunReserve: 0.05, proofRevertCommits: 10, concurrency: 1,
};
const TERMINAL = new Set(['done', 'stopped', 'failed', 'refused', 'killed', 'error']);

const USAGE = `usage: sdk-holding <command> [--holding <dir>]
  init <holdingDir> --owner <name> [--envelope <fu>]
  add-company <path> --id <id> --owner <name> [--name <n>] [--sdk-path <abs>]
  fund <fu> --by holding-owner          | fund --infinite --by holding-owner
  grant --company <id> --mission <id> --appetite <fu> --tranches "100,200"
        --proofs "surface:<ID>,cycle:discovery/1,ship:<id>" --kill "<condition>" [--class <c>] [--id <g>] [--by agent]
  ratify <grantId>
  run <company> --grant <id> --mission <id> --prompt "<text>" [--max-turns <n>]
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
  const limits = settings.limits && settings.limits.fuel;
  if (!limits || !('envelopePerCycle' in limits)) refuse(`${files.settings} has no limits.fuel.envelopePerCycle`);
  const portfolio = JSON.parse(fs.readFileSync(files.portfolio, 'utf8'));
  return { root, files, settings, limits, portfolio, ledger: () => openLedger(files.ledger, { limits }) };
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
    fs.writeFileSync(path.join(dir, 'fuel', 'ledger.jsonl'), '', { mode: 0o600, flag: 'wx' });
    writeJson(path.join(dir, 'portfolio.json'), {
      schema_version: 1, holding: { owner },
      second_owner_gates: { os_isolation: false, multi_owner_charter_amendment: false, clo_gate_items: false },
      companies: [],
    });
    writeJson(path.join(dir, 'settings.json'), {
      schema_version: 1,
      limits: { fuel: { ...DEFAULT_FUEL_LIMITS, envelopePerCycle: envelope } },
      priceTable: null,          // required before `run`: { version, models: { [model]: { in, out, cw, cr } } }
      claude: { pinnedVersion: null }, // required before `run` (C5)
      runner: {},
    });
    io.out(`holding created at ${root} (Owner: ${owner}; fuel: ${envelope === null ? 'infinite, every draw metered' : `${envelope} FU per cycle`}; concurrency 1)`);
    io.out(`next: sdk-holding add-company <path> --id <id> --owner ${owner} --holding ${root}`);
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
      if (by !== 'holding-owner') refuse(`only holding-owner can change the fuel envelope (by: ${by})`);
      h.settings.limits.fuel.envelopePerCycle = null;
      writeJson(h.files.settings, h.settings);
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

  async run({ pos, flags }, io, h, deps) {
    const company = pos[0] || usage('run needs <company>');
    const grantId = need(flags, 'grant', 'run');
    const missionId = need(flags, 'mission', 'run');
    const prompt = need(flags, 'prompt', 'run');
    const maxTurns = flags['max-turns'] === undefined ? undefined : posInt(flags['max-turns'], '--max-turns');
    const co = (h.portfolio.companies || []).find(c => c.id === company) || refuse(`company ${company} is not registered`);
    // Pre-flight here mirrors the runner's own (the runner remains the authority); it gives a
    // human-facing reason before any session machinery is touched.
    const state = h.ledger().fold();
    if (state.frozen) refuse('the ledger is frozen (kill switch); no runs start until the holding Owner unfreezes');
    const g = grantOrRefuse(state, grantId);
    if (g.status === 'proposed') refuse(`grant ${grantId} is not ratified by the holding Owner; run: sdk-holding ratify ${grantId}`);
    if (g.status !== 'open') refuse(`grant ${grantId} is ${g.status}`);
    if (g.company !== company) refuse(`grant ${grantId} belongs to ${g.company}, not ${company}`);
    if (g.mission_id !== missionId) refuse(`grant ${grantId} funds mission ${g.mission_id}, not ${missionId}`);
    const left = g.released_fu - g.drawn_fu;
    if (left <= 0) refuse(`grant ${grantId} has no FU left in its released tranches; record the next tranche's proof first`);
    if (state.pool.reserves && state.pool.overrun_reserve_empty) refuse('the overrun reserve is empty: overruns stop, so no run may start until it is refilled');
    const runner = deps.runner || makeRunner(h);
    const opts = { grantId, missionId, prompt };
    if (maxTurns !== undefined) opts.maxTurns = maxTurns;
    const runId = await runner.start(co.id, opts);
    io.out(`run ${runId} started for ${company} (grant ${grantId}, ${left} FU open)`);
    let status = null;
    if (typeof runner.wait === 'function') status = await runner.wait(runId);
    else if (typeof runner.status === 'function') status = await runner.status(runId);
    const rec = path.join(h.files.runs, `${runId}.json`);
    if (!fs.existsSync(rec)) { // the LocalRunner writes its own record; never overwrite it
      writeJson(rec, { runId, company, grantId, missionId, maxTurns: maxTurns ?? null, status, recordedBy: 'sdk-holding' });
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
    const res = closeCycle(L, { limits: h.limits });
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
        const state = rec.state || (rec.status && rec.status.state);
        const runId = rec.runId || rec.id || f.replace(/\.json$/, '');
        if (state && !TERMINAL.has(state)) {
          try { await deps.runner.stop(runId, 'landing'); io.out(`run ${runId}: landing requested`); } catch (e) { io.err(`run ${runId}: stop failed: ${e.message}`); }
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
  const evs = scanReverts(L, { companies, windowCommits: h.limits.proofRevertCommits ?? 10 });
  for (const e of evs) io.err(`proof reverted: ${e.grant_id} tranche ${e.tranche} — ${e.reason}`);
  return evs.length;
}

function makeRunner(h) {
  let mod;
  try { mod = require('../src/runner'); } catch (e) { refuse(`the LocalRunner is not available (${e.message})`); }
  if (!h.settings.priceTable) refuse(`${h.files.settings} needs a priceTable before runs can be metered`);
  if (!h.settings.claude || !h.settings.claude.pinnedVersion) refuse(`${h.files.settings} needs claude.pinnedVersion (C5) before runs`);
  return mod.createLocalRunner({
    ...(h.settings.runner || {}),
    holdingDir: h.files.dir,
    companies: (h.portfolio.companies || []).map(c => ({ id: c.id, path: c.path })),
    limits: h.limits,
    priceTable: h.settings.priceTable,
    pinnedVersion: h.settings.claude.pinnedVersion,
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
