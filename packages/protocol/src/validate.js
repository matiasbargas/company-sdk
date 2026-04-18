'use strict';

/**
 * validate.js — Bus message validation using JSON Schema + cross-field rules.
 *
 * Uses a lightweight schema check (no ajv dependency for v1 — pure JS validation).
 * If ajv is added later, swap the schema check; the interface stays the same.
 *
 * CISO condition: strict validation, fail on first error by default.
 */

const { BUS_MESSAGE_SCHEMA, validateBusRules } = require('./bus-schema');
const { RELEASE_ID_RE, PRIORITY, SOLUTION_CLASS, COST_SIGNAL } = require('./enums');

const VALID_PRIORITIES = new Set(Object.values(PRIORITY));
const VALID_SOLUTION_CLASSES = new Set(Object.values(SOLUTION_CLASS));
const VALID_COST_SIGNALS = new Set(Object.values(COST_SIGNAL));

/**
 * Validate a parsed Bus message object.
 * Returns { valid: boolean, errors: string[] }
 *
 * @param {object} msg - Parsed Bus message
 * @param {object} [options]
 * @param {boolean} [options.allErrors=false] - If false, stop at first error (CISO condition)
 * @returns {{ valid: boolean, errors: string[] }}
 */
function validateBusMessage(msg, options = {}) {
  const allErrors = options.allErrors === true;
  const errors = [];

  function addError(err) {
    errors.push(err);
    if (!allErrors) return true; // signal to stop
    return false;
  }

  // Required fields
  if (!msg || typeof msg !== 'object') {
    return { valid: false, errors: ['Message must be an object'] };
  }

  if (!msg.from || typeof msg.from !== 'string')        { if (addError('from is required and must be a non-empty string')) return { valid: false, errors }; }
  if (!msg.to || typeof msg.to !== 'string')             { if (addError('to is required and must be a non-empty string')) return { valid: false, errors }; }
  if (!msg.release || typeof msg.release !== 'string')   { if (addError('release is required and must be a non-empty string')) return { valid: false, errors }; }
  if (!msg.priority || typeof msg.priority !== 'string') { if (addError('priority is required and must be a non-empty string')) return { valid: false, errors }; }
  if (!msg.message || typeof msg.message !== 'string')   { if (addError('message is required and must be a non-empty string')) return { valid: false, errors }; }

  // Format validation
  if (msg.release && !RELEASE_ID_RE.test(msg.release)) {
    if (addError(`release must match vYYYY.QN.N format, got: ${msg.release}`)) return { valid: false, errors };
  }

  if (msg.priority && !VALID_PRIORITIES.has(msg.priority)) {
    if (addError(`priority must be one of: ${[...VALID_PRIORITIES].join(', ')}`)) return { valid: false, errors };
  }

  if (msg.solutionClass && !VALID_SOLUTION_CLASSES.has(msg.solutionClass)) {
    if (addError(`solutionClass must be one of: ${[...VALID_SOLUTION_CLASSES].join(', ')}`)) return { valid: false, errors };
  }

  if (msg.costSignal && !VALID_COST_SIGNALS.has(msg.costSignal)) {
    if (addError(`costSignal must be one of: ${[...VALID_COST_SIGNALS].join(', ')}`)) return { valid: false, errors };
  }

  if (msg.tags && !Array.isArray(msg.tags)) {
    if (addError('tags must be an array')) return { valid: false, errors };
  }

  if (msg.decisionBy && !/^\d{4}-\d{2}-\d{2}$/.test(msg.decisionBy)) {
    if (addError('decisionBy must be YYYY-MM-DD format')) return { valid: false, errors };
  }

  // Cross-field rules
  const ruleErrors = validateBusRules(msg);
  if (ruleErrors.length > 0) {
    if (allErrors) {
      errors.push(...ruleErrors);
    } else {
      errors.push(ruleErrors[0]);
      return { valid: false, errors };
    }
  }

  return { valid: errors.length === 0, errors };
}

module.exports = { validateBusMessage };
