'use strict';

const path = require('path');
const { writeFile } = require('../lib/doc-utils');

/**
 * cmdManifest — Generate context-manifest.json from current-status.md in <project-dir>.
 */
module.exports = function cmdManifest({ filePath, dryRun }) {
  const { generateManifest } = require('../../packages/context/src');
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  const manifestFile = path.join(projectDir, 'context-manifest.json');

  const manifest = generateManifest(projectDir);
  writeFile(manifestFile, JSON.stringify(manifest, null, 2) + '\n', dryRun);

  if (manifest._warning) {
    console.log(`Warning: ${manifest._warning}`);
  } else {
    console.log(`\u2713 context-manifest.json written (v${manifest.manifestVersion}, schema ${manifest.schemaVersion})`);
  }
  console.log(manifestFile);
};
