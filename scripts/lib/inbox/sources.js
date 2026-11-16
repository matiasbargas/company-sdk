'use strict';

/** Card sources (cap-inbox-001): bus, surface, charter, overdue, holding. Untrusted text, parsed only. Part of `sdk-doc inbox` (scripts/commands/inbox.js). */

const fs = require('fs');
const path = require('path');
const { findOverdue } = require('../overdue');
const { headerField } = require('../project-state');
const { BOUNDARIES, parseBoundary } = require('./boundaries');
const { readIf, cardId, today, norm, answered, card } = require('./card');

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
  try { ({ holdingHealth } = require('../../../packages/holding/src/health')); } catch (_) { return []; }
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

module.exports = { busCards, surfaceCards, charterCards, overdueCards, holdingCards };
