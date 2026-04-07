'use strict';
const { execSync } = require('child_process');

const RELEASE_ID_RE = /^v\d{4}\.Q[1-4]\.\d+$/;

/**
 * Check that the working tree is clean (no uncommitted changes).
 * Throws a descriptive error if dirty.
 */
function assertCleanTree(cwd) {
  const status = execSync('git status --porcelain', { cwd, encoding: 'utf8' });
  if (status.trim()) {
    throw new Error(
      `Working tree is not clean — commit or stash changes before tagging.\n` +
      `Uncommitted files:\n${status.trim()}`
    );
  }
}

/**
 * Create an annotated git tag and push it to origin.
 * Rolls back (deletes local tag) if push fails.
 *
 * @param {string} releaseId  - must match vYYYY.QN.N format
 * @param {string} projectDir - absolute path to the project (git root)
 * @returns {{ tag: string, pushed: boolean }}
 */
function createAndPushTag(releaseId, projectDir) {
  if (!RELEASE_ID_RE.test(releaseId)) {
    throw new Error(
      `Invalid release ID format: "${releaseId}"\n` +
      `Expected: vYYYY.QN.N (e.g. v2026.Q2.1)`
    );
  }

  assertCleanTree(projectDir);

  // Create annotated tag
  try {
    execSync(`git tag -a "${releaseId}" -m "Release ${releaseId}"`, {
      cwd: projectDir,
      encoding: 'utf8',
    });
  } catch (e) {
    const msg = e.stderr || e.message || '';
    if (msg.includes('already exists')) {
      throw new Error(`Tag "${releaseId}" already exists. Delete it first: git tag -d ${releaseId}`);
    }
    throw new Error(`Failed to create tag "${releaseId}": ${msg}`);
  }

  // Push tag — rollback on failure
  try {
    execSync(`git push origin "${releaseId}"`, {
      cwd: projectDir,
      encoding: 'utf8',
    });
  } catch (e) {
    // Rollback: delete local tag
    try {
      execSync(`git tag -d "${releaseId}"`, { cwd: projectDir });
    } catch (_) {}
    const msg = e.stderr || e.message || '';
    const reason = msg.includes('Authentication') || msg.includes('auth')
      ? 'authentication failure'
      : msg.includes('network') || msg.includes('connect')
      ? 'network error'
      : msg.includes('remote: ') ? msg.match(/remote: (.+)/)?.[1] || 'remote rejected'
      : 'push failed';
    throw new Error(
      `Failed to push tag "${releaseId}" (${reason}) — local tag rolled back.\n` +
      `Fix the issue and run sdk-ship again.`
    );
  }

  return { tag: releaseId, pushed: true };
}

module.exports = { createAndPushTag, assertCleanTree };
