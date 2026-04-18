'use strict';

/**
 * markdown.js — Markdown section utilities.
 *
 * Extracted from doc.js Cluster A. Pure functions, no I/O.
 */

/**
 * Find the line index of a heading in a markdown document.
 * @param {string[]} lines - Array of lines
 * @param {string} heading - Heading text (with or without # prefix)
 * @returns {number} Line index, or -1 if not found
 */
function findSectionIndex(lines, heading) {
  const normalizedHeading = heading.toLowerCase().replace(/^#+\s*/, '').trim();
  for (let i = 0; i < lines.length; i++) {
    const lineNorm = lines[i].toLowerCase().replace(/^#+\s*/, '').trim();
    if (lineNorm === normalizedHeading) {
      return i;
    }
  }
  return -1;
}

/**
 * Get the heading level of a markdown line.
 * @param {string} line
 * @returns {number} Heading level (1-6), or 0 if not a heading
 */
function getSectionLevel(line) {
  const match = line.match(/^(#+)\s/);
  return match ? match[1].length : 0;
}

/**
 * Find the end index of a section (the line before the next same-or-higher-level heading).
 * @param {string[]} lines - Array of lines
 * @param {number} startIndex - Index of the section heading
 * @returns {number} End index (exclusive)
 */
function findSectionEnd(lines, startIndex) {
  const startLevel = getSectionLevel(lines[startIndex]);
  for (let i = startIndex + 1; i < lines.length; i++) {
    const level = getSectionLevel(lines[i]);
    if (level > 0 && level <= startLevel) {
      return i;
    }
  }
  return lines.length;
}

/**
 * Extract the content of a named section from markdown text.
 * @param {string} content - Full markdown content
 * @param {string} heading - Section heading to find
 * @returns {{ start: number, end: number, content: string }|null}
 */
function findSection(content, heading) {
  const lines = content.split('\n');
  const start = findSectionIndex(lines, heading);
  if (start === -1) return null;
  const end = findSectionEnd(lines, start);
  return {
    start,
    end,
    content: lines.slice(start, end).join('\n'),
  };
}

module.exports = { findSectionIndex, getSectionLevel, findSectionEnd, findSection };
