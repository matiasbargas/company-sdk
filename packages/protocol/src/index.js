'use strict';

/**
 * @team-sdk/protocol — Machine-readable protocol for team-sdk.
 *
 * Bus message schema, parser, validator, role mapping, action registry,
 * and intent resolver. Zero runtime dependencies.
 */

const { parseBusMessage, buildBusMessage } = require('./bus-parser');
const { validateBusMessage } = require('./validate');
const { BUS_MESSAGE_SCHEMA, validateBusRules } = require('./bus-schema');
const { resolve: resolveIntent, PATTERNS } = require('./intent-resolver');
const { actions, opsMap } = require('./action-registry');
const {
  ROLES, ROLE_GROUPS, ACTIVATION_ORDER,
  resolveRole, inferDomain, inferLogFile,
} = require('./roles');
const {
  PRIORITY, SOLUTION_CLASS, COST_SIGNAL, STATUS, LOG_STATUS,
  TAGS, KILL_CLASS, SOLUTION_CLASS_REQUIRED_ROLES, TAG_PRIORITY_RULES,
  RELEASE_ID_RE,
} = require('./enums');

module.exports = {
  // Bus parser
  parseBusMessage,
  buildBusMessage,

  // Bus validation
  validateBusMessage,
  BUS_MESSAGE_SCHEMA,
  validateBusRules,

  // Intent resolver
  resolveIntent,
  PATTERNS,

  // Action registry
  actions,
  opsMap,

  // Roles
  ROLES,
  ROLE_GROUPS,
  ACTIVATION_ORDER,
  resolveRole,
  inferDomain,
  inferLogFile,

  // Enums
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
