'use strict';

/**
 * query.js — Query API for the context index.
 *
 * Filter catalog entries by domain, owner, load trigger, or custom predicate.
 */

const { checkSchemaVersion, SUPPORTED_INDEX_VERSIONS } = require('./schema');

/**
 * Load and validate a context-index.json file.
 * @param {string} filePath - Absolute path to context-index.json
 * @returns {object} Parsed index object
 * @throws {Error} If file is missing, corrupt, or has unsupported schema version
 */
function loadContextIndex(filePath) {
  const fs = require('fs');
  if (!fs.existsSync(filePath)) {
    throw new Error(`Context index not found: ${filePath}`);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Corrupt context index: ${err.message}`);
  }

  const versionCheck = checkSchemaVersion(data.schemaVersion, SUPPORTED_INDEX_VERSIONS);
  if (!versionCheck.valid) {
    throw new Error(versionCheck.error);
  }
  if (versionCheck.deprecated) {
    data._deprecated = `schemaVersion ${data.schemaVersion} is deprecated. Latest: ${SUPPORTED_INDEX_VERSIONS[SUPPORTED_INDEX_VERSIONS.length - 1]}`;
  }

  return data;
}

/**
 * Load and validate a context-manifest.json file.
 * @param {string} filePath - Absolute path to context-manifest.json
 * @returns {object} Parsed manifest object
 * @throws {Error} If file is missing, corrupt, or has unsupported schema version
 */
function loadContextManifest(filePath) {
  const fs = require('fs');
  const { checkSchemaVersion: check, SUPPORTED_MANIFEST_VERSIONS } = require('./schema');

  if (!fs.existsSync(filePath)) {
    throw new Error(`Context manifest not found: ${filePath}`);
  }
  let data;
  try {
    data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (err) {
    throw new Error(`Corrupt context manifest: ${err.message}`);
  }

  const versionCheck = check(data.schemaVersion, SUPPORTED_MANIFEST_VERSIONS);
  if (!versionCheck.valid) {
    throw new Error(versionCheck.error);
  }

  return data;
}

/**
 * Query a context index for files matching filters.
 *
 * @param {object} index - A loaded context-index object
 * @param {object} [filters]
 * @param {string} [filters.domain] - Filter by domain name
 * @param {string} [filters.owner] - Filter by owner role
 * @param {string} [filters.loadWhen] - Filter by load trigger
 * @param {function} [filters.predicate] - Custom filter function (entry) => boolean
 * @returns {object[]} Matching file entries
 */
function queryContext(index, filters = {}) {
  if (!index || !index.files) return [];

  let results = index.files;

  if (filters.domain) {
    const d = filters.domain.toLowerCase();
    results = results.filter(f => f.domain && f.domain.toLowerCase() === d);
  }

  if (filters.owner) {
    const o = filters.owner.toLowerCase();
    results = results.filter(f => f.owner && f.owner.toLowerCase() === o);
  }

  if (filters.loadWhen) {
    const trigger = filters.loadWhen.toLowerCase();
    results = results.filter(f => f.load_when && f.load_when.some(lw => lw.toLowerCase() === trigger));
  }

  if (typeof filters.predicate === 'function') {
    results = results.filter(filters.predicate);
  }

  return results;
}

module.exports = { loadContextIndex, loadContextManifest, queryContext };
