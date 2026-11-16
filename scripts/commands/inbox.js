'use strict';

/**
 * cmdInbox — `sdk-doc inbox`: decision cards for a principal (human or role), built only from
 * primitives that already exist. No new store: every card is derived on each run, and an answer is
 * written back onto the card's own source (a §34 verification block, a §6 history decision, or a
 * Bus reply). Design: project/context/intent/company-brain/design.md §5-6.
 * Spec: project/context/spec/sdk-inbox/claims.yaml (cap-inbox-001..004).
 *
 *   sdk-doc inbox <project-dir> [--for <principal>] [--json]
 *   sdk-doc inbox <project-dir> answer <card-id> --decision <...> --reason "<required>" [--for <principal>]
 *
 * Sources (cap-inbox-001):
 *   bus      open DECISION NEEDED / BLOCKER messages in bus-log.md addressed to the principal or the Owner
 *   surface  surfaces in under-verification / reconciling with an unfilled roster slot (one card per
 *            slot); an irreversible surface in `blocked` is a card for the Owner (§34.7 bullet 3)
 *   charter  CHARTER.md whose ratification line is unsigned
 *   overdue  `DECISION BY:` items past due (scripts/lib/overdue.js) not already carried by a Bus card
 *   holding  holding-health issues (packages/holding/src/health.js) when a holding exists
 *
 * Guards:
 *   over-asking   (cap-inbox-002) a card that does not cite a known boundary (a §34.7 bullet or a
 *                 CHARTER Autonomy Limit) is rejected; rejected asks are listed, never hidden.
 *   cap           (cap-inbox-003) at most limits.inboxMaxCards cards; the overflow is counted and named.
 *   rubber-stamp  (cap-inbox-004) an answer without a non-empty --reason is refused.
 *
 * Bus asks name their boundary and card fields with optional body lines:
 *   BOUNDARY: Autonomy Limit 2 | AL-2 | §34.7 shared-remote | §34.7 bullet 5
 *   DISSENT: … · OPTIONS: a | b | c · MEANWHILE: … · COST OF DELAY: …
 * Bus/history/surface content is untrusted input: it is parsed as text and never executed.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { readLimits } = require('../lib/limits');
const { findOverdue } = require('../lib/overdue');
const { headerField } = require('../lib/project-state');

// ─── Boundaries: the only reasons a human is asked (protocol.md §34.7, CHARTER.md Autonomy Limits) ──

const BOUNDARIES = {
  'AL-1': 'Autonomy Limit 1 — nothing outward-facing (push, merge, tag, release, publish, external messages)',
  'AL-2': 'Autonomy Limit 2 — no spending (paid services, purchases, the Owner\'s money or name)',
  'AL-3': 'Autonomy Limit 3 — no Layer A changes (only the Owner ratifies)',
  'AL-4': 'Autonomy Limit 4 — no irreversible call without both gates (Mario + the Owner)',
  'AL-5': 'Autonomy Limit 5 — no rewriting the record',
  'AL-6': 'Autonomy Limit 6 — no weakening the safeguards',
  'AL-7': 'Autonomy Limit 7 — no secrets or personal data beyond the task',
  '34.7-scope-strategy': '§34.7 — a shift in scope or strategy',
  '34.7-layer-a': '§34.7 — a change to Layer A (CHARTER, _shared.md, STRATEGY.md, structural protocol)',
  '34.7-irreversible-blocked': '§34.7 — an irreversible surface reaching blocked',
  '34.7-sdlc-transition': '§34.7 — an SDLC forward transition',
  '34.7-shared-remote': '§34.7 — anything pushed to a shared remote (push/merge to main)',
};
const BULLETS_347 = ['scope-strategy', 'layer-a', 'irreversible-blocked', 'sdlc-transition', 'shared-remote'];

/** Free text → { id, label } for a known boundary, or null. */
function parseBoundary(text) {
  if (!text) return null;
  const t = String(text).trim();
  const al = t.match(/^(?:Autonomy\s+Limit|AL)[\s#-]*([1-7])\b/i);
  if (al) return { id: `AL-${al[1]}`, label: BOUNDARIES[`AL-${al[1]}`] };
  const s = t.match(/^§?\s*34\.7\s*[-:—]?\s*(?:bullet\s+([1-5])|([a-z-]+))/i);
  if (s) {
    const key = s[1] ? BULLETS_347[Number(s[1]) - 1] : s[2].toLowerCase();
    const id = `34.7-${key}`;
    if (BOUNDARIES[id]) return { id, label: BOUNDARIES[id] };
  }
  return null;
}

/** Over-asking guard: problems with a card (empty = valid). */
function lintCard(card) {
  const problems = [];
  if (!card || !card.question) problems.push('a card needs a question');
  if (!card || !card.boundary || !BOUNDARIES[card.boundary.id]) {
    problems.push('no boundary cited — an ask must name the §34.7 bullet or the Autonomy Limit it hits (BOUNDARY: …); otherwise it closes agent-to-agent');
  }
  return problems;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const readIf = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (_) { return null; } };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const cardId = (...parts) => `inbox-${sha(parts.join('|')).slice(0, 10)}`;
const pad = (n) => String(n).padStart(2, '0');
/** Local calendar day (the Owner's day, not UTC): YYYY-MM-DD. */
const today = (t = new Date()) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
/** Local wall-clock stamp for Bus headers: YYYY-MM-DD HH:MM. */
const nowStamp = (t = new Date()) => `${today(t)} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
const NO_DISSENT = 'No dissent recorded.';
const NOT_STATED = 'not stated — the asker must name it';

/** Principal names compare without case, a `human:` prefix, or a parenthetical. */
const norm = (s) => String(s || '').replace(/\(.*?\)/g, '').replace(/^\s*human:/i, '').trim().toLowerCase();
const names = (to) => String(to || '').split(/,|&|\/|\band\b/).map(norm).filter(Boolean);
const isOwner = (n) => norm(n) === 'owner';

function headSha(dir) {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : 'none';
}
function release(dir) {
  try { const rc = JSON.parse(fs.readFileSync(path.join(dir, '.sdkrc'), 'utf8')); if (rc.releaseId) return rc.releaseId; } catch (_) { /* fall through */ }
  return 'unknown';
}
/**
 * A card is closed only by a provenance-stamped answer block written by `answer`:
 * the block's SHA256 must verify, and its card id is read from the block's own marker line —
 * the final body line (`Card: <id> · …` for Bus, `- Card: <id> · …` for surfaces) or a
 * `**Card:** <id>` field line (history). Free text (reason, decision, question) is collapsed to one
 * line inside a prefixed field, so it can never occupy a marker position; a `Card:` mention inside
 * a reason, or a hand-written unstamped marker, closes nothing. One block closes exactly one card.
 */
const STAMP = /^LOOP-PROVENANCE: \S+ \+ SHA256\(([0-9a-f]{64})\)$/;
const TAIL_MARKER = /^(?:- )?Card: (inbox-[0-9a-f]+) · /;
const FIELD_MARKER = /^\*\*Card:\*\* (inbox-[0-9a-f]+)$/;
const closedCache = new Map();
function closedIds(text) {
  if (closedCache.has(text)) return closedCache.get(text);
  const ids = new Set();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = STAMP.exec(lines[i]);
    if (!m) continue;
    let j = i - 1;
    while (j >= 0 && lines[j].trim() !== '' && lines[j].trim() !== '---') j--;
    const body = lines.slice(j + 1, i);
    if (!body.length || sha(body.join('\n')) !== m[1]) continue;
    const tail = TAIL_MARKER.exec(body[body.length - 1]);
    const field = body.map(l => FIELD_MARKER.exec(l)).filter(Boolean);
    if (tail && !field.length) ids.add(tail[1]);
    else if (!tail && field.length === 1) ids.add(field[0][1]);
  }
  closedCache.set(text, ids);
  return ids;
}
const answered = (text, id) => !!text && closedIds(text).has(id);

function card(o) {
  return {
    id: o.id,
    kind: o.kind,
    addressed_to: o.to,
    blocking: !!o.blocking,
    dissent: o.dissent || NO_DISSENT,
    question: o.question,
    boundary: o.boundary || null,
    options: o.options || [],
    meanwhile: o.meanwhile || NOT_STATED,
    cost_of_delay: o.cost || NOT_STATED,
    deadline: o.deadline || null,
    overdue: !!(o.deadline && o.deadline < today()),
    source: o.source,
    _target: o.target, // where an answer is written: 'bus' | 'surface' | 'history'
    _extra: o.extra || {},
  };
}

// ─── Sources ────────────────────────────────────────────────────────────────

const BUS_HEADER = /^\[([^\]]+)\]\s+FROM:\s*(.+?)\s+→\s+TO:\s*(.+?)\s+\|\s+PRIORITY:\s*([A-Z ]+?)\s*(?:\||$)/;
const FIELD = /^(BOUNDARY|DISSENT|OPTIONS|MEANWHILE|COST OF DELAY|DECISION BY|ESCALATION|COST_SIGNAL|TIME_SIGNAL|SOLUTION_CLASS|TAG):\s*(.*)$/;

function busEntries(projectDir) {
  const text = readIf(path.join(projectDir, 'bus-log.md'));
  if (!text) return { text: '', entries: [] };
  const lines = text.split('\n');
  const entries = [];
  let cur = null;
  lines.forEach((line, i) => {
    const h = line.match(BUS_HEADER);
    if (h) {
      cur = { line: i + 1, end: i + 1, header: line.trim(), ts: h[1], from: h[2].trim(), to: h[3].trim(), priority: h[4].trim(), body: [], fields: {} };
      entries.push(cur);
      return;
    }
    if (!cur) return;
    if (/^---\s*$/.test(line)) { cur = null; return; }
    cur.end = i + 1;
    const f = line.match(FIELD);
    if (f) cur.fields[f[1]] = f[2].trim();
    else if (line.trim()) cur.body.push(line.trim());
  });
  return { text, entries };
}

function busCards(projectDir) {
  const { text, entries } = busEntries(projectDir);
  const out = [];
  for (const e of entries) {
    if (e.priority !== 'DECISION NEEDED' && e.priority !== 'BLOCKER') continue;
    const id = cardId('bus', e.header);
    if (answered(text, id)) continue;
    const f = e.fields;
    out.push(card({
      id, kind: 'bus', to: e.to, target: 'bus',
      blocking: e.priority === 'BLOCKER',
      dissent: f.DISSENT,
      question: e.body.join(' ') || '(empty message)',
      boundary: parseBoundary(f.BOUNDARY),
      options: f.OPTIONS ? f.OPTIONS.split('|').map(s => s.trim()).filter(Boolean) : [],
      meanwhile: f.MEANWHILE,
      cost: f['COST OF DELAY'] || (f.COST_SIGNAL ? `cost signal ${f.COST_SIGNAL}` : null),
      deadline: /^\d{4}-\d{2}-\d{2}$/.test(f['DECISION BY'] || '') ? f['DECISION BY'] : null,
      source: { path: 'bus-log.md', line: e.line },
      extra: { from: e.from, ts: e.ts, firstLine: e.body[0] || '' },
    }));
  }
  return { cards: out, ranges: entries.filter(e => e.priority !== 'INFO').map(e => [e.line, e.end]) };
}

function frontField(front, key) {
  const m = front.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim().replace(/^["']|["']$/g, '') : null;
}
const list = (v) => (v || '').replace(/^\[|\]$/g, '').split(',').map(s => s.trim()).filter(Boolean);

function surfaceCards(projectDir) {
  const dir = path.join(projectDir, 'surfaces');
  if (!fs.existsSync(dir)) return [];
  const out = [];
  for (const f of fs.readdirSync(dir).filter(n => n.endsWith('.md') && !n.startsWith('_')).sort()) {
    const text = readIf(path.join(dir, f)) || '';
    const fm = text.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const front = fm[1];
    const state = frontField(front, 'state');
    if (!['under-verification', 'reconciling', 'blocked'].includes(state)) continue;
    const sid = frontField(front, 'id') || f.replace(/\.md$/, '');
    const title = frontField(front, 'title') || sid;
    const irreversible = frontField(front, 'irreversible') === 'true';
    const roster = list(frontField(front, 'verifier_roster'));
    const rosterLine = text.split('\n').findIndex(l => /^\s*verifier_roster:/.test(l)) + 1 || 1;

    // Verification blocks: heading name + verdict + first bullet.
    const blocks = [];
    const re = /^#{2,3}\s+Verification\s+—\s+([^(\n]+?)\s*(?:\(.*)?$/gm;
    let m;
    while ((m = re.exec(text))) {
      const after = text.slice(m.index + m[0].length, m.index + m[0].length + 800);
      const verdict = (after.match(/\*\*Verdict:\*\*\s*([a-z-]+)/i) || [])[1] || '';
      const first = (after.match(/^- (.+)$/m) || [])[1] || '';
      blocks.push({ who: m[1].trim(), verdict: verdict.toLowerCase(), first });
    }
    const filled = new Set(blocks.map(b => norm(b.who)));
    const dissentList = blocks.filter(b => b.verdict === 'concern' || b.verdict === 'no-go').map(b => `${b.who}: ${b.verdict}${b.first ? ` — ${b.first}` : ''}`);
    const declared = parseBoundary(frontField(front, 'boundary'));
    const base = {
      kind: 'surface', target: 'surface',
      blocking: state === 'reconciling' || state === 'blocked',
      dissent: dissentList.length ? dissentList.join('; ') : null,
      options: ['pass', 'concern', 'no-go'],
      meanwhile: irreversible
        ? 'Unrelated work continues; this irreversible surface cannot advance until it is verified (§34.5).'
        : 'Work elsewhere continues in parallel (§34.5).',
      cost: `"${frontField(front, 'produces') || title}" waits; the surface stays ${state} and sdk-health flags it after limits.surfaceStaleCommits commits.`,
      deadline: frontField(front, 'decision_by'),
      source: { path: `surfaces/${f}`, line: rosterLine },
    };
    const slots = state === 'blocked' ? ['Owner'] : roster.filter(r => !filled.has(norm(r)));
    for (const slot of slots) {
      const id = cardId('surface', sid, norm(slot));
      if (answered(text, id)) continue;
      const boundary = declared
        || (state === 'blocked' && irreversible ? { id: '34.7-irreversible-blocked', label: BOUNDARIES['34.7-irreversible-blocked'] } : null)
        || (irreversible ? { id: 'AL-4', label: BOUNDARIES['AL-4'] } : null);
      out.push(card({
        ...base, id, to: slot, boundary,
        question: `${title} — verify as ${slot} (${sid}, ${state})`,
        extra: { slot, surfaceId: sid, file: path.join(dir, f) },
      }));
    }
  }
  return out;
}

function charterFile(projectDir) {
  return [path.join(projectDir, 'CHARTER.md'), path.join(projectDir, '..', 'CHARTER.md')].find(p => fs.existsSync(p)) || null;
}

function charterCards(projectDir, historyText) {
  const file = charterFile(projectDir);
  if (!file) return [];
  const lines = (readIf(file) || '').split('\n');
  const i = lines.findIndex(l => /Ratified by:/.test(l));
  if (i === -1) return [];
  const signed = lines[i].replace(/.*Ratified by:\**/, '').replace(/\*+/g, '').trim();
  if (signed && !/_{3,}/.test(signed)) return [];
  const id = cardId('charter', path.basename(file), lines[i].trim());
  if (answered(historyText, id)) return [];
  const version = headerField(lines.join('\n'), 'Version') || ((lines.join('\n').match(/Version\s+([\d.]+)/) || [])[1]);
  return [card({
    id, kind: 'charter', to: 'Owner', target: 'history',
    question: `Ratify CHARTER.md${version ? ` v${version.replace(/^v/, '')}` : ''}? Until it is signed it is a proposal, not the constitution.`,
    boundary: { id: '34.7-layer-a', label: `${BOUNDARIES['34.7-layer-a']}; ${BOUNDARIES['AL-3']}` },
    options: ['ratify', 'amend', 'reject'],
    meanwhile: 'Agents keep working under the draft as a proposal; no Layer A change lands.',
    cost: 'Precedence and the Autonomy Limits are not load-bearing until ratified.',
    source: { path: path.relative(projectDir, file).split(path.sep).join('/'), line: i + 1 },
  })];
}

function overdueCards(projectDir, busRanges, historyText) {
  const out = [];
  const statusLines = (readIf(path.join(projectDir, 'current-status.md')) || '').split('\n');
  const busText = readIf(path.join(projectDir, 'bus-log.md')) || '';
  const busLines = busText.split('\n');
  for (const o of findOverdue(projectDir, today())) {
    if (o.file === 'bus-log.md') {
      if (busRanges.some(([a, b]) => o.line >= a && o.line <= b)) continue; // already a Bus card
      const id = cardId('overdue', o.file, o.context, o.due);
      if (answered(busText, id)) continue;
      // Walk back to the Bus header to find who asked whom.
      let hdr = null;
      for (let j = o.line - 1; j >= 0 && !hdr; j--) hdr = busLines[j].match(BUS_HEADER);
      const near = busLines.slice(Math.max(0, o.line - 12), o.line).map(l => l.match(/^BOUNDARY:\s*(.+)$/)).filter(Boolean).pop();
      out.push(card({
        id, kind: 'overdue', to: hdr ? hdr[3].trim() : 'Owner', target: 'bus',
        question: o.context || `Decision due ${o.due}`,
        boundary: parseBoundary(near && near[1]),
        cost: `Overdue since ${o.due}; overdue items go to the CEO with the cost of delay.`,
        deadline: o.due,
        source: { path: o.file, line: o.line },
        extra: { from: hdr ? hdr[2].trim() : 'unknown', ts: hdr ? hdr[1] : '', firstLine: o.context },
      }));
      continue;
    }
    const raw = (statusLines[o.line - 1] || '').trim();
    const boundaryText = (raw.match(/BOUNDARY:\s*([^—|]+)/) || [])[1];
    const question = raw.replace(/^[-*]\s*(\[.\]\s*)?/, '').replace(/[—|-]*\s*DECISION BY:\s*\d{4}-\d{2}-\d{2}/, '').replace(/[—|-]*\s*BOUNDARY:\s*[^—|]+/, '').replace(/[\s—|-]+$/, '').trim();
    const id = cardId('overdue', o.file, question, o.due);
    if (answered(historyText, id)) continue;
    out.push(card({
      id, kind: 'overdue', to: 'Owner', target: 'history',
      question: question || o.context || `Decision due ${o.due}`,
      boundary: parseBoundary(boundaryText),
      cost: `Overdue since ${o.due}; overdue items go to the CEO with the cost of delay.`,
      deadline: o.due,
      source: { path: o.file, line: o.line },
    }));
  }
  return out;
}

function holdingCards(projectDir, historyText) {
  let holdingDir = path.join(projectDir, 'holding');
  try { const rc = JSON.parse(fs.readFileSync(path.join(projectDir, '.sdkrc'), 'utf8')); if (rc.holdingPath) holdingDir = path.resolve(projectDir, rc.holdingPath); } catch (_) { /* default */ }
  if (!fs.existsSync(holdingDir)) return [];
  let holdingHealth;
  try { ({ holdingHealth } = require('../../packages/holding/src/health')); } catch (_) { return []; }
  let res;
  try { res = holdingHealth(holdingDir); } catch (err) { res = { issues: [{ severity: 'error', code: 'HEALTH_FAILED', message: err.message }] }; }
  const out = [];
  const ledger = path.relative(projectDir, path.join(res.holding || holdingDir, 'fuel', 'ledger.jsonl')).split(path.sep).join('/');
  for (const i of res.issues || []) {
    if (i.code === 'NO_HOLDING' || i.severity === 'info') continue;
    const id = cardId('holding', i.code || 'ISSUE', i.capability || '');
    if (answered(historyText, id)) continue;
    const al = /CHAIN_BROKEN|LEDGER_INVALID/.test(i.code || '') ? 'AL-5' : 'AL-2';
    out.push(card({
      id, kind: 'holding', to: 'Owner', target: 'history',
      blocking: i.severity === 'error',
      question: `[${i.code || 'ISSUE'}] ${i.message || ''}`.trim(),
      boundary: { id: al, label: `${BOUNDARIES[al]}; the holding is Owner-only through the CLI` },
      meanwhile: 'Company work continues; agents never act on the ledger or fuel.',
      cost: i.severity === 'error' ? 'sdk-health fails on the holding until this is resolved.' : 'The warning repeats in sdk-health every run.',
      source: { path: ledger, line: null },
    }));
  }
  return out;
}

// ─── Build ──────────────────────────────────────────────────────────────────

function allCards(projectDir) {
  const historyText = readIf(path.join(projectDir, 'history.md')) || '';
  const bus = busCards(projectDir);
  return [
    ...bus.cards,
    ...surfaceCards(projectDir),
    ...charterCards(projectDir, historyText),
    ...overdueCards(projectDir, bus.ranges, historyText),
    ...holdingCards(projectDir, historyText),
  ];
}

const addressedTo = (c, principal) => names(c.addressed_to).includes(norm(principal));
const visibleTo = (c, principal) => addressedTo(c, principal) || names(c.addressed_to).some(isOwner);

function order(a, b) {
  if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
  if (a.deadline !== b.deadline) {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function buildInbox(projectDir, principal = 'Owner') {
  const limit = readLimits(projectDir).inboxMaxCards || 5;
  const accepted = [];
  const rejected = [];
  for (const c of allCards(projectDir).filter(x => visibleTo(x, principal))) {
    const problems = lintCard(c);
    if (problems.length) rejected.push({ id: c.id, kind: c.kind, question: c.question, source: srcStr(c.source), reason: problems.join('; ') });
    else accepted.push(c);
  }
  accepted.sort(order);
  const shown = accepted.slice(0, limit);
  const over = accepted.slice(limit);
  return {
    principal,
    limit,
    cards: shown.map(publicCard),
    overflow: { count: over.length, cards: over.map(c => ({ id: c.id, kind: c.kind, question: c.question, deadline: c.deadline })) },
    rejected,
  };
}

const srcStr = (s) => (s.line ? `${s.path}:${s.line}` : s.path);
function publicCard(c) {
  const o = {};
  for (const [k, v] of Object.entries(c)) if (!k.startsWith('_')) o[k] = v;
  return o;
}

function render(box) {
  const out = [];
  out.push(`Inbox for ${box.principal}: ${box.cards.length} card${box.cards.length === 1 ? '' : 's'} (limit ${box.limit}; limits.inboxMaxCards)`);
  box.cards.forEach((c, n) => {
    const flags = [c.kind, c.blocking ? 'BLOCKING' : null, c.overdue ? 'OVERDUE' : null, `to ${c.addressed_to}`].filter(Boolean).join(' · ');
    out.push('', `[${n + 1}] ${c.id}  (${flags})`);
    out.push(`  Dissent:       ${c.dissent}`);
    out.push(`  Question:      ${c.question}`);
    out.push(`  Boundary:      ${c.boundary.label}`);
    out.push(`  Options:       ${c.options.length ? c.options.join(' | ') : 'free-form (state the decision)'}`);
    out.push(`  Meanwhile:     ${c.meanwhile}`);
    out.push(`  Cost of delay: ${c.cost_of_delay}`);
    out.push(`  Deadline:      ${c.deadline || 'none set'}${c.overdue ? ' (OVERDUE)' : ''}`);
    out.push(`  Source:        ${srcStr(c.source)}`);
  });
  if (box.overflow.count) {
    out.push('', `+${box.overflow.count} more not shown (answer the above or raise limits.inboxMaxCards):`);
    for (const c of box.overflow.cards) out.push(`  - ${c.id}  ${c.question}${c.deadline ? ` (due ${c.deadline})` : ''}`);
  }
  if (box.rejected.length) {
    out.push('', `Rejected (over-asking guard): ${box.rejected.length} — every ask must cite its boundary (a §34.7 bullet or an Autonomy Limit):`);
    for (const r of box.rejected) out.push(`  - ${r.source}  ${r.question}`);
  }
  if (box.cards.length) out.push('', `Answer: sdk-doc inbox <project-dir> answer <card-id> --decision <option> --reason "<why>"${isOwner(box.principal) ? '' : ` --for ${box.principal}`}`);
  return out.join('\n');
}

// ─── Answer (cap-inbox-004) ─────────────────────────────────────────────────

function fail(msg) { console.error(`Error: ${msg}`); process.exit(1); }

function answer(projectDir, id, opts) {
  // Free text lands in markdown records as one line behind a field prefix, so it can never sit in a
  // marker position; closedIds() only trusts the stamped block's own marker line (see answered()).
  const oneLine = (v) => (typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() : '');
  const principal = oneLine(opts.for) || 'Owner';
  const decision = oneLine(opts.decision);
  const reason = oneLine(opts.reason);
  if (!id || id.startsWith('--')) fail('usage: sdk-doc inbox <project-dir> answer <card-id> --decision <...> --reason "<why>"');
  if (!decision) fail('--decision is required.');
  if (!reason) fail('--reason is required and cannot be empty (rubber-stamp guard): say why, especially on a pass.');

  const c = allCards(projectDir).find(x => x.id === id);
  if (!c) fail(`no open card ${id} (already answered, or not an ask). Run: sdk-doc inbox ${projectDir}`);
  if (lintCard(c).length) fail(`card ${id} cites no boundary, so it is not a human ask (over-asking guard).`);
  if (!addressedTo(c, principal)) fail(`card ${id} is not addressed to ${principal} (addressed to ${c.addressed_to}). Use --for <principal>.`);
  if (c.options.length && !c.options.some(o => o.toLowerCase() === decision.toLowerCase())) {
    fail(`--decision must be one of: ${c.options.join(' | ')}`);
  }

  const date = today();
  const commit = headSha(projectDir);
  const src = oneLine(srcStr(c.source));
  const slot = oneLine(c._extra.slot);
  const question = oneLine(c.question);
  const label = oneLine(c.boundary.label);
  const dissent = oneLine(c.dissent);
  const stamp = (binding, body) => `${body}\nLOOP-PROVENANCE: ${binding} + SHA256(${sha(body)})\n`;

  if (c._target === 'surface') {
    const file = c._extra.file;
    const body = `### Verification — ${slot} (${date}, via sdk-doc inbox)\n**Verdict:** ${decision.toLowerCase()}\n- ${reason}\n- Card: ${c.id} · Answered by: ${principal} · Commit: ${commit}`;
    const prev = fs.readFileSync(file, 'utf8');
    fs.appendFileSync(file, `${prev.endsWith('\n') ? '' : '\n'}\n${stamp(c._extra.surfaceId, body)}`, 'utf8');
    console.log(`✓ Verification block for ${c._extra.slot} appended to ${c.source.path} (state unchanged; the author reconciles per §34.3)`);
    return;
  }
  if (c._target === 'bus') {
    const file = path.join(projectDir, 'bus-log.md');
    const ts = nowStamp();
    const body = `[${ts}] FROM: ${principal} → TO: ${oneLine(c._extra.from)} | PRIORITY: INFO | RELEASE: ${release(projectDir)}\nRE: [${oneLine(c._extra.ts)}] ${oneLine(c._extra.from)} → ${oneLine(c.addressed_to)}: ${oneLine(String(c._extra.firstLine)).slice(0, 120)}\nDECISION: ${decision}\nREASON: ${reason}\nCard: ${c.id} · Source: ${src} · Commit: ${commit}`;
    fs.appendFileSync(file, `\n---\n${stamp(c.id, body)}`, 'utf8');
    console.log(`✓ Bus reply to ${c._extra.from} appended to bus-log.md`);
    return;
  }
  const file = path.join(projectDir, 'history.md');
  const body = `## Inbox decision — ${question.slice(0, 90)}\n**Date:** ${date}\n**Made by:** ${principal} (via sdk-doc inbox)\n**Card:** ${c.id}\n**Source:** ${src}\n**Boundary:** ${label}\n**Dissent shown:** ${dissent}\n**Decision:** ${decision}\n**Reason:** ${reason}\n**Commit:** ${commit}`;
  const prev = readIf(file) || '';
  fs.appendFileSync(file, `${prev && !prev.endsWith('\n') ? '\n' : ''}\n${stamp(c.id, body)}`, 'utf8');
  console.log(`✓ Decision appended to history.md (card ${c.id})`);
  if (c.kind === 'charter') {
    console.log('  Reminder: agents cannot edit CHARTER.md (Layer A). If you ratified, sign the ratification line yourself.');
  }
}

// ─── Entry ──────────────────────────────────────────────────────────────────

function parseArgs(args) {
  const opts = {};
  const pos = [];
  for (let i = 2; i < args.length; i++) {
    const a = args[i];
    if (a === '--json' || a === '--dry-run') { opts[a.slice(2)] = true; continue; }
    if (a.startsWith('--')) { opts[a.slice(2)] = i + 1 < args.length && !args[i + 1].startsWith('--') ? args[++i] : ''; continue; }
    pos.push(a);
  }
  return { opts, pos };
}

function cmdInbox({ args, filePath }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) fail(`project directory not found: ${projectDir}`);
  const { opts, pos } = parseArgs(args);
  if (pos[0] === 'answer') return answer(projectDir, pos[1], opts);
  if (pos.length) fail(`unknown inbox subcommand "${pos[0]}" (expected: answer)`);
  const box = buildInbox(projectDir, opts.for || 'Owner');
  console.log(opts.json ? JSON.stringify(box, null, 2) : render(box));
}

module.exports = cmdInbox;
module.exports.buildInbox = buildInbox;
module.exports.lintCard = lintCard;
module.exports.parseBoundary = parseBoundary;
module.exports.BOUNDARIES = BOUNDARIES;
