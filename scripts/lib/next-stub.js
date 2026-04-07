'use strict';
const fs = require('fs');
const path = require('path');

/**
 * Returns the activation phrase from current-status.md "Next Agent To Activate"
 * section, or null if unavailable. Never throws.
 */
function getNextAgentStub(projectDir) {
  if (!projectDir) return null;
  try {
    const statusPath = path.join(projectDir, 'current-status.md');
    if (!fs.existsSync(statusPath)) return null;
    const content = fs.readFileSync(statusPath, 'utf8');
    const match = content.match(/##\s+Next Agent To Activate[\s\S]*?\*\*Activation phrase:\*\*\s*"([^"]+)"/i);
    if (match) return match[1].trim();
    // fallback: bare "Activation phrase:" line
    const bare = content.match(/##\s+Next Agent To Activate[\s\S]*?Activation phrase:\s*"([^"]+)"/i);
    if (bare) return bare[1].trim();
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Prints the next-agent stub to stdout if stdout is a TTY.
 * Never prints to stderr. Never throws.
 */
function printNextStub(projectDir) {
  if (!process.stdout.isTTY) return;
  const phrase = getNextAgentStub(projectDir);
  if (!phrase) return;
  console.log(`\nNext: ${phrase}`);
}

module.exports = { getNextAgentStub, printNextStub };
