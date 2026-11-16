'use strict';

/**
 * ingest.js — Parse history.md and bus-log.md into memory entries (schema v2).
 *
 * Integrity rules (B1):
 *   - ids are deterministic from {source_file, content hash, anchor} (see schema.entryId);
 *     anchors are heading text / Bus header + an occurrence ordinal, never line numbers;
 *   - dates come from the source (history **Date:**, Bus [timestamp] header); missing → null;
 *   - a challenge with no recorded outcome is `unresolved`;
 *   - every entry carries author/sources/commit_sha/confidence.
 */

const { readFileSync, existsSync } = require('fs');
const path = require('path');
const { findSectionEnd } = require('../../context/src/markdown');
const { normalizeEntry, resolveChallengeOutcome } = require('./schema');
const { contentHash, commitShaFor, relSource } = require('./provenance');

const KILL_CLASS_RE = /FRAMING_WRONG|SCOPE_OBSOLETE|PRIORITY_SHIFT|EXECUTION_STALLED/;
const ISO_DATE_RE = /\b(\d{4}-\d{2}-\d{2})\b/;

/**
 * Extract the project name from a project directory.
 */
function projectName(projectDir) {
  const resolved = path.resolve(projectDir);
  return path.basename(resolved);
}

/** Occurrence counter so repeated anchors stay distinct and stable. */
function anchorer() {
  const seen = new Map();
  return (key) => {
    const n = (seen.get(key) || 0) + 1;
    seen.set(key, n);
    return `${key}#${n}`;
  };
}

/**
 * Parse a history.md file into entries.
 *
 * History entries follow the protocol.md Section 10 format:
 *   ## [Title] — Description
 *   **Date:** YYYY-MM-DD
 *   **Made by:** Role (Name)
 *   **Release:** vYYYY.QN.N
 *   **Status:** ...
 *   **What happened:** ...
 *
 * @param {string} content
 * @param {string} project
 * @param {object} [opts]
 * @param {string} [opts.sourceFile='history.md'] — path of the file relative to the project dir
 * @param {string|null} [opts.commitSha=null]
 */
function parseHistory(content, project, opts = {}) {
  const sourceFile = opts.sourceFile || 'history.md';
  const commitSha = opts.commitSha || null;
  const lines = content.split('\n');
  const entries = [];
  const anchor = anchorer();

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (!line.startsWith('## ')) continue;

    const titleMatch = line.match(/^##\s+(?:\[([^\]]*)\]\s*—?\s*)?(.+)/);
    if (!titleMatch) continue;

    const tag = titleMatch[1] || '';
    const title = titleMatch[2].trim();
    if (title.includes('Future release entries')) continue;

    const end = findSectionEnd(lines, i);
    const sectionLines = lines.slice(i + 1, end);
    const sectionText = sectionLines.join('\n');

    const dateField = extractField(sectionText, 'Date') || extractField(sectionText, 'Date of work') ||
                      extractField(sectionText, 'Date decided');
    // Source date only: a Date field, else a date written in the heading itself. Never "today".
    const dateMatch = (dateField ? dateField.match(ISO_DATE_RE) : null) || title.match(ISO_DATE_RE);
    const date = dateMatch ? dateMatch[1] : null;
    const madeBy = extractField(sectionText, 'Made by');
    const release = extractField(sectionText, 'Release');
    const status = extractField(sectionText, 'Status');
    const outcomeField = extractField(sectionText, 'Outcome');
    const reversible = extractReversible(sectionText);
    const rationale = extractBlock(sectionText, 'Rationale') ||
                      extractBlock(sectionText, 'What happened');

    let type = 'decision';
    const tags = [];
    if (tag) tags.push(tag);
    const killClassMatch = sectionText.match(KILL_CLASS_RE);
    if ((/kill/i.test(title) || /cancelled/i.test(title)) && killClassMatch) type = 'kill';
    if (/challenge|dissent|disagree/i.test(title)) type = 'challenge';

    const heading = line.replace(/^##\s+/, '').trim();
    const block = [line, ...sectionLines].join('\n');

    const raw = {
      type,
      project,
      projectDir: null, // set by caller
      date,
      release: release || '',
      madeBy: madeBy || 'Unknown',
      summary: title,
      rationale: rationale ? rationale.slice(0, 500) : '',
      reversible,
      affects: inferAffectedDomains(sectionText),
      tags,
      status: status || '',
      sources: [{
        file: sourceFile,
        anchor: anchor(`h2:${heading}`),
        content_hash: contentHash(block),
        lines: `${i + 1}-${end}`,
      }],
      commit_sha: commitSha,
    };

    if (type === 'kill') {
      raw.killClass = killClassMatch[0];
      const assumptionMatch = sectionText.match(/\*\*Assumption[^:]*:\*\*\s*(.+)/i);
      raw.assumption = assumptionMatch ? assumptionMatch[1].trim() : '';
    }
    if (type === 'challenge') {
      raw.challenger = madeBy || 'Unknown';
      raw.outcome = resolveChallengeOutcome(outcomeField || status);
    }

    entries.push(normalizeEntry(raw));
  }

  return entries;
}

/**
 * Parse bus-log.md for kills and decision requests.
 *
 * Supports the canonical one-line header written by sdk-doc bus / sdk-kill:
 *   [YYYY-MM-DD HH:MM] FROM: X → TO: Y | PRIORITY: P | TAG: T | RELEASE: R
 *   <body lines>
 * and the older multi-line form (FROM:/TO:/PRIORITY:/MESSAGE:, optional DATE:/TIMESTAMP:).
 *
 * @param {string} content
 * @param {string} project
 * @param {object} [opts] — { sourceFile='bus-log.md', commitSha=null }
 */
function parseBusLog(content, project, opts = {}) {
  const sourceFile = opts.sourceFile || 'bus-log.md';
  const commitSha = opts.commitSha || null;
  const entries = [];
  const anchor = anchorer();

  for (const msg of splitBusMessages(content)) {
    const { from, priority, tag, release, timestamp, body, block, startLine, endLine } = msg;
    const date = timestamp ? timestamp.slice(0, 10) : null;
    const tags = tag ? tag.split(',').map(t => t.trim()).filter(Boolean) : [];
    const hash = contentHash(block);
    const baseKey = `bus:${timestamp || '-'}|${from || '-'}`;
    const source = (kind) => [{
      file: sourceFile,
      anchor: anchor(`${baseKey}|${kind}`),
      content_hash: hash,
      lines: `${startLine}-${endLine}`,
    }];

    if (/POD KILLED/i.test(body) || /KILL/i.test(tag || '')) {
      const killClassMatch = body.match(KILL_CLASS_RE);
      const assumption = (body.match(/^\s*Assumption:\s*(.+)$/im) || [])[1] || '';
      entries.push(normalizeEntry({
        type: 'kill',
        project,
        date,
        timestamp: timestamp || null,
        release: release || '',
        madeBy: from || 'Unknown',
        summary: summarize(body),
        // A kill must carry a class; when the source records none the default is a provenance gap.
        killClass: killClassMatch ? killClassMatch[0] : 'PRIORITY_SHIFT',
        killClassDefaulted: killClassMatch ? undefined : true,
        assumption: assumption.trim(),
        tags,
        affects: [],
        sources: source('kill'),
        commit_sha: commitSha,
      }, { extraGaps: killClassMatch ? 0 : 1 }));
    }

    if (priority === 'DECISION NEEDED' || priority === 'BLOCKER') {
      entries.push(normalizeEntry({
        type: 'decision',
        project,
        date,
        timestamp: timestamp || null,
        release: release || '',
        madeBy: from || 'Unknown',
        summary: summarize(body),
        rationale: '',
        tags,
        affects: [],
        sources: source('decision'),
        commit_sha: commitSha,
      }));
    }
  }

  return entries;
}

/**
 * Ingest all entries from a project directory.
 * Source paths in the envelope are relative to `projectDir`.
 */
function ingestProject(projectDir) {
  const resolved = path.resolve(projectDir);
  const project = projectName(resolved);
  const entries = [];

  const sources = [
    { names: ['history.md', path.join('project', 'history.md')], parse: parseHistory },
    { names: ['bus-log.md', path.join('project', 'bus-log.md')], parse: parseBusLog },
  ];
  for (const { names, parse } of sources) {
    for (const name of names) {
      const abs = path.join(resolved, name);
      if (!existsSync(abs)) continue;
      const parsed = parse(readFileSync(abs, 'utf8'), project, {
        sourceFile: relSource(resolved, abs),
        commitSha: commitShaFor(abs),
      });
      parsed.forEach(e => { e.projectDir = resolved; });
      entries.push(...parsed);
      break;
    }
  }

  return entries;
}

// --- Helpers ---

const BUS_HEADER_RE = /^\[(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}(?::\d{2})?))?[^\]]*\]\s*FROM:\s*(.+?)\s*(?:→|->)\s*TO:\s*([^|]+?)\s*(?:\|(.*))?$/;
const isLegacyFrom = (l) => l.startsWith('FROM:') || /^\*\*FROM:\*\*/.test(l);

function splitBusMessages(content) {
  const lines = content.split('\n');
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const header = lines[i].match(BUS_HEADER_RE);
    if (header) {
      let end = i + 1;
      while (end < lines.length && !BUS_HEADER_RE.test(lines[end]) && lines[end].trim() !== '---' && !isLegacyFrom(lines[end])) end++;
      const fields = parsePipeFields(header[5] || '');
      const bodyLines = lines.slice(i + 1, end);
      out.push({
        from: header[3].trim(),
        to: header[4].trim(),
        priority: fields.PRIORITY || null,
        tag: fields.TAG || null,
        release: fields.RELEASE || null,
        timestamp: header[2] ? `${header[1]} ${header[2]}` : header[1],
        body: bodyLines.join('\n').trim(),
        block: lines.slice(i, end).join('\n'),
        startLine: i + 1,
        endLine: end,
      });
      i = end - 1;
      continue;
    }
    if (isLegacyFrom(lines[i])) {
      const end = findNextBusMessage(lines, i + 1);
      const block = lines.slice(i, end).join('\n');
      const ts = extractBusField(block, 'TIMESTAMP') || extractBusField(block, 'DATE');
      const tsMatch = ts ? ts.match(/(\d{4}-\d{2}-\d{2})(?:[ T](\d{2}:\d{2}))?/) : null;
      out.push({
        from: extractBusField(block, 'FROM'),
        to: extractBusField(block, 'TO'),
        priority: extractBusField(block, 'PRIORITY'),
        tag: extractBusField(block, 'TAG'),
        release: extractBusField(block, 'RELEASE'),
        timestamp: tsMatch ? (tsMatch[2] ? `${tsMatch[1]} ${tsMatch[2]}` : tsMatch[1]) : null,
        body: extractBusField(block, 'MESSAGE') || '',
        block,
        startLine: i + 1,
        endLine: end,
      });
      i = end - 1;
    }
  }
  return out;
}

function parsePipeFields(s) {
  const fields = {};
  for (const part of s.split('|')) {
    const m = part.match(/^\s*([A-Z_ ]+?):\s*(.*?)\s*$/);
    if (m) fields[m[1].trim()] = m[2];
  }
  return fields;
}

function summarize(body) {
  return body.split('\n').map(l => l.trim()).filter(Boolean).join(' — ').slice(0, 200);
}

/** `**Field:** value` anywhere, or a plain `Field: value` at the start of a line. */
function extractField(text, fieldName) {
  const bold = text.match(new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i'));
  if (bold) return bold[1].trim();
  const plain = text.match(new RegExp(`(?:^|\\n)${fieldName}:\\s*(.+)`, 'i'));
  return plain ? plain[1].trim() : null;
}

function extractReversible(text) {
  const match = text.match(/\*\*Reversible:\*\*\s*(YES|NO|yes|no)/i);
  if (!match) return undefined;
  return match[1].toUpperCase() === 'YES';
}

function extractBlock(text, blockName) {
  const re = new RegExp(`\\*\\*${blockName}[^:]*:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`, 'i');
  const match = text.match(re);
  return match ? match[1].trim() : null;
}

function extractBusField(block, field) {
  const re = new RegExp(`(?:^|\\n)\\*?\\*?${field}:\\*?\\*?\\s*(.+)`, 'i');
  const match = block.match(re);
  return match ? match[1].trim() : null;
}

function findNextBusMessage(lines, startIdx) {
  for (let i = startIdx; i < lines.length; i++) {
    if (isLegacyFrom(lines[i]) || BUS_HEADER_RE.test(lines[i])) return i;
    if (lines[i].trim() === '' && i > startIdx + 2) {
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue;
        if (isLegacyFrom(lines[j]) || lines[j].match(/^---/) || lines[j].startsWith('#')) return i;
        break;
      }
    }
  }
  return lines.length;
}

function inferAffectedDomains(text) {
  const domains = [];
  const lower = text.toLowerCase();
  const map = {
    engineering: ['architecture', 'technical', 'cto', 'engineer', 'infrastructure', 'package', 'monorepo'],
    legal: ['legal', 'clo', 'compliance', 'regulatory', 'license', 'gdpr'],
    security: ['security', 'ciso', 'threat', 'vulnerability', 'auth'],
    product: ['product', 'pm', 'mission', 'scope', 'feature'],
    strategy: ['strategy', 'ceo', 'vision', 'pivot', 'direction'],
    design: ['design', 'ux', 'ui', 'interface'],
    finance: ['budget', 'cfo', 'financial', 'cost', 'pricing'],
    operations: ['operations', 'coo', 'vendor', 'deploy'],
    people: ['hiring', 'chro', 'team', 'culture'],
  };
  for (const [domain, keywords] of Object.entries(map)) {
    if (keywords.some(k => lower.includes(k))) domains.push(domain);
  }
  return domains;
}

module.exports = {
  ingestProject,
  parseHistory,
  parseBusLog,
  projectName,
};
