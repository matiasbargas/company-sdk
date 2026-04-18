'use strict';

/**
 * role-resolver.js — Resolve a question + optional role to the correct agent file.
 *
 * Uses @team-sdk/protocol ROLES data structure for canonical resolution.
 */

const path = require('path');
const { ROLES, resolveRole, ROLE_GROUPS } = require('../../protocol/src');

/**
 * Default roles directory relative to SDK root.
 */
const DEFAULT_ROLES_DIR = 'team/roles';

/**
 * Resolve a role identifier to a file path and role metadata.
 *
 * Resolution order:
 *   1. Project-level roles: <projectDir>/team/roles/<key>.md
 *   2. SDK roles: <sdkRoot>/team/roles/<key>.md
 *
 * Project-level roles override SDK roles. This allows projects to
 * define domain-specific specialists (e.g., Argentine accountant)
 * that are always available when working in that project.
 *
 * @param {string} roleInput - Role key, title, or name (e.g., 'cto', 'CTO', 'Chief Engineer')
 * @param {object} [options]
 * @param {string} [options.sdkRoot] - SDK root directory (defaults to finding it from this package)
 * @param {string} [options.projectDir] - Project directory (for project-level roles)
 * @returns {{ key: string, title: string, filePath: string, domain: string, group: string, source: string }|null}
 */
function resolveRoleToFile(roleInput, options = {}) {
  const fs = require('fs');
  const sdkRoot = options.sdkRoot || findSdkRoot();
  const projectDir = options.projectDir || null;

  // 1. Check project-level custom roles first
  if (projectDir) {
    const projectRole = resolveProjectRole(roleInput, projectDir);
    if (projectRole) return projectRole;
  }

  // 2. Fall back to SDK roles
  const resolved = resolveRole(roleInput);
  if (!resolved) return null;

  if (!sdkRoot) return null;

  const filePath = path.join(sdkRoot, DEFAULT_ROLES_DIR, `${resolved.key}.md`);

  return {
    key: resolved.key,
    title: resolved.title,
    filePath,
    domain: resolved.domain,
    group: resolved.group,
    logFile: resolved.logFile,
    bu: resolved.bu,
    source: 'sdk',
  };
}

/**
 * Resolve a role from project-level team/roles/ directory.
 * Project roles are markdown files that follow _template.md format.
 */
function resolveProjectRole(roleInput, projectDir) {
  const fs = require('fs');
  const rolesDir = path.join(projectDir, 'team', 'roles');
  if (!fs.existsSync(rolesDir)) return null;

  const input = roleInput.toLowerCase().trim();

  // Try direct file match
  const directPath = path.join(rolesDir, `${input}.md`);
  if (fs.existsSync(directPath)) {
    return parseProjectRoleFile(directPath, input);
  }

  // Try matching by scanning all .md files in the directory
  try {
    const files = fs.readdirSync(rolesDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
    for (const file of files) {
      const filePath = path.join(rolesDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      const firstLine = content.split('\n')[0] || '';

      // Match by title in first line (# Role) or filename
      const key = file.replace('.md', '');
      if (key.toLowerCase() === input) {
        return parseProjectRoleFile(filePath, key);
      }

      // Match by title text (e.g., "Argentine Tax Accountant")
      if (firstLine.toLowerCase().includes(input)) {
        return parseProjectRoleFile(filePath, key);
      }
    }
  } catch {
    // Directory read error — skip project roles
  }

  return null;
}

/**
 * Parse a project-level role file into role metadata.
 */
function parseProjectRoleFile(filePath, key) {
  const fs = require('fs');
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  // Extract title from first heading
  const titleLine = lines.find(l => l.startsWith('# '));
  const title = titleLine ? titleLine.replace(/^#\s+/, '').replace(/^Role\s*[-—]\s*/, '').trim() : key;

  // Extract domain from Capability section
  let domain = 'specialist';
  const capIdx = lines.findIndex(l => /^##\s+Capability/i.test(l));
  if (capIdx !== -1) {
    for (let i = capIdx; i < Math.min(capIdx + 10, lines.length); i++) {
      const answersMatch = lines[i].match(/\*\*Answers:\*\*\s*(.+)/i);
      if (answersMatch) {
        const answers = answersMatch[1].toLowerCase();
        if (answers.includes('tax') || answers.includes('account') || answers.includes('financ')) domain = 'finance';
        else if (answers.includes('legal') || answers.includes('law') || answers.includes('regulat')) domain = 'legal';
        else if (answers.includes('engineer') || answers.includes('architect') || answers.includes('technical')) domain = 'engineering';
        else if (answers.includes('design') || answers.includes('ux')) domain = 'design';
        else if (answers.includes('product') || answers.includes('scope')) domain = 'product';
        else if (answers.includes('security') || answers.includes('threat')) domain = 'security';
        else if (answers.includes('trade') || answers.includes('market') || answers.includes('portfolio')) domain = 'trading';
        break;
      }
    }
  }

  return {
    key,
    title,
    filePath,
    domain,
    group: 'project',
    logFile: null,
    bu: null,
    source: 'project',
  };
}

/**
 * List all available roles with their file paths.
 *
 * @param {object} [options]
 * @param {string} [options.sdkRoot] - SDK root directory
 * @param {string} [options.group] - Filter by group (strategic, specialist, execution, etc.)
 * @returns {Array<{ key: string, title: string, filePath: string, domain: string, group: string }>}
 */
function listRoles(options = {}) {
  const fs = require('fs');
  const sdkRoot = options.sdkRoot || findSdkRoot();
  if (!sdkRoot) return [];

  const roles = [];
  const seen = new Set();

  // 1. Project-level roles first (if projectDir provided)
  if (options.projectDir) {
    const projectRolesDir = path.join(options.projectDir, 'team', 'roles');
    if (fs.existsSync(projectRolesDir)) {
      try {
        const files = fs.readdirSync(projectRolesDir).filter(f => f.endsWith('.md') && !f.startsWith('_'));
        for (const file of files) {
          const key = file.replace('.md', '');
          if (options.group && options.group !== 'project') continue;
          const parsed = parseProjectRoleFile(path.join(projectRolesDir, file), key);
          if (parsed) {
            seen.add(key);
            roles.push(parsed);
          }
        }
      } catch {}
    }
  }

  // 2. SDK roles
  if (!options.group || options.group !== 'project') {
    let roleKeys = Object.keys(ROLES);
    if (options.group && options.group !== 'project') {
      const groupKeys = ROLE_GROUPS[options.group];
      if (groupKeys) roleKeys = groupKeys;
    }

    for (const key of roleKeys) {
      if (seen.has(key)) continue; // project role overrides
      const role = ROLES[key];
      roles.push({
        key,
        title: role.title,
        filePath: path.join(sdkRoot, DEFAULT_ROLES_DIR, `${key}.md`),
        domain: role.domain,
        group: role.group,
        source: 'sdk',
      });
    }
  }

  return roles;
}

/**
 * Attempt to find the SDK root from this package's location.
 * Walks up from packages/cli/ to the monorepo root.
 */
function findSdkRoot() {
  // packages/cli/src/ -> packages/cli/ -> packages/ -> root
  const candidate = path.resolve(__dirname, '..', '..', '..');
  const fs = require('fs');
  // Verify by checking for team/roles/ directory
  if (fs.existsSync(path.join(candidate, 'team', 'roles'))) {
    return candidate;
  }
  return null;
}

module.exports = { resolveRoleToFile, listRoles, findSdkRoot, DEFAULT_ROLES_DIR };
