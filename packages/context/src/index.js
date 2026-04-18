'use strict';

/**
 * @team-sdk/context — Context generation, knowledge graph, and project file indexing.
 */

const { generateManifest } = require('./manifest-generator');
const { generateIndex, ORG_DOMAINS, QUERY_MAP_STATIC } = require('./index-generator');
const { loadContextIndex, loadContextManifest, queryContext } = require('./query');
const { CATALOG, CATALOG_VERSION, validateCatalog } = require('./catalog');
const {
  SUPPORTED_INDEX_VERSIONS, CURRENT_INDEX_VERSION,
  SUPPORTED_MANIFEST_VERSIONS, CURRENT_MANIFEST_VERSION,
  checkSchemaVersion,
} = require('./schema');
const { safePath, safeReadFile, safeExists, safeStat } = require('./file-resolver');
const { findSectionIndex, getSectionLevel, findSectionEnd, findSection } = require('./markdown');
const { parseFrontmatter } = require('./frontmatter');
const { calculateStaleness } = require('./staleness');
const { REQUIRED_FILES, REQUIRED_SECTIONS, PLACEHOLDER_PATTERNS, ALLOWED_EMPTY_SECTIONS } = require('./validate-config');

module.exports = {
  // Generators
  generateManifest,
  generateIndex,

  // Query API
  loadContextIndex,
  loadContextManifest,
  queryContext,

  // Catalog
  CATALOG,
  CATALOG_VERSION,
  validateCatalog,

  // Schema versions
  SUPPORTED_INDEX_VERSIONS,
  CURRENT_INDEX_VERSION,
  SUPPORTED_MANIFEST_VERSIONS,
  CURRENT_MANIFEST_VERSION,
  checkSchemaVersion,

  // File resolver (CISO)
  safePath,
  safeReadFile,
  safeExists,
  safeStat,

  // Markdown utilities
  findSectionIndex,
  getSectionLevel,
  findSectionEnd,
  findSection,

  // Frontmatter
  parseFrontmatter,

  // Staleness
  calculateStaleness,

  // Validation config
  REQUIRED_FILES,
  REQUIRED_SECTIONS,
  PLACEHOLDER_PATTERNS,
  ALLOWED_EMPTY_SECTIONS,

  // Domain data
  ORG_DOMAINS,
  QUERY_MAP_STATIC,
};
