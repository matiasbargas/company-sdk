#!/usr/bin/env node

/**
 * @covers cap-sdk-staleness-001  (project/context/spec/sdk-core/claims.yaml)
 * test-activity.js — work-based staleness (scripts/lib/activity.js).
 * Staleness counts commits and agent iterations, never calendar days (protocol.md §2).
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');
const { commitsSince, countIterations, isClosedLoop, lastCharterReviewAt } = require('./activity');
const { validateLimits } = require('./limits');

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };

const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-activity-'));
const git = (...a) => execFileSync('git', a, { cwd: dir, stdio: 'ignore' });
git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't');
const f = path.join(dir, 'surface.md');
fs.writeFileSync(f, 'state: under-verification\n'); git('add', '.'); git('commit', '-qm', 'surface');
assert(commitsSince(f) === 0, 'freshly committed file is 0 commits behind');
for (let i = 0; i < 3; i++) { fs.writeFileSync(path.join(dir, `o${i}`), String(i)); git('add', '.'); git('commit', '-qm', `other ${i}`); }
assert(commitsSince(f) === 3, 'counts commits that landed since the file last changed');
fs.appendFileSync(f, 'edit\n');
assert(commitsSince(f) === 0, 'uncommitted edit counts as current');
assert(commitsSince(path.join(os.tmpdir(), 'definitely-not-a-repo-file.md')) === null, 'outside git → null (not measured)');

// Iterations: closed loops + graduated cycles
fs.mkdirSync(path.join(dir, 'record/loops/a'), { recursive: true });
fs.mkdirSync(path.join(dir, 'record/loops/b'), { recursive: true });
fs.writeFileSync(path.join(dir, 'record/loops/a/state.md'), '## Open\nx\n## Terminate\n- Outcome: shipped\n');
fs.writeFileSync(path.join(dir, 'record/loops/b/state.md'), '## Open\nx\n## Terminate\n- Outcome: <pending>\n');
fs.mkdirSync(path.join(dir, 'iterations/discovery'), { recursive: true });
fs.writeFileSync(path.join(dir, 'iterations/discovery/iter-001.md'), '---\nstatus: "graduated"\n---\n');
fs.writeFileSync(path.join(dir, 'iterations/discovery/iter-002.md'), '---\nstatus: "rework"\n---\n');
assert(isClosedLoop(path.join(dir, 'record/loops/a/state.md')) && !isClosedLoop(path.join(dir, 'record/loops/b/state.md')), 'placeholder outcome is not closed');
const it = countIterations(dir);
assert(it.loops === 1 && it.cycles === 1 && it.total === 2, 'iterations = closed loops + graduated cycles');

// Charter review log
const ch = path.join(dir, 'CHARTER.md');
fs.writeFileSync(ch, '# C\n## Review log\n- Review 1 — 2026-01-01 — at iteration 4 — x\n- Review 2 — 2026-02-01 — at iteration 12 — y\n## Ratification\n');
assert(lastCharterReviewAt(ch) === 12, 'last review iteration read from the Review log');
fs.writeFileSync(ch, '# C\n');
assert(lastCharterReviewAt(ch) === 0, 'never reviewed → 0');

// Limits: the day-based key is retired with a pointer
assert(validateLimits({ surfaceStaleDays: 3 }).some(p => /retired/.test(p)), 'surfaceStaleDays is retired');
assert(validateLimits({ surfaceStaleCommits: 10, statusStaleCommits: 5, charterReviewEvery: 10 }).length === 0, 'work-based limits validate');

fs.rmSync(dir, { recursive: true, force: true });
console.log(`  activity: ${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
