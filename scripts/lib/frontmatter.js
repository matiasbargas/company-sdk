'use strict';

/**
 * frontmatter.js — Re-exports from @team-sdk/context.
 *
 * This file preserves the existing require() interface while
 * the canonical implementation lives in packages/context/.
 */

const { parseFrontmatter } = require('../../packages/context/src');

module.exports = { parseFrontmatter };
