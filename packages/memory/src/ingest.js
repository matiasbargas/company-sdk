'use strict';

/**
 * ingest.js — Parse history.md and bus-log.md to extract memory entries.
 *
 * Reads project files and produces structured entries for the memory store.
 * Uses @team-sdk/context markdown utilities for section parsing.
 */

const { readFileSync, existsSync } = require('fs');
const path = require('path');
const { findSectionIndex, getSectionLevel, findSectionEnd } = require('../../context/src/markdown');
const { normalizeEntry } = require('./schema');

/**
 * Extract the project name from a project directory.
 */
function projectName(projectDir) {
  const resolved = path.resolve(projectDir);
  return path.basename(resolved);
}

/**
 * Parse a history.md file into decision entries.
 *
 * History entries follow the protocol.md Section 10 format:
 *   ## [Title] — Description
 *   **Date:** YYYY-MM-DD
 *   **Made by:** Role (Name)
 *   **Release:** vYYYY.QN.N
 *   **Status:** ...
 *   **What happened:** ...
 *
 * Key decisions are in bulleted lists or in rationale blocks.
 */
function parseHistory(content, project) {
  const lines = content.split('\n');
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Find H2 entries (## Title)
    if (!line.startsWith('## ')) continue;

    const titleMatch = line.match(/^##\s+(?:\[([^\]]*)\]\s*—?\s*)?(.+)/);
    if (!titleMatch) continue;

    const tag = titleMatch[1] || '';
    const title = titleMatch[2].trim();
    const end = findSectionEnd(lines, i);
    const sectionLines = lines.slice(i + 1, end);
    const sectionText = sectionLines.join('\n');

    // Extract structured fields
    const date = extractField(sectionText, 'Date') || '1970-01-01';
    const madeBy = extractField(sectionText, 'Made by');
    const release = extractField(sectionText, 'Release');
    const status = extractField(sectionText, 'Status');
    const reversible = extractReversible(sectionText);
    const rationale = extractBlock(sectionText, 'Rationale') ||
                      extractBlock(sectionText, 'What happened');

    // Skip placeholder entries
    if (title.includes('Future release entries')) continue;

    // Determine entry type
    let type = 'decision';
    const tags = [];

    if (tag) tags.push(tag);
    if (/kill/i.test(title) || /cancelled/i.test(title)) {
      // Check if it's a kill
      const killClassMatch = sectionText.match(/FRAMING_WRONG|SCOPE_OBSOLETE|PRIORITY_SHIFT|EXECUTION_STALLED/);
      if (killClassMatch) {
        type = 'kill';
      }
    }

    // Extract challenges from disagreement sections
    if (/challenge|dissent|disagree/i.test(title)) {
      type = 'challenge';
    }

    // Extract domain tags from content
    const affects = inferAffectedDomains(sectionText);

    const entry = normalizeEntry({
      type,
      project,
      projectDir: null, // set by caller
      date,
      release: release || '',
      madeBy: madeBy || 'Unknown',
      summary: title,
      rationale: rationale ? rationale.slice(0, 500) : '',
      reversible,
      affects,
      tags,
      status: status || '',
    });

    // Add kill-specific fields
    if (type === 'kill') {
      const killClassMatch = sectionText.match(/FRAMING_WRONG|SCOPE_OBSOLETE|PRIORITY_SHIFT|EXECUTION_STALLED/);
      entry.killClass = killClassMatch ? killClassMatch[0] : 'PRIORITY_SHIFT';
      const assumptionMatch = sectionText.match(/\*\*Assumption[^:]*:\*\*\s*(.+)/i);
      entry.assumption = assumptionMatch ? assumptionMatch[1].trim() : '';
    }

    // Add challenge-specific fields
    if (type === 'challenge') {
      entry.challenger = madeBy || 'Unknown';
      entry.outcome = /accepted|approved/i.test(status) ? 'accepted' : 'overridden';
    }

    entries.push(entry);
  }

  return entries;
}

/**
 * Parse bus-log.md for kill entries and inter-agent decisions.
 */
function parseBusLog(content, project) {
  const lines = content.split('\n');
  const entries = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Look for Bus message blocks (FROM: ...)
    if (!line.startsWith('FROM:') && !line.match(/^\*\*FROM:\*\*/)) continue;

    const end = findNextBusMessage(lines, i + 1);
    const block = lines.slice(i, end).join('\n');

    // Extract Bus fields
    const from = extractBusField(block, 'FROM');
    const to = extractBusField(block, 'TO');
    const priority = extractBusField(block, 'PRIORITY');
    const message = extractBusField(block, 'MESSAGE') || '';
    const solutionClass = extractBusField(block, 'SOLUTION_CLASS');
    const tagField = extractBusField(block, 'TAG');

    // Only ingest meaningful Bus messages (decisions, kills, challenges)
    if (/POD KILLED/i.test(message) || /KILL/i.test(tagField || '')) {
      const killClassMatch = message.match(/FRAMING_WRONG|SCOPE_OBSOLETE|PRIORITY_SHIFT|EXECUTION_STALLED/);
      const entry = normalizeEntry({
        type: 'kill',
        project,
        date: new Date().toISOString().slice(0, 10),
        madeBy: from || 'Unknown',
        summary: message.slice(0, 200),
        killClass: killClassMatch ? killClassMatch[0] : 'PRIORITY_SHIFT',
        assumption: '',
        tags: tagField ? tagField.split(',').map(t => t.trim()) : [],
        affects: [],
      });
      entries.push(entry);
    }

    if (priority === 'DECISION NEEDED' || priority === 'BLOCKER') {
      const entry = normalizeEntry({
        type: 'decision',
        project,
        date: new Date().toISOString().slice(0, 10),
        madeBy: from || 'Unknown',
        summary: message.slice(0, 200),
        rationale: '',
        tags: tagField ? tagField.split(',').map(t => t.trim()) : [],
        affects: [],
      });
      entries.push(entry);
    }
  }

  return entries;
}

/**
 * Ingest all entries from a project directory.
 */
function ingestProject(projectDir) {
  const resolved = path.resolve(projectDir);
  const project = projectName(resolved);
  const entries = [];

  // Try history.md in the project dir itself, or as a subdirectory named 'project'
  const historyPaths = [
    path.join(resolved, 'history.md'),
    path.join(resolved, 'project', 'history.md'),
  ];
  for (const hp of historyPaths) {
    if (existsSync(hp)) {
      const content = readFileSync(hp, 'utf8');
      const parsed = parseHistory(content, project);
      parsed.forEach(e => { e.projectDir = resolved; });
      entries.push(...parsed);
      break;
    }
  }

  // Try bus-log.md
  const busLogPaths = [
    path.join(resolved, 'bus-log.md'),
    path.join(resolved, 'project', 'bus-log.md'),
  ];
  for (const bp of busLogPaths) {
    if (existsSync(bp)) {
      const content = readFileSync(bp, 'utf8');
      const parsed = parseBusLog(content, project);
      parsed.forEach(e => { e.projectDir = resolved; });
      entries.push(...parsed);
      break;
    }
  }

  return entries;
}

// --- Helpers ---

function extractField(text, fieldName) {
  const re = new RegExp(`\\*\\*${fieldName}:\\*\\*\\s*(.+)`, 'i');
  const match = text.match(re);
  return match ? match[1].trim() : null;
}

function extractReversible(text) {
  const match = text.match(/\*\*Reversible:\*\*\s*(YES|NO|yes|no)/i);
  if (!match) return undefined;
  return match[1].toUpperCase() === 'YES';
}

function extractBlock(text, blockName) {
  const re = new RegExp(`\\*\\*${blockName}[^:]*:\\*\\*\\s*([\\s\\S]*?)(?=\\n\\*\\*[A-Z]|$)`, 'i');
  const match = text.match(re);
  return match ? match[1].trim() : null;
}

function extractBusField(block, field) {
  const re = new RegExp(`(?:^|\\n)\\*?\\*?${field}:\\*?\\*?\\s*(.+)`, 'i');
  const match = block.match(re);
  return match ? match[1].trim() : null;
}

function findNextBusMessage(lines, startIdx) {
  for (let i = startIdx; i < lines.length; i++) {
    if (lines[i].startsWith('FROM:') || lines[i].match(/^\*\*FROM:\*\*/)) {
      return i;
    }
    // Empty line after a block could be separator
    if (lines[i].trim() === '' && i > startIdx + 2) {
      // Check if next non-empty line starts a new Bus message
      for (let j = i + 1; j < lines.length; j++) {
        if (lines[j].trim() === '') continue;
        if (lines[j].startsWith('FROM:') || lines[j].match(/^---/) || lines[j].startsWith('#')) {
          return i;
        }
        break;
      }
    }
  }
  return lines.length;
}

function inferAffectedDomains(text) {
  const domains = [];
  const lower = text.toLowerCase();
  const map = {
    engineering: ['architecture', 'technical', 'cto', 'engineer', 'infrastructure', 'package', 'monorepo'],
    legal: ['legal', 'clo', 'compliance', 'regulatory', 'license', 'gdpr'],
    security: ['security', 'ciso', 'threat', 'vulnerability', 'auth'],
    product: ['product', 'pm', 'mission', 'scope', 'feature'],
    strategy: ['strategy', 'ceo', 'vision', 'pivot', 'direction'],
    design: ['design', 'ux', 'ui', 'interface'],
    finance: ['budget', 'cfo', 'financial', 'cost', 'pricing'],
    operations: ['operations', 'coo', 'vendor', 'deploy'],
    people: ['hiring', 'chro', 'team', 'culture'],
  };
  for (const [domain, keywords] of Object.entries(map)) {
    if (keywords.some(k => lower.includes(k))) {
      domains.push(domain);
    }
  }
  return domains;
}

module.exports = {
  ingestProject,
  parseHistory,
  parseBusLog,
  projectName,
};
