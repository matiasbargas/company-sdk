'use strict';

/**
 * standalone.js — Reference/stub adapter for standalone environments.
 *
 * This adapter is a reference implementation for environments that
 * call the Anthropic API directly (e.g., a Node.js script, a custom
 * CLI, or a test harness).
 *
 * It does NOT include an API client — that's the consumer's responsibility.
 * It defines the shape and delegates to user-provided functions.
 */

const { readFileSync, writeFileSync } = require('fs');
const { join } = require('path');

/**
 * Create a standalone adapter.
 *
 * @param {object} options
 * @param {function} [options.llmCall] — Function(prompt, opts) → response string.
 *   If not provided, spawnAgent and sendMessage return payloads without executing.
 * @returns {object} Adapter implementing the runtime interface
 */
function createStandaloneAdapter(options = {}) {
  const llmCall = options.llmCall || null;

  return {
    name: 'standalone',
    provider: options.provider || 'none',
    capabilities: Object.freeze([
      'file-read',
      'file-write',
      ...(llmCall ? ['agent-spawn'] : []),
    ]),

    /**
     * Spawn a sub-agent. If llmCall is provided, executes the call.
     * Otherwise returns the prepared payload.
     */
    async spawnAgent(config) {
      const { role, persona, context, question } = config;
      const prompt = [
        persona ? `You are the ${role}.\n\n${persona}\n\n---\n` : '',
        context ? `Context:\n${context}\n\n---\n` : '',
        `Question: ${question}`,
      ].filter(Boolean).join('\n');

      if (llmCall) {
        const response = await llmCall(prompt, { role });
        return { type: 'agent-spawn', role, response };
      }

      return { type: 'agent-spawn', role, prompt, pending: true };
    },

    /**
     * Send a message. If llmCall is provided, executes.
     */
    async sendMessage(prompt, opts = {}) {
      if (llmCall) {
        const response = await llmCall(prompt, opts);
        return { type: 'message', response };
      }
      return { type: 'message', prompt, pending: true };
    },

    /**
     * Read a file from the filesystem.
     */
    readFile(filePath) {
      return readFileSync(filePath, 'utf8');
    },

    /**
     * Write a file to the filesystem.
     */
    writeFile(filePath, content) {
      writeFileSync(filePath, content);
    },

    /**
     * List files — basic glob via readdirSync (no deep glob in standalone).
     * For production use, consumers should provide a proper glob implementation.
     */
    listFiles(pattern) {
      // Minimal: list files in the directory portion of the pattern
      const { readdirSync } = require('fs');
      const dir = require('path').dirname(pattern);
      try {
        return readdirSync(dir).map(f => join(dir, f));
      } catch {
        return [];
      }
    },

    initialize() { return { initialized: true }; },
    shutdown() { return { shutdown: true }; },
  };
}

module.exports = { createStandaloneAdapter };
