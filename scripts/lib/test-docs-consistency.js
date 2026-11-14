#!/usr/bin/env node

/**
 * @covers cap-sdk-docs-001  (project/context/spec/sdk-core/claims.yaml)
 * test-docs-consistency.js — cross-file consistency of the harness docs.
 *
 * The harness review found §31 deleted while 17 files cited it, protocol views stuck two
 * versions behind, documented commands that never existed, and tags used but never
 * defined. Each of those is a mechanical check; this suite makes them fail `npm test`.
 *
 *   1. Protocol version: every file that states it matches protocol.md's header.
 *   2. Section refs: "§N", "§N.M", "Section N" in harness docs resolve to a protocol heading.
 *   3. Commands: every `sdk-<bin>` is a package.json bin; every `sdk-doc <cmd>` is registered.
 *   4. Tags: every `TAG: X` used in harness docs is defined in protocol.md §25.
 *   5. Placeholders: role files use {{name}} / {{company}}, never [PERSONA_NAME] / [COMPANY].
 *   6. Bus format: SDK.md's Bus block carries every field of protocol.md §1.
 *   7. Rituals: frontmatter present, owner is a real role, listed in the README.
 *   8. Enforcement claims: every "`sdk-x` flags/checks/enforces/blocks …" or "enforced by `path`"
 *      sentence either carries an honest-gap marker or maps to real code via ENFORCEMENT_CLAIMS.
 *      (SURFACE-20260620-enforcement-claims-tooling-001: a protocol must not claim enforcement
 *      it does not have.)
 */

'use strict';

const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..', '..');
const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');

let passed = 0;
const failures = [];
function check(cond, name, detail) {
  if (cond) passed++;
  else failures.push(detail ? `${name}\n      ${detail}` : name);
}

function walk(dir, out = []) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return out;
  for (const e of fs.readdirSync(abs, { withFileTypes: true })) {
    const rel = path.join(dir, e.name);
    if (e.isDirectory()) walk(rel, out);
    else if (e.name.endsWith('.md')) out.push(rel);
  }
  return out;
}

// Harness docs = what agents load. project/ is the SDK's own run record (historical prose).
const HARNESS = [
  ...['protocol.md', 'SDK.md', 'AGENTS.md', 'CLAUDE.md', 'README.md', 'STRATEGY.md', 'CHARTER.md'],
  ...walk('team'),
  ...walk('.claude/commands'),
  ...walk('.claude/skills'),
  ...walk('.claude/agents'),
  ...walk('project-template'),
  ...walk('docs'),
].filter(p => fs.existsSync(path.join(root, p)));

const protocol = read('protocol.md');

// ── 1. Protocol version ────────────────────────────────────────────────────────
const version = (protocol.match(/^\*\*Version:\*\*\s*(\S+)/m) || [])[1];
check(!!version, 'protocol.md has a **Version:** header');
for (const p of ['protocol-core.md', 'protocol-reference.md']) {
  const v = (read(p).match(/^\*\*Version:\*\*\s*(\S+)/m) || [])[1];
  check(v === version, `${p} version matches protocol.md (${version})`, `found ${v}`);
}
for (const p of ['SDK.md', 'README.md', 'protocol.md']) {
  for (const m of read(p).matchAll(/protocol v(\d+\.\d+)/gi)) {
    check(m[1] === version, `${p}: "protocol v${m[1]}" matches protocol.md (${version})`);
  }
}

// ── 2. Section references ──────────────────────────────────────────────────────
const top = new Set([...protocol.matchAll(/^## (\d+)\.\s/gm)].map(m => m[1]));
const sub = new Set([...protocol.matchAll(/^### (\d+\.\d+)\s/gm)].map(m => m[1]));
const subParents = new Set([...sub].map(s => s.split('.')[0]));
// "Section N" also names sections of other files (project-map.md Section 11, idea.md Section 4).
const OTHER_DOC = /(project-map|idea\.md|idea|project\.md|brief|map)\b[^.\n]{0,40}$/i;

for (const file of HARNESS) {
  const lines = read(file).split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(/§(\d+)(?:\.(\d+|[A-Z]))?|\bSections? (\d+)(?:\.(\d+))?\b/g)) {
      const n = m[1] || m[3];
      const s = m[2] || m[4];
      if (m[3] && OTHER_DOC.test(line.slice(0, m.index))) continue;
      const where = `${file}:${i + 1}`;
      check(top.has(n), `${where} cites §${n}, which exists in protocol.md`, line.trim().slice(0, 140));
      if (s && top.has(n) && subParents.has(n)) {
        check(sub.has(`${n}.${s}`), `${where} cites §${n}.${s}, which exists in protocol.md`, line.trim().slice(0, 140));
      }
    }
  });
}

// ── 3. Commands ────────────────────────────────────────────────────────────────
const bins = new Set(Object.keys(JSON.parse(read('package.json')).bin || {}));
const docJs = read('scripts/doc.js');
const docCmds = new Set([...docJs.matchAll(/^\s+'([a-z-]+)':\s+require\('\.\/commands\//gm)].map(m => m[1]));
const NOT_BINS = new Set(['sdk-v3']); // project names, not commands
for (const file of HARNESS) {
  const text = read(file);
  for (const m of text.matchAll(/`[^`\n]*`|^\s*(?:sdk-[^\n]*)$/gm)) {
    const span = m[0];
    for (const b of span.matchAll(/(?<![\w/.<-])(sdk-[a-z][a-z-]*)\b/g)) {
      if (NOT_BINS.has(b[1])) continue;
      check(bins.has(b[1]), `${file}: \`${b[1]}\` is a package.json bin`, span.trim().slice(0, 140));
    }
    for (const d of span.matchAll(/\bsdk-doc\s+([a-z][a-z-]+)/g)) {
      check(docCmds.has(d[1]), `${file}: \`sdk-doc ${d[1]}\` is a registered command`, span.trim().slice(0, 140));
    }
  }
}

// ── 4. Tags ────────────────────────────────────────────────────────────────────
const s25 = protocol.slice(protocol.indexOf('## 25.'), protocol.indexOf('## 26.'));
const defined = new Set([...s25.matchAll(/^\*\*([A-Z][A-Z-]+)\*\*/gm)].flatMap(m => [m[1]]));
for (const m of s25.matchAll(/^\*\*([A-Z][A-Z-]+)\*\* \/ \*\*([A-Z][A-Z-]+)\*\*/gm)) defined.add(m[2]);
for (const file of HARNESS) {
  for (const m of read(file).matchAll(/\bTAG:\s*([A-Z][A-Z-]{2,})/g)) {
    check(defined.has(m[1]), `${file}: TAG ${m[1]} is defined in protocol.md §25`);
  }
}

// ── 5. Placeholders ────────────────────────────────────────────────────────────
for (const file of walk('team/roles')) {
  const text = read(file);
  check(!text.includes('[PERSONA_NAME]'), `${file} uses {{name}}, not [PERSONA_NAME]`);
  check(!text.includes('[COMPANY]'), `${file} uses {{company}}, not [COMPANY]`);
}

// ── 6. Bus format ──────────────────────────────────────────────────────────────
const fieldsOf = (block) => [...block.matchAll(/^([A-Z_ ]{3,}):/gm)].map(m => m[1].trim());
const s1 = protocol.slice(protocol.indexOf('## 1. Bus Message Format'));
const s1Fields = fieldsOf(s1.slice(s1.indexOf('```'), s1.indexOf('```', s1.indexOf('```') + 3)));
const sdk = read('SDK.md');
const sdkBus = sdk.slice(sdk.indexOf('### Bus message format'));
const sdkFields = fieldsOf(sdkBus.slice(sdkBus.indexOf('```'), sdkBus.indexOf('```', sdkBus.indexOf('```') + 3)));
for (const f of s1Fields) check(sdkFields.includes(f), `SDK.md Bus block has §1 field ${f}`);

// ── 7. Rituals ─────────────────────────────────────────────────────────────────
const roleFiles = new Set(fs.readdirSync(path.join(root, 'team/roles')).map(f => f.replace(/\.md$/, '')));
const ROLE_SLUG = { Coordinator: 'coordinator', PM: 'pm', CEO: 'ceo', EM: 'em', CTO: 'cto' };
const ritualsReadme = read('team/office/rituals/README.md');
for (const file of walk('team/office/rituals/office')) {
  const text = read(file);
  const fm = text.match(/^---\nritual:\n([\s\S]*?)\n---\n/);
  check(!!fm, `${file} has ritual frontmatter`);
  if (!fm) continue;
  const get = (k) => (fm[1].match(new RegExp(`^\\s+${k}:\\s*([^#\\n]+)`, 'm')) || [])[1]?.trim();
  const order = get('order'), owner = get('owner');
  check(!!get('id') && !!order && !!owner, `${file} frontmatter has id, order, owner`);
  check(roleFiles.has(ROLE_SLUG[owner] || String(owner).toLowerCase()), `${file} owner "${owner}" is a real role`);
  check(new RegExp(`\\b0?${order} `).test(ritualsReadme), `${file} (order ${order}) is listed in the rituals README`);
}

// ── 8. Enforcement claims ──────────────────────────────────────────────────────
// A claim is a sentence asserting that a tool enforces something. It passes if it carries an
// explicit gap marker, or if a registry entry below maps it to code that exists. New claims fail
// until registered; registered claims fail when their backing code disappears.
const CLAIM = /`?\b(sdk-[a-z-]+)(?: [a-z-]+)?`?[^.;\n]{0,80}?\b(flags|greps|checks|scans|enforces|blocks|rejects|denies|detects|validates|catches|warns|fails|includes an? [^.;\n]{0,30}?(?:scan|check))\b|\b(?:is|are) enforced\b|\benforced (?:by|at) `[^`]+`/i;
const GAP = /honest gap|not (?:yet )?(?:built|machine-checked|implemented)|return ticket|by convention|\bplanned\b|is not built|does not (?:produce|run|enforce)/i;
// Gap markers are sentence-scoped: one "planned" must not exempt a real claim elsewhere on the line.
const sentences = (line) => line.split(/(?<=[.;])\s+(?=[A-Z*`(])/);
const ENFORCEMENT_CLAIMS = [
  { id: 'solution-class-schema', claim: /SOLUTION_CLASS[^\n]*enforced by `packages\/protocol`/, file: 'packages/protocol/src/bus-schema.js', code: /SOLUTION_CLASS/ },
  { id: 'stale-surfaces', claim: /surfaceStaleCommits|sits in verification before `sdk-health`|`sdk-health` flags surfaces/, file: 'scripts/health.js', code: /function stuckSurfaces/ },
  { id: 'stale-status', claim: /statusStaleCommits/, file: 'scripts/health.js', code: /statusStaleCommits/ },
  { id: 'charter-review-due', claim: /charterReviewEvery|CHARTER review/, file: 'scripts/health.js', code: /function charterReviewDue/ },
  { id: 'negative-scope-gate', claim: /Negative Scope blocks the gate|Minimum 2 items required to pass gate/, file: 'scripts/gate-check.js', code: /Explicit Non-Goals/ },
  { id: 'pre-mortem-gate', claim: /--pre-mortem` enforces/, file: 'scripts/gate-check.js', code: /pre-mortem/i },
  { id: 'health-issues-reported', claim: /`sdk-health` flags are ignored/, file: 'scripts/health.js', code: /issues\.push/ },
  { id: 'limits-validated', claim: /`sdk-health` validates them/, file: 'scripts/health.js', code: /validateLimits\(/ },
  { id: 'charter-review-flag', claim: /flags a review as due/, file: 'scripts/health.js', code: /function charterReviewDue/ },
  { id: 'bus-field-rules', claim: /`sdk-doc bus` rejects/, file: 'scripts/commands/bus.js', code: /SOLUTION_CLASS is required/ },
  { id: 'document-first-gate', claim: /§35 is enforced/, file: 'scripts/hooks/map-gate.js', code: /--commit-msg/ },
  { id: 'gate-check-blocks', claim: /`sdk-gate-check`(?: --[a-z-]+)? (?:enforces this|fails until)|compliance gates are enforced/, file: 'scripts/gate-check.js', code: /GATE BLOCKED/ },
  { id: 'capability-coverage', claim: /test-capability-coverage\.js` fails the build/, file: 'scripts/lib/test-capability-coverage.js', code: /process\.exit\(failures\.length/ },
  { id: 'refactor-due', claim: /`sdk-health` reports a refactor discussion/, file: 'scripts/health.js', code: /refactor discussion due/ },
  { id: 'claims-rule-itself', claim: /for example "`sdk-health` flags X"/, file: 'scripts/lib/test-docs-consistency.js', code: /ENFORCEMENT_CLAIMS/ },
];
const claimHits = new Map(ENFORCEMENT_CLAIMS.map(c => [c.id, 0]));
for (const file of HARNESS) {
  read(file).split('\n').forEach((line, i) => {
    for (const sentence of sentences(line)) {
      if (!CLAIM.test(sentence) || GAP.test(sentence)) continue;
      const entry = ENFORCEMENT_CLAIMS.find(c => c.claim.test(sentence));
      check(!!entry, `${file}:${i + 1} enforcement claim is registered in ENFORCEMENT_CLAIMS or marked as a gap`, sentence.trim().slice(0, 160));
      if (entry) claimHits.set(entry.id, claimHits.get(entry.id) + 1);
    }
  });
}
for (const c of ENFORCEMENT_CLAIMS) {
  const src = fs.existsSync(path.join(root, c.file)) ? read(c.file) : '';
  check(c.code.test(src), `enforcement claim "${c.id}" is backed by ${c.file}`);
  if (claimHits.get(c.id) === 0) console.log(`  ·  enforcement claim "${c.id}" no longer appears in the docs (dead registry entry?)`);
}

// ── Report ─────────────────────────────────────────────────────────────────────
for (const f of failures) console.log(`  ✗  ${f}`);
console.log(`  docs consistency: ${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
