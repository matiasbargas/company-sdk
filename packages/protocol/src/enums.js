'use strict';

/**
 * enums.js — Protocol enumerations.
 * Single source of truth for all enum values in the Bus protocol.
 */

const PRIORITY = Object.freeze({
  INFO: 'INFO',
  DECISION_NEEDED: 'DECISION NEEDED',
  BLOCKER: 'BLOCKER',
});

const SOLUTION_CLASS = Object.freeze({
  KNOWN: 'KNOWN',
  EXPLORATORY: 'EXPLORATORY',
  HYBRID: 'HYBRID',
});

const COST_SIGNAL = Object.freeze({
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  UNKNOWN: 'UNKNOWN',
});

const STATUS = Object.freeze({
  PENDING: 'Pending',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
  BLOCKED: 'Blocked',
});

const LOG_STATUS = Object.freeze({
  ACTIVE: 'active',
  COMPLETED: 'completed',
  BLOCKED: 'blocked',
  CANCELLED: 'cancelled',
});

const TAGS = Object.freeze({
  FRAMING_CHALLENGE: 'FRAMING-CHALLENGE',
  RATCHET_CANDIDATE: 'RATCHET-CANDIDATE',
  SDK_CHANGE: 'SDK-CHANGE',
  CONSULTATION: 'CONSULTATION',
});

const KILL_CLASS = Object.freeze({
  FRAMING_WRONG: 'FRAMING_WRONG',
  SCOPE_OBSOLETE: 'SCOPE_OBSOLETE',
  PRIORITY_SHIFT: 'PRIORITY_SHIFT',
  EXECUTION_STALLED: 'EXECUTION_STALLED',
});

/** Roles that MUST include SOLUTION_CLASS on DECISION NEEDED and BLOCKER messages */
const SOLUTION_CLASS_REQUIRED_ROLES = Object.freeze([
  'cto', 'chief engineer', 'mario', 'em', 'staff engineer', 'coordinator',
]);

/** FRAMING-CHALLENGE requires non-INFO priority */
const TAG_PRIORITY_RULES = Object.freeze({
  'FRAMING-CHALLENGE': { forbidden: ['INFO'] },
  'RATCHET-CANDIDATE': { required: ['INFO'] },
});

const RELEASE_ID_RE = /^v\d{4}\.Q[1-4]\.\d+$/;

module.exports = {
  PRIORITY,
  SOLUTION_CLASS,
  COST_SIGNAL,
  STATUS,
  LOG_STATUS,
  TAGS,
  KILL_CLASS,
  SOLUTION_CLASS_REQUIRED_ROLES,
  TAG_PRIORITY_RULES,
  RELEASE_ID_RE,
};
