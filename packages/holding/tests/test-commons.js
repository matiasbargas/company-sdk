'use strict';

// Commons (D2): publish → quarantine → admit (cross-company + CISO surface) → pull with Owner approval
// → revoke. Two temporary companies, no sandbox user (unsandboxed test mode: the commons never spawns
// a session), no network, no claude. This suite is async; run.js awaits the exported promise.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { main } = require('../bin/sdk-holding');
const { openLedger } = require('../src/ledger');
const { treeHash, collectFiles } = require('../src/commons/treehash');
const { scanText } = require('../src/commons/scan');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('commons');

function git(repo, ...args) {
  return execFileSync('git', ['-C', repo, '-c', 'user.name=t', '-c', 'user.email=t@example.invalid', '-c', 'commit.gpgsign=false', ...args],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
}
function companyRepo(prefix) {
  const repo = tmpDir(prefix);
  git(repo, 'init', '-q');
  fs.writeFileSync(path.join(repo, 'CHARTER.md'), '# Charter\n\n- **Ratified by: Ada (Owner) on 2026-11-14**\n');
  git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', 'charter');
  return repo;
}
/** Commit a §34 surface (real front-matter shape) and return the commit SHA. */
function commitSurface(repo, id, { state = 'verified', roster, body = '' }) {
  fs.mkdirSync(path.join(repo, 'surfaces'), { recursive: true });
  fs.writeFileSync(path.join(repo, 'surfaces', `${id}.md`),
    `---\nsurface:\n  id: ${id}\n  kind: decision\n  title: admit a commons item\n  author_roles: [CTO]\n`
    + `  verifier_roster: [${roster.join(', ')}]\n  state: ${state}\n  irreversible: false\n---\n\n${body}\n`);
  git(repo, 'add', '-A'); git(repo, 'commit', '-q', '-m', `surface ${id} ${state}`);
  return git(repo, 'rev-parse', 'HEAD');
}
function writeTree(root, files) {
  for (const [rel, content] of Object.entries(files)) {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), content);
  }
  return root;
}
async function cli(args, deps = {}) {
  const out = []; const err = [];
  const code = await main(args, { stdout: (s) => out.push(s), stderr: (s) => err.push(s), env: {}, ...deps });
  return { code, out: out.join('\n'), err: err.join('\n') };
}
const hexOf = (hash) => hash.replace(/^sha256:/, '');
const readJson = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));

async function run() {
  // ── tree hash (Mario C10) ────────────────────────────────────────────────────────────────
  // @covers cap-po-commons-001 — content addressing: sorted relative paths, LF-normalized, sha256: prefix
  {
    const a = writeTree(tmpDir('th-a-'), { 'b.md': 'two\r\nlines\r\n', 'a/x.md': 'x\n' });
    const b = tmpDir('th-b-');
    writeTree(b, { 'a/x.md': 'x\n' }); writeTree(b, { 'b.md': 'two\nlines\n' }); // other creation order, LF
    const ha = treeHash(collectFiles(a)); const hb = treeHash(collectFiles(b));
    t.assert(/^sha256:[0-9a-f]{64}$/.test(ha), `tree hash has the sha256: prefix (${ha})`);
    t.eq(ha, hb, 'CRLF vs LF and creation order do not change the tree hash');
    t.deepEq(collectFiles(a).map(f => f.rel), ['a/x.md', 'b.md'], 'relative paths are sorted, posix separators');
    fs.renameSync(path.join(b, 'b.md'), path.join(b, 'c.md'));
    t.assert(treeHash(collectFiles(b)) !== ha, 'a rename changes the tree hash (paths are hashed)');
    fs.writeFileSync(path.join(a, 'b.md'), 'two\nlines!\n');
    t.assert(treeHash(collectFiles(a)) !== ha, 'a content change changes the tree hash');
    const single = writeTree(tmpDir('th-s-'), { 'skill.md': 'hello\n' });
    t.deepEq(collectFiles(path.join(single, 'skill.md')).map(f => f.rel), ['skill.md'], 'a single file hashes under its base name');
  }

  // ── holding with two companies (D2.6) ────────────────────────────────────────────────────
  const root = path.join(tmpDir('commons-holding-'), 'h');
  const H = ['--holding', root];
  t.eq((await cli(['init', root, '--owner', 'Ada'])).code, 0, 'init');
  const acme = companyRepo('commons-acme-');
  const beta = companyRepo('commons-beta-');
  t.eq((await cli(['add-company', acme, '--id', 'acme', '--owner', 'Ada', ...H])).code, 0, 'acme registered');
  t.eq((await cli(['add-company', beta, '--id', 'beta', '--owner', 'Ada', ...H])).code, 0, 'beta registered');
  const ledgerFile = path.join(root, 'holding', 'fuel', 'ledger.jsonl');
  const L = () => openLedger(ledgerFile, {});
  const commonsDir = path.join(root, 'holding', 'commons');
  t.eq(L().fold().sandbox, null, 'D2.6: no sandbox user configured — the commons runs in the unsandboxed test mode');

  // ── publish (D2.1) ───────────────────────────────────────────────────────────────────────
  // @covers cap-po-commons-001 — publish lands content-addressed in holding/commons/quarantine/
  const work = tmpDir('commons-src-');
  const skillDir = writeTree(path.join(work, 'review-skill'), { 'SKILL.md': '# Review\n\nRead the diff twice.\n', 'refs/checklist.md': '- tests first\n' });
  let skillHash;
  {
    const r = await cli(['commons', 'publish', 'acme', skillDir, '--class', 'skill', ...H]);
    t.eq(r.code, 0, `publish a skill (${r.err})`);
    skillHash = (/(sha256:[0-9a-f]{64})/.exec(r.out) || [])[1];
    t.eq(skillHash, treeHash(collectFiles(skillDir)), 'publish prints the tree hash of the item');
    const q = path.join(commonsDir, 'quarantine', hexOf(skillHash));
    t.assert(fs.existsSync(path.join(q, 'files', 'SKILL.md')) && fs.existsSync(path.join(q, 'files', 'refs', 'checklist.md')), 'item files land in holding/commons/quarantine/<hash>/files');
    const m = readJson(path.join(q, 'manifest.json'));
    t.eq(m.item, 'acme/review-skill', 'item id is company-qualified (company/name)');
    t.eq(m.hash, skillHash, 'manifest carries the hash');
    const ev = L().read().filter(e => e.type === 'commons_publish');
    t.eq(ev.length, 1, 'one commons_publish ledger event');
    t.eq(ev[0].hash, skillHash, 'the event carries the tree hash');
    t.eq(ev[0].class, 'skill', 'the event carries the class');
    t.eq(L().fold().commons.items[skillHash].status, 'quarantined', 'fold: the item is quarantined until admitted');
    const again = await cli(['commons', 'publish', 'acme', skillDir, '--class', 'skill', ...H]);
    t.eq(again.code, 0, 'republishing the same content is idempotent');
    t.eq(L().read().filter(e => e.type === 'commons_publish').length, 1, 'no second publish event');
    t.eq((await cli(['commons', 'publish', 'acme', skillDir, '--class', 'secrets', ...H])).code, 2, 'unknown class is a usage error');
    t.eq((await cli(['commons', 'publish', 'nope', skillDir, '--class', 'skill', ...H])).code, 1, 'unknown company refused');
  }

  // @covers cap-po-commons-001 — items carrying settings, hooks, CHARTER, MCP/permission config or scripts are refused
  {
    const cases = [
      ['settings.json', { 'settings.json': '{}' }],
      ['settings.local.json', { '.claude/settings.local.json': '{}' }],
      ['hooks/', { 'hooks/pre.md': 'x' }],
      ['CHARTER.md', { 'CHARTER.md': '# c' }],
      ['.mcp.json', { '.mcp.json': '{}' }],
      ['permissions.json', { 'permissions.json': '{}' }],
      ['run.sh', { 'run.sh': 'echo hi' }],
      ['shebang', { 'tool': '#!/usr/bin/env node\nconsole.log(1)\n' }],
    ];
    for (const [label, files] of cases) {
      const dir = writeTree(path.join(tmpDir('commons-bad-'), 'bad-item'), { 'README.md': 'ok\n', ...files });
      const r = await cli(['commons', 'publish', 'acme', dir, '--class', 'skill', ...H]);
      t.eq(r.code, 1, `item with ${label} refused`);
      t.assert(/COMMONS_FORBIDDEN/.test(r.err), `refusal for ${label} names COMMONS_FORBIDDEN (${r.err})`);
      t.assert(!fs.existsSync(path.join(commonsDir, 'quarantine', hexOf(treeHash(collectFiles(dir))))), `nothing quarantined for ${label}`);
    }
    const exe = writeTree(path.join(tmpDir('commons-bad-'), 'exe-item'), { 'README.md': 'ok\n', 'notes.md': 'plain\n' });
    fs.chmodSync(path.join(exe, 'notes.md'), 0o755);
    const r = await cli(['commons', 'publish', 'acme', exe, '--class', 'skill', ...H]);
    t.eq(r.code, 1, 'a file with an executable bit is refused');
    t.assert(/executable/.test(r.err) && /notes\.md/.test(r.err), 'refusal names the executable file');
  }

  // @covers cap-po-data-001 — deterministic secret and PII scans refuse on any finding, naming it (never echoing it)
  {
    const findings = (s) => scanText(s, 'f.md').map(f => f.kind);
    t.assert(findings('contact ada@example.com today').includes('email'), 'scan finds an email');
    t.assert(findings('key sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123').includes('api-key'), 'scan finds an Anthropic key pattern');
    t.assert(findings('AKIAABCDEFGHIJKLMNOP').includes('api-key'), 'scan finds an AWS access key id');
    t.assert(findings('call +1 415 555 0123').includes('phone'), 'scan finds a phone number');
    t.assert(findings('-----BEGIN RSA PRIVATE KEY-----').includes('private-key'), 'scan finds a private key block');
    t.eq(findings('released 2026-11-15, version 1.2.3, see §34.5').length, 0, 'dates, versions and section numbers are not findings');
    for (const [kind, text] of [['email', 'mail ada@example.com\n'], ['api-key', 'token sk-ant-api03-abcdefghijklmnopqrstuvwxyz0123\n'], ['phone', 'call +44 20 7946 0958\n']]) {
      const dir = writeTree(path.join(tmpDir('commons-pii-'), `pii-${kind}`), { 'SKILL.md': `# s\n\n${text}` });
      const r = await cli(['commons', 'publish', 'acme', dir, '--class', 'skill', ...H]);
      t.eq(r.code, 1, `skill with a ${kind} refused`);
      t.assert(new RegExp(`COMMONS_SCAN`).test(r.err) && r.err.includes(kind) && /SKILL\.md:3/.test(r.err), `refusal names ${kind} at SKILL.md:3 (${r.err})`);
      t.assert(!r.err.includes('ada@example.com') && !r.err.includes('sk-ant-api03'), `refusal does not echo the ${kind} value`);
    }
  }

  // ── published-context consent (D2.4) ─────────────────────────────────────────────────────
  // @covers cap-po-commons-002 — published-context needs a full CLO consent record and clean scans
  const ctxDir = writeTree(path.join(work, 'pricing-lessons'), { 'context.md': '# Lessons\n\nSmall bets first.\n' });
  const ctxHash = treeHash(collectFiles(ctxDir));
  const consent = (over = {}) => {
    const f = path.join(tmpDir('consent-'), 'consent.json');
    fs.writeFileSync(f, JSON.stringify({
      artifact_id: 'acme/pricing-lessons', content_hash: ctxHash, source_company: 'acme', approving_owner: 'Ada',
      timestamp: '2026-11-15T10:00:00Z', scope: 'holding portfolio companies', recipients: ['beta'], license: 'internal-use',
      revocability: 'irreversible once pulled; revocation stops future pulls only', attestations: ['no personal data', 'no secrets'],
      competitively_sensitive: false, surface_id: 'acme/SURFACE-20261115-consent-001@abc1234', ...over,
    }));
    return f;
  };
  {
    const none = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', ...H]);
    t.eq(none.code, 1, 'published-context without a consent record refused');
    t.assert(/CONSENT_REQUIRED/.test(none.err), 'refusal names CONSENT_REQUIRED');
    for (const field of ['artifact_id', 'content_hash', 'source_company', 'approving_owner', 'timestamp', 'scope', 'recipients',
      'license', 'revocability', 'attestations', 'competitively_sensitive', 'surface_id']) {
      const c = consent(); const body = readJson(c); delete body[field]; fs.writeFileSync(c, JSON.stringify(body));
      const r = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', '--consent', c, ...H]);
      t.assert(r.code === 1 && /CONSENT_INVALID/.test(r.err) && r.err.includes(field), `consent without ${field} refused naming it`);
    }
    const wrongHash = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', '--consent', consent({ content_hash: skillHash }), ...H]);
    t.assert(wrongHash.code === 1 && /content_hash/.test(wrongHash.err), 'consent for other content refused (content_hash)');
    const wrongOwner = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', '--consent', consent({ approving_owner: 'Mallory' }), ...H]);
    t.assert(wrongOwner.code === 1 && /approving_owner/.test(wrongOwner.err), 'consent not signed by the company Owner refused');
    const wrongCo = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', '--consent', consent({ source_company: 'beta' }), ...H]);
    t.assert(wrongCo.code === 1 && /source_company/.test(wrongCo.err), 'consent from another company refused');
    const sensitive = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', '--consent', consent({ competitively_sensitive: true }), ...H]);
    t.assert(sensitive.code === 1 && /competitively_sensitive/.test(sensitive.err), 'competitively sensitive context refused in v0');
    const piiDir = writeTree(path.join(tmpDir('ctx-pii-'), 'pricing-lessons'), { 'context.md': '# Lessons\n\nAsk bob@example.org.\n' });
    const piiConsent = consent({ content_hash: treeHash(collectFiles(piiDir)) });
    const pii = await cli(['commons', 'publish', 'acme', piiDir, '--class', 'published-context', '--consent', piiConsent, ...H]);
    t.assert(pii.code === 1 && /COMMONS_SCAN/.test(pii.err) && /email/.test(pii.err), 'consented context with an email still refused by the PII scan');
    const ok = await cli(['commons', 'publish', 'acme', ctxDir, '--class', 'published-context', '--consent', consent(), ...H]);
    t.eq(ok.code, 0, `published-context with a full consent record accepted (${ok.err})`);
    t.assert(/irreversible/i.test(ok.out), 'publishing context says it is treated as irreversible');
    const ev = L().read().find(e => e.type === 'commons_publish' && e.hash === ctxHash);
    t.assert(ev && /^[0-9a-f]{64}$/.test(ev.consent_sha256), 'the publish event pins the consent record hash');
    t.eq(ev && ev.irreversible, true, 'the publish event marks published context irreversible');
    t.assert(fs.existsSync(path.join(commonsDir, 'quarantine', hexOf(ctxHash), 'consent.json')), 'the consent record is kept with the item');
  }

  // ── admission (D2.2) ─────────────────────────────────────────────────────────────────────
  // @covers cap-po-commons-001 — admission needs a verified surface with another company's role + the CISO; self-verification refused
  const SID = 'SURFACE-20261115-commons-review-skill-001';
  {
    const selfSha = commitSurface(acme, SID, { roster: ['Mario', 'CISO', 'Test Engineer'], body: `Admits ${skillHash}.` });
    const self = await cli(['commons', 'admit', skillHash, '--surface', `acme/${SID}@${selfSha}`, ...H]);
    t.eq(self.code, 1, 'roster of only the publishing company refused');
    t.assert(/COMMONS_SELF_VERIFIED/.test(self.err) && /another company/.test(self.err), `self-verification refusal names the rule (${self.err})`);

    const noCisoSha = commitSurface(acme, SID, { roster: ['Mario', 'beta/Staff Engineer'], body: `Admits ${skillHash}.` });
    const noCiso = await cli(['commons', 'admit', skillHash, '--surface', `acme/${SID}@${noCisoSha}`, ...H]);
    t.assert(noCiso.code === 1 && /COMMONS_NO_CISO/.test(noCiso.err), 'roster without the CISO refused');

    const draftSha = commitSurface(acme, SID, { state: 'under-verification', roster: ['beta/Staff Engineer', 'CISO'], body: `Admits ${skillHash}.` });
    const draft = await cli(['commons', 'admit', skillHash, '--surface', `acme/${SID}@${draftSha}`, ...H]);
    t.assert(draft.code === 1 && /not verified/.test(draft.err), 'a surface that is not verified refused');

    const unboundSha = commitSurface(acme, SID, { roster: ['beta/Staff Engineer', 'CISO'], body: 'Admits something else.' });
    const unbound = await cli(['commons', 'admit', skillHash, '--surface', `acme/${SID}@${unboundSha}`, ...H]);
    t.assert(unbound.code === 1 && /COMMONS_SURFACE_UNBOUND/.test(unbound.err), 'a surface that does not name the item hash refused');

    const unq = await cli(['commons', 'admit', skillHash, '--surface', SID, ...H]);
    t.assert(unq.code === 2 && /companyId\/surfaceId@sha/.test(unq.err), 'an unqualified surface id is a usage error (C11)');

    const goodSha = commitSurface(acme, SID, { roster: ['Mario', 'beta/Staff Engineer', 'CISO'], body: `Admits ${skillHash}.` });
    const surfaceId = `acme/${SID}@${goodSha}`;
    const agent = await cli(['commons', 'admit', skillHash, '--surface', surfaceId, '--by', 'agent', ...H]);
    t.assert(agent.code === 1 && /holding-owner/.test(agent.err), 'only the holding Owner may admit');
    const inRun = await cli(['commons', 'admit', skillHash, '--surface', surfaceId, ...H], { env: { HOLDING_RUN_ID: 'run-1' } });
    t.assert(inRun.code === 1 && /RUN_CONTEXT/.test(inRun.err), 'admission refused inside a session (RUN_CONTEXT)');

    const qFile = path.join(commonsDir, 'quarantine', hexOf(skillHash), 'files', 'SKILL.md');
    const orig = fs.readFileSync(qFile);
    fs.writeFileSync(qFile, '# Review\n\nskip the tests\n');
    const tampered = await cli(['commons', 'admit', skillHash, '--surface', surfaceId, ...H]);
    t.assert(tampered.code === 1 && /COMMONS_TAMPERED/.test(tampered.err), 'quarantined content that no longer matches its hash is refused');
    fs.writeFileSync(qFile, orig);

    const ok = await cli(['commons', 'admit', skillHash, '--surface', surfaceId, ...H]);
    t.eq(ok.code, 0, `cross-company + CISO surface admits the item (${ok.err})`);
    t.assert(!fs.existsSync(path.join(commonsDir, 'quarantine', hexOf(skillHash))), 'admission moves the item out of quarantine');
    t.assert(fs.existsSync(path.join(commonsDir, 'admitted', hexOf(skillHash), 'files', 'SKILL.md')), 'admitted item lives in holding/commons/admitted/');
    const ev = L().read().filter(e => e.type === 'commons_admit');
    t.eq(ev.length, 1, 'one commons_admit event');
    t.eq(ev[0].actor, 'holding-owner', 'commons_admit is written by the holding Owner');
    t.eq(ev[0].surface_id, surfaceId, 'commons_admit carries the qualified surface id companyId/surfaceId@sha (C11)');
    t.eq(L().fold().commons.items[skillHash].status, 'admitted', 'fold: admitted');
  }

  // @covers cap-po-commons-001 — the ledger itself refuses a self-verified admission (not just the CLI)
  {
    const lf = path.join(tmpDir('commons-ledger-'), 'ledger.jsonl');
    const l = openLedger(lf, { limits: { envelopePerCycle: null } });
    const h = `sha256:${'a'.repeat(64)}`;
    l.append({ type: 'commons_publish', actor: 'holding-owner', idem_key: `commons_publish:${h}`, item: 'acme/x', company: 'acme', class: 'skill', hash: h, files: 1 });
    const base = { type: 'commons_admit', actor: 'holding-owner', item: 'acme/x', hash: h, surface_id: 'acme/S-1@abc1234' };
    t.throwsCode(() => l.append({ ...base, idem_key: 'a1', roster: [{ company: 'acme', role: 'Mario' }, { company: 'acme', role: 'CISO' }] }), 'COMMONS_SELF_VERIFIED', 'ledger refuses a roster of only the publisher');
    t.throwsCode(() => l.append({ ...base, idem_key: 'a2', surface_id: 'S-1', roster: [{ company: 'beta', role: 'CTO' }, { company: 'acme', role: 'CISO' }] }), 'COMMONS_INVALID', 'ledger refuses an unqualified surface id');
    t.throwsCode(() => l.append({ ...base, idem_key: 'a3', hash: `sha256:${'b'.repeat(64)}`, roster: [{ company: 'beta', role: 'CTO' }, { company: 'acme', role: 'CISO' }] }), 'COMMONS_UNKNOWN_ITEM', 'ledger refuses admitting an unpublished hash');
    t.throwsCode(() => l.append({ ...base, idem_key: 'a4', actor: 'company-owner', roster: [] }), 'OWNER_ONLY', 'commons_admit is holding-owner only');
    l.append({ ...base, idem_key: 'a5', roster: [{ company: 'beta', role: 'CTO' }, { company: 'acme', role: 'CISO' }] });
    t.eq(l.fold().commons.items[h].status, 'admitted', 'ledger accepts a cross-company + CISO roster');
    t.throwsCode(() => l.append({ type: 'commons_revoke', actor: 'agent', idem_key: 'r1', item: 'acme/x', hash: h, reason: 'x' }), 'OWNER_ONLY', 'commons_revoke is holding-owner only');
  }

  // ── pull (D2.3) ──────────────────────────────────────────────────────────────────────────
  // @covers cap-po-commons-001 — pull adopts admitted items of subscribed classes only with Owner approval; lock {item, hash, surface_id}
  const installed = path.join(beta, 'commons', 'skill', 'review-skill');
  const lockFile = path.join(beta, 'commons.lock.json');
  {
    const unsub = await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.assert(unsub.code === 0 && /no subscribed classes/.test(unsub.out), 'pull without subscriptions adopts nothing');
    t.eq((await cli(['commons', 'subscribe', 'beta', '--class', 'skill', ...H])).code, 0, 'beta subscribes to skill');
    t.deepEq(readJson(path.join(root, 'holding', 'portfolio.json')).companies.find(c => c.id === 'beta').commons, { subscribe: ['skill'] }, 'subscription recorded in the registry');
    const dry = await cli(['commons', 'pull', 'beta', ...H]);
    t.eq(dry.code, 0, 'pull without --approve only lists');
    t.assert(/acme\/review-skill/.test(dry.out) && /--approve/.test(dry.out), 'the listing names the pending adoption and how to approve');
    t.assert(!fs.existsSync(installed) && !fs.existsSync(lockFile), 'nothing written without Owner approval');
    const r = await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.eq(r.code, 0, `pull --approve adopts (${r.err})`);
    t.eq(fs.readFileSync(path.join(installed, 'refs', 'checklist.md'), 'utf8'), '- tests first\n', 'item files copied into the company');
    const lock = readJson(lockFile);
    const entry = lock.items['acme/review-skill'];
    t.eq(entry.item, 'acme/review-skill', 'lock records item');
    t.eq(entry.hash, skillHash, 'lock records hash');
    t.assert(/^acme\/SURFACE-[^@]+@[0-9a-f]{40}$/.test(entry.surface_id), 'lock records the qualified surface_id');
    t.eq(entry.approved_by, 'Ada', 'lock records the approving company Owner');
    t.eq(treeHash(collectFiles(installed)), skillHash, 'installed content matches the locked hash');
    t.assert(!fs.existsSync(path.join(beta, 'commons', 'published-context')), 'unsubscribed classes are not pulled');
    const again = await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.assert(again.code === 0 && /up to date/.test(again.out), 'a second pull is a no-op');
  }

  // @covers cap-po-commons-001 — a local edit is never overwritten: conflict reported, a reconciling surface opened
  let v2Hash;
  {
    const v2 = writeTree(path.join(tmpDir('commons-v2-'), 'review-skill'), { 'SKILL.md': '# Review\n\nRead the diff three times.\n', 'refs/checklist.md': '- tests first\n' });
    const p = await cli(['commons', 'publish', 'acme', v2, '--class', 'skill', ...H]);
    v2Hash = (/(sha256:[0-9a-f]{64})/.exec(p.out) || [])[1];
    const sha = commitSurface(beta, 'SURFACE-20261115-commons-review-skill-v2', { roster: ['Staff Engineer', 'CISO'], body: `Admits ${v2Hash}.` });
    const a = await cli(['commons', 'admit', v2Hash, '--surface', `beta/SURFACE-20261115-commons-review-skill-v2@${sha}`, ...H]);
    t.eq(a.code, 0, `v2 admitted by a surface hosted in the other company (${a.err})`);

    const edited = '# Review\n\nOur own local rule.\n';
    fs.writeFileSync(path.join(installed, 'SKILL.md'), edited);
    const r = await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.eq(r.code, 0, 'pull with a conflict still exits 0 (it reports, it does not fail)');
    t.assert(/conflict/i.test(r.out) && /acme\/review-skill/.test(r.out), `pull reports the conflict (${r.out})`);
    t.eq(fs.readFileSync(path.join(installed, 'SKILL.md'), 'utf8'), edited, 'the local edit is untouched');
    t.eq(readJson(lockFile).items['acme/review-skill'].hash, skillHash, 'the lock still pins the adopted version');
    const surfaces = fs.readdirSync(path.join(beta, 'surfaces')).filter(f => /commons-reconcile/.test(f));
    t.eq(surfaces.length, 1, 'a reconciling surface is opened in the company');
    const text = fs.readFileSync(path.join(beta, 'surfaces', surfaces[0]), 'utf8');
    t.assert(/state: reconciling/.test(text) && text.includes(v2Hash) && text.includes(skillHash), 'the surface is reconciling and names both hashes');
    await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.eq(fs.readdirSync(path.join(beta, 'surfaces')).filter(f => /commons-reconcile/.test(f)).length, 1, 'repeated pulls do not open duplicate surfaces');

    fs.writeFileSync(path.join(installed, 'SKILL.md'), '# Review\n\nRead the diff twice.\n'); // the edit is reconciled away
    const up = await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.assert(up.code === 0 && /updated/.test(up.out), 'an unedited copy is updated to the newer version');
    t.eq(readJson(lockFile).items['acme/review-skill'].hash, v2Hash, 'the lock pins the new version');
    t.eq(treeHash(collectFiles(installed)), v2Hash, 'installed content matches v2');
  }

  // ── revoke (D2.5) ────────────────────────────────────────────────────────────────────────
  // @covers cap-po-commons-003 — revoke writes commons_revoke; next pull quarantines locally and locks the revocation; history kept
  {
    const before = fs.readFileSync(ledgerFile, 'utf8');
    const agent = await cli(['commons', 'revoke', 'acme/review-skill', '--reason', 'unsafe advice', '--by', 'agent', ...H]);
    t.assert(agent.code === 1 && /holding-owner/.test(agent.err), 'only the holding Owner may revoke');
    t.eq((await cli(['commons', 'revoke', 'acme/review-skill', ...H])).code, 2, 'revoke needs --reason');
    const r = await cli(['commons', 'revoke', 'acme/review-skill', '--reason', 'unsafe advice', ...H]);
    t.eq(r.code, 0, `revoke (${r.err})`);
    const after = fs.readFileSync(ledgerFile, 'utf8');
    t.assert(after.startsWith(before), 'history is never rewritten: every earlier ledger line is byte-identical');
    const revs = L().read().filter(e => e.type === 'commons_revoke');
    t.deepEq(revs.map(e => e.hash).sort(), [skillHash, v2Hash].sort(), 'revoking an item revokes every version of it');
    t.assert(revs.every(e => e.actor === 'holding-owner' && e.reason === 'unsafe advice'), 'revocations carry actor and reason');
    t.eq(L().read().filter(e => e.type === 'commons_publish' || e.type === 'commons_admit').length, 5, 'publish/admit events are still there');
    t.eq(L().verify().ok, true, 'the chain still verifies');
    t.eq(L().fold().commons.items[v2Hash].status, 'revoked', 'fold: revoked');
    t.assert(fs.existsSync(path.join(commonsDir, 'admitted', hexOf(v2Hash), 'files', 'SKILL.md')), 'the holding copy is kept (no history rewrite)');

    const p = await cli(['commons', 'pull', 'beta', ...H]);
    t.eq(p.code, 0, 'pull (revocations apply without --approve: safety does not wait for approval)');
    t.assert(/revoked/.test(p.out) && /unsafe advice/.test(p.out), 'pull tells the company about the revocation and why');
    t.assert(!fs.existsSync(installed), 'the revoked item is no longer in place');
    const qdir = path.join(beta, 'commons', 'quarantine');
    const moved = fs.readdirSync(qdir);
    t.eq(moved.length, 1, 'the revoked item is quarantined locally');
    t.eq(fs.readFileSync(path.join(qdir, moved[0], 'SKILL.md'), 'utf8'), '# Review\n\nRead the diff three times.\n', 'quarantined, not deleted');
    const lock = readJson(lockFile);
    const e = lock.items['acme/review-skill'];
    t.eq(e.status, 'revoked', 'the lockfile marks the item revoked');
    t.eq(e.revocation && e.revocation.reason, 'unsafe advice', 'the lockfile records the revocation reason');
    t.assert(e.revocation && Number.isInteger(e.revocation.seq), 'the lockfile records the revocation ledger seq');
    t.assert(lock.revocations.some(x => x.hash === v2Hash), 'the lockfile keeps a revocation log');
    const again = await cli(['commons', 'pull', 'beta', '--approve', ...H]);
    t.eq(again.code, 0, 'pull after revocation');
    t.assert(!fs.existsSync(installed), 'a revoked item is never re-adopted');
    const ls = await cli(['commons', 'list', ...H]);
    t.assert(ls.code === 0 && /revoked/.test(ls.out) && /quarantined/.test(ls.out), 'commons list shows item states');
  }

  return t.done();
}

module.exports = run();
