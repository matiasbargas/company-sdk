'use strict';

/**
 * file-resolver.js — Safe file path resolution with traversal guard.
 *
 * CISO condition: every file-reading operation in the context package
 * must use this resolver. Rejects paths that resolve outside the project root.
 */

const path = require('path');
const fs = require('fs');

/**
 * Resolve a relative path against a project root, with traversal protection.
 * Returns the absolute path if safe, or throws if the resolved path escapes the root.
 *
 * @param {string} projectRoot - Absolute path to the project root
 * @param {string} relativePath - Relative path to resolve
 * @returns {string} Absolute resolved path
 * @throws {Error} If path resolves outside project root
 */
function safePath(projectRoot, relativePath) {
  const root = path.resolve(projectRoot);
  const resolved = path.resolve(root, relativePath);

  // Use realpath if the file exists (catches symlink escapes)
  let canonical;
  if (fs.existsSync(resolved)) {
    canonical = fs.realpathSync(resolved);
    const canonicalRoot = fs.realpathSync(root);
    if (!canonical.startsWith(canonicalRoot + path.sep) && canonical !== canonicalRoot) {
      throw new Error(`Path traversal blocked: ${relativePath} resolves outside project root`);
    }
  } else {
    // File doesn't exist yet — check the resolved path lexically
    if (!resolved.startsWith(root + path.sep) && resolved !== root) {
      throw new Error(`Path traversal blocked: ${relativePath} resolves outside project root`);
    }
    canonical = resolved;
  }

  return canonical;
}

/**
 * Read a file safely within a project root.
 * @param {string} projectRoot - Project root directory
 * @param {string} relativePath - Relative path to the file
 * @returns {string|null} File contents, or null if file doesn't exist
 */
function safeReadFile(projectRoot, relativePath) {
  try {
    const resolved = safePath(projectRoot, relativePath);
    if (!fs.existsSync(resolved)) return null;
    return fs.readFileSync(resolved, 'utf8');
  } catch (err) {
    if (err.message.includes('Path traversal')) throw err;
    return null;
  }
}

/**
 * Check if a file exists safely within a project root.
 * @param {string} projectRoot - Project root directory
 * @param {string} relativePath - Relative path to the file
 * @returns {boolean}
 */
function safeExists(projectRoot, relativePath) {
  try {
    const resolved = safePath(projectRoot, relativePath);
    return fs.existsSync(resolved);
  } catch {
    return false;
  }
}

/**
 * Get file stat safely within a project root.
 * @param {string} projectRoot - Project root directory
 * @param {string} relativePath - Relative path to the file
 * @returns {fs.Stats|null}
 */
function safeStat(projectRoot, relativePath) {
  try {
    const resolved = safePath(projectRoot, relativePath);
    if (!fs.existsSync(resolved)) return null;
    return fs.statSync(resolved);
  } catch {
    return null;
  }
}

module.exports = { safePath, safeReadFile, safeExists, safeStat };
