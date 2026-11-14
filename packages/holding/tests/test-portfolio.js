'use strict';

// portfolio.json (schema 1) validator: registry entries, Owner rules, C7 path pinning.

const fs = require('fs');
const path = require('path');
const { validatePortfolio, loadPortfolio, SECOND_OWNER_GATES } = require('../src/portfolio');
const { createSuite, tmpDir } = require('./_helpers');

const t = createSuite('portfolio');
const root = tmpDir('holding-portfolio-');
const holdingDir = path.join(root, 'holding-repo');
const company = (id, extra = {}) => ({
  id, name: id, owner: 'matias', path: path.join(root, 'companies', id),
  sdkPath: path.join(root, 'sdk', 'team-sdk@4.9.0'), runner: 'local', ...extra,
});
const doc = (companies, extra = {}) => ({
  schema_version: 1, holding: { owner: 'matias' }, companies,
  second_owner_gates: { os_isolation: false, multi_owner_charter_amendment: false, clo_gate_items: false }, ...extra,
});
const opts = { holdingDir };
const SIGNED = '- **Ratified by: Matias Bargas (Owner) on 2026-11-20**\n';
const UNSIGNED = '- **Ratified by: __________________________ (Owner) on __________**\n';
// Every company clone used below gets a ratified CHARTER.md unless a test says otherwise.
function writeCharter(dir, text = SIGNED) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'CHARTER.md'), `# Charter\n\n## Ratification\n\n${text}`);
}
for (const id of ['acme', 'beta', 'gamma', 'other']) writeCharter(path.join(root, 'companies', id));

// @covers cap-po-registry-001 — a valid registry passes
{
  t.deepEq(validatePortfolio(doc([company('acme'), company('beta')]), opts), { ok: true, errors: [] }, 'two well-formed companies');
}

// @covers cap-po-registry-001 — a company missing `owner` fails, naming the company and the field
{
  const { owner, ...noOwner } = company('beta');
  const r = validatePortfolio(doc([company('acme'), noOwner]), opts);
  t.eq(r.ok, false, 'validation fails');
  const e = r.errors.find(x => x.field === 'owner');
  t.assert(e && e.company === 'beta', 'error names company beta and field owner');
  t.assert(e && e.message.includes('beta') && e.message.includes('owner'), 'message names both');
  for (const f of ['id', 'path', 'sdkPath', 'runner']) {
    const c = company('gamma'); delete c[f];
    const rr = validatePortfolio(doc([c]), opts);
    t.assert(!rr.ok && rr.errors.some(x => x.field === f), `missing ${f} fails`);
  }
  t.eq(validatePortfolio(doc([company('acme', { runner: 'cloud' })]), opts).ok, false, 'unknown runner rejected (v0: local)');
  t.eq(validatePortfolio(doc([company('acme'), company('acme')]), opts).ok, false, 'duplicate company id rejected');
  t.eq(validatePortfolio({ ...doc([]), schema_version: 2 }, opts).ok, false, 'unknown schema_version rejected');
  t.eq(validatePortfolio({ ...doc([]), holding: {} }, opts).ok, false, 'holding owner required');
  t.eq(validatePortfolio(doc('nope'), opts).ok, false, 'companies must be an array');
}

// @covers cap-po-registry-002 — a company with a different Owner is refused, naming each unmet gate
{
  const r = validatePortfolio(doc([company('acme'), company('other', { owner: 'someone-else' })]), opts);
  t.eq(r.ok, false, 'second Owner refused');
  const gateErrors = r.errors.filter(e => e.company === 'other' && e.gate);
  t.deepEq(gateErrors.map(e => e.gate), SECOND_OWNER_GATES, 'each unmet gate named');
  const partial = validatePortfolio(doc([company('other', { owner: 'x' })], {
    second_owner_gates: { os_isolation: true, multi_owner_charter_amendment: false, clo_gate_items: true } }), opts);
  t.deepEq(partial.errors.map(e => e.gate), ['multi_owner_charter_amendment'], 'only the unmet gate named');
  const allMet = validatePortfolio(doc([company('other', { owner: 'x' })], {
    second_owner_gates: { os_isolation: true, multi_owner_charter_amendment: true, clo_gate_items: true } }), opts);
  t.eq(allMet.ok, true, 'accepted once every gate is met');
  const truthy = validatePortfolio(doc([company('other', { owner: 'x' })], {
    second_owner_gates: { os_isolation: 'yes', multi_owner_charter_amendment: 1, clo_gate_items: true } }), opts);
  t.eq(truthy.ok, false, 'a gate is met only by literal true');
}

// @covers cap-po-registry-002 — a company whose CHARTER is missing or unratified is refused
{
  const draftDir = path.join(root, 'companies', 'draft');
  writeCharter(draftDir, UNSIGNED);
  const r = validatePortfolio(doc([company('acme'), company('draft')]), opts);
  t.eq(r.ok, false, 'unsigned ratification line refused');
  t.assert(r.errors.some(e => e.company === 'draft' && e.field === 'charter' && e.message.includes('draft')), 'error names the company and the charter');
  const missing = validatePortfolio(doc([company('ghost')]), opts);
  t.assert(!missing.ok && missing.errors.some(e => e.company === 'ghost' && e.field === 'charter'), 'missing CHARTER.md refused');
  writeCharter(draftDir, SIGNED);
  t.eq(validatePortfolio(doc([company('draft')]), opts).ok, true, 'accepted once the Owner signs the ratification line');
}

// @covers cap-po-registry-001 — C7: absolute pinned paths; the holding repo is never a parent of a company clone (or vice versa)
{
  const inside = validatePortfolio(doc([company('acme', { path: path.join(holdingDir, 'companies', 'acme') })]), opts);
  t.assert(!inside.ok && inside.errors.some(e => e.field === 'path'), 'company inside the holding repo rejected');
  const parent = validatePortfolio(doc([company('acme', { path: root })]), opts);
  t.assert(!parent.ok && parent.errors.some(e => e.field === 'path'), 'company containing the holding repo rejected');
  const same = validatePortfolio(doc([company('acme', { path: holdingDir })]), opts);
  t.eq(same.ok, false, 'company at the holding repo path rejected');
  const nested = validatePortfolio(doc([company('acme'), company('beta', { path: path.join(root, 'companies', 'acme', 'beta') })]), opts);
  t.eq(nested.ok, false, 'a company clone nested in another company rejected');
  t.eq(validatePortfolio(doc([company('acme', { path: 'companies/acme' })]), opts).ok, false, 'relative company path rejected');
  t.eq(validatePortfolio(doc([company('acme', { sdkPath: '../team-sdk' })]), opts).ok, false, 'relative sdkPath rejected (must be pinned)');
  writeCharter(holdingDir + '-sibling');
  t.eq(validatePortfolio(doc([company('acme', { path: holdingDir + '-sibling' })]), opts).ok, true, 'a sibling with a shared name prefix is fine');
  // symlinked parent: a path that resolves into the holding repo is still inside it
  fs.mkdirSync(path.join(holdingDir, 'x'), { recursive: true });
  fs.symlinkSync(holdingDir, path.join(root, 'link-to-holding'));
  const viaLink = validatePortfolio(doc([company('acme', { path: path.join(root, 'link-to-holding', 'x') })]), opts);
  t.eq(viaLink.ok, false, 'a path that resolves into the holding repo through a symlink rejected');
  t.throwsCode(() => validatePortfolio(doc([]), {}), 'HOLDING_DIR_REQUIRED', 'validator needs the holding dir');
}

// @covers cap-po-registry-001 — loadPortfolio reads a file and validates; unreadable JSON is an error, not a crash
{
  const f = path.join(root, 'portfolio.json');
  fs.writeFileSync(f, JSON.stringify(doc([company('acme')])));
  t.eq(loadPortfolio(f, opts).ok, true, 'valid file loads');
  fs.writeFileSync(f, '{ nope');
  const r = loadPortfolio(f, opts);
  t.eq(r.ok, false, 'invalid JSON reported');
  t.assert(r.errors[0].field === 'portfolio.json', 'error points at the file');
}

module.exports = t.done();
