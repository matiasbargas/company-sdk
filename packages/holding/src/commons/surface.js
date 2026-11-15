'use strict';

/**
 * commons/surface.js — the §34 surface that admits a commons item (cap-po-commons-001, D2.2).
 *
 * Surface id (C11): `companyId/surfaceId@sha`. The surface is read from that company's clone *at
 * that commit* (git show, read-only), at surfaces/<id>.md or project/surfaces/<id>.md, and must:
 *   - have front-matter `id: <surfaceId>` and `state: verified`;
 *   - name the item's tree hash somewhere in its text (the surface verifies *this* content, not
 *     whatever happens to be in quarantine);
 *   - carry a `verifier_roster` that satisfies the cross-company rule (Owner decision 2026-11-14).
 *
 * Roster entries are role names. `company/Role` names a role of another company; a bare `Role`
 * belongs to the company hosting the surface. The rule, enforced here and again in the ledger fold
 * (so a hand-written event cannot skip it):
 *   - at least one role from a company other than the publisher, other than the CISO — never only
 *     the publisher's own roles (self-verification, COMMONS_SELF_VERIFIED);
 *   - plus a CISO (any company) (COMMONS_NO_CISO).
 */

const { execFileSync } = require('child_process');
const { resolveCommit } = require('../proofs');
const { fail } = require('./treehash');

const QUALIFIED_RE = /^([A-Za-z0-9._-]+)\/([A-Za-z0-9._-]+)@([0-9a-f]{7,64})$/;
const SAFE = (s) => s !== '.' && s !== '..';

/** Parse `companyId/surfaceId@sha` → { company, id, sha } or null. */
function parseSurfaceId(s) {
  const m = QUALIFIED_RE.exec(String(s || ''));
  if (!m || !SAFE(m[1]) || !SAFE(m[2])) return null;
  return { company: m[1], id: m[2], sha: m[3] };
}

function readAt(repo, sha, rel) {
  try {
    return execFileSync('git', ['-c', `safe.directory=${repo}`, '-C', repo, 'show', `${sha}:${rel}`],
      { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], maxBuffer: 16 * 1024 * 1024 });
  } catch { return null; }
}

function frontMatter(text) {
  const m = /^---\r?\n([\s\S]*?)\r?\n---\s*(?:\r?\n|$)/.exec(text);
  return m ? m[1] : null;
}
const fmValue = (fm, key) => {
  const m = new RegExp(`^\\s*${key}:\\s*["']?([^"'\\n#]*?)["']?\\s*(?:#.*)?$`, 'm').exec(fm);
  return m ? m[1].trim() : null;
};
/** A front-matter list, inline (`key: [a, b]`) or block (`key:` then `- a` lines). */
function fmList(fm, key) {
  const inline = new RegExp(`^(\\s*)${key}:\\s*\\[([^\\]]*)\\]`, 'm').exec(fm);
  if (inline) return inline[2].split(',').map(s => s.trim().replace(/^["']|["']$/g, '')).filter(Boolean);
  const lines = fm.split(/\r?\n/);
  const i = lines.findIndex(l => new RegExp(`^\\s*${key}:\\s*$`).test(l));
  if (i < 0) return null;
  const out = [];
  for (const l of lines.slice(i + 1)) {
    const m = /^\s*-\s+(.+?)\s*$/.exec(l);
    if (!m) break;
    out.push(m[1].replace(/^["']|["']$/g, ''));
  }
  return out;
}

/** Roster strings → [{ company, role }] (bare roles belong to the hosting company). */
function qualifyRoster(entries, hostCompany) {
  return entries.map((e) => {
    const slash = e.indexOf('/');
    return slash > 0 ? { company: e.slice(0, slash).trim(), role: e.slice(slash + 1).trim() } : { company: hostCompany, role: e.trim() };
  });
}

const isCiso = (role) => String(role).trim().toUpperCase() === 'CISO';

/** The cross-company rule. Returns null when met, else { code, message }. */
function rosterProblem(roster, publisher) {
  if (!Array.isArray(roster) || roster.length === 0) return { code: 'COMMONS_SELF_VERIFIED', message: 'the verifier roster is empty; a role from another company and the CISO are required' };
  const outside = roster.filter(r => r && r.company !== publisher && !isCiso(r.role));
  if (outside.length === 0) {
    return { code: 'COMMONS_SELF_VERIFIED', message: `the roster has no role from another company than ${publisher} (self-verification is refused; another company's role and the CISO are required)` };
  }
  if (!roster.some(r => r && isCiso(r.role))) return { code: 'COMMONS_NO_CISO', message: 'the roster has no CISO (a role from another company plus the CISO are required)' };
  return null;
}

/**
 * Check the admitting surface for an item. companies = { id: clonePath }.
 * Returns { surface_id (with the full commit sha), roster: [{company, role}], file }. Throws CommonsError.
 */
function checkAdmissionSurface({ surfaceId, hash, publisher, companies }) {
  const q = parseSurfaceId(surfaceId);
  if (!q) fail('COMMONS_INVALID', `surface id ${JSON.stringify(surfaceId)} must be qualified as companyId/surfaceId@sha (C11)`);
  const repo = companies[q.company];
  if (!repo) fail('COMMONS_SURFACE', `surface company ${q.company} is not in the portfolio`);
  const sha = resolveCommit(repo, q.sha);
  if (!sha || !sha.startsWith(q.sha)) fail('COMMONS_SURFACE', `${q.sha} is not a commit in ${q.company} (${repo})`);
  let text = null; let file = null;
  for (const rel of [`surfaces/${q.id}.md`, `project/surfaces/${q.id}.md`]) {
    text = readAt(repo, sha, rel);
    if (text !== null) { file = rel; break; }
  }
  if (text === null) fail('COMMONS_SURFACE', `no surface ${q.id} in ${q.company} at ${sha.slice(0, 12)} (looked in surfaces/ and project/surfaces/)`);
  const fm = frontMatter(text);
  if (!fm) fail('COMMONS_SURFACE', `${q.company}:${file} has no front-matter`);
  if (fmValue(fm, 'id') !== q.id) fail('COMMONS_SURFACE', `${q.company}:${file} front-matter id is ${JSON.stringify(fmValue(fm, 'id'))}, not ${q.id}`);
  const state = fmValue(fm, 'state');
  if (state !== 'verified') fail('COMMONS_SURFACE', `${q.company}:${file} is not verified (state ${JSON.stringify(state)}) at ${sha.slice(0, 12)}`);
  if (!text.includes(hash)) fail('COMMONS_SURFACE_UNBOUND', `${q.company}:${file} does not name the item hash ${hash}; the surface must verify this exact content`);
  const entries = fmList(fm, 'verifier_roster');
  if (!entries) fail('COMMONS_SURFACE', `${q.company}:${file} has no verifier_roster`);
  const roster = qualifyRoster(entries, q.company);
  const unknown = roster.filter(r => !companies[r.company]).map(r => `${r.company}/${r.role}`);
  if (unknown.length) fail('COMMONS_SURFACE', `${q.company}:${file} roster names companies outside the portfolio: ${unknown.join(', ')}`);
  const problem = rosterProblem(roster, publisher);
  if (problem) fail(problem.code, `${q.company}/${q.id}: ${problem.message}`);
  return { surface_id: `${q.company}/${q.id}@${sha}`, roster, file };
}

module.exports = { parseSurfaceId, qualifyRoster, rosterProblem, checkAdmissionSurface, isCiso, fmList };
