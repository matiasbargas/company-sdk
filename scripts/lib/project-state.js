'use strict';

/**
 * project-state.js — the one reader for a project's markdown state.
 *
 * Scripts used to carry their own regexes over current-status.md and
 * compliance-requirements.md. They drifted from the template: gate-check looked for
 * headings the template no longer had, and status.js read the Active Missions table by
 * column position, so "Status" landed in the wrong field. Every reader goes through
 * here instead, and tables are read by header name, not position.
 *
 * The file formats are unchanged. This module only centralizes how they are read.
 */

const fs = require('fs');
const path = require('path');

const RELEASE_RE = /v\d{4}\.Q[1-4]\.\d+/;

function readIf(file) {
  try { return fs.readFileSync(file, 'utf8'); } catch (_) { return null; }
}

/** `**Label:** value` (or `Label: value`) header field; first match wins. */
function headerField(content, label) {
  if (!content) return null;
  const esc = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = content.match(new RegExp(`^\\*\\*${esc}:\\*\\*\\s*(.+)$`, 'm'))
    || content.match(new RegExp(`^${esc}:\\s*(.+)$`, 'm'));
  return m ? m[1].trim() : null;
}

/** Body of the H2 whose heading starts with `prefix` (case-insensitive), up to the next H2. */
function h2(content, prefix) {
  if (!content) return null;
  const esc = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const m = content.match(new RegExp(`^## ${esc}[^\\n]*\\n([\\s\\S]*?)(?=^## |(?![\\s\\S]))`, 'mi'));
  return m ? m[1] : null;
}

/** Markdown tables in a block → arrays of row objects keyed by lower-cased header text. */
function tables(block) {
  if (!block) return [];
  const out = [];
  const lines = block.split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (!/^\s*\|/.test(lines[i]) || !/^\s*\|\s*:?-{2,}/.test(lines[i + 1])) continue;
    const split = (l) => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim());
    const headers = split(lines[i]).map(h => h.toLowerCase().replace(/\*\*/g, ''));
    const rows = [];
    let j = i + 2;
    for (; j < lines.length && /^\s*\|/.test(lines[j]); j++) {
      const cells = split(lines[j]);
      const row = {};
      headers.forEach((h, k) => { row[h] = (cells[k] || '').trim(); });
      rows.push(row);
    }
    out.push({ headers, rows });
    i = j - 1;
  }
  return out;
}

/** First cell whose header matches any of `names` (regex fragments). */
function pick(row, names) {
  for (const key of Object.keys(row)) {
    if (names.some(n => new RegExp(`^(${n})$`, 'i').test(key))) return row[key];
  }
  return '';
}

const isPlaceholder = (v) => !v || /^\[.*\]$/.test(v.trim());

// ─── current-status.md ────────────────────────────────────────────────────────

function parseStatus(content) {
  const releaseRaw = headerField(content, 'Release');
  const missionsBlock = h2(content, 'Active Missions');
  const missions = [];
  for (const t of tables(missionsBlock)) {
    if (!t.headers.some(h => /^mission/.test(h))) continue;
    for (const row of t.rows) {
      const name = pick(row, ['mission', 'mission name']).replace(/\*\*/g, '');
      if (!name || isPlaceholder(name)) continue;
      missions.push({
        name,
        pod: pick(row, ['pod', 'pod name']),
        owner: pick(row, ['owner', 'pm', 'lead']),
        appetite: pick(row, ['appetite', 'appetite remaining']),
        status: pick(row, ['status']).replace(/\*\*/g, ''),
        nextAction: pick(row, ['next action', 'next']),
        dependsOn: pick(row, ['depends on']),
      });
    }
  }
  const waitingBlock = h2(content, 'Waiting On');
  const waiting = waitingBlock
    ? waitingBlock.split('\n').filter(l => /^- \[/.test(l)).map(l => l.replace(/^- \[.\]\s*/, '').trim()).filter(l => !isPlaceholder(l.split('|')[0]))
    : [];
  const openBlock = (h2(content, 'Open Decisions') || '').replace(/\n---[\s\S]*$/, '').trim();
  const openDecisions = !openBlock || /^none\.?$/i.test(openBlock) ? null : openBlock;

  const nextBlock = h2(content, 'Next Agent');
  let nextAgent = null;
  if (nextBlock) {
    const t = tables(nextBlock)[0];
    const role = t && t.rows[0] ? (pick(t.rows[0], ['role', 'agent']) || Object.values(t.rows[0])[0] || null) : null;
    const pm = nextBlock.match(/\*\*Activation phrase:\*\*\s*"([^"]+)"/m)
      || nextBlock.match(/Activation phrase:\s*"([^"]+)"/m)
      || nextBlock.match(/Activation phrase:\s*(.+)$/m)
      || (t && t.rows[0] && { 1: pick(t.rows[0], ['activation phrase']) });
    const phrase = pm && pm[1] && !isPlaceholder(pm[1]) ? pm[1].replace(/^"|"$/g, '').trim() : null;
    nextAgent = { role: role && !isPlaceholder(role) ? role : null, phrase };
  }

  return {
    release: releaseRaw ? ((releaseRaw.match(RELEASE_RE) || [])[0] || releaseRaw) : null,
    releaseRaw,
    updated: headerField(content, 'Last updated'),
    updatedBy: headerField(content, 'Updated by'),
    iteration: headerField(content, 'Iteration'),
    missions,
    waiting,
    openDecisions,
    nextAgent,
  };
}

function readStatus(projectDir) {
  const content = readIf(path.join(projectDir, 'current-status.md'));
  return content === null ? null : parseStatus(content);
}

/** Current release: .sdkrc releaseId first, then the current-status.md header. */
function readRelease(projectDir) {
  try {
    const rc = JSON.parse(fs.readFileSync(path.join(projectDir, '.sdkrc'), 'utf8'));
    if (rc.releaseId && RELEASE_RE.test(rc.releaseId)) return rc.releaseId;
  } catch (_) { /* fall through */ }
  const s = readStatus(projectDir);
  return s && s.release && RELEASE_RE.test(s.release) ? s.release : null;
}

// ─── compliance-requirements.md ───────────────────────────────────────────────

function parseCompliance(content) {
  const gateRows = [];
  for (const t of tables(h2(content, 'Gate Status'))) gateRows.push(...t.rows);
  const gate = (domain, owner) => {
    const row = gateRows.find(r => new RegExp(`^${domain}`, 'i').test(pick(r, ['domain'])) || new RegExp(`^${owner}$`, 'i').test(pick(r, ['owner'])));
    const v = row ? pick(row, ['status']) : '';
    return v && !isPlaceholder(v) ? v.replace(/\*\*/g, '').trim() : null;
  };

  const jBlock = h2(content, 'Jurisdictions');
  const answers = [];
  for (const t of tables(jBlock)) {
    for (const row of t.rows) {
      const a = pick(row, ['answer']);
      if (pick(row, ['question'])) answers.push(a);
    }
  }

  const legal = h2(content, 'Legal');
  const security = h2(content, 'Security');
  return {
    gates: { legal: gate('Legal', 'CLO'), security: gate('Security', 'CISO') },
    jurisdictions: { present: jBlock !== null, filled: answers.length > 0 && answers.every(a => !isPlaceholder(a)) },
    pending: { legal: /- \[ \]/.test(legal || ''), security: /- \[ \]/.test(security || '') },
  };
}

function readCompliance(projectDir) {
  const content = readIf(path.join(projectDir, 'compliance-requirements.md'));
  return content === null ? null : parseCompliance(content);
}

module.exports = {
  headerField, h2, tables,
  parseStatus, readStatus, readRelease,
  parseCompliance, readCompliance,
  RELEASE_RE,
};
