'use strict';

/**
 * squad-validator.js — Validate squad definitions.
 *
 * Checks that a squad has required fields, valid roles, and correct structure.
 */

const { ROLES } = require('../../protocol/src/roles');

const VALID_SIZES = ['S', 'M', 'L', 'Small', 'Medium', 'Large'];

/**
 * Validate a parsed squad definition.
 *
 * @param {object} squad — Parsed squad from parseSquadFile or parseNpmSquad
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateSquad(squad) {
  const errors = [];
  const warnings = [];

  if (!squad || typeof squad !== 'object') {
    return { valid: false, errors: ['Squad must be an object'], warnings: [] };
  }

  // Required fields
  if (!squad.name || typeof squad.name !== 'string') {
    errors.push('Squad must have a name');
  }

  // Check roles exist in protocol
  if (squad.roles && Array.isArray(squad.roles)) {
    const knownRoleKeys = Object.keys(ROLES);
    const knownRoleTitles = Object.values(ROLES).map(r => r.title.toLowerCase());

    for (const role of squad.roles) {
      const roleKey = typeof role === 'string' ? role : role.role;
      if (!roleKey) continue;

      const lower = roleKey.toLowerCase();
      const found = knownRoleKeys.includes(lower) ||
        knownRoleTitles.includes(lower) ||
        Object.values(ROLES).some(r =>
          r.title.toLowerCase() === lower || lower.includes(r.title.toLowerCase())
        );

      if (!found) {
        // Check if it's a custom role (npm squads can define custom roles)
        if (squad.customRoles && squad.customRoles.some(cr => cr.key === lower)) {
          continue; // custom role, valid
        }
        warnings.push(`Role "${roleKey}" not found in protocol. It may be a custom role.`);
      }
    }
  }

  // Purpose should exist
  if (!squad.purpose && !squad.useWhen) {
    warnings.push('Squad has no purpose or useWhen description');
  }

  // Validate npm squad format
  if (squad.teamSdk) {
    if (squad.teamSdk.type !== 'squad') {
      errors.push('npm squad package must have team-sdk.type = "squad"');
    }
    if (squad.teamSdk.version && typeof squad.teamSdk.version !== 'string') {
      errors.push('team-sdk.version must be a string');
    }
    // Custom roles validation
    if (squad.customRoles && Array.isArray(squad.customRoles)) {
      for (const cr of squad.customRoles) {
        if (!cr.key) errors.push('Custom role missing key');
        if (!cr.file) errors.push(`Custom role "${cr.key || '?'}" missing file path`);
        if (!cr.domain) warnings.push(`Custom role "${cr.key || '?'}" has no domain`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

module.exports = { validateSquad };
