'use strict';

/**
 * cli/commons.js — `sdk-holding commons …` (cap-po-commons-001/002/003, cap-po-data-001).
 *
 *   commons publish <company> <path> --class <class> [--name <n>] [--consent <file.json>] [--by holding-owner|company-owner]
 *   commons admit <sha256:…> --surface <companyId/surfaceId@sha>
 *   commons subscribe <company> --class <class>[,<class>…]
 *   commons pull <company> [--approve]
 *   commons revoke <company/name | company/name@sha256:… | sha256:…> --reason "<why>"
 *   commons list [--json]
 *
 * Everything except `list` is an Owner command and refuses inside a session (RUN_CONTEXT tripwire,
 * as in cli/index.js; the barrier is the OS: holding/commons is 0700 under the Owner, D7).
 * The library is src/commons/; the ledger side is src/fold/commons-events.js.
 */

const fs = require('fs');
const path = require('path');
const { validatePortfolio } = require('../portfolio');
const { CLASSES } = require('../commons/policy');
const { publishItem, admitItem, revokeItem, itemsOf } = require('../commons/store');
const { pullCompany } = require('../commons/pull');
const { BOOLEAN_FLAGS, Refusal, usage, refuse, need, writeJson, companyMap } = require('./common');

// `--approve` is a switch (Owner approval of this pull's adoptions). Registered here so the commons
// command group stays self-contained; parseArgs reads the shared set.
BOOLEAN_FLAGS.add('approve');

const COMMONS_USAGE = `usage: sdk-holding commons <subcommand> [--holding <dir>]
  publish <company> <path> --class ${CLASSES.join('|')} [--name <n>] [--consent <file.json>]
  admit <sha256:…> --surface <companyId/surfaceId@sha>     (verified §34 surface: another company's role + the CISO)
  subscribe <company> --class <class>[,<class>…]
  pull <company> [--approve]                                (without --approve: list only; revocations always apply)
  revoke <company/name | company/name@sha256:… | sha256:…> --reason "<why>"
  list [--json]`;

const companyOrRefuse = (h, id) => (h.portfolio.companies || []).find(c => c.id === id) || refuse(`no company ${id} in the portfolio`);
const short = (hash) => hash.slice(0, 19);

const sub = {
  publish({ pos, flags }, io, h) {
    const [companyId, src] = [pos[1] || usage('commons publish needs <company>'), pos[2] || usage('commons publish needs <path>')];
    const cls = need(flags, 'class', 'commons publish');
    if (!CLASSES.includes(cls)) usage(`--class must be one of ${CLASSES.join(', ')}, got ${JSON.stringify(cls)}`);
    const company = companyOrRefuse(h, companyId);
    let consent;
    if (flags.consent !== undefined) {
      try { consent = JSON.parse(fs.readFileSync(path.resolve(flags.consent), 'utf8')); } catch (e) { refuse(`refused: CONSENT_INVALID: cannot read ${flags.consent}: ${e.message}`); }
    }
    const r = publishItem({ L: h.ledger(), holdingDir: h.root, company, src, cls, name: flags.name, consent, actor: flags.by || 'holding-owner' });
    io.out(`${r.duplicate ? 'already published' : 'published'} ${r.item} ${r.hash} (${cls}) → holding/commons/quarantine; it stays there until admitted by a verified surface`);
    if (cls === 'published-context') io.out('note: published context is treated as irreversible — a revocation stops future pulls, it cannot unshare what was pulled');
    io.out(`next: sdk-holding commons admit ${r.hash} --surface <companyId/surfaceId@sha>`);
  },

  admit({ pos, flags }, io, h) {
    const hash = pos[1] || usage('commons admit needs <sha256:…>');
    const surfaceId = need(flags, 'surface', 'commons admit');
    if (!/^[^/@]+\/[^/@]+@[0-9a-f]{7,64}$/.test(surfaceId)) usage(`--surface must be qualified as companyId/surfaceId@sha (C11), got ${JSON.stringify(surfaceId)}`);
    const r = admitItem({ L: h.ledger(), holdingDir: h.root, hash, surfaceId, companies: companyMap(h.portfolio), actor: flags.by || 'holding-owner' });
    io.out(`${r.duplicate ? 'already admitted' : 'admitted'} ${r.item} ${r.hash} (surface ${r.surface_id}) → holding/commons/admitted`);
  },

  subscribe({ pos, flags }, io, h) {
    const companyId = pos[1] || usage('commons subscribe needs <company>');
    const classes = [...new Set(need(flags, 'class', 'commons subscribe').split(',').map(s => s.trim()).filter(Boolean))];
    const bad = classes.filter(c => !CLASSES.includes(c));
    if (bad.length) usage(`unknown class ${bad.join(', ')} (classes: ${CLASSES.join(', ')})`);
    companyOrRefuse(h, companyId);
    const next = { ...h.portfolio, companies: h.portfolio.companies.map(c => (c.id === companyId ? { ...c, commons: { subscribe: classes } } : c)) };
    const v = validatePortfolio(next, { holdingDir: h.root });
    if (!v.ok) refuse(`subscription not recorded:\n${v.errors.map(e => `  - ${e.message}`).join('\n')}`);
    writeJson(h.files.portfolio, next);
    io.out(`${companyId} subscribes to: ${classes.join(', ')} (adoption still needs \`commons pull ${companyId} --approve\`)`);
  },

  pull({ pos, flags }, io, h) {
    const company = companyOrRefuse(h, pos[1] || usage('commons pull needs <company>'));
    const r = pullCompany({ state: h.ledger().fold(), holdingDir: h.root, company, approve: flags.approve === true });
    for (const x of r.revoked) io.out(`revoked: ${x.item} ${short(x.hash)} — ${x.reason} (ledger seq ${x.seq}); quarantined locally${x.quarantined_to ? ` at ${x.quarantined_to}` : ''}, recorded in commons.lock.json`);
    if (r.subscribed.length === 0) { io.out(`${company.id} has no subscribed classes; nothing to adopt (sdk-holding commons subscribe ${company.id} --class <class>)`); return; }
    for (const x of r.adopted) io.out(`adopted: ${x.item} ${short(x.hash)} → ${x.path}`);
    for (const x of r.updated) io.out(`updated: ${x.item} ${short(x.hash)} → ${x.path}`);
    for (const x of r.upToDate) io.out(`up to date: ${x.item} ${short(x.hash)}`);
    for (const c of r.conflicts) {
      io.out(`conflict: ${c.item} — ${c.path} ${c.local === null ? 'is missing' : `was edited locally (local ${short(c.local)}, locked ${c.locked ? short(c.locked) : 'none: not adopted here'})`}; `
        + `incoming ${short(c.incoming)} not applied, nothing overwritten${c.surface ? `; reconciling surface ${c.surface}` : ' (pull --approve opens a reconciling surface)'}`);
    }
    for (const p of r.pending) io.out(`pending ${p.action}: ${p.item} ${short(p.hash)} (${p.class}, surface ${p.surface_id})`);
    if (r.pending.length) io.out(`nothing adopted: the ${company.id} Owner approves with \`sdk-holding commons pull ${company.id} --approve\``);
    if (!r.adopted.length && !r.updated.length && !r.upToDate.length && !r.conflicts.length && !r.pending.length && !r.revoked.length) {
      io.out(`nothing admitted in ${r.subscribed.join(', ')} yet`);
    }
  },

  revoke({ pos, flags }, io, h) {
    const target = pos[1] || usage('commons revoke needs <item>');
    const reason = need(flags, 'reason', 'commons revoke');
    const evs = revokeItem({ L: h.ledger(), target, reason, actor: flags.by || 'holding-owner' });
    for (const e of evs) io.out(`revoked ${e.item} ${e.hash} (ledger seq ${e.seq}); subscribed companies quarantine it on their next pull`);
  },

  list({ flags }, io, h) {
    const items = Object.values(itemsOf(h.ledger().fold()));
    if (flags.json) { io.out(JSON.stringify(items, null, 2)); return; }
    if (!items.length) { io.out('the commons is empty'); return; }
    for (const it of items) io.out(`${it.status.padEnd(11)} ${short(it.hash)}  ${it.item}  (${it.class})${it.surface_id ? `  surface ${it.surface_id}` : ''}${it.revoke_reason ? `  — ${it.revoke_reason}` : ''}`);
  },
};

module.exports = {
  commons(args, io, h, deps = {}) {
    const name = args.pos[0];
    if (!name || name === 'help' || args.flags.help) { io.out(COMMONS_USAGE); if (!name) throw new Refusal('commons needs a subcommand', 2); return; }
    const fn = sub[name] || usage(`unknown commons subcommand ${JSON.stringify(name)}\n\n${COMMONS_USAGE}`);
    const env = deps.env || process.env;
    if (name !== 'list' && env.HOLDING_RUN_ID) {
      throw new Refusal(`refused: RUN_CONTEXT: \`commons ${name}\` is a holding-Owner command and this process runs inside session ${env.HOLDING_RUN_ID} `
        + '(HOLDING_RUN_ID is set). Run it from your own terminal. (A tripwire, not a barrier: the OS sandbox user is the barrier.)', 1);
    }
    return fn(args, io, h, deps);
  },
  COMMONS_USAGE,
};
