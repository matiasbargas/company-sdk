'use strict';

// Proof recording from a company repo (Level 3: commit SHA + state, no content opinion), revert
// detection inside fuel.proofRevertCommits, and the ledger report: fully loaded VOF per company
// and bet, suppression on unmetered sessions, the judgment column, divergence, revisit trigger.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { openLedger } = require('../src/ledger');
const { verifyProof, findRevert, recordProof, scanReverts } = require('../src/proofs');
const { buildReport, formatReport, WEIGHTS } = require('../src/report');
const { closeCycle } = require('../src/cycle');
const { createSuite, tmpDir } = require('./_helpers');
const { FIXED_NOW, ledgerFile, grant, draw } = require('./_fixtures');

const t = createSuite('report');
const open = (limits = { envelopePerCycle: null }) => openLedger(ledgerFile(), { limits, now: FIXED_NOW });

// ── a throwaway company repo ──────────────────────────────────────────────────
function git(repo, ...args) {
  return execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', ...args],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function makeRepo() {
  const repo = tmpDir('company-');
  git(repo, 'init', '-q');
  return repo;
}
function commit(repo, files, msg = 'c') {
  for (const [rel, text] of Object.entries(files)) {
    const f = path.join(repo, rel);
    fs.mkdirSync(path.dirname(f), { recursive: true });
    if (text === null) fs.rmSync(f); else fs.writeFileSync(f, text);
  }
  git(repo, 'add', '-A');
  git(repo, 'commit', '-q', '--allow-empty', '-m', msg);
  return git(repo, 'rev-parse', 'HEAD');
}
const surface = (id, state) => `---\nsurface:\n  id: ${id}\n  kind: decision\n  title: t\n  author_roles: [CTO]\n  verifier_roster: [Mario]\n  state: ${state}\n  irreversible: false\n---\n\n# body\n`;
const iteration = (cycle, status) => `---\nloop: "discovery"\ncycle: ${cycle}\nguardian: "G"\nstatus: "${status}"\n---\n\n## Input\n`;
const history = (shipId, approver) => `# History\n\nDECISION: Ship ${shipId} to users\nDate: 2026-11-14\nMade by: CEO (AI-assisted)\nDecision: ship ${shipId}\nReversible: YES\nHuman approved by: ${approver}\n`;

// @covers cap-po-proof-001 — a verified §34 surface at a commit SHA is a proof; a non-verified state is not
{
  const repo = makeRepo();
  const s1 = commit(repo, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'under-verification') });
  const s2 = commit(repo, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'verified') });
  const named = { kind: 'verified_surface', ref: 'acme/SURFACE-1' };
  const at1 = verifyProof(repo, 'acme', named, s1);
  t.eq(at1.ok, false, 'surface under verification is not a proof');
  t.assert(/under-verification/.test(at1.reason), 'reason names the state');
  const at2 = verifyProof(repo, 'acme', named);
  t.eq(at2.ok, true, 'verified surface at HEAD is a proof');
  t.eq(at2.sha, s2, 'proof pinned to the full commit SHA');
  t.eq(at2.file, 'surfaces/SURFACE-1.md', 'proof names the file');
  t.eq(verifyProof(repo, 'acme', { kind: 'verified_surface', ref: 'beta/SURFACE-1' }).ok, false, 'a ref of another company is refused');
  t.eq(verifyProof(repo, 'acme', { kind: 'verified_surface', ref: 'acme/SURFACE-9' }).ok, false, 'a missing surface is refused');
  t.eq(verifyProof(repo, 'acme', named, 'deadbeef').ok, false, 'an unknown commit is refused');
  // project/surfaces layout, graduated §31 iteration, Owner-approved ship
  const repo2 = makeRepo();
  commit(repo2, {
    'project/surfaces/SURFACE-2.md': surface('SURFACE-2', 'verified'),
    'project/iterations/discovery/iter-001.md': iteration(1, 'rework'),
    'project/iterations/discovery/iter-002.md': iteration(2, 'graduated'),
    'project/history.md': history('ship-v1', 'Ada Lovelace, Owner') + '\n' + history('ship-v2', '[Full name, title]'),
  });
  t.eq(verifyProof(repo2, 'acme', { kind: 'verified_surface', ref: 'acme/SURFACE-2' }).ok, true, 'project/surfaces layout found');
  t.eq(verifyProof(repo2, 'acme', { kind: 'graduated_cycle', ref: 'acme/discovery/2' }).ok, true, 'graduated iteration is a proof');
  t.eq(verifyProof(repo2, 'acme', { kind: 'graduated_cycle', ref: 'acme/discovery/1' }).ok, false, 'an iteration in rework is not');
  t.eq(verifyProof(repo2, 'acme', { kind: 'owner_approved_ship', ref: 'acme/ship-v1' }).ok, true, 'Owner-approved history entry is a proof');
  const v2 = verifyProof(repo2, 'acme', { kind: 'owner_approved_ship', ref: 'acme/ship-v2' });
  t.eq(v2.ok, false, 'an unsigned approval line is not a proof');
}

// @covers cap-po-proof-001 — recordProof checks the tranche's declared proof, records it at SHA and releases the next tranche once
{
  const repo = makeRepo();
  commit(repo, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'verified'), 'surfaces/SURFACE-9.md': surface('SURFACE-9', 'verified') });
  const L = open();
  L.append(grant());
  const companies = { acme: repo };
  t.throwsCode(() => recordProof(L, { grantId: 'g1', tranche: 1, companies, kind: 'verified_surface', ref: 'acme/SURFACE-9' }),
    'PROOF_MISMATCH', 'a proof other than the declared one is refused before checking');
  const r = recordProof(L, { grantId: 'g1', tranche: 1, companies });
  t.eq(r.event.proof.ref, 'acme/SURFACE-1', 'declared proof recorded');
  t.eq(r.released, 2, 'next tranche released automatically');
  t.deepEq(L.fold().grants.g1.tranches.map(x => x.released), [true, true, false], 'tranche 2 drawable, tranche 3 not');
  t.throwsCode(() => recordProof(L, { grantId: 'g1', tranche: 1, companies }), 'PROOF_ALREADY_USED', 'one proof unlocks at most one tranche');
  t.throwsCode(() => recordProof(L, { grantId: 'g1', tranche: 2, companies }), 'PROOF_NOT_MET', 'tranche 2 proof absent from the repo');
}

// @covers cap-po-proof-003 — a verified surface that unlocked tranche 2 and is reverted 3 commits later: weight removed, reversal recorded
{
  const repo = makeRepo();
  commit(repo, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'verified') });
  const L = open();
  L.append(grant());
  L.append(draw(50));
  recordProof(L, { grantId: 'g1', tranche: 1, companies: { acme: repo } });
  const before = buildReport(L.fold(), {});
  t.eq(before.bets[0].weight, WEIGHTS.verified_surface, 'proof weighs in before the revert');
  commit(repo, { 'a.txt': '1' }); commit(repo, { 'b.txt': '2' });
  const bad = commit(repo, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'reconciling') }, 'revert surface');
  const rv = findRevert(repo, 'acme', L.fold().grants.g1.tranches[0].proof, 10);
  t.eq(rv && rv.at_sha, bad, 'revert found at the third commit after the proof');
  t.eq(rv && rv.commits_after, 3, 'commits counted from the proof SHA');
  const evs = scanReverts(L, { companies: { acme: repo }, windowCommits: 10 });
  t.eq(evs.length, 1, 'one proof_revert recorded');
  t.eq(evs[0].type, 'proof_revert', 'event type proof_revert');
  t.eq(scanReverts(L, { companies: { acme: repo }, windowCommits: 10 }).length, 0, 'scan is idempotent');
  const after = buildReport(L.fold(), {});
  t.eq(after.bets[0].weight, 0, 'reverted proof is clawed back from the metric');
  t.eq(after.bets[0].vof, 0, 'VOF drops to 0');
  t.eq(after.bets[0].proofs[0].reverted, true, 'the report shows the reversal');
  t.throwsCode(() => L.append({ type: 'release', actor: 'holding-owner', idem_key: 'r3', grant_id: 'g1', tranche: 3 }),
    'TRANCHE_LOCKED', 'reverted proof unlocks nothing further');
}

// @covers cap-po-proof-003 — outside the window, and a deleted file, behave as specified
{
  const repo = makeRepo();
  const s0 = commit(repo, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'verified') });
  const p = { kind: 'verified_surface', ref: 'acme/SURFACE-1', sha: s0 };
  for (let i = 0; i < 3; i++) commit(repo, { [`f${i}.txt`]: String(i) });
  commit(repo, { 'surfaces/SURFACE-1.md': null }, 'delete');
  t.eq(findRevert(repo, 'acme', p, 2), null, 'a change after the window (2 commits) is not a revert');
  t.eq(findRevert(repo, 'acme', p, 10).commits_after, 4, 'deleting the surface within the window is a revert');
  const repo2 = makeRepo();
  const k = commit(repo2, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'verified') });
  commit(repo2, { 'surfaces/SURFACE-1.md': surface('SURFACE-1', 'verified') + '\nmore evidence\n' });
  t.eq(findRevert(repo2, 'acme', { ...p, sha: k }, 10), null, 'editing a still-verified surface is not a revert');
}

// ── report helpers: bets with chosen FU and proofs, no repo needed ──────────────
function bet(L, id, { company = 'acme', cls = 'discovery', fu = 100, prove = true, sha = 'abc1234' } = {}) {
  L.append(grant({ grant_id: id, idem_key: `grant-${id}`, company, mission_id: `m-${id}`, bet_class: cls, appetite_fu: 2000,
    tranches: [{ size_fu: 1000, proof: { kind: 'verified_surface', ref: `${company}/S-${id}` } },
      { size_fu: 1000, proof: { kind: 'graduated_cycle', ref: `${company}/discovery/${id}` } }] }));
  if (fu) L.append(draw(fu, { grant_id: id, mission_id: `m-${id}`, company, run_id: `r-${id}-1` }));
  if (prove) L.append({ type: 'proof', actor: 'holding-owner', idem_key: `pf-${id}-1`, grant_id: id, tranche: 1, proof: { kind: 'verified_surface', ref: `${company}/S-${id}`, sha } });
}
const judge = (L, id, rating, cycle = 1) => L.append({ type: 'judgment', actor: 'company-owner', idem_key: `j-${id}-${cycle}`, grant_id: id, cycle, rating });

// @covers cap-po-metric-001 — VOF per company and bet, fully loaded (overruns, killed bets), ×1e6
{
  const L = open();
  bet(L, 'a1', { fu: 400 });
  bet(L, 'a2', { fu: 100, prove: false });
  L.append({ type: 'return', actor: 'holding-owner', idem_key: 'kill-a2', grant_id: 'a2', reason: 'killed' });
  const r = buildReport(L.fold(), {});
  const a1 = r.bets.find(b => b.grant_id === 'a1');
  t.eq(a1.fu_loaded, 400, 'bet FU loaded');
  t.eq(a1.vof, 2500, 'VOF = weight ÷ FU × 1e6');
  const acme = r.companies.find(c => c.id === 'acme');
  t.eq(acme.fu_loaded, 500, 'company FU includes the killed bet');
  t.eq(acme.vof, 2000, 'company VOF is fully loaded');
  t.eq(r.bets.find(b => b.grant_id === 'a2').status, 'returned', 'killed bet still listed');
  t.assert(formatReport(r).includes('acme'), 'text report renders');
}

// @covers cap-po-metric-001 — company A had one unmetered session in the cycle → A's VOF shown as suppressed with the reason
{
  const L = open();
  bet(L, 'a1', { fu: 400 });
  bet(L, 'b1', { company: 'beta', fu: 400 });
  L.append({ type: 'unmetered', actor: 'runner', idem_key: 'um-1', company: 'acme', run_id: 'r9', session_id: 's9', grant_id: 'a1', reason: 'no result message' });
  const r = buildReport(L.fold(), {});
  const acme = r.companies.find(c => c.id === 'acme');
  t.eq(acme.vof, null, 'A VOF suppressed');
  t.assert(acme.vof_suppressed && /1 unmetered session/.test(acme.vof_suppressed) && acme.vof_suppressed.includes('r9'), 'reason names the unmetered run');
  t.eq(r.bets.find(b => b.grant_id === 'a1').vof, null, "A's bet VOF suppressed too");
  t.eq(r.companies.find(c => c.id === 'beta').vof, 2500, 'B unaffected');
  t.assert(/suppressed/.test(formatReport(r)), 'text report says suppressed');
  // the next cycle starts clean
  closeCycle(L, { limits: { envelopePerCycle: null, reclaimCyclesWithoutProof: null } });
  L.append(draw(100, { grant_id: 'a1', mission_id: 'm-a1', company: 'acme', run_id: 'r-c2' }));
  t.eq(buildReport(L.fold(), { cycle: 2 }).companies.find(c => c.id === 'acme').vof_suppressed, null, 'suppression is per cycle');
}

// @covers cap-po-judgment-001 — 6 funded bets, 2 of the 3 above-median-VOF rated flat → divergence flagged
{
  const L = open();
  const ids = ['b1', 'b2', 'b3', 'b4', 'b5', 'b6'];
  ids.forEach((id, i) => bet(L, id, { fu: (i + 1) * 100 }));
  judge(L, 'b1', 'flat'); judge(L, 'b2', 'flat'); judge(L, 'b3', 'advanced');
  for (const id of ['b4', 'b5', 'b6']) judge(L, id, 'advanced');
  const r = buildReport(L.fold(), {});
  const cls = r.classes.find(c => c.bet_class === 'discovery');
  t.eq(cls.funded, 6, 'six funded bets');
  t.deepEq(cls.divergence.above_median, ['b1', 'b2', 'b3'], 'above-median bets');
  t.deepEq(cls.divergence.divergent, ['b1', 'b2'], 'divergent bets');
  t.eq(cls.divergence.flagged, true, 'divergence flagged');
  t.eq(r.bets.find(b => b.grant_id === 'b1').judgment, 'flat', 'judgment shown beside VOF');
  t.assert(/DIVERGENCE/.test(formatReport(r)), 'text report flags divergence');
}

// @covers cap-po-judgment-001 — an unrated funded bet counts as divergent and is listed as an unfilled judgment column
{
  const L = open();
  ['c1', 'c2', 'c3', 'c4'].forEach((id, i) => bet(L, id, { fu: (i + 1) * 100 }));
  judge(L, 'c2', 'advanced'); judge(L, 'c3', 'advanced'); judge(L, 'c4', 'advanced'); // c1 (top VOF) unrated
  const r = buildReport(L.fold(), {});
  const cls = r.classes[0];
  t.deepEq(cls.divergence.divergent, ['c1'], 'unrated above-median bet counts as divergent');
  t.eq(cls.divergence.flagged, true, '1 of 2 above-median is ≥ 50%');
  t.deepEq(r.unrated, ['c1'], 'unfilled judgment column listed');
  t.eq(r.bets.find(b => b.grant_id === 'c1').judgment, 'unrated', 'shown as unrated');
}

// @covers cap-po-judgment-001 — a bet class with only 2 funded bets: divergence not computed
{
  const L = open();
  bet(L, 'd1', { fu: 100, cls: 'small' }); bet(L, 'd2', { fu: 300, cls: 'small' });
  judge(L, 'd1', 'flat'); judge(L, 'd2', 'flat');
  const cls = buildReport(L.fold(), {}).classes[0];
  t.eq(cls.divergence.computed, false, 'not computed below 3 funded bets');
  t.eq(cls.divergence.flagged, false, 'never flagged below the minimum');
  t.assert(/3/.test(cls.divergence.reason), 'reason names the minimum');
}

// @covers cap-po-proof-002 — divergence in 2 consecutive closed cycles, or a second Owner, makes the outside-verifier decision due
{
  const lim = { envelopePerCycle: null, reclaimCyclesWithoutProof: null };
  const L = open();
  const ids = ['e1', 'e2', 'e3'];
  ids.forEach((id, i) => bet(L, id, { fu: (i + 1) * 100 }));
  judge(L, 'e1', 'regressed'); judge(L, 'e2', 'advanced'); judge(L, 'e3', 'advanced');
  closeCycle(L, { limits: lim });
  let r = buildReport(L.fold(), {});
  t.eq(r.revisit_trigger.due, false, 'one divergent cycle is not enough');
  t.deepEq(r.divergence_by_cycle, [{ cycle: 1, flagged: true }], 'cycle 1 divergence recorded');
  ids.forEach((id, i) => {
    L.append({ type: 'release', actor: 'holding-owner', idem_key: `rel-${id}-2`, grant_id: id, tranche: 2 });
    L.append(draw((i + 1) * 100, { grant_id: id, mission_id: `m-${id}`, company: 'acme', run_id: `r-${id}-2` }));
    L.append({ type: 'proof', actor: 'holding-owner', idem_key: `pf-${id}-2`, grant_id: id, tranche: 2, proof: { kind: 'graduated_cycle', ref: `acme/discovery/${id}`, sha: 'abc1234' } });
  });
  judge(L, 'e2', 'advanced', 2); judge(L, 'e3', 'advanced', 2); // e1 (top VOF) left unrated in cycle 2
  t.eq(buildReport(L.fold(), {}).revisit_trigger.due, false, 'an open cycle does not count yet');
  closeCycle(L, { limits: lim });
  r = buildReport(L.fold(), { cycle: 2 });
  t.eq(r.revisit_trigger.due, true, 'two consecutive divergent cycles: outside-verifier decision due');
  t.assert(r.revisit_trigger.reasons.some(x => /cycles 1 and 2/.test(x)), 'reason names the cycles');
  // a second human Owner registered
  const L2 = open();
  bet(L2, 'f1');
  const portfolio = { holding: { owner: 'Ada' }, companies: [{ id: 'acme', owner: 'Ada' }, { id: 'beta', owner: 'Grace' }] };
  const r2 = buildReport(L2.fold(), { portfolio });
  t.eq(r2.revisit_trigger.due, true, 'second Owner registered: decision due');
  t.assert(r2.revisit_trigger.reasons.some(x => x.includes('Grace')), 'reason names the second Owner');
  t.assert(/OUTSIDE-VERIFIER DECISION DUE/.test(formatReport(r2)), 'text report surfaces the trigger');
}

module.exports = t.done();
