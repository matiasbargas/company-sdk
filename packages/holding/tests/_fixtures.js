'use strict';

// Event builders shared by ledger/grant/meter tests. Not a test file.

const path = require('path');
const { drawIdemKey } = require('../src/ledger');
const { tmpDir } = require('./_helpers');

const FIXED_NOW = () => '2026-11-14T00:00:00.000Z';

function ledgerFile() {
  return path.join(tmpDir(), 'fuel', 'ledger.jsonl');
}

function fund(amount, idem = `fund-${amount}`) {
  return { type: 'fund', actor: 'holding-owner', idem_key: idem, amount_fu: amount };
}

function grant(overrides = {}) {
  return {
    type: 'grant', actor: 'holding-owner', idem_key: `grant-${overrides.grant_id || 'g1'}`,
    grant_id: 'g1', company: 'acme', mission_id: 'm1', appetite_fu: 300,
    tranches: [
      { size_fu: 100, proof: { kind: 'verified_surface', ref: 'acme/SURFACE-1' } },
      { size_fu: 100, proof: { kind: 'graduated_cycle', ref: 'acme/cycle-1' } },
      { size_fu: 100, proof: { kind: 'owner_approved_ship', ref: 'acme/ship-1' } },
    ],
    kill_condition: 'no verified surface after 2 cycles',
    ...overrides,
  };
}

let drawCounter = 0;
function draw(fu, overrides = {}) {
  drawCounter++;
  const run_id = overrides.run_id || `run-${drawCounter}`;
  const session_id = overrides.session_id || `sess-${drawCounter}`;
  const result_uuid = overrides.result_uuid || `uuid-${drawCounter}`;
  return {
    type: 'draw', actor: 'runner', idem_key: drawIdemKey(run_id, session_id, result_uuid),
    grant_id: 'g1', mission_id: 'm1', company: 'acme', run_id, session_id, result_uuid, fu,
    raw: [{ model: 'claude-opus-5-5', in: fu, out: 0, cw: 0, cr: 0 }],
    model_usage: { 'claude-opus-5-5': { inputTokens: fu } },
    price_table_version: 'test-1',
    ...overrides,
  };
}

function proof(tranche, ref, sha = 'abc1234', kind = 'verified_surface', idem) {
  return {
    type: 'proof', actor: 'runner', idem_key: idem || `proof-${tranche}-${ref}-${sha}`,
    grant_id: 'g1', tranche, proof: { kind, ref, sha },
  };
}

function release(tranche) {
  return { type: 'release', actor: 'runner', idem_key: `release-g1-${tranche}`, grant_id: 'g1', tranche };
}

module.exports = { FIXED_NOW, ledgerFile, fund, grant, draw, proof, release };
