'use strict';

/**
 * bus-schema.js — JSON Schema for Bus message fields.
 *
 * Validates the STRUCTURE of parsed Bus messages (not raw text).
 * Behavioral semantics (escalation judgment, spawn policy) stay in protocol.md prose.
 */

const { PRIORITY, SOLUTION_CLASS, COST_SIGNAL, TAGS, TAG_PRIORITY_RULES, SOLUTION_CLASS_REQUIRED_ROLES, RELEASE_ID_RE } = require('./enums');

const BUS_MESSAGE_SCHEMA = {
  $schema: 'https://json-schema.org/draft/2020-12/schema',
  $id: 'https://team-sdk.dev/schemas/bus-message/v1',
  type: 'object',
  required: ['from', 'to', 'release', 'priority', 'message'],
  properties: {
    from:          { type: 'string', minLength: 1, description: 'Agent name (Role) or just Role' },
    to:            { type: 'string', minLength: 1, description: 'Target agent name, Role, or ALL' },
    release:       { type: 'string', pattern: RELEASE_ID_RE.source, description: 'Release ID: vYYYY.QN.N' },
    priority:      { type: 'string', enum: Object.values(PRIORITY) },
    solutionClass: { type: 'string', enum: Object.values(SOLUTION_CLASS), description: 'Required on DECISION NEEDED and BLOCKER from CTO, Mario, EM, Staff Eng, Coordinator' },
    tags:          { type: 'array', items: { type: 'string' }, description: 'Semantic metadata tags' },
    costSignal:    { type: 'string', enum: Object.values(COST_SIGNAL) },
    timeSignal:    { type: 'string', description: 'Decision age in hours, or N/A' },
    message:       { type: 'string', minLength: 1, description: 'Message body' },
    decisionBy:    { type: 'string', pattern: '^\\d{4}-\\d{2}-\\d{2}$', description: 'Required for DECISION NEEDED' },
    escalation:    { type: 'string', description: 'Role that gets this if no response by deadline' },
  },
  additionalProperties: false,
};

/**
 * Validate a parsed Bus message object beyond schema (cross-field rules).
 * Returns an array of error strings. Empty = valid.
 */
function validateBusRules(msg) {
  const errors = [];

  // DECISION NEEDED requires decisionBy and escalation
  if (msg.priority === PRIORITY.DECISION_NEEDED) {
    if (!msg.decisionBy) errors.push('DECISION NEEDED requires DECISION BY field');
    if (!msg.escalation) errors.push('DECISION NEEDED requires ESCALATION field');
  }

  // BLOCKER requires escalation
  if (msg.priority === PRIORITY.BLOCKER) {
    if (!msg.escalation) errors.push('BLOCKER requires ESCALATION field');
  }

  // SOLUTION_CLASS required for DECISION NEEDED and BLOCKER from certain roles (omit for INFO)
  if (msg.from && msg.priority !== PRIORITY.INFO) {
    const fromLower = msg.from.toLowerCase();
    const requiresSC = SOLUTION_CLASS_REQUIRED_ROLES.some(r => fromLower.includes(r));
    if (requiresSC && !msg.solutionClass) {
      errors.push(`SOLUTION_CLASS required on DECISION NEEDED and BLOCKER messages from ${msg.from}`);
    }
  }

  // Tag-priority rules
  if (msg.tags && msg.tags.length > 0) {
    for (const tag of msg.tags) {
      const rule = TAG_PRIORITY_RULES[tag];
      if (!rule) continue;
      if (rule.forbidden && rule.forbidden.includes(msg.priority)) {
        errors.push(`TAG ${tag} cannot be used with PRIORITY ${msg.priority}`);
      }
      if (rule.required && !rule.required.includes(msg.priority)) {
        errors.push(`TAG ${tag} requires PRIORITY ${rule.required.join(' or ')}`);
      }
    }
  }

  return errors;
}

module.exports = { BUS_MESSAGE_SCHEMA, validateBusRules };
