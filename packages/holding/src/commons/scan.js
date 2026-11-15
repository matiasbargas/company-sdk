'use strict';

/**
 * commons/scan.js — deterministic secret and PII scans (cap-po-data-001, cap-po-commons-002).
 *
 * Pure regular expressions, no model and no network: the same input always gives the same
 * findings. Any finding refuses publication. A finding names its kind and file:line and never
 * echoes the matched value (the refusal message must not become the leak).
 *
 * Kinds: api-key (Anthropic, OpenAI, AWS, GitHub, Slack, Google, Stripe, generic key=value),
 * private-key (PEM blocks), email, phone (9–15 digits in phone-like grouping, or + prefixed).
 * Known gap: names, postal addresses and national ids are not detected; v0's rule is that no
 * personal data enters the commons at all, so the consent attestations carry that promise.
 */

const SECRET_PATTERNS = [
  ['api-key', /sk-ant-[A-Za-z0-9_-]{16,}/],
  ['api-key', /\bsk-(?:proj-|live-|test-)?[A-Za-z0-9_-]{20,}/],
  ['api-key', /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/],
  ['api-key', /\bgh[pousr]_[A-Za-z0-9]{30,}\b/],
  ['api-key', /\bgithub_pat_[A-Za-z0-9_]{30,}/],
  ['api-key', /\bxox[abprs]-[A-Za-z0-9-]{10,}/],
  ['api-key', /\bAIza[0-9A-Za-z_-]{35}\b/],
  ['api-key', /\b[rs]k_(?:live|test)_[A-Za-z0-9]{16,}/],
  ['api-key', /\b(?:api[_-]?key|secret|token|passw(?:or)?d|auth)\b["']?\s*[:=]\s*["']?[A-Za-z0-9_\-/+=.]{16,}/i],
  ['private-key', /-----BEGIN [A-Z0-9 ]*PRIVATE KEY-----/],
];
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/;
// Candidate phone: optional +CC, optional (area), then 2+ digit groups joined by space/dot/dash.
const PHONE_RE = /(?<![\w.§/:-])(\+\d{1,3}[ .-]?)?(\(\d{1,4}\)[ .-]?)?\d{2,4}(?:[ .-]\d{2,4}){1,4}(?![\w.-]?\d)/g;
const PLUS_PHONE_RE = /(?<![\w+])\+\d{8,15}\b/;

function hasPhone(line) {
  if (PLUS_PHONE_RE.test(line)) return true;
  for (const m of line.matchAll(PHONE_RE)) {
    const s = m[0];
    const digits = s.replace(/\D/g, '').length;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) continue; // ISO date
    if (digits >= 9 && digits <= 15 && (m[1] || /[ .-]/.test(s))) return true;
  }
  return false;
}

/** Findings in one text: [{ file, line, kind }] (one per kind per line). */
function scanText(text, file) {
  const out = [];
  const lines = String(text).split('\n');
  lines.forEach((line, i) => {
    const kinds = new Set();
    for (const [kind, re] of SECRET_PATTERNS) if (re.test(line)) kinds.add(kind);
    if (EMAIL_RE.test(line)) kinds.add('email');
    if (hasPhone(line)) kinds.add('phone');
    for (const kind of kinds) out.push({ file, line: i + 1, kind });
  });
  return out;
}

/** Findings across an item's collected files (binary-safe: decoded as latin1 for matching). */
function scanFiles(files) {
  const out = [];
  for (const f of files) out.push(...scanText(f.content.toString('latin1'), f.rel));
  return out;
}

const formatFindings = (findings) => findings.map(f => `${f.file}:${f.line} ${f.kind}`).join(', ');

module.exports = { scanText, scanFiles, formatFindings };
