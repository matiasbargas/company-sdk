'use strict';

/**
 * query.js — Search and filter the memory corpus.
 *
 * Keyword search across entries, plus structured filters by project,
 * role, date range, type, domain, reversibility, and kill class.
 */

/**
 * Search entries by keyword (matches against summary, rationale, tags, madeBy).
 * @param {object[]} entries - All entries in the store
 * @param {string} question - Search query
 * @param {object} [options] - Optional filters
 * @returns {object[]} Matching entries, sorted by relevance then date
 */
function queryEntries(entries, question, options = {}) {
  const terms = question.toLowerCase().split(/\s+/).filter(Boolean);
  if (terms.length === 0 && !hasFilters(options)) {
    return options.limit ? entries.slice(0, options.limit) : entries;
  }

  let results = entries;

  // Apply structured filters first
  results = applyFilters(results, options);

  // Then keyword search
  if (terms.length > 0) {
    results = results.map(entry => {
      const score = scoreEntry(entry, terms);
      return { entry, score };
    })
      .filter(r => r.score > 0)
      .sort((a, b) => b.score - a.score || dateCmp(b.entry.date, a.entry.date))
      .map(r => r.entry);
  }

  // Limit
  if (options.limit) {
    results = results.slice(0, options.limit);
  }

  return results;
}

/**
 * Get entries filtered by structured criteria (no keyword search).
 */
function filterEntries(entries, filters) {
  return applyFilters(entries, filters);
}

/**
 * Get decisions only.
 */
function getDecisions(entries, filters = {}) {
  return applyFilters(entries.filter(e => e.type === 'decision'), filters);
}

/**
 * Get kills only.
 */
function getKills(entries, filters = {}) {
  return applyFilters(entries.filter(e => e.type === 'kill'), filters);
}

/**
 * Get challenges only.
 */
function getChallenges(entries, filters = {}) {
  return applyFilters(entries.filter(e => e.type === 'challenge'), filters);
}

/**
 * Corpus statistics.
 */
function corpusStats(entries) {
  const projects = new Set(entries.map(e => e.project));
  const types = {};
  for (const e of entries) {
    types[e.type] = (types[e.type] || 0) + 1;
  }
  const dates = entries.map(e => e.date).filter(Boolean).sort();

  return {
    totalEntries: entries.length,
    projects: [...projects],
    projectCount: projects.size,
    byType: types,
    dateRange: dates.length > 0
      ? { earliest: dates[0], latest: dates[dates.length - 1] }
      : null,
  };
}

// --- Internals ---

function scoreEntry(entry, terms) {
  let score = 0;
  const searchable = [
    entry.summary || '',
    entry.rationale || '',
    entry.madeBy || '',
    ...(entry.tags || []),
    ...(entry.affects || []),
    entry.project || '',
    entry.assumption || '',
  ].join(' ').toLowerCase();

  for (const term of terms) {
    if (searchable.includes(term)) {
      score++;
      // Boost for summary match
      if ((entry.summary || '').toLowerCase().includes(term)) score++;
    }
  }
  return score;
}

function applyFilters(entries, filters) {
  let results = entries;

  if (filters.project) {
    const p = filters.project.toLowerCase();
    results = results.filter(e => (e.project || '').toLowerCase() === p);
  }
  if (filters.type) {
    results = results.filter(e => e.type === filters.type);
  }
  if (filters.madeBy) {
    const mb = filters.madeBy.toLowerCase();
    results = results.filter(e => (e.madeBy || '').toLowerCase().includes(mb));
  }
  if (filters.domain) {
    const d = filters.domain.toLowerCase();
    results = results.filter(e => (e.affects || []).some(a => a.toLowerCase() === d));
  }
  if (filters.reversible !== undefined) {
    results = results.filter(e => e.reversible === filters.reversible);
  }
  if (filters.killClass) {
    results = results.filter(e => e.killClass === filters.killClass);
  }
  if (filters.dateFrom) {
    results = results.filter(e => e.date >= filters.dateFrom);
  }
  if (filters.dateTo) {
    results = results.filter(e => e.date <= filters.dateTo);
  }
  if (filters.release) {
    results = results.filter(e => e.release === filters.release);
  }

  return results;
}

function hasFilters(options) {
  return ['project', 'type', 'madeBy', 'domain', 'reversible', 'killClass', 'dateFrom', 'dateTo', 'release']
    .some(k => options[k] !== undefined);
}

function dateCmp(a, b) {
  if (a < b) return -1;
  if (a > b) return 1;
  return 0;
}

module.exports = {
  queryEntries,
  filterEntries,
  getDecisions,
  getKills,
  getChallenges,
  corpusStats,
};
