'use strict';
const fs = require('fs');

/**
 * Parse history.md for a release entry and return GitHub-flavored release notes.
 *
 * @param {string} historyPath  - absolute path to history.md
 * @param {string} releaseId    - release ID to find, e.g. "v2026.Q2.1"
 * @returns {string}            - GitHub-flavored markdown string
 */
function parseHistoryForRelease(historyPath, releaseId) {
  if (!fs.existsSync(historyPath)) {
    return _fallback(releaseId, 'history.md not found');
  }

  let content;
  try {
    content = fs.readFileSync(historyPath, 'utf8');
  } catch (e) {
    return _fallback(releaseId, `could not read history.md: ${e.message}`);
  }

  // Find the section for this release (## [vYYYY.QQ.N] or ## vYYYY.QQ.N)
  // Capture everything up to the next ## heading or end of file
  const escaped = releaseId.replace(/\./g, '\\.').replace(/\[/g, '\\[').replace(/\]/g, '\\]');
  const sectionRe = new RegExp(
    `##\\s+\\[?${escaped}\\]?[^\\n]*([\\s\\S]*?)(?=\\n##\\s|$)`,
    'i'
  );

  const match = content.match(sectionRe);
  if (!match) {
    return _fallback(releaseId, 'no entry found');
  }

  const body = match[1].trim();
  if (!body) {
    return _fallback(releaseId, 'entry is empty');
  }

  // Extract decisions — lines matching "- **Decision:**" or "| # | Decision |" table rows
  const decisions = [];
  const decisionLines = body.match(/\|\s*\d+\s*\|([^|]+)\|[^|]*\|\s*(APPROVED|CONFIRMED|DECIDED|REJECTED)[^|]*/gi) || [];
  for (const line of decisionLines) {
    const parts = line.split('|').map(s => s.trim()).filter(Boolean);
    if (parts.length >= 2) decisions.push(`- ${parts[1]}: ${parts[2] || ''}`);
  }

  // Also pick up "**Decision:**" prose entries
  const proseDecs = body.match(/\*\*Decision:\*\*[^\n]+/g) || [];
  for (const d of proseDecs) {
    decisions.push(`- ${d.replace(/\*\*/g, '').replace(/^Decision:\s*/, '')}`);
  }

  // Extract "what shipped" from lines with "COMPLETED", "shipped", "Done"
  const shipped = [];
  const shippedLines = body.match(/-\s+.*(COMPLETED|shipped|Done|delivered).*/gi) || [];
  for (const line of shippedLines) {
    shipped.push(line.trim());
  }

  // Build output
  const parts = [`## ${releaseId}\n`];

  if (shipped.length > 0) {
    parts.push('### What shipped\n');
    parts.push(shipped.join('\n'));
    parts.push('');
  }

  if (decisions.length > 0) {
    parts.push('### Decisions made\n');
    parts.push(decisions.join('\n'));
    parts.push('');
  }

  // Include remaining body for context
  parts.push('### Full log\n');
  parts.push(body);

  return parts.join('\n');
}

function _fallback(releaseId, reason) {
  process.stderr.write(`release-notes: ${reason} for ${releaseId}\n`);
  return (
    `## ${releaseId}\n\n` +
    `No history.md entry found for ${releaseId}.\n` +
    `Add one before release: \`sdk-doc decision history.md --decision "..." --context "..." --made-by Coordinator\`\n`
  );
}

module.exports = { parseHistoryForRelease };
