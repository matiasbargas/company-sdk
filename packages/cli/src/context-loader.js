'use strict';

/**
 * context-loader.js — Load project context for consultation.
 *
 * Optional projectDir — consultation works with or without a project.
 */

const path = require('path');
const fs = require('fs');
const { loadContextIndex, loadContextManifest, queryContext } = require('../../context/src');

/**
 * Load project context from a directory.
 * Returns a unified context object with index, manifest, and query capabilities.
 *
 * @param {string} [projectDir] - Absolute path to project directory. If omitted, returns empty context.
 * @returns {object} Unified context object
 */
function loadProjectContext(projectDir) {
  if (!projectDir) {
    return {
      available: false,
      projectDir: null,
      index: null,
      manifest: null,
      query: (filters) => [],
    };
  }

  const resolved = path.resolve(projectDir);
  if (!fs.existsSync(resolved)) {
    return {
      available: false,
      projectDir: resolved,
      index: null,
      manifest: null,
      error: `Project directory not found: ${resolved}`,
      query: (filters) => [],
    };
  }

  let index = null;
  let manifest = null;
  let indexError = null;
  let manifestError = null;

  // Try loading index
  const indexPath = path.join(resolved, 'context-index.json');
  try {
    index = loadContextIndex(indexPath);
  } catch (err) {
    indexError = err.message;
  }

  // Try loading manifest
  const manifestPath = path.join(resolved, 'context-manifest.json');
  try {
    manifest = loadContextManifest(manifestPath);
  } catch (err) {
    manifestError = err.message;
  }

  return {
    available: !!(index || manifest),
    projectDir: resolved,
    index,
    manifest,
    indexError,
    manifestError,
    release: manifest?.release || index?.release || 'unknown',
    phase: manifest?.phase || 'unknown',
    activeMissions: manifest?.activeMissions || [],
    query: (filters) => index ? queryContext(index, filters) : [],
  };
}

module.exports = { loadProjectContext };
