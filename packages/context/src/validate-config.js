'use strict';

/**
 * validate-config.js — Canonical configuration for sdk-validate.
 *
 * Single source of truth for what counts as "minimum viable documentation."
 * sdk-validate, sdk-ship pre-flight, and any future gate-check-hardening all read from here.
 *
 * Extracted from scripts/lib/validate-config.js.
 */

const REQUIRED_FILES = Object.freeze([
  'current-status.md',
  'history.md',
  'product-requirements.md',
  'engineering-requirements.md',
  'general-requirements.md',
]);

const REQUIRED_SECTIONS = Object.freeze({
  'current-status.md': [
    'Active Missions',
    'Next Agent To Activate',
  ],
  'history.md': [],
  'product-requirements.md': [],
  'engineering-requirements.md': [],
  'general-requirements.md': [],
});

const PLACEHOLDER_PATTERNS = Object.freeze([
  /\[PLACEHOLDER\]/i,
  /\[RELEASE\]/,
  /\[project\]/i,
  /\[your idea here\]/i,
  /\[paste here\]/i,
  /\[fill in\]/i,
  /^> ?TODO:/m,
]);

const ALLOWED_EMPTY_SECTIONS = Object.freeze(new Set([
  'In Progress',
  'Blocked',
  'Done',
  'Open Decisions',
  'Session Notes',
  'Waiting On',
]));

module.exports = {
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  PLACEHOLDER_PATTERNS,
  ALLOWED_EMPTY_SECTIONS,
};
