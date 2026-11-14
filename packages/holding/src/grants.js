'use strict';

/**
 * grants.js — grant shape and proof matching (cap-po-grant-001, cap-po-proof-001).
 *
 * A grant is malformed unless it declares tranches, a named proof per tranche, and a kill
 * condition. Proof is pass/fail: a recorded proof matches a tranche's named proof exactly
 * (same kind, same company-qualified ref) and carries the commit SHA it was checked at.
 * Tranche gating itself (what is drawable when) lives in the ledger fold, which calls these.
 */

const PROOF_KINDS = ['verified_surface', 'graduated_cycle', 'owner_approved_ship'];

// Company-qualified reference (C11 qualifies by companyId): "acme/SURFACE-20261114-x-001",
// "acme/discovery/2" (a §31 loop/cycle), "acme/implementation/pod-auth/1", "acme/ship-v1".
// Segments may not be "." or ".." so a ref can never name a path outside the company repo.
const SEGMENT = '(?!\\.{1,2}(?:/|$))[A-Za-z0-9._-]+';
const REF_RE = new RegExp(`^${SEGMENT}(?:/${SEGMENT})+$`);
const SHA_RE = /^[0-9a-f]{7,64}$/;

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;
const isPositiveInt = (v) => Number.isSafeInteger(v) && v > 0;

function validateNamedProof(p, where) {
  const errors = [];
  if (!p || typeof p !== 'object') return [`${where}: a named proof is required`];
  if (!PROOF_KINDS.includes(p.kind)) errors.push(`${where}.kind must be one of ${PROOF_KINDS.join(', ')}`);
  if (typeof p.ref !== 'string' || !REF_RE.test(p.ref)) errors.push(`${where}.ref must be a company-qualified id (company/id)`);
  return errors;
}

/** Validate a grant body (no ledger envelope). Returns { ok, errors: string[] }. */
function validateGrant(g) {
  const errors = [];
  if (!g || typeof g !== 'object') return { ok: false, errors: ['grant must be an object'] };
  for (const f of ['grant_id', 'company', 'mission_id']) {
    if (!isNonEmptyString(g[f])) errors.push(`${f} is required`);
  }
  if (!isPositiveInt(g.appetite_fu)) errors.push('appetite_fu must be a positive integer');
  if (!isNonEmptyString(g.kill_condition)) errors.push('kill_condition is required (a grant without one is malformed)');
  if (!Array.isArray(g.tranches) || g.tranches.length === 0) {
    errors.push('tranches must be a non-empty array');
  } else {
    const seen = new Set();
    let total = 0;
    g.tranches.forEach((t, i) => {
      const where = `tranches[${i}]`;
      if (!t || typeof t !== 'object') { errors.push(`${where} must be an object`); return; }
      if (!isPositiveInt(t.size_fu)) errors.push(`${where}.size_fu must be a positive integer`);
      else total += t.size_fu;
      const pe = validateNamedProof(t.proof, `${where}.proof`);
      errors.push(...pe);
      if (pe.length === 0) {
        const key = `${t.proof.kind}:${t.proof.ref}`;
        if (seen.has(key)) errors.push(`${where}.proof repeats an earlier tranche's proof (one proof unlocks at most one tranche)`);
        seen.add(key);
      }
    });
    if (isPositiveInt(g.appetite_fu) && total > g.appetite_fu) {
      errors.push(`tranches sum to ${total} FU, above appetite_fu ${g.appetite_fu}`);
    }
  }
  return { ok: errors.length === 0, errors };
}

/** Validate a recorded proof { kind, ref, sha }. Returns string[] of errors. */
function validateRecordedProof(p) {
  const errors = validateNamedProof(p, 'proof');
  if (p && typeof p === 'object' && (typeof p.sha !== 'string' || !SHA_RE.test(p.sha))) {
    errors.push('proof.sha must be the commit SHA the proof was checked at (hex, 7-64 chars)');
  }
  return errors;
}

/** Pass/fail: does a recorded proof satisfy a tranche's named proof? */
function proofMatches(named, recorded) {
  return !!named && !!recorded && named.kind === recorded.kind && named.ref === recorded.ref;
}

/** C11: surface ids are qualified as companyId/surfaceId@sha. */
function qualifiedSurfaceId(ref, sha) {
  return `${ref}@${sha}`;
}

module.exports = { PROOF_KINDS, validateGrant, validateRecordedProof, proofMatches, qualifiedSurfaceId };
