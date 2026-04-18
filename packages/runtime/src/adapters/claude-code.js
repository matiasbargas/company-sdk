'use strict';

/**
 * claude-code.js — Default adapter for Claude Code environments.
 *
 * This adapter formalizes what the SDK already does today:
 * - Agent tool for spawning sub-agents
 * - Read/Write/Glob tools for file operations
 * - Native tool-use capabilities
 *
 * In Claude Code, the LLM interaction happens through the host environment.
 * The adapter doesn't call the API directly — it prepares payloads that
 * Claude Code's Agent tool consumes.
 */

/**
 * Create a Claude Code adapter instance.
 *
 * @param {object} [options]
 * @param {string} [options.sdkRoot] — SDK root directory
 * @returns {object} Adapter implementing the runtime interface
 */
function createClaudeCodeAdapter(options = {}) {
  const sdkRoot = options.sdkRoot || null;
  let initialized = false;

  return {
    name: 'claude-code',
    provider: 'anthropic',
    capabilities: Object.freeze([
      'agent-spawn',
      'file-read',
      'file-write',
      'tool-use',
      'web-search',
      'mcp-server',
      'streaming',
    ]),

    /**
     * Spawn a sub-agent in Claude Code.
     *
     * Returns a structured payload that the caller passes to the Agent tool.
     * The adapter doesn't execute the spawn — it prepares the instruction.
     *
     * @param {object} config
     * @param {string} config.role — Role key or title
     * @param {string} [config.persona] — Full persona content (from role file)
     * @param {string} [config.context] — Additional context to include
     * @param {string} config.question — The question or task
     * @returns {{ type: 'agent-spawn', prompt: string, description: string }}
     */
    spawnAgent(config) {
      const { role, persona, context, question } = config;
      const parts = [];

      if (persona) {
        parts.push(`You are acting as the ${role}. Here is your full role definition:\n\n${persona}\n\n---\n`);
      }
      if (context) {
        parts.push(`Project context:\n${context}\n\n---\n`);
      }
      parts.push(`You are in Consultation Mode. Answer this question from your domain expertise:\n\n${question}`);

      return {
        type: 'agent-spawn',
        prompt: parts.join('\n'),
        description: `Consult ${role}`,
        role,
      };
    },

    /**
     * Send a message — in Claude Code, this is a no-op because the host
     * environment manages the conversation. Returns the instruction payload.
     */
    sendMessage(prompt, options = {}) {
      return {
        type: 'message',
        prompt,
        options,
      };
    },

    /**
     * Read a file. In Claude Code, this delegates to the Read tool.
     * Returns the instruction — actual execution is by the host.
     */
    readFile(filePath) {
      return {
        type: 'file-read',
        path: filePath,
      };
    },

    /**
     * Write a file. Delegates to Write tool.
     */
    writeFile(filePath, content) {
      return {
        type: 'file-write',
        path: filePath,
        content,
      };
    },

    /**
     * List files matching a pattern. Delegates to Glob tool.
     */
    listFiles(pattern) {
      return {
        type: 'file-list',
        pattern,
      };
    },

    /**
     * Initialize the adapter.
     */
    initialize(root, config = {}) {
      initialized = true;
      return { initialized: true, sdkRoot: root || sdkRoot };
    },

    /**
     * Shutdown — no-op for Claude Code.
     */
    shutdown() {
      initialized = false;
      return { shutdown: true };
    },
  };
}

module.exports = { createClaudeCodeAdapter };
