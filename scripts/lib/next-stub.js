'use strict';

/**
 * next-stub.js — Activation phrase extraction.
 *
 * Uses @team-sdk/context for safe file reading and section parsing.
 */

const path = require('path');
const { safeReadFile, findSection } = require('../../packages/context/src');

/**
 * Returns the activation phrase from current-status.md "Next Agent To Activate"
 * section, or null if unavailable. Never throws.
 */
function getNextAgentStub(projectDir) {
  if (!projectDir) return null;
  try {
    const content = safeReadFile(projectDir, 'current-status.md');
    if (!content) return null;
    const match = content.match(/##\s+Next Agent To Activate[\s\S]*?\*\*Activation phrase:\*\*\s*"([^"]+)"/i);
    if (match) return match[1].trim();
    const bare = content.match(/##\s+Next Agent To Activate[\s\S]*?Activation phrase:\s*"([^"]+)"/i);
    if (bare) return bare[1].trim();
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Prints the next-agent stub to stdout if stdout is a TTY.
 */
function printNextStub(projectDir) {
  if (!process.stdout.isTTY) return;
  const phrase = getNextAgentStub(projectDir);
  if (!phrase) return;
  console.log(`\nNext: ${phrase}`);
}

module.exports = { getNextAgentStub, printNextStub };
