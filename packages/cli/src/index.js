'use strict';

/**
 * @team-sdk/cli — Consultation extension API for agentic environments.
 *
 * Import createConsultant() to integrate team-sdk consultation into
 * Claude Code, or any other agentic environment.
 */

const { createConsultant } = require('./consultant');
const { consult, suggestRole } = require('./consult');
const { resolveRoleToFile, listRoles, findSdkRoot } = require('./role-resolver');
const { loadRole, parseSections, parseCapability, ROLE_SECTIONS } = require('./role-loader');
const { loadProjectContext } = require('./context-loader');
const { loadSquad, listSquads, parseSquadFile, parseNpmSquad } = require('./squad-loader');
const { validateSquad } = require('./squad-validator');
const { generateProfileContent, createProfile, listProfiles, validateProfileSpec } = require('./profile-generator');

module.exports = {
  // Primary API
  createConsultant,
  consult,
  suggestRole,

  // Role resolution
  resolveRoleToFile,
  listRoles,
  findSdkRoot,

  // Role loading
  loadRole,
  parseSections,
  parseCapability,
  ROLE_SECTIONS,

  // Context loading
  loadProjectContext,

  // Squad marketplace
  loadSquad,
  listSquads,
  parseSquadFile,
  parseNpmSquad,
  validateSquad,

  // Project profiles
  generateProfileContent,
  createProfile,
  listProfiles,
  validateProfileSpec,
};
