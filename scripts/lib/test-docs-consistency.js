#!/usr/bin/env node

/**
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

// ── Report ─────────────────────────────────────────────────────────────────────
for (const f of failures) console.log(`  ✗  ${f}`);
console.log(`  docs consistency: ${passed} passed, ${failures.length} failed`);
process.exit(failures.length ? 1 : 0);
