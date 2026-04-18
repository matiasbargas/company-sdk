'use strict';

/**
 * Test runner for @team-sdk/memory.
 */

const { readdirSync } = require('fs');
const { join } = require('path');

const testDir = __dirname;
const testFiles = readdirSync(testDir).filter(f => f.startsWith('test-') && f.endsWith('.js'));

let totalPassed = 0;
let totalFailed = 0;
let totalSuites = 0;

for (const file of testFiles) {
  totalSuites++;
  try {
    const { passed, failed } = require(join(testDir, file));
    totalPassed += passed;
    totalFailed += failed;
  } catch (err) {
    console.error(`\n  CRASH in ${file}:`, err.message);
    totalFailed++;
  }
}

console.log(`\n${'═'.repeat(60)}`);
console.log(`  @team-sdk/memory — ${totalSuites} suites, ${totalPassed} passed, ${totalFailed} failed`);
console.log(`${'═'.repeat(60)}`);

if (totalFailed > 0) {
  process.exit(1);
}
