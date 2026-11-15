'use strict';

/**
 * commons/store.js — the holding's commons store: publish → quarantine → admit, and revoke.
 *
 * Layout (under holding/, 0700 under the Owner's user, D7 — the sandbox user cannot reach it):
 *   holding/commons/quarantine/<hex>/   published, not yet admitted
 *   holding/commons/admitted/<hex>/     admitted (and kept after revocation: history is not rewritten)
 *     manifest.json   { schema_version, item, company, class, name, hash, files: [{ path, sha256 }] }
 *     consent.json    published-context only: the CLO consent record as given
 *     files/<rel>     the item content, LF-normalized (so it re-hashes to <hash>)
 * <hex> is the tree hash without its "sha256:" prefix (content addressing, Mario C10).
 *
 * Order of effects (crash safety): files are placed first, then the ledger event, then (admit) the
 * directory move. A crash leaves at worst a content-addressed directory with no event (ignored) or an
 * admitted event whose directory is still in quarantine; re-running the same command completes it
 * (the ledger answers duplicate, the move happens).
 */

const fs = require('fs');
const path = require('path');
const { canonicalize } = require('../canonical');
const { fail, collectFiles, treeHash, sha256Hex, HASH_RE } = require('./treehash');
const { CLASSES, policyFindings, consentProblems } = require('./policy');
const { scanFiles, formatFindings } = require('./scan');
const { checkAdmissionSurface } = require('./surface');

const NAME_RE = /^(?!\.{1,2}$)[A-Za-z0-9._-]+$/;
const MANIFEST_SCHEMA = 1;

const hexOf = (hash) => hash.replace(/^sha256:/, '');
function commonsPaths(holdingDir) {
  const root = path.join(holdingDir, 'holding', 'commons');
  return { root, quarantine: path.join(root, 'quarantine'), admitted: path.join(root, 'admitted') };
}
const itemsOf = (state) => (state.commons && state.commons.items) || {};

function writeFiles(dir, files) {
  for (const f of files) {
    const dest = path.join(dir, 'files', ...f.rel.split('/'));
    fs.mkdirSync(path.dirname(dest), { recursive: true, mode: 0o700 });
    fs.writeFileSync(dest, f.content, { mode: 0o600 });
  }
}

/** Re-hash a stored item directory; throws COMMONS_TAMPERED when it no longer matches. */
function verifyStored(dir, hash) {
  if (!fs.existsSync(path.join(dir, 'files'))) fail('COMMONS_MISSING', `${dir} has no files/`);
  const actual = treeHash(collectFiles(path.join(dir, 'files')));
  if (actual !== hash) fail('COMMONS_TAMPERED', `${dir} hashes to ${actual}, not ${hash}; the stored item was changed after publication`);
}

/**
 * Publish an item into quarantine. opts = { L, holdingDir, company: { id, owner }, src, cls, name?,
 * consent? (parsed object), actor }. Returns { hash, item, duplicate, event }.
 */
function publishItem({ L, holdingDir, company, src, cls, name, consent, actor = 'holding-owner' }) {
  if (!CLASSES.includes(cls)) fail('COMMONS_INVALID', `class must be one of ${CLASSES.join(', ')}`);
  const abs = path.resolve(src);
  if (!fs.existsSync(abs)) fail('COMMONS_INVALID', `${abs} does not exist`);
  const itemName = name || path.basename(abs);
  if (!NAME_RE.test(itemName)) fail('COMMONS_INVALID', `item name ${JSON.stringify(itemName)} must be letters, digits, ".", "_" or "-"`);
  const files = collectFiles(abs);

  const forbidden = policyFindings(files);
  if (forbidden.length) {
    fail('COMMONS_FORBIDDEN', `the commons carries knowledge, never control; refused: ${forbidden.map(f => `${f.file} (${f.reason})`).join(', ')}`);
  }
  const hash = treeHash(files);
  let consentSha = null;
  if (cls === 'published-context') {
    if (consent === undefined || consent === null) fail('CONSENT_REQUIRED', 'published-context needs --consent <file.json> (the CLO consent record signed by the company Owner)');
    const problems = consentProblems(consent, { hash, company: company.id, owner: company.owner });
    if (problems.length) fail('CONSENT_INVALID', `consent record refused: ${problems.join('; ')}`);
    consentSha = sha256Hex(Buffer.from(canonicalize(consent)));
  }
  const findings = scanFiles(files);
  if (findings.length) fail('COMMONS_SCAN', `secret/PII scan found ${formatFindings(findings)}; remove them and publish again (values are not shown)`);

  const item = `${company.id}/${itemName}`;
  const existing = itemsOf(L.fold())[hash];
  if (existing && existing.item !== item) fail('COMMONS_DUPLICATE', `this content is already in the commons as ${existing.item}`);

  const P = commonsPaths(holdingDir);
  fs.mkdirSync(P.quarantine, { recursive: true, mode: 0o700 });
  const final = path.join(P.quarantine, hexOf(hash));
  const placed = !(existing && existing.status !== 'quarantined') && !fs.existsSync(final);
  if (placed) {
    const tmp = path.join(P.quarantine, `.tmp-${hexOf(hash).slice(0, 16)}-${process.pid}`);
    fs.rmSync(tmp, { recursive: true, force: true });
    fs.mkdirSync(tmp, { mode: 0o700 });
    writeFiles(tmp, files);
    const manifest = { schema_version: MANIFEST_SCHEMA, item, company: company.id, class: cls, name: itemName, hash,
      files: files.map(f => ({ path: f.rel, sha256: sha256Hex(f.content) })) };
    fs.writeFileSync(path.join(tmp, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
    if (consent) fs.writeFileSync(path.join(tmp, 'consent.json'), `${JSON.stringify(consent, null, 2)}\n`, { mode: 0o600 });
    fs.renameSync(tmp, final);
  }
  const ev = { type: 'commons_publish', actor, idem_key: `commons_publish:${hash}`, item, company: company.id, class: cls, hash, files: files.length };
  if (consentSha) Object.assign(ev, { consent_sha256: consentSha, irreversible: true });
  let r;
  try { r = L.append(ev); } catch (err) {
    if (placed) fs.rmSync(final, { recursive: true, force: true }); // no event: the commons never saw it
    throw err;
  }
  return { hash, item, duplicate: !!r.duplicate, event: r.event };
}

/** Admit a quarantined item. companies = { id: clonePath }. Returns { item, hash, surface_id, duplicate }. */
function admitItem({ L, holdingDir, hash, surfaceId, companies, actor = 'holding-owner' }) {
  if (!HASH_RE.test(String(hash))) fail('COMMONS_INVALID', `${JSON.stringify(hash)} is not a sha256: tree hash`);
  const it = itemsOf(L.fold())[hash] || fail('COMMONS_UNKNOWN_ITEM', `no commons item ${hash} was published`);
  const P = commonsPaths(holdingDir);
  const q = path.join(P.quarantine, hexOf(hash));
  const a = path.join(P.admitted, hexOf(hash));
  if (it.status === 'admitted' && !fs.existsSync(q)) return { item: it.item, hash, surface_id: it.surface_id, duplicate: true };
  if (it.status === 'revoked') fail('COMMONS_STATE', `${it.item} ${hash} is revoked`);
  verifyStored(q, hash);
  if (it.consent_sha256) {
    let c;
    try { c = JSON.parse(fs.readFileSync(path.join(q, 'consent.json'), 'utf8')); } catch { fail('COMMONS_TAMPERED', `${q}/consent.json is missing or unreadable`); }
    if (sha256Hex(Buffer.from(canonicalize(c))) !== it.consent_sha256) fail('COMMONS_TAMPERED', `${q}/consent.json no longer matches the published consent record`);
  }
  let surface;
  if (it.status === 'admitted') surface = { surface_id: it.surface_id };
  else {
    surface = checkAdmissionSurface({ surfaceId, hash, publisher: it.company, companies });
    L.append({ type: 'commons_admit', actor, idem_key: `commons_admit:${hash}`, item: it.item, hash, surface_id: surface.surface_id, roster: surface.roster });
  }
  fs.mkdirSync(P.admitted, { recursive: true, mode: 0o700 });
  if (fs.existsSync(a)) fs.rmSync(q, { recursive: true, force: true }); else fs.renameSync(q, a);
  return { item: it.item, hash, surface_id: surface.surface_id, duplicate: it.status === 'admitted' };
}

/**
 * Revoke by `company/name` (every live version), `company/name@sha256:…` or `sha256:…`.
 * Returns the revoke events written. Nothing is deleted: the holding copy stays for the record.
 */
function revokeItem({ L, target, reason, actor = 'holding-owner' }) {
  const items = Object.values(itemsOf(L.fold()));
  const at = String(target).indexOf('@sha256:');
  const want = at > 0 ? { item: target.slice(0, at), hash: target.slice(at + 1) }
    : HASH_RE.test(target) ? { hash: target } : { item: target };
  const hits = items.filter(it => (!want.item || it.item === want.item) && (!want.hash || it.hash === want.hash));
  if (hits.length === 0) fail('COMMONS_UNKNOWN_ITEM', `no commons item ${target}`);
  const live = hits.filter(it => it.status !== 'revoked');
  if (live.length === 0) fail('COMMONS_STATE', `${target} is already revoked`);
  return live.map(it => L.append({ type: 'commons_revoke', actor, idem_key: `commons_revoke:${it.hash}`, item: it.item, hash: it.hash, reason }).event);
}

module.exports = { commonsPaths, hexOf, itemsOf, verifyStored, publishItem, admitItem, revokeItem };
