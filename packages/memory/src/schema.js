'use strict';

/**
 * schema.js — Entry schema and validation for the memory store.
 *
 * Every entry in the corpus follows this schema. Validation is pure JS
 * (zero deps, same pattern as @team-sdk/protocol).
 */

const crypto = require('crypto');

const ENTRY_TYPES = Object.freeze(['decision', 'kill', 'challenge']);

const KILL_CLASSES = Object.freeze([
  'FRAMING_WRONG', 'SCOPE_OBSOLETE', 'PRIORITY_SHIFT', 'EXECUTION_STALLED',
]);

const CHALLENGE_OUTCOMES = Object.freeze(['accepted', 'overridden']);

/**
 * Generate a deterministic ID for an entry.
 * Same project + date + summary = same ID (idempotent ingest).
 */
function entryId(entry) {
  const key = `${entry.project}|${entry.date}|${entry.summary}`;
  return crypto.createHash('sha256').update(key).digest('hex').slice(0, 16);
}

/**
 * Validate a memory entry. Returns array of error strings (empty = valid).
 */
function validateEntry(entry) {
  const errors = [];

  if (!entry || typeof entry !== 'object') return ['Entry must be an object'];

  // Required fields
  if (!ENTRY_TYPES.includes(entry.type)) {
    errors.push(`type must be one of: ${ENTRY_TYPES.join(', ')} (got: ${entry.type})`);
  }
  if (!entry.project || typeof entry.project !== 'string') {
    errors.push('project is required (string)');
  }
  if (!entry.date || !/^\d{4}-\d{2}-\d{2}$/.test(entry.date)) {
    errors.push('date is required (YYYY-MM-DD format)');
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
 * Normalize an entry: add id, trim strings, default arrays.
 */
function normalizeEntry(entry) {
  const normalized = { ...entry };
  normalized.id = normalized.id || entryId(normalized);
  normalized.affects = normalized.affects || [];
  normalized.tags = normalized.tags || [];
  normalized.ingestedAt = normalized.ingestedAt || new Date().toISOString();
  return normalized;
}

module.exports = {
  ENTRY_TYPES,
  KILL_CLASSES,
  CHALLENGE_OUTCOMES,
  entryId,
  validateEntry,
  normalizeEntry,
};
