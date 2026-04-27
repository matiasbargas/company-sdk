'use strict';

const fs = require('fs');
const path = require('path');

/**
 * cmdHistory — Query structured decisions from history.md.
 */
module.exports = function cmdHistory({ args, filePath }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const historyPath = path.join(projectDir, 'history.md');

  if (!fs.existsSync(historyPath)) {
    console.error('history.md not found.');
    process.exit(1);
  }

  const content = fs.readFileSync(historyPath, 'utf8');

  // Parse YAML-structured decision entries (HTML comments with structured data)
  const decisionPattern = /### Decision:\s*(.+)\n\n<!--\n([\s\S]*?)-->/g;
  const decisions = [];
  let match;

  while ((match = decisionPattern.exec(content)) !== null) {
    const title = match[1].trim();
    const yamlBlock = match[2];

    const entry = { title };
    for (const line of yamlBlock.split('\n')) {
      const kvMatch = line.match(/^(\w+):\s*"?([^"]*)"?\s*$/);
      if (kvMatch) {
        entry[kvMatch[1]] = kvMatch[2].trim();
      }
    }
    decisions.push(entry);
  }

  // Also parse old-format entries (table format without YAML)
  const oldPattern = /### Decision:\s*(.+)\n\n\| Field[\s\S]*?\| Date \| (.+?) \|[\s\S]*?\| Made by \| (.+?) \|/g;
  while ((match = oldPattern.exec(content)) !== null) {
    const title = match[1].trim();
    if (!decisions.some(d => d.title === title)) {
      decisions.push({
        title,
        date: match[2].trim(),
        made_by: match[3].trim(),
        domain: 'unknown',
        reversible: 'unknown',
      });
    }
  }

  if (decisions.length === 0) {
    console.log('No structured decisions found in history.md.');
    console.log('Decisions logged with sdk-doc decision include structured metadata.');
    return;
  }

  // Apply filters
  const filterOpts = {};
  for (let i = 2; i < args.length; i++) {
    if (args[i].startsWith('--') && args[i + 1]) {
      filterOpts[args[i].slice(2)] = args[++i];
    }
  }

  let filtered = decisions;

  if (filterOpts.domain) {
    filtered = filtered.filter(d => (d.domain || '').toLowerCase().includes(filterOpts.domain.toLowerCase()));
  }

  if (filterOpts.since) {
    const since = filterOpts.since.replace('Q', '-Q');
    filtered = filtered.filter(d => (d.date || '') >= since.slice(0, 10));
  }

  if (filterOpts.search) {
    const term = filterOpts.search.toLowerCase();
    filtered = filtered.filter(d =>
      (d.title || '').toLowerCase().includes(term) ||
      (d.decision || '').toLowerCase().includes(term) ||
      (d.domain || '').toLowerCase().includes(term)
    );
  }

  if (filterOpts.reversible) {
    filtered = filtered.filter(d => String(d.reversible) === filterOpts.reversible);
  }

  // Output
  console.log(`\nDecisions (${filtered.length}/${decisions.length}):\n`);
  for (const d of filtered) {
    const rev = d.reversible === 'false' ? ' [IRREVERSIBLE]' : '';
    console.log(`  ${d.date || '?'}  ${(d.domain || '?').padEnd(16)}  ${d.title}${rev}`);
    if (d.made_by) console.log(`  ${' '.repeat(10)}${' '.repeat(16)}  by ${d.made_by}`);
  }
  console.log('');
};
