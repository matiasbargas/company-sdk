'use strict';

/**
 * proofs.js — deterministic proof checks against a company repository (Level 3: commit SHA +
 * state, never an opinion on content). cap-po-proof-001, cap-po-proof-003.
 *
 * A named proof { kind, ref } holds at commit S when, reading files *at S* (git show S:path):
 *   verified_surface     ref company/<SURFACE-ID>        surfaces/<ID>.md or project/surfaces/<ID>.md
 *                        front-matter `id` equals <ID> and `state: verified` (§34)
 *   graduated_cycle      ref company/<loop>/<N>           iterations/<loop>/iter-NNN.md (or project/…)
 *                        ref company/implementation/<pod>/<N> for pod loops;
 *                        front-matter `cycle: N` and `status: graduated` (§31)
 *   owner_approved_ship  ref company/<ship-id>            history.md or project/history.md has a
 *                        DECISION block naming <ship-id> with a signed `Human approved by:` line (§6)
 *
 * Revert (cap-po-proof-003): walking the first `windowCommits` commits after the proof SHA on
 * HEAD's history, the first commit where the proof no longer holds is a revert; a proof SHA that
 * is no longer an ancestor of HEAD (history rewritten) is a revert too. Changes after the window
 * are not reverts. Git is only ever read here (rev-parse, show, rev-list, merge-base).
 */

const { execFileSync } = require('child_process');

class ProofError extends Error {
  constructor(code, message) { super(`${code}: ${message}`); this.code = code; }
}
const fail = (code, message) => { throw new ProofError(code, message); };

const LOOPS = ['discovery', 'architecture', 'implementation'];
const SEG_RE = /^[A-Za-z0-9._-]+$/;
const isSafeSeg = (s) => SEG_RE.test(s) && s !== '.' && s !== '..';

function git(repo, args) {
  return execFileSync('git', ['-C', repo, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
}

/** Full commit SHA for a revision, or null when it does not name a commit in the repo. */
function resolveCommit(repo, rev = 'HEAD') {
  if (typeof rev !== 'string' || !/^[A-Za-z0-9._\/~^-]+$/.test(rev) || rev.startsWith('-')) return null;
  try { return git(repo, ['rev-parse', '--verify', '--quiet', `${rev}^{commit}`]).trim() || null; } catch { return null; }
}

/** File content at a commit, or null if absent. */
function readAt(repo, sha, rel) {
  try { return git(repo, ['show', `${sha}:${rel}`]); } catch { return null; }
}

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/.exec(text);
  return m ? m[1] : null;
}
const fmValue = (fm, key) => {
  const m = new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n#]*?)["']?\\s*(?:#.*)?$`, 'm').exec(fm);
  return m ? m[1].trim() : null;
};

/** Split a company-qualified ref into its segments after the company id, or a reason. */
function localSegments(companyId, ref) {
  if (typeof ref !== 'string') return { reason: 'ref must be a string' };
  const parts = ref.split('/');
  if (parts[0] !== companyId) return { reason: `ref ${ref} does not belong to company ${companyId}` };
  const rest = parts.slice(1);
  if (rest.length === 0 || !rest.every(isSafeSeg)) return { reason: `ref ${ref} is not a safe company-qualified id` };
  return { rest };
}

// Each checker: (repo, sha, segments) → { ok, file?, reason }
const CHECKERS = {
  verified_surface(repo, sha, rest) {
    if (rest.length !== 1) return { ok: false, reason: 'a surface ref is company/<SURFACE-ID>' };
    const id = rest[0];
    for (const rel of [`surfaces/${id}.md`, `project/surfaces/${id}.md`]) {
      const text = readAt(repo, sha, rel);
      if (text === null) continue;
      const fm = frontMatter(text);
      if (!fm) return { ok: false, file: rel, reason: `${rel} has no front-matter` };
      const fid = fmValue(fm, 'id');
      if (fid !== id) return { ok: false, file: rel, reason: `${rel} front-matter id is ${JSON.stringify(fid)}, not ${id}` };
      const state = fmValue(fm, 'state');
      if (state !== 'verified') return { ok: false, file: rel, reason: `${rel} state is ${JSON.stringify(state)}, not verified` };
      return { ok: true, file: rel, reason: `${id} verified` };
    }
    return { ok: false, reason: `no surface ${id} at ${sha.slice(0, 12)} (looked in surfaces/ and project/surfaces/)` };
  },

  graduated_cycle(repo, sha, rest) {
    const loop = rest[0];
    const cycleStr = rest[rest.length - 1];
    const pod = rest.length === 3 ? rest[1] : null;
    const shapeOk = LOOPS.includes(loop) && /^[1-9][0-9]{0,4}$/.test(cycleStr) &&
      (rest.length === 2 || (rest.length === 3 && loop === 'implementation'));
    if (!shapeOk) return { ok: false, reason: 'a cycle ref is company/<discovery|architecture>/<N> or company/implementation/<pod>/<N>' };
    const file = `iter-${cycleStr.padStart(3, '0')}.md`;
    const dir = pod ? `iterations/${loop}/${pod}` : `iterations/${loop}`;
    for (const rel of [`${dir}/${file}`, `project/${dir}/${file}`]) {
      const text = readAt(repo, sha, rel);
      if (text === null) continue;
      const fm = frontMatter(text);
      if (!fm) return { ok: false, file: rel, reason: `${rel} has no front-matter` };
      if (fmValue(fm, 'cycle') !== cycleStr) return { ok: false, file: rel, reason: `${rel} cycle is ${fmValue(fm, 'cycle')}, not ${cycleStr}` };
      const status = fmValue(fm, 'status');
      if (status !== 'graduated') return { ok: false, file: rel, reason: `${rel} status is ${JSON.stringify(status)}, not graduated` };
      return { ok: true, file: rel, reason: `${loop}${pod ? `/${pod}` : ''} cycle ${cycleStr} graduated` };
    }
    return { ok: false, reason: `no iteration ${dir}/${file} at ${sha.slice(0, 12)}` };
  },

  owner_approved_ship(repo, sha, rest) {
    if (rest.length !== 1) return { ok: false, reason: 'a ship ref is company/<ship-id>' };
    const id = rest[0];
    const token = new RegExp(`(^|[^A-Za-z0-9._-])${id.replace(/[.]/g, '\\.')}($|[^A-Za-z0-9._-])`);
    for (const rel of ['history.md', 'project/history.md']) {
      const text = readAt(repo, sha, rel);
      if (text === null) continue;
      const blocks = text.split(/^(?=DECISION:)/m).filter(b => b.startsWith('DECISION:'));
      let unsigned = false;
      for (const b of blocks) {
        if (!token.test(b)) continue;
        const m = /^Human approved by:\s*(.*)$/m.exec(b);
        const who = m ? m[1].trim() : '';
        if (who && /[A-Za-z]/.test(who) && !/^\[.*\]$/.test(who) && !/^_+/.test(who)) {
          return { ok: true, file: rel, reason: `${id} approved by ${who}` };
        }
        unsigned = true;
      }
      return { ok: false, file: rel, reason: unsigned ? `the DECISION naming ${id} in ${rel} has no signed "Human approved by:" line`
        : `no DECISION block in ${rel} names ${id}` };
    }
    return { ok: false, reason: `no history.md at ${sha.slice(0, 12)}` };
  },
};

/** Does `named` hold at a commit (already resolved)? */
function checkAt(repo, companyId, named, sha) {
  const checker = CHECKERS[named && named.kind];
  if (!checker) return { ok: false, reason: `unknown proof kind ${JSON.stringify(named && named.kind)}` };
  const seg = localSegments(companyId, named.ref);
  if (seg.reason) return { ok: false, reason: seg.reason };
  return checker(repo, sha, seg.rest);
}

/** Check a named proof at a revision (default HEAD). Returns { ok, sha, file?, reason }. */
function verifyProof(repo, companyId, named, rev = 'HEAD') {
  const sha = resolveCommit(repo, rev);
  if (!sha) return { ok: false, sha: null, reason: `${rev} is not a commit in ${repo}` };
  return { ...checkAt(repo, companyId, named, sha), sha };
}

/**
 * Was a recorded proof { kind, ref, sha } reverted within `windowCommits` commits?
 * Returns null, or { at_sha, commits_after, reason }.
 */
function findRevert(repo, companyId, recorded, windowCommits) {
  const head = resolveCommit(repo, 'HEAD');
  const sha = resolveCommit(repo, recorded.sha);
  if (!head || !sha) return { at_sha: head, commits_after: null, reason: `proof commit ${recorded.sha} is no longer in the repository` };
  try { git(repo, ['merge-base', '--is-ancestor', sha, head]); } catch {
    return { at_sha: head, commits_after: null, reason: `proof commit ${sha.slice(0, 12)} is no longer an ancestor of HEAD (history rewritten)` };
  }
  const after = git(repo, ['rev-list', '--reverse', '--first-parent', `${sha}..${head}`]).split('\n').filter(Boolean);
  const n = Math.min(after.length, windowCommits);
  for (let i = 0; i < n; i++) {
    const r = checkAt(repo, companyId, recorded, after[i]);
    if (!r.ok) return { at_sha: after[i], commits_after: i + 1, reason: r.reason };
  }
  return null;
}

/** companies: { [id]: path } or a portfolio companies array. */
function companyPath(companies, id) {
  if (Array.isArray(companies)) { const c = companies.find(x => x.id === id); return c ? c.path : null; }
  return companies ? companies[id] || null : null;
}

/**
 * Check a tranche's declared proof in the company repo and record it; then release the next
 * tranche (§36: release is automatic on proof). Returns { event, released: n|null, release_refused? }.
 */
function recordProof(ledger, { grantId, tranche, companies, rev = 'HEAD', kind, ref, actor = 'holding-owner' }) {
  const state = ledger.fold();
  const g = state.grants[grantId] || fail('NO_SUCH_GRANT', `no grant ${JSON.stringify(grantId)}`);
  const t = g.tranches[tranche - 1] || fail('TRANCHE_INVALID', `grant ${grantId} has no tranche ${JSON.stringify(tranche)}`);
  const named = t.named_proof;
  if ((kind && kind !== named.kind) || (ref && ref !== named.ref)) {
    fail('PROOF_MISMATCH', `tranche ${tranche} of ${grantId} declared ${named.kind} ${named.ref}; you named ${kind || named.kind} ${ref || named.ref}`);
  }
  if (t.proven) fail('PROOF_ALREADY_USED', `tranche ${tranche} of ${grantId} is already proven (${t.proof_id})`);
  const repo = companyPath(companies, g.company) || fail('NO_COMPANY_PATH', `company ${g.company} is not registered with a path`);
  const v = verifyProof(repo, g.company, named, rev);
  if (!v.ok) fail('PROOF_NOT_MET', `${named.kind} ${named.ref}: ${v.reason}`);
  const { event } = ledger.append({
    type: 'proof', actor, idem_key: `proof:${grantId}:${tranche}:${v.sha}`, grant_id: grantId, tranche,
    proof: { kind: named.kind, ref: named.ref, sha: v.sha }, file: v.file,
  });
  const next = g.tranches[tranche];
  if (!next || next.released) return { event, released: null };
  try {
    ledger.append({ type: 'release', actor, idem_key: `release:${grantId}:${next.index}`, grant_id: grantId, tranche: next.index });
    return { event, released: next.index };
  } catch (err) {
    if (!err.code) throw err;
    return { event, released: null, release_refused: err.message };
  }
}

/** Record a proof_revert for every recorded, unreverted proof that was reverted within the window. */
function scanReverts(ledger, { companies, windowCommits, actor = 'holding-owner' }) {
  if (!Number.isSafeInteger(windowCommits) || windowCommits < 1) fail('LIMITS_INVALID', 'proofRevertCommits must be a positive integer');
  const out = [];
  for (const g of Object.values(ledger.fold().grants)) {
    const repo = companyPath(companies, g.company);
    if (!repo) continue;
    for (const t of g.tranches) {
      if (!t.proven || t.reverted || !t.proof) continue;
      const rv = findRevert(repo, g.company, t.proof, windowCommits);
      if (!rv) continue;
      const ev = { type: 'proof_revert', actor, idem_key: `proof_revert:${g.grant_id}:${t.index}`, grant_id: g.grant_id, tranche: t.index,
        reason: rv.reason };
      if (rv.at_sha) ev.at_sha = rv.at_sha;
      if (rv.commits_after !== null) ev.commits_after = rv.commits_after;
      const r = ledger.append(ev);
      if (r.appended) out.push(r.event);
    }
  }
  return out;
}

module.exports = { verifyProof, findRevert, recordProof, scanReverts, resolveCommit, ProofError, LOOPS };
