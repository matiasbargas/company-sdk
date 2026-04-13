'use strict';

/**
 * Parse simple YAML frontmatter from a markdown file.
 * Handles key: value and key: "quoted value" formats.
 * Returns an object of key-value pairs (all values are strings).
 */
function parseFrontmatter(content) {
  const m = content.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return {};
  const result = {};
  for (const line of m[1].split('\n')) {
    const kv = line.match(/^(\w[\w_-]*)\s*:\s*"?([^"]*)"?\s*$/);
    if (kv) result[kv[1]] = kv[2];
  }
  return result;
}

module.exports = { parseFrontmatter };
