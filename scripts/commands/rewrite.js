'use strict';

const { readFile, writeFile, findSectionIndex, findSectionEnd } = require('../lib/doc-utils');
const cmdAppend = require('./append');

module.exports = function cmdRewrite({ filePath, opts, dryRun }) {
  if (!opts.section || !opts.content) {
    console.error('Missing --section or --content option');
    process.exit(1);
  }
  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);

  if (startIdx === -1) {
    // Section doesn't exist; create it
    cmdAppend({ filePath, opts, dryRun });
    return;
  }

  const endIdx = findSectionEnd(lines, startIdx);
  const before = lines.slice(0, startIdx + 1); // include heading
  const after = lines.slice(endIdx);

  const newLines = [
    ...before,
    '',
    ...opts.content.split('\n'),
    '',
    ...after,
  ];
  writeFile(filePath, newLines.join('\n'), dryRun);
  console.log(`\u2713 Rewrote section "${opts.section}" in ${filePath}`);
};
