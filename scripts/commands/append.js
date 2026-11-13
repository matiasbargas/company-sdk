'use strict';

const { readFile, writeFile, findSectionIndex, findSectionEnd, scaffoldSectionPath } = require('../lib/doc-utils');

module.exports = function cmdAppend({ filePath, opts, dryRun }) {
  if (!opts.section || !opts.content) {
    console.error('Missing --section or --content option');
    process.exit(1);
  }
  const content = readFile(filePath);
  let lines = content.split('\n');
  let startIdx = findSectionIndex(lines, opts.section);

  // "## Domain (ROLE) > Pending" that does not exist yet: scaffold it in place
  // instead of appending a literal heading at the end of the file.
  if (startIdx === -1) {
    const scaffolded = scaffoldSectionPath(lines, opts.section);
    if (scaffolded) {
      lines = scaffolded;
      startIdx = findSectionIndex(lines, opts.section);
    }
  }

  if (startIdx === -1) {
    // Section doesn't exist; append to end
    const newContent = content.trimEnd() + `\n\n${opts.section}\n\n${opts.content}\n`;
    writeFile(filePath, newContent, dryRun);
    console.log(`\u2713 Created section "${opts.section}" and appended content.`);
    return;
  }

  const endIdx = findSectionEnd(lines, startIdx);
  const before = lines.slice(0, endIdx);
  const after = lines.slice(endIdx);

  // Remove trailing empty lines from before and add content
  while (before.length > 0 && before[before.length - 1].trim() === '') {
    before.pop();
  }

  before.push('');
  before.push(...opts.content.split('\n'));

  const newLines = [...before, '', ...after];
  writeFile(filePath, newLines.join('\n'), dryRun);
  console.log(`\u2713 Appended to section "${opts.section}" in ${filePath}`);
};
