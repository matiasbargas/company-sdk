'use strict';
// Child process for the concurrent-writer test: appends `count` fund events to one ledger.
const { openLedger } = require('../../src/ledger');
const [file, tag, count] = process.argv.slice(2);
const L = openLedger(file, { limits: { envelopePerCycle: 1000 }, lockTimeoutMs: 20000 });
for (let i = 0; i < Number(count); i++) {
  L.append({ type: 'fund', actor: 'holding-owner', idem_key: `${tag}-${i}`, amount_fu: 1 });
}
