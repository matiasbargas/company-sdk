'use strict';

const { readFile, writeFile } = require('../lib/doc-utils');

module.exports = function cmdPodUpdate({ filePath, opts, dryRun }) {
  if (!opts.mission || !opts.status || !opts.next) {
    console.error('Missing required options: --mission, --status, --next');
    process.exit(1);
  }

  const content = readFile(filePath);
  const now = new Date().toISOString().split('T')[0] + ' ' + new Date().toTimeString().slice(0, 5);

  // Update "Last updated" line
  let updated = content.replace(
    /\*\*Last updated:\*\* .+/,
    `**Last updated:** ${now}`
  );

  // Try to find and update the mission row in the Active Missions table
  const missionRegex = new RegExp(`(\\|[^|]*${opts.mission}[^|]*\\|[^|]*\\|[^|]*\\|)[^|]*(\\|)[^|]*(\\|)`, 'i');
  if (missionRegex.test(updated)) {
    updated = updated.replace(missionRegex, (match, p1, p2, p3) => {
      return `${p1} ${opts.status} ${p2} ${opts.next} ${p3}`;
    });
    console.log(`\u2713 Updated mission "${opts.mission}" in ${filePath}`);
  } else {
    // Append to Active Missions section
    updated = updated.replace(
      /(\| \[Mission name\][^\n]*\n)/,
      `$1| ${opts.mission} | \u2014 | \u2014 | ${opts.status} | ${opts.next} |\n`
    );
    console.log(`\u2713 Added mission "${opts.mission}" to ${filePath}`);
  }

  writeFile(filePath, updated, dryRun);
};
