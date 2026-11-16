'use strict';

/**
 * test-integrity.js — B1 memory integrity (project/context/spec/sdk-memory/claims.yaml).
 *
 * Every block runs in os.tmpdir(); $HOME is never written. git is used locally only
 * (temp repos, no remotes, no network).
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const { parseHistory, parseBusLog, ingestProject } = require('../src/ingest');
const {
  entryId, validateEntry, normalizeEntry, upgradeLegacyEntry, parseAuthor,
  CHALLENGE_OUTCOMES, AUTHOR_KINDS, CONFIDENCE_LEVELS,
} = require('../src/schema');
const { createMemoryStore, companyStoreDir, globalStoreDir } = require('../src/store');

let passed = 0;
let failed = 0;
function assert(condition, label) {
  if (condition) { passed++; } else { failed++; console.error(`  FAIL: ${label}`); }
}
function eq(a, b, label) {
  assert(a === b, `${label} — expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`);
}
function throwsCode(fn, code, label) {
  try { fn(); assert(false, `${label} — expected a throw with code ${code}`); }
  catch (err) { eq(err.code, code, label); }
}

const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'team-sdk-mem-integrity-'));
let seq = 0;
function mkProject(files) {
  const dir = path.join(tmpRoot, `company-${++seq}`);
  fs.mkdirSync(dir, { recursive: true });
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(dir, rel)), { recursive: true });
    fs.writeFileSync(path.join(dir, rel), content);
  }
  return dir;
}
function git(dir, args) {
  return execFileSync('git', ['-C', dir, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid',
    '-c', 'commit.gpgsign=false', ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
}

const HISTORY = `# History

## [DECISION] Use Postgres for storage
**Date:** 2026-10-01
**Made by:** Greg (CEO)
**Status:** DECIDED
**Rationale:** Relational data.

## Undated note — no date field here
**Made by:** CTO
**Status:** DECIDED

## Challenge — Mario disputes the parser approach
**Date:** 2026-10-03
**Made by:** Mario
**Status:** Open

## Challenge — CISO disputes key storage
**Date:** 2026-10-04
**Made by:** CISO
**Status:** Accepted by CTO

## Challenge — CLO disputes the license
**Date:** 2026-10-05
**Made by:** CLO
**Status:** Overridden by the Owner
`;

const BUS = `# Bus Log

> Append-only record.

---
[2026-04-16 17:19] FROM: Owner → TO: ALL | PRIORITY: INFO | TAG: POD-KILL | RELEASE: v2026.Q2.1
POD KILLED: auth-v2
Class: FRAMING_WRONG
Reason: Users don't want SSO for MVP
Assumption: Enterprise users need SSO before trying the product

---
[2026-05-02 09:30] FROM: CTO → TO: CEO | PRIORITY: DECISION NEEDED | RELEASE: v2026.Q2.2
Should we use ajv or pure JS validation?

---
[2026-05-03 10:00] FROM: PM → TO: ALL | PRIORITY: INFO | RELEASE: v2026.Q2.2
Sprint starts tomorrow.
`;

// ═════════════════════════════════════════════════════════════════════════════
// B1.1 — deterministic ids from {source_file, content hash, anchor}
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-mem-ids-001
{
  const dir = mkProject({ 'history.md': HISTORY, 'bus-log.md': BUS });
  const a = ingestProject(dir);
  const b = ingestProject(dir);
  assert(a.length > 0, 'ingestProject yields entries from history.md and bus-log.md');
  eq(JSON.stringify(a.map(e => e.id)), JSON.stringify(b.map(e => e.id)), 'two parses of the same project produce identical ids');
  eq(new Set(a.map(e => e.id)).size, a.length, 'ids are unique within one ingest');

  // The id is a function of {project, source file, content hash, anchor} — nothing else.
  const e = a[0];
  const src = e.sources[0];
  assert(src && src.file === 'history.md' && typeof src.anchor === 'string' && /^[0-9a-f]{64}$/.test(src.content_hash), 'every parsed entry cites {file, anchor, content_hash}');
  eq(entryId({ project: e.project, sources: [{ file: src.file, anchor: src.anchor, content_hash: src.content_hash }] }), e.id, 'entryId is computable from {source_file, content hash, anchor} alone');
  eq(entryId({ ...e, date: '1999-01-01', summary: 'changed', ingestedAt: 'x' }), e.id, 'date, summary and ingest time do not feed the id');
  assert(entryId({ ...e, sources: [{ ...src, anchor: src.anchor + 'x' }] }) !== e.id, 'a different anchor yields a different id');
  assert(entryId({ ...e, sources: [{ ...src, content_hash: 'f'.repeat(64) }] }) !== e.id, 'different content yields a different id');

  // Prepending a new entry (history is often newest-first) keeps the old ids stable.
  const prepended = HISTORY.replace('# History\n', '# History\n\n## Brand new decision\n**Date:** 2026-11-01\n**Made by:** PM\n');
  fs.writeFileSync(path.join(dir, 'history.md'), prepended);
  const c = ingestProject(dir);
  const oldIds = new Set(a.map(x => x.id));
  eq(c.filter(x => !oldIds.has(x.id)).length, 1, 'prepending one history entry adds exactly one new id (anchors are not line numbers)');
  fs.writeFileSync(path.join(dir, 'history.md'), HISTORY);

  // Duplicate headings get distinct, stable anchors.
  const dup = '# H\n\n## Same title\n**Date:** 2026-01-01\n\n## Same title\n**Date:** 2026-01-01\n';
  const d = parseHistory(dup, 'p', { sourceFile: 'history.md' });
  eq(d.length, 2, 'two identical headings parse as two entries');
  assert(d[0].id !== d[1].id, 'identical headings get distinct ids via the occurrence ordinal');

  // Store level: re-ingesting the same project twice yields zero new entries.
  const store = createMemoryStore({ projectDir: dir });
  const r1 = store.ingest();
  const r2 = store.ingest();
  assert(r1.added > 0, `first ingest adds entries (got ${r1.added})`);
  eq(r2.added, 0, 're-ingesting the same project yields zero new entries');
  eq(r2.total, r1.total, 'corpus size unchanged after re-ingest');
  const r3 = createMemoryStore({ projectDir: dir }).ingest();
  eq(r3.added, 0, 'a fresh store instance over the same dir also adds zero');
}

// ═════════════════════════════════════════════════════════════════════════════
// B1.2 — dates come from the source; missing stays null
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-mem-dates-001
{
  const today = new Date().toISOString().slice(0, 10);
  const h = parseHistory(HISTORY, 'p', { sourceFile: 'history.md' });
  eq(h[0].date, '2026-10-01', 'history date comes from **Date:**');
  const undated = h.find(e => /Undated note/.test(e.summary));
  eq(undated.date, null, 'a history entry with no **Date:** keeps date null');
  assert(undated.date !== today && undated.date !== '1970-01-01', 'a missing date is never today nor an epoch placeholder');
  eq(validateEntry(undated, { requireEnvelope: true }).length, 0, 'a null date is valid (not a validation error)');

  const b = parseBusLog(BUS, 'p', { sourceFile: 'bus-log.md' });
  const kill = b.find(e => e.type === 'kill');
  const dec = b.find(e => e.type === 'decision');
  eq(kill.date, '2026-04-16', 'Bus kill date comes from the [timestamp] header');
  eq(kill.timestamp, '2026-04-16 17:19', 'Bus entries keep the full source timestamp');
  eq(dec.date, '2026-05-02', 'Bus DECISION NEEDED date comes from its header');
  assert(b.every(e => e.date !== today), 'no Bus entry is dated on the ingest day');

  // Real history variants: plain (unbolded) fields and "Date of work"; "Logged" is not the decision date.
  const variants = parseHistory('# H\n\n## Version Bump — a\nDate: 2026-04-09\nMade by: Owner (sdk-version patch)\n\n## SDK-CHANGE — b\n**Date of work:** 2026-06-14 (follow-on 2026-06-16)\n**Logged:** 2026-06-19 (backfill)\n**Made by:** PM\n\n## Only logged\n**Logged:** 2026-06-19\n', 'p', { sourceFile: 'history.md' });
  eq(variants[0].date, '2026-04-09', 'plain "Date:" line (no bold) is read');
  eq(variants[0].author.kind, 'human', 'plain "Made by:" line is read');
  eq(variants[1].date, '2026-06-14', '"Date of work:" is read (first date in the field)');
  eq(variants[2].date, null, '"Logged:" (a backfill date) is not taken as the entry date');
  const inHeading = parseHistory('# H\n\n## Mario gate — approved (2026-11-14)\n**Made by:** Mario\n', 'p', { sourceFile: 'history.md' });
  eq(inHeading[0].date, '2026-11-14', 'with no Date field, a date written in the heading is the source date');

  // Legacy multi-line Bus form: DATE/TIMESTAMP field honoured, otherwise null.
  const legacy = 'FROM: CTO\nTO: CEO\nPRIORITY: DECISION NEEDED\nMESSAGE: Pick a DB\n\nFROM: PM\nTO: ALL\nPRIORITY: BLOCKER\nTIMESTAMP: 2026-03-04 08:00\nMESSAGE: Blocked on auth\n';
  const l = parseBusLog(legacy, 'p', { sourceFile: 'bus-log.md' });
  eq(l.length, 2, 'legacy multi-line Bus blocks still parse');
  eq(l[0].date, null, 'legacy Bus block with no timestamp keeps date null (not today)');
  eq(l[1].date, '2026-03-04', 'legacy Bus TIMESTAMP field is honoured');

  // An invalid non-null date is still rejected; an absent key is rejected.
  assert(validateEntry({ type: 'decision', project: 'x', date: 'April', summary: 's' }).some(x => x.includes('date')), 'malformed date rejected');
  assert(validateEntry({ type: 'decision', project: 'x', summary: 's' }).some(x => x.includes('date')), 'absent date key rejected (must be explicit null)');
}

// ═════════════════════════════════════════════════════════════════════════════
// B1.3 — a challenge with no recorded outcome is unresolved
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-mem-outcome-001
{
  assert(CHALLENGE_OUTCOMES.includes('unresolved'), 'CHALLENGE_OUTCOMES includes unresolved');
  const h = parseHistory(HISTORY, 'p', { sourceFile: 'history.md' });
  const ch = h.filter(e => e.type === 'challenge');
  eq(ch.length, 3, 'three challenges parsed');
  eq(ch.find(e => /Mario/.test(e.summary)).outcome, 'unresolved', 'challenge with status Open (no outcome) is unresolved');
  eq(ch.find(e => /CISO/.test(e.summary)).outcome, 'accepted', 'explicitly accepted challenge is accepted');
  eq(ch.find(e => /CLO/.test(e.summary)).outcome, 'overridden', 'explicitly overridden challenge is overridden');

  const noStatus = parseHistory('# H\n\n## Dissent — Red team objects\n**Date:** 2026-01-02\n**Made by:** Red-Team\n', 'p', { sourceFile: 'history.md' });
  eq(noStatus[0].outcome, 'unresolved', 'challenge with no status at all is unresolved, never overridden');

  const outcomeField = parseHistory('# H\n\n## Challenge — X\n**Date:** 2026-01-02\n**Made by:** Mario\n**Status:** Closed\n**Outcome:** overruled\n', 'p', { sourceFile: 'history.md' });
  eq(outcomeField[0].outcome, 'overridden', 'an explicit **Outcome:** field wins over status');

  const n = normalizeEntry({ type: 'challenge', project: 'x', date: null, summary: 's', challenger: 'Mario' });
  eq(n.outcome, 'unresolved', 'normalizeEntry defaults a missing challenge outcome to unresolved');
  eq(validateEntry({ type: 'challenge', project: 'x', date: null, summary: 's', challenger: 'M', outcome: 'unresolved' }).length, 0, 'unresolved is a valid outcome');
}

// ═════════════════════════════════════════════════════════════════════════════
// B1.4 — provenance envelope; old stores load as unknown, flagged
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-mem-envelope-001
{
  assert(['human', 'agent', 'unknown'].every(k => AUTHOR_KINDS.includes(k)), 'AUTHOR_KINDS = human|agent|unknown');
  assert(CONFIDENCE_LEVELS.includes('high') && CONFIDENCE_LEVELS.includes('low'), 'CONFIDENCE_LEVELS defined');

  // author parsing
  const owner = parseAuthor('Owner');
  eq(owner.kind, 'human', 'Owner is a human principal');
  const greg = parseAuthor('Greg (CEO)');
  eq(greg.kind, 'agent', '"Greg (CEO)" is an agent');
  eq(greg.id, 'Greg', 'agent id parsed');
  eq(greg.role, 'CEO', 'agent role parsed');
  const ceoFirst = parseAuthor('CTO (Kenji)');
  eq(ceoFirst.role, 'CTO', '"Role (Name)" form parses the role');
  eq(ceoFirst.id, 'Kenji', '"Role (Name)" form parses the id');
  const unk = parseAuthor('');
  eq(unk.kind, 'unknown', 'empty author is unknown');
  eq(unk.id, null, 'unknown author has null id');
  eq(parseAuthor('Somebody').kind, 'unknown', 'an unrecognised name is unknown, not guessed');

  // Every ingested entry carries the full envelope.
  const dir = mkProject({ 'history.md': HISTORY, 'bus-log.md': BUS });
  const entries = ingestProject(dir);
  const complete = entries.every(e => e.author && AUTHOR_KINDS.includes(e.author.kind)
    && 'id' in e.author && 'role' in e.author
    && Array.isArray(e.sources) && e.sources.length > 0
    && 'commit_sha' in e && CONFIDENCE_LEVELS.includes(e.confidence));
  assert(complete, 'every ingested entry carries author{kind,id,role}, sources[], commit_sha, confidence');
  assert(entries.every(e => validateEntry(e, { requireEnvelope: true }).length === 0), 'every ingested entry validates with requireEnvelope');
  assert(entries.every(e => e.commit_sha === null), 'commit_sha is null outside git');
  eq(entries.find(e => e.type === 'kill').author.kind, 'human', 'Bus kill FROM: Owner → human author');
  eq(entries.find(e => /Postgres/.test(e.summary)).confidence, 'high', 'dated entry with a known author is high confidence');
  assert(entries.find(e => /Undated/.test(e.summary)).confidence !== 'high', 'undated entry is not high confidence');
  assert(validateEntry({ type: 'decision', project: 'x', date: null, summary: 's' }, { requireEnvelope: true }).some(x => x.includes('author')), 'requireEnvelope rejects an entry with no author');
  assert(validateEntry({ type: 'decision', project: 'x', date: null, summary: 's', author: { kind: 'robot', id: null, role: null } }).some(x => x.includes('author.kind')), 'invalid author.kind rejected');

  // commit_sha inside git: set when the file is clean at HEAD, null when dirty.
  const g = mkProject({ 'history.md': HISTORY });
  let gitOk = true;
  try { git(g, ['init', '-q']); git(g, ['add', '.']); git(g, ['commit', '-q', '-m', 'init']); } catch { gitOk = false; }
  if (gitOk) {
    const head = git(g, ['rev-parse', 'HEAD']);
    const ge = ingestProject(g);
    assert(ge.length > 0 && ge.every(e => e.commit_sha === head), 'commit_sha is the HEAD commit for a clean tracked source');
    fs.appendFileSync(path.join(g, 'history.md'), '\n## Uncommitted\n**Date:** 2026-12-01\n');
    const dirty = ingestProject(g);
    assert(dirty.every(e => e.commit_sha === null), 'commit_sha is null when the source has uncommitted changes');
    eq(JSON.stringify(dirty.slice(0, ge.length).map(e => e.id)), JSON.stringify(ge.map(e => e.id)), 'ids do not depend on commit_sha (stable across commit/dirty state)');
  } else {
    assert(true, 'git unavailable — commit_sha git case skipped');
  }

  // Old (v1) store: loads with unknown provenance, flagged.
  const legacyDir = path.join(tmpRoot, 'legacy-store');
  fs.mkdirSync(legacyDir, { recursive: true });
  fs.writeFileSync(path.join(legacyDir, 'decisions.json'), JSON.stringify([
    { id: 'abcd1234abcd1234', type: 'decision', project: 'old', date: '2026-04-06', summary: 'Old decision', madeBy: 'Greg (CEO)', affects: [], tags: [], ingestedAt: '2026-04-18T00:00:00.000Z' },
  ]));
  const ls = createMemoryStore({ storeDir: legacyDir });
  const [old] = ls.getDecisions();
  eq(old.legacy, true, 'legacy entry is flagged legacy');
  eq(old.provenance, 'unknown', 'legacy entry provenance is unknown');
  eq(old.author.kind, 'unknown', 'legacy author kind is unknown (not inferred from madeBy)');
  eq(old.confidence, 'low', 'legacy entry confidence is low');
  eq(old.commit_sha, null, 'legacy commit_sha is null');
  assert(Array.isArray(old.sources) && old.sources.length === 0, 'legacy sources is an empty array');
  eq(old.id, 'abcd1234abcd1234', 'legacy id preserved on load');
  eq(ls.stats().legacyEntries, 1, 'stats counts legacy (unknown-provenance) entries');
  const up = upgradeLegacyEntry({ ...old, schemaVersion: 2, author: { kind: 'agent', id: 'x', role: 'CTO' } });
  eq(up.author.kind, 'agent', 'upgradeLegacyEntry leaves a v2 entry untouched');

  // Re-ingesting the source of a legacy entry upgrades it instead of duplicating it.
  const src = mkProject({ 'history.md': '# H\n\n## Old decision\n**Date:** 2026-04-06\n**Made by:** Greg (CEO)\n' });
  const legacyDir2 = path.join(tmpRoot, 'legacy-store-2');
  fs.mkdirSync(legacyDir2, { recursive: true });
  const crypto = require('crypto');
  const oldId = crypto.createHash('sha256').update(`${path.basename(src)}|2026-04-06|Old decision`).digest('hex').slice(0, 16);
  fs.writeFileSync(path.join(legacyDir2, 'decisions.json'), JSON.stringify([
    { id: oldId, type: 'decision', project: path.basename(src), date: '2026-04-06', summary: 'Old decision', affects: [], tags: [] },
  ]));
  const s2 = createMemoryStore({ storeDir: legacyDir2 });
  const res = s2.ingest(src);
  eq(res.added, 0, 'legacy entry with a matching v1 id is not duplicated');
  eq(res.upgraded, 1, 'legacy entry is upgraded in place');
  eq(res.total, 1, 'corpus still holds one entry');
  eq(s2.getDecisions()[0].legacy, undefined, 'upgraded entry is no longer flagged legacy');
}

// ═════════════════════════════════════════════════════════════════════════════
// B1.5 — per-company default store; global is opt-in only
// ═════════════════════════════════════════════════════════════════════════════

// @covers cap-mem-store-001
{
  const fakeHome = path.join(tmpRoot, 'home');
  fs.mkdirSync(fakeHome, { recursive: true });
  const savedHome = process.env.HOME;
  const savedProfile = process.env.USERPROFILE;
  const savedGlobal = process.env.TEAM_SDK_MEMORY_GLOBAL;
  process.env.HOME = fakeHome;
  process.env.USERPROFILE = fakeHome;
  delete process.env.TEAM_SDK_MEMORY_GLOBAL;
  try {
    const dir = mkProject({ 'history.md': HISTORY });
    eq(companyStoreDir(dir), path.join(dir, '.team-sdk', 'memory'), 'companyStoreDir = <projectDir>/.team-sdk/memory');
    eq(globalStoreDir(), path.join(fakeHome, '.team-sdk', 'memory'), 'globalStoreDir resolves under $HOME at call time');

    const store = createMemoryStore({ projectDir: dir });
    eq(store.getStoreDir(), path.join(dir, '.team-sdk', 'memory'), 'a store for a company lives in that company');
    const scope = store.getScope();
    eq(scope.scope, 'company', 'scope is company');
    eq(scope.leakRisk, false, 'a company store carries no cross-company leak risk');
    const gi = path.join(dir, '.team-sdk', '.gitignore');
    assert(fs.existsSync(gi) && /^\*$/m.test(fs.readFileSync(gi, 'utf8')), 'the company store is gitignored (self-ignoring .team-sdk/.gitignore)');
    store.ingest();
    const index = JSON.parse(fs.readFileSync(path.join(dir, '.team-sdk', 'memory', 'index.json'), 'utf8'));
    eq(index.derived, true, 'index.json declares the store derived');
    eq(index.scope, 'company', 'index.json records the scope');

    // No configuration at all → refused (no silent global default).
    throwsCode(() => createMemoryStore(), 'MEMORY_STORE_UNCONFIGURED', 'createMemoryStore() with no config is refused');
    throwsCode(() => createMemoryStore({}), 'MEMORY_STORE_UNCONFIGURED', 'createMemoryStore({}) is refused');
    assert(!fs.existsSync(path.join(fakeHome, '.team-sdk')), 'a refused store writes nothing under $HOME');

    // The global path cannot be smuggled in via storeDir.
    throwsCode(() => createMemoryStore({ storeDir: path.join(fakeHome, '.team-sdk', 'memory') }), 'MEMORY_GLOBAL_NOT_OPTED_IN', 'storeDir pointing at the global path without opt-in is refused');

    // Explicit opt-in works and is flagged as a leak risk.
    const g = createMemoryStore({ global: true });
    eq(g.getStoreDir(), path.join(fakeHome, '.team-sdk', 'memory'), 'global: true uses ~/.team-sdk/memory');
    eq(g.getScope().scope, 'global', 'global store reports scope global');
    eq(g.getScope().leakRisk, true, 'global store is flagged as a cross-company leak risk');
    process.env.TEAM_SDK_MEMORY_GLOBAL = '1';
    eq(createMemoryStore().getScope().scope, 'global', 'TEAM_SDK_MEMORY_GLOBAL=1 is an explicit opt-in');
    delete process.env.TEAM_SDK_MEMORY_GLOBAL;

    // A company store refuses to ingest another company (cross-company goes through the commons).
    const other = mkProject({ 'history.md': HISTORY });
    throwsCode(() => store.ingest(other), 'CROSS_COMPANY_INGEST', 'a company store refuses another company\'s project');
    eq(store.ingest(path.join(dir)).added, 0, 'ingesting its own dir explicitly is allowed');

    // Module exports no machine-global default.
    const mod = require('../src');
    eq(mod.DEFAULT_STORE_DIR, undefined, 'the package no longer exports a machine-global DEFAULT_STORE_DIR');
    assert(typeof mod.companyStoreDir === 'function' && typeof mod.globalStoreDir === 'function', 'index exports companyStoreDir and globalStoreDir');

    // Documentation exists: leak risk + commons route.
    const readme = fs.readFileSync(path.join(__dirname, '..', 'src', 'README.md'), 'utf8');
    assert(/<projectDir>\/\.team-sdk\/memory/.test(readme), 'README documents the per-company default');
    assert(/leak/i.test(readme) && /opt-in/i.test(readme), 'README documents the global store as an opt-in leak risk');
    assert(/commons/i.test(readme), 'README routes cross-company memory through the commons');
  } finally {
    if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
    if (savedProfile === undefined) delete process.env.USERPROFILE; else process.env.USERPROFILE = savedProfile;
    if (savedGlobal === undefined) delete process.env.TEAM_SDK_MEMORY_GLOBAL; else process.env.TEAM_SDK_MEMORY_GLOBAL = savedGlobal;
  }
}

try { fs.rmSync(tmpRoot, { recursive: true, force: true }); } catch {}

console.log(`  test-integrity: ${passed} passed, ${failed} failed`);
module.exports = { passed, failed };
