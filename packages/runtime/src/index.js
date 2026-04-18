'use strict';

/**
 * @team-sdk/runtime — Pluggable LLM runtime adapter.
 *
 * Defines the adapter contract for host environments. Any environment
 * that implements the adapter interface can run team-sdk agents.
 */

const { createRuntime, BUILT_IN_ADAPTERS } = require('./runtime');
const { ADAPTER_INTERFACE, CAPABILITIES, validateAdapter, hasCapability } = require('./adapter');
const { createClaudeCodeAdapter } = require('./adapters/claude-code');
const { createStandaloneAdapter } = require('./adapters/standalone');

module.exports = {
  // Runtime
  createRuntime,
  BUILT_IN_ADAPTERS,

  // Adapter interface
  ADAPTER_INTERFACE,
  CAPABILITIES,
  validateAdapter,
  hasCapability,

  // Built-in adapters
  createClaudeCodeAdapter,
  createStandaloneAdapter,
};
