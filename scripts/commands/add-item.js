'use strict';

const { readFile, writeFile, findSectionIndex, findSectionEnd } = require('../lib/doc-utils');

module.exports = function cmdAddItem({ filePath, opts, dryRun }) {
  if (!opts.section || !opts.item) {
    console.error('Missing --section or --item option');
    process.exit(1);
  }

  const status = opts.status || 'pending';
  let prefix;
  if (status === 'done') prefix = '- [x]';
  else if (status === 'blocked') prefix = '- [!]';
  else prefix = '- [ ]';

  const item = `${prefix} ${opts.item}`;

  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);

  if (startIdx === -1) {
    const newContent = content.trimEnd() + `\n\n### ${opts.section}\n\n${item}\n`;
    writeFile(filePath, newContent, dryRun);
    console.log(`\u2713 Created section "${opts.section}" and added item.`);
    return;
  }

  const endIdx = findSectionEnd(lines, startIdx);
  const before = lines.slice(0, endIdx);
  const after = lines.slice(endIdx);

  while (before.length > 0 && before[before.length - 1].trim() === '') {
    before.pop();
  }

  before.push(item);

  const newLines = [...before, '', ...after];
  writeFile(filePath, newLines.join('\n'), dryRun);
  console.log(`\u2713 Added item to section "${opts.section}" in ${filePath}`);
};
