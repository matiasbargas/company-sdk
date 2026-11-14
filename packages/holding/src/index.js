'use strict';

/**
 * @team-sdk/holding — Portfolio Orchestrator core.
 *
 * Spec (implementation-independent, binding): project/context/spec/portfolio-orchestrator/
 * variables.yaml + claims.yaml. Rewrite this freely; keep the `@covers` tests in tests/ green.
 *
 *   canonical  — RFC 8785-style canonical JSON + sha256 (the hash-chain byte format)
 *   ledger     — append-only, hash-chained, idempotent fuel ledger with a single-writer lock
 *   fold       — the reducer behind ledger validation and replay (pool / grant / tranche balances)
 *   meter      — Claude Code stream-json result.modelUsage → UsageEvent → draw / overrun / unmetered
 *   portfolio  — portfolio.json (schema 1) registry validator
 *   grants     — grant shape and proof matching
 */

const canonical = require('./canonical');
const ledger = require('./ledger');
const meter = require('./meter');
const portfolio = require('./portfolio');
const grants = require('./grants');

module.exports = {
  // canonical JSON
  canonicalize: canonical.canonicalize,
  sha256Hex: canonical.sha256Hex,
  hashCanonical: canonical.hashCanonical,

  // ledger
  openLedger: ledger.openLedger,
  verifyLines: ledger.verifyLines,
  drawIdemKey: ledger.drawIdemKey,
  overrunIdemKey: ledger.overrunIdemKey,
  LedgerError: ledger.LedgerError,
  EVENT_TYPES: ledger.EVENT_TYPES,
  ACTORS_BY_TYPE: ledger.ACTORS_BY_TYPE,
  GENESIS_SHA256: ledger.GENESIS_SHA256,
  LEDGER_SCHEMA_VERSION: ledger.SCHEMA_VERSION,

  // meter
  meterStream: meter.meterStream,
  priceFu: meter.priceFu,
  toLedgerEvents: meter.toLedgerEvents,
  METER_CONTRACT_VERSION: meter.METER_CONTRACT_VERSION,

  // portfolio registry
  validatePortfolio: portfolio.validatePortfolio,
  loadPortfolio: portfolio.loadPortfolio,
  SECOND_OWNER_GATES: portfolio.SECOND_OWNER_GATES,

  // grants
  validateGrant: grants.validateGrant,
  qualifiedSurfaceId: grants.qualifiedSurfaceId,
  PROOF_KINDS: grants.PROOF_KINDS,
};
