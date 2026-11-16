'use strict';

/**
 * cmdInbox — `sdk-doc inbox`: decision cards for a principal (human or role), built only from
 * primitives that already exist. No new store: every card is derived on each run, and an answer is
 * written back onto the card's own source (a §34 verification block, a §6 history decision, or a
 * Bus reply). Design: project/context/intent/company-brain/design.md §5-6.
 * Spec: project/context/spec/sdk-inbox/claims.yaml (cap-inbox-001..004).
 *
 *   sdk-doc inbox <project-dir> [--for <principal>] [--json]
 *   sdk-doc inbox <project-dir> answer <card-id> --decision <...> --reason "<required>" [--for <principal>]
 *
 * Sources (cap-inbox-001):
 *   bus      open DECISION NEEDED / BLOCKER messages in bus-log.md addressed to the principal or the Owner
 *   surface  surfaces in under-verification / reconciling with an unfilled roster slot (one card per
 *            slot); an irreversible surface in `blocked` is a card for the Owner (§34.7 bullet 3)
 *   charter  CHARTER.md whose ratification line is unsigned
 *   overdue  `DECISION BY:` items past due (scripts/lib/overdue.js) not already carried by a Bus card
 *   holding  holding-health issues (packages/holding/src/health.js) when a holding exists
 *
 * Guards:
 *   over-asking   (cap-inbox-002) a card that does not cite a known boundary (a §34.7 bullet or a
 *                 CHARTER Autonomy Limit) is rejected; rejected asks are listed, never hidden.
 *   cap           (cap-inbox-003) at most limits.inboxMaxCards cards; the overflow is counted and named.
 *   rubber-stamp  (cap-inbox-004) an answer without a non-empty --reason is refused.
 *
 * Bus asks name their boundary and card fields with optional body lines:
 *   BOUNDARY: Autonomy Limit 2 | AL-2 | §34.7 shared-remote | §34.7 bullet 5
 *   DISSENT: … · OPTIONS: a | b | c · MEANWHILE: … · COST OF DELAY: …
 * Bus/history/surface content is untrusted input: it is parsed as text and never executed.
 */

const fs = require('fs');
const path = require('path');
const { BOUNDARIES, parseBoundary, lintCard } = require('../lib/inbox/boundaries');
const { buildInbox, render } = require('../lib/inbox/build');
const { answer, fail } = require('../lib/inbox/answer');

// Modules (scripts/lib/inbox/): boundaries · card · sources · build · answer.

// ─── Entry ──────────────────────────────────────────────────────────────────

function parseArgs(args) {
  const opts = {};
  const pos = [];
  for (let i = 2; i < args.length; i++) {
    const a = args[i];
    if (a === '--json' || a === '--dry-run') { opts[a.slice(2)] = true; continue; }
    if (a.startsWith('--')) { opts[a.slice(2)] = i + 1 < args.length && !args[i + 1].startsWith('--') ? args[++i] : ''; continue; }
    pos.push(a);
  }
  return { opts, pos };
}

function cmdInbox({ args, filePath }) {
  const projectDir = filePath ? path.resolve(filePath) : process.cwd();
  if (!fs.existsSync(projectDir) || !fs.statSync(projectDir).isDirectory()) fail(`project directory not found: ${projectDir}`);
  const { opts, pos } = parseArgs(args);
  if (pos[0] === 'answer') return answer(projectDir, pos[1], opts);
  if (pos.length) fail(`unknown inbox subcommand "${pos[0]}" (expected: answer)`);
  const box = buildInbox(projectDir, opts.for || 'Owner');
  console.log(opts.json ? JSON.stringify(box, null, 2) : render(box));
}

module.exports = cmdInbox;
module.exports.buildInbox = buildInbox;
module.exports.lintCard = lintCard;
module.exports.parseBoundary = parseBoundary;
module.exports.BOUNDARIES = BOUNDARIES;
