'use strict';

const { readFile, writeFile } = require('../lib/doc-utils');

module.exports = function cmdLog({ filePath, opts, dryRun }) {
  if (!opts.role || !opts.level || !opts.goal) {
    console.error('Missing required options: --role, --level, --goal');
    process.exit(1);
  }

  const now = new Date().toISOString().split('T')[0];
  const status = opts.status || 'active';
  const outcome = opts.outcome || '\u2014';
  const reqs = opts.reqs || 'None';

  const entry = `
## ${now} ${opts.role} ${opts.level}
Goal/Change: ${opts.goal}
Expected outcome: ${outcome}
Requirements discovered: ${reqs}
Status: ${status.toUpperCase()}
`.trimStart();

  const content = readFile(filePath);
  const newContent = content.trimEnd() + '\n\n---\n\n' + entry;
  writeFile(filePath, newContent, dryRun);
  console.log(`\u2713 Area log entry written to ${filePath}`);
};
