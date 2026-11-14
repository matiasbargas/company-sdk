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
 *   runner     — LocalRunner (Runner contract v1: start/stop/status/meter) + the landing PreToolUse hook
 *   proofs     — deterministic proof checks in a company repo (commit SHA + state) and revert detection
 *   cycle      — Betting-cycle close (reclaim, envelope top-up) and grant close/kill
 *   report     — ledger report: fully loaded VOF, suppression, judgment column, divergence, revisit trigger
 *   preflight  — the one run pre-flight + readiness, shared by the runner and sdk-holding
 *   health     — holdingHealth(holdingDir): read-only issues for scripts/health.js
 *   CLI        — bin/sdk-holding.js (main(argv, deps) exported for tests)
 */

const canonical = require('./canonical');
const ledger = require('./ledger');
const meter = require('./meter');
const portfolio = require('./portfolio');
const grants = require('./grants');
const runner = require('./runner');
const proofs = require('./proofs');
const cycle = require('./cycle');
const report = require('./report');
const preflight = require('./preflight');
const health = require('./health');
const fold = require('./fold');

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

  // runner
  createLocalRunner: runner.createLocalRunner,
  RunnerError: runner.RunnerError,
  RUNNER_CONTRACT_VERSION: runner.RUNNER_CONTRACT_VERSION,
  RUN_STATES: runner.STATES,
  TERMINAL_REASONS: runner.TERMINAL_REASONS,
  RUNNER_ENV_ALLOWLIST: runner.ENV_ALLOWLIST,

  // proofs
  verifyProof: proofs.verifyProof,
  findRevert: proofs.findRevert,
  recordProof: proofs.recordProof,
  scanReverts: proofs.scanReverts,
  ProofError: proofs.ProofError,

  // cycles
  planCycleClose: cycle.planCycleClose,
  closeCycle: cycle.closeCycle,
  endGrant: cycle.endGrant,

  // report
  buildReport: report.buildReport,
  formatReport: report.formatReport,
  VOF_WEIGHTS: report.WEIGHTS,

  // limits in the chain, pre-flight, health
  LIMIT_KEYS: fold.LIMIT_KEYS,
  validateLimits: fold.validateLimits,
  preflightRun: preflight.preflightRun,
  readiness: preflight.readiness,
  holdingHealth: health.holdingHealth,
};
