'use strict';

/**
 * calibration.js — the judgment join (cap-po-calibration-001, cap-po-calibration-002).
 *
 * VOF, the company Owner's rating, kills and §29 disagreements were each recorded but never joined,
 * so there was no calibration signal (company-brain gap 4). This joins them, per bet and cycle:
 *   VOF        — from report.buildReport for each cycle (same weights, suppression and classes)
 *   rating     — the Owner's `judgment` for that cycle; `unrated` stays `unrated` (never defaulted)
 *   ending     — the ledger `close` / `return` (kill) / `reclaim` event, stamped with its cycle
 *   kills      — ledger `return` and `reclaim`, plus history kills parsed by packages/memory
 *                (parseHistory) from the company's history.md that name the grant or mission id
 *   §29        — `### [DISAGREE-NNN]` blocks (sdk-doc disagreement format) in the company's
 *                history.md that name the grant id or the mission id (whole-token match)
 * Calibration (cap-po-calibration-002): an *agent-confident* bet is one whose VOF is above its
 * class median in that cycle (the report's ranking: classes need ≥ 3 funded bets, suppressed or
 * null VOF is unranked). Where such bets were rated flat or regressed is listed per class, beside
 * the report's divergence rule (which also counts unrated as divergent). Here unrated confident
 * bets are listed as unrated and left out of the miss rate: a missing rating is not a judgment.
 *
 * Read-only: a pure function of a folded state, the verified event list and history text. It never
 * appends to the ledger (the CLI does not run the proof-revert scan, which writes).
 */

const fs = require('fs');
const path = require('path');
const { buildReport, WEIGHTS } = require('./report');
const { parseHistory } = require('../../memory/src/ingest');

const ENDING_KIND = { return: 'kill', reclaim: 'reclaim', close: 'close' };
const HISTORY_CANDIDATES = [path.join('project', 'history.md'), 'history.md'];

const escapeRe = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Whole-token match: an id is not matched inside a longer id (b1 ≠ b10, b2 ≠ m-b2). */
function mentions(text, id) {
  if (!id || !text) return false;
  return new RegExp(`(^|[^A-Za-z0-9_-])${escapeRe(id)}(?![A-Za-z0-9_-])`).test(text);
}
function linkOf(text, g) {
  if (mentions(text, g.grant_id)) return 'grant';
  if (mentions(text, g.mission_id)) return 'mission';
  return null;
}

/** §29 blocks from history text: `### [DISAGREE-NNN] topic` up to the next `### ` heading or `---` rule. */
function parseDisagreements(content) {
  const out = [];
  if (!content) return out;
  const re = /^### \[(DISAGREE-\d+)\][ \t]*(.*)$/gm;
  let m;
  while ((m = re.exec(content)) !== null) {
    const start = m.index;
    const rest = content.slice(start + m[0].length);
    const next = rest.search(/\n(?:### |---[ \t]*(?:\n|$))/);
    const block = content.slice(start, next === -1 ? content.length : start + m[0].length + next);
    const line = (re2) => { const x = re2.exec(block); return x ? x[1].trim() : null; };
    const dash = (v) => (v === null || v === '—' || v === '' ? null : v);
    out.push({
      id: m[1], topic: m[2].trim(),
      status: line(/^Status:\s*(\S+)/m) || 'UNKNOWN',
      resolution: dash(line(/^\*\*Resolution:\*\*\s*(.*)$/m)),
      decided_by: dash(line(/^\*\*Decided by:\*\*\s*(.*)$/m)),
      dissent: dash(line(/^\*\*Dissent on record:\*\*\s*(.*)$/m)),
      _text: block,
    });
  }
  return out;
}

/** { [companyId]: { path, content } } for each portfolio company with a history file. Reads only. */
function readCompanyHistories(portfolio) {
  const out = {};
  for (const co of (portfolio && portfolio.companies) || []) {
    if (!co || typeof co.id !== 'string' || typeof co.path !== 'string') continue;
    for (const rel of HISTORY_CANDIDATES) {
      const file = path.join(co.path, rel);
      let content;
      try { content = fs.readFileSync(file, 'utf8'); } catch { continue; }
      out[co.id] = { path: file, content };
      break;
    }
  }
  return out;
}

/** Grant endings from the event stream, each stamped with the Betting cycle it landed in. */
function ledgerEndings(events) {
  const endings = {};
  let cycle = 1;
  for (const e of events || []) {
    if (e.type === 'cycle_close') { cycle = e.cycle + 1; continue; }
    const kind = ENDING_KIND[e.type];
    if (kind && e.grant_id) endings[e.grant_id] = { kind, cycle, reason: e.reason || null, seq: e.seq ?? null, actor: e.actor || null };
  }
  return endings;
}

/**
 * opts: { state, events, portfolio?, histories?, cycle?, weights? }
 *   state     — ledger.fold();  events — ledger.read() (verified)
 *   histories — { [companyId]: { path, content } } (readCompanyHistories)
 */
function buildCalibration(opts) {
  const { state } = opts;
  const weights = opts.weights || WEIGHTS;
  const histories = opts.histories || {};
  const cycles = opts.cycle !== undefined ? [opts.cycle] : Array.from({ length: state.cycle }, (_, i) => i + 1);
  const endings = ledgerEndings(opts.events);

  const parsed = {};
  for (const [company, h] of Object.entries(histories)) {
    let kills = [];
    try { kills = parseHistory(h.content || '', company).filter(x => x.type === 'kill'); } catch { kills = []; }
    parsed[company] = { kills, disagreements: parseDisagreements(h.content || '') };
  }

  const bets = new Map();
  const classes = new Map();
  const misses = [];
  const unrated = [];
  for (const c of cycles) {
    const r = buildReport(state, { cycle: c, portfolio: opts.portfolio, weights });
    const byId = new Map(r.bets.map(b => [b.grant_id, b]));
    for (const b of r.bets) {
      if (!bets.has(b.grant_id)) {
        bets.set(b.grant_id, { grant_id: b.grant_id, company: b.company, mission_id: b.mission_id, bet_class: b.bet_class, status: b.status, cycles: [] });
      }
      bets.get(b.grant_id).cycles.push({ cycle: c, vof: b.vof, vof_suppressed: b.vof_suppressed, fu_loaded: b.fu_loaded, weight: b.weight,
        rating: b.judgment, rated: b.judgment !== 'unrated' });
      if (b.judgment === 'unrated') unrated.push({ cycle: c, grant_id: b.grant_id });
    }
    for (const k of r.classes) {
      const d = k.divergence;
      const above = d.computed ? d.above_median : [];
      const pick = (rating) => above.filter(id => byId.get(id).judgment === rating);
      const row = {
        cycle: c, cycle_closed: r.cycle_closed, funded: k.funded, computed: d.computed, reason: d.computed ? null : d.reason,
        median_vof: d.computed ? d.median_vof : null, unranked: d.computed ? d.unranked : null,
        high_vof: above, advanced: pick('advanced'), rated_flat: pick('flat'), rated_regressed: pick('regressed'), unrated: pick('unrated'),
        divergence: { ...d },
      };
      for (const id of [...row.rated_flat, ...row.rated_regressed]) {
        const b = byId.get(id);
        misses.push({ cycle: c, grant_id: id, company: b.company, mission_id: b.mission_id, bet_class: k.bet_class, vof: b.vof, median_vof: d.median_vof, rating: b.judgment });
      }
      if (!classes.has(k.bet_class)) classes.set(k.bet_class, { bet_class: k.bet_class, cycles: [] });
      classes.get(k.bet_class).cycles.push(row);
    }
  }

  const betRows = [...bets.values()].sort((a, b) => a.grant_id.localeCompare(b.grant_id)).map(b => {
    const g = { grant_id: b.grant_id, mission_id: b.mission_id };
    const ending = endings[b.grant_id] || null;
    const kills = [];
    if (ending && ending.kind !== 'close') kills.push({ source: 'ledger', kind: ending.kind, cycle: ending.cycle, reason: ending.reason, seq: ending.seq });
    const h = parsed[b.company];
    if (h) {
      for (const k of h.kills) {
        const linked = linkOf([k.summary, k.rationale, k.assumption].filter(Boolean).join('\n'), g);
        if (linked) {
          kills.push({ source: 'history', kind: 'kill', kill_class: k.killClass, date: k.date, summary: k.summary, assumption: k.assumption || null,
            linked_by: linked, path: histories[b.company].path });
        }
      }
    }
    const disagreements = [];
    if (h) {
      for (const d of h.disagreements) {
        const linked = linkOf(d._text, g);
        if (!linked) continue;
        const { _text, ...rest } = d;
        disagreements.push({ ...rest, linked_by: linked, path: histories[b.company].path });
      }
    }
    return { ...b, ending, kills, disagreements };
  });

  const classRows = [...classes.values()].sort((a, b) => a.bet_class.localeCompare(b.bet_class)).map(k => {
    const totals = { high_vof: 0, advanced: 0, flat: 0, regressed: 0, unrated: 0 };
    for (const row of k.cycles) {
      totals.high_vof += row.high_vof.length; totals.advanced += row.advanced.length; totals.flat += row.rated_flat.length;
      totals.regressed += row.rated_regressed.length; totals.unrated += row.unrated.length;
    }
    const rated = totals.advanced + totals.flat + totals.regressed;
    return { ...k, totals, miss_rate: rated ? Math.round((totals.flat + totals.regressed) / rated * 100) / 100 : null };
  });

  return {
    read_only: true,
    cycles,
    open_cycle: state.cycle,
    bets: betRows,
    classes: classRows,
    confident_misses: misses,
    unrated,
    sources: {
      ledger_events: (opts.events || []).length,
      histories: Object.entries(histories).map(([company, h]) => ({ company, path: h.path })).sort((a, b) => a.company.localeCompare(b.company)),
    },
    note: 'agent-confident = VOF above the class median that cycle; unrated is shown as unrated and left out of the miss rate. '
      + 'VOF guides the Betting Table; it never decides alone.',
  };
}

const fmtVof = (c) => (c.vof_suppressed ? 'suppressed' : c.vof === null ? 'n/a' : String(c.vof));

function formatCalibration(cal) {
  const L = [];
  L.push(`Calibration — judgment join over Betting cycle(s) ${cal.cycles.join(', ')} (read-only)`);
  L.push('');
  L.push('Agent-confident bets (VOF above the class median) against the Owner rating, by class:');
  for (const k of cal.classes) {
    L.push(`  Class ${k.bet_class} — high-VOF ${k.totals.high_vof}: advanced ${k.totals.advanced}, flat ${k.totals.flat}, regressed ${k.totals.regressed}, unrated ${k.totals.unrated}`
      + ` | miss rate ${k.miss_rate === null ? 'n/a (no rated high-VOF bet)' : k.miss_rate}`);
    for (const row of k.cycles) {
      if (!row.computed) { L.push(`    cycle ${row.cycle}: not computed — ${row.reason}`); continue; }
      const d = row.divergence;
      const parts = [`median VOF ${row.median_vof}`, `high VOF: ${row.high_vof.join(', ') || '—'}`];
      if (row.rated_flat.length) parts.push(`rated flat: ${row.rated_flat.join(', ')}`);
      if (row.rated_regressed.length) parts.push(`rated regressed: ${row.rated_regressed.join(', ')}`);
      if (row.unrated.length) parts.push(`unrated: ${row.unrated.join(', ')}`);
      parts.push(d.flagged ? `DIVERGENCE (rule: ${d.divergent.join(', ')})` : 'no divergence');
      L.push(`    cycle ${row.cycle}${row.cycle_closed ? '' : ' (open)'}: ${parts.join(' | ')}`);
    }
  }
  L.push('');
  L.push('Bets:');
  for (const b of cal.bets) {
    L.push(`  ${b.grant_id} [${b.company}/${b.mission_id}, ${b.bet_class}, ${b.status}]`
      + (b.ending ? ` ended: ${b.ending.kind} in cycle ${b.ending.cycle}${b.ending.reason ? ` (${b.ending.reason})` : ''}` : ''));
    L.push(`    ${b.cycles.map(c => `c${c.cycle} VOF ${fmtVof(c)} / ${c.rating}`).join(' · ')}`);
    for (const k of b.kills.filter(x => x.source === 'history')) {
      L.push(`    history kill (${k.kill_class}, ${k.date}, by ${k.linked_by}): ${k.summary}`);
    }
    for (const d of b.disagreements) {
      L.push(`    §29 ${d.id} [${d.status}] (by ${d.linked_by}): ${d.topic}${d.dissent ? ` — dissent: ${d.dissent}` : ''}`);
    }
  }
  if (cal.unrated.length) {
    L.push('');
    L.push(`Unrated (not defaulted): ${cal.unrated.map(u => `${u.grant_id}@c${u.cycle}`).join(', ')}`);
  }
  L.push('');
  L.push(cal.note);
  return L.join('\n');
}

module.exports = { buildCalibration, formatCalibration, parseDisagreements, readCompanyHistories, ledgerEndings };
