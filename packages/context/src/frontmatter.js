'use strict';

/**
 * frontmatter.js — YAML frontmatter parser.
 * Extracted from scripts/lib/frontmatter.js.
 */

/**
 * Parse YAML frontmatter from a markdown file.
 * @param {string} content - Full file content
 * @returns {Record<string, string>} Parsed key-value pairs
 */
function parseFrontmatter(content) {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result = {};
  for (const line of match[1].split('\n')) {
    const kv = line.match(/^(\w[\w_-]*):\s*"?(.*?)"?\s*$/);
    if (kv) result[kv[1]] = kv[2];
  }
  return result;
}

module.exports = { parseFrontmatter };
