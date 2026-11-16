'use strict';

/** Answer (cap-inbox-004): write a provenance-stamped answer onto the card's source. Part of `sdk-doc inbox` (scripts/commands/inbox.js). */

const fs = require('fs');
const path = require('path');
const { lintCard } = require('./boundaries');
const { readIf, sha, today, nowStamp, headSha, release } = require('./card');
const { allCards, addressedTo, srcStr } = require('./build');

function fail(msg) { console.error(`Error: ${msg}`); process.exit(1); }

function answer(projectDir, id, opts) {
  // Free text lands in markdown records as one line behind a field prefix, so it can never sit in a
  // marker position; closedIds() only trusts the stamped block's own marker line (see answered()).
  const oneLine = (v) => (typeof v === 'string' ? v.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim() : '');
  const principal = oneLine(opts.for) || 'Owner';
  const decision = oneLine(opts.decision);
  const reason = oneLine(opts.reason);
  if (!id || id.startsWith('--')) fail('usage: sdk-doc inbox <project-dir> answer <card-id> --decision <...> --reason "<why>"');
  if (!decision) fail('--decision is required.');
  if (!reason) fail('--reason is required and cannot be empty (rubber-stamp guard): say why, especially on a pass.');

  const c = allCards(projectDir).find(x => x.id === id);
  if (!c) fail(`no open card ${id} (already answered, or not an ask). Run: sdk-doc inbox ${projectDir}`);
  if (lintCard(c).length) fail(`card ${id} cites no boundary, so it is not a human ask (over-asking guard).`);
  if (!addressedTo(c, principal)) fail(`card ${id} is not addressed to ${principal} (addressed to ${c.addressed_to}). Use --for <principal>.`);
  if (c.options.length && !c.options.some(o => o.toLowerCase() === decision.toLowerCase())) {
    fail(`--decision must be one of: ${c.options.join(' | ')}`);
  }

  const date = today();
  const commit = headSha(projectDir);
  const src = oneLine(srcStr(c.source));
  const slot = oneLine(c._extra.slot);
  const question = oneLine(c.question);
  const label = oneLine(c.boundary.label);
  const dissent = oneLine(c.dissent);
  const stamp = (binding, body) => `${body}\nLOOP-PROVENANCE: ${binding} + SHA256(${sha(body)})\n`;

  if (c._target === 'surface') {
    const file = c._extra.file;
    const body = `### Verification — ${slot} (${date}, via sdk-doc inbox)\n**Verdict:** ${decision.toLowerCase()}\n- ${reason}\n- Card: ${c.id} · Answered by: ${principal} · Commit: ${commit}`;
    const prev = fs.readFileSync(file, 'utf8');
    fs.appendFileSync(file, `${prev.endsWith('\n') ? '' : '\n'}\n${stamp(c._extra.surfaceId, body)}`, 'utf8');
    console.log(`✓ Verification block for ${c._extra.slot} appended to ${c.source.path} (state unchanged; the author reconciles per §34.3)`);
    return;
  }
  if (c._target === 'bus') {
    const file = path.join(projectDir, 'bus-log.md');
    const ts = nowStamp();
    const body = `[${ts}] FROM: ${principal} → TO: ${oneLine(c._extra.from)} | PRIORITY: INFO | RELEASE: ${release(projectDir)}\nRE: [${oneLine(c._extra.ts)}] ${oneLine(c._extra.from)} → ${oneLine(c.addressed_to)}: ${oneLine(String(c._extra.firstLine)).slice(0, 120)}\nDECISION: ${decision}\nREASON: ${reason}\nCard: ${c.id} · Source: ${src} · Commit: ${commit}`;
    fs.appendFileSync(file, `\n---\n${stamp(c.id, body)}`, 'utf8');
    console.log(`✓ Bus reply to ${c._extra.from} appended to bus-log.md`);
    return;
  }
  const file = path.join(projectDir, 'history.md');
  const body = `## Inbox decision — ${question.slice(0, 90)}\n**Date:** ${date}\n**Made by:** ${principal} (via sdk-doc inbox)\n**Card:** ${c.id}\n**Source:** ${src}\n**Boundary:** ${label}\n**Dissent shown:** ${dissent}\n**Decision:** ${decision}\n**Reason:** ${reason}\n**Commit:** ${commit}`;
  const prev = readIf(file) || '';
  fs.appendFileSync(file, `${prev && !prev.endsWith('\n') ? '\n' : ''}\n${stamp(c.id, body)}`, 'utf8');
  console.log(`✓ Decision appended to history.md (card ${c.id})`);
  if (c.kind === 'charter') {
    console.log('  Reminder: agents cannot edit CHARTER.md (Layer A). If you ratified, sign the ratification line yourself.');
  }
}

module.exports = { answer, fail };
