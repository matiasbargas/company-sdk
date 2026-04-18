'use strict';

/**
 * runtime.js — Runtime factory.
 *
 * Creates a runtime instance backed by an adapter. The runtime is the
 * single entry point for all host-environment operations.
 */

const { validateAdapter, hasCapability } = require('./adapter');
const { createClaudeCodeAdapter } = require('./adapters/claude-code');
const { createStandaloneAdapter } = require('./adapters/standalone');

const BUILT_IN_ADAPTERS = Object.freeze({
  'claude-code': createClaudeCodeAdapter,
  'standalone': createStandaloneAdapter,
});

/**
 * Create a runtime instance.
 *
 * @param {object} [config]
 * @param {string|object} [config.adapter] — Adapter name (built-in) or adapter object
 * @param {object} [config.adapterOptions] — Options passed to built-in adapter factories
 * @param {string} [config.sdkRoot] — SDK root directory
 * @returns {object} Runtime interface
 */
function createRuntime(config = {}) {
  let adapter;

  if (typeof config.adapter === 'string') {
    const factory = BUILT_IN_ADAPTERS[config.adapter];
    if (!factory) {
      throw new Error(`Unknown adapter: "${config.adapter}". Built-in adapters: ${Object.keys(BUILT_IN_ADAPTERS).join(', ')}`);
    }
    adapter = factory(config.adapterOptions || {});
  } else if (typeof config.adapter === 'object' && config.adapter !== null) {
    adapter = config.adapter;
  } else {
    // Default to claude-code
    adapter = createClaudeCodeAdapter(config.adapterOptions || {});
  }

  // Validate the adapter
  const validation = validateAdapter(adapter);
  if (!validation.valid) {
    throw new Error(`Invalid adapter: ${validation.errors.join('; ')}`);
  }

  let initialized = false;

  return {
    /**
     * Get the current adapter.
     */
    getAdapter() {
      return adapter;
    },

    /**
     * Get adapter name.
     */
    getName() {
      return adapter.name;
    },

    /**
     * Get adapter provider.
     */
    getProvider() {
      return adapter.provider;
    },

    /**
     * Get capabilities.
     */
    getCapabilities() {
      return [...adapter.capabilities];
    },

    /**
     * Check if the runtime has a specific capability.
     */
    hasCapability(cap) {
      return hasCapability(adapter, cap);
    },

    /**
     * Spawn a sub-agent.
     * @param {object} config — { role, persona, context, question }
     */
    spawnAgent(config) {
      if (!hasCapability(adapter, 'agent-spawn')) {
        throw new Error(`Adapter "${adapter.name}" does not support agent-spawn`);
      }
      return adapter.spawnAgent(config);
    },

    /**
     * Send a message to the LLM.
     */
    sendMessage(prompt, options) {
      return adapter.sendMessage(prompt, options);
    },

    /**
     * Read a file.
     */
    readFile(filePath) {
      if (!hasCapability(adapter, 'file-read')) {
        throw new Error(`Adapter "${adapter.name}" does not support file-read`);
      }
      return adapter.readFile(filePath);
    },

    /**
     * Write a file.
     */
    writeFile(filePath, content) {
      if (!hasCapability(adapter, 'file-write')) {
        throw new Error(`Adapter "${adapter.name}" does not support file-write`);
      }
      return adapter.writeFile(filePath, content);
    },

    /**
     * List files.
     */
    listFiles(pattern) {
      return adapter.listFiles(pattern);
    },

    /**
     * Initialize the runtime.
     */
    initialize(sdkRoot) {
      if (adapter.initialize) {
        adapter.initialize(sdkRoot || config.sdkRoot);
      }
      initialized = true;
      return { initialized: true, adapter: adapter.name };
    },

    /**
     * Shutdown.
     */
    shutdown() {
      if (adapter.shutdown) {
        adapter.shutdown();
      }
      initialized = false;
      return { shutdown: true };
    },

    /**
     * Check if initialized.
     */
    isInitialized() {
      return initialized;
    },
  };
}

module.exports = { createRuntime, BUILT_IN_ADAPTERS };
