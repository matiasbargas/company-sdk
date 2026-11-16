'use strict';

/**
 * store.js — Per-company memory store (a derived index, never the truth).
 *
 * Default location: `<projectDir>/.team-sdk/memory`, self-gitignored (the store writes
 * `<projectDir>/.team-sdk/.gitignore` = `*`). It is rebuilt from the company's own sources
 * (history.md, bus-log.md) by `ingest()`, so deleting it loses nothing.
 *
 * The machine-global `~/.team-sdk/memory` is NOT a default. It mixes every company on the
 * machine into one corpus with no consent: a cross-company leak risk. It is opt-in only
 * (`{ global: true }` or `TEAM_SDK_MEMORY_GLOBAL=1`), and is refused otherwise, including when
 * its path is passed as `storeDir`. Cross-company memory goes through the commons, not here.
 * See ./README.md.
 */

const { readFileSync, writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');
const { ingestProject } = require('./ingest');
const { validateEntry, normalizeEntry, legacyEntryId, upgradeLegacyEntry, SCHEMA_VERSION } = require('./schema');
const { queryEntries, getDecisions, getKills, getChallenges, corpusStats } = require('./query');

const COMPANY_STORE_SUBDIR = path.join('.team-sdk', 'memory');
const GLOBAL_OPT_IN_ENV = 'TEAM_SDK_MEMORY_GLOBAL';

/** `<projectDir>/.team-sdk/memory` — the per-company default. */
function companyStoreDir(projectDir) {
  return path.join(path.resolve(projectDir), COMPANY_STORE_SUBDIR);
}

/** `~/.team-sdk/memory` — resolved at call time; opt-in only. */
function globalStoreDir() {
  const home = process.env.HOME || process.env.USERPROFILE;
  if (!home) return null;
  return path.join(home, '.team-sdk', 'memory');
}

function storeError(code, message) {
  const err = new Error(message);
  err.code = code;
  return err;
}

/**
 * Decide where the store lives. Precedence: projectDir (company) → storeDir (explicit) →
 * global opt-in. No configuration is refused: there is no implicit machine-wide default.
 *
 * @returns {{ storeDir: string, scope: 'company'|'explicit'|'global', projectDir: string|null }}
 */
function resolveStoreLocation(config = {}) {
  const optedIn = config.global === true || process.env[GLOBAL_OPT_IN_ENV] === '1';
  const globalDir = globalStoreDir();
  const isGlobal = (dir) => !!globalDir && path.resolve(dir) === path.resolve(globalDir);

  if (config.projectDir) {
    const projectDir = path.resolve(config.projectDir);
    if (!existsSync(projectDir)) {
      throw storeError('MEMORY_PROJECT_NOT_FOUND', `memory: project directory not found: ${projectDir}`);
    }
    const storeDir = config.storeDir ? path.resolve(config.storeDir) : companyStoreDir(projectDir);
    if (isGlobal(storeDir) && !optedIn) {
      throw storeError('MEMORY_GLOBAL_NOT_OPTED_IN', globalRefusal());
    }
    return { storeDir, scope: isGlobal(storeDir) ? 'global' : (config.storeDir ? 'explicit' : 'company'), projectDir };
  }
  if (config.storeDir) {
    const storeDir = path.resolve(config.storeDir);
    if (isGlobal(storeDir) && !optedIn) {
      throw storeError('MEMORY_GLOBAL_NOT_OPTED_IN', globalRefusal());
    }
    return { storeDir, scope: isGlobal(storeDir) ? 'global' : 'explicit', projectDir: null };
  }
  if (optedIn) {
    if (!globalDir) throw storeError('MEMORY_STORE_UNCONFIGURED', 'memory: global store requested but $HOME is not set');
    return { storeDir: globalDir, scope: 'global', projectDir: null };
  }
  throw storeError('MEMORY_STORE_UNCONFIGURED',
    'memory: no store configured. Pass { projectDir } for the per-company store at <projectDir>/.team-sdk/memory. ' +
    `The machine-global ~/.team-sdk/memory is opt-in only ({ global: true } or ${GLOBAL_OPT_IN_ENV}=1) ` +
    'because it mixes companies (cross-company leak risk); cross-company memory goes through the commons.');
}

function globalRefusal() {
  return 'memory: ~/.team-sdk/memory is the machine-global store, a cross-company leak risk. ' +
    `It is opt-in only: pass { global: true } or set ${GLOBAL_OPT_IN_ENV}=1. ` +
    'Use { projectDir } for the per-company store; share across companies through the commons.';
}

/**
 * Create a memory store instance.
 *
 * @param {object} config
 * @param {string} [config.projectDir] — company root; store at <projectDir>/.team-sdk/memory (default)
 * @param {string} [config.storeDir]   — explicit directory (tests, tools). The global path is refused without opt-in.
 * @param {boolean} [config.global]    — opt in to ~/.team-sdk/memory (cross-company leak risk)
 * @returns {object} Memory store interface
 */
function createMemoryStore(config = {}) {
  const { storeDir, scope, projectDir } = resolveStoreLocation(config || {});

  mkdirSync(storeDir, { recursive: true });
  if (scope === 'company') {
    const gi = path.join(projectDir, '.team-sdk', '.gitignore');
    if (!existsSync(gi)) {
      writeFileSync(gi, '# Derived, per-company memory index (@team-sdk/memory). Rebuilt from history.md and\n# bus-log.md by `ingest`; never committed. See packages/memory/src/README.md.\n*\n');
    }
  }

  const paths = {
    decisions: path.join(storeDir, 'decisions.json'),
    kills: path.join(storeDir, 'kill-log.json'),
    challenges: path.join(storeDir, 'challenges.json'),
    index: path.join(storeDir, 'index.json'),
    killMd: path.join(storeDir, 'kill-log.md'),
  };

  // --- Persistence ---

  function loadFile(filePath) {
    if (!existsSync(filePath)) return [];
    try {
      const data = JSON.parse(readFileSync(filePath, 'utf8'));
      return Array.isArray(data) ? data : [];
    } catch {
      return [];
    }
  }

  function saveFile(filePath, data) {
    writeFileSync(filePath, JSON.stringify(data, null, 2));
  }

  /** Old (pre-v2) entries load with unknown provenance, flagged `legacy: true`. */
  function loadAll() {
    return [
      ...loadFile(paths.decisions),
      ...loadFile(paths.kills),
      ...loadFile(paths.challenges),
    ].map(upgradeLegacyEntry);
  }

  function saveByType(entries) {
    const kills = entries.filter(e => e.type === 'kill');
    saveFile(paths.decisions, entries.filter(e => e.type === 'decision'));
    saveFile(paths.kills, kills);
    saveFile(paths.challenges, entries.filter(e => e.type === 'challenge'));
    if (kills.length > 0) writeFileSync(paths.killMd, renderKillLogMd(kills));
    updateIndex(entries);
  }

  function updateIndex(entries) {
    const projects = {};
    for (const e of entries) {
      if (!projects[e.project]) {
        projects[e.project] = { name: e.project, projectDir: e.projectDir || null, entryCount: 0, lastIngest: null };
      }
      projects[e.project].entryCount++;
      if (e.ingestedAt && (!projects[e.project].lastIngest || e.ingestedAt > projects[e.project].lastIngest)) {
        projects[e.project].lastIngest = e.ingestedAt;
      }
    }
    saveFile(paths.index, {
      version: '1.0',
      schemaVersion: SCHEMA_VERSION,
      derived: true,
      scope,
      updatedAt: new Date().toISOString(),
      totalEntries: entries.length,
      legacyEntries: entries.filter(e => e.legacy).length,
      projects,
    });
  }

  function renderKillLogMd(kills) {
    const lines = [
      '# Kill Log — Judgment Corpus',
      '',
      '> Auto-generated by @team-sdk/memory (derived index). Do not edit manually.',
      '',
      '| Date | Project | Class | Summary |',
      '|---|---|---|---|',
    ];
    for (const k of [...kills].sort((a, b) => (b.date || '').localeCompare(a.date || ''))) {
      lines.push(`| ${k.date || '-'} | ${k.project} | ${k.killClass || '-'} | ${(k.summary || '').slice(0, 80)} |`);
    }
    lines.push('');
    return lines.join('\n');
  }

  /** A company store only ingests its own company (cross-company → the commons). */
  function assertSameCompany(dir) {
    if (scope !== 'company') return;
    const rel = path.relative(projectDir, dir);
    if (rel.startsWith('..') || path.isAbsolute(rel)) {
      throw storeError('CROSS_COMPANY_INGEST',
        `memory: this store belongs to ${projectDir}; refusing to ingest ${dir}. Cross-company memory goes through the commons.`);
    }
  }

  // --- Public API ---

  return {
    /**
     * Ingest all entries from a project directory (defaults to the store's company).
     * Idempotent: ids are deterministic from source + content + anchor, so a re-ingest of
     * unchanged sources adds zero. A legacy entry whose v1 id matches is upgraded in place.
     * @returns {{ added: number, skipped: number, upgraded: number, total: number }}
     */
    ingest(dir) {
      const target = path.resolve(dir || projectDir || '');
      if (!dir && !projectDir) throw storeError('MEMORY_PROJECT_NOT_FOUND', 'memory: ingest needs a project directory');
      assertSameCompany(target);

      const newEntries = ingestProject(target);
      const existing = loadAll();
      const existingIds = new Set(existing.map(e => e.id));
      const legacyIndex = new Map();
      existing.forEach((e, i) => { if (e.legacy) legacyIndex.set(e.id, i); });

      let added = 0;
      let skipped = 0;
      let upgraded = 0;

      for (const entry of newEntries) {
        if (validateEntry(entry, { requireEnvelope: true }).length > 0 || existingIds.has(entry.id)) {
          skipped++;
          continue;
        }
        const legacyId = legacyEntryId(entry);
        if (legacyIndex.has(legacyId)) {
          existing[legacyIndex.get(legacyId)] = entry;
          legacyIndex.delete(legacyId);
          existingIds.add(entry.id);
          upgraded++;
          continue;
        }
        existing.push(entry);
        existingIds.add(entry.id);
        added++;
      }

      saveByType(existing);
      return { added, skipped, upgraded, total: existing.length };
    },

    /**
     * Ingest a single kill entry (called by sdk-kill). Date must come from the caller's source.
     */
    ingestKill(killEntry) {
      const entry = normalizeEntry({ type: 'kill', ...killEntry });
      const errors = validateEntry(entry, { requireEnvelope: true });
      if (errors.length > 0) return { added: 0, errors };

      const existing = loadAll();
      if (existing.some(e => e.id === entry.id)) return { added: 0, duplicate: true };

      existing.push(entry);
      saveByType(existing);
      return { added: 1 };
    },

    query(question, options = {}) {
      return queryEntries(loadAll(), question, options);
    },

    listProjects() {
      if (!existsSync(paths.index)) return [];
      try {
        const index = JSON.parse(readFileSync(paths.index, 'utf8'));
        return Object.values(index.projects || {});
      } catch {
        return [];
      }
    },

    getDecisions(filters) {
      return getDecisions(loadAll(), filters);
    },

    getKills(filters) {
      return getKills(loadAll(), filters);
    },

    getChallenges(filters) {
      return getChallenges(loadAll(), filters);
    },

    /** Corpus statistics, including how many entries carry unknown (legacy) provenance. */
    stats() {
      const all = loadAll();
      return { ...corpusStats(all), legacyEntries: all.filter(e => e.legacy).length };
    },

    getStoreDir() {
      return storeDir;
    },

    /** Where this store sits and whether it mixes companies. */
    getScope() {
      return { scope, projectDir, storeDir, leakRisk: scope === 'global' };
    },
  };
}

module.exports = {
  createMemoryStore,
  resolveStoreLocation,
  companyStoreDir,
  globalStoreDir,
  COMPANY_STORE_SUBDIR,
  GLOBAL_OPT_IN_ENV,
};
