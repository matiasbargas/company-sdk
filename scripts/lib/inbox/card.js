'use strict';

/** Card helpers: ids, dates, principal matching, the closed-card check, and the card shape. Part of `sdk-doc inbox` (scripts/commands/inbox.js). */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const readIf = (f) => { try { return fs.readFileSync(f, 'utf8'); } catch (_) { return null; } };
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const cardId = (...parts) => `inbox-${sha(parts.join('|')).slice(0, 10)}`;
const pad = (n) => String(n).padStart(2, '0');
/** Local calendar day (the Owner's day, not UTC): YYYY-MM-DD. */
const today = (t = new Date()) => `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
/** Local wall-clock stamp for Bus headers: YYYY-MM-DD HH:MM. */
const nowStamp = (t = new Date()) => `${today(t)} ${pad(t.getHours())}:${pad(t.getMinutes())}`;
const NO_DISSENT = 'No dissent recorded.';
const NOT_STATED = 'not stated — the asker must name it';

/** Principal names compare without case, a `human:` prefix, or a parenthetical. */
const norm = (s) => String(s || '').replace(/\(.*?\)/g, '').replace(/^\s*human:/i, '').trim().toLowerCase();
const names = (to) => String(to || '').split(/,|&|\/|\band\b/).map(norm).filter(Boolean);
const isOwner = (n) => norm(n) === 'owner';

function headSha(dir) {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: dir, encoding: 'utf8' });
  return r.status === 0 ? r.stdout.trim() : 'none';
}
function release(dir) {
  try { const rc = JSON.parse(fs.readFileSync(path.join(dir, '.sdkrc'), 'utf8')); if (rc.releaseId) return rc.releaseId; } catch (_) { /* fall through */ }
  return 'unknown';
}
/**
 * A card is closed only by a provenance-stamped answer block written by `answer`:
 * the block's SHA256 must verify, and its card id is read from the block's own marker line —
 * the final body line (`Card: <id> · …` for Bus, `- Card: <id> · …` for surfaces) or a
 * `**Card:** <id>` field line (history). Free text (reason, decision, question) is collapsed to one
 * line inside a prefixed field, so it can never occupy a marker position; a `Card:` mention inside
 * a reason, or a hand-written unstamped marker, closes nothing. One block closes exactly one card.
 */
const STAMP = /^LOOP-PROVENANCE: \S+ \+ SHA256\(([0-9a-f]{64})\)$/;
const TAIL_MARKER = /^(?:- )?Card: (inbox-[0-9a-f]+) · /;
const FIELD_MARKER = /^\*\*Card:\*\* (inbox-[0-9a-f]+)$/;
const closedCache = new Map();
function closedIds(text) {
  if (closedCache.has(text)) return closedCache.get(text);
  const ids = new Set();
  const lines = text.split('\n');
  for (let i = 0; i < lines.length; i++) {
    const m = STAMP.exec(lines[i]);
    if (!m) continue;
    let j = i - 1;
    while (j >= 0 && lines[j].trim() !== '' && lines[j].trim() !== '---') j--;
    const body = lines.slice(j + 1, i);
    if (!body.length || sha(body.join('\n')) !== m[1]) continue;
    const tail = TAIL_MARKER.exec(body[body.length - 1]);
    const field = body.map(l => FIELD_MARKER.exec(l)).filter(Boolean);
    if (tail && !field.length) ids.add(tail[1]);
    else if (!tail && field.length === 1) ids.add(field[0][1]);
  }
  closedCache.set(text, ids);
  return ids;
}
const answered = (text, id) => !!text && closedIds(text).has(id);

function card(o) {
  return {
    id: o.id,
    kind: o.kind,
    addressed_to: o.to,
    blocking: !!o.blocking,
    dissent: o.dissent || NO_DISSENT,
    question: o.question,
    boundary: o.boundary || null,
    options: o.options || [],
    meanwhile: o.meanwhile || NOT_STATED,
    cost_of_delay: o.cost || NOT_STATED,
    deadline: o.deadline || null,
    overdue: !!(o.deadline && o.deadline < today()),
    source: o.source,
    _target: o.target, // where an answer is written: 'bus' | 'surface' | 'history'
    _extra: o.extra || {},
  };
}

module.exports = { readIf, sha, cardId, today, nowStamp, norm, names, isOwner, headSha, release, answered, card };
