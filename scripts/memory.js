#!/usr/bin/env node
'use strict';

/**
 * memory.js — CLI for the cross-project memory corpus.
 *
 * Usage:
 *   sdk-memory ingest <project-dir>            # Ingest from a project
 *   sdk-memory query "what about auth?"         # Search the corpus
 *   sdk-memory stats                            # Corpus overview
 *   sdk-memory list                             # List ingested projects
 *   sdk-memory decisions [--project X]          # List decisions
 *   sdk-memory kills [--class FRAMING_WRONG]    # List kills
 */

const { createMemoryStore } = require('../packages/memory/src');

const args = process.argv.slice(2);
const command = args[0];

function getFlag(name) {
  const idx = args.indexOf(`--${name}`);
  if (idx === -1) return null;
  return args[idx + 1] || null;
}

const store = createMemoryStore();

switch (command) {
  case 'ingest': {
    const projectDir = args[1];
    if (!projectDir) {
      console.error('Usage: sdk-memory ingest <project-dir>');
      process.exit(1);
    }
    const result = store.ingest(projectDir);
    console.log(`✓ Ingested from ${projectDir}`);
    console.log(`  Added: ${result.added}, Skipped: ${result.skipped}, Total corpus: ${result.total}`);
    break;
  }

  case 'query': {
    const question = args.slice(1).filter(a => !a.startsWith('--')).join(' ');
    if (!question) {
      console.error('Usage: sdk-memory query "your question"');
      process.exit(1);
    }
    const filters = {};
    if (getFlag('project')) filters.project = getFlag('project');
    if (getFlag('type')) filters.type = getFlag('type');
    if (getFlag('domain')) filters.domain = getFlag('domain');
    filters.limit = parseInt(getFlag('limit') || '20', 10);

    const results = store.query(question, filters);
    if (results.length === 0) {
      console.log('No matches found.');
    } else {
      console.log(`Found ${results.length} match${results.length === 1 ? '' : 'es'}:\n`);
      for (const r of results) {
        console.log(`  [${r.type}] ${r.date} — ${r.project}`);
        console.log(`  ${r.summary}`);
        if (r.rationale) console.log(`  ↳ ${r.rationale.slice(0, 120)}`);
        console.log();
      }
    }
    break;
  }

  case 'stats': {
    const s = store.stats();
    console.log(`Memory Corpus: ${s.totalEntries} entries across ${s.projectCount} project${s.projectCount === 1 ? '' : 's'}`);
    if (s.dateRange) {
      console.log(`Date range: ${s.dateRange.earliest} → ${s.dateRange.latest}`);
    }
    console.log(`By type: ${Object.entries(s.byType).map(([t, c]) => `${t}: ${c}`).join(', ')}`);
    if (s.projects.length > 0) {
      console.log(`Projects: ${s.projects.join(', ')}`);
    }
    break;
  }

  case 'list': {
    const projects = store.listProjects();
    if (projects.length === 0) {
      console.log('No projects ingested yet. Run: sdk-memory ingest <project-dir>');
    } else {
      console.log('Ingested projects:\n');
      for (const p of projects) {
        console.log(`  ${p.name} — ${p.entryCount} entries (last: ${p.lastIngest ? p.lastIngest.slice(0, 10) : 'unknown'})`);
      }
    }
    break;
  }

  case 'decisions': {
    const filters = {};
    if (getFlag('project')) filters.project = getFlag('project');
    if (getFlag('domain')) filters.domain = getFlag('domain');
    if (getFlag('role')) filters.madeBy = getFlag('role');
    const results = store.getDecisions(filters);
    console.log(`${results.length} decision${results.length === 1 ? '' : 's'}:\n`);
    for (const r of results) {
      const rev = r.reversible === true ? '↩' : r.reversible === false ? '⛔' : '?';
      console.log(`  ${rev} ${r.date} [${r.project}] ${r.summary}`);
    }
    break;
  }

  case 'kills': {
    const filters = {};
    if (getFlag('project')) filters.project = getFlag('project');
    if (getFlag('class')) filters.killClass = getFlag('class');
    const results = store.getKills(filters);
    console.log(`${results.length} kill${results.length === 1 ? '' : 's'}:\n`);
    for (const r of results) {
      console.log(`  ${r.date} [${r.project}] ${r.killClass} — ${r.summary}`);
    }
    break;
  }

  default:
    console.log(`
sdk-memory — Cross-project decision corpus

Commands:
  ingest <project-dir>    Ingest decisions/kills from a project
  query "question"        Search the corpus (--project, --type, --domain)
  stats                   Corpus overview
  list                    List ingested projects
  decisions               List decisions (--project, --domain, --role)
  kills                   List kills (--project, --class)
`);
}
