'use strict';

/** Boundaries: the only reasons a human is asked, and the over-asking guard (cap-inbox-002). Part of `sdk-doc inbox` (scripts/commands/inbox.js). */

const BOUNDARIES = {
  'AL-1': 'Autonomy Limit 1 — nothing outward-facing (push, merge, tag, release, publish, external messages)',
  'AL-2': 'Autonomy Limit 2 — no spending (paid services, purchases, the Owner\'s money or name)',
  'AL-3': 'Autonomy Limit 3 — no Layer A changes (only the Owner ratifies)',
  'AL-4': 'Autonomy Limit 4 — no irreversible call without both gates (Mario + the Owner)',
  'AL-5': 'Autonomy Limit 5 — no rewriting the record',
  'AL-6': 'Autonomy Limit 6 — no weakening the safeguards',
  'AL-7': 'Autonomy Limit 7 — no secrets or personal data beyond the task',
  '34.7-scope-strategy': '§34.7 — a shift in scope or strategy',
  '34.7-layer-a': '§34.7 — a change to Layer A (CHARTER, _shared.md, STRATEGY.md, structural protocol)',
  '34.7-irreversible-blocked': '§34.7 — an irreversible surface reaching blocked',
  '34.7-sdlc-transition': '§34.7 — an SDLC forward transition',
  '34.7-shared-remote': '§34.7 — anything pushed to a shared remote (push/merge to main)',
};
const BULLETS_347 = ['scope-strategy', 'layer-a', 'irreversible-blocked', 'sdlc-transition', 'shared-remote'];

/** Free text → { id, label } for a known boundary, or null. */
function parseBoundary(text) {
  if (!text) return null;
  const t = String(text).trim();
  const al = t.match(/^(?:Autonomy\s+Limit|AL)[\s#-]*([1-7])\b/i);
  if (al) return { id: `AL-${al[1]}`, label: BOUNDARIES[`AL-${al[1]}`] };
  const s = t.match(/^§?\s*34\.7\s*[-:—]?\s*(?:bullet\s+([1-5])|([a-z-]+))/i);
  if (s) {
    const key = s[1] ? BULLETS_347[Number(s[1]) - 1] : s[2].toLowerCase();
    const id = `34.7-${key}`;
    if (BOUNDARIES[id]) return { id, label: BOUNDARIES[id] };
  }
  return null;
}

/** Over-asking guard: problems with a card (empty = valid). */
function lintCard(card) {
  const problems = [];
  if (!card || !card.question) problems.push('a card needs a question');
  if (!card || !card.boundary || !BOUNDARIES[card.boundary.id]) {
    problems.push('no boundary cited — an ask must name the §34.7 bullet or the Autonomy Limit it hits (BOUNDARY: …); otherwise it closes agent-to-agent');
  }
  return problems;
}

module.exports = { BOUNDARIES, parseBoundary, lintCard };
