'use strict';

/**
 * validate-config.js — Re-exports from @team-sdk/context.
 *
 * This file preserves the existing require() interface while
 * the canonical implementation lives in packages/context/.
 */

const {
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  PLACEHOLDER_PATTERNS,
  ALLOWED_EMPTY_SECTIONS,
} = require('../../packages/context/src');

module.exports = {
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  PLACEHOLDER_PATTERNS,
  ALLOWED_EMPTY_SECTIONS,
};
