'use strict';

/**
 * schema.js — Entry schema, provenance envelope and validation for the memory store.
 *
 * Schema v2 (B1, company-brain design §2). Every entry carries the envelope:
 *   author      { kind: human|agent|unknown, id, role }
 *   sources[]   [{ file, anchor, content_hash, lines }]   — where the entry was read from
 *   commit_sha  the HEAD commit when the source file was clean in git, else null
 *   confidence  high|medium|low                            — how complete the provenance is
 *
 * Dates come from the source only. A source with no date yields `date: null`, never today.
 * Pure JS, zero deps (same pattern as @team-sdk/protocol).
 */

const crypto = require('crypto');

const SCHEMA_VERSION = 2;

const ENTRY_TYPES = Object.freeze(['decision', 'kill', 'challenge']);

const KILL_CLASSES = Object.freeze([
  'FRAMING_WRONG', 'SCOPE_OBSOLETE', 'PRIORITY_SHIFT', 'EXECUTION_STALLED',
]);

/** `unresolved` = no outcome recorded in the source. Never silently `overridden`. */
const CHALLENGE_OUTCOMES = Object.freeze(['accepted', 'overridden', 'unresolved']);

const AUTHOR_KINDS = Object.freeze(['human', 'agent', 'unknown']);

const CONFIDENCE_LEVELS = Object.freeze(['high', 'medium', 'low']);

/** Role names an agent can carry (protocol roster). Used only to classify authors. */
const AGENT_ROLES = Object.freeze([
  'CEO', 'CTO', 'CFO', 'CISO', 'CLO', 'CDO', 'COO', 'CHRO', 'CMO', 'CPO',
  'PM', 'EM', 'Designer', 'Engineer', 'Staff Engineer', 'Mario', 'Coordinator',
  'Guardian', 'Red-Team', 'Red Team', 'Researcher', 'Analyst',
]);

const HUMAN_MARKERS = /\bowner\b|\(human\)/i;

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');

/**
 * Deterministic id.
 *
 * With a cited source: hash of {project, source_file, content_hash (or commit_sha), anchor}.
 * The content hash is the hash of the entry's own block, so an unchanged entry keeps its id
 * across commits, re-ingests, and entries being added above it. `project` namespaces the id so
 * two companies with an identical `history.md` entry never collide in an explicit/global store.
 *
 * Without a source (e.g. a kill recorded directly through the API): hash of
 * {project, type, date, summary} — still deterministic, never time-based.
 */
function entryId(entry) {
  const src = Array.isArray(entry.sources) ? entry.sources[0] : null;
  if (src && src.file && src.anchor) {
    const version = src.content_hash || entry.commit_sha || '';
    return sha256(`${entry.project || ''}|${src.file}|${version}|${src.anchor}`).slice(0, 16);
  }
  if (!src && entry.type === undefined && entry.sources === undefined) {
    // Bare {project,date,summary} (pre-v2 call shape): keep the v1 formula for compatibility.
    return legacyEntryId(entry);
  }
  return sha256(`${entry.project || ''}|${entry.type || ''}|${entry.date === undefined ? '' : entry.date}|${entry.summary || ''}`).slice(0, 16);
}

/** The v1 id formula, used only to recognise and upgrade entries from old stores. */
function legacyEntryId(entry) {
  return sha256(`${entry.project}|${entry.date}|${entry.summary}`).slice(0, 16);
}

/**
 * Classify a free-text author ("Greg (CEO)", "CTO (Kenji)", "Owner", "Discovery Guardian").
 * Human only for the Owner (or an explicit "(human)" marker); agent only when a roster role is
 * recognised; anything else is `unknown` — never guessed.
 */
function parseAuthor(raw) {
  const text = typeof raw === 'string' ? raw.trim() : '';
  if (!text || /^unknown$/i.test(text)) return { kind: 'unknown', id: null, role: null };

  if (HUMAN_MARKERS.test(text)) {
    return { kind: 'human', id: /^owner$/i.test(text) ? 'owner' : text.replace(/\s*\(human\)\s*/i, '').trim() || 'owner', role: 'Owner' };
  }

  const isRole = (s) => AGENT_ROLES.some(r => new RegExp(`(^|\\s)${r.replace(/[-\s]/g, '[-\\s]')}($|\\s)`, 'i').test(s));
  const paren = text.match(/^(.+?)\s*\(([^)]+)\)\s*$/);
  if (paren) {
    const [, outer, inner] = paren.map(s => s && s.trim());
    if (isRole(inner)) return { kind: 'agent', id: outer, role: inner };
    if (isRole(outer)) return { kind: 'agent', id: inner, role: outer };
    return { kind: 'unknown', id: text, role: null };
  }
  if (isRole(text)) return { kind: 'agent', id: text, role: text };
  return { kind: 'unknown', id: text, role: null };
}

/**
 * Map recorded outcome text to a challenge outcome. No recognisable outcome → `unresolved`.
 */
function resolveChallengeOutcome(text) {
  const t = typeof text === 'string' ? text : '';
  if (/\b(overridden|overruled|rejected|dismissed|declined)\b/i.test(t)) return 'overridden';
  if (/\b(accepted|approved|upheld|adopted|conceded)\b/i.test(t)) return 'accepted';
  return 'unresolved';
}

/**
 * Confidence = completeness of provenance. Gaps: no date, unknown author, no cited source,
 * a defaulted (not recorded) field. 0 gaps → high, 1 → medium, 2+ → low.
 */
function computeConfidence(entry, extraGaps = 0) {
  let gaps = extraGaps;
  if (entry.date === null || entry.date === undefined) gaps++;
  if (!entry.author || entry.author.kind === 'unknown') gaps++;
  if (!Array.isArray(entry.sources) || entry.sources.length === 0) gaps++;
  return gaps === 0 ? 'high' : gaps === 1 ? 'medium' : 'low';
}

/**
 * Validate a memory entry. Returns array of error strings (empty = valid).
 *
 * @param {object} entry
 * @param {object} [opts]
 * @param {boolean} [opts.requireEnvelope=false] — require author/sources/commit_sha/confidence
 *   (the store passes true; the envelope is type-checked whenever present).
 */
function validateEntry(entry, opts = {}) {
  const errors = [];

  if (!entry || typeof entry !== 'object') return ['Entry must be an object'];

  // Required fields
  if (!ENTRY_TYPES.includes(entry.type)) {
    errors.push(`type must be one of: ${ENTRY_TYPES.join(', ')} (got: ${entry.type})`);
  }
  if (!entry.project || typeof entry.project !== 'string') {
    errors.push('project is required (string)');
  }
  if (!('date' in entry) || entry.date === undefined) {
    errors.push('date is required (YYYY-MM-DD, or null when the source records no date)');
  } else if (entry.date !== null && (typeof entry.date !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date))) {
    errors.push('date must be YYYY-MM-DD or null');
  }
  if (!entry.summary || typeof entry.summary !== 'string') {
    errors.push('summary is required (string)');
  }

  // Optional but typed fields
  if (entry.madeBy !== undefined && typeof entry.madeBy !== 'string') {
    errors.push('madeBy must be a string');
  }
  if (entry.release !== undefined && typeof entry.release !== 'string') {
    errors.push('release must be a string');
  }
  if (entry.rationale !== undefined && typeof entry.rationale !== 'string') {
    errors.push('rationale must be a string');
  }
  if (entry.reversible !== undefined && typeof entry.reversible !== 'boolean') {
    errors.push('reversible must be a boolean');
  }
  if (entry.affects !== undefined) {
    if (!Array.isArray(entry.affects) || entry.affects.some(a => typeof a !== 'string')) {
      errors.push('affects must be an array of strings');
    }
  }
  if (entry.tags !== undefined) {
    if (!Array.isArray(entry.tags) || entry.tags.some(t => typeof t !== 'string')) {
      errors.push('tags must be an array of strings');
    }
  }

  // Envelope
  const req = !!opts.requireEnvelope;
  if (entry.author !== undefined || req) {
    const a = entry.author;
    if (!a || typeof a !== 'object') {
      errors.push('author is required ({kind, id, role})');
    } else {
      if (!AUTHOR_KINDS.includes(a.kind)) errors.push(`author.kind must be one of: ${AUTHOR_KINDS.join(', ')} (got: ${a.kind})`);
      if (!('id' in a) || (a.id !== null && typeof a.id !== 'string')) errors.push('author.id must be a string or null');
      if (!('role' in a) || (a.role !== null && typeof a.role !== 'string')) errors.push('author.role must be a string or null');
    }
  }
  if (entry.sources !== undefined || req) {
    if (!Array.isArray(entry.sources) || entry.sources.some(s => !s || typeof s.file !== 'string')) {
      errors.push('sources must be an array of {file, anchor?, content_hash?, lines?}');
    }
  }
  if (entry.commit_sha !== undefined || req) {
    if (!('commit_sha' in entry) || (entry.commit_sha !== null && !/^[0-9a-f]{7,64}$/.test(String(entry.commit_sha)))) {
      errors.push('commit_sha must be a hex commit id or null');
    }
  }
  if (entry.confidence !== undefined || req) {
    if (!CONFIDENCE_LEVELS.includes(entry.confidence)) {
      errors.push(`confidence must be one of: ${CONFIDENCE_LEVELS.join(', ')}`);
    }
  }

  // Kill-specific
  if (entry.type === 'kill') {
    if (!entry.killClass || !KILL_CLASSES.includes(entry.killClass)) {
      errors.push(`killClass is required for kills (one of: ${KILL_CLASSES.join(', ')})`);
    }
  }

  // Challenge-specific
  if (entry.type === 'challenge') {
    if (!entry.challenger || typeof entry.challenger !== 'string') {
      errors.push('challenger is required for challenges (string)');
    }
    if (entry.outcome && !CHALLENGE_OUTCOMES.includes(entry.outcome)) {
      errors.push(`outcome must be one of: ${CHALLENGE_OUTCOMES.join(', ')} (got: ${entry.outcome})`);
    }
  }

  return errors;
}

/**
 * Normalize an entry to schema v2: fill the envelope (author from madeBy, sources, commit_sha,
 * confidence), default arrays, an unresolved challenge outcome, then the deterministic id.
 * `date` is never invented: a missing date becomes null.
 *
 * @param {object} entry
 * @param {object} [opts]
 * @param {number} [opts.extraGaps=0] — provenance gaps the caller knows about (e.g. a defaulted kill class)
 */
function normalizeEntry(entry, opts = {}) {
  const n = { ...entry };
  n.schemaVersion = SCHEMA_VERSION;
  if (n.date === undefined || n.date === '') n.date = null;
  n.affects = n.affects || [];
  n.tags = n.tags || [];
  n.author = n.author || parseAuthor(n.madeBy);
  n.sources = Array.isArray(n.sources) ? n.sources : [];
  n.commit_sha = n.commit_sha === undefined ? null : n.commit_sha;
  if (n.type === 'challenge' && !n.outcome) n.outcome = 'unresolved';
  n.confidence = n.confidence || computeConfidence(n, opts.extraGaps || 0);
  n.id = n.id || entryId(n);
  n.ingestedAt = n.ingestedAt || new Date().toISOString(); // ingest metadata only — never the entry date
  return n;
}

/**
 * Load-time upgrade of a pre-v2 entry: provenance is unknown and flagged, nothing is inferred.
 * v2 entries pass through unchanged.
 */
function upgradeLegacyEntry(entry) {
  if (!entry || typeof entry !== 'object' || entry.schemaVersion >= SCHEMA_VERSION) return entry;
  return {
    ...entry,
    date: entry.date === undefined || entry.date === '' ? null : entry.date,
    author: { kind: 'unknown', id: null, role: null },
    sources: [],
    commit_sha: null,
    confidence: 'low',
    provenance: 'unknown',
    legacy: true,
  };
}

module.exports = {
  SCHEMA_VERSION,
  ENTRY_TYPES,
  KILL_CLASSES,
  CHALLENGE_OUTCOMES,
  AUTHOR_KINDS,
  CONFIDENCE_LEVELS,
  AGENT_ROLES,
  entryId,
  legacyEntryId,
  parseAuthor,
  resolveChallengeOutcome,
  computeConfidence,
  validateEntry,
  normalizeEntry,
  upgradeLegacyEntry,
};
