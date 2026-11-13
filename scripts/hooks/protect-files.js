#!/usr/bin/env node

/**
 * protect-files.js — Claude Code PreToolUse hook (Edit|Write).
 *
 *   CHARTER.md                       Layer A — changes only by Owner ratification (see the CHARTER.md header).
 *   protocol-core.md / -reference.md / protocol/*.md   generated from protocol.md by scripts/split-protocol.js.
 *
 * Denies with a reason Claude can act on; anything else passes through (exit 0, no output).
 * Honest limit: this guards the Edit/Write/NotebookEdit tools only. A Bash command (sed -i, >)
 * is not intercepted; the real Layer A control is Owner review of the commit.
 */

'use strict';

let input = '';
process.stdin.on('data', c => { input += c; });
process.stdin.on('end', () => {
  let filePath = '';
  try { const ti = JSON.parse(input).tool_input || {}; filePath = ti.file_path || ti.notebook_path || ''; } catch (_) { process.exit(0); }
  const base = filePath.split('/').pop();
  const rules = {
    'CHARTER.md': 'CHARTER.md is Layer A and changes only by Owner ratification. Propose the change to the Owner (via Greg) instead of editing it.',
    'protocol-core.md': 'protocol-core.md is generated. Edit protocol.md, then run `node scripts/split-protocol.js`.',
    'protocol-reference.md': 'protocol-reference.md is generated. Edit protocol.md, then run `node scripts/split-protocol.js`.',
  };
  // Only the generated views: a protocol/ dir that sits next to a protocol.md source.
  const path = require('path');
  if (/\/protocol\/[^/]+\.md$/.test(filePath) && require('fs').existsSync(path.join(path.dirname(path.dirname(filePath)), 'protocol.md'))) {
    rules[base] = `protocol/${base} is generated. Edit protocol.md, then run \`node scripts/split-protocol.js\`.`;
  }
  if (!rules[base]) process.exit(0);
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: 'deny', permissionDecisionReason: rules[base] },
  }) + '\n');
  process.exit(0);
});
