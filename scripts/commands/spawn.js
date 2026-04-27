'use strict';

const fs = require('fs');
const path = require('path');
const { writeFile, updateTeamMetric } = require('../lib/doc-utils');

/**
 * DS-01: spawn — add agent to Active Agents table + onboarding log, increment metrics.
 */
module.exports = function cmdSpawn({ filePath, opts, dryRun }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const teamFile = path.join(projectDir, 'team.md');

  const required = ['name', 'role', 'level', 'activated-by', 'profile', 'how', 'fun-fact'];
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

  // --- 1. Append row to Active Agents table ---
  const agentRow = `| ${opts['name']} | ${opts['role']} | ${opts['level']} | ${opts['profile']} | ${opts['how']} | ${opts['fun-fact']} | ${opts['activated-by']} | ${now} |`;

  const emptyRowPattern = /(\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|[ \t]*\|\s*\n)(---)/;
  if (emptyRowPattern.test(content)) {
    content = content.replace(emptyRowPattern, `${agentRow}\n\n---`);
  } else {
    const activeSection = /## Active Agents[\s\S]*?(?=\n---\n)/;
    content = content.replace(activeSection, (section) => {
      return section.trimEnd() + '\n' + agentRow;
    });
  }

  // --- 2. Increment metrics ---
  content = updateTeamMetric(content, 'Current active agents', n => n + 1);
  content = updateTeamMetric(content, 'Total agents ever activated', n => n + 1);

  // --- 3. Append onboarding log entry ---
  const onboardingEntry = `
### ${now} \u2014 ${opts['name']} (${opts['role']}, ${opts['level']})
- **Activated by:** ${opts['activated-by']}
- **Cultural profile:** ${opts['profile']}
- **How they work:** ${opts['how']}
- **Fun fact:** ${opts['fun-fact']}
`;

  const onboardingHeadingIdx = content.indexOf('## Onboarding log');
  if (onboardingHeadingIdx === -1) {
    content = content.trimEnd() + '\n\n## Onboarding log\n' + onboardingEntry + '\n';
  } else {
    content = content.trimEnd() + '\n' + onboardingEntry;
  }

  writeFile(teamFile, content, dryRun);
  console.log(`Agent ${opts['name']} (${opts['role']}) added to team.md`);
};
