'use strict';

/** Build: gather, filter, lint, order and cap the cards (cap-inbox-003), and render them. Part of `sdk-doc inbox` (scripts/commands/inbox.js). */

const path = require('path');
const { readLimits } = require('../limits');
const { lintCard } = require('./boundaries');
const { readIf, norm, names, isOwner } = require('./card');
const { busCards, surfaceCards, charterCards, overdueCards, holdingCards } = require('./sources');

function allCards(projectDir) {
  const historyText = readIf(path.join(projectDir, 'history.md')) || '';
  const bus = busCards(projectDir);
  return [
    ...bus.cards,
    ...surfaceCards(projectDir),
    ...charterCards(projectDir, historyText),
    ...overdueCards(projectDir, bus.ranges, historyText),
    ...holdingCards(projectDir, historyText),
  ];
}

const addressedTo = (c, principal) => names(c.addressed_to).includes(norm(principal));
const visibleTo = (c, principal) => addressedTo(c, principal) || names(c.addressed_to).some(isOwner);

function order(a, b) {
  if (a.blocking !== b.blocking) return a.blocking ? -1 : 1;
  if (a.deadline !== b.deadline) {
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return a.deadline < b.deadline ? -1 : 1;
  }
  return a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
}

function buildInbox(projectDir, principal = 'Owner') {
  const limit = readLimits(projectDir).inboxMaxCards || 5;
  const accepted = [];
  const rejected = [];
  for (const c of allCards(projectDir).filter(x => visibleTo(x, principal))) {
    const problems = lintCard(c);
    if (problems.length) rejected.push({ id: c.id, kind: c.kind, question: c.question, source: srcStr(c.source), reason: problems.join('; ') });
    else accepted.push(c);
  }
  accepted.sort(order);
  const shown = accepted.slice(0, limit);
  const over = accepted.slice(limit);
  return {
    principal,
    limit,
    cards: shown.map(publicCard),
    overflow: { count: over.length, cards: over.map(c => ({ id: c.id, kind: c.kind, question: c.question, deadline: c.deadline })) },
    rejected,
  };
}

const srcStr = (s) => (s.line ? `${s.path}:${s.line}` : s.path);
function publicCard(c) {
  const o = {};
  for (const [k, v] of Object.entries(c)) if (!k.startsWith('_')) o[k] = v;
  return o;
}

function render(box) {
  const out = [];
  out.push(`Inbox for ${box.principal}: ${box.cards.length} card${box.cards.length === 1 ? '' : 's'} (limit ${box.limit}; limits.inboxMaxCards)`);
  box.cards.forEach((c, n) => {
    const flags = [c.kind, c.blocking ? 'BLOCKING' : null, c.overdue ? 'OVERDUE' : null, `to ${c.addressed_to}`].filter(Boolean).join(' · ');
    out.push('', `[${n + 1}] ${c.id}  (${flags})`);
    out.push(`  Dissent:       ${c.dissent}`);
    out.push(`  Question:      ${c.question}`);
    out.push(`  Boundary:      ${c.boundary.label}`);
    out.push(`  Options:       ${c.options.length ? c.options.join(' | ') : 'free-form (state the decision)'}`);
    out.push(`  Meanwhile:     ${c.meanwhile}`);
    out.push(`  Cost of delay: ${c.cost_of_delay}`);
    out.push(`  Deadline:      ${c.deadline || 'none set'}${c.overdue ? ' (OVERDUE)' : ''}`);
    out.push(`  Source:        ${srcStr(c.source)}`);
  });
  if (box.overflow.count) {
    out.push('', `+${box.overflow.count} more not shown (answer the above or raise limits.inboxMaxCards):`);
    for (const c of box.overflow.cards) out.push(`  - ${c.id}  ${c.question}${c.deadline ? ` (due ${c.deadline})` : ''}`);
  }
  if (box.rejected.length) {
    out.push('', `Rejected (over-asking guard): ${box.rejected.length} — every ask must cite its boundary (a §34.7 bullet or an Autonomy Limit):`);
    for (const r of box.rejected) out.push(`  - ${r.source}  ${r.question}`);
  }
  if (box.cards.length) out.push('', `Answer: sdk-doc inbox <project-dir> answer <card-id> --decision <option> --reason "<why>"${isOwner(box.principal) ? '' : ` --for ${box.principal}`}`);
  return out.join('\n');
}

module.exports = { allCards, addressedTo, buildInbox, srcStr, render };
