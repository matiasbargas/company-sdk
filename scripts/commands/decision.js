'use strict';

const { readFile, writeFile, findSectionIndex, findSectionEnd, inferDomain } = require('../lib/doc-utils');

module.exports = function cmdDecision({ filePath, opts, dryRun }) {
  if (!opts.decision || !opts.context || !opts['made-by']) {
    console.error('Missing required options: --decision, --context, --made-by');
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  const release = opts.release || 'current';
  const rationale = opts.rationale || '\u2014';
  const reversible = opts.reversible || 'unknown';
  const domain = opts.domain || inferDomain(opts['made-by']);
  const affects = opts.affects || '\u2014';

  // YAML frontmatter structured entry (protocol v4.3)
  const entry = `
### Decision: ${opts.decision}

<!--
decision: "${opts.decision.replace(/"/g, '\\"')}"
date: "${now}"
release: "${release}"
made_by: "${opts['made-by']}"
domain: "${domain}"
reversible: ${reversible}
affects: "${affects}"
-->

| Field | Value |
|-------|-------|
| Date | ${now} |
| Release | ${release} |
| Made by | ${opts['made-by']} |
| Domain | ${domain} |
| Context | ${opts.context} |
| Decision | ${opts.decision} |
| Rationale | ${rationale} |
| Reversible | ${reversible} |
| Affects | ${affects} |
`.trimStart();

  const content = readFile(filePath);
  const lines = content.split('\n');

  // Try to find "## Decision History" or similar
  const sectionNames = ['decision history', 'decisions', '## decisions', '## decision history'];
  let sectionIdx = -1;
  for (const name of sectionNames) {
    sectionIdx = findSectionIndex(lines, name);
    if (sectionIdx !== -1) break;
  }

  if (sectionIdx === -1) {
    // Append to end
    const newContent = content.trimEnd() + `\n\n## Decision History\n\n${entry}\n`;
    writeFile(filePath, newContent, dryRun);
  } else {
    const endIdx = findSectionEnd(lines, sectionIdx);
    const before = lines.slice(0, endIdx);
    const after = lines.slice(endIdx);

    while (before.length > 0 && before[before.length - 1].trim() === '') {
      before.pop();
    }

    const newLines = [...before, '', ...entry.split('\n'), '', ...after];
    writeFile(filePath, newLines.join('\n'), dryRun);
  }

  console.log(`\u2713 Decision logged to ${filePath}`);

  // Conflict detection: check existing decisions in same domain for keyword overlap
  const existingDecisions = [];
  const decisionPattern = /<!--\n([\s\S]*?)-->/g;
  let cdMatch;
  while ((cdMatch = decisionPattern.exec(content)) !== null) {
    const block = cdMatch[1];
    const d = {};
    for (const line of block.split('\n')) {
      const kvMatch = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (kvMatch) d[kvMatch[1]] = kvMatch[2].trim();
    }
    if (d.decision) existingDecisions.push(d);
  }

  const sameDomain = existingDecisions.filter(d => d.domain === domain && d.decision !== opts.decision);
  if (sameDomain.length > 0) {
    // Extract keywords from new decision
    const newWords = new Set(opts.decision.toLowerCase().split(/\s+/).filter(w => w.length >= 4));
    const conflicts = [];

    for (const existing of sameDomain) {
      const existingWords = new Set((existing.decision || '').toLowerCase().split(/\s+/).filter(w => w.length >= 4));
      const overlap = [...newWords].filter(w => existingWords.has(w));

      if (overlap.length >= 2) {
        conflicts.push({ decision: existing.decision, date: existing.date, overlap });
      }
    }

    if (conflicts.length > 0) {
      console.log('');
      console.log('  \u26a0  Potential conflicts with existing decisions:');
      for (const c of conflicts) {
        console.log(`     ${c.date || '?'}  "${c.decision}"`);
        console.log(`     Overlapping terms: ${c.overlap.join(', ')}`);
      }
      console.log('  Review these decisions to ensure consistency.');
    }
  }
};
