'use strict';

/**
 * intent-resolver.js — Re-exports from @team-sdk/protocol.
 *
 * This file is a thin wrapper that preserves the existing require() interface
 * while the actual implementation lives in packages/protocol/.
 */

const { parseBusMessage, resolveIntent, inferLogFile } = require('../../packages/protocol/src');

module.exports = { resolve: resolveIntent, parseBusMessage, inferLogFile };
