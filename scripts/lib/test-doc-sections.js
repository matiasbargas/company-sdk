#!/usr/bin/env node

/**
 * test-doc-sections.js — section addressing in sdk-doc and the restored `sdk-doc iteration`.
 *
 * Guards two regressions found in the harness review:
 *   - "## Pending" silently resolved to the first "### Pending" in the file (another role's section).
 *   - `sdk-doc iteration` was referenced by the Guardian roles but had been dropped from the CLI.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const { findSectionIndex, scaffoldSectionPath } = require('./doc-utils');

let passed = 0;
let failed = 0;
function assert(cond, name) {
  if (cond) { passed++; } else { failed++; console.log(`  ✗  ${name}`); }
}

const doc = [
  '# Business',
  '## Finance (CFO)',
  '### Pending',
  '- [ ] budget',
  '## Revenue (CRO)',
  '### Pending',
  '- [ ] pricing',
  '## Notes',
];

// Level-aware lookup
assert(findSectionIndex(doc, '## Pending') === -1, '"## Pending" does not match an H3');
assert(findSectionIndex(doc, 'Pending') === 2, 'bare "Pending" keeps legacy any-level match');
assert(findSectionIndex(doc, '### Pending') === 2, '"### Pending" matches the first H3');

// Scoped paths
assert(findSectionIndex(doc, '## Revenue (CRO) > Pending') === 5, 'path resolves child inside parent');
assert(findSectionIndex(doc, '## Revenue (CRO) > ### Pending') === 5, 'path accepts explicit child level');
assert(findSectionIndex(doc, '## Notes > Pending') === -1, 'path does not leak into following sections');
assert(findSectionIndex(doc, '## risk (cro risk) > pending') === -1, 'missing parent → -1');

// Scaffolding
const scaffolded = scaffoldSectionPath(doc, '## Risk (CRO Risk) > Pending');
assert(scaffolded && scaffolded.includes('## Risk (CRO Risk)'), 'scaffold creates missing parent');
assert(scaffolded && ['### Pending', '### In Progress', '### Done', '### Blocked'].every(h => scaffolded.includes(h)), 'scaffold adds the four status children');
assert(findSectionIndex(scaffolded, '## Risk (CRO Risk) > Pending') !== -1, 'scaffolded path is resolvable');
const childAdded = scaffoldSectionPath(doc, '## Finance (CFO) > Blocked');
assert(findSectionIndex(childAdded, '## Finance (CFO) > Blocked') !== -1 && findSectionIndex(childAdded, '## Revenue (CRO) > Blocked') === -1, 'missing child is added inside its parent only');
assert(scaffoldSectionPath(doc, '## Plain heading') === null, 'non-path headings are not scaffolded');

// sdk-doc iteration end to end
const docJs = path.join(__dirname, '..', 'doc.js');
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-iter-'));
const run = (...a) => execFileSync('node', [docJs, 'iteration', tmp, ...a], { encoding: 'utf8' });
run('create', '--loop', 'discovery', '--guardian', 'Test Guardian');
run('create', '--loop', 'discovery');
const iter1 = path.join(tmp, 'iterations', 'discovery', 'iter-001.md');
const iter2 = path.join(tmp, 'iterations', 'discovery', 'iter-002.md');
assert(fs.existsSync(iter1) && fs.existsSync(iter2), 'create auto-numbers cycles');
run('review', '--loop', 'discovery', '--cycle', '1', '--verdict', 'iterate', '--feedback', 'User too broad');
const reviewed = fs.readFileSync(iter1, 'utf8');
assert(/status: "rework"/.test(reviewed) && /ITERATE — User too broad/.test(reviewed), 'review iterate writes status + verdict');
run('graduate', '--loop', 'discovery', '--cycle', '2');
assert(/status: "graduated"/.test(fs.readFileSync(iter2, 'utf8')), 'graduate sets status');
run('create', '--loop', 'implementation', '--pod', '../../escape');
assert(fs.existsSync(path.join(tmp, 'iterations', 'implementation', 'escape', 'iter-001.md')), 'pod name is slugged inside iterations/');
let threw = false;
try { execFileSync('node', [docJs, 'iteration', tmp, 'create', '--loop', 'implementation'], { stdio: 'pipe' }); } catch (_) { threw = true; }
assert(threw, 'implementation loop without --pod fails');
fs.rmSync(tmp, { recursive: true, force: true });

// gate-check: unfilled Jurisdictions placeholders must block (they used to pass)
const gateJs = path.join(__dirname, '..', 'gate-check.js');
const gtmp = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-gate-'));
const tmpl = fs.readFileSync(path.join(__dirname, '..', '..', 'project-template', 'compliance-requirements.md'), 'utf8');
const gate = (content) => {
  fs.writeFileSync(path.join(gtmp, 'compliance-requirements.md'), content);
  const r = spawnSync('node', [gateJs, gtmp], { encoding: 'utf8' });
  return { code: r.status, out: r.stdout + r.stderr };
};
const filled = tmpl
  .replace(/\| \[[^\]|]*\] \|$/gm, '| US |')
  .replace('| Legal | CLO | Pending', '| Legal | CLO | Done')
  .replace('| Security | CISO | Pending', '| Security | CISO | Done')
  .replace(/^- \[What adjacent.*$/m, '- No mobile app because web covers launch users')
  .replace(/^- \[What capability.*$/m, '- No payments because checkout is hosted by the PSP');
assert(/unanswered "\[\.\.\.\]" placeholders/.test(gate(tmpl).out), 'gate-check blocks on placeholder jurisdictions');
const ok = gate(filled);
assert(ok.code === 0, 'gate-check clears a filled-in template');
assert(/CLO section still has pending items/.test(ok.out) && /CISO section still has pending items/.test(ok.out), 'pending-item warnings fire against real template headings');
fs.rmSync(gtmp, { recursive: true, force: true });

console.log(`  doc sections + iteration + gate: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
