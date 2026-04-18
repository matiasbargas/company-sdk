'use strict';

/**
 * adapter.js — Runtime adapter interface definition.
 *
 * Every host environment (Claude Code, Cursor, standalone CLI, etc.)
 * implements this interface. The SDK calls these methods; the adapter
 * translates to the specific provider/environment.
 *
 * This file defines the contract and validates adapters against it.
 */

/**
 * The adapter interface definition.
 * Each key maps to a required property with its expected type.
 */
const ADAPTER_INTERFACE = Object.freeze({
  // Identity (required strings)
  name: { type: 'string', required: true, description: 'Adapter name (e.g., "claude-code", "standalone")' },
  provider: { type: 'string', required: true, description: 'LLM provider (e.g., "anthropic", "openai", "local")' },

  // Capabilities (required array of strings)
  capabilities: { type: 'array', required: true, description: 'Array of capability strings the adapter supports' },

  // Agent operations (required functions)
  spawnAgent: { type: 'function', required: true, description: 'Spawn a sub-agent with role context and question' },
  sendMessage: { type: 'function', required: true, description: 'Send a raw message to the LLM' },

  // Environment operations (required functions)
  readFile: { type: 'function', required: true, description: 'Read a file by path' },
  writeFile: { type: 'function', required: true, description: 'Write content to a file path' },
  listFiles: { type: 'function', required: true, description: 'List files matching a glob pattern' },

  // Lifecycle (optional functions)
  initialize: { type: 'function', required: false, description: 'One-time setup (called once before first use)' },
  shutdown: { type: 'function', required: false, description: 'Cleanup on exit' },
});

/**
 * Well-known capabilities that adapters can declare.
 */
const CAPABILITIES = Object.freeze([
  'agent-spawn',     // Can spawn sub-agents
  'file-read',       // Can read files
  'file-write',      // Can write files
  'tool-use',        // Can invoke external tools
  'web-search',      // Can search the web
  'code-execution',  // Can execute code in a sandbox
  'mcp-server',      // Can connect to MCP servers
  'streaming',       // Supports streaming responses
]);

/**
 * Validate that an adapter implements the required interface.
 *
 * @param {object} adapter - The adapter to validate
 * @returns {{ valid: boolean, errors: string[], warnings: string[] }}
 */
function validateAdapter(adapter) {
  const errors = [];
  const warnings = [];

  if (!adapter || typeof adapter !== 'object') {
    return { valid: false, errors: ['Adapter must be an object'], warnings: [] };
  }

  for (const [key, spec] of Object.entries(ADAPTER_INTERFACE)) {
    const value = adapter[key];

    if (spec.required && value === undefined) {
      errors.push(`Missing required property: ${key} (${spec.description})`);
      continue;
    }

    if (value === undefined) continue; // optional, not present

    // Type check
    if (spec.type === 'string' && typeof value !== 'string') {
      errors.push(`${key} must be a string (got ${typeof value})`);
    } else if (spec.type === 'function' && typeof value !== 'function') {
      errors.push(`${key} must be a function (got ${typeof value})`);
    } else if (spec.type === 'array' && !Array.isArray(value)) {
      errors.push(`${key} must be an array (got ${typeof value})`);
    }
  }

  // Validate capabilities are known
  if (Array.isArray(adapter.capabilities)) {
    for (const cap of adapter.capabilities) {
      if (!CAPABILITIES.includes(cap)) {
        warnings.push(`Unknown capability: "${cap}" — not in the standard set. This is allowed but may not be recognized by all consumers.`);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Check if an adapter has a specific capability.
 */
function hasCapability(adapter, capability) {
  return Array.isArray(adapter.capabilities) && adapter.capabilities.includes(capability);
}

module.exports = {
  ADAPTER_INTERFACE,
  CAPABILITIES,
  validateAdapter,
  hasCapability,
};
