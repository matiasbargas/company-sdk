'use strict';

/**
 * commons/ — the holding commons (cap-po-commons-001/002/003, cap-po-data-001).
 *
 *   treehash — content addressing (Mario C10)          policy — forbidden content, consent record
 *   scan     — deterministic secret/PII scan           surface — admitting §34 surface + roster rule
 *   store    — publish / admit / revoke in holding/commons
 *   pull     — company adoption with Owner approval, conflicts, revocations, commons.lock.json
 * The ledger side (commons_publish / commons_admit / commons_revoke) is fold/commons-events.js.
 */

const treehash = require('./treehash');
const policy = require('./policy');
const scan = require('./scan');
const surface = require('./surface');
const store = require('./store');
const pull = require('./pull');

module.exports = {
  CommonsError: treehash.CommonsError,
  collectFiles: treehash.collectFiles,
  treeHash: treehash.treeHash,
  COMMONS_CLASSES: policy.CLASSES,
  CONSENT_FIELDS: policy.CONSENT_FIELDS,
  policyFindings: policy.policyFindings,
  consentProblems: policy.consentProblems,
  scanText: scan.scanText,
  scanFiles: scan.scanFiles,
  rosterProblem: surface.rosterProblem,
  checkAdmissionSurface: surface.checkAdmissionSurface,
  publishItem: store.publishItem,
  admitItem: store.admitItem,
  revokeItem: store.revokeItem,
  pullCompany: pull.pullCompany,
  readCommonsLock: pull.readLock,
};
