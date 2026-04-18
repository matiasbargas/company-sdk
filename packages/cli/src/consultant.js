'use strict';

/**
 * consultant.js — Extension API factory for agentic environments.
 *
 * createConsultant() returns an interface that Claude Code, or any other
 * agentic environment, can import to get SDK consultation capabilities.
 *
 * This is the primary integration point for Mission 3.
 */

const { consult, suggestRole } = require('./consult');
const { resolveRoleToFile, listRoles } = require('./role-resolver');
const { loadRole } = require('./role-loader');
const { loadProjectContext } = require('./context-loader');

/**
 * Create a consultant instance configured for a specific environment.
 *
 * @param {object} [config]
 * @param {string} [config.projectDir] - Default project directory for all consultations
 * @param {string} [config.sdkRoot] - SDK root directory (auto-detected if omitted)
 * @param {string} [config.defaultAgentName] - Default agent name for placeholder resolution
 * @returns {object} Consultant interface
 */
function createConsultant(config = {}) {
  const { projectDir, sdkRoot, defaultAgentName } = config;

  return {
    /**
     * Consult a role with a question.
     * @param {string} question - The question to ask
     * @param {object} [options]
     * @param {string} [options.role] - Target role
     * @param {string} [options.projectDir] - Override project directory
     * @param {string} [options.agentName] - Override agent name
     * @returns {object} Consultation payload
     */
    consult(question, options = {}) {
      return consult(question, {
        role: options.role,
        projectDir: options.projectDir || projectDir,
        sdkRoot,
        agentName: options.agentName || defaultAgentName,
      });
    },

    /**
     * Suggest the best role for a question.
     * @param {string} question
     * @returns {string} Suggested role key
     */
    suggestRole(question) {
      return suggestRole(question);
    },

    /**
     * List all available roles.
     * @param {object} [options]
     * @param {string} [options.group] - Filter by group
     * @returns {Array} Role list
     */
    listRoles(options = {}) {
      return listRoles({ ...options, sdkRoot });
    },

    /**
     * Get a specific role's full data.
     * @param {string} roleInput - Role key or title
     * @param {object} [options]
     * @param {string} [options.agentName] - Agent name for placeholder resolution
     * @returns {object|null} Role data or null
     */
    getRole(roleInput, options = {}) {
      const roleFile = resolveRoleToFile(roleInput, { sdkRoot });
      if (!roleFile) return null;
      return {
        ...roleFile,
        ...loadRole(roleFile.filePath, { agentName: options.agentName || defaultAgentName }),
      };
    },

    /**
     * Load project context.
     * @param {string} [dir] - Override project directory
     * @returns {object} Context object
     */
    loadContext(dir) {
      return loadProjectContext(dir || projectDir);
    },

    /**
     * Get the configured SDK root.
     * @returns {string|null}
     */
    getSdkRoot() {
      const { findSdkRoot } = require('./role-resolver');
      return sdkRoot || findSdkRoot();
    },
  };
}

module.exports = { createConsultant };
