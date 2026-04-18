'use strict';

/**
 * action-registry.js — Re-exports from @team-sdk/protocol.
 *
 * This file is a thin wrapper that preserves the existing require() interface
 * while the actual implementation lives in packages/protocol/.
 */

const { actions, opsMap } = require('../../packages/protocol/src');

module.exports = { actions, opsMap };
