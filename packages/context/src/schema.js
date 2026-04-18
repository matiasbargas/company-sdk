'use strict';

/**
 * schema.js — Schema version management for context files.
 *
 * Mario condition: SUPPORTED_SCHEMA_VERSIONS exported as constant.
 * Consumers check version programmatically, not by hardcoding strings.
 */

/** Supported schema versions for context-index.json */
const SUPPORTED_INDEX_VERSIONS = Object.freeze(['2.0', '3.0']);

/** Current (latest) schema version for context-index.json */
const CURRENT_INDEX_VERSION = '3.0';

/** Supported schema versions for context-manifest.json */
const SUPPORTED_MANIFEST_VERSIONS = Object.freeze(['1.0']);

/** Current (latest) schema version for context-manifest.json */
const CURRENT_MANIFEST_VERSION = '1.0';

/**
 * Validate that a schema version is supported.
 * @param {string} version - The version string to check
 * @param {string[]} supported - Array of supported versions
 * @returns {{ valid: boolean, deprecated: boolean, error?: string }}
 */
function checkSchemaVersion(version, supported) {
  if (!version) {
    return { valid: false, deprecated: false, error: 'Missing schemaVersion field' };
  }
  if (!supported.includes(version)) {
    return { valid: false, deprecated: false, error: `Unsupported schemaVersion '${version}'. Supported: ${supported.join(', ')}` };
  }
  // The first version in the array (if not the latest) is deprecated
  const latest = supported[supported.length - 1];
  const deprecated = version !== latest;
  return { valid: true, deprecated };
}

module.exports = {
  SUPPORTED_INDEX_VERSIONS,
  CURRENT_INDEX_VERSION,
  SUPPORTED_MANIFEST_VERSIONS,
  CURRENT_MANIFEST_VERSION,
  checkSchemaVersion,
};
