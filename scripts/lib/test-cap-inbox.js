#!/usr/bin/env node

/**
 * test-cap-inbox.js — black-box conformance for `sdk-doc inbox` (decision cards for humans).
 * Spec: project/context/spec/sdk-inbox/claims.yaml (protocol.md §30, "Specs outlive implementations").
 *
 * Every test runs `node scripts/doc.js inbox ...` as a child process against a fixture project in
 * an os.tmpdir() mkdtemp dir and asserts only the public interface: args, exit codes, stdout, and
 * the files written. HOME is redirected into the temp dir. No network, no tokens, no git remote.
 *
 * Deadlines in fixtures sit far in the past (2020-…) or far in the future (2998/2999-…) so the
 * suite never depends on today's date.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const SDK = path.resolve(__dirname, '..', '..');
const DOC = path.join(SDK, 'scripts', 'doc.js');

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };

const TMP = fs.realpathSync(fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-cap-inbox-')));
const HOME = path.join(TMP, 'home');
fs.mkdirSync(HOME);
process.on('exit', () => fs.rmSync(TMP, { recursive: true, force: true }));
let seq = 0;
const write = (dir, rel, content) => { const p = path.join(dir, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, content); return p; };
const read = (dir, rel) => fs.readFileSync(path.join(dir, rel), 'utf8');
const ENV = { ...process.env, HOME, USERPROFILE: HOME, GIT_CONFIG_NOSYSTEM: '1', GIT_CEILING_DIRECTORIES: TMP };

function run(args) {
  const r = spawnSync('node', [DOC, 'inbox', ...args], { encoding: 'utf8', cwd: TMP, env: ENV, timeout: 60000 });
  return { code: r.status, out: r.stdout || '', err: r.stderr || '', all: (r.stdout || '') + (r.stderr || '') };
}
const json = (s) => { try { return JSON.parse(s); } catch (_) { return null; } };
const inbox = (dir, extra = []) => json(run([dir, '--json', ...extra]).out);
const listFiles = (dir) => {
  const out = [];
  const walk = (d) => { for (const e of fs.readdirSync(d, { withFileTypes: true })) { const p = path.join(d, e.name); if (e.isDirectory()) walk(p); else out.push(path.relative(dir, p)); } };
  walk(dir);
  return out.sort();
};

// ─── Fixture builders ────────────────────────────────────────────────────────

const BUS_HEAD = '# Bus Log\n\n> Append-only record of all inter-agent communication. Do not edit — only append.\n';
function busMsg({ ts = '2026-11-01 10:00', from = 'CTO', to = 'Owner', priority = 'DECISION NEEDED', body = 'Pick a database', due = '2999-01-01', extra = [] }) {
  return `\n---\n[${ts}] FROM: ${from} → TO: ${to} | PRIORITY: ${priority} | SOL: KNOWN | RELEASE: v2026.Q4.1\n${body}\n${extra.join('\n')}${extra.length ? '\n' : ''}${due ? `DECISION BY: ${due}\n` : ''}ESCALATION: CEO\n`;
}
const STATUS = (openDecisions = 'None.') => `# Acme -- sdk-v3
**Last updated:** 2026-11-01 10:00
**Updated by:** Coordinator
**Release:** v2026.Q4.1

## Active Missions

| Mission | PM | Appetite remaining | Status | Next action |
|---|---|---|---|---|
| Checkout flow | Ana | 2 weeks | Active | Build cart |

## Open Decisions

${openDecisions}
`;
const CHARTER = (signed) => `# Charter\n\n## Autonomy Limits\n\n1. **Nothing outward-facing.**\n\n## Ratification\n\n- **Ratified by: ${signed ? 'Matias Bargas (Owner) on 2026-11-01' : '__________________________ (Owner) on __________'}**\n`;
function surface({ id = 'SURFACE-20261101-db-001', roster = '[CFO, human:ana]', state = 'under-verification', irreversible = false, extraFront = '', body = '' }) {
  return `---\nsurface:\n  id: ${id}\n  kind: decision\n  title: Choose the primary datastore\n  author_roles: [CTO]\n  verifier_roster: ${roster}\n  state: ${state}\n  irreversible: ${irreversible}\n${extraFront}  release: v2026.Q4.1\n---\n\n# Choose the primary datastore\n\n## Author block — CTO (2026-11-01)\n\nUse Postgres.\n${body}`;
}
function project(name, o = {}) {
  const d = path.join(TMP, `${++seq}-${name}`);
  fs.mkdirSync(d, { recursive: true });
  write(d, 'current-status.md', STATUS(o.openDecisions));
  write(d, 'bus-log.md', BUS_HEAD + (o.bus || []).join(''));
  write(d, 'history.md', '# History\n');
  if (o.charter !== undefined) write(d, 'CHARTER.md', CHARTER(o.charter));
  for (const [f, c] of Object.entries(o.surfaces || {})) write(d, path.join('surfaces', f), c);
  if (o.sdkrc) write(d, '.sdkrc', JSON.stringify(o.sdkrc));
  if (o.holding) {
    write(d, 'holding/portfolio.json', '{}');
    write(d, 'holding/fuel/ledger.jsonl', o.holding === 'broken' ? 'not json\n' : '');
  }
  return d;
}
const bound = (b) => `BOUNDARY: ${b}`;

// ─── cap-inbox-001: cards from existing primitives only ─────────────────────

// @covers cap-inbox-001
{
  const d = project('sources', {
    charter: false,
    holding: 'broken',
    openDecisions: '- Choose the launch market — DECISION BY: 2020-01-01 — BOUNDARY: §34.7 scope-strategy',
    bus: [
      busMsg({ body: 'Pick a database for the ledger', extra: [bound('Autonomy Limit 4')] }),
      busMsg({ ts: '2026-11-01 11:00', to: 'CTO', body: 'CTO-only question', extra: [bound('AL-2')] }),
      busMsg({ ts: '2026-11-01 12:00', priority: 'INFO', body: 'FYI only', due: null, extra: [bound('AL-1')] }),
      busMsg({ ts: '2026-11-01 13:00', to: 'human:ana', priority: 'BLOCKER', body: 'Ana must unblock pricing', due: null, extra: [bound('AL-2')] }),
    ],
    surfaces: {
      'SURFACE-20261101-db-001.md': surface({ extraFront: '  boundary: Autonomy Limit 4\n', body: '\n### Verification — CFO (2026-11-02)\n**Verdict:** pass\n- cheap enough\n' }),
      'SURFACE-20261101-old-001.md': surface({ id: 'SURFACE-20261101-old-001', state: 'verified', roster: '[Owner]', extraFront: '  boundary: AL-4\n' }),
    },
  });
  const before = listFiles(d);
  const r = run([d, '--json']);
  const j = json(r.out);
  assert(r.code === 0 && j && Array.isArray(j.cards), 'inbox --json exits 0 and prints { cards: [...] }');
  const kinds = (j && j.cards || []).map(c => c.kind).sort();
  assert(j && j.principal === 'Owner', 'the default principal is the Owner');
  assert(kinds.includes('bus') && kinds.includes('charter') && kinds.includes('overdue') && kinds.includes('holding'), `Owner inbox has bus, charter, overdue and holding cards (got ${kinds.join(',')})`);
  const qs = (j && j.cards || []).map(c => c.question).join(' | ');
  assert(/Pick a database/.test(qs), 'an open DECISION NEEDED Bus message addressed to the Owner becomes a card');
  assert(!/CTO-only question/.test(qs), 'a Bus message addressed to someone else is not on the Owner inbox');
  assert(!/FYI only/.test(qs), 'an INFO Bus message is never a card');
  assert(/Choose the launch market/.test(qs), 'an overdue DECISION BY item in current-status.md becomes a card');
  assert(j && j.cards.some(c => c.kind === 'charter' && /CHARTER\.md/.test(c.source.path)), 'an unratified CHARTER becomes a card citing CHARTER.md');
  assert(j && j.cards.some(c => c.kind === 'holding' && /CHAIN_BROKEN/.test(c.question)), 'holding-health issues become cards when a holding exists');
  assert(!/Choose the primary datastore/.test(qs), 'a surface roster slot for someone else is not on the Owner inbox');

  const cto = inbox(d, ['--for', 'CTO']);
  assert(cto && cto.cards.some(c => /CTO-only question/.test(c.question)), '--for CTO shows the Bus message addressed to the CTO');
  assert(cto && cto.cards.some(c => /Pick a database/.test(c.question)), '--for <principal> also shows open asks addressed to the Owner');
  assert(cto && !cto.cards.some(c => c.kind === 'surface'), 'a filled roster slot (CFO) and slots of others never reach the CTO');

  const ana = inbox(d, ['--for', 'ana']);
  const s = ana && ana.cards.find(c => c.kind === 'surface');
  assert(s && /SURFACE-20261101-db-001/.test(s.source.path) && /Choose the primary datastore/.test(s.question), 'an under-verification surface with an unfilled human:ana slot is a card for ana');
  assert(ana && ana.cards.some(c => /Ana must unblock pricing/.test(c.question)), 'a BLOCKER Bus message to human:ana is a card for ana');
  assert(ana && !ana.cards.some(c => /SURFACE-20261101-old-001/.test(c.source.path)), 'a verified surface is never a card');
  const cfo = inbox(d, ['--for', 'CFO']);
  assert(cfo && !cfo.cards.some(c => c.kind === 'surface'), 'a roster slot with a Verification block is filled, so no card');

  const noHolding = project('no-holding', { charter: true });
  const nh = inbox(noHolding);
  assert(nh && nh.cards.length === 0, 'no holding, a ratified CHARTER and no open asks → an empty inbox');
  assert(/Inbox for Owner: 0 cards/.test(run([noHolding]).out), 'text mode says the inbox is empty');

  assert(JSON.stringify(listFiles(d)) === JSON.stringify(before), 'building the inbox writes no file (no new store)');
}

// ─── cap-inbox-002: card anatomy + over-asking guard ────────────────────────

// @covers cap-inbox-002
{
  const d = project('anatomy', {
    bus: [
      busMsg({ body: 'Adopt vendor X for payments', extra: [bound('Autonomy Limit 2'), 'DISSENT: CISO — vendor X has no SOC2', 'OPTIONS: adopt | reject | defer', 'MEANWHILE: the payments pod builds against a mock', 'COST OF DELAY: launch slips one week per week'] }),
      busMsg({ ts: '2026-11-01 11:00', body: 'Should we rename the repo?' }),
      busMsg({ ts: '2026-11-01 12:00', body: 'Bogus boundary ask', extra: [bound('because I said so')] }),
    ],
  });
  const j = inbox(d);
  const c = j && j.cards.find(x => /Adopt vendor X/.test(x.question));
  assert(c, 'a well-formed ask is a card');
  if (c) {
    for (const k of ['id', 'question', 'boundary', 'dissent', 'options', 'meanwhile', 'cost_of_delay', 'deadline', 'source']) assert(k in c, `a card has field ${k}`);
    assert(Object.keys(c).indexOf('dissent') < Object.keys(c).indexOf('question'), 'JSON: dissent comes before the question');
    assert(/Autonomy Limit 2/.test(c.boundary.label) && /spending/i.test(c.boundary.label), 'the boundary resolves to the named Autonomy Limit with its text');
    assert(/CISO — vendor X has no SOC2/.test(c.dissent), 'dissent is carried verbatim');
    assert(JSON.stringify(c.options) === JSON.stringify(['adopt', 'reject', 'defer']), 'options are parsed from OPTIONS:');
    assert(/mock/.test(c.meanwhile) && /one week/.test(c.cost_of_delay), 'what proceeds meanwhile and the cost of delay are carried');
    assert(c.deadline === '2999-01-01', 'the deadline is the DECISION BY date');
    assert(/^bus-log\.md:\d+$/.test(`${c.source.path}:${c.source.line}`), 'the source is bus-log.md with a line number');
  }
  const text = run([d]).out;
  const block = text.slice(Math.max(0, text.indexOf('Adopt vendor X') - 400), text.indexOf('Adopt vendor X') + 600);
  assert(/Dissent:[\s\S]*Question:[\s\S]*Boundary:[\s\S]*Options:[\s\S]*Meanwhile:[\s\S]*Cost of delay:[\s\S]*Deadline:[\s\S]*Source:/.test(block), 'text mode prints dissent first, then question, boundary, options, meanwhile, cost of delay, deadline, source');
  assert(j && !j.cards.some(x => /rename the repo/.test(x.question)), 'over-asking guard: an ask that cites no boundary is not a card');
  assert(j && !j.cards.some(x => /Bogus boundary/.test(x.question)), 'over-asking guard: an unknown boundary is not a card');
  assert(j && j.rejected.length === 2 && j.rejected.every(r => /boundary/i.test(r.reason) && r.source), 'rejected asks are listed with the reason and their source');
  assert(/Rejected \(over-asking guard\): 2/.test(text), 'text mode names the rejected asks, never hides them');
  const plain = j && j.cards.find(x => x.kind === 'bus');
  const noDissent = inbox(project('no-dissent', { bus: [busMsg({ body: 'Plain ask', extra: [bound('§34.7 shared-remote')] })] }));
  const p = noDissent && noDissent.cards[0];
  assert(p && /No dissent recorded/.test(p.dissent) && /not stated/.test(p.meanwhile), 'a missing dissent or meanwhile is said explicitly, never blank');
  assert(p && /§34\.7/.test(p.boundary.label) && /shared remote/i.test(p.boundary.label), 'a §34.7 bullet resolves as a boundary');
  assert(plain, 'sanity: the plain card exists');

  const { lintCard } = require(path.join(SDK, 'scripts', 'commands', 'inbox.js'));
  assert(lintCard({ question: 'q', boundary: null }).some(m => /boundary/.test(m)), 'lintCard rejects a card with no boundary');
  assert(lintCard({ question: 'q', boundary: { id: 'AL-1', label: 'x' } }).length === 0, 'lintCard accepts a card with a known boundary');

  // A reversible surface with no human boundary closes agent-to-agent: rejected, not asked.
  const rev = inbox(project('reversible-surface', { surfaces: { 'S.md': surface({ roster: '[Owner]' }) } }));
  assert(rev && rev.cards.length === 0 && rev.rejected.some(r => /S\.md/.test(r.source)), 'a reversible surface slot with no boundary is rejected (closes agent-to-agent)');
  const irr = inbox(project('irreversible-surface', { surfaces: { 'S.md': surface({ roster: '[Owner]', irreversible: true, state: 'reconciling', body: '\n### Verification — CISO (2026-11-02)\n**Verdict:** no-go\n- key custody is unsolved\n' }) } }));
  const ic = irr && irr.cards[0];
  assert(ic && /Autonomy Limit 4/.test(ic.boundary.label), 'an irreversible surface derives Autonomy Limit 4 as its boundary');
  assert(ic && /CISO: no-go/.test(ic.dissent) && /key custody/.test(ic.dissent), 'surface dissent is the concern/no-go verification blocks');
  assert(ic && JSON.stringify(ic.options) === JSON.stringify(['pass', 'concern', 'no-go']), 'surface options are the §34.2 verdicts');
  assert(ic && ic.blocking === true, 'a reconciling surface is blocking');
  const h2 = inbox(project('h2-verification', { surfaces: { 'S.md': surface({ roster: '[CFO, Owner]', irreversible: true, body: '\n## Verification — CFO (2026-11-02)\n\n**Verdict:** concern\n- runway impact unknown\n' }) } }));
  assert(h2 && h2.cards.length === 1 && /CFO: concern — runway impact unknown/.test(h2.cards[0].dissent), 'an H2 "## Verification —" block also fills its slot and counts as dissent');
}

// ─── cap-inbox-003: cap per principal, overflow named, order ────────────────

// @covers cap-inbox-003
{
  const bus = [];
  for (let i = 1; i <= 7; i++) bus.push(busMsg({ ts: `2026-11-0${i} 10:00`, body: `Ask number ${i}`, due: `2998-01-0${8 - i}`, extra: [bound('AL-2')] }));
  bus.push(busMsg({ ts: '2026-11-09 10:00', priority: 'BLOCKER', body: 'Blocking ask', due: '2999-12-31', extra: [bound('AL-2')] }));
  const d = project('cap', { bus });
  const j = inbox(d);
  assert(j && j.cards.length === 5, `at most 5 cards by default (got ${j && j.cards.length})`);
  assert(j && j.limit === 5, 'the limit comes from limits.inboxMaxCards (default 5)');
  assert(j && j.overflow.count === 3 && j.overflow.cards.length === 3 && j.overflow.cards.every(c => c.id && c.question), 'the overflow is counted and named (id + question)');
  assert(j && /Blocking ask/.test(j.cards[0].question), 'blocking cards come first, even with a later deadline');
  const dl = j ? j.cards.slice(1).map(c => c.deadline) : [];
  assert(dl.length === 4 && dl.every((x, i) => i === 0 || dl[i - 1] <= x), `then cards are ordered by deadline (got ${dl.join(',')})`);
  assert(j && /Ask number 7/.test(j.cards[1].question), 'the earliest deadline is first after the blocking card');
  const text = run([d]).out;
  assert(/\+3 more not shown/.test(text) && /Ask number 1/.test(text), 'text mode prints the overflow count and names each overflowed card');
  const capped = inbox(project('cap-rc', { bus, sdkrc: { limits: { inboxMaxCards: 2 } } }));
  assert(capped && capped.cards.length === 2 && capped.overflow.count === 6, '.sdkrc limits.inboxMaxCards overrides the default');
  const { DEFAULT_LIMITS, validateLimits } = require(path.join(SDK, 'scripts', 'lib', 'limits.js'));
  assert(DEFAULT_LIMITS.inboxMaxCards === 5 && validateLimits({ inboxMaxCards: 3 }).length === 0 && validateLimits({ inboxMaxCards: 0 }).length === 1, 'inboxMaxCards is a validated limit with default 5');
}

// ─── cap-inbox-004: answer → provenance-stamped block; rubber-stamp guard ───

// @covers cap-inbox-004
{
  const d = project('answer', {
    charter: false,
    openDecisions: '- Choose the launch market — DECISION BY: 2020-01-01 — BOUNDARY: §34.7 scope-strategy',
    bus: [busMsg({ body: 'Adopt vendor X', extra: [bound('AL-2'), 'OPTIONS: adopt | reject'] })],
    surfaces: { 'SURFACE-20261101-db-001.md': surface({ roster: '[human:ana]', extraFront: '  boundary: AL-4\n' }) },
  });
  const j = inbox(d);
  const busCard = j && j.cards.find(c => c.kind === 'bus');
  const busBefore = read(d, 'bus-log.md');

  const empty = run([d, 'answer', busCard.id, '--decision', 'adopt', '--reason', '   ']);
  assert(empty.code === 1 && /reason/i.test(empty.err) && /rubber-stamp/i.test(empty.err), 'an empty reason is refused (rubber-stamp guard), exit 1');
  const none = run([d, 'answer', busCard.id, '--decision', 'adopt']);
  assert(none.code === 1 && /reason/i.test(none.err), 'a missing --reason is refused, exit 1');
  const noDecision = run([d, 'answer', busCard.id, '--reason', 'x']);
  assert(noDecision.code === 1 && /--decision/.test(noDecision.err), 'a missing --decision is refused, exit 1');
  const badOpt = run([d, 'answer', busCard.id, '--decision', 'maybe', '--reason', 'x']);
  assert(badOpt.code === 1 && /adopt \| reject/.test(badOpt.err), 'a decision outside the card options is refused and the options are named');
  const unknown = run([d, 'answer', 'inbox-nope', '--decision', 'adopt', '--reason', 'x']);
  assert(unknown.code === 1 && /no open card/i.test(unknown.err), 'an unknown card id is refused, exit 1');
  assert(read(d, 'bus-log.md') === busBefore, 'refused answers write nothing');

  const ok = run([d, 'answer', busCard.id, '--decision', 'adopt', '--reason', 'SOC2 report arrives next week; risk accepted for the pilot']);
  const bl = read(d, 'bus-log.md');
  assert(ok.code === 0, `a reasoned answer exits 0 (${ok.err.trim()})`);
  assert(bl.startsWith(busBefore), 'the Bus reply is appended, never rewriting earlier messages');
  const reply = bl.slice(busBefore.length);
  assert(/FROM: Owner → TO: CTO \| PRIORITY: INFO/.test(reply) && /DECISION: adopt/.test(reply) && /REASON: SOC2 report/.test(reply), 'a Bus card is answered with a Bus reply from the principal to the sender');
  assert(new RegExp(`Card: ${busCard.id}`).test(reply) && /LOOP-PROVENANCE: inbox-[0-9a-f]+ \+ SHA256\([0-9a-f]{64}\)/.test(reply) && /Source: bus-log\.md:\d+/.test(reply), 'the reply is provenance-stamped (card id, source, SHA256)');
  const after = inbox(d);
  assert(after && !after.cards.some(c => c.id === busCard.id), 'an answered card leaves the inbox');

  const ana = inbox(d, ['--for', 'ana']);
  const sc = ana && ana.cards.find(c => c.kind === 'surface');
  const wrongVerdict = run([d, 'answer', sc.id, '--for', 'ana', '--decision', 'approve', '--reason', 'x']);
  assert(wrongVerdict.code === 1 && /pass \| concern \| no-go/.test(wrongVerdict.err), 'a surface answer must be a §34.2 verdict');
  const notMine = run([d, 'answer', sc.id, '--decision', 'pass', '--reason', 'x']);
  assert(notMine.code === 1 && /not addressed to Owner/.test(notMine.err), 'a principal cannot answer a card addressed to someone else');
  const sv = run([d, 'answer', sc.id, '--for', 'ana', '--decision', 'pass', '--reason', 'Postgres matches our ops skills']);
  const surf = read(d, 'surfaces/SURFACE-20261101-db-001.md');
  assert(sv.code === 0 && /### Verification — human:ana \(\d{4}-\d{2}-\d{2}, via sdk-doc inbox\)\n\*\*Verdict:\*\* pass\n- Postgres matches/.test(surf), 'a surface card is answered with a verification block for the roster slot');
  assert(/LOOP-PROVENANCE: SURFACE-20261101-db-001 \+ SHA256\([0-9a-f]{64}\)/.test(surf) && new RegExp(`Card: ${sc.id}`).test(surf), 'the verification block carries §34.2 provenance');
  assert(/state: under-verification/.test(surf), 'answering never moves the surface state');
  const ana2 = inbox(d, ['--for', 'ana']);
  assert(ana2 && !ana2.cards.some(c => c.kind === 'surface'), 'the filled slot leaves the inbox');

  const ch = after.cards.find(c => c.kind === 'charter');
  const hBefore = read(d, 'history.md');
  const hv = run([d, 'answer', ch.id, '--decision', 'amend', '--reason', 'Autonomy Limit 2 needs a spend floor first']);
  const hist = read(d, 'history.md');
  assert(hv.code === 0 && hist.startsWith(hBefore), 'a CHARTER card is answered by appending to history.md');
  assert(/## Inbox decision — /.test(hist) && /\*\*Decision:\*\* amend/.test(hist) && /\*\*Reason:\*\* Autonomy Limit 2 needs/.test(hist) && /\*\*Made by:\*\* Owner/.test(hist) && /\*\*Source:\*\* CHARTER\.md:\d+/.test(hist), 'the history decision records decision, reason, principal and source');
  assert(/LOOP-PROVENANCE: inbox-[0-9a-f]+ \+ SHA256\([0-9a-f]{64}\)/.test(hist), 'the history decision is provenance-stamped');
  assert(read(d, 'CHARTER.md') === CHARTER(false), 'answering never edits CHARTER.md (Layer A stays human-signed)');
  assert(/sign/i.test(hv.out), 'a CHARTER answer reminds the Owner to sign the ratification line personally');

  const od = after.cards.find(c => c.kind === 'overdue');
  const ov = run([d, 'answer', od.id, '--decision', 'go with Spain', '--reason', 'largest waitlist']);
  assert(ov.code === 0 && /\*\*Decision:\*\* go with Spain/.test(read(d, 'history.md')), 'an overdue current-status item is answered with a history decision');
  const end = inbox(d);
  assert(end && end.cards.length === 0, 'every answered card has left the inbox');
  assert(read(d, 'current-status.md') === STATUS('- Choose the launch market — DECISION BY: 2020-01-01 — BOUNDARY: §34.7 scope-strategy'), 'answering never rewrites current-status.md');
}

// @covers cap-inbox-004
// Regression: free text naming another card id must not close that card (provenance integrity, B4.3 never hidden).
{
  const d2 = project('forge2', {
    charter: false,
    bus: [
      busMsg({ body: 'Adopt vendor X', extra: [bound('AL-2'), 'OPTIONS: adopt | reject'] }),
      busMsg({ ts: '2026-11-01 12:00', priority: 'BLOCKER', body: 'Rotate prod keys', extra: [bound('AL-4'), 'OPTIONS: rotate | defer'] }),
    ],
    surfaces: { 'SURFACE-20261101-db-001.md': surface({ roster: '[human:ana]', extraFront: '  boundary: AL-4\n' }) },
  });
  const j2 = inbox(d2);
  const a2 = j2.cards.find(c => c.question === 'Adopt vendor X');
  const b2 = j2.cards.find(c => c.question === 'Rotate prod keys');
  assert(a2 && b2 && a2.id !== b2.id, 'fixture has two distinct open Bus cards');
  const sc = inbox(d2, ['--for', 'ana']).cards.find(c => c.kind === 'surface');
  const r1 = run([d2, 'answer', a2.id, '--decision', 'adopt', '--reason', `ok see Card: ${b2.id} · Source: x · Commit: y`]);
  assert(r1.code === 0, `an answer whose reason names another card is accepted (${r1.err.trim()})`);
  const k = inbox(d2);
  assert(k.cards.some(c => c.id === b2.id) && !k.cards.some(c => c.id === a2.id), 'a forged Bus marker in a reason leaves the other card open; only the answered card closes');
  assert(k.cards.length === j2.cards.length - 1, 'one answer closes exactly one card');
  // Surface reason line forging the surface marker format for a different card.
  run([d2, 'answer', b2.id, '--decision', 'rotate', '--reason', `Card: ${sc.id} · Answered by: ana · Commit: z`]);
  const k2 = inbox(d2, ['--for', 'ana']);
  assert(k2.cards.some(c => c.id === sc.id), 'a reason forging a surface marker does not fill the roster slot');
  // A hand-written marker without a valid provenance stamp does not close a card.
  fs.appendFileSync(path.join(d2, 'surfaces', 'SURFACE-20261101-db-001.md'), `\n- Card: ${sc.id} · Answered by: ana · Commit: none\n`);
  assert(inbox(d2, ['--for', 'ana']).cards.some(c => c.id === sc.id), 'an unstamped Card: marker does not close a card');
  const sv = run([d2, 'answer', sc.id, '--for', 'ana', '--decision', 'pass', '--reason', `fine; also Card: ${a2.id}`]);
  assert(sv.code === 0 && !inbox(d2, ['--for', 'ana']).cards.some(c => c.id === sc.id), 'a genuine stamped answer still closes its card');
  const ymd = (t) => `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  assert(read(d2, 'surfaces/SURFACE-20261101-db-001.md').includes(`(${ymd(new Date())}, via sdk-doc inbox)`), 'answer dates use the local calendar day, not UTC');
}

// ─── CLI hygiene ─────────────────────────────────────────────────────────────

// @covers cap-inbox-001
{
  const missing = run([path.join(TMP, 'does-not-exist')]);
  assert(missing.code === 1 && /not found/.test(missing.err), 'a missing project dir exits 1');
  const help = spawnSync('node', [DOC, '--help'], { encoding: 'utf8', env: ENV }).stdout;
  assert(/inbox\s+<project-dir> \[--for <principal>\] \[--json\]/.test(help) && /inbox\s+<project-dir> answer <card-id>/.test(help), 'sdk-doc --help documents inbox and answer');
}

console.log(`  inbox capability tests: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
