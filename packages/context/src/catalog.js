'use strict';

/**
 * catalog.js — Declarative file catalog for team-sdk projects.
 *
 * Extracted from doc.js cmdIndex. Single source of truth for every file
 * a project can contain, its domain, owner, purpose, and load triggers.
 *
 * Mario condition: version field on schema, load-time validation.
 */

const CATALOG_VERSION = '1.0';

/**
 * The canonical project file catalog.
 * Every consumer must import this from the package — no local copies.
 */
const CATALOG = Object.freeze([
  // Core session files
  { path: 'current-status.md',           domain: 'strategy',    owner: 'Coordinator',    purpose: 'Session continuity — read every session, always first',                          load_when: ['session-start'] },
  { path: 'project.md',                  domain: 'strategy',    owner: 'Coordinator',    purpose: 'Full conversation record and release plan',                                       load_when: ['session-start', 'full-context'] },
  { path: 'history.md',                  domain: 'strategy',    owner: 'all',            purpose: 'Permanent decision record — all consequential decisions with rationale',           load_when: ['decision-review', 'pre-tag', 'irreversible-decision'] },
  { path: 'project-map.md',              domain: 'strategy',    owner: 'CEO',            purpose: 'CEO-validated release artifact — sealed at project completion',                   load_when: ['release-close', 'ceo-gate'] },
  { path: 'idea.md',                     domain: 'strategy',    owner: 'CEO',            purpose: 'Day 0 brief — raw idea shaped into the CEO activation message',                  load_when: ['discovery', 'first-session'] },
  { path: 'team.md',                     domain: 'people',      owner: 'Coordinator',    purpose: 'Active agents roster, metrics, dissolved agents history, onboarding log',         load_when: ['session-start', 'team-review', 'onboarding'] },
  { path: '.sdkrc',                      domain: 'strategy',    owner: 'Coordinator',    purpose: 'SDK configuration — release ID, squad type, project metadata',                    load_when: ['session-start', 'config'] },
  // Requirements files
  { path: 'general-requirements.md',     domain: 'strategy',    owner: 'Coordinator',    purpose: 'Cross-domain requirements aggregate — Coordinator-maintained',                    load_when: ['full-context', 'session-start'] },
  { path: 'engineering-requirements.md', domain: 'engineering', owner: 'CTO',            purpose: 'Architecture decisions, make/buy/partner, interface contracts, delivery state',   load_when: ['architecture-review', 'sprint-planning', 'technical-decision', 'build-vs-buy'] },
  { path: 'product-requirements.md',     domain: 'product',     owner: 'PM',             purpose: 'Product scope, user stories, friction log, mission kanban',                      load_when: ['mission-shaping', 'scope-review', 'sprint-planning', 'user-story'] },
  { path: 'compliance-requirements.md',   domain: 'legal',       owner: 'CLO + CISO',     purpose: 'CLO regulatory map + CISO threat model — hard gate for CTO activation',           load_when: ['legal-review', 'security-review', 'before-cto-activation', 'compliance-check', 'regulatory', 'threat-model', 'auth-design'] },
  { path: 'design-requirements.md',      domain: 'design',      owner: 'Designer',       purpose: 'Interface requirements, design direction, SDD artifacts',                         load_when: ['interface-design', 'sdd-step2', 'ux-review'] },
  { path: 'business-requirements.md',    domain: 'business',    owner: 'CFO',            purpose: 'Finance, marketing, revenue, data, operations, and people requirements',          load_when: ['budget-review', 'gtm-planning', 'vendor-review', 'unit-economics'] },
  // Area logs
  { path: 'engineering-log.md',          domain: 'engineering', owner: 'CTO',            purpose: 'CTO, Mario, Staff Eng, EM, IC engineers — state changes and decisions',          load_when: ['engineering-domain', 'architecture-review'] },
  { path: 'product-log.md',              domain: 'product',     owner: 'PM',             purpose: 'PM, CMO, CRO, CDO — product and go-to-market state changes + CHRO, EM — people and pod changes', load_when: ['product-domain', 'mission-shaping', 'people-domain', 'pod-management', 'hiring'] },
  { path: 'design-log.md',               domain: 'design',      owner: 'Designer',       purpose: 'Designer and UX Researcher — design decisions and research findings',             load_when: ['design-domain', 'interface-design'] },
  { path: 'strategy-log.md',             domain: 'strategy',    owner: 'Coordinator',    purpose: 'CEO and Coordinator strategy decisions + COO, CLO, CISO, CFO operations and compliance state changes', load_when: ['strategy-review', 'retro', 'operations-domain', 'vendor-review'] },
  // Research Chapter
  { path: 'research-requirements.md',    domain: 'research',    owner: 'UX Researcher',  purpose: 'Research backlog — study requests, triage, completion tracking',                  load_when: ['research-request', 'study-planning'] },
  { path: 'research-log.md',             domain: 'research',    owner: 'UX Researcher',  purpose: 'Research area log — study publications, backlog triage, insights',                load_when: ['research-domain', 'study-review'] },
  // Generated files
  { path: 'context-manifest.json',       domain: 'strategy',    owner: 'Coordinator',    purpose: 'Generated project snapshot — current phase, missions, next agent to activate',   load_when: ['session-start'] },
  { path: 'context-index.json',          domain: 'strategy',    owner: 'Coordinator',    purpose: 'Generated file map — domain routing, query map, agent capabilities',              load_when: ['session-start'] },
]);

/**
 * Validate the CATALOG at load time.
 * Returns an array of error strings. Empty = valid.
 */
function validateCatalog(catalog) {
  const errors = [];
  const paths = new Set();
  for (let i = 0; i < catalog.length; i++) {
    const entry = catalog[i];
    if (!entry.path) errors.push(`Entry ${i}: missing path`);
    if (!entry.domain) errors.push(`Entry ${i}: missing domain`);
    if (!entry.owner) errors.push(`Entry ${i}: missing owner`);
    if (!entry.purpose) errors.push(`Entry ${i}: missing purpose`);
    if (!entry.load_when || !Array.isArray(entry.load_when) || entry.load_when.length === 0) {
      errors.push(`Entry ${i} (${entry.path}): missing or empty load_when`);
    }
    if (entry.path && paths.has(entry.path)) {
      errors.push(`Entry ${i}: duplicate path '${entry.path}'`);
    }
    if (entry.path) paths.add(entry.path);
  }
  return errors;
}

module.exports = { CATALOG, CATALOG_VERSION, validateCatalog };
