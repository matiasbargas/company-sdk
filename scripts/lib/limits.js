'use strict';

/**
 * limits.js — tunable amounts and limits, read from `.sdkrc` → "limits" (protocol.md §16.1).
 *
 * Default is no cap: `null` means "unlimited — stop on the rule's own stop condition".
 * A number caps it. Thresholds that trigger an escalation (not a cap) have numeric defaults.
 *
 * Prose in role files and commands references these keys instead of hardcoding numbers,
 * so a project tunes them in one place.
 */

const fs = require('fs');
const path = require('path');

const DEFAULT_LIMITS = {
  // Peer agents one consultation may spawn (§16). null = every peer whose input would change the answer.
  peerSpawns: null,
  // Coordinator <-> CEO discovery rounds in Phase 0. null = until the five Phase 0 questions are answered.
  discoveryRounds: null,
  // Project-wide ceiling on a §32 loop's declared budget (turns). null = the loop's own declared budget.
  loopIterations: null,
  // §31.6: Guardian cycles without GRADUATE before the CEO escalation fires. Escalation trigger, not a cap.
  guardianCyclesBeforeEscalation: 3,
  // §34: days a surface may sit in under-verification / reconciling before sdk-health flags it.
  surfaceStaleDays: 3,
};

const NULLABLE = new Set(['peerSpawns', 'discoveryRounds', 'loopIterations']);

/** Returns a list of human-readable problems with a limits object (empty = valid). */
function validateLimits(limits) {
  const problems = [];
  if (limits === undefined) return problems;
  if (limits === null || typeof limits !== 'object' || Array.isArray(limits)) {
    return ['"limits" must be an object'];
  }
  for (const [key, value] of Object.entries(limits)) {
    if (!(key in DEFAULT_LIMITS)) {
      problems.push(`unknown limit "${key}" (known: ${Object.keys(DEFAULT_LIMITS).join(', ')})`);
      continue;
    }
    if (value === null && NULLABLE.has(key)) continue;
    if (!Number.isInteger(value) || value < 1) {
      problems.push(`limits.${key} must be a positive integer${NULLABLE.has(key) ? ' or null (no cap)' : ''}, got ${JSON.stringify(value)}`);
    }
  }
  return problems;
}

/** Effective limits for a project: defaults overlaid with valid `.sdkrc` values. */
function readLimits(projectDir) {
  const sdkrcPath = path.join(projectDir, '.sdkrc');
  let sdkrc = {};
  try { sdkrc = JSON.parse(fs.readFileSync(sdkrcPath, 'utf8')); } catch (_) { /* defaults */ }
  const configured = (sdkrc && typeof sdkrc.limits === 'object' && sdkrc.limits) || {};
  const out = { ...DEFAULT_LIMITS };
  // Back-compat: surfaceStaleDays used to live at the top level of .sdkrc.
  if (Number.isInteger(sdkrc.surfaceStaleDays) && sdkrc.surfaceStaleDays > 0) out.surfaceStaleDays = sdkrc.surfaceStaleDays;
  for (const key of Object.keys(DEFAULT_LIMITS)) {
    if (!(key in configured)) continue;
    if (validateLimits({ [key]: configured[key] }).length === 0) out[key] = configured[key];
  }
  return out;
}

module.exports = { DEFAULT_LIMITS, validateLimits, readLimits };
