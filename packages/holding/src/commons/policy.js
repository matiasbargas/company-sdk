'use strict';

/**
 * commons/policy.js — what a commons item may carry (cap-po-commons-001) and the published-context
 * consent record (cap-po-commons-002, CLO fields).
 *
 * The commons carries knowledge, never control. Refused, by path or content, fail closed:
 *   - settings*.json, anything under .claude/      (Claude Code settings / permissions)
 *   - any path segment containing "hook"           (hooks, githooks, pre-commit hooks)
 *   - CHARTER.md                                    (a company's constitution is never imported)
 *   - MCP / permission config: .mcp.json, mcp*.{json,yaml,yml,toml}, permission*.{json,yaml,yml,toml}
 *   - executable scripts: any x bit, a "#!" first line, or a script extension
 *   - VCS metadata (.git/)
 * The false-positive cost is a renamed file; the false-negative cost is code execution in another
 * company. That asymmetry is why the rules are broad.
 */

const { HASH_RE } = require('./treehash');

const CLASSES = ['skill', 'protocol-improvement', 'kill-log-class', 'ratchet-class', 'published-context'];
const SCRIPT_EXT = /\.(sh|bash|zsh|fish|ksh|command|ps1|psm1|bat|cmd|py|pyc|js|mjs|cjs|ts|tsx|jsx|rb|pl|php|lua|exe|bin|dylib|so|app|jar|applescript|scpt)$/i;
const CONFIG_EXT = /\.(json|jsonc|ya?ml|toml)$/i;

/** Reasons one file is forbidden (empty when allowed). */
function forbiddenReasons(f) {
  const reasons = [];
  const segs = f.rel.split('/');
  const base = segs[segs.length - 1];
  if (/^settings.*\.json$/i.test(base)) reasons.push('settings file');
  if (segs.some(s => s.toLowerCase() === '.claude')) reasons.push('Claude Code config directory (.claude/)');
  if (segs.some(s => /hook/i.test(s))) reasons.push('hook');
  if (base.toLowerCase() === 'charter.md') reasons.push('CHARTER.md');
  if (base.toLowerCase() === '.mcp.json' || (/mcp/i.test(base) && CONFIG_EXT.test(base))) reasons.push('MCP config');
  if (/permission/i.test(base) && CONFIG_EXT.test(base)) reasons.push('permission config');
  if (segs.some(s => s === '.git')) reasons.push('VCS metadata (.git/)');
  if (f.mode & 0o111) reasons.push('executable (x bit set)');
  if (f.content.length >= 2 && f.content[0] === 0x23 && f.content[1] === 0x21) reasons.push('executable script (#! line)');
  if (SCRIPT_EXT.test(base)) reasons.push('executable script (extension)');
  return reasons;
}

/** All policy findings for an item's files: [{ file, reason }]. */
function policyFindings(files) {
  const out = [];
  for (const f of files) for (const reason of forbiddenReasons(f)) out.push({ file: f.rel, reason });
  return out;
}

// CLO consent record for published-context (Owner decision; field list from the CLO gate).
const CONSENT_FIELDS = ['artifact_id', 'content_hash', 'source_company', 'approving_owner', 'timestamp', 'scope', 'recipients',
  'license', 'revocability', 'attestations', 'competitively_sensitive', 'surface_id'];
const QUALIFIED_SURFACE_RE = /^[A-Za-z0-9._-]+\/[A-Za-z0-9._-]+@[0-9a-f]{7,64}$/;
const nonEmpty = (v) => typeof v === 'string' && v.trim().length > 0;
const nonEmptyList = (v) => Array.isArray(v) && v.length > 0 && v.every(nonEmpty);

/**
 * Validate a consent record against the item being published. Returns problems (strings, each
 * naming its field); empty means valid. `expect` = { hash, company, owner }.
 */
function consentProblems(c, expect) {
  if (!c || typeof c !== 'object' || Array.isArray(c)) return ['the consent record must be a JSON object'];
  const problems = [];
  for (const f of CONSENT_FIELDS) if (!(f in c) || c[f] === null || c[f] === '') problems.push(`${f} is missing`);
  if (problems.length) return problems;
  for (const f of ['artifact_id', 'source_company', 'approving_owner', 'scope', 'license', 'revocability']) {
    if (!nonEmpty(c[f])) problems.push(`${f} must be a non-empty string`);
  }
  if (!(nonEmpty(c.recipients) || nonEmptyList(c.recipients))) problems.push('recipients must name who may receive it');
  if (!nonEmptyList(c.attestations)) problems.push('attestations must be a non-empty list of statements');
  if (typeof c.competitively_sensitive !== 'boolean') problems.push('competitively_sensitive must be true or false');
  else if (c.competitively_sensitive) problems.push('competitively_sensitive is true: competitively sensitive context is not published in v0');
  if (!nonEmpty(c.timestamp) || Number.isNaN(Date.parse(c.timestamp))) problems.push('timestamp must be an ISO 8601 time');
  if (!HASH_RE.test(String(c.content_hash))) problems.push('content_hash must be a sha256: tree hash');
  else if (c.content_hash !== expect.hash) problems.push(`content_hash ${c.content_hash} does not match the item (${expect.hash})`);
  if (c.source_company !== expect.company) problems.push(`source_company ${JSON.stringify(c.source_company)} is not the publishing company ${expect.company}`);
  if (c.approving_owner !== expect.owner) problems.push(`approving_owner ${JSON.stringify(c.approving_owner)} is not ${expect.company}'s Owner (${expect.owner})`);
  if (!QUALIFIED_SURFACE_RE.test(String(c.surface_id))) problems.push('surface_id must be qualified as companyId/surfaceId@sha (C11)');
  return problems;
}

module.exports = { CLASSES, forbiddenReasons, policyFindings, CONSENT_FIELDS, consentProblems, QUALIFIED_SURFACE_RE };
