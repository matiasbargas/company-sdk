'use strict';

/**
 * index-generator.js — Generate context-index.json for a project directory.
 * Extracted from doc.js cmdIndex.
 *
 * Deterministic: uses file mtime, not current clock.
 */

const fs = require('fs');
const path = require('path');
const { actions, opsMap } = require('../../protocol/src');
const { CATALOG } = require('./catalog');
const { CURRENT_INDEX_VERSION } = require('./schema');
const { parseFrontmatter } = require('./frontmatter');

/**
 * Org-level domain routing table.
 * Maps domain names to their lead, consultation agent, and files.
 */
const ORG_DOMAINS = Object.freeze({
  strategy:    { lead: 'Coordinator', consult: 'CEO',             files: ['current-status.md', 'project.md', 'history.md', 'project-map.md', 'strategy-log.md', 'general-requirements.md'] },
  engineering: { lead: 'CTO',         consult: 'CTO',             files: ['engineering-requirements.md', 'engineering-log.md'] },
  legal:       { lead: 'CLO',         consult: 'CLO',             files: ['compliance-requirements.md'] },
  security:    { lead: 'CISO',        consult: 'CISO',            files: ['compliance-requirements.md'] },
  product:     { lead: 'PM',          consult: 'PM',              files: ['product-requirements.md', 'product-log.md'] },
  design:      { lead: 'Designer',    consult: 'Designer',        files: ['design-requirements.md', 'design-log.md'] },
  business:    { lead: 'CFO',         consult: 'CFO',             files: ['business-requirements.md', 'strategy-log.md'] },
  people:      { lead: 'CHRO',        consult: 'CHRO',            files: ['product-log.md', 'team.md'] },
  research:    { lead: 'UX Researcher', consult: 'UX Researcher', files: ['research-requirements.md', 'research-log.md'] },
});

/**
 * Static query map — topic → files to read + agent to consult.
 */
const QUERY_MAP_STATIC = Object.freeze({
  'architecture':          { read: ['engineering-requirements.md'],                                consult: 'CTO' },
  'technical-decision':    { read: ['engineering-requirements.md', 'history.md'],                  consult: 'CTO' },
  'build-vs-buy':          { read: ['engineering-requirements.md', 'business-requirements.md'],    consult: 'CTO' },
  'platform-risk':         { read: ['engineering-requirements.md', 'compliance-requirements.md'],  consult: 'CTO' },
  'irreversible-decision': { read: ['engineering-requirements.md', 'history.md'],                  consult: 'Mario' },
  'quality-standard':      { read: ['engineering-requirements.md'],                                consult: 'Mario' },
  'interface-contract':    { read: ['engineering-requirements.md'],                                consult: 'Staff Engineer' },
  'sprint-state':          { read: ['engineering-requirements.md', 'product-requirements.md'],     consult: 'EM' },
  'pod-composition':       { read: ['engineering-requirements.md', 'product-log.md'],              consult: 'EM' },
  'legal-constraints':     { read: ['compliance-requirements.md'],                                 consult: 'CLO' },
  'compliance':            { read: ['compliance-requirements.md'],                                 consult: 'CLO' },
  'regulatory':            { read: ['compliance-requirements.md'],                                 consult: 'CLO' },
  'contracts':             { read: ['compliance-requirements.md', 'history.md'],                   consult: 'CLO' },
  'security':              { read: ['compliance-requirements.md'],                                 consult: 'CISO' },
  'threat-model':          { read: ['compliance-requirements.md'],                                 consult: 'CISO' },
  'auth-design':           { read: ['compliance-requirements.md', 'engineering-requirements.md'],  consult: 'CISO' },
  'data-protection':       { read: ['compliance-requirements.md'],                                 consult: 'CISO' },
  'product-scope':         { read: ['product-requirements.md'],                                    consult: 'PM' },
  'user-story':            { read: ['product-requirements.md', 'design-requirements.md'],          consult: 'PM' },
  'mission-kanban':        { read: ['product-requirements.md', 'product-log.md'],                  consult: 'PM' },
  'friction-log':          { read: ['product-requirements.md'],                                    consult: 'PM' },
  'interface-design':      { read: ['design-requirements.md'],                                     consult: 'Designer' },
  'ux-patterns':           { read: ['design-requirements.md'],                                     consult: 'Designer' },
  'user-research':         { read: ['research-requirements.md', 'research-log.md'],                consult: 'UX Researcher' },
  'assumption-validation': { read: ['research-requirements.md', 'product-requirements.md'],        consult: 'UX Researcher' },
  'study':                 { read: ['research-requirements.md'],                                   consult: 'UX Researcher' },
  'research-backlog':      { read: ['research-requirements.md'],                                   consult: 'UX Researcher' },
  'user-evidence':         { read: ['research-requirements.md', 'research-log.md'],                consult: 'UX Researcher' },
  'budget':                { read: ['business-requirements.md'],                                   consult: 'CFO' },
  'unit-economics':        { read: ['business-requirements.md'],                                   consult: 'CFO' },
  'runway':                { read: ['business-requirements.md'],                                   consult: 'CFO' },
  'revenue-model':         { read: ['business-requirements.md'],                                   consult: 'CRO' },
  'pricing':               { read: ['business-requirements.md'],                                   consult: 'CRO' },
  'gtm':                   { read: ['business-requirements.md'],                                   consult: 'CMO' },
  'positioning':           { read: ['business-requirements.md'],                                   consult: 'CMO' },
  'vendor':                { read: ['business-requirements.md', 'strategy-log.md'],               consult: 'COO' },
  'operations-runbook':    { read: ['business-requirements.md', 'strategy-log.md'],               consult: 'COO' },
  'data-governance':       { read: ['business-requirements.md', 'engineering-requirements.md'],    consult: 'CDO' },
  'instrumentation':       { read: ['business-requirements.md', 'product-requirements.md'],        consult: 'CDO' },
  'ai-strategy':           { read: ['engineering-requirements.md'],                                consult: 'CAIO' },
  'model-evaluation':      { read: ['engineering-requirements.md'],                                consult: 'CAIO' },
  'analytics':             { read: ['business-requirements.md', 'product-requirements.md'],        consult: 'CAO' },
  'experimentation':       { read: ['business-requirements.md', 'product-requirements.md'],        consult: 'CAO' },
  'hiring':                { read: ['product-log.md'],                                             consult: 'CHRO' },
  'team-composition':      { read: ['team.md', 'product-log.md'],                                  consult: 'CHRO' },
  'partnerships':          { read: ['business-requirements.md'],                                   consult: 'CPO Partnerships' },
  'ecosystem':             { read: ['business-requirements.md'],                                   consult: 'CPO Partnerships' },
  'enterprise-risk':       { read: ['business-requirements.md', 'compliance-requirements.md'],     consult: 'CRO Risk' },
  'credit-risk':           { read: ['business-requirements.md'],                                   consult: 'CCO Credit' },
  'customer-success':      { read: ['business-requirements.md', 'product-requirements.md'],        consult: 'CCO Customer' },
  'protocol-design':       { read: ['engineering-requirements.md'],                                consult: 'CPO Protocol' },
  'decisions':             { read: ['history.md'],                                                 consult: 'Coordinator' },
  'current-state':         { read: ['current-status.md'],                                          consult: 'Coordinator' },
  'release-plan':          { read: ['current-status.md', 'history.md'],                            consult: 'Coordinator' },
  'strategy':              { read: ['project.md', 'history.md'],                                   consult: 'CEO' },
  'vision':                { read: ['project.md', 'idea.md'],                                      consult: 'CEO' },
});

/**
 * Generate a context-index object from a project directory.
 * Does NOT write to disk — returns the index object.
 *
 * @param {string} projectDir - Absolute path to the project directory
 * @returns {object} The context-index object
 */
function generateIndex(projectDir) {
  const indexFile = path.join(projectDir, 'context-index.json');
  const now = Date.now();

  // Read existing index to increment version
  let previousVersion = 0;
  if (fs.existsSync(indexFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(indexFile, 'utf8'));
      if (typeof existing.indexVersion === 'number') previousVersion = existing.indexVersion;
    } catch (_) {}
  }

  // Release ID
  let release = 'unknown';
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  if (fs.existsSync(sdkrcPath)) {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (sdkrc.release) release = sdkrc.release;
    } catch (_) {}
  }
  if (release === 'unknown') {
    const statusPath = path.join(projectDir, 'current-status.md');
    if (fs.existsSync(statusPath)) {
      const m = fs.readFileSync(statusPath, 'utf8').match(/\*\*Release:\*\*\s*(.+)/);
      if (m) release = m[1].trim();
    }
  }

  // Reference mtime for determinism
  const refMtime = (() => {
    const statusPath = path.join(projectDir, 'current-status.md');
    if (fs.existsSync(statusPath)) return fs.statSync(statusPath).mtime;
    return new Date();
  })();

  // File catalog — compute staleness for each
  const files = CATALOG.map(entry => {
    const fullPath = path.join(projectDir, entry.path);
    const exists = fs.existsSync(fullPath);
    let ageHours = null;
    let stale = null;
    if (exists) {
      const mtime = fs.statSync(fullPath).mtime;
      ageHours = Math.round((now - mtime.getTime()) / 1000 / 60 / 60);
      stale = ageHours > 48;
    }
    return { ...entry, exists, ageHours, stale };
  }).filter(f => f.exists);

  // Dynamic study scanning
  const studiesDir = path.join(projectDir, 'research', 'studies');
  if (fs.existsSync(studiesDir)) {
    const studyFiles = fs.readdirSync(studiesDir).filter(f => f.endsWith('.md'));
    for (const sf of studyFiles) {
      const fullPath = path.join(studiesDir, sf);
      const mtime = fs.statSync(fullPath).mtime;
      const ageHours = Math.round((now - mtime.getTime()) / 1000 / 60 / 60);
      const content = fs.readFileSync(fullPath, 'utf8');
      const fm = content.match(/^---\n([\s\S]*?)\n---/);
      let title = sf.replace(/\.md$/, '');
      if (fm) {
        const titleMatch = fm[1].match(/title:\s*"([^"]*)"/);
        if (titleMatch) title = titleMatch[1];
      }
      files.push({
        path: `research/studies/${sf}`,
        domain: 'research',
        owner: 'UX Researcher',
        purpose: `Study: ${title}`,
        load_when: ['study-review', 'research-domain'],
        exists: true,
        ageHours,
        stale: ageHours > 168,
      });
    }
  }

  // Dynamic session scanning (permanent only)
  const permSessionsDir = path.join(projectDir, 'sessions', 'permanent');
  const sessionEntries = [];
  if (fs.existsSync(permSessionsDir)) {
    const sessionFiles = fs.readdirSync(permSessionsDir).filter(f => f.endsWith('.md'));
    for (const sf of sessionFiles) {
      const fullPath = path.join(permSessionsDir, sf);
      const mtime = fs.statSync(fullPath).mtime;
      const ageHours = Math.round((now - mtime.getTime()) / 1000 / 60 / 60);
      const content = fs.readFileSync(fullPath, 'utf8');
      const fm = parseFrontmatter(content);
      const title = fm.title || sf.replace(/\.md$/, '');
      const sessionDomains = fm.domains ? fm.domains.split(',').map(d => d.trim()).filter(Boolean) : ['strategy'];
      const sessionTags = fm.tags ? fm.tags.split(',').map(t => t.trim()).filter(Boolean) : [];

      files.push({
        path: `sessions/permanent/${sf}`,
        domain: sessionDomains[0] || 'strategy',
        owner: 'Coordinator',
        purpose: `Session: ${title}`,
        load_when: ['session-context', 'prior-discussion'],
        exists: true,
        ageHours,
        stale: ageHours > 720,
      });

      sessionEntries.push({
        path: `sessions/permanent/${sf}`,
        title,
        date: fm.date || sf.slice(0, 10),
        domains: sessionDomains,
        tags: sessionTags,
        participants: fm.participants ? fm.participants.split(',').map(p => p.trim()).filter(Boolean) : [],
        ageHours,
        stale: ageHours > 720,
      });
    }
  }

  // Build queryMap with session entries
  const queryMap = { ...QUERY_MAP_STATIC };
  queryMap['prior-session'] = { read: sessionEntries.map(s => s.path), consult: 'Coordinator' };
  queryMap['session-context'] = { read: sessionEntries.map(s => s.path), consult: 'Coordinator' };

  // Dynamic project domain scanning
  const domainsDir = path.join(projectDir, 'domains');
  const projectDomains = {};
  if (fs.existsSync(domainsDir)) {
    const domainDirs = fs.readdirSync(domainsDir).filter(d => {
      return fs.statSync(path.join(domainsDir, d)).isDirectory();
    });
    for (const dd of domainDirs) {
      const domainPath = path.join(domainsDir, dd);
      const summaryPath = path.join(domainPath, 'summary.md');
      let summary = '';
      let lead = 'Coordinator';
      let spawnWhen = [];
      let contextProvides = [];

      if (fs.existsSync(summaryPath)) {
        const content = fs.readFileSync(summaryPath, 'utf8');
        const fm = parseFrontmatter(content);
        if (fm.lead) lead = fm.lead;
        if (fm.spawn_when) spawnWhen = fm.spawn_when.split(',').map(s => s.trim()).filter(Boolean);
        if (fm.context_provides) contextProvides = fm.context_provides.split(',').map(s => s.trim()).filter(Boolean);
        const bodyMatch = content.match(/^---[\s\S]*?---\s*\n([\s\S]*)/);
        const body = bodyMatch ? bodyMatch[1].trim() : content.replace(/^---[\s\S]*?---/, '').trim();
        const firstPara = body.split('\n\n')[0] || body.split('\n')[0] || '';
        summary = firstPara.replace(/^#+\s*.*\n/, '').trim().slice(0, 500);
      }

      const allFiles = fs.readdirSync(domainPath).filter(f => f.endsWith('.md'));
      const l0Files = allFiles.filter(f => f === 'summary.md').map(f => `domains/${dd}/${f}`);
      const l1Files = allFiles.filter(f => f !== 'summary.md').map(f => `domains/${dd}/${f}`);

      projectDomains[dd] = {
        summary,
        lead,
        cross_loadable: true,
        files: { L0: l0Files, L1: l1Files },
        spawn_when: spawnWhen,
        context_provides: contextProvides,
      };

      for (const df of allFiles) {
        const fullPath = path.join(domainPath, df);
        const mtime = fs.statSync(fullPath).mtime;
        const ageHours = Math.round((now - mtime.getTime()) / 1000 / 60 / 60);
        files.push({
          path: `domains/${dd}/${df}`,
          domain: dd,
          owner: lead,
          purpose: df === 'summary.md' ? `Domain summary: ${dd}` : `Domain detail: ${dd}/${df.replace('.md', '')}`,
          load_when: df === 'summary.md' ? ['session-start', 'cockpit'] : ['domain-deep-dive', dd],
          exists: true,
          ageHours,
          stale: ageHours > 168,
        });
      }
    }
  }

  // Serialize actions for agent consumption
  const actionsForIndex = {};
  for (const [id, def] of Object.entries(actions)) {
    actionsForIndex[id] = { writes: def.writes, requires: def.requires, description: def.description };
  }

  // Project metadata
  let projectMeta = { name: path.basename(projectDir), type: 'product', squad: 'startup', summary: '' };
  if (fs.existsSync(sdkrcPath)) {
    try {
      const sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8'));
      if (sdkrc.projectName) projectMeta.name = sdkrc.projectName;
      if (sdkrc.type) projectMeta.type = sdkrc.type;
      if (sdkrc.squad) projectMeta.squad = sdkrc.squad;
    } catch (_) {}
  }

  return {
    schemaVersion: CURRENT_INDEX_VERSION,
    indexVersion: previousVersion + 1,
    generatedAt: refMtime.toISOString(),
    release,
    project: projectMeta,
    projectDomains,
    orgDomains: ORG_DOMAINS,
    queryMap,
    opsMap,
    actions: actionsForIndex,
    sessions: sessionEntries,
    files,
  };
}

module.exports = { generateIndex, ORG_DOMAINS, QUERY_MAP_STATIC };
