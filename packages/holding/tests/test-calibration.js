'use strict';

// Judgment join / calibration (B3, company-brain gap 4): per bet, VOF beside the Owner rating,
// kills (ledger endings + company history via packages/memory) and §29 disagreements linked to the
// grant or mission; where agent-confident (above-class-median VOF) bets were rated flat or
// regressed, by class, beside the existing divergence rule. Read-only; synthetic ledgers only.
// This suite is async (the CLI is); run.js awaits the exported promise.

const fs = require('fs');
const path = require('path');
const { openLedger } = require('../src/ledger');
const { closeCycle } = require('../src/cycle');
const { buildCalibration, formatCalibration, parseDisagreements, readCompanyHistories } = require('../src/calibration');
const holding = require('../src/index');
const { main } = require('../bin/sdk-holding');
const { DEFAULT_FUEL_LIMITS } = require('../src/cli/common');
const { createSuite, tmpDir } = require('./_helpers');
const { FIXED_NOW, ledgerFile, grant, draw } = require('./_fixtures');

const t = createSuite('calibration');
const open = (file = ledgerFile()) => openLedger(file, { limits: { envelopePerCycle: null }, now: FIXED_NOW });

function bet(L, id, { company = 'acme', cls = 'discovery', fu = 100, prove = true } = {}) {
  L.append(grant({ grant_id: id, idem_key: `grant-${id}`, company, mission_id: `m-${id}`, bet_class: cls, appetite_fu: 2000,
    tranches: [{ size_fu: 1000, proof: { kind: 'verified_surface', ref: `${company}/S-${id}` } },
      { size_fu: 1000, proof: { kind: 'graduated_cycle', ref: `${company}/discovery/${id}` } }] }));
  if (fu) L.append(draw(fu, { grant_id: id, mission_id: `m-${id}`, company, run_id: `r-${id}-1` }));
  if (prove) L.append({ type: 'proof', actor: 'holding-owner', idem_key: `pf-${id}-1`, grant_id: id, tranche: 1, proof: { kind: 'verified_surface', ref: `${company}/S-${id}`, sha: 'abc1234' } });
}
const judge = (L, id, rating, cycle = 1) => L.append({ type: 'judgment', actor: 'company-owner', idem_key: `j-${id}-${cycle}`, grant_id: id, cycle, rating });

// six bets in one class: b1..b3 have the highest VOF (least FU for the same proof weight)
function sixBets(L) {
  ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].forEach((id, i) => bet(L, id, { fu: (i + 1) * 100 }));
}

const HISTORY = `# History

## [Kill] Kill m-b2 onboarding experiment
**Date:** 2026-11-10
**Made by:** CEO
**Status:** killed
**Rationale:** EXECUTION_STALLED — m-b2 never produced a verified surface.
**Assumption that failed:** users would self-onboard

## Ship something unrelated
**Date:** 2026-11-11
**Made by:** CTO
**Rationale:** nothing to do with any bet

---

### [DISAGREE-001] Should grant b1 get a second tranche?
Date opened: 2026-11-12
Date resolved: 2026-11-13
Status: RESOLVED

**Positions:**

| Agent | Position | Key tradeoff |
|-------|----------|-------------|
| CFO | stop b1 | burn |
| CTO | fund b1 | momentum |

**Resolution:** fund one more tranche
**Decided by:** CEO
**Reasoning:** proof is real
**Dissent on record:** CFO: the VOF is flattered by a cheap surface

---

### [DISAGREE-002] Pricing page copy (mission m-b3)
Date opened: 2026-11-12
Date resolved: —
Status: OPEN

**Resolution:** Pending
**Decided by:** —
**Reasoning:** —
**Dissent on record:** —

---

### [DISAGREE-003] Mentions grant b10 only
Date opened: 2026-11-12
Status: OPEN
`;

// @covers cap-po-calibration-001 — per bet: VOF, Owner rating, kills (ledger + history via packages/memory), §29 disagreements by grant or mission
{
  const L = open();
  sixBets(L);
  judge(L, 'b1', 'flat'); judge(L, 'b2', 'regressed'); judge(L, 'b4', 'advanced');
  L.append({ type: 'return', actor: 'holding-owner', idem_key: 'kill-b2', grant_id: 'b2', reason: 'kill condition hit: no second proof' });
  L.append({ type: 'close', actor: 'holding-owner', idem_key: 'close-b5', grant_id: 'b5' });
  const cal = buildCalibration({ state: L.fold(), events: L.read(), histories: { acme: { path: '/x/acme/project/history.md', content: HISTORY } } });
  const b = (id) => cal.bets.find(x => x.grant_id === id);
  t.eq(cal.bets.length, 6, 'one row per funded bet');
  t.eq(b('b1').cycles[0].vof, 10000, 'VOF joined (weight 1 ÷ 100 FU × 1e6)');
  t.eq(b('b1').cycles[0].rating, 'flat', 'Owner rating joined beside VOF');
  t.eq(b('b2').cycles[0].rating, 'regressed', 'regressed rating joined');
  t.eq(b('b2').ending.kind, 'kill', 'ledger return event is a kill');
  t.eq(b('b2').ending.cycle, 1, 'kill stamped with its Betting cycle');
  t.assert(/kill condition hit/.test(b('b2').ending.reason), 'kill reason carried from the ledger');
  t.eq(b('b5').ending.kind, 'close', 'ledger close event joined as the ending (not a kill)');
  t.deepEq(b('b5').kills, [], 'a closed bet has no kill');
  const kills = b('b2').kills;
  t.eq(kills.length, 2, 'b2 kills: one from the ledger, one from history');
  t.deepEq(kills.map(k => k.source).sort(), ['history', 'ledger'], 'both kill sources');
  const hk = kills.find(k => k.source === 'history');
  t.eq(hk.kill_class, 'EXECUTION_STALLED', 'history kill class parsed by packages/memory');
  t.eq(hk.linked_by, 'mission', 'history kill linked through the mission id');
  t.deepEq(b('b1').disagreements.map(d => d.id), ['DISAGREE-001'], '§29 disagreement linked by grant id');
  t.eq(b('b1').disagreements[0].linked_by, 'grant', 'linked_by grant');
  t.assert(/flattered/.test(b('b1').disagreements[0].dissent), 'dissent on record carried');
  t.eq(b('b1').disagreements[0].status, 'RESOLVED', 'status carried');
  t.deepEq(b('b3').disagreements.map(d => [d.id, d.linked_by]), [['DISAGREE-002', 'mission']], '§29 disagreement linked by mission id');
  t.deepEq(b('b4').disagreements, [], 'no false link (b10 is not b1, b4 untouched)');
  t.eq(b('b1').disagreements.some(d => d.id === 'DISAGREE-003'), false, 'token match: b10 does not link b1');
  t.deepEq(b('b4').kills, [], 'no kill for an unrelated bet');
  t.eq(cal.sources.histories[0].company, 'acme', 'history source named');
  t.assert(formatCalibration(cal).includes('DISAGREE-001'), 'text output names the disagreement');
}

// @covers cap-po-calibration-001 — parseDisagreements reads §29 blocks (sdk-doc disagreement format)
{
  const ds = parseDisagreements(HISTORY);
  t.deepEq(ds.map(d => d.id), ['DISAGREE-001', 'DISAGREE-002', 'DISAGREE-003'], 'three §29 blocks');
  t.eq(ds[0].topic, 'Should grant b1 get a second tranche?', 'topic');
  t.eq(ds[1].status, 'OPEN', 'open status');
  t.eq(ds[0].decided_by, 'CEO', 'decided by');
  t.deepEq(parseDisagreements(''), [], 'no history, no disagreements');
}

// @covers cap-po-calibration-001 — kills come from ledger reclaim events too, stamped with the cycle
{
  const L = openLedger(ledgerFile(), { limits: { envelopePerCycle: null, reclaimCyclesWithoutProof: 1 }, now: FIXED_NOW });
  bet(L, 'r1', { prove: false });
  closeCycle(L); // r1: no proof in cycle 1 → reclaimed at the close of cycle 1
  const cal = buildCalibration({ state: L.fold(), events: L.read() });
  const r1 = cal.bets.find(x => x.grant_id === 'r1');
  t.eq(r1.ending.kind, 'reclaim', 'reclaim joined as an ending');
  t.eq(r1.ending.cycle, 1, 'reclaimed in cycle 1');
  t.eq(r1.kills.length, 1, 'a reclaim counts as a kill');
  t.eq(r1.kills[0].kind, 'reclaim', 'kill kind reclaim');
}

// @covers cap-po-calibration-002 — agent-confident bets (VOF above class median) rated flat or regressed, by class, beside divergence
{
  const L = open();
  sixBets(L);
  bet(L, 'x1', { cls: 'growth', fu: 100 }); // a second class with too few bets for a median
  judge(L, 'b1', 'flat'); judge(L, 'b2', 'regressed'); // b3 above median, left unrated
  judge(L, 'b4', 'flat'); judge(L, 'b5', 'advanced'); judge(L, 'b6', 'advanced');
  const cal = buildCalibration({ state: L.fold(), events: L.read() });
  const disc = cal.classes.find(c => c.bet_class === 'discovery');
  const c1 = disc.cycles[0];
  t.deepEq(c1.high_vof, ['b1', 'b2', 'b3'], 'high VOF = above the class median');
  t.deepEq(c1.rated_flat, ['b1'], 'confident bet rated flat');
  t.deepEq(c1.rated_regressed, ['b2'], 'confident bet rated regressed');
  t.deepEq(c1.unrated, ['b3'], 'confident bet unrated is listed as unrated');
  t.eq(c1.divergence.flagged, true, 'existing divergence rule shown alongside');
  t.deepEq(c1.divergence.divergent, ['b1', 'b2', 'b3'], 'divergence rule unchanged (unrated counts as divergent there)');
  t.deepEq(disc.totals, { high_vof: 3, advanced: 0, flat: 1, regressed: 1, unrated: 1 }, 'class totals');
  t.eq(disc.miss_rate, 1, 'miss rate = (flat + regressed) ÷ rated high-VOF bets; unrated excluded, never defaulted');
  t.eq(c1.rated_flat.includes('b4'), false, 'a low-VOF flat bet is not an agent-confident miss');
  t.deepEq(cal.confident_misses.map(m => [m.grant_id, m.rating]), [['b1', 'flat'], ['b2', 'regressed']], 'confident misses listed');
  t.eq(cal.confident_misses[0].median_vof, c1.divergence.median_vof, 'miss carries the class median');
  const growth = cal.classes.find(c => c.bet_class === 'growth');
  t.eq(growth.cycles[0].computed, false, 'small class: not computed');
  t.assert(/at least 3/.test(growth.cycles[0].reason), 'reason names the minimum');
  t.eq(growth.miss_rate, null, 'no miss rate without rated high-VOF bets');
  const txt = formatCalibration(cal);
  t.assert(/rated flat: b1/.test(txt) && /rated regressed: b2/.test(txt), 'text names the confident misses');
  t.assert(/unrated: b3/.test(txt), 'text names unrated confident bets');
  t.assert(/DIVERGENCE/.test(txt), 'text shows the divergence rule beside');
}

// @covers cap-po-calibration-002 — unrated bets are shown as unrated, never defaulted
{
  const L = open();
  sixBets(L);
  const cal = buildCalibration({ state: L.fold(), events: L.read() });
  t.assert(cal.bets.every(b => b.cycles.every(c => c.rating === 'unrated' && c.rated === false)), 'every bet shown unrated');
  t.eq(cal.confident_misses.length, 0, 'an unrated bet is never counted as a flat/regressed miss');
  const disc = cal.classes.find(c => c.bet_class === 'discovery');
  t.deepEq(disc.totals, { high_vof: 3, advanced: 0, flat: 0, regressed: 0, unrated: 3 }, 'unrated counted as unrated');
  t.eq(disc.miss_rate, null, 'no miss rate from unrated bets (not defaulted to 0 or 1)');
  t.eq(cal.unrated.length, 6, 'unrated list covers every bet-cycle');
  t.deepEq(cal.unrated[0], { cycle: 1, grant_id: 'b1' }, 'unrated entries name cycle and grant');
}

// @covers cap-po-calibration-002 — calibration spans cycles; a rating in cycle 2 joins cycle 2 VOF only
{
  const L = open();
  sixBets(L);
  judge(L, 'b1', 'flat', 1);
  closeCycle(L);
  for (const [i, id] of ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'].entries()) {
    L.append(draw((6 - i) * 100, { grant_id: id, mission_id: `m-${id}`, company: 'acme', run_id: `r-${id}-2` }));
  }
  const cal = buildCalibration({ state: L.fold(), events: L.read() });
  t.deepEq(cal.cycles, [1, 2], 'all cycles to date');
  const b1 = cal.bets.find(b => b.grant_id === 'b1');
  t.deepEq(b1.cycles.map(c => [c.cycle, c.rating]), [[1, 'flat'], [2, 'unrated']], 'ratings are per cycle, never carried over');
  const only2 = buildCalibration({ state: L.fold(), events: L.read(), cycle: 2 });
  t.deepEq(only2.cycles, [2], '--cycle restricts');
  t.eq(only2.confident_misses.length, 0, 'cycle 2 flat rating absent → no miss');
}

// @covers cap-po-calibration-001 — readCompanyHistories reads project/history.md or history.md per company, read-only
{
  const a = tmpDir('cal-co-a-'); const b = tmpDir('cal-co-b-'); const c = tmpDir('cal-co-c-');
  fs.mkdirSync(path.join(a, 'project'));
  fs.writeFileSync(path.join(a, 'project', 'history.md'), HISTORY);
  fs.writeFileSync(path.join(b, 'history.md'), '# History\n');
  const hs = readCompanyHistories({ companies: [{ id: 'a', path: a }, { id: 'b', path: b }, { id: 'c', path: c }] });
  t.eq(hs.a.path, path.join(a, 'project', 'history.md'), 'project/history.md preferred');
  t.eq(hs.b.path, path.join(b, 'history.md'), 'root history.md fallback');
  t.eq(hs.c, undefined, 'no history, no entry');
}

// exported from the package index
t.eq(typeof holding.buildCalibration, 'function', 'index exports buildCalibration');
t.eq(typeof holding.formatCalibration, 'function', 'index exports formatCalibration');

async function cli(args) {
  const out = []; const err = [];
  const code = await main(args, { stdout: (s) => out.push(s), stderr: (s) => err.push(s), env: {} });
  return { code, out: out.join('\n'), err: err.join('\n') };
}

// @covers cap-po-calibration-001 @covers cap-po-calibration-002 — `sdk-holding calibration [--json]` on a synthetic holding; never writes the ledger
async function cliCase() {
  const root = tmpDir('cal-holding-');
  const repo = tmpDir('cal-repo-');
  fs.mkdirSync(path.join(repo, 'project'));
  fs.writeFileSync(path.join(repo, 'project', 'history.md'), HISTORY);
  const dir = path.join(root, 'holding');
  fs.mkdirSync(path.join(dir, 'fuel'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'portfolio.json'), JSON.stringify({ schema: 1, holding: { owner: 'Ada' }, companies: [{ id: 'acme', path: repo, owner: 'Ada' }] }));
  fs.writeFileSync(path.join(dir, 'settings.json'), '{}');
  const file = path.join(dir, 'fuel', 'ledger.jsonl');
  const L = open(file);
  L.append({ type: 'limits', actor: 'holding-owner', idem_key: 'limits:1', limits: { ...DEFAULT_FUEL_LIMITS, envelopePerCycle: null } }); // as init writes
  sixBets(L);
  judge(L, 'b1', 'flat'); judge(L, 'b2', 'regressed');
  L.append({ type: 'return', actor: 'holding-owner', idem_key: 'kill-b2', grant_id: 'b2', reason: 'killed' });
  const before = fs.readFileSync(file);
  const mtime = fs.statSync(file).mtimeMs;

  const j = await cli(['calibration', '--json', '--holding', root]);
  t.eq(j.code, 0, `calibration --json exits 0 (${j.err})`);
  const cal = JSON.parse(j.out);
  t.deepEq(cal.confident_misses.map(m => m.grant_id), ['b1', 'b2'], 'CLI JSON: confident misses');
  t.eq(cal.bets.find(b => b.grant_id === 'b1').disagreements[0].id, 'DISAGREE-001', 'CLI JSON: disagreement read from the company history');
  t.eq(cal.bets.find(b => b.grant_id === 'b2').kills.length, 2, 'CLI JSON: ledger + history kills');
  t.eq(cal.read_only, true, 'output declares read-only');

  const txt = await cli(['calibration', '--holding', root]);
  t.eq(txt.code, 0, 'calibration text exits 0');
  t.assert(/Calibration/.test(txt.out) && /rated flat: b1/.test(txt.out), 'text output');
  const one = await cli(['calibration', '--json', '--cycle', '1', '--holding', root]);
  t.deepEq(JSON.parse(one.out).cycles, [1], '--cycle accepted');
  t.eq((await cli(['calibration', '--cycle', '0', '--holding', root])).code, 2, 'bad --cycle is a usage error');

  t.assert(Buffer.compare(before, fs.readFileSync(file)) === 0, 'ledger bytes unchanged (read-only)');
  t.eq(fs.statSync(file).mtimeMs, mtime, 'ledger not touched');
  t.eq(fs.existsSync(`${file}.lock`), false, 'no lock file taken');
  t.eq(fs.readdirSync(path.join(dir, 'fuel')).length, 1, 'nothing written beside the ledger');
}

module.exports = cliCase().then(() => t.done(), (e) => { console.error(e.stack); t.failed++; return t.done(); });
