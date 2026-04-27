'use strict';

const fs = require('fs');
const path = require('path');

/**
 * Parse named args from an argv-style array.
 * Starts from index `startIndex` (default 2, skipping command + filePath).
 */
function parseOptions(args, startIndex) {
  const start = typeof startIndex === 'number' ? startIndex : 2;
  const opts = {};
  for (let i = start; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      const key = args[i].slice(2);
      opts[key] = args[++i];
    }
  }
  return opts;
}

/**
 * Infer a project domain from a role name.
 */
function inferDomain(role) {
  const r = (role || '').toLowerCase();
  if (['cto', 'mario', 'chief engineer', 'staff engineer', 'em', 'engineer'].some(k => r.includes(k))) return 'engineering';
  if (['pm', 'cmo', 'cro'].some(k => r.includes(k))) return 'product';
  if (['clo', 'ciso'].some(k => r.includes(k))) return 'legal-security';
  if (['cfo'].some(k => r.includes(k))) return 'finance';
  if (['designer', 'ux researcher'].some(k => r.includes(k))) return 'design';
  if (['ceo', 'coordinator', 'greg'].some(k => r.includes(k))) return 'strategy';
  if (['cdo'].some(k => r.includes(k))) return 'data';
  if (['coo'].some(k => r.includes(k))) return 'operations';
  if (['chro'].some(k => r.includes(k))) return 'people';
  return 'general';
}

/**
 * Read a file or exit with an error.
 */
function readFile(filePath) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    process.exit(1);
  }
  return fs.readFileSync(abs, 'utf8');
}

/**
 * Write a file, or print a dry-run preview.
 */
function writeFile(filePath, content, dryRun) {
  if (dryRun) {
    console.log(`\nDRY RUN — no files modified`);
    console.log(`  File: ${filePath}`);
    console.log(`  Content:\n${content.slice(0, 500)}${content.length > 500 ? '\n  ... (truncated)' : ''}`);
    return;
  }
  const abs = path.resolve(filePath);
  fs.writeFileSync(abs, content, 'utf8');
}

/**
 * Find a section heading index in a lines array (case-insensitive, ignores # prefix).
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
 */
function getSectionLevel(line) {
  const match = line.match(/^(#+)\s/);
  return match ? match[1].length : 0;
}

/**
 * Find the end index of a section (exclusive).
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
 * Update a single metric value in the Metrics table of team.md.
 * Matches a row like: | Metric name | value |
 * and replaces the value cell.
 */
function updateTeamMetric(content, metricName, updater) {
  const escaped = metricName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(\\|\\s*${escaped}\\s*\\|\\s*)(\\d+)(\\s*\\|)`, 'i');
  return content.replace(re, (match, pre, num, post) => {
    const updated = updater(parseInt(num, 10));
    return `${pre}${updated}${post}`;
  });
}

module.exports = {
  parseOptions,
  inferDomain,
  readFile,
  writeFile,
  findSectionIndex,
  getSectionLevel,
  findSectionEnd,
  updateTeamMetric,
};
