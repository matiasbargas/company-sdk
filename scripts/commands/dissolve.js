'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile, updateTeamMetric } = require('../lib/doc-utils');

/**
 * DS-02: dissolve — move agent from Active Agents to Dissolved Agents, decrement current count.
 */
module.exports = function cmdDissolve({ filePath, opts, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const teamFile = path.join(projectDir, 'team.md');

  const required = ['name', 'dissolved-by', 'reason'];
  const missing = required.filter(k => !opts[k]);
  if (missing.length) {
    console.error(`Missing required options: ${missing.map(k => '--' + k).join(', ')}`);
    process.exit(1);
  }

  if (!fs.existsSync(teamFile)) {
    console.error(`team.md not found in: ${projectDir}`);
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  let content = fs.readFileSync(teamFile, 'utf8');

  // --- 1. Find the agent row in Active Agents table ---
  const escapedName = opts['name'].replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const activeRowRe = new RegExp(`^(\\|\\s*${escapedName}\\s*\\|)(.*)(\\|\\s*\\n?)`, 'm');
  const match = activeRowRe.exec(content);

  if (!match) {
    console.error(`Agent "${opts['name']}" not found in Active Agents table.`);
    process.exit(1);
  }

  // Extract role and level from the matched row (columns 2 and 3)
  const rowCells = match[0].split('|').map(c => c.trim()).filter(Boolean);
  const role = rowCells[1] || '\u2014';
  const level = rowCells[2] || '\u2014';

  // Remove the row from the Active Agents section
  content = content.replace(activeRowRe, '');

  // --- 2. Append row to Dissolved Agents table ---
  const dissolvedRow = `| ${opts['name']} | ${role} | ${level} | ${opts['dissolved-by']} | ${now} | ${opts['reason']} |`;

  const dissolvedEmptyRow = /(\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|\s*\n)(---|\*)/;
  if (dissolvedEmptyRow.test(content)) {
    content = content.replace(dissolvedEmptyRow, (m, emptyRow, after) => {
      return `${dissolvedRow}\n\n${after}`;
    });
  } else {
    const dissolvedSection = /## Dissolved Agents[\s\S]*?(?=\n---\n|\n\*)/;
    content = content.replace(dissolvedSection, (section) => {
      return section.trimEnd() + '\n' + dissolvedRow;
    });
  }

  // --- 3. Decrement current active agents metric ---
  content = updateTeamMetric(content, 'Current active agents', n => Math.max(0, n - 1));

  // Clean up any double blank lines left by row removal
  content = content.replace(/\n{3,}/g, '\n\n');

  writeFile(teamFile, content, dryRun);
  console.log(`Agent ${opts['name']} dissolved and logged to Dissolved Agents table`);
};
