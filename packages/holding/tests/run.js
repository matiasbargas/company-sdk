'use strict';

const { readdirSync } = require('fs');
const { join } = require('path');

const testDir = __dirname;
const testFiles = readdirSync(testDir).filter(f => f.startsWith('test-') && f.endsWith('.js'));

let totalPassed = 0;
let totalFailed = 0;
let totalSuites = 0;

// A suite exports { passed, failed }, or a promise of it (async suites such as test-runner.js).
(async () => {
  for (const file of testFiles) {
    totalSuites++;
    try {
      const { passed, failed } = await require(join(testDir, file));
      totalPassed += passed;
      totalFailed += failed;
    } catch (err) {
      console.error(`\n  CRASH in ${file}:`, err.stack || err.message);
      totalFailed++;
    }
  }

  console.log(`\n${'═'.repeat(60)}`);
  console.log(`  @team-sdk/holding — ${totalSuites} suites, ${totalPassed} passed, ${totalFailed} failed`);
  console.log(`${'═'.repeat(60)}`);

  process.exit(totalFailed > 0 ? 1 : 0);
})();
