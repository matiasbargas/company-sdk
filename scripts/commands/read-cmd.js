'use strict';

const { readFile, findSectionIndex, findSectionEnd } = require('../lib/doc-utils');

module.exports = function cmdRead({ filePath, opts }) {
  if (!opts.section) {
    console.error('Missing --section option');
    process.exit(1);
  }
  const content = readFile(filePath);
  const lines = content.split('\n');
  const startIdx = findSectionIndex(lines, opts.section);
  if (startIdx === -1) {
    console.error(`Section not found: "${opts.section}"`);
    process.exit(1);
  }
  const endIdx = findSectionEnd(lines, startIdx);
  const section = lines.slice(startIdx, endIdx).join('\n');
  console.log(`\n${section}\n`);
};
