#!/usr/bin/env node
'use strict';

// sdk-holding — the holding Owner's command line. The implementation is src/cli/ (see src/cli/index.js).
const { main, USAGE } = require('../src/cli');

module.exports = { main, USAGE };

if (require.main === module) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
