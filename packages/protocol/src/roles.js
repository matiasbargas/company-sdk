'use strict';

/**
 * roles.js — Canonical role data structure.
 *
 * Unifies inferDomain (doc.js) and inferLogFile (intent-resolver.js) into
 * a single data-driven lookup. Mario condition: data structure, not if-chains.
 *
 * Every role from team/roles/CLAUDE.md is registered here.
 */

/**
 * Canonical role definitions.
 * Key: lowercase role identifier (matches role file name without .md)
 * Value: { title, domain, logFile, group, bu }
 */
const ROLES = Object.freeze({
  // Strategic Layer
  ceo:              { title: 'CEO',                    domain: 'strategy',    logFile: 'strategy-log.md',    group: 'strategic',  bu: 'strategy' },
  coordinator:      { title: 'Coordinator',            domain: 'strategy',    logFile: 'strategy-log.md',    group: 'strategic',  bu: 'strategy' },

  // Domain Specialists
  clo:              { title: 'CLO',                    domain: 'legal',       logFile: 'operations-log.md',  group: 'specialist', bu: 'operations' },
  ciso:             { title: 'CISO',                   domain: 'security',    logFile: 'operations-log.md',  group: 'specialist', bu: 'operations' },
  cfo:              { title: 'CFO',                    domain: 'finance',     logFile: 'operations-log.md',  group: 'specialist', bu: 'operations' },
  cmo:              { title: 'CMO',                    domain: 'product',     logFile: 'product-log.md',     group: 'specialist', bu: 'product' },
  cro:              { title: 'CRO',                    domain: 'revenue',     logFile: 'product-log.md',     group: 'specialist', bu: 'product' },
  cdo:              { title: 'CDO',                    domain: 'data',        logFile: 'engineering-log.md', group: 'specialist', bu: 'engineering' },
  coo:              { title: 'COO',                    domain: 'operations',  logFile: 'operations-log.md',  group: 'specialist', bu: 'operations' },
  chro:             { title: 'CHRO',                   domain: 'people',      logFile: 'people-log.md',      group: 'specialist', bu: 'people' },

  // Execution Layer
  cto:              { title: 'CTO',                    domain: 'engineering', logFile: 'engineering-log.md', group: 'execution',  bu: 'engineering' },
  'chief-engineer': { title: 'Chief Engineer',         domain: 'engineering', logFile: 'engineering-log.md', group: 'execution',  bu: 'engineering' },
  pm:               { title: 'PM',                     domain: 'product',     logFile: 'product-log.md',     group: 'execution',  bu: 'product' },
  designer:         { title: 'Designer',               domain: 'design',      logFile: 'design-log.md',      group: 'execution',  bu: 'product' },
  'staff-engineer': { title: 'Staff Engineer',         domain: 'engineering', logFile: 'engineering-log.md', group: 'execution',  bu: 'engineering' },
  em:               { title: 'EM',                     domain: 'engineering', logFile: 'engineering-log.md', group: 'execution',  bu: 'engineering' },
  engineer:         { title: 'Engineer',               domain: 'engineering', logFile: 'engineering-log.md', group: 'execution',  bu: 'engineering' },
  liaison:          { title: 'Liaison',                domain: 'product',     logFile: 'product-log.md',     group: 'execution',  bu: 'product' },

  // Research
  'ux-researcher':  { title: 'UX Researcher',          domain: 'research',    logFile: 'research-log.md',    group: 'research',   bu: 'product' },

  // Extended Specialists
  'cro-risk':       { title: 'Chief Risk Officer',     domain: 'risk',        logFile: 'operations-log.md',  group: 'extended',   bu: 'operations' },
  'cco-compliance': { title: 'Chief Compliance Officer', domain: 'compliance', logFile: 'operations-log.md', group: 'extended',   bu: 'operations' },
  'cco-customer':   { title: 'Chief Customer Officer', domain: 'customer',    logFile: 'product-log.md',     group: 'extended',   bu: 'product' },
  'cpo-protocol':   { title: 'Chief Protocol Officer', domain: 'protocol',    logFile: 'engineering-log.md', group: 'extended',   bu: 'engineering' },
  'cco-credit':     { title: 'Chief Credit Officer',   domain: 'credit',      logFile: 'operations-log.md',  group: 'extended',   bu: 'operations' },
  'cpo-partnerships': { title: 'Chief Partnerships Officer', domain: 'partnerships', logFile: 'product-log.md', group: 'extended', bu: 'product' },
  cao:              { title: 'Chief Analytics Officer', domain: 'analytics',   logFile: 'engineering-log.md', group: 'extended',   bu: 'engineering' },
  caio:             { title: 'Chief AI Officer',        domain: 'ai',          logFile: 'engineering-log.md', group: 'extended',   bu: 'engineering' },

  // Quality
  'test-engineer':  { title: 'Test Engineer',          domain: 'engineering', logFile: 'engineering-log.md', group: 'quality',    bu: 'engineering' },
});

/** Role groups for activation and filtering */
const ROLE_GROUPS = Object.freeze({
  strategic:  Object.keys(ROLES).filter(k => ROLES[k].group === 'strategic'),
  specialist: Object.keys(ROLES).filter(k => ROLES[k].group === 'specialist'),
  execution:  Object.keys(ROLES).filter(k => ROLES[k].group === 'execution'),
  research:   Object.keys(ROLES).filter(k => ROLES[k].group === 'research'),
  extended:   Object.keys(ROLES).filter(k => ROLES[k].group === 'extended'),
  quality:    Object.keys(ROLES).filter(k => ROLES[k].group === 'quality'),
});

/** Full Discovery → Execution activation order */
const ACTIVATION_ORDER = Object.freeze([
  // Phase 0
  'coordinator',
  // Phase 1
  'ceo', 'clo', 'ciso', 'cfo', 'cmo', 'cro', 'cdo', 'coo', 'chro',
  'ux-researcher', 'designer', 'pm',
  // Phase 2
  'cto', 'chief-engineer', 'staff-engineer', 'em',
  // Phase 3
  'liaison', 'engineer',
]);

/**
 * Look up a role by key or by searching title/name.
 * Handles: 'cto', 'CTO', 'Chief Engineer', 'Mario', 'mario', etc.
 * Returns the role entry or null.
 */
function resolveRole(input) {
  if (!input) return null;
  const normalized = input.toLowerCase().trim();

  // Direct key match
  if (ROLES[normalized]) return { key: normalized, ...ROLES[normalized] };

  // Title match (case-insensitive)
  for (const [key, role] of Object.entries(ROLES)) {
    if (role.title.toLowerCase() === normalized) return { key, ...role };
  }

  // Partial match in title (e.g., 'engineer' matches 'Chief Engineer', 'Staff Engineer', etc.)
  // Return first match — caller should use specific keys for precision
  for (const [key, role] of Object.entries(ROLES)) {
    if (role.title.toLowerCase().includes(normalized)) return { key, ...role };
  }

  return null;
}

/**
 * Get the domain for a role string. Replaces inferDomain.
 * @param {string} role - Role key, title, or name
 * @returns {string} Domain name, or 'engineering' as fallback
 */
function inferDomain(role) {
  const resolved = resolveRole(role);
  return resolved ? resolved.domain : 'engineering';
}

/**
 * Get the log file for a role string. Replaces inferLogFile.
 * @param {string} role - Role key, title, or name
 * @returns {string} Log file name
 */
function inferLogFile(role) {
  const resolved = resolveRole(role);
  return resolved ? resolved.logFile : 'engineering-log.md';
}

module.exports = {
  ROLES,
  ROLE_GROUPS,
  ACTIVATION_ORDER,
  resolveRole,
  inferDomain,
  inferLogFile,
};
