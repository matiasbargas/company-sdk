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
 * Find a section heading index in a lines array (case-insensitive).
 *
 * - "Pending"            → first heading with that text, any level (legacy behaviour)
 * - "## Pending"         → only an H2 named Pending. A "### Pending" no longer
 *                          satisfies it — that silently returned another role's section.
 * - "## Finance (CFO) > Pending"
 *                        → "Pending" searched only inside "## Finance (CFO)".
 */
function findSectionIndex(lines, heading) {
  const parts = String(heading).split(/\s+>\s+/);
  let from = 0;
  let to = lines.length;
  let idx = -1;
  for (const part of parts) {
    idx = findHeadingInRange(lines, part, from, to);
    if (idx === -1) return -1;
    from = idx + 1;
    to = findSectionEnd(lines, idx);
  }
  return idx;
}

function findHeadingInRange(lines, heading, from, to) {
  const hashes = heading.trim().match(/^(#+)\s/);
  const wantLevel = hashes ? hashes[1].length : 0;
  const wantText = heading.toLowerCase().replace(/^#+\s*/, '').trim();
  for (let i = from; i < to; i++) {
    const level = getSectionLevel(lines[i]);
    if (level === 0) continue;
    if (wantLevel && level !== wantLevel) continue;
    if (lines[i].toLowerCase().replace(/^#+\s*/, '').trim() === wantText) return i;
  }
  return -1;
}

/**
 * For a missing "## Parent > Child" path: ensure the parent exists (scaffolded with the
 * standard Pending / In Progress / Done / Blocked children) and return the updated lines.
 * Returns null when the heading is not a path, so callers keep their legacy behaviour.
 */
const STATUS_HEADINGS = ['Pending', 'In Progress', 'Done', 'Blocked'];

function scaffoldSectionPath(lines, heading) {
  const parts = String(heading).split(/\s+>\s+/);
  if (parts.length !== 2) return null;
  const [parent, child] = parts;
  const parentLevel = (parent.trim().match(/^(#+)\s/) || [, '##'])[1].length;
  const parentLine = '#'.repeat(parentLevel) + ' ' + parent.replace(/^#+\s*/, '').trim();
  const childText = child.replace(/^#+\s*/, '').trim();
  const childLine = '#'.repeat(parentLevel + 1) + ' ';

  const out = lines.slice();
  let pIdx = findHeadingInRange(out, parentLine, 0, out.length);
  if (pIdx === -1) {
    while (out.length && out[out.length - 1].trim() === '') out.pop();
    const children = STATUS_HEADINGS.some(h => h.toLowerCase() === childText.toLowerCase())
      ? STATUS_HEADINGS : [childText];
    out.push('', parentLine, '');
    for (const h of children) out.push(childLine + h, '');
    return out;
  }
  // Parent exists, child missing: add the child at the end of the parent.
  const end = findSectionEnd(out, pIdx);
  out.splice(end, 0, childLine + childText, '');
  return out;
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
  scaffoldSectionPath,
  getSectionLevel,
  findSectionEnd,
  updateTeamMetric,
};
