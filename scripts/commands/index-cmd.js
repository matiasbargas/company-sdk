'use strict';

const path = require('path');
const { writeFile } = require('../lib/doc-utils');

/**
 * cmdIndex — Generate context-index.json — file map, domain routing, query map.
 */
module.exports = function cmdIndex({ filePath, dryRun }) {
  const { generateIndex } = require('../../packages/context/src');
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const indexFile  = path.join(projectDir, 'context-index.json');

  const index = generateIndex(projectDir);
  writeFile(indexFile, JSON.stringify(index, null, 2) + '\n', dryRun);
  console.log(`\u2713 context-index.json written (v${index.indexVersion}, ${index.files.length} files indexed)`);
  console.log(indexFile);
};
