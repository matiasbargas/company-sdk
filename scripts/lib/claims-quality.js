'use strict';

/**
 * claims-quality.js — Layer B quality checks (context/spec/<slug>/claims*.yaml).
 *
 *   claims-citation   every claim's sources[].file resolves (relative to context/, the project
 *                     dir, or the repo root) and any `lines:` range is inside the file.
 *   claims-stale      work-based (§2 timing): more than limits.claimStaleCommits commits touched
 *                     a claim's cited source files since its claims file last changed → the claim
 *                     needs re-confirmation. Committing the claims file re-confirms its claims.
 *   claims-supersede  superseded_by / retired_by ids exist in the corpus and never form a cycle.
 *
 * Claims with status `invalidated` or `retired` are kept for audit and skipped by citation and
 * staleness. Optional fields (author, confidence, superseded_by, retired_by) are never required.
 *
 * The YAML reader is deliberately minimal (no dependency, same stance as capabilities.js): it reads
 * the claim fields these checks need, in block or flow style.
 */

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { commitsSince } = require('./activity');

const INACTIVE = new Set(['invalidated', 'retired']);

// ─── Minimal YAML reading ─────────────────────────────────────────────────────

function unquote(v) {
  v = String(v).trim();
  if (v.length >= 2 && ((v[0] === '"' && v.endsWith('"')) || (v[0] === "'" && v.endsWith("'")))) return v.slice(1, -1);
  return v;
}

/** Parse a YAML flow value: `[a, {k: v}]`, `{k: "v, w"}`, or a scalar. */
function parseFlow(src) {
  let i = 0;
  const ws = () => { while (i < src.length && /\s/.test(src[i])) i++; };
  const quoted = () => {
    const q = src[i++]; let out = '';
    while (i < src.length && src[i] !== q) { if (src[i] === '\\' && q === '"') i++; out += src[i++]; }
    i++; return out;
  };
  const plain = (stops) => { let out = ''; while (i < src.length && !stops.includes(src[i])) out += src[i++]; return out.trim(); };
  function value(stops) {
    ws();
    if (src[i] === '[') {
      i++; const arr = [];
      for (ws(); i < src.length && src[i] !== ']'; ws()) { arr.push(value(',]')); ws(); if (src[i] === ',') i++; }
      i++; return arr;
    }
    if (src[i] === '{') {
      i++; const obj = {};
      for (ws(); i < src.length && src[i] !== '}'; ws()) {
        const key = (src[i] === '"' || src[i] === "'") ? quoted() : plain(':,}');
        ws(); if (src[i] === ':') { i++; obj[key] = value(',}'); } else obj[key] = null;
        ws(); if (src[i] === ',') i++;
      }
      i++; return obj;
    }
    if (src[i] === '"' || src[i] === "'") return quoted();
    return plain(stops);
  }
  return value('');
}

const asList = (v) => (v === undefined || v === null || v === '' ? [] : (Array.isArray(v) ? v : [v])).map(x => String(x).trim()).filter(Boolean);
const toSource = (v) => (v && typeof v === 'object' ? { ...v, file: v.file != null ? String(v.file) : undefined, lines: v.lines != null ? String(v.lines) : undefined } : { file: String(v) });

/**
 * Claims in one YAML text. Each: { id, line, file, status, kind, sources: [{file, lines?, section?}],
 * superseded_by: [], retired_by: [], author?, confidence? }.
 */
function parseClaimsYaml(text, file) {
  const lines = text.split('\n');
  const claims = [];
  let cur = null, fieldIndent = 0, block = null; // block: { name, indent, item }
  const indentOf = (l) => l.match(/^\s*/)[0].length;
  for (let n = 0; n < lines.length; n++) {
    const line = lines[n];
    if (/^\s*(#.*)?$/.test(line)) continue;
    const start = line.match(/^(\s*)-\s+id:\s*(.+?)\s*$/);
    if (start) {
      cur = { id: unquote(start[2]), line: n + 1, file, status: 'valid', kind: 'claim', sources: [], superseded_by: [], retired_by: [] };
      claims.push(cur); fieldIndent = start[1].length + 2; block = null;
      continue;
    }
    if (!cur) continue;
    const ind = indentOf(line);
    if (ind < fieldIndent) { cur = null; block = null; continue; }
    if (block && ind > block.indent) {
      const body = line.trim();
      const item = body.match(/^-\s*(.*)$/);
      if (item) {
        const rest = item[1];
        const kv = rest.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
        if (block.name === 'sources') {
          if (rest.startsWith('{')) { block.item = toSource(parseFlow(rest)); cur.sources.push(block.item); }
          else if (kv) { block.item = { [kv[1]]: unquote(kv[2]) }; cur.sources.push(block.item); }
          else { block.item = { file: unquote(rest) }; cur.sources.push(block.item); }
        } else if (block.name === 'superseded_by' || block.name === 'retired_by') {
          cur[block.name].push(unquote(rest));
        }
        continue;
      }
      const kv = body.match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
      if (kv && block.item) block.item[kv[1]] = unquote(kv[2]);
      continue;
    }
    if (ind !== fieldIndent) continue; // nested content of a field we do not read
    block = null;
    const field = line.trim().match(/^([A-Za-z_][\w-]*):\s*(.*)$/);
    if (!field) continue;
    const [, name, raw] = field;
    const val = raw.replace(/\s+#.*$/, '').trim();
    switch (name) {
      case 'status': case 'kind': case 'confidence':
        cur[name] = unquote(val); break;
      case 'author':
        cur.author = val.startsWith('{') ? parseFlow(val) : (val ? unquote(val) : {});
        if (!val) block = { name, indent: fieldIndent, item: cur.author };
        break;
      case 'sources':
        if (val.startsWith('[')) cur.sources = asArray(parseFlow(val)).map(toSource);
        else if (val) cur.sources = [toSource(unquote(val))];
        else block = { name, indent: fieldIndent, item: null };
        break;
      case 'superseded_by': case 'retired_by':
        if (val.startsWith('[')) cur[name] = asList(parseFlow(val));
        else if (val) cur[name] = asList(unquote(val));
        else block = { name, indent: fieldIndent, item: null };
        break;
      default: break;
    }
  }
  for (const c of claims) c.sources = c.sources.filter(s => s && s.file);
  return claims;
}
function asArray(v) { return Array.isArray(v) ? v : [v]; }

function walk(dir, match, out = []) {
  if (!fs.existsSync(dir)) return out;
  for (const e of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, match, out);
    else if (match(e.name)) out.push(p);
  }
  return out;
}

/** Every claims*.yaml under a spec root, parsed: [{ file, claims }]. variables.yaml is not a claims file. */
function loadClaimFiles(specRoot) {
  return walk(specRoot, n => /^claims[\w.-]*\.ya?ml$/.test(n))
    .map(f => ({ file: f, claims: parseClaimsYaml(fs.readFileSync(f, 'utf8'), f) }));
}

// ─── claims-citation ──────────────────────────────────────────────────────────

/** `'15,130-131'` → [[15,15],[130,131]]; null when unparsable. */
function parseLineRanges(spec) {
  const out = [];
  for (const part of String(spec).split(',')) {
    const m = part.trim().match(/^L?(\d+)(?:\s*-\s*L?(\d+))?$/i);
    if (!m) return null;
    const a = +m[1], b = m[2] ? +m[2] : a;
    if (a < 1 || b < a) return null;
    out.push([a, b]);
  }
  return out.length ? out : null;
}

// Folders renamed since older claims were written; used only to hint, never to resolve.
const LEGACY_DIRS = { 'intent-spec/': 'intent/', 'generated-spec/': 'spec/', 'loops/': 'record/loops/' };

/** `*` in the last path segment matches any run of characters (no `/`). */
function globMatches(abs) {
  const dir = path.dirname(abs);
  if (dir.includes('*') || !fs.existsSync(dir) || !fs.statSync(dir).isDirectory()) return [];
  const re = new RegExp('^' + path.basename(abs).split('*').map(x => x.replace(/[.+?^${}()|[\]\\]/g, '\\$&')).join('[^/]*') + '$');
  return fs.readdirSync(dir).filter(n => re.test(n)).sort().map(n => path.join(dir, n));
}

/** Absolute paths a cited source resolves to (several for a glob); [] when unresolved. */
function resolveAll(rel, { contextDir, projectDir, repoRoot }) {
  const bases = path.isAbsolute(rel) ? [''] : [contextDir, projectDir, repoRoot].filter(Boolean);
  for (const base of bases) {
    const p = path.resolve(base || '/', rel);
    if (rel.includes('*')) { const m = globMatches(p); if (m.length) return m; }
    else if (fs.existsSync(p)) return [p];
  }
  return [];
}
const resolveSource = (rel, roots) => resolveAll(rel, roots)[0] || null;

function lineCount(file) {
  const text = fs.readFileSync(file, 'utf8');
  if (!text) return 0;
  const n = text.split('\n').length;
  return text.endsWith('\n') ? n - 1 : n;
}

const active = (c) => !INACTIVE.has(c.status);

/**
 * { checked, resolved, uncited, skipped, unresolved: [{claim, file, source, problem, hint?}] }.
 * Also stamps each source with `resolved` (absolute path) for the staleness check.
 */
function checkCitations(claimFiles, roots) {
  const res = { checked: 0, resolved: 0, uncited: 0, skipped: 0, unresolved: [] };
  for (const { file, claims } of claimFiles) {
    for (const c of claims) {
      if (!active(c)) { res.skipped++; continue; }
      if (!c.sources.length) { res.uncited++; continue; }
      for (const s of c.sources) {
        res.checked++;
        const report = (problem, hint) => res.unresolved.push({ claim: c.id, file, source: s.file, problem, ...(hint ? { hint } : {}) });
        const all = resolveAll(s.file, roots);
        if (!all.length) {
          let hint;
          for (const [from, to] of Object.entries(LEGACY_DIRS)) {
            if (s.file.startsWith(from)) {
              const renamed = to + s.file.slice(from.length);
              if (resolveSource(renamed, roots)) hint = `renamed folder: cite ${renamed}`;
            }
          }
          report('not found (relative to context/, the project, or the repo root)', hint);
          continue;
        }
        s.resolved = all;
        if (s.lines !== undefined && s.lines !== '') {
          const ranges = parseLineRanges(s.lines);
          if (!ranges) { report(`unparsable lines "${s.lines}"`); continue; }
          const problem = all.map((abs) => {
            if (fs.statSync(abs).isDirectory()) return `lines "${s.lines}" cited on a directory`;
            const total = lineCount(abs);
            return ranges.some(([, b]) => b > total)
              ? `lines ${s.lines} out of bounds (${all.length > 1 ? path.basename(abs) + ' ' : 'file '}has ${total} lines)` : null;
          }).find(Boolean);
          if (problem) { report(problem); continue; }
        }
        res.resolved++;
      }
    }
  }
  return res;
}

// ─── claims-stale ─────────────────────────────────────────────────────────────

const realpath = (p) => { try { return fs.realpathSync(p); } catch (_) { return p; } };

function git(args, cwd) {
  try { return execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim(); } catch (_) { return null; }
}

/**
 * Valid claims whose cited (resolved) source files were touched by more than `limit` commits since
 * the claims file last changed. Uses activity.commitsSince as the cheap gate: if fewer than `limit`
 * commits landed at all since the claims file changed, none of its claims can be stale.
 * Returns { measured, stale: [{claim, file, commits, sources}] }.
 */
function checkStale(claimFiles, roots, limit) {
  const out = { measured: 0, stale: [] };
  for (const { file, claims } of claimFiles) {
    const behind = commitsSince(file);
    if (behind === null) continue; // not under git: staleness not measured
    out.measured++;
    if (behind <= limit) continue;
    const cwd = path.dirname(file);
    const last = git(['log', '-1', '--format=%H', '--', file], cwd);
    const top = realpath(git(['rev-parse', '--show-toplevel'], cwd) || '');
    if (!last || !top) continue;
    const cache = new Map();
    for (const c of claims) {
      if (!active(c)) continue;
      const srcs = [...new Set(c.sources
        .flatMap(s => s.resolved || resolveAll(s.file, roots))
        .map(realpath)
        .filter(p => !path.relative(top, p).startsWith('..'))
        .map(p => path.relative(top, p) || '.'))].sort();
      if (!srcs.length) continue;
      const key = srcs.join('\0');
      if (!cache.has(key)) {
        const n = git(['rev-list', '--count', `${last}..HEAD`, '--', ...srcs], top);
        cache.set(key, n === null ? null : parseInt(n, 10));
      }
      const commits = cache.get(key);
      if (commits !== null && commits > limit) out.stale.push({ claim: c.id, file, commits, sources: srcs });
    }
  }
  return out;
}

// ─── claims-supersede ─────────────────────────────────────────────────────────

/** { links, problems: [{kind:'missing', claim, field, target, file} | {kind:'cycle', cycle:[ids]}] } */
function checkSupersede(claimFiles) {
  const byId = new Map();
  for (const { file, claims } of claimFiles) for (const c of claims) if (!byId.has(c.id)) byId.set(c.id, { ...c, file });
  const problems = [];
  let links = 0;
  const edges = new Map();
  for (const c of byId.values()) {
    const targets = [];
    for (const field of ['superseded_by', 'retired_by']) {
      for (const t of c[field] || []) {
        links++;
        if (!byId.has(t)) problems.push({ kind: 'missing', claim: c.id, field, target: t, file: c.file });
        else targets.push(t);
      }
    }
    edges.set(c.id, targets);
  }
  const color = new Map(); const stack = []; const seen = new Set();
  const visit = (id) => {
    color.set(id, 1); stack.push(id);
    for (const t of edges.get(id) || []) {
      if (color.get(t) === 1) {
        const cycle = stack.slice(stack.indexOf(t)).concat(t);
        const key = [...new Set(cycle)].sort().join('\0');
        if (!seen.has(key)) { seen.add(key); problems.push({ kind: 'cycle', cycle }); }
      } else if (!color.get(t)) visit(t);
    }
    stack.pop(); color.set(id, 2);
  };
  for (const id of byId.keys()) if (!color.get(id)) visit(id);
  return { links, problems };
}

// ─── Aggregate (sdk-health) ───────────────────────────────────────────────────

/**
 * Run all three checks for a project dir (the folder holding context/spec).
 * Returns { counts, issues: [string], notices: [string] }; empty when there is no spec folder.
 */
function claimsQuality(projectDir, limits = {}) {
  const contextDir = path.join(projectDir, 'context');
  const specRoot = path.join(contextDir, 'spec');
  const empty = { counts: null, issues: [], notices: [] };
  if (!fs.existsSync(specRoot)) return empty;
  const files = loadClaimFiles(specRoot);
  if (!files.length) return empty;
  const repoRoot = git(['rev-parse', '--show-toplevel'], projectDir) || projectDir;
  const roots = { contextDir, projectDir, repoRoot };
  const limit = Number.isInteger(limits.claimStaleCommits) ? limits.claimStaleCommits : 20;
  const rel = (f) => path.relative(projectDir, f).replace(/\\/g, '/');

  const cit = checkCitations(files, roots);
  const stale = checkStale(files, roots, limit);
  const sup = checkSupersede(files);
  const claims = files.reduce((n, f) => n + f.claims.length, 0);
  const counts = {
    files: files.length, claims,
    sourcesChecked: cit.checked, sourcesResolved: cit.resolved, uncited: cit.uncited, inactive: cit.skipped,
    stale: stale.stale.length, staleLimit: limit, staleFilesMeasured: stale.measured,
    supersedeLinks: sup.links, supersedeProblems: sup.problems.length,
  };

  const issues = [];
  for (const u of cit.unresolved) {
    issues.push(`claims-citation: ${rel(u.file)} ${u.claim} → ${u.source}: ${u.problem}${u.hint ? ` (${u.hint})` : ''}`);
  }
  for (const s of stale.stale) {
    issues.push(`claims-stale: ${rel(s.file)} ${s.claim} — ${s.commits} commits touched ${s.sources.join(', ')} since the claims file last changed (limit ${limit}) — re-confirm the claim and commit its claims file`);
  }
  for (const p of sup.problems) {
    issues.push(p.kind === 'missing'
      ? `claims-supersede: ${rel(p.file)} ${p.claim} ${p.field} → ${p.target}: no claim with that id`
      : `claims-supersede: cycle ${p.cycle.join(' → ')}`);
  }
  const notices = [
    `claims: ${claims} claims in ${files.length} file${files.length === 1 ? '' : 's'}; citations ${cit.resolved}/${cit.checked} resolve` +
    ` (${cit.uncited} uncited, ${cit.skipped} invalidated/retired skipped); stale ${stale.stale.length} (limit ${limit} commits` +
    `${stale.measured < files.length ? `, ${files.length - stale.measured} file(s) not under git` : ''}); supersede links ${sup.links}, problems ${sup.problems.length}`,
  ];
  return { counts, issues, notices };
}

module.exports = {
  parseClaimsYaml, parseFlow, parseLineRanges, loadClaimFiles,
  checkCitations, checkStale, checkSupersede, claimsQuality,
};
