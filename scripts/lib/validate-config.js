'use strict';

/**
 * validate-config.js — Canonical configuration for sdk-validate
 *
 * Defines: required files, required sections per file, placeholder patterns,
 * and advisory/strict mode thresholds.
 *
 * This is the single source of truth for what counts as "minimum viable documentation."
 * sdk-validate, sdk-ship pre-flight, and any future gate-check-hardening all read from here.
 */

// Files that must exist in a project directory for it to be considered minimally documented.
// Paths are relative to the project directory root.
const REQUIRED_FILES = [
  'current-status.md',
  'history.md',
  'product-requirements.md',
  'engineering-requirements.md',
  'general-requirements.md',
];

// Per-file required section headings. If a heading is present but its following content
// is empty or only whitespace, it counts as an unfilled section.
// Key: relative file path. Value: array of section heading strings (exact match, case-sensitive).
// Section names are stored WITHOUT the leading ## or ### prefix (parseSections strips them).
const REQUIRED_SECTIONS = {
  'current-status.md': [
    'Active Missions',
    'Next Agent To Activate',
  ],
  'history.md': [
    // history.md is valid with zero entries (Day 0 project) — no required sections enforced.
    // VS-03 (sdk-ship pre-flight) will add a "must have at least one entry" strict-mode rule.
  ],
  'product-requirements.md': [],
  'engineering-requirements.md': [],
  'general-requirements.md': [],
};

// Regex patterns that identify unfilled placeholders.
// A line matching any of these in a required file produces a WARN.
const PLACEHOLDER_PATTERNS = [
  /\[PLACEHOLDER\]/i,
  /\[RELEASE\]/,           // unfilled release token in template files
  /\[project\]/i,          // literal "[project]" left from template
  /\[your idea here\]/i,
  /\[paste here\]/i,
  /\[fill in\]/i,
  /^> ?TODO:/m,
];

// Section names (without ## prefix) that are intentionally allowed to be empty.
const ALLOWED_EMPTY_SECTIONS = new Set([
  'In Progress',
  'Blocked',
  'Done',
  'Open Decisions',
  'Session Notes',
  'Waiting On',
]);

module.exports = {
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  PLACEHOLDER_PATTERNS,
  ALLOWED_EMPTY_SECTIONS,
};
