'use strict';

/**
 * capabilities.js — read Layer B capability claims and find the tests that cover them.
 *
 * A capability is an implementation-independent promise (context/spec/<slug>/claims.yaml,
 * `kind: capability`). Tests declare what they protect with a `@covers <capability-id>` comment.
 * Together they let the code be rewritten from scratch: the spec says what must still work, and
 * the covering tests say whether it does (protocol.md §30, "Specs outlive implementations").
 *
 * The YAML reader is deliberately minimal (no dependency): it understands the claim fields used
 * here: `- id:`, `kind:`, `status:`, `statement:`, and `conformance:` as `[a, b]` or a block list.
 */

const fs = require('fs');
const path = require('path');

function walk(dir, match, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    if (e.name === 'node_modules' || e.name.startsWith('.git')) continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, match, out);
    else if (match(e.name, p)) out.push(p);
  }
  return out;
}

const unquote = (v) => v.trim().replace(/^["']|["']$/g, '');

function parseClaims(text, file) {
  const claims = [];
  let cur = null;
  let inConformance = false;
  for (const line of text.split('\n')) {
    const start = line.match(/^\s*-\s+id:\s*(\S+)/);
    if (start) {
      cur = { id: unquote(start[1]), kind: 'claim', status: 'valid', conformance: [], file };
      claims.push(cur);
      inConformance = false;
      continue;
    }
    if (!cur) continue;
    const field = line.match(/^\s{2,}(kind|status|statement):\s*(.*)$/);
    if (field) { cur[field[1]] = unquote(field[2]); inConformance = false; continue; }
    const conf = line.match(/^\s{2,}conformance:\s*(.*)$/);
    if (conf) {
      const inline = conf[1].trim();
      if (inline.startsWith('[')) {
        cur.conformance = inline.replace(/^\[|\]$/g, '').split(',').map(unquote).filter(Boolean);
        inConformance = false;
      } else {
        inConformance = true;
      }
      continue;
    }
    if (inConformance) {
      const item = line.match(/^\s{4,}-\s+(\S+)/);
      if (item) { cur.conformance.push(unquote(item[1])); continue; }
      if (/^\s{2,}\S/.test(line)) inConformance = false;
    }
  }
  return claims;
}

/** All `kind: capability` claims under a spec root (context/spec). */
function loadCapabilities(specRoot) {
  return walk(specRoot, n => n === 'claims.yaml')
    .flatMap(f => parseClaims(fs.readFileSync(f, 'utf8'), f))
    .filter(c => c.kind === 'capability');
}

/** Map capability id → [test files that declare `@covers <id>`]. */
function findCovers(roots) {
  const covers = new Map();
  const files = roots.flatMap(r => walk(r, n => /\.(js|mjs|cjs|ts)$/.test(n)));
  for (const f of files) {
    for (const m of fs.readFileSync(f, 'utf8').matchAll(/@covers\s+([a-z0-9][a-z0-9-]*)/gi)) {
      if (!covers.has(m[1])) covers.set(m[1], []);
      covers.get(m[1]).push(f);
    }
  }
  return covers;
}

module.exports = { parseClaims, loadCapabilities, findCovers };
