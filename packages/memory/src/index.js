'use strict';

/**
 * @team-sdk/memory — Cross-project decision corpus.
 *
 * Ingest decisions, kills, and challenges from project history.
 * Query across projects. Build compounding judgment.
 */

const { createMemoryStore, DEFAULT_STORE_DIR } = require('./store');
const { ingestProject, parseHistory, parseBusLog, projectName } = require('./ingest');
const { validateEntry, normalizeEntry, entryId, ENTRY_TYPES, KILL_CLASSES, CHALLENGE_OUTCOMES } = require('./schema');
const { queryEntries, filterEntries, getDecisions, getKills, getChallenges, corpusStats } = require('./query');

module.exports = {
  // Store
  createMemoryStore,
  DEFAULT_STORE_DIR,

  // Ingest
  ingestProject,
  parseHistory,
  parseBusLog,
  projectName,

  // Schema
  validateEntry,
  normalizeEntry,
  entryId,
  ENTRY_TYPES,
  KILL_CLASSES,
  CHALLENGE_OUTCOMES,

  // Query
  queryEntries,
  filterEntries,
  getDecisions,
  getKills,
  getChallenges,
  corpusStats,
};
