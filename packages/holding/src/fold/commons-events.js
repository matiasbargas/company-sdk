'use strict';

/**
 * fold/commons-events.js — commons lifecycle in the ledger (cap-po-commons-001/002/003).
 *
 *   commons_publish  { item, company, class, hash, files, consent_sha256?, irreversible? }   → quarantined
 *   commons_admit    { item, hash, surface_id, roster: [{company, role}] }                     → admitted
 *   commons_revoke   { item, hash, reason }                                                    → revoked
 *
 * state.commons.items is keyed by tree hash (content addressing: one hash is one item version).
 * The cross-company roster rule is re-checked here, so an admission written by hand cannot skip
 * it. Revocation appends; nothing earlier is touched (history is never rewritten).
 */

const { fail } = require('./core');
const { CLASSES } = require('../commons/policy');
const { HASH_RE } = require('../commons/treehash');
const { parseSurfaceId, rosterProblem } = require('../commons/surface');

const ITEM_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+$/;

function commons(ctx) {
  if (!ctx.state.commons) ctx.state.commons = { items: {} };
  return ctx.state.commons;
}
function known(ctx, e) {
  if (!HASH_RE.test(String(e.hash))) fail('COMMONS_INVALID', `${e.type}.hash must be a sha256: tree hash`);
  const it = commons(ctx).items[e.hash];
  if (!it) fail('COMMONS_UNKNOWN_ITEM', `no commons item ${e.hash} was published`);
  if (e.item !== it.item) fail('COMMONS_INVALID', `${e.hash} is ${it.item}, not ${JSON.stringify(e.item)}`);
  return it;
}

module.exports = {
  commons_publish(ctx, e) {
    if (typeof e.item !== 'string' || !ITEM_RE.test(e.item)) fail('COMMONS_INVALID', 'commons_publish.item must be company/name');
    if (e.item.split('/')[0] !== e.company) fail('COMMONS_INVALID', `item ${e.item} does not belong to company ${JSON.stringify(e.company)}`);
    if (!CLASSES.includes(e.class)) fail('COMMONS_INVALID', `commons_publish.class must be one of ${CLASSES.join(', ')}`);
    if (!HASH_RE.test(String(e.hash))) fail('COMMONS_INVALID', 'commons_publish.hash must be a sha256: tree hash');
    if (!Number.isSafeInteger(e.files) || e.files <= 0) fail('COMMONS_INVALID', 'commons_publish.files must be a positive integer');
    if (e.class === 'published-context' && !/^[0-9a-f]{64}$/.test(String(e.consent_sha256))) {
      fail('CONSENT_REQUIRED', 'published-context needs consent_sha256 (the consent record signed by the company Owner)');
    }
    const items = commons(ctx).items;
    if (items[e.hash]) fail('COMMONS_DUPLICATE', `${e.hash} is already in the commons as ${items[e.hash].item}`);
    items[e.hash] = {
      item: e.item, company: e.company, class: e.class, hash: e.hash, files: e.files, status: 'quarantined',
      published_seq: e.seq, cycle: ctx.state.cycle, irreversible: e.irreversible === true,
      ...(e.consent_sha256 ? { consent_sha256: e.consent_sha256 } : {}),
    };
  },

  commons_admit(ctx, e) {
    const it = known(ctx, e);
    if (it.status !== 'quarantined') fail('COMMONS_STATE', `${it.item} ${e.hash} is ${it.status}, not quarantined`);
    const q = parseSurfaceId(e.surface_id);
    if (!q) fail('COMMONS_INVALID', 'commons_admit.surface_id must be qualified as companyId/surfaceId@sha (C11)');
    const problem = rosterProblem(e.roster, it.company);
    if (problem) fail(problem.code, problem.message);
    Object.assign(it, { status: 'admitted', surface_id: e.surface_id, admitted_seq: e.seq });
  },

  commons_revoke(ctx, e) {
    const it = known(ctx, e);
    if (it.status === 'revoked') fail('COMMONS_STATE', `${it.item} ${e.hash} is already revoked`);
    if (typeof e.reason !== 'string' || !e.reason.trim()) fail('COMMONS_INVALID', 'commons_revoke.reason is required');
    Object.assign(it, { status: 'revoked', revoked_seq: e.seq, revoke_reason: e.reason, status_before_revoke: it.status });
  },
};
