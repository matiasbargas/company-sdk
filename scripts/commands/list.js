'use strict';

const { readFile, getSectionLevel } = require('../lib/doc-utils');

module.exports = function cmdList({ filePath }) {
  const content = readFile(filePath);
  const lines = content.split('\n');
  console.log(`\nHeadings in ${filePath}:\n`);
  for (const line of lines) {
    if (/^#+\s/.test(line)) {
      const level = getSectionLevel(line);
      const indent = '  '.repeat(level - 1);
      console.log(`${indent}${line.trim()}`);
    }
  }
  console.log();
};
