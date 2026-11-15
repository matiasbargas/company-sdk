'use strict';

/**
 * sandbox-access.js — can the D7 sandbox user actually reach a path? (Guardian cycle 2, row 1)
 *
 * Under D7 the session, and with it the landing/freeze PreToolUse hook, runs as the sandbox user.
 * A hook whose node or script that user cannot exec exits non-zero, Claude Code treats that as
 * non-blocking, and landing and freeze fail OPEN. This module answers the question with POSIX
 * permission rules, from stat data only (no sudo, no `test -x` as another user):
 *
 *   - every ancestor directory of the path needs execute (search) for the user;
 *   - the target needs the requested bits (need: 'x' | 'r' | 'rx' | 'rwx');
 *   - the permission class is the FIRST that matches, as the kernel decides: owner (stat.uid ===
 *     uid), else group (stat.gid in userGroups), else other. An owner with fewer bits than "other"
 *     is still refused, which is correct.
 * ACLs and root are out of scope: a pass here is necessary, not sufficient, and the setup script
 * double-checks as the user with `sudo -u <user> test`. stat/statDir are injectable for tests.
 *
 *   checkSandboxAccess({ user, uid?, userGroups, checks: [{ path, need }], stat?, statDir? }) → [{ path, need, ok, reason, dir? }]
 *   resolveUserGroups(user, exec) → number[] | null      (`id -G <user>` through an injected exec)
 *   resolveUserUid(user, exec) → number | null           (`id -u <user>`)
 */

const fs = require('fs');
const path = require('path');

const BITS = { r: 4, w: 2, x: 1 };
const NEEDS = new Set(['x', 'r', 'rx', 'rwx']);

/** The rwx bits (0-7) of the class that applies to this user, and which class it was. */
function classBits(st, uid, groups) {
  if (uid !== undefined && uid !== null && st.uid === uid) return { bits: (st.mode >> 6) & 7, cls: 'owner' };
  if (groups.includes(st.gid)) return { bits: (st.mode >> 3) & 7, cls: 'group' };
  return { bits: st.mode & 7, cls: 'other' };
}

const modeStr = (st) => (st.mode & 0o777).toString(8).padStart(3, '0');
const missingBits = (bits, need) => [...need].filter(c => !(bits & BITS[c])).join('');

function defaultStat(p) {
  const s = fs.statSync(p); // follows symlinks: what exec/open will see
  return { mode: s.mode, uid: s.uid, gid: s.gid, isDirectory: () => s.isDirectory() };
}

/** Ancestors of an absolute path, root first, the path itself excluded. */
function ancestors(p) {
  const out = [];
  let cur = path.dirname(p);
  for (;;) { out.unshift(cur); const up = path.dirname(cur); if (up === cur) break; cur = up; }
  return out;
}

function checkOne(c, { user, uid, groups, stat, statDir }) {
  const res = { path: c.path, need: c.need };
  if (typeof c.path !== 'string' || !path.isAbsolute(c.path)) return { ...res, ok: false, reason: `${JSON.stringify(c.path)} is not an absolute path` };
  if (!NEEDS.has(c.need)) return { ...res, ok: false, reason: `need must be one of ${[...NEEDS].join(', ')}` };
  const target = path.normalize(c.path);
  for (const dir of ancestors(target)) {
    let st;
    try { st = statDir(dir); } catch { return { ...res, ok: false, dir, reason: `${dir} does not exist` }; }
    const { bits, cls } = classBits(st, uid, groups);
    if (!(bits & BITS.x)) {
      return { ...res, ok: false, dir, reason: `${user} cannot traverse ${dir} (mode ${modeStr(st)}, uid ${st.uid}, gid ${st.gid}; `
        + `${user} falls in the "${cls}" class, which lacks x)` };
    }
  }
  let st;
  try { st = stat(target); } catch { return { ...res, ok: false, reason: `${target} does not exist` }; }
  const { bits, cls } = classBits(st, uid, groups);
  const missing = missingBits(bits, c.need);
  if (missing) {
    return { ...res, ok: false, reason: `${user} lacks ${missing} on ${target} (mode ${modeStr(st)}, uid ${st.uid}, gid ${st.gid}; class "${cls}")` };
  }
  return { ...res, ok: true, reason: `${user} has ${c.need} on ${target} (class "${cls}") and can traverse every parent` };
}

function checkSandboxAccess({ user, uid, userGroups, checks, stat, statDir } = {}) {
  const st = stat || defaultStat;
  const ctx = { user: user || 'the sandbox user', uid, groups: Array.isArray(userGroups) ? userGroups : [], stat: st, statDir: statDir || st };
  return (checks || []).map(c => checkOne(c, ctx));
}

function resolveUserGroups(user, exec) {
  const r = exec('id', ['-G', user]);
  if (r.status !== 0) return null;
  const ids = r.stdout.trim().split(/\s+/).filter(Boolean).map(Number);
  return ids.every(Number.isSafeInteger) && ids.length ? ids : null;
}

function resolveUserUid(user, exec) {
  const r = exec('id', ['-u', user]);
  if (r.status !== 0) return null;
  const n = Number(r.stdout.trim());
  return Number.isSafeInteger(n) ? n : null;
}

module.exports = { checkSandboxAccess, resolveUserGroups, resolveUserUid, ancestors };
