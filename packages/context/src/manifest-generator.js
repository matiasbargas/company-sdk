'use strict';

/**
 * manifest-generator.js — Generate context-manifest.json from current-status.md.
 * Extracted from doc.js cmdManifest.
 */

const fs = require('fs');
const path = require('path');
const { CURRENT_MANIFEST_VERSION } = require('./schema');

/**
 * Generate a manifest object from a project directory.
 * Does NOT write to disk — returns the manifest object.
 *
 * @param {string} projectDir - Absolute path to the project directory
 * @returns {object} The manifest object
 */
function generateManifest(projectDir) {
  const statusFile = path.join(projectDir, 'current-status.md');
  const manifestFile = path.join(projectDir, 'context-manifest.json');

  // Read existing manifest to determine next manifestVersion
  let previousVersion = 0;
  if (fs.existsSync(manifestFile)) {
    try {
      const existing = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
      if (typeof existing.manifestVersion === 'number') {
        previousVersion = existing.manifestVersion;
      }
    } catch (_) {}
  }

  // Fallback: current-status.md missing
  if (!fs.existsSync(statusFile)) {
    return {
      schemaVersion: CURRENT_MANIFEST_VERSION,
      manifestVersion: previousVersion + 1,
      generatedAt: new Date(0).toISOString(),
      release: 'unknown',
      phase: 'unknown',
      activeMissions: [],
      waitingOn: [],
      openDecisions: [],
      lastUpdatedBy: 'unknown',
      nextAgentToActivate: { role: 'unknown', activationPrompt: '' },
      staleness: { currentStatusAge: -1, flag: 'stale' },
      _warning: 'current-status.md not found — minimal stale manifest',
    };
  }

  // Parse current-status.md
  const raw = fs.readFileSync(statusFile, 'utf8');
  const statusMtime = fs.statSync(statusFile).mtime;
  const ageHours = Math.round((Date.now() - statusMtime.getTime()) / 1000 / 60 / 60);
  const stalenessFlag = ageHours <= 24 ? 'fresh' : 'stale';
  const lines = raw.split('\n');

  // Release
  let release = 'unknown';
  const releaseMatch = raw.match(/\*\*Release:\*\*\s*(.+)/);
  if (releaseMatch) release = releaseMatch[1].trim();

  // Last updated by
  let lastUpdatedBy = 'unknown';
  const updatedByMatch = raw.match(/\*\*Updated by:\*\*\s*(.+)/);
  if (updatedByMatch) lastUpdatedBy = updatedByMatch[1].trim();

  // Phase
  let phase = 'unknown';
  const phaseMatch = raw.match(/Phase\s+(\d+|[A-Za-z]+)/);
  if (phaseMatch) phase = `Phase ${phaseMatch[1]}`;

  // Active Missions table
  const activeMissions = [];
  let inMissionsTable = false;
  let missionHeaderPassed = false;
  for (const line of lines) {
    if (/^##\s+Active Missions/i.test(line)) {
      inMissionsTable = true;
      missionHeaderPassed = false;
      continue;
    }
    if (inMissionsTable) {
      if (/^\|[-|\s:]+\|/.test(line)) { missionHeaderPassed = true; continue; }
      if (missionHeaderPassed && line.startsWith('|')) {
        const cells = line.split('|').map(c => c.trim()).filter(Boolean);
        if (cells.length >= 4) {
          activeMissions.push({
            name: cells[0],
            status: cells[3] || '',
            nextAction: cells[4] || '',
          });
        }
        continue;
      }
      if (missionHeaderPassed && !line.startsWith('|') && line.trim() !== '') {
        inMissionsTable = false;
      }
    }
  }

  // Waiting On
  const waitingOn = [];
  let inWaiting = false;
  for (const line of lines) {
    if (/^##\s+Waiting On/i.test(line)) { inWaiting = true; continue; }
    if (inWaiting) {
      if (/^##/.test(line)) { inWaiting = false; continue; }
      const itemMatch = line.match(/^-\s+\[[ x!]\]\s+(.+)/);
      if (itemMatch) {
        const full = itemMatch[1];
        const blocksMatch = full.match(/\|\s*[Bb]locks?:\s*(.+)/);
        const item = full.replace(/\|.*$/, '').trim();
        const blocks = blocksMatch ? blocksMatch[1].trim() : '';
        waitingOn.push({ item, blocks });
      }
    }
  }

  // Open Decisions
  const openDecisions = [];
  let inDecisions = false;
  for (const line of lines) {
    if (/^##\s+Open Decisions/i.test(line)) { inDecisions = true; continue; }
    if (inDecisions) {
      if (/^##/.test(line)) { inDecisions = false; continue; }
      const itemMatch = line.match(/^-\s+(.+)/);
      if (itemMatch) {
        const full = itemMatch[1];
        const needsMatch = full.match(/\|\s*[Nn]eeds?:\s*([^|]+)/);
        const byMatch = full.match(/\|\s*[Bb]y:\s*([^|]+)/);
        const decision = full.replace(/\|.*$/, '').trim();
        const neededBy = needsMatch ? needsMatch[1].trim() : (byMatch ? byMatch[1].trim() : '');
        openDecisions.push({ decision, neededBy });
      }
    }
  }

  // Next Agent To Activate
  let nextAgentRole = 'unknown';
  let nextAgentPrompt = '';
  let inNextAgent = false;
  for (const line of lines) {
    if (/^##\s+Next Agent To Activate/i.test(line)) { inNextAgent = true; continue; }
    if (inNextAgent) {
      if (/^##/.test(line)) { inNextAgent = false; continue; }
      if (nextAgentRole === 'unknown') {
        const boldMatch = line.match(/\*\*([^*]+)\*\*/);
        if (boldMatch) {
          nextAgentRole = boldMatch[1].trim();
          nextAgentPrompt = line.trim();
        }
      }
    }
  }

  return {
    schemaVersion: CURRENT_MANIFEST_VERSION,
    manifestVersion: previousVersion + 1,
    generatedAt: statusMtime.toISOString(),
    release,
    phase,
    activeMissions,
    waitingOn,
    openDecisions,
    lastUpdatedBy,
    nextAgentToActivate: {
      role: nextAgentRole,
      activationPrompt: nextAgentPrompt,
    },
    staleness: {
      currentStatusAge: ageHours,
      flag: stalenessFlag,
    },
  };
}

module.exports = { generateManifest };
