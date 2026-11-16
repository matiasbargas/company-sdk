#!/usr/bin/env node

/**
 * test-claims-quality.js — Layer B quality checks (scripts/lib/claims-quality.js).
 *
 * @covers cap-sdk-claims-citation-001   every cited source resolves; line ranges are in bounds
 * @covers cap-sdk-claims-stale-001      claims whose cited sources moved on in commits are flagged
 * @covers cap-sdk-claims-supersede-001  superseded_by / retired_by ids exist and never cycle
 * (project/context/spec/sdk-core/claims.yaml)
 *
 * Fixtures live in os.tmpdir() git repos. No network, no `claude` binary.
 */

'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync, spawnSync } = require('child_process');
const {
  parseClaimsYaml, parseLineRanges, checkCitations, checkSupersede, checkStale, claimsQuality,
} = require('./claims-quality');
const { DEFAULT_LIMITS, validateLimits } = require('./limits');

let passed = 0, failed = 0;
const assert = (c, n) => { if (c) passed++; else { failed++; console.log(`  ✗  ${n}`); } };

// ─── Parser ──────────────────────────────────────────────────────────────────

const YAML = `claims:
  - id: claim-a-001
    statement: "block sources"
    sources:
      - file: intent/a/brief.md
        lines: 2-3
      - file: scripts/x.js
    confidence: high
    author: {kind: human, id: matias, role: Owner}
    status: valid

  - id: cap-a-002
    kind: capability
    status: built
    statement: "flow sources"
    sources: [{file: scripts/x.js, lines: '1,3-4'}, {file: history.md, section: "A, with comma: and colon"}]
    superseded_by: [claim-a-001]
    acceptance:
      - given: "x"
        then: 'y, z'

  - id: claim-a-003
    statement: >-
      folded text
    sources:
      - intent/a/brief.md
    retired_by: claim-a-001
    superseded_by:
      - cap-a-002
      - claim-a-001
`;
const parsed = parseClaimsYaml(YAML, 'claims.yaml');
assert(parsed.length === 3, 'parser finds three claims');
assert(parsed[0].sources.length === 2 && parsed[0].sources[0].file === 'intent/a/brief.md' && parsed[0].sources[0].lines === '2-3', 'block-list sources with lines');
assert(parsed[0].sources[1].file === 'scripts/x.js' && parsed[0].sources[1].lines === undefined, 'block-list source without lines');
assert(parsed[0].confidence === 'high' && parsed[0].author && parsed[0].author.id === 'matias', 'optional confidence + author parsed');
assert(parsed[1].sources.length === 2 && parsed[1].sources[0].lines === '1,3-4' && parsed[1].sources[1].file === 'history.md', 'flow-sequence sources, quoted commas survive');
assert(parsed[1].sources[1].section === 'A, with comma: and colon', 'flow-map quoted value kept whole');
assert(JSON.stringify(parsed[1].superseded_by) === '["claim-a-001"]', 'inline superseded_by list');
assert(parsed[2].sources.length === 1 && parsed[2].sources[0].file === 'intent/a/brief.md', 'bare-string source item');
assert(JSON.stringify(parsed[2].retired_by) === '["claim-a-001"]', 'scalar retired_by normalised to a list');
assert(JSON.stringify(parsed[2].superseded_by) === '["cap-a-002","claim-a-001"]', 'block superseded_by list');
assert(parsed[1].line === 12, 'claim records its 1-based line');
const legacy = parseClaimsYaml('- id: claim-l-001\n  epic: l\n  statement: "top-level list"\n  sources:\n    - file: a.md\n      lines: 1-1\n  status: valid\n', 'c.yaml');
assert(legacy.length === 1 && legacy[0].sources[0].file === 'a.md' && legacy[0].author === undefined, 'top-level claim list (no claims: key), no optional fields');

assert(JSON.stringify(parseLineRanges('15,130-131')) === '[[15,15],[130,131]]', 'line ranges: list of single + range');
assert(JSON.stringify(parseLineRanges(' 1 - 80 ')) === '[[1,80]]', 'line ranges: whitespace tolerated');
assert(parseLineRanges('abc') === null && parseLineRanges('9-3') === null, 'line ranges: garbage and reversed ranges are unparsable');

// ─── Fixture repo ────────────────────────────────────────────────────────────

const repo = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-claims-quality-'));
const git = (...a) => execFileSync('git', a, { cwd: repo, stdio: 'ignore' });
git('init', '-q'); git('config', 'user.email', 't@t'); git('config', 'user.name', 't'); git('config', 'commit.gpgsign', 'false');
const write = (rel, text) => { const p = path.join(repo, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, text); return p; };
const projectDir = path.join(repo, 'project');
const specRoot = path.join(projectDir, 'context', 'spec');

write('scripts/x.js', 'one\ntwo\nthree\nfour\n');                     // 4 lines, repo-relative
write('project/history.md', '# History\n');                            // project-relative
write('project/context/intent/a/brief.md', 'l1\nl2\nl3\n');           // context-relative
write('project/record/loops/l-001/verdict.md', 'v\n');                 // moved under record/
const claimsRel = 'project/context/spec/a/claims.yaml';
write(claimsRel, `claims:
  - id: claim-a-001
    statement: "ok"
    sources:
      - file: intent/a/brief.md
        lines: 2-3
      - file: scripts/x.js
        lines: '1,3-4'
      - file: history.md
      - file: scripts/*.js
    status: valid

  - id: claim-a-002
    statement: "broken citations"
    sources:
      - file: intent-spec/a/brief.md
        lines: 1-2
      - file: scripts/x.js
        lines: 3-9
      - file: scripts/gone.js
      - file: scripts/x.js
        lines: nonsense
      - file: loops/l-001/verdict.md
      - file: scripts/*.none
    status: valid

  - id: claim-a-003
    statement: "invalidated claims are not re-checked"
    sources:
      - file: scripts/also-gone.js
    status: invalidated
    superseded_by: [claim-a-001]

  - id: cap-a-004
    kind: capability
    status: built
    statement: "legacy capability, no sources, no author, no confidence"
    conformance: [cap-a-004]
`);
git('add', '.'); git('commit', '-qm', 'fixture');

const files = [{ file: path.join(repo, claimsRel), claims: parseClaimsYaml(fs.readFileSync(path.join(repo, claimsRel), 'utf8'), path.join(repo, claimsRel)) }];
const roots = { contextDir: path.join(projectDir, 'context'), projectDir, repoRoot: repo };

// ─── B2.1 citations ──────────────────────────────────────────────────────────

const cit = checkCitations(files, roots);
const probs = (id) => cit.unresolved.filter(u => u.claim === id);
assert(probs('claim-a-001').length === 0, 'citation: context-, repo- and project-relative sources resolve, multi-range lines in bounds');
assert(probs('claim-a-002').length === 6, 'citation: every broken source of a claim is reported');
assert(probs('claim-a-002').some(u => u.source === 'loops/l-001/verdict.md' && /record\/loops\/l-001/.test(u.hint || '')), 'citation: legacy loops/ path hinted to record/loops/');
assert(probs('claim-a-002').some(u => u.source === 'scripts/*.none' && /not found/.test(u.problem)), 'citation: a glob with no match is unresolved');
const legacyHint = probs('claim-a-002').find(u => u.source === 'intent-spec/a/brief.md');
assert(legacyHint && /not found/.test(legacyHint.problem) && /intent\/a\/brief\.md/.test(legacyHint.hint || ''), 'citation: legacy intent-spec/ path reported with a hint to the renamed folder');
assert(probs('claim-a-002').some(u => u.source === 'scripts/x.js' && /out of bounds/.test(u.problem) && /4 lines/.test(u.problem)), 'citation: line range past EOF reported as out of bounds');
assert(probs('claim-a-002').some(u => u.source === 'scripts/gone.js' && /not found/.test(u.problem)), 'citation: missing file reported');
assert(probs('claim-a-002').some(u => /unparsable/.test(u.problem)), 'citation: unparsable line range reported');
assert(probs('claim-a-003').length === 0, 'citation: invalidated claims are skipped');
assert(cit.uncited === 1, 'citation: claims with no sources are counted, not failed');
assert(cit.checked === 10 && cit.resolved === 4, 'citation: counts checked vs resolved sources (a matching glob resolves)');

// ─── B2.3 supersede ──────────────────────────────────────────────────────────

const sup = (yaml) => checkSupersede([{ file: 'f.yaml', claims: parseClaimsYaml(yaml, 'f.yaml') }]);
const okSup = sup('- id: a\n  superseded_by: [b]\n- id: b\n  retired_by: c\n- id: c\n');
assert(okSup.problems.length === 0 && okSup.links === 2, 'supersede: existing ids and acyclic chain pass');
const missing = sup('- id: a\n  superseded_by: [ghost]\n- id: b\n  retired_by: [phantom]\n');
assert(missing.problems.length === 2 && missing.problems.every(p => p.kind === 'missing'), 'supersede: unknown superseded_by / retired_by ids reported');
assert(missing.problems.some(p => p.claim === 'b' && p.field === 'retired_by' && p.target === 'phantom'), 'supersede: problem names the field and the dangling target');
const cyc = sup('- id: a\n  superseded_by: [b]\n- id: b\n  superseded_by: [c]\n- id: c\n  retired_by: a\n');
const cycles = cyc.problems.filter(p => p.kind === 'cycle');
assert(cycles.length === 1 && cycles[0].cycle.join('>') === 'a>b>c>a', 'supersede: a cycle across superseded_by and retired_by is reported once, as a path');
const self = sup('- id: a\n  superseded_by: [a]\n');
assert(self.problems.length === 1 && self.problems[0].kind === 'cycle', 'supersede: self-supersession is a cycle');
const cross = checkSupersede([
  { file: 'one.yaml', claims: parseClaimsYaml('- id: a\n  superseded_by: [b]\n', 'one.yaml') },
  { file: 'two.yaml', claims: parseClaimsYaml('- id: b\n', 'two.yaml') },
]);
assert(cross.problems.length === 0, 'supersede: targets resolve across claims files');

// ─── B2.2 stale (work-based) ─────────────────────────────────────────────────

const staleFiles = () => [{ file: path.join(repo, claimsRel), claims: parseClaimsYaml(fs.readFileSync(path.join(repo, claimsRel), 'utf8'), path.join(repo, claimsRel)) }];
let st = checkStale(staleFiles(), roots, 2);
assert(st.stale.length === 0, 'stale: fresh claims file is not stale');
for (let i = 0; i < 3; i++) { write(`unrelated${i}.txt`, String(i)); git('add', '.'); git('commit', '-qm', `unrelated ${i}`); }
st = checkStale(staleFiles(), roots, 2);
assert(st.stale.length === 0, 'stale: commits that do not touch cited sources do not count');
for (let i = 0; i < 3; i++) { fs.appendFileSync(path.join(repo, 'scripts/x.js'), `l${i}\n`); git('add', '.'); git('commit', '-qm', `touch x ${i}`); }
st = checkStale(staleFiles(), roots, 2);
const staleIds = st.stale.map(s => s.claim).sort();
assert(JSON.stringify(staleIds) === '["claim-a-001","claim-a-002"]', 'stale: claims citing a source touched by > limit commits are flagged');
assert(st.stale.every(s => s.commits === 3), 'stale: reports the commit count touching the cited sources');
assert(!staleIds.includes('claim-a-003'), 'stale: invalidated claims are not flagged');
assert(checkStale(staleFiles(), roots, 3).stale.length === 0, 'stale: limit is exclusive (3 commits, limit 3 → fresh)');
fs.appendFileSync(path.join(repo, claimsRel), '\n');
assert(checkStale(staleFiles(), roots, 2).stale.length === 0, 'stale: uncommitted claims-file edit counts as re-confirmation');
git('add', '.'); git('commit', '-qm', 're-confirm claims');
assert(checkStale(staleFiles(), roots, 2).stale.length === 0, 'stale: committing the claims file re-confirms its claims');

// ─── B2.5 aggregate + sdk-health ─────────────────────────────────────────────

const q = claimsQuality(projectDir, { claimStaleCommits: 2 });
assert(q.counts.files === 1 && q.counts.claims === 4, 'aggregate: counts files and claims');
assert(q.issues.some(i => /claims-citation/.test(i) && /claim-a-002/.test(i) && /scripts\/gone\.js/.test(i)), 'aggregate: unresolved citation listed as an issue');
assert(!q.issues.some(i => /cap-a-004/.test(i)), 'aggregate: legacy claim without sources/author/confidence raises no issue');
assert(q.notices.some(i => /^claims: 4 claims in 1 file/.test(i)), 'aggregate: summary notice with counts');

// health: legacy-only corpus (no optional fields, all citations good) does not fail on claims
const legacyRepo = fs.mkdtempSync(path.join(os.tmpdir(), 'sdk-claims-legacy-'));
fs.mkdirSync(path.join(legacyRepo, 'context', 'spec', 'l'), { recursive: true });
fs.writeFileSync(path.join(legacyRepo, 'context', 'notes.md'), 'a\nb\n');
fs.writeFileSync(path.join(legacyRepo, 'context', 'spec', 'l', 'claims.yaml'),
  '- id: claim-l-001\n  statement: "x"\n  sources:\n    - file: notes.md\n      lines: 1-2\n  status: valid\n- id: claim-l-002\n  statement: "y"\n  status: valid\n');
const health = path.join(__dirname, '..', 'health.js');
const runHealth = (dir) => JSON.parse(spawnSync(process.execPath, [health, dir, '--json'], { encoding: 'utf8' }).stdout);
const hl = runHealth(legacyRepo);
assert(!hl.issues.some(i => /^claims/.test(i)), 'sdk-health: legacy claims missing optional fields produce no claims issue');
assert(hl.notices.some(n => /^claims: 2 claims in 1 file/.test(n)), 'sdk-health: shows the claims counts');

fs.writeFileSync(path.join(projectDir, '.sdkrc'), JSON.stringify({ limits: { claimStaleCommits: 2 } }));
const hf = runHealth(projectDir);
assert(hf.issues.some(i => /^claims-citation: .*scripts\/gone\.js/.test(i)), 'sdk-health: lists unresolved citations as issues');
assert(hf.notices.some(n => /^claims: 4 claims in 1 file/.test(n)), 'sdk-health: counts on a fixture with issues');

// ─── limits key ──────────────────────────────────────────────────────────────

assert(DEFAULT_LIMITS.claimStaleCommits === 20, 'limits: claimStaleCommits defaults to 20');
assert(validateLimits({ claimStaleCommits: 5 }).length === 0 && validateLimits({ claimStaleCommits: 0 }).length === 1, 'limits: claimStaleCommits validates as a positive integer');

fs.rmSync(repo, { recursive: true, force: true });
fs.rmSync(legacyRepo, { recursive: true, force: true });

console.log(`\n  claims-quality: ${passed} passed, ${failed} failed\n`);
process.exit(failed ? 1 : 0);
