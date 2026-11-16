'use strict';

/**
 * @team-sdk/memory — Per-company decision corpus (derived index).
 *
 * Ingest decisions, kills, and challenges from a company's history and Bus.
 * Default store: <projectDir>/.team-sdk/memory. The machine-global store is opt-in only
 * (cross-company leak risk); cross-company memory goes through the commons. See ./README.md.
 */

const {
  createMemoryStore, resolveStoreLocation, companyStoreDir, globalStoreDir,
  COMPANY_STORE_SUBDIR, GLOBAL_OPT_IN_ENV,
} = require('./store');
const { ingestProject, parseHistory, parseBusLog, projectName } = require('./ingest');
const {
  validateEntry, normalizeEntry, entryId, legacyEntryId, parseAuthor, resolveChallengeOutcome,
  upgradeLegacyEntry, SCHEMA_VERSION, ENTRY_TYPES, KILL_CLASSES, CHALLENGE_OUTCOMES,
  AUTHOR_KINDS, CONFIDENCE_LEVELS,
} = require('./schema');
const { queryEntries, filterEntries, getDecisions, getKills, getChallenges, corpusStats } = require('./query');

module.exports = {
  // Store
  createMemoryStore,
  resolveStoreLocation,
  companyStoreDir,
  globalStoreDir,
  COMPANY_STORE_SUBDIR,
  GLOBAL_OPT_IN_ENV,

  // Ingest
  ingestProject,
  parseHistory,
  parseBusLog,
  projectName,

  // Schema
  validateEntry,
  normalizeEntry,
  entryId,
  legacyEntryId,
  parseAuthor,
  resolveChallengeOutcome,
  upgradeLegacyEntry,
  SCHEMA_VERSION,
  ENTRY_TYPES,
  KILL_CLASSES,
  CHALLENGE_OUTCOMES,
  AUTHOR_KINDS,
  CONFIDENCE_LEVELS,

  // Query
  queryEntries,
  filterEntries,
  getDecisions,
  getKills,
  getChallenges,
  corpusStats,
};
