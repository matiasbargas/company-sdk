#!/usr/bin/env node
'use strict';

/**
 * memory.js — CLI for a company's memory corpus.
 *
 * The store is per company: <project-dir>/.team-sdk/memory (derived, gitignored). Cross-company
 * memory travels through the holding commons, never a shared store. `--global` opts in to the
 * machine-wide ~/.team-sdk/memory, which is a cross-company leak risk (packages/memory README).
 *
 * Usage (every command takes [--dir <project-dir>] (default: cwd) or --global):
 *   sdk-memory ingest <project-dir>            # Ingest from a project (into that project's store)
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

// Positional args, with flag values (--dir <x>, --project <x>, --class <x>) removed.
const VALUE_FLAGS = new Set(['--dir', '--project', '--class']);
const positional = [];
for (let i = 1; i < args.length; i++) {
  if (VALUE_FLAGS.has(args[i])) { i++; continue; }
  if (!args[i].startsWith('--')) positional.push(args[i]);
}
const ingestTarget = command === 'ingest' ? positional[0] : null;
// Created lazily, so a usage error never writes a store directory.
let storeInstance = null;
const storeOf = () => storeInstance || (storeInstance = createMemoryStore(args.includes('--global')
  ? { global: true }
  : { projectDir: require('path').resolve(getFlag('dir') || ingestTarget || process.cwd()) }));
const store = new Proxy({}, { get: (_, k) => { const s = storeOf(); const v = s[k]; return typeof v === 'function' ? v.bind(s) : v; } });

switch (command) {
  case 'ingest': {
    const projectDir = ingestTarget;
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
    const question = positional.join(' ');
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
