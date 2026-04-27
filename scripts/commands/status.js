'use strict';

const fs = require('fs');
const path = require('path');
const { printNextStub } = require('../lib/next-stub');

module.exports = function cmdStatus({ filePath }) {
  // filePath is the project dir when command is 'status'
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const statusFile = path.join(projectDir, 'current-status.md');

  if (!fs.existsSync(statusFile)) {
    console.error(`current-status.md not found in: ${projectDir}`);
    console.error('Run sdk-bootstrap first or check the project directory.');
    process.exit(1);
  }

  const content = fs.readFileSync(statusFile, 'utf8');
  console.log('\n' + content);
  printNextStub(projectDir);
};
