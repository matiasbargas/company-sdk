'use strict';

/**
 * provenance.js — source hashing and git commit lookup for the memory envelope.
 *
 * Local git only (`git -C <dir> ...`): no network, no writes, no hooks. When git is missing,
 * the directory is not a repo, or the file is untracked/dirty, commit_sha is null — the store
 * never claims a commit that does not contain the content it read.
 */

const crypto = require('crypto');
const path = require('path');
const { execFileSync } = require('child_process');

function contentHash(text) {
  return crypto.createHash('sha256').update(String(text).replace(/\r\n/g, '\n').trim()).digest('hex');
}

function runGit(cwd, args) {
  try {
    return execFileSync('git', ['-C', cwd, ...args], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
      timeout: 5000,
      env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GIT_OPTIONAL_LOCKS: '0' },
    }).trim();
  } catch {
    return null;
  }
}

/**
 * The HEAD commit if `absFile` is tracked and unmodified relative to HEAD, else null.
 * @param {string} absFile — absolute path of the source file
 */
function commitShaFor(absFile) {
  const dir = path.dirname(absFile);
  const base = path.basename(absFile);
  const head = runGit(dir, ['rev-parse', '--verify', '-q', 'HEAD']);
  if (!head || !/^[0-9a-f]{40,64}$/.test(head)) return null;
  const tracked = runGit(dir, ['ls-files', '--error-unmatch', '--', base]);
  if (tracked === null) return null;
  const dirty = runGit(dir, ['status', '--porcelain', '--', base]);
  if (dirty === null || dirty !== '') return null;
  return head;
}

/** Path of `absFile` relative to `rootDir`, POSIX separators (portable across machines). */
function relSource(rootDir, absFile) {
  return path.relative(rootDir, absFile).split(path.sep).join('/');
}

module.exports = { contentHash, commitShaFor, relSource };
