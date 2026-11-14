'use strict';

/**
 * portfolio.js — holding/portfolio.json validator, schema 1 (cap-po-registry-001, cap-po-registry-002, C7).
 *
 *   { schema_version: 1,
 *     holding: { owner },
 *     second_owner_gates: { os_isolation, multi_owner_charter_amendment, clo_gate_items },  // literal true = met
 *     companies: [{ id, name?, owner, path, sdkPath, runner: 'local', commons? }] }
 *
 * Rules: every company has an Owner, an absolute clone path and an absolute pinned sdkPath (C7);
 * the holding repo is never inside a company clone and no company clone is inside the holding
 * repo or inside another company (paths compared after resolving symlinks); a company whose
 * Owner is not the holding Owner is refused until every second-Owner gate is met; a company whose
 * <path>/CHARTER.md lacks a signed ratification line is refused (so the clone must exist first).
 * Errors are data ({ company, field, message, gate? }) so a CLI can print every problem at once.
 */

const fs = require('fs');
const path = require('path');

const SCHEMA_VERSION = 1;
const REQUIRED_FIELDS = ['id', 'owner', 'path', 'sdkPath', 'runner'];
const RUNNERS = ['local']; // v0: LocalRunner only; CloudRunner joins the list when it exists
const SECOND_OWNER_GATES = ['os_isolation', 'multi_owner_charter_amendment', 'clo_gate_items'];
const ID_RE = /^[A-Za-z0-9._-]+$/; // ids qualify surface ids (C11: companyId/surfaceId@sha)

const isNonEmptyString = (v) => typeof v === 'string' && v.trim().length > 0;

/** Resolve symlinks on the longest existing prefix, so a not-yet-cloned path still compares truly. */
function resolveReal(p) {
  let cur = path.resolve(p);
  const rest = [];
  while (!fs.existsSync(cur)) {
    const parent = path.dirname(cur);
    if (parent === cur) break;
    rest.unshift(path.basename(cur));
    cur = parent;
  }
  const base = fs.existsSync(cur) ? fs.realpathSync(cur) : cur;
  return path.join(base, ...rest);
}

// CHARTER.md ratification line, as in the SDK's own CHARTER.md:
//   - **Ratified by: <name> (Owner) on <date>**   (unsigned: underscores in place of name/date)
const RATIFIED_RE = /Ratified by:\s*([^(\n]*?)\s*\(Owner\)\s*on\s*([^*\n]*)/;
const isSigned = (v) => /[A-Za-z0-9]/.test(v) && !/^_+$/.test(v.trim());

/** Returns null when <companyPath>/CHARTER.md carries a signed ratification line, else the reason. */
function charterProblem(companyPath) {
  const file = path.join(companyPath, 'CHARTER.md');
  let text;
  try { text = fs.readFileSync(file, 'utf8'); } catch { return `no CHARTER.md at ${file}`; }
  const m = text.match(RATIFIED_RE);
  if (!m) return `${file} has no "Ratified by: <name> (Owner) on <date>" line`;
  if (!isSigned(m[1]) || !isSigned(m[2])) return `${file} is not ratified (the ratification line is unsigned)`;
  return null;
}

/** True when `inner` is `outer` or below it. */
function isWithin(inner, outer) {
  const rel = path.relative(outer, inner);
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${path.sep}`) && !path.isAbsolute(rel));
}

function validatePortfolio(doc, opts = {}) {
  if (!isNonEmptyString(opts.holdingDir)) {
    const err = new Error('HOLDING_DIR_REQUIRED: validatePortfolio needs opts.holdingDir (the holding repo root)');
    err.code = 'HOLDING_DIR_REQUIRED';
    throw err;
  }
  const errors = [];
  const add = (company, field, message, extra = {}) => errors.push({ company, field, message, ...extra });

  if (!doc || typeof doc !== 'object' || Array.isArray(doc)) {
    add(null, 'portfolio', 'portfolio must be a JSON object');
    return { ok: false, errors };
  }
  if (doc.schema_version !== SCHEMA_VERSION) add(null, 'schema_version', `schema_version must be ${SCHEMA_VERSION}, got ${JSON.stringify(doc.schema_version)}`);
  const holdingOwner = doc.holding && doc.holding.owner;
  if (!isNonEmptyString(holdingOwner)) add(null, 'holding.owner', 'the holding must name its Owner');
  if (!Array.isArray(doc.companies)) {
    add(null, 'companies', 'companies must be an array');
    return { ok: false, errors };
  }

  const holdingReal = resolveReal(opts.holdingDir);
  const gates = (doc.second_owner_gates && typeof doc.second_owner_gates === 'object') ? doc.second_owner_gates : {};
  const seenIds = new Set();
  const placed = []; // { id, real } for nesting checks

  doc.companies.forEach((c, i) => {
    if (!c || typeof c !== 'object' || Array.isArray(c)) { add(`companies[${i}]`, 'company', `companies[${i}] must be an object`); return; }
    const label = isNonEmptyString(c.id) ? c.id : `companies[${i}]`;
    for (const f of REQUIRED_FIELDS) {
      if (!isNonEmptyString(c[f])) add(label, f, `company ${label}: missing required field "${f}"`);
    }
    if (isNonEmptyString(c.id)) {
      if (!ID_RE.test(c.id)) add(label, 'id', `company ${label}: id may use only letters, digits, ".", "_" and "-"`);
      if (seenIds.has(c.id)) add(label, 'id', `company ${label}: duplicate id`);
      seenIds.add(c.id);
    }
    if (isNonEmptyString(c.runner) && !RUNNERS.includes(c.runner)) {
      add(label, 'runner', `company ${label}: runner must be one of ${RUNNERS.join(', ')}, got ${JSON.stringify(c.runner)}`);
    }
    if (isNonEmptyString(c.sdkPath) && !path.isAbsolute(c.sdkPath)) {
      add(label, 'sdkPath', `company ${label}: sdkPath must be an absolute, pinned path (C7)`);
    }
    if (isNonEmptyString(c.path)) {
      if (!path.isAbsolute(c.path)) {
        add(label, 'path', `company ${label}: path must be absolute`);
      } else {
        const real = resolveReal(c.path);
        if (isWithin(real, holdingReal)) add(label, 'path', `company ${label}: clone ${c.path} is inside the holding repo (C7)`);
        else if (isWithin(holdingReal, real)) add(label, 'path', `company ${label}: clone ${c.path} contains the holding repo (C7)`);
        for (const other of placed) {
          if (isWithin(real, other.real) || isWithin(other.real, real)) {
            add(label, 'path', `company ${label}: clone ${c.path} overlaps company ${other.id} (one repository per company)`);
          }
        }
        placed.push({ id: label, real });
        const problem = charterProblem(real);
        if (problem) add(label, 'charter', `company ${label}: CHARTER must be ratified before registration — ${problem}`);
      }
    }
    if (isNonEmptyString(c.owner) && isNonEmptyString(holdingOwner) && c.owner !== holdingOwner) {
      for (const gate of SECOND_OWNER_GATES) {
        if (gates[gate] !== true) {
          add(label, 'owner', `company ${label}: Owner ${c.owner} is not the holding Owner; second-Owner gate "${gate}" is not met`, { gate });
        }
      }
    }
  });

  return { ok: errors.length === 0, errors };
}

/** Read and validate a portfolio.json file. Never throws on bad content; returns { ok, errors, portfolio? }. */
function loadPortfolio(file, opts = {}) {
  let doc;
  try { doc = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (err) {
    return { ok: false, errors: [{ company: null, field: 'portfolio.json', message: `${file}: ${err.message}` }] };
  }
  const r = validatePortfolio(doc, opts);
  return r.ok ? { ...r, portfolio: doc } : r;
}

module.exports = { validatePortfolio, loadPortfolio, charterProblem, SECOND_OWNER_GATES, RUNNERS, SCHEMA_VERSION };
