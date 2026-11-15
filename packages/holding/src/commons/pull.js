'use strict';

/**
 * commons/pull.js — a company adopts admitted commons items (cap-po-commons-001, cap-po-commons-003).
 *
 * Pull-only: nothing is pushed into a company. A company pulls the admitted items of the classes it
 * subscribes to (portfolio.json companies[].commons.subscribe). Every adoption or update needs the
 * Owner's approval (`approve: true`); without it, pull only lists what it would do.
 *
 * In the company clone:
 *   commons/<class>/<name>/...        adopted item files
 *   commons/quarantine/<name>@<hex12>  revoked items, moved here (never deleted)
 *   commons.lock.json                  { schema_version, company, items: { <item>: { item, hash, surface_id, class, path,
 *                                       status: adopted|revoked, approved_by, adopted_at, admit_seq, revocation? } },
 *                                       revocations: [...] }
 *
 * Never overwritten: a local copy whose tree hash differs from the locked hash (a local edit), or an
 * unlocked directory in the target place, is a conflict. Pull leaves it untouched, reports it, and
 * (with approval) opens a `reconciling` §34 surface in the company naming the locked, local and
 * incoming hashes.
 *
 * Revocations are applied on every pull, approved or not (safety does not wait for an approval):
 * a locked item whose hash the ledger has revoked is moved to commons/quarantine/ and the lockfile
 * records the revocation. The ledger and the holding copy are never rewritten.
 */

const fs = require('fs');
const path = require('path');
const { fail, collectFiles, treeHash } = require('./treehash');
const { commonsPaths, hexOf, itemsOf, verifyStored } = require('./store');

const LOCK_SCHEMA = 1;
const LOCK_NAME = 'commons.lock.json';

function readLock(companyPath, companyId) {
  assertNoSymlink(companyPath, LOCK_NAME);
  const file = path.join(companyPath, LOCK_NAME);
  if (!fs.existsSync(file)) return { schema_version: LOCK_SCHEMA, company: companyId, items: {}, revocations: [] };
  let lock;
  try { lock = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { fail('COMMONS_LOCK', `${file} is not valid JSON (${e.message}); fix it by hand`); }
  if (!lock || lock.schema_version !== LOCK_SCHEMA || typeof lock.items !== 'object') fail('COMMONS_LOCK', `${file} is not a schema ${LOCK_SCHEMA} commons lock`);
  lock.revocations = lock.revocations || [];
  return lock;
}
function writeLock(companyPath, lock) {
  assertNoSymlink(companyPath, LOCK_NAME);
  const file = path.join(companyPath, LOCK_NAME);
  const tmp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(tmp, `${JSON.stringify(lock, null, 2)}\n`);
  fs.renameSync(tmp, file);
}

/**
 * The company clone is writable by the sandbox user (D7), so nothing in it is trusted to steer an
 * Owner-run pull: target paths are derived from the ledger (class + item name), never from the
 * lockfile, and no path component under the clone may be a symlink (it could redirect a write or
 * a move to the Owner's own files).
 */
function assertNoSymlink(companyPath, rel) {
  let cur = companyPath;
  for (const seg of rel.split('/')) {
    cur = path.join(cur, seg);
    let st;
    try { st = fs.lstatSync(cur); } catch { return; } // the rest does not exist yet
    if (st.isSymbolicLink()) fail('COMMONS_SYMLINK', `${cur} is a symlink; pull never writes through links (remove it and pull again)`);
  }
}
const relFor = (it) => `commons/${it.class}/${it.item.split('/')[1]}`;

const localHash = (dir) => {
  if (!fs.existsSync(dir)) return null;
  try { return treeHash(collectFiles(dir)); } catch (e) { return `unreadable (${e.code || e.message})`; }
};

function install(storeDir, dest) {
  const files = collectFiles(path.join(storeDir, 'files'));
  const tmp = `${dest}.tmp-${process.pid}`;
  fs.rmSync(tmp, { recursive: true, force: true });
  for (const f of files) {
    const p = path.join(tmp, ...f.rel.split('/'));
    fs.mkdirSync(path.dirname(p), { recursive: true });
    fs.writeFileSync(p, f.content, { mode: 0o644 });
  }
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.rmSync(dest, { recursive: true, force: true }); // only reached when dest is absent or matches the lock
  fs.renameSync(tmp, dest);
}

function moveAside(companyPath, rel, label) {
  assertNoSymlink(companyPath, rel);
  assertNoSymlink(companyPath, 'commons/quarantine');
  const src = path.join(companyPath, rel);
  if (!fs.existsSync(src)) return null;
  const qdir = path.join(companyPath, 'commons', 'quarantine');
  fs.mkdirSync(qdir, { recursive: true });
  let dest = path.join(qdir, label); let n = 1;
  while (fs.existsSync(dest)) dest = path.join(qdir, `${label}.${++n}`);
  fs.renameSync(src, dest);
  return path.relative(companyPath, dest).split(path.sep).join('/');
}

/** Open (once per incoming hash) a reconciling §34 surface for a conflict. Returns its relative path. */
function openReconcilingSurface(companyPath, c, now) {
  const rel = fs.existsSync(path.join(companyPath, 'project', 'surfaces')) ? 'project/surfaces' : 'surfaces';
  assertNoSymlink(companyPath, rel);
  const dir = path.join(companyPath, rel);
  const name = c.item.split('/')[1];
  const suffix = `commons-reconcile-${name}-${hexOf(c.incoming).slice(0, 8)}`;
  fs.mkdirSync(dir, { recursive: true });
  const existing = fs.readdirSync(dir).find(f => f.endsWith(`-${suffix}.md`));
  if (existing) return path.relative(companyPath, path.join(dir, existing)).split(path.sep).join('/');
  const id = `SURFACE-${now.slice(0, 10).replace(/-/g, '')}-${suffix}`;
  const body = `---\nsurface:\n  id: ${id}\n  kind: decision\n  title: Reconcile a local edit of commons item ${c.item}\n`
    + '  author_roles: [holding-commons]\n  verifier_roster: [Owner]\n  state: reconciling\n  irreversible: false\n---\n\n'
    + `# Reconcile ${c.item}\n\n`
    + `The commons has a newer admitted version of \`${c.item}\`, but the local copy at \`${c.path}\` was edited.\n`
    + 'Pull never overwrites a local edit, so nothing was changed.\n\n'
    + `- locked (adopted) hash: \`${c.locked}\`\n- local hash: \`${c.local}\`\n- incoming hash: \`${c.incoming}\` (surface ${c.surface_id})\n\n`
    + 'Resolve by either reverting the local edit (the next approved pull updates it) or keeping it and leaving the lock pinned.\n';
  fs.writeFileSync(path.join(dir, `${id}.md`), body);
  return path.relative(companyPath, path.join(dir, `${id}.md`)).split(path.sep).join('/');
}

/**
 * Pull for one company. opts = { state (ledger fold), holdingDir, company: { id, path, owner, commons? },
 * approve, now? }. Returns { subscribed, revoked, adopted, updated, upToDate, pending, conflicts }.
 */
function pullCompany({ state, holdingDir, company, approve = false, now = new Date().toISOString() }) {
  if (!fs.existsSync(company.path)) fail('COMMONS_PULL', `${company.id} clone not found at ${company.path}`);
  const subscribed = (company.commons && Array.isArray(company.commons.subscribe)) ? company.commons.subscribe : [];
  const items = Object.values(itemsOf(state));
  const lock = readLock(company.path, company.id);
  const out = { subscribed, revoked: [], adopted: [], updated: [], upToDate: [], pending: [], conflicts: [] };

  // 1. revocations (always)
  for (const entry of Object.values(lock.items)) {
    if (entry.status === 'revoked') continue;
    const it = items.find(x => x.hash === entry.hash && x.item === entry.item);
    if (!it || it.status !== 'revoked') continue;
    const to = moveAside(company.path, relFor(it), `${it.item.split('/')[1]}@${hexOf(it.hash).slice(0, 12)}`);
    const revocation = { hash: entry.hash, seq: it.revoked_seq, reason: it.revoke_reason, quarantined_to: to, recorded_at: now };
    Object.assign(entry, { status: 'revoked', revocation });
    lock.revocations.push({ item: entry.item, ...revocation });
    out.revoked.push({ item: entry.item, ...revocation });
    writeLock(company.path, lock);
  }

  // 2. latest admitted, non-revoked version per item in a subscribed class
  const latest = {};
  for (const it of items) {
    if (it.status !== 'admitted' || !subscribed.includes(it.class)) continue;
    if (!latest[it.item] || it.admitted_seq > latest[it.item].admitted_seq) latest[it.item] = it;
  }
  for (const it of Object.values(latest).sort((a, b) => a.admitted_seq - b.admitted_seq)) {
    const rel = relFor(it);
    assertNoSymlink(company.path, rel);
    const dest = path.join(company.path, rel);
    const entry = lock.items[it.item];
    const live = entry && entry.status !== 'revoked';
    if (live && entry.hash === it.hash) { out.upToDate.push({ item: it.item, hash: it.hash }); continue; }
    const local = localHash(dest);
    const expected = live ? entry.hash : null;
    if (local !== expected) {
      const c = { item: it.item, path: rel, locked: expected, local, incoming: it.hash, surface_id: it.surface_id };
      if (approve) c.surface = openReconcilingSurface(company.path, c, now);
      out.conflicts.push(c);
      continue;
    }
    const action = live ? 'update' : 'adopt';
    if (!approve) { out.pending.push({ action, item: it.item, hash: it.hash, class: it.class, surface_id: it.surface_id }); continue; }
    const store = path.join(commonsPaths(holdingDir).admitted, hexOf(it.hash));
    verifyStored(store, it.hash);
    install(store, dest);
    lock.items[it.item] = { item: it.item, hash: it.hash, surface_id: it.surface_id, class: it.class, path: rel, status: 'adopted',
      approved_by: company.owner, adopted_at: now, admit_seq: it.admitted_seq, ...(live ? { previous_hash: entry.hash } : {}) };
    writeLock(company.path, lock);
    (live ? out.updated : out.adopted).push({ item: it.item, hash: it.hash, path: rel });
  }
  return out;
}

module.exports = { pullCompany, readLock, LOCK_NAME };
